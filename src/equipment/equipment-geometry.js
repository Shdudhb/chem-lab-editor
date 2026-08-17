const liquidVesselProfiles = {
  beaker: { top: 12, bottom: 89, leftTop: 21, rightTop: 79, leftBottom: 25, rightBottom: 75 },
  'erlenmeyer-flask': { top: 6, bottom: 94, leftTop: 41, rightTop: 59, leftBottom: 28, rightBottom: 72 },
  'round-bottom-flask': {
    top: 5,
    bottom: 96,
    leftTop: 41,
    rightTop: 59,
    middle: 62,
    leftMiddle: 12,
    rightMiddle: 88,
    leftBottom: 35,
    rightBottom: 65,
  },
  'flat-bottom-flask': { top: 13, bottom: 88, leftTop: 40, rightTop: 60, leftBottom: 26, rightBottom: 74 },
  'volumetric-flask': { top: 13, bottom: 90, leftTop: 43, rightTop: 57, leftBottom: 24, rightBottom: 78 },
  'filter-flask': { top: 13, bottom: 88, leftTop: 39, rightTop: 61, leftBottom: 26, rightBottom: 74 },
  'test-tube': { top: 15, bottom: 79, leftTop: 38, rightTop: 62, leftBottom: 38, rightBottom: 62 },
  'graduated-cylinder': { top: 13, bottom: 82, leftTop: 36, rightTop: 64, leftBottom: 36, rightBottom: 64 },
  'dropping-funnel': { top: 18, bottom: 66, leftTop: 36, rightTop: 64, leftBottom: 43, rightBottom: 57 },
  'separatory-funnel': { top: 18, bottom: 79, leftTop: 42, rightTop: 58, leftBottom: 34, rightBottom: 66 },
  dropper: { top: 22, bottom: 74, leftTop: 43, rightTop: 57, leftBottom: 43, rightBottom: 57 },
  pipette: { top: 14, bottom: 82, leftTop: 46, rightTop: 54, leftBottom: 46, rightBottom: 54 },
  'volumetric-pipette': { top: 14, bottom: 79, leftTop: 46, rightTop: 54, leftBottom: 41, rightBottom: 59 },
  'reagent-bottle': { top: 31, bottom: 88, leftTop: 31, rightTop: 69, leftBottom: 31, rightBottom: 69 },
  'wide-mouth-bottle': { top: 35, bottom: 86, leftTop: 29, rightTop: 71, leftBottom: 29, rightBottom: 71 },
  'wash-bottle': { top: 37, bottom: 89, leftTop: 29, rightTop: 71, leftBottom: 29, rightBottom: 71 },
  'petri-dish': { top: 39, bottom: 79, leftTop: 18, rightTop: 82, leftBottom: 18, rightBottom: 82 },
  'evaporating-dish': { top: 39, bottom: 78, leftTop: 18, rightTop: 82, leftBottom: 18, rightBottom: 82 },
  'watch-glass': { top: 34, bottom: 69, leftTop: 15, rightTop: 85, leftBottom: 15, rightBottom: 85 },
  'surface-dish': { top: 32, bottom: 67, leftTop: 14, rightTop: 86, leftBottom: 14, rightBottom: 86 },
  'crystallizing-dish': { top: 38, bottom: 78, leftTop: 18, rightTop: 82, leftBottom: 18, rightBottom: 82 },
  'water-tank': { top: 31, bottom: 85, leftTop: 20, rightTop: 80, leftBottom: 24, rightBottom: 76 },
  'gas-jar': { top: 23, bottom: 88, leftTop: 31, rightTop: 69, leftBottom: 31, rightBottom: 69 },
  'pneumatic-trough': { top: 38, bottom: 83, leftTop: 23, rightTop: 77, leftBottom: 29, rightBottom: 71 },
};

const snapPointProfiles = {
  beaker: [[0, -0.77, 'top'], [0, 0.78, 'bottom']],
  'erlenmeyer-flask': [[0, -0.88, 'top'], [0, 0.88, 'bottom']],
  'round-bottom-flask': [[0, -0.9, 'top'], [0, 0.92, 'bottom']],
  'flat-bottom-flask': [[0, -0.73, 'top'], [0, 0.78, 'bottom']],
  'volumetric-flask': [[0, -0.77, 'top'], [0, 0.82, 'bottom']],
  'filter-flask': [[0, -0.75, 'top'], [0.68, -0.36, 'right'], [0, 0.78, 'bottom']],
  'test-tube': [[0, -0.72, 'top']],
  'graduated-cylinder': [[0, -0.75, 'top']],
  'test-tube-rack': [[0, -0.4, 'top']],
  'u-tube': [[-0.33, -0.73, 'top'], [0.33, -0.73, 'top']],
  funnel: [[0, -0.58, 'top'], [0, 0.72, 'bottom']],
  'long-neck-funnel': [[0, -0.63, 'top'], [0, 0.8, 'bottom']],
  'dropping-funnel': [[0, -0.72, 'top'], [0, 0.8, 'bottom']],
  'separatory-funnel': [[0, -0.75, 'top'], [0, 0.82, 'bottom']],
  dropper: [[0, -0.83, 'top'], [0, 0.8, 'bottom']],
  pipette: [[0, -0.8, 'top'], [0, 0.82, 'bottom']],
  'volumetric-pipette': [[0, -0.83, 'top'], [0, 0.83, 'bottom']],
  'reagent-bottle': [[0, -0.67, 'top']],
  'wide-mouth-bottle': [[0, -0.65, 'top']],
  'wash-bottle': [[0.68, -0.27, 'right']],
  condenser: [[0, -0.85, 'top'], [0, 0.85, 'bottom'], [-0.55, -0.53, 'left'], [0.55, 0.53, 'right']],
  'retort-stand': [[0, -1, 'top'], [1, 0, 'right'], [-1, 0, 'left']],
  'iron-ring': [[0, -1, 'top']],
  tripod: [[0, -1, 'top']],
  'universal-clamp': [[1, 0, 'right'], [-1, 0, 'left']],
  'flask-clamp': [[1, 0, 'right'], [-1, 0, 'left']],
  'test-tube-holder': [[1, 0, 'right'], [-1, 0, 'left']],
  'alcohol-lamp': [[0, -0.58, 'top']],
  'bunsen-burner': [[0, -0.6, 'top']],
  'glass-tubing': [[-0.55, 0.58, 'left'], [0.58, -0.58, 'right']],
  'water-tank': [[0, -0.43, 'top']],
  aspirator: [[0, -0.77, 'top'], [0.75, -0.02, 'right'], [0, 0.78, 'bottom']],
  'gas-jar': [[0, -0.65, 'top']],
};

const cloneVessel = (vessel) => (vessel ? { ...vessel } : undefined);
const cloneSnapPoints = (points) => (points ? points.map((point) => [...point]) : []);

export const getLiquidVesselProfile = (equipmentId) => cloneVessel(liquidVesselProfiles[equipmentId]);

export const getEquipmentSnapPointProfile = (equipmentId) => (
  equipmentId ? cloneSnapPoints(snapPointProfiles[equipmentId]) : undefined
);

export const getEquipmentGeometry = (equipmentId) => {
  const liquidVessel = getLiquidVesselProfile(equipmentId);
  return {
    supportsLiquid: Boolean(liquidVessel),
    liquidVessel,
    snapPoints: getEquipmentSnapPointProfile(equipmentId),
  };
};
