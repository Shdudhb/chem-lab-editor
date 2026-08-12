const SNAP_DISTANCE = 18;

const rotatePoint = (point, degrees) => {
  const radians = (Number(degrees) || 0) * Math.PI / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  return {
    x: point.x * cosine - point.y * sine,
    y: point.x * sine + point.y * cosine,
  };
};

const edgePoint = (object, x, y, role) => {
  const center = {
    x: object.x + object.width / 2,
    y: object.y + object.height / 2,
  };
  const rotated = rotatePoint({
    x: x * object.width / 2,
    y: y * object.height / 2,
  }, object.rotation);

  return {
    x: center.x + rotated.x,
    y: center.y + rotated.y,
    role,
  };
};

const snapPointProfiles = {
  beaker: [[0, -0.58, 'top'], [0, 0.63, 'bottom']],
  'erlenmeyer-flask': [[0, -0.7, 'top'], [0, 0.73, 'bottom']],
  'round-bottom-flask': [[0, -0.72, 'top'], [0, 0.84, 'bottom']],
  'flat-bottom-flask': [[0, -0.72, 'top'], [0, 0.73, 'bottom']],
  'volumetric-flask': [[0, -0.73, 'top'], [0, 0.77, 'bottom']],
  'filter-flask': [[0, -0.73, 'top'], [0.83, 0.08, 'right'], [0, 0.73, 'bottom']],
  'test-tube': [[0, -0.7, 'top'], [0, 0.57, 'bottom']],
  'test-tube-rack': [[0, -0.4, 'top']],
  funnel: [[0, -0.6, 'top'], [0, 0.58, 'bottom']],
  'long-neck-funnel': [[0, -0.6, 'top'], [0, 0.58, 'bottom']],
  'dropping-funnel': [[0, -0.6, 'top'], [0, 0.58, 'bottom']],
  'separatory-funnel': [[0, -0.6, 'top'], [0, 0.58, 'bottom']],
  'retort-stand': [[0, -1, 'top'], [1, 0, 'right'], [-1, 0, 'left']],
  'iron-ring': [[0, -1, 'top']],
  tripod: [[0, -1, 'top']],
  'universal-clamp': [[1, 0, 'right'], [-1, 0, 'left']],
  'flask-clamp': [[1, 0, 'right'], [-1, 0, 'left']],
  'test-tube-holder': [[1, 0, 'right'], [-1, 0, 'left']],
  'alcohol-lamp': [[0, -0.58, 'top']],
  'bunsen-burner': [[0, -0.6, 'top']],
};

export const getSnapPoints = (object) => {
  const profile = snapPointProfiles[object.sourceId];
  if (profile) return profile.map(([x, y, role]) => edgePoint(object, x, y, role));
  return [
    edgePoint(object, 0, -1, 'top'),
    edgePoint(object, 1, 0, 'right'),
    edgePoint(object, 0, 1, 'bottom'),
    edgePoint(object, -1, 0, 'left'),
  ];
};

const compatibleRoles = new Map([
  ['top', new Set(['bottom'])],
  ['right', new Set(['left'])],
  ['bottom', new Set(['top'])],
  ['left', new Set(['right'])],
]);

const distanceBetween = (first, second) => Math.hypot(
  first.x - second.x,
  first.y - second.y,
);

export const findSnapCandidate = (movingObjects, targetObjects) => {
  let bestCandidate = null;

  movingObjects.forEach((movingObject) => {
    getSnapPoints(movingObject).forEach((sourcePoint) => {
      targetObjects.forEach((targetObject) => {
        getSnapPoints(targetObject).forEach((targetPoint) => {
          if (!compatibleRoles.get(sourcePoint.role)?.has(targetPoint.role)) return;

          const distance = distanceBetween(sourcePoint, targetPoint);
          if (distance > SNAP_DISTANCE) return;

          if (!bestCandidate || distance < bestCandidate.distance) {
            bestCandidate = {
              distance,
              delta: {
                x: targetPoint.x - sourcePoint.x,
                y: targetPoint.y - sourcePoint.y,
              },
              sourcePoint,
              targetPoint,
              movingObjectId: movingObject.id,
              targetObjectId: targetObject.id,
            };
          }
        });
      });
    });
  });

  return bestCandidate;
};

export const findPointSnapCandidate = (point, targetObjects) => {
  let bestCandidate = null;

  targetObjects.forEach((targetObject) => {
    getSnapPoints(targetObject).forEach((targetPoint) => {
      const distance = distanceBetween(point, targetPoint);
      if (distance > SNAP_DISTANCE) return;

      if (!bestCandidate || distance < bestCandidate.distance) {
        bestCandidate = {
          distance,
          delta: {
            x: targetPoint.x - point.x,
            y: targetPoint.y - point.y,
          },
          sourcePoint: point,
          targetPoint,
          targetObjectId: targetObject.id,
        };
      }
    });
  });

  return bestCandidate;
};

export const SNAP_RULES = {
  distance: SNAP_DISTANCE,
  description: '上下接點與左右接點在距離內時自動吸附',
};
