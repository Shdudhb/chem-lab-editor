import test from 'node:test';
import assert from 'node:assert/strict';
import { findPointSnapCandidate, getSnapPoints } from '../src/canvas/snap-system.js';
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

test('local scene storage saves and loads through an adapter', async () => {
  const storage = createLocalSceneStorage({ storage: fakeStorage(), key: 'test-scene' });
  const scene = { objects: [], selectedIds: [], view: { zoom: 1, panX: 0, panY: 0 } };
  await storage.save(scene);
  assert.deepEqual(await storage.load(), scene);
});
