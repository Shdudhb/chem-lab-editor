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
  assert.match(flat.svg, /M42 6c5 2 7 5 7 10v23C28 43 13 56 13 76c0 15 10 28 27 36h40/);
  assert.doesNotMatch(flat.svg, /M48 16c4 2 6 5 6 10v24L25 90/);
  assert.match(volumetric.svg, /M43 5c5 2 7 5 7 10v44C44 68 36 81 34 94/);
  assert.match(volumetric.svg, /M51 38h18/);
  assert.doesNotMatch(volumetric.svg, /M50 14c4 2 6 5 6 10v29/);
  assert.match(filter.svg, /M42 7c5 2 7 5 7 10v30L25 97/);
  assert.match(filter.svg, /M71 29h32/);
  assert.match(filter.svg, /M71 41h32/);
  assert.doesNotMatch(filter.svg, /M44 33h32|M35 75h45|M78 58h31/);

  const beaker = getEquipmentById('beaker');
  assert.match(beaker.svg, /M23 14v82a11 11 0 0 0 11 11h52/);
  assert.match(getEquipmentById('erlenmeyer-flask').svg, /M42 7c5 2 7 5 7 10v30L25 97/);
  assert.match(getEquipmentById('round-bottom-flask').svg, /M42 6c5 2 7 5 7 10v22C29 42/);
  assert.match(getEquipmentById('test-tube').svg, /M49 5v98a11 11 0 0 0 22 0V5/);
  assert.match(getEquipmentById('funnel').svg, /M15 14 54 57v51M105 14 66 57v51/);
  assert.doesNotMatch(getEquipmentById('funnel').svg, /M15 14h90|M15 14H105/);
  assert.match(getEquipmentById('graduated-cylinder').svg, /M44 8c4 2 6 5 6 10v78l-12 12h44L70 96V18/);
  assert.doesNotMatch(getEquipmentById('graduated-cylinder').svg, /M44 8h32|M41 15h38/);
  const testTubeRack = getEquipmentById('test-tube-rack');
  assert.match(testTubeRack.svg, /M13 29h94v17H13zM19 87h82v14H19z/);
  assert.equal((testTubeRack.svg.match(/<ellipse /g) || []).length, 5);
  assert.doesNotMatch(testTubeRack.svg, /M32 55v22|M49 55v22|M66 55v22|M83 55v22/);
  assert.equal(hose.equipmentType, 'hose');

  const filterPoints = getSnapPoints({ sourceId: 'filter-flask', x: 0, y: 0, width: 120, height: 120 });
  assert.deepEqual(filterPoints.map((point) => point.role), ['top', 'right', 'bottom']);
  assert.ok(Math.abs(filterPoints[0].y - 7.2) < 0.001);
  assert.ok(Math.abs(filterPoints[1].x - 103.2) < 0.001);
  assert.ok(Math.abs(filterPoints[1].y - 34.8) < 0.001);
  assert.ok(Math.abs(filterPoints[2].y - 112.8) < 0.001);

  const cylinderPoints = getSnapPoints({ sourceId: 'graduated-cylinder', x: 0, y: 0, width: 120, height: 120 });
  assert.deepEqual(cylinderPoints.map((point) => point.role), ['top', 'bottom']);
  assert.ok(Math.abs(cylinderPoints[0].y - 8.4) < 0.001);
  assert.ok(Math.abs(cylinderPoints[1].y - 109.2) < 0.001);

  const flatPoints = getSnapPoints({ sourceId: 'flat-bottom-flask', x: 0, y: 0, width: 120, height: 120 });
  assert.deepEqual(flatPoints.map((point) => point.role), ['top', 'bottom']);
  assert.ok(Math.abs(flatPoints[0].y - 7.2) < 0.001);
  assert.ok(Math.abs(flatPoints[1].y - 112.2) < 0.001);

  const volumetricPoints = getSnapPoints({ sourceId: 'volumetric-flask', x: 0, y: 0, width: 120, height: 120 });
  assert.deepEqual(volumetricPoints.map((point) => point.role), ['top', 'bottom']);
  assert.ok(Math.abs(volumetricPoints[0].y - 6) < 0.001);
  assert.ok(Math.abs(volumetricPoints[1].y - 115.2) < 0.001);

  const rackPoints = getSnapPoints({ sourceId: 'test-tube-rack', x: 0, y: 0, width: 120, height: 120 });
  assert.deepEqual(rackPoints.map((point) => point.role), ['top']);
  assert.ok(Math.abs(rackPoints[0].y - 31.2) < 0.001);

  const uTube = getEquipmentById('u-tube');
  assert.match(uTube.svg, /M32 11v65a28 28 0 0 0 56 0V11/);
  assert.match(uTube.svg, /M50 11v65a10 10 0 0 0 20 0V11/);
  assert.doesNotMatch(uTube.svg, /M28 16h24|M68 16h24/);

  const uTubePoints = getSnapPoints({ sourceId: 'u-tube', x: 0, y: 0, width: 120, height: 120 });
  assert.deepEqual(uTubePoints.map((point) => point.role), ['top', 'top']);
  assert.ok(Math.abs(uTubePoints[0].x - 40.8) < 0.001);
  assert.ok(Math.abs(uTubePoints[1].x - 79.2) < 0.001);
  assert.ok(uTubePoints.every((point) => Math.abs(point.y - 10.8) < 0.001));

  const condenserPoints = getSnapPoints({ sourceId: 'condenser', x: 0, y: 0, width: 120, height: 120 });
  assert.deepEqual(condenserPoints.map((point) => point.role), ['top', 'bottom', 'left', 'right']);
  assert.ok(Math.abs(condenserPoints[0].y - 4.8) < 0.001);
  assert.ok(Math.abs(condenserPoints[1].y - 115.2) < 0.001);
  assert.ok(Math.abs(condenserPoints[2].x - 19.8) < 0.001);
  assert.ok(Math.abs(condenserPoints[2].y - 39) < 0.001);
  assert.ok(Math.abs(condenserPoints[3].x - 100.2) < 0.001);
  assert.ok(Math.abs(condenserPoints[3].y - 81) < 0.001);

  const longNeckFunnel = getEquipmentById('long-neck-funnel');
  assert.match(longNeckFunnel.svg, /M45 8c7 3 10 7 10 12-8 2-13 7-13 13/);
  assert.match(longNeckFunnel.svg, /M75 8c-7 3-10 7-10 12 8 2 13 7 13 13/);
  assert.doesNotMatch(longNeckFunnel.svg, /M18 22h84|M35 34h50/);

  const longFunnelPoints = getSnapPoints({
    sourceId: 'long-neck-funnel', x: 0, y: 0, width: 120, height: 120,
  });
  assert.deepEqual(longFunnelPoints.map((point) => point.role), ['top', 'bottom']);
  assert.ok(Math.abs(longFunnelPoints[0].y - 7.8) < 0.001);
  assert.ok(Math.abs(longFunnelPoints[1].y - 115.2) < 0.001);

  const droppingFunnel = getEquipmentById('dropping-funnel');
  assert.match(droppingFunnel.svg, /M45 5c5 2 7 5 7 10v5C43 23 38 28 38 36/);
  assert.match(droppingFunnel.svg, /M43 82h34M56 87v29M64 87v29/);
  assert.match(droppingFunnel.svg, /<circle cx="60" cy="82" r="5"/);
  assert.doesNotMatch(droppingFunnel.svg, /M39 17h42|M46 92h28/);

  const droppingPoints = getSnapPoints({
    sourceId: 'dropping-funnel', x: 0, y: 0, width: 120, height: 120,
  });
  assert.deepEqual(droppingPoints.map((point) => point.role), ['top', 'bottom']);
  assert.ok(Math.abs(droppingPoints[0].y - 4.8) < 0.001);
  assert.ok(Math.abs(droppingPoints[1].y - 115.8) < 0.001);

  const separatoryFunnel = getEquipmentById('separatory-funnel');
  assert.match(separatoryFunnel.svg, /M45 6c5 2 7 5 7 10v12C37 32 27 38 27 47/);
  assert.match(separatoryFunnel.svg, /M75 6c-5 2-7 5-7 10v12c15 4 25 10 25 19/);
  assert.match(separatoryFunnel.svg, /M43 96h34M56 101v15M64 101v15/);
  assert.match(separatoryFunnel.svg, /<circle cx="60" cy="96" r="5"/);
  assert.doesNotMatch(separatoryFunnel.svg, /M44 15h32|M45 92h30/);

  const separatoryPoints = getSnapPoints({
    sourceId: 'separatory-funnel', x: 0, y: 0, width: 120, height: 120,
  });
  assert.deepEqual(separatoryPoints.map((point) => point.role), ['top', 'bottom']);
  assert.ok(Math.abs(separatoryPoints[0].y - 4.8) < 0.001);
  assert.ok(Math.abs(separatoryPoints[1].y - 115.8) < 0.001);

  const dropper = getEquipmentById('dropper');
  assert.match(dropper.svg, /M60 5c-6 0-9 4-9 10v10l-4 7h26l-4-7V15/);
  assert.match(dropper.svg, /M54 32v62c0 7 3 14 6 21 3-7 6-14 6-21V32/);
  assert.match(dropper.svg, /M61 43v42/);
  assert.doesNotMatch(dropper.svg, /M50 10q10-9 20 0|M52 23h16v60/);

  const dropperPoints = getSnapPoints({
    sourceId: 'dropper', x: 0, y: 0, width: 120, height: 120,
  });
  assert.deepEqual(dropperPoints.map((point) => point.role), ['bottom']);
  assert.ok(Math.abs(dropperPoints[0].x - 60) < 0.001);
  assert.ok(Math.abs(dropperPoints[0].y - 115.8) < 0.001);

  const pipette = getEquipmentById('pipette');
  assert.match(pipette.svg, /M56 5v40c0 4-7 6-7 13s4 11 7 13v44/);
  assert.match(pipette.svg, /M64 5v40c0 4 7 6 7 13s-4 11-7 13v44/);
  assert.match(pipette.svg, /stroke="#d36b61" stroke-width="3" d="M55 16h10"/);
  assert.doesNotMatch(pipette.svg, /M53 12h14|M49 31h7M49 42h7/);

  const pipettePoints = getSnapPoints({
    sourceId: 'pipette', x: 0, y: 0, width: 120, height: 120,
  });
  assert.deepEqual(pipettePoints.map((point) => point.role), ['top', 'bottom']);
  assert.ok(Math.abs(pipettePoints[0].y - 4.8) < 0.001);
  assert.ok(Math.abs(pipettePoints[1].y - 115.8) < 0.001);

  const volumetricPipette = getEquipmentById('volumetric-pipette');
  assert.match(volumetricPipette.svg, /M57 5v34c-9 5-15 12-15 22s6 18 15 23v20/);
  assert.match(volumetricPipette.svg, /M63 5v34c9 5 15 12 15 22s-6 18-15 23v20/);
  assert.match(volumetricPipette.svg, /stroke="#d36b61" stroke-width="3" d="M56 20h8"/);
  assert.doesNotMatch(volumetricPipette.svg, /M54 10h12|M50 46h20/);
  assert.notEqual(volumetricPipette.svg, pipette.svg);

  const volumetricPipettePoints = getSnapPoints({
    sourceId: 'volumetric-pipette', x: 0, y: 0, width: 120, height: 120,
  });
  assert.deepEqual(volumetricPipettePoints.map((point) => point.role), ['top', 'bottom']);
  assert.ok(Math.abs(volumetricPipettePoints[0].y - 4.8) < 0.001);
  assert.ok(Math.abs(volumetricPipettePoints[1].y - 115.8) < 0.001);

  const reagentBottle = getEquipmentById('reagent-bottle');
  assert.match(reagentBottle.svg, /M43 8h34M47 14h26l-4 14H51z/);
  assert.match(reagentBottle.svg, /M48 28v15C36 46 30 51 30 60v45/);
  assert.doesNotMatch(reagentBottle.svg, /M41 20h38v11|M39 65h42M39 78h42|M37 105h46/);

  const reagentBottlePoints = getSnapPoints({
    sourceId: 'reagent-bottle', x: 0, y: 0, width: 120, height: 120,
  });
  assert.deepEqual(reagentBottlePoints.map((point) => point.role), ['top']);
  assert.ok(Math.abs(reagentBottlePoints[0].x - 60) < 0.001);
  assert.ok(Math.abs(reagentBottlePoints[0].y - 7.8) < 0.001);

  const wideMouthBottle = getEquipmentById('wide-mouth-bottle');
  assert.match(wideMouthBottle.svg, /M37 8h46v24H37zM37 16h46M37 24h46/);
  assert.match(wideMouthBottle.svg, /M43 32v10C33 44 28 49 28 57v48/);
  assert.doesNotMatch(wideMouthBottle.svg, /M37 21h46v13|M40 55h40M40 68h40/);
  assert.notEqual(wideMouthBottle.svg, reagentBottle.svg);

  const wideMouthPoints = getSnapPoints({
    sourceId: 'wide-mouth-bottle', x: 0, y: 0, width: 120, height: 120,
  });
  assert.deepEqual(wideMouthPoints.map((point) => point.role), ['top']);
  assert.ok(Math.abs(wideMouthPoints[0].x - 60) < 0.001);
  assert.ok(Math.abs(wideMouthPoints[0].y - 7.8) < 0.001);

  const washBottle = getEquipmentById('wash-bottle');
  assert.match(washBottle.svg, /M48 38h24c0 4 2 7 8 9/);
  assert.match(washBottle.svg, /M58 25v-7c0-5-3-8-8-8h-7L16 33/);
  assert.match(washBottle.svg, /M58 38v64M65 38v64/);
  assert.doesNotMatch(washBottle.svg, /M32 39h56v57|M54 27V15h18/);

  const washBottlePoints = getSnapPoints({
    sourceId: 'wash-bottle', x: 0, y: 0, width: 120, height: 120,
  });
  assert.deepEqual(washBottlePoints.map((point) => point.role), ['left']);
  assert.ok(Math.abs(washBottlePoints[0].x - 16.2) < 0.001);
  assert.ok(Math.abs(washBottlePoints[0].y - 28.8) < 0.001);

  const petriDish = getEquipmentById('petri-dish');
  assert.match(petriDish.svg, /M18 42v22c0 8 6 13 14 13h56c8 0 14-5 14-13V42/);
  assert.doesNotMatch(petriDish.svg, /<ellipse|M17 49v18|M17 49c0 8/);
  assert.deepEqual(getSnapPoints({
    sourceId: 'petri-dish', x: 0, y: 0, width: 120, height: 120,
  }), []);

  const evaporatingDish = getEquipmentById('evaporating-dish');
  assert.match(evaporatingDish.svg, /M17 38c2 24 7 38 18 45/);
  assert.match(evaporatingDish.svg, /c10-7 15-21 17-39l7-5/);
  assert.doesNotMatch(evaporatingDish.svg, /M17 48c0 9|M95 54l13 5|q43 24 86 0/);
  assert.deepEqual(getSnapPoints({
    sourceId: 'evaporating-dish', x: 0, y: 0, width: 120, height: 120,
  }), []);

  const watchGlass = getEquipmentById('watch-glass');
  assert.match(watchGlass.svg, /M14 52c12 12 28 17 46 17s34-5 46-17/);
  assert.doesNotMatch(watchGlass.svg, /q45-25 90 0|q45 27 90 0/);
  assert.notEqual(watchGlass.svg, petriDish.svg);
  assert.deepEqual(getSnapPoints({
    sourceId: 'watch-glass', x: 0, y: 0, width: 120, height: 120,
  }), []);

  const surfaceDish = getEquipmentById('surface-dish');
  assert.match(surfaceDish.svg, /<ellipse[^>]+cx="60" cy="60" rx="46" ry="28"/);
  assert.doesNotMatch(surfaceDish.svg, /M13 53q47-20 94 0|M32 59q28 10 56 0/);
  assert.notEqual(surfaceDish.svg, watchGlass.svg);
  assert.deepEqual(getSnapPoints({
    sourceId: 'surface-dish', x: 0, y: 0, width: 120, height: 120,
  }), []);

  const crystallizingDish = getEquipmentById('crystallizing-dish');
  assert.match(crystallizingDish.svg, /M16 36h8v47c0 8 5 13 13 13h46/);
  assert.match(crystallizingDish.svg, /c8 0 13-5 13-13V36h8/);
  assert.doesNotMatch(crystallizingDish.svg, /M19 39h82|M27 39l8 54|l8-54/);
  assert.notEqual(crystallizingDish.svg, petriDish.svg);
  assert.deepEqual(getSnapPoints({
    sourceId: 'crystallizing-dish', x: 0, y: 0, width: 120, height: 120,
  }), []);

  const universalClamp = getEquipmentById('universal-clamp');
  assert.match(universalClamp.svg, /M9 54h65v12H9/);
  assert.match(universalClamp.svg, /M72 49h12l12-12h15/);
  assert.match(universalClamp.svg, /M99 37h12M99 60h12M99 83h12/);
  assert.doesNotMatch(universalClamp.svg, /M17 60h31|M72 60l26-25|M47 45c-9 8/);

  const universalClampPoints = getSnapPoints({
    sourceId: 'universal-clamp', x: 0, y: 0, width: 120, height: 120,
  });
  assert.deepEqual(universalClampPoints.map((point) => point.role), ['left', 'right']);
  assert.ok(Math.abs(universalClampPoints[0].x - 9) < 0.001);
  assert.ok(Math.abs(universalClampPoints[1].x - 111) < 0.001);
  assert.ok(universalClampPoints.every((point) => Math.abs(point.y - 60) < 0.001));
});

