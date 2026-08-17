import test from 'node:test';
import assert from 'node:assert/strict';
import { findPointSnapCandidate, getSnapPoints } from '../src/canvas/snap-system.js';
import { equipmentCatalog, getEquipmentById } from '../src/equipment/equipment-catalog.js';
import { apparatusModelIds } from '../src/equipment/equipment-svg-models.js';
import { getLiquidBandGeometryForObject, getLiquidLayers } from '../src/canvas/scene-store.js';
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
  assert.match(filter.svg, /M70 34h31/);
  assert.match(filter.svg, /M70 43h31/);
  assert.doesNotMatch(filter.svg, /M44 33h32|M35 75h45|M78 58h31/);

  const beaker = getEquipmentById('beaker');
  assert.match(beaker.svg, /M23 14v82a11 11 0 0 0 11 11h52/);
  assert.match(getEquipmentById('erlenmeyer-flask').svg, /M42 7c5 2 7 5 7 10v30L25 97/);
  assert.match(getEquipmentById('round-bottom-flask').svg, /M42 6c5 2 7 5 7 10v22C29 42/);
  assert.equal(hose.equipmentType, 'hose');

  const filterPoints = getSnapPoints({ sourceId: 'filter-flask', x: 0, y: 0, width: 120, height: 120 });
  assert.deepEqual(filterPoints.map((point) => point.role), ['top', 'right', 'bottom']);
  assert.ok(Math.abs(filterPoints[1].x - 100.8) < 0.001);
  assert.ok(Math.abs(filterPoints[1].y - 38.4) < 0.001);
});

test('catalog equipment has unique models for visually different apparatus', () => {
  const normalizedModels = equipmentCatalog.map((item) => item.svg.replace(/\s+/g, ' ').trim());
  assert.equal(new Set(normalizedModels).size, equipmentCatalog.length);
  assert.notEqual(getEquipmentById('wide-mouth-bottle').svg, getEquipmentById('gas-jar').svg);
  assert.notEqual(getEquipmentById('wash-bottle').svg, getEquipmentById('water-tank').svg);
  assert.match(getEquipmentById('wash-bottle').svg, /M54 27V15h18/);
  assert.match(getEquipmentById('condenser').svg, /M55 9v102M65 9v102/);
  assert.match(getEquipmentById('aspirator').svg, /M51 14h18v34/);
});

