import test from 'node:test';
import assert from 'node:assert/strict';
import { findPointSnapCandidate, getSnapPoints } from '../src/canvas/snap-system.js';
import { equipmentCatalog, getEquipmentById } from '../src/equipment/equipment-catalog.js';
import { getLiquidLayers } from '../src/canvas/scene-store.js';
import { buildSceneSvg } from '../src/export/exporter.js';
import { createEquipmentUserStore } from '../src/equipment/equipment-user-store.js';
import { createLocalSceneStorage, parseScene, serializeScene } from '../src/storage/scene-storage.js';

const fakeStorage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
};

test('snap system finds equipment-specific connection points', () => {
  const beaker = { sourceId: 'beaker', x: 100, y: 100, width: 120, height: 100 };
  const points = getSnapPoints(beaker);
  const candidate = findPointSnapCandidate({ x: points[0].x + 3, y: points[0].y + 3 }, [beaker]);
  assert.equal(candidate?.targetPoint.role, 'top');
});

test('flask catalog models are distinct and filter flask exposes a side port', () => {
  const flat = getEquipmentById('flat-bottom-flask');
  const volumetric = getEquipmentById('volumetric-flask');
  const filter = getEquipmentById('filter-flask');
  const hose = getEquipmentById('rubber-tubing');

  assert.notEqual(flat.svg, volumetric.svg);
  assert.notEqual(volumetric.svg, filter.svg);
  assert.match(filter.svg, /M78 58h31/);
  assert.equal(hose.equipmentType, 'hose');

  const filterPoints = getSnapPoints({ sourceId: 'filter-flask', x: 0, y: 0, width: 120, height: 120 });
  assert.deepEqual(filterPoints.map((point) => point.role), ['top', 'right', 'bottom']);
  assert.ok(Math.abs(filterPoints[1].x - 109.8) < 0.001);
  assert.ok(Math.abs(filterPoints[1].y - 64.8) < 0.001);
});

test('catalog apparatus start empty and liquid layers stay within 100 percent', () => {
  assert.ok(equipmentCatalog.every((item) => !item.svg.includes('#b7dfe7')));
  assert.equal(getLiquidLayers(undefined)[0].level, 0);
  assert.equal(getLiquidLayers(undefined)[0].opacity, 0.72);

  const layers = getLiquidLayers({ layers: [
    { level: 70, color: '#67aee8', opacity: 0.72 },
    { level: 60, color: '#f2a65a', opacity: 0.72 },
  ] });
  assert.deepEqual(layers.map((layer) => layer.level), [70, 30]);
});

test('hose export keeps Bezier geometry and style', () => {
  const svg = buildSceneSvg([{
    type: 'hose', visible: true, x: 0, y: 0, width: 120, height: 80,
    points: [{ x: 0, y: 0 }, { x: 40, y: 60 }, { x: 120, y: 20 }],
    color: '#8b5e3c', strokeWidth: 9,
  }]);
  assert.match(svg, /<path[^>]+stroke="#8b5e3c"/);
  assert.match(svg, /stroke-width="9"/);
  assert.match(svg, / C /);
});

test('layered liquid export preserves each layer', () => {
  const svg = buildSceneSvg([{
    type: 'svg', visible: true, x: 0, y: 0, width: 100, height: 100, rotation: 0,
    svgMarkup: '<svg width="100%" height="100%"></svg>',
    liquid: { layers: [
      { level: 50, color: '#67aee8', opacity: 0.7 },
      { level: 25, color: '#ff0000', opacity: 0.8 },
    ] },
  }]);
  assert.equal((svg.match(/fill="#67aee8"/g) ?? []).length, 1);
  assert.equal((svg.match(/fill="#ff0000"/g) ?? []).length, 1);
  assert.match(svg, /height="25"/);
});

test('scene JSON round-trip preserves layers and groups', () => {
  const scene = {
    objects: [
      { id: 'one', type: 'svg', groupId: 'group-1', groupCollapsed: true, liquid: { layers: [{ level: 30, color: '#67aee8', opacity: 0.5 }] } },
      { id: 'two', type: 'hose', groupId: 'group-1', points: [{ x: 0, y: 0 }, { x: 10, y: 10 }] },
    ],
    selectedIds: ['one', 'two'],
    view: { zoom: 1.2, panX: 20, panY: 30 },
  };
  assert.deepEqual(parseScene(serializeScene(scene)), scene);
});

test('equipment user store persists favorites, recent items, and custom equipment', () => {
  const storage = fakeStorage();
  const first = createEquipmentUserStore(storage);
  first.toggleFavorite('beaker');
  first.addRecent('beaker');
  first.addCustom({ id: 'custom-1', name: '自訂', description: '測試', svg: '<svg></svg>' });

  const second = createEquipmentUserStore(storage);
  assert.equal(second.isFavorite('beaker'), true);
  assert.deepEqual(second.recent, ['beaker']);
  assert.equal(second.custom[0].id, 'custom-1');
});

test('annotation export includes freehand path and open arrow marker', () => {
  const svg = buildSceneSvg([
    {
      type: 'annotation', annotationType: 'freehand', visible: true, x: 0, y: 0, width: 50, height: 40,
      points: [{ x: 0, y: 0 }, { x: 20, y: 30 }, { x: 50, y: 10 }], stroke: '#0088ff', strokeWidth: 4,
    },
    {
      type: 'annotation', annotationType: 'arrow', visible: true, x: 0, y: 50, width: 50, height: 40,
      start: { x: 0, y: 50 }, end: { x: 50, y: 90 }, stroke: '#ff0000', strokeWidth: 3, arrowStyle: 'open',
    },
  ]);
  assert.match(svg, /stroke="#0088ff"/);
  assert.match(svg, /export-arrow-open/);
});

test('export keeps rotation for annotations and hoses and expands the viewBox', () => {
  const svg = buildSceneSvg([
    {
      type: 'annotation', annotationType: 'arrow', visible: true, x: 0, y: 0, width: 200, height: 20,
      rotation: 45, start: { x: 0, y: 10 }, end: { x: 200, y: 10 }, stroke: '#0088ff', strokeWidth: 4,
    },
    {
      type: 'hose', visible: true, x: 250, y: 0, width: 100, height: 20, rotation: 90,
      points: [{ x: 250, y: 10 }, { x: 350, y: 10 }], color: '#8b5e3c', strokeWidth: 8,
    },
  ]);
  assert.match(svg, /transform="rotate\(45 100 10\)"/);
  assert.match(svg, /transform="rotate\(90 300 10\)"/);
  assert.match(svg, /viewBox="-?[\d.]+ -9[\d.]+ [\d.]+ [\d.]+"/);
});

test('local scene storage saves and loads through an adapter', async () => {
  const storage = createLocalSceneStorage({ storage: fakeStorage(), key: 'test-scene' });
  const scene = { objects: [], selectedIds: [], view: { zoom: 1, panX: 0, panY: 0 } };
  await storage.save(scene);
  assert.deepEqual(await storage.load(), scene);
});