test('catalog equipment has unique models for visually different apparatus', () => {
  const normalizedModels = equipmentCatalog.map((item) => item.svg.replace(/\s+/g, ' ').trim());
  assert.equal(new Set(normalizedModels).size, equipmentCatalog.length);
  assert.notEqual(getEquipmentById('wide-mouth-bottle').svg, getEquipmentById('gas-jar').svg);
  assert.notEqual(getEquipmentById('wash-bottle').svg, getEquipmentById('water-tank').svg);
  const condenser = getEquipmentById('condenser');
  assert.match(condenser.svg, /M56 5v110M64 5v110/);
  assert.match(condenser.svg, /M56 17c-7 0-12 4-12 10v7/);
  assert.match(condenser.svg, /M44 34H20M44 44H20M76 76h24M76 86h24/);
  assert.doesNotMatch(condenser.svg, /fill="#78b9c8"|M42 38H27v-10|M78 82h15v10/);
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
  assert.equal(getEquipmentById('funnel').supportsLiquid, true);
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

  const funnelFull = getLiquidBandGeometryForObject({ sourceId: 'funnel' }, 0, 100);
  const funnelHalf = getLiquidBandGeometryForObject({ sourceId: 'funnel' }, 0, 50);
  assert.equal(funnelFull.middle, 48);
  assert.equal(funnelHalf.leftBottom, 45);
  assert.ok(funnelFull.rightTop - funnelFull.leftTop > 60);

  const cylinderFull = getLiquidBandGeometryForObject({ sourceId: 'graduated-cylinder' }, 0, 100);
  assert.equal(cylinderFull.bandTop, 7);
  assert.equal(cylinderFull.bandBottom, 80);
  assert.equal(cylinderFull.rightTop - cylinderFull.leftTop, 14);

  const flatFull = getLiquidBandGeometryForObject({ sourceId: 'flat-bottom-flask' }, 0, 100);
  const flatHalf = getLiquidBandGeometryForObject({ sourceId: 'flat-bottom-flask' }, 0, 50);
  assert.equal(flatFull.bandTop, 32);
  assert.equal(flatFull.middle, 64);
  assert.equal(flatFull.bandBottom, 94);
  assert.ok(flatHalf.rightTop - flatHalf.leftTop > 70);

  const volumetricFull = getLiquidBandGeometryForObject({ sourceId: 'volumetric-flask' }, 0, 100);
  const volumetricHalf = getLiquidBandGeometryForObject({ sourceId: 'volumetric-flask' }, 0, 50);
  assert.equal(volumetricFull.bandTop, 49);
  assert.equal(volumetricFull.middle, 78);
  assert.equal(volumetricFull.bandBottom, 96);
  assert.ok(volumetricHalf.rightTop - volumetricHalf.leftTop > 35);

  const washBottleFull = getLiquidBandGeometryForObject({ sourceId: 'wash-bottle' }, 0, 100);
  const washBottleHalf = getLiquidBandGeometryForObject({ sourceId: 'wash-bottle' }, 0, 50);
  assert.equal(washBottleFull.bandTop, 33);
  assert.equal(washBottleFull.middle, 52);
  assert.equal(washBottleFull.bandBottom, 92);
  assert.equal(washBottleFull.rightTop - washBottleFull.leftTop, 20);
  assert.ok(washBottleHalf.rightTop - washBottleHalf.leftTop > 40);

  const petriFull = getLiquidBandGeometryForObject({ sourceId: 'petri-dish' }, 0, 100);
  const petriHalf = getLiquidBandGeometryForObject({ sourceId: 'petri-dish' }, 0, 50);
  assert.equal(petriFull.bandTop, 36);
  assert.equal(petriFull.bandBottom, 62);
  assert.equal(petriFull.rightTop - petriFull.leftTop, 68);
  assert.equal(petriFull.rightBottom - petriFull.leftBottom, 54);
  assert.ok(petriHalf.bandTop > petriFull.bandTop);

  const evaporatingFull = getLiquidBandGeometryForObject({ sourceId: 'evaporating-dish' }, 0, 100);
  const evaporatingHalf = getLiquidBandGeometryForObject({ sourceId: 'evaporating-dish' }, 0, 50);
  assert.equal(evaporatingFull.bandTop, 36);
  assert.equal(evaporatingFull.middle, 54);
  assert.equal(evaporatingFull.bandBottom, 72);
  assert.equal(evaporatingFull.rightTop - evaporatingFull.leftTop, 66);
  assert.equal(evaporatingFull.rightBottom - evaporatingFull.leftBottom, 30);
  assert.ok(evaporatingHalf.rightTop - evaporatingHalf.leftTop > 45);

  const watchFull = getLiquidBandGeometryForObject({ sourceId: 'watch-glass' }, 0, 100);
  const watchHalf = getLiquidBandGeometryForObject({ sourceId: 'watch-glass' }, 0, 50);
  assert.equal(watchFull.bandTop, 44);
  assert.equal(watchFull.bandBottom, 57);
  assert.equal(watchFull.rightTop - watchFull.leftTop, 74);
  assert.equal(watchFull.rightBottom - watchFull.leftBottom, 20);
  assert.ok(watchHalf.bandTop > watchFull.bandTop);

  const surfaceFull = getLiquidBandGeometryForObject({ sourceId: 'surface-dish' }, 0, 100);
  const surfaceHalf = getLiquidBandGeometryForObject({ sourceId: 'surface-dish' }, 0, 50);
  assert.equal(surfaceFull.bandTop, 28);
  assert.equal(surfaceFull.middle, 50);
  assert.equal(surfaceFull.bandBottom, 72);
  assert.equal(surfaceFull.rightTop - surfaceFull.leftTop, 16);
  assert.equal(surfaceFull.rightMiddle - surfaceFull.leftMiddle, 76);
  assert.equal(surfaceFull.rightBottom - surfaceFull.leftBottom, 16);
  assert.ok(surfaceHalf.rightTop - surfaceHalf.leftTop > 70);

  const crystallizingFull = getLiquidBandGeometryForObject({ sourceId: 'crystallizing-dish' }, 0, 100);
  const crystallizingHalf = getLiquidBandGeometryForObject({ sourceId: 'crystallizing-dish' }, 0, 50);
  assert.equal(crystallizingFull.bandTop, 30);
  assert.equal(crystallizingFull.bandBottom, 79);
  assert.equal(crystallizingFull.rightTop - crystallizingFull.leftTop, 56);
  assert.equal(crystallizingFull.rightBottom - crystallizingFull.leftBottom, 50);
  assert.ok(crystallizingHalf.bandTop > crystallizingFull.bandTop);

  const droppingFull = getLiquidBandGeometryForObject({ sourceId: 'dropping-funnel' }, 0, 100);
  const droppingHalf = getLiquidBandGeometryForObject({ sourceId: 'dropping-funnel' }, 0, 50);
  assert.equal(droppingFull.bandTop, 18);
  assert.equal(droppingFull.middle, 34);
  assert.equal(droppingFull.bandBottom, 63);
  assert.equal(droppingFull.rightTop - droppingFull.leftTop, 14);
  assert.ok(droppingHalf.rightTop - droppingHalf.leftTop > 20);

  const separatoryFull = getLiquidBandGeometryForObject({ sourceId: 'separatory-funnel' }, 0, 100);
  const separatoryHalf = getLiquidBandGeometryForObject({ sourceId: 'separatory-funnel' }, 0, 50);
  assert.equal(separatoryFull.bandTop, 22);
  assert.equal(separatoryFull.middle, 39);
  assert.equal(separatoryFull.bandBottom, 78);
  assert.equal(separatoryFull.rightTop - separatoryFull.leftTop, 14);
  assert.ok(separatoryHalf.rightTop - separatoryHalf.leftTop > 25);
  assert.equal(separatoryFull.rightBottom - separatoryFull.leftBottom, 6);

  const dropperFull = getLiquidBandGeometryForObject({ sourceId: 'dropper' }, 0, 100);
  const dropperHalf = getLiquidBandGeometryForObject({ sourceId: 'dropper' }, 0, 50);
  assert.equal(dropperFull.bandTop, 28);
  assert.equal(dropperFull.bandBottom, 90);
  assert.equal(dropperFull.rightTop - dropperFull.leftTop, 6);
  assert.equal(dropperFull.rightBottom - dropperFull.leftBottom, 2);
  assert.ok(dropperHalf.leftTop > dropperFull.leftTop);

  const pipetteFull = getLiquidBandGeometryForObject({ sourceId: 'pipette' }, 0, 100);
  const pipetteHalf = getLiquidBandGeometryForObject({ sourceId: 'pipette' }, 0, 50);
  assert.equal(pipetteFull.bandTop, 12);
  assert.equal(pipetteFull.middle, 48);
  assert.equal(pipetteFull.bandBottom, 59);
  assert.equal(pipetteFull.rightTop - pipetteFull.leftTop, 6);
  assert.equal(pipetteFull.rightMiddle - pipetteFull.leftMiddle, 16);
  assert.ok(pipetteHalf.rightTop - pipetteHalf.leftTop > 8);

  const volumetricPipetteFull = getLiquidBandGeometryForObject(
    { sourceId: 'volumetric-pipette' }, 0, 100,
  );
  const volumetricPipetteHalf = getLiquidBandGeometryForObject(
    { sourceId: 'volumetric-pipette' }, 0, 50,
  );
  assert.equal(volumetricPipetteFull.bandTop, 34);
  assert.equal(volumetricPipetteFull.middle, 52);
  assert.equal(volumetricPipetteFull.bandBottom, 70);
  assert.equal(volumetricPipetteFull.rightMiddle - volumetricPipetteFull.leftMiddle, 28);
  assert.ok(volumetricPipetteHalf.rightTop - volumetricPipetteHalf.leftTop > 20);

  const reagentFull = getLiquidBandGeometryForObject({ sourceId: 'reagent-bottle' }, 0, 100);
  const reagentHalf = getLiquidBandGeometryForObject({ sourceId: 'reagent-bottle' }, 0, 50);
  assert.equal(reagentFull.bandTop, 46);
  assert.equal(reagentFull.bandBottom, 92);
  assert.equal(reagentFull.rightTop - reagentFull.leftTop, 44);
  assert.equal(reagentFull.rightBottom - reagentFull.leftBottom, 44);
  assert.equal(reagentHalf.rightTop - reagentHalf.leftTop, 44);

  const wideMouthFull = getLiquidBandGeometryForObject({ sourceId: 'wide-mouth-bottle' }, 0, 100);
  const wideMouthHalf = getLiquidBandGeometryForObject({ sourceId: 'wide-mouth-bottle' }, 0, 50);
  assert.equal(wideMouthFull.bandTop, 48);
  assert.equal(wideMouthFull.bandBottom, 92);
  assert.equal(wideMouthFull.rightTop - wideMouthFull.leftTop, 46);
  assert.equal(wideMouthFull.rightBottom - wideMouthFull.leftBottom, 46);
  assert.equal(wideMouthHalf.rightTop - wideMouthHalf.leftTop, 46);

  const filterFull = getLiquidBandGeometryForObject({ sourceId: 'filter-flask' }, 0, 100);
  assert.equal(filterFull.bandTop, 39);
  assert.equal(filterFull.bandBottom, 94);
  assert.equal(filterFull.rightTop - filterFull.leftTop, 18);
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

  const funnelSvg = buildSceneSvg([{
    id: 'funnel-1', type: 'svg', visible: true, x: 0, y: 0, width: 120, height: 120, rotation: 0,
    supportsLiquid: true, sourceId: 'funnel',
    svgMarkup: '<svg width="100%" height="100%"></svg>',
    liquid: { layers: [{ level: 100, color: '#67aee8', opacity: 0.72 }] },
  }]);
  assert.match(funnelSvg, /M 16\.8 14\.4 L 103\.2 14\.4 L 66 57\.6 L 66 108 L 54 108 L 54 57\.6 Z/);
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
