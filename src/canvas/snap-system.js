const SNAP_DISTANCE = 18;

const rotatePoint = (point, degrees) => {
  const radians = degrees * Math.PI / 180;
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

export const getSnapPoints = (object) => [
  edgePoint(object, 0, -1, 'top'),
  edgePoint(object, 1, 0, 'right'),
  edgePoint(object, 0, 1, 'bottom'),
  edgePoint(object, -1, 0, 'left'),
];

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

export const SNAP_RULES = {
  distance: SNAP_DISTANCE,
  description: '上下接點與左右接點在距離內時自動吸附',
};