test('all 52 catalog apparatus use the shared Chemix-style SVG convention', () => {
  assert.equal(equipmentCatalog.length, 52);
  assert.equal(apparatusModelIds.length, 52);
  assert.deepEqual(new Set(apparatusModelIds), new Set(equipmentCatalog.map((item) => item.id)));

  equipmentCatalog.forEach((item) => {
    assert.match(item.svg, /viewBox="0 0 120 120"/);
    assert.match(item.svg, /stroke="#3f4143"/);
    assert.match(item.svg, /stroke-width="4"/);
    assert.match(item.svg, /stroke-linecap="round"/);
    assert.match(item.svg, /stroke-linejoin="round"/);
  });

  assert.doesNotMatch(getEquipmentById('water-tank').svg, /#78b9c8/);
  assert.doesNotMatch(getEquipmentById('pneumatic-trough').svg, /#78b9c8/);
});

test('catalog geometry explicitly controls liquid and snap capabilities', () => {
  equipmentCatalog.forEach((item) => {
    assert.equal(Array.isArray(item.snapPoints), true);
    assert.equal(item.supportsLiquid, Boolean(item.liquidVessel));
  });
  assert.equal(getEquipmentById('beaker').supportsLiquid, true);
  assert.equal(getEquipmentById('retort-stand').supportsLiquid, false);
  assert.deepEqual(getSnapPoints({
    sourceId: 'electronic-balance', x: 0, y: 0, width: 120, height: 120,
  }), []);
});

test('catalog apparatus start empty and liquid layers stay within 100 percent', () => {
  assert.ok(equipmentCatalog.every((item) => !item.svg.includes('#b7dfe7')));
  assert.equal(getLiquidLayers(undefined)[0].level, 0);
  assert.equal(getLiquidLayers(undefined)[0].opacity, 0.72);
  assert.equal(getLiquidLayers({ layers: [{ level: 20 }] })[0].opacity, 0.72);
  assert.equal(getLiquidLayers({ layers: [{ level: 20, visible: false }] })[0].visible, false);

  const layers = getLiquidLayers({ layers: [
    { level: 70, color: '#67aee8', opacity: 0.72 },
    { level: 60, color: '#f2a65a', opacity: 0.72 },
  ] });
  assert.deepEqual(layers.map((layer) => layer.level), [70, 30]);
});

test('liquid geometry follows each vessel profile and preserves hidden layer space', () => {
  const object = { sourceId: 'erlenmeyer-flask' };
  const first = getLiquidBandGeometryForObject(object, 0, 50);
  const second = getLiquidBandGeometryForObject(object, 50, 25);

  assert.ok(first);
  assert.ok(second);
  assert.ok(first.leftTop > first.leftBottom);
  assert.ok(second.bandTop < first.bandTop);
  assert.ok(second.bandBottom <= first.bandTop);

  const roundFull = getLiquidBandGeometryForObject({ sourceId: 'round-bottom-flask' }, 0, 100);
  const roundHalf = getLiquidBandGeometryForObject({ sourceId: 'round-bottom-flask' }, 0, 50);
  assert.equal(roundFull.middle, 62);
  assert.equal(roundFull.leftMiddle, 12);
  assert.ok(roundHalf.rightTop - roundHalf.leftTop > 60);
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
    supportsLiquid: true, sourceId: 'beaker',
    svgMarkup: '<svg width="100%" height="100%"></svg>',
    liquid: { layers: [
      { level: 50, color: '#67aee8', opacity: 0.7 },
      { level: 25, color: '#ff0000', opacity: 0.8 },
    ] },
  }]);
  assert.equal((svg.match(/fill="#67aee8"/g) ?? []).length, 1);
  assert.equal((svg.match(/fill="#ff0000"/g) ?? []).length, 1);
  assert.match(svg, /clipPath id="liquid-object-1"/);
  assert.match(svg, /clip-path="url\(#liquid-object-1\)"/);
});

test('scene JSON round-trip preserves layers and groups', () => {
  const scene = {
    objects: [
      {
        id: 'one', type: 'svg', x: 0, y: 0, width: 120, height: 120, rotation: 0,
        svgMarkup: '<svg width="100%" height="100%"></svg>', groupId: 'group-1',
        groupCollapsed: true, liquid: { layers: [{ level: 30, color: '#67aee8', opacity: 0.5 }] },
      },
      {
        id: 'two', type: 'hose', x: 0, y: 0, width: 10, height: 10, rotation: 0,
        groupId: 'group-1', points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
        color: '#8b5e3c', strokeWidth: 8,
      },
    ],
    selectedIds: ['one', 'two'],
    view: { zoom: 1.2, panX: 20, panY: 30 },
  };
  assert.deepEqual(parseScene(serializeScene(scene)), scene);
});

test('scene parser rejects malformed scene objects before rendering', () => {
  const malformed = JSON.stringify({
    format: 'chem-lab-editor-scene',
    version: 1,
    scene: { objects: [{ id: 'bad', type: 'hose' }], selectedIds: [] },
  });
  assert.throws(() => parseScene(malformed), /不是 Chem Lab Editor/);
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

test('equipment user store discards malformed or unsafe custom equipment', () => {
  const storage = fakeStorage();
  storage.setItem('chem-lab-editor.equipment-user-state', JSON.stringify({
    favorites: ['beaker', null, 'beaker'],
    recent: ['beaker', 42],
    custom: [
      { id: 'missing-name', svg: '<svg></svg>' },
      { id: 'unsafe', name: 'Unsafe', description: 'x', svg: '<svg><script/></svg>' },
      { id: 'safe', name: 'Safe', description: 'ok', svg: '<svg></svg>' },
    ],
  }));
  const store = createEquipmentUserStore(storage, {
    sanitizeSvg: (svg) => {
      if (svg.includes('<script')) throw new Error('unsafe');
      return svg;
    },
  });
  assert.deepEqual(store.favorites, ['beaker']);
  assert.deepEqual(store.recent, ['beaker']);
  assert.deepEqual(store.custom.map((item) => item.id), ['safe']);
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
