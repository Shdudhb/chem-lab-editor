import {
  SceneStore,
  getRotatedCornerWorldPoint,
  inverseRotate,
  parseSvgAsset,
  rotateVector,
} from './scene-store.js';
import { findPointSnapCandidate, findSnapCandidate } from './snap-system.js';

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
const BASE_GRID_SIZE = 20;
const MIN_OBJECT_SIZE = 24;
const ROTATION_SNAP = 15;

const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);

const oppositeCorner = {
  nw: 'se',
  ne: 'sw',
  sw: 'ne',
  se: 'nw',
};

const cornerSigns = (corner) => ({
  x: corner.includes('e') ? 1 : -1,
  y: corner.includes('s') ? 1 : -1,
});

const angleBetween = (point, center) => Math.atan2(
  point.y - center.y,
  point.x - center.x,
);

const angleDifference = (current, start) => {
  let difference = current - start;
  while (difference > Math.PI) difference -= Math.PI * 2;
  while (difference < -Math.PI) difference += Math.PI * 2;
  return difference;
};

const snapshotsEqual = (first, second) => JSON.stringify(first) === JSON.stringify(second);

export class CanvasController extends EventTarget {
  constructor(viewport, store = new SceneStore(viewport.querySelector('#canvasScene'))) {
    super();
    this.viewport = viewport;
    this.scene = viewport.querySelector('#canvasScene');
    this.store = store;
    this.tool = 'select';
    this.view = { zoom: 1, panX: 0, panY: 0 };
    this.dragState = null;
    this.history = [];
    this.historyIndex = -1;
    this.resizeObserver = new ResizeObserver(() => this.render());

    this.bindEvents();
    this.resizeObserver.observe(this.viewport);
    this.resetView();
    this.emitHistoryChange();
  }

  bindEvents() {
    this.viewport.addEventListener('pointerdown', (event) => this.handlePointerDown(event));
    this.viewport.addEventListener('pointermove', (event) => this.handlePointerMove(event));
    this.viewport.addEventListener('pointerup', (event) => this.handlePointerUp(event));
    this.viewport.addEventListener('pointercancel', (event) => this.handlePointerUp(event));
    this.viewport.addEventListener('wheel', (event) => this.handleWheel(event), { passive: false });
    this.viewport.addEventListener('keydown', (event) => this.handleKeydown(event));
  }

  setTool(tool) {
    this.tool = tool;
    this.viewport.classList.toggle('is-pan-tool', tool === 'pan');
  }

  importSvg(svgText) {
    const asset = parseSvgAsset(svgText);
    this.addAsset(asset);
  }

  addSvgMarkup(svgText, metadata = {}, screenPoint = null) {
    const asset = parseSvgAsset(svgText);
    this.addAsset(asset, metadata, screenPoint);
  }

  addAsset(asset, metadata = {}, screenPoint = null) {
    const bounds = this.viewport.getBoundingClientRect();
    const center = screenPoint
      ? this.screenToWorld(screenPoint.x, screenPoint.y)
      : this.screenToWorld(bounds.width / 2, bounds.height / 2);
    const before = this.store.snapshot();

    this.store.addSvg(asset, {
      x: center.x - asset.width / 2,
      y: center.y - asset.height / 2,
    }, metadata);

    this.recordHistory(before);
  }

  undo() {
    if (!this.canUndo) return;

    const entry = this.history[this.historyIndex];
    this.historyIndex -= 1;
    this.store.restore(entry.before);
    this.emitHistoryChange();
  }

  redo() {
    if (!this.canRedo) return;

    this.historyIndex += 1;
    const entry = this.history[this.historyIndex];
    this.store.restore(entry.after);
    this.emitHistoryChange();
  }

  loadScene(snapshot, view = null) {
    this.store.restore(snapshot);
    this.history = [];
    this.historyIndex = -1;
    if (view && Number.isFinite(view.zoom) && Number.isFinite(view.panX) && Number.isFinite(view.panY)) {
      this.view = { zoom: view.zoom, panX: view.panX, panY: view.panY };
    }
    this.render();
    this.emitHistoryChange();
  }

  get canUndo() {
    return this.historyIndex >= 0;
  }

  get canRedo() {
    return this.historyIndex < this.history.length - 1;
  }

  handlePointerDown(event) {
    if (event.button !== 0 && event.button !== 1) return;

    const target = event.target instanceof Element ? event.target : null;
    const handle = target?.closest('[data-handle]');
    const hosePoint = target?.closest('[data-hose-point]');
    const objectElement = target?.closest('.canvas-object');

    if (event.button === 0 && hosePoint && this.store.selectedObjects.length === 1) {
      this.startHosePointDrag(event, Number(hosePoint.dataset.hosePoint));
      return;
    }

    if (event.button === 0 && this.tool === 'hose' && !objectElement) {
      this.startHoseDraw(event);
      return;
    }

    if (event.button === 0 && ['text', 'arrow', 'line', 'rectangle', 'circle', 'number', 'freehand'].includes(this.tool) && !objectElement) {
      this.startAnnotationDraw(event, this.tool);
      return;
    }

    if (event.button === 0 && handle && this.store.selectedObjects.length === 1) {
      this.startHandleDrag(event, handle.dataset.handle, handle.dataset.corner);
      return;
    }

    if (event.button === 0 && handle && this.isGroupSelection()) {
      this.startHandleDrag(event, handle.dataset.handle, handle.dataset.corner);
      return;
    }

    if (event.button === 0 && objectElement && this.tool === 'select') {
      const id = objectElement.dataset.objectId;
      if (this.store.getObject(id)?.locked) return;
      const object = this.store.getObject(id);
      const wasSelected = this.store.selectedIds.has(id);
      if (object?.groupId) {
        this.store.selectGroup(object.groupId, event.shiftKey);
      } else {
        this.store.select(id, event.shiftKey);
      }

      if (event.shiftKey && wasSelected) return;
      this.startObjectDrag(event);
      return;
    }

    if (event.button === 0 && !objectElement && !event.shiftKey) {
      this.store.select(null);
    }

    this.startPan(event);
  }

  startPan(event) {
    this.dragState = {
      type: 'pan',
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panX: this.view.panX,
      panY: this.view.panY,
    };

    this.viewport.setPointerCapture(event.pointerId);
    this.viewport.classList.add('is-panning');
    event.preventDefault();
  }

  startObjectDrag(event) {
    const selected = this.store.selectedObjects;
    if (!selected.length) return;

    this.dragState = {
      type: 'objects',
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      before: this.store.snapshot(),
      positions: selected.map((object) => ({
        id: object.id,
        x: object.x,
        y: object.y,
      })),
      snapCandidate: null,
    };

    this.viewport.setPointerCapture(event.pointerId);
    this.viewport.classList.add('is-dragging-object');
    event.preventDefault();
  }

  startHoseDraw(event) {
    const pointer = this.screenToWorld(event.clientX, event.clientY);
    const targetObjects = this.store.objects.filter((object) => object.type !== 'hose');
    const startSnapCandidate = findPointSnapCandidate(pointer, targetObjects);
    const start = startSnapCandidate
      ? { x: pointer.x + startSnapCandidate.delta.x, y: pointer.y + startSnapCandidate.delta.y }
      : pointer;
    this.dragState = {
      type: 'hose-draw',
      pointerId: event.pointerId,
      before: this.store.snapshot(),
      points: [start, { ...start }],
      startSnapCandidate,
    };
    this.viewport.setPointerCapture(event.pointerId);
    this.viewport.classList.add('is-drawing-hose');
    this.renderHosePreview(this.dragState.points, startSnapCandidate);
    event.preventDefault();
  }

  startAnnotationDraw(event, annotationType) {
    const point = this.screenToWorld(event.clientX, event.clientY);
    this.dragState = {
      type: 'annotation-draw',
      pointerId: event.pointerId,
      annotationType,
      before: this.store.snapshot(),
      start: point,
      end: { ...point },
      points: [point],
    };
    this.viewport.setPointerCapture(event.pointerId);
    this.viewport.classList.add('is-drawing-annotation');
    this.renderAnnotationPreview(annotationType, point, point);
    event.preventDefault();
  }

  startHosePointDrag(event, pointIndex) {
    const object = this.store.selectedObjects[0];
    if (object?.type !== 'hose') return;
    object.activePointIndex = pointIndex;
    this.store.render();
    this.dragState = {
      type: 'hose-point',
      pointerId: event.pointerId,
      objectId: object.id,
      pointIndex,
      before: this.store.snapshot(),
      points: object.points.map((point) => ({ ...point })),
    };
    this.viewport.setPointerCapture(event.pointerId);
    this.viewport.classList.add('is-transforming');
    event.preventDefault();
  }

  isGroupSelection() {
    const selected = this.store.selectedObjects;
    const groupId = selected[0]?.groupId;
    return selected.length > 1 && Boolean(groupId) && selected.every((object) => object.groupId === groupId);
  }

  startHandleDrag(event, handle, corner) {
    const pointer = this.screenToWorld(event.clientX, event.clientY);

    if (this.isGroupSelection()) {
      const bounds = this.store.getSelectionBounds();
      const selected = this.store.selectedObjects;
      const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
      const groupState = {
        pointerId: event.pointerId,
        before: this.store.snapshot(),
        bounds,
        center,
        objects: selected.map((object) => ({
          id: object.id,
          x: object.x,
          y: object.y,
          width: object.width,
          height: object.height,
          rotation: object.rotation,
          points: object.points?.map((point) => ({ ...point })),
        })),
      };
      if (handle === 'group-rotate') {
        this.dragState = {
          ...groupState,
          type: 'group-rotate',
          startAngle: angleBetween(pointer, center),
        };
      } else {
        const fixedPoint = {
          x: corner.includes('e') ? bounds.x : bounds.x + bounds.width,
          y: corner.includes('s') ? bounds.y : bounds.y + bounds.height,
        };
        this.dragState = {
          ...groupState,
          type: 'group-resize',
          corner,
          fixedPoint,
        };
      }
      this.viewport.setPointerCapture(event.pointerId);
      this.viewport.classList.add('is-transforming');
      event.preventDefault();
      return;
    }

    const object = this.store.selectedObjects[0];

    if (handle === 'rotate') {
      this.dragState = {
        type: 'rotate',
        pointerId: event.pointerId,
        objectId: object.id,
        before: this.store.snapshot(),
        center: {
          x: object.x + object.width / 2,
          y: object.y + object.height / 2,
        },
        startAngle: angleBetween(pointer, {
          x: object.x + object.width / 2,
          y: object.y + object.height / 2,
        }),
        startRotation: object.rotation,
      };
    } else {
      this.dragState = {
        type: 'resize',
        pointerId: event.pointerId,
        objectId: object.id,
        corner,
        before: this.store.snapshot(),
        startObject: { ...object, points: object.points?.map((point) => ({ ...point })) },
        fixedPoint: getRotatedCornerWorldPoint(object, oppositeCorner[corner]),
      };
    }

    this.viewport.setPointerCapture(event.pointerId);
    this.viewport.classList.add('is-transforming');
    event.preventDefault();
  }

  handlePointerMove(event) {
    if (!this.dragState || event.pointerId !== this.dragState.pointerId) return;

    if (this.dragState.type === 'pan') {
      this.view.panX = this.dragState.panX + event.clientX - this.dragState.startX;
      this.view.panY = this.dragState.panY + event.clientY - this.dragState.startY;
      this.render();
      return;
    }

    if (this.dragState.type === 'objects') {
      const deltaX = (event.clientX - this.dragState.startX) / this.view.zoom;
      const deltaY = (event.clientY - this.dragState.startY) / this.view.zoom;
      const selectedIds = new Set(this.dragState.positions.map((position) => position.id));
      const movingObjects = this.dragState.positions
        .map((position) => ({
          ...this.store.getObject(position.id),
          x: position.x + deltaX,
          y: position.y + deltaY,
        }));
      const targetObjects = this.store.objects.filter((object) => !selectedIds.has(object.id));
      const snapCandidate = findSnapCandidate(movingObjects, targetObjects);
      const snapDelta = snapCandidate?.delta ?? { x: 0, y: 0 };
      this.dragState.snapCandidate = snapCandidate;

      this.store.updateObjects(selectedIds, (object) => {
        const original = this.dragState.positions.find((position) => position.id === object.id);
        object.x = original.x + deltaX + snapDelta.x;
        object.y = original.y + deltaY + snapDelta.y;
      });
      this.renderSnapPreview(snapCandidate);
      return;
    }

    if (this.dragState.type === 'hose-draw') {
      const pointer = this.screenToWorld(event.clientX, event.clientY);
      const targetObjects = this.store.objects.filter((object) => object.type !== 'hose');
      const snapCandidate = findPointSnapCandidate(pointer, targetObjects);
      const end = snapCandidate
        ? { x: pointer.x + snapCandidate.delta.x, y: pointer.y + snapCandidate.delta.y }
        : pointer;
      this.dragState.points[1] = end;
      this.dragState.snapCandidate = snapCandidate;
      this.renderHosePreview(this.dragState.points, snapCandidate);
      return;
    }

    if (this.dragState.type === 'annotation-draw') {
      this.dragState.end = this.screenToWorld(event.clientX, event.clientY);
      if (this.dragState.annotationType === 'freehand') {
        const point = this.dragState.end;
        const previous = this.dragState.points.at(-1);
        if (!previous || Math.hypot(point.x - previous.x, point.y - previous.y) >= 2) {
          this.dragState.points.push(point);
        }
      }
      this.renderAnnotationPreview(
        this.dragState.annotationType,
        this.dragState.start,
        this.dragState.end,
        this.dragState.points,
      );
      return;
    }

    if (this.dragState.type === 'hose-point') {
      const pointer = this.screenToWorld(event.clientX, event.clientY);
      const object = this.store.getObject(this.dragState.objectId);
      const targetObjects = this.store.objects.filter((candidate) => candidate.id !== object.id && candidate.type !== 'hose');
      const snapCandidate = this.dragState.pointIndex === 0 || this.dragState.pointIndex === object.points.length - 1
        ? findPointSnapCandidate(pointer, targetObjects)
        : null;
      const nextPoint = snapCandidate
        ? { x: pointer.x + snapCandidate.delta.x, y: pointer.y + snapCandidate.delta.y }
        : pointer;
      const points = this.dragState.points.map((point, index) => (
        index === this.dragState.pointIndex ? nextPoint : point
      ));
      this.dragState.snapCandidate = snapCandidate;
      this.store.updateHose(object.id, points);
      const endpoint = this.dragState.pointIndex === 0 ? 'start' : 'end';
      this.store.updateHoseConnections(object.id, {
        ...object.connections,
        [endpoint]: snapCandidate
          ? { objectId: snapCandidate.targetObjectId, role: snapCandidate.targetPoint.role }
          : null,
      });
      this.renderSnapPreview(snapCandidate);
      return;
    }

    const pointer = this.screenToWorld(event.clientX, event.clientY);
    if (this.dragState.type === 'resize') {
      this.resizeObject(pointer);
      return;
    }

    if (this.dragState.type === 'rotate') {
      this.rotateObject(pointer, event.shiftKey);
      return;
    }

    if (this.dragState.type === 'group-resize') {
      this.resizeGroup(pointer);
      return;
    }

    if (this.dragState.type === 'group-rotate') {
      this.rotateGroup(pointer);
    }
  }

  resizeObject(pointer) {
    const state = this.dragState;
    const startObject = state.startObject;
    const signs = cornerSigns(state.corner);
    const localPointer = inverseRotate({
      x: pointer.x - state.fixedPoint.x,
      y: pointer.y - state.fixedPoint.y,
    }, startObject.rotation);
    const width = Math.max(MIN_OBJECT_SIZE, Math.abs(localPointer.x));
    const height = Math.max(MIN_OBJECT_SIZE, Math.abs(localPointer.y));
    const localCenter = {
      x: signs.x * width / 2,
      y: signs.y * height / 2,
    };
    const center = rotateVector(localCenter, startObject.rotation);
    const nextCenter = {
      x: state.fixedPoint.x + center.x,
      y: state.fixedPoint.y + center.y,
    };

    this.store.updateObjects([startObject.id], (object) => {
      object.width = width;
      object.height = height;
      object.x = nextCenter.x - width / 2;
      object.y = nextCenter.y - height / 2;
      if (object.annotationType === 'freehand' && startObject.points?.length) {
        const scaleX = width / Math.max(1, startObject.width);
        const scaleY = height / Math.max(1, startObject.height);
        object.points = startObject.points.map((point) => ({
          x: object.x + (point.x - startObject.x) * scaleX,
          y: object.y + (point.y - startObject.y) * scaleY,
        }));
      }
    });
  }

  rotateObject(pointer, freeRotation) {
    const state = this.dragState;
    const angle = angleBetween(pointer, state.center);
    let rotation = state.startRotation + angleDifference(angle, state.startAngle) * 180 / Math.PI;

    if (!freeRotation) {
      rotation = Math.round(rotation / ROTATION_SNAP) * ROTATION_SNAP;
    }

    this.store.updateObjects([state.objectId], (object) => {
      object.rotation = rotation;
    });
  }

  resizeGroup(pointer) {
    const state = this.dragState;
    const { bounds, fixedPoint, corner } = state;
    const nextBounds = {
      x: corner.includes('e') ? fixedPoint.x : pointer.x,
      y: corner.includes('s') ? fixedPoint.y : pointer.y,
      width: Math.max(MIN_OBJECT_SIZE, Math.abs(pointer.x - fixedPoint.x)),
      height: Math.max(MIN_OBJECT_SIZE, Math.abs(pointer.y - fixedPoint.y)),
    };
    if (!corner.includes('e')) nextBounds.x = fixedPoint.x - nextBounds.width;
    if (!corner.includes('s')) nextBounds.y = fixedPoint.y - nextBounds.height;
    const scaleX = nextBounds.width / Math.max(1, bounds.width);
    const scaleY = nextBounds.height / Math.max(1, bounds.height);
    const ids = new Set(state.objects.map((object) => object.id));

    this.store.updateObjects(ids, (object) => {
      const original = state.objects.find((candidate) => candidate.id === object.id);
      object.x = nextBounds.x + (original.x - bounds.x) * scaleX;
      object.y = nextBounds.y + (original.y - bounds.y) * scaleY;
      object.width = Math.max(MIN_OBJECT_SIZE, original.width * scaleX);
      object.height = Math.max(MIN_OBJECT_SIZE, original.height * scaleY);
      if (object.annotationType === 'freehand' && original.points?.length) {
        object.points = original.points.map((point) => ({
          x: object.x + (point.x - original.x) * scaleX,
          y: object.y + (point.y - original.y) * scaleY,
        }));
      }
    });
  }

  rotateGroup(pointer) {
    const state = this.dragState;
    const delta = angleDifference(angleBetween(pointer, state.center), state.startAngle) * 180 / Math.PI;
    const radians = delta * Math.PI / 180;
    const ids = new Set(state.objects.map((object) => object.id));
    this.store.updateObjects(ids, (object) => {
      const original = state.objects.find((candidate) => candidate.id === object.id);
      const originalCenter = { x: original.x + original.width / 2, y: original.y + original.height / 2 };
      const offsetX = originalCenter.x - state.center.x;
      const offsetY = originalCenter.y - state.center.y;
      const rotatedCenter = {
        x: state.center.x + offsetX * Math.cos(radians) - offsetY * Math.sin(radians),
        y: state.center.y + offsetX * Math.sin(radians) + offsetY * Math.cos(radians),
      };
      object.x = rotatedCenter.x - original.width / 2;
      object.y = rotatedCenter.y - original.height / 2;
      object.rotation = original.rotation + delta;
    });
  }

  addHoseControlPoint() {
    const object = this.store.selectedObjects[0];
    if (object?.type !== 'hose') return;
    const before = this.store.snapshot();
    const activePointIndex = Number.isInteger(object.activePointIndex)
      ? object.activePointIndex
      : -1;
    const segmentIndex = activePointIndex >= 0 && activePointIndex < object.points.length - 1
      ? activePointIndex
      : Math.max(0, object.points.length - 2);

    const start = object.points[segmentIndex];
    const end = object.points[segmentIndex + 1];
    const points = object.points.map((point) => ({ ...point }));
    points.splice(segmentIndex + 1, 0, {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
    });
    this.store.updateHose(object.id, points);
    object.activePointIndex = segmentIndex + 1;
    this.store.render();
    this.recordHistory(before);
  }

  removeHoseControlPoint() {
    const object = this.store.selectedObjects[0];
    if (object?.type !== 'hose' || object.points.length <= 2) return;
    const before = this.store.snapshot();
    const activePointIndex = Number.isInteger(object.activePointIndex)
      ? object.activePointIndex
      : object.points.length - 2;
    if (activePointIndex <= 0 || activePointIndex >= object.points.length - 1) return;
    const points = object.points
      .filter((_, index) => index !== activePointIndex)
      .map((point) => ({ ...point }));
    this.store.updateHose(object.id, points);
    object.activePointIndex = Math.min(activePointIndex - 1, points.length - 2);
    this.store.render();
    this.recordHistory(before);
  }

  handlePointerUp(event) {
    if (!this.dragState || event.pointerId !== this.dragState.pointerId) return;

    const state = this.dragState;
    this.dragState = null;
    this.viewport.classList.remove('is-panning', 'is-dragging-object', 'is-transforming', 'is-drawing-hose', 'is-drawing-annotation');
    this.clearSnapPreview();
    this.clearHosePreview();

    if (state.type === 'annotation-draw') {
      const distance = Math.hypot(state.end.x - state.start.x, state.end.y - state.start.y);
      if (['text', 'number'].includes(state.annotationType) || distance > 6 || state.points.length > 1) {
        this.store.addAnnotation(state.annotationType, state.start, state.end, {
          text: state.annotationType === 'text'
            ? '文字標註'
            : state.annotationType === 'number'
              ? String(this.store.objects.filter((object) => object.annotationType === 'number').length + 1)
              : '',
          points: state.annotationType === 'freehand' ? state.points : undefined,
        });
      }
      this.clearAnnotationPreview();
      this.recordHistory(state.before);
      return;
    }

    if (state.type === 'hose-draw') {
      const [start, end] = state.points;
      if (Math.hypot(end.x - start.x, end.y - start.y) > 8) {
        this.store.addHose([
          start,
          { x: start.x + (end.x - start.x) / 3, y: start.y + (end.y - start.y) / 3 },
          { x: start.x + (end.x - start.x) * 2 / 3, y: start.y + (end.y - start.y) * 2 / 3 },
          end,
        ], {
          connections: {
            start: state.startSnapCandidate?.targetObjectId
              ? { objectId: state.startSnapCandidate.targetObjectId, role: state.startSnapCandidate.targetPoint.role }
              : null,
            end: state.snapCandidate?.targetObjectId
              ? { objectId: state.snapCandidate.targetObjectId, role: state.snapCandidate.targetPoint.role }
              : null,
          },
        });
      }
      this.recordHistory(state.before);
      return;
    }

    if (state.before) {
      this.recordHistory(state.before);
    }

    if (this.viewport.hasPointerCapture(event.pointerId)) {
      this.viewport.releasePointerCapture(event.pointerId);
    }
  }

  renderAnnotationPreview(annotationType, start, end, points = [start, end]) {
    this.clearAnnotationPreview();
    const preview = document.createElement('div');
    preview.className = 'annotation-preview';
    preview.setAttribute('aria-hidden', 'true');
    const bounds = {
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      width: Math.max(1, Math.abs(end.x - start.x)),
      height: Math.max(1, Math.abs(end.y - start.y)),
    };
    if (annotationType === 'freehand' && points.length) {
      const xs = points.map((point) => point.x);
      const ys = points.map((point) => point.y);
      bounds.x = Math.min(...xs);
      bounds.y = Math.min(...ys);
      bounds.width = Math.max(1, Math.max(...xs) - bounds.x);
      bounds.height = Math.max(1, Math.max(...ys) - bounds.y);
    }
    if (['text', 'number'].includes(annotationType)) {
      bounds.x = start.x;
      bounds.y = start.y;
      bounds.width = annotationType === 'number' ? 34 : 150;
      bounds.height = annotationType === 'number' ? 34 : 32;
    }
    preview.style.left = `${bounds.x}px`;
    preview.style.top = `${bounds.y}px`;
    preview.style.width = `${bounds.width}px`;
    preview.style.height = `${bounds.height}px`;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const x1 = start.x - bounds.x;
    const y1 = start.y - bounds.y;
    const x2 = end.x - bounds.x;
    const y2 = end.y - bounds.y;
    if (annotationType === 'freehand') {
      path.setAttribute('d', points.map((point, index) => `${index ? 'L' : 'M'} ${point.x - bounds.x} ${point.y - bounds.y}`).join(' '));
    } else if (annotationType === 'arrow' || annotationType === 'line') {
      path.setAttribute('d', `M ${x1} ${y1} L ${x2} ${y2}`);
    } else if (annotationType === 'rectangle') {
      path.setAttribute('d', `M 0 0 H ${bounds.width} V ${bounds.height} H 0 Z`);
    } else if (annotationType === 'circle') {
      path.setAttribute('d', `M ${bounds.width / 2} 0 A ${bounds.width / 2} ${bounds.height / 2} 0 1 1 ${bounds.width / 2} ${bounds.height} A ${bounds.width / 2} ${bounds.height / 2} 0 1 1 ${bounds.width / 2} 0`);
    }
    path.setAttribute('fill', 'rgba(83, 170, 139, .08)');
    path.setAttribute('stroke', '#356f66');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-dasharray', '5 4');
    if (['text', 'number'].includes(annotationType)) {
      path.setAttribute('d', annotationType === 'number'
        ? 'M 17 2 A 15 15 0 1 1 16.9 2'
        : 'M 0 26 H 150');
    }
    svg.appendChild(path);
    preview.appendChild(svg);
    this.scene.appendChild(preview);
  }

  clearAnnotationPreview() {
    this.scene.querySelector('.annotation-preview')?.remove();
  }

  renderHosePreview(points, snapCandidate = null) {
    this.scene.querySelector('.hose-preview')?.remove();
    const [start, end] = points;
    const controlOne = {
      x: start.x + (end.x - start.x) / 3,
      y: start.y + (end.y - start.y) / 3,
    };
    const controlTwo = {
      x: start.x + (end.x - start.x) * 2 / 3,
      y: start.y + (end.y - start.y) * 2 / 3,
    };
    const preview = document.createElement('div');
    preview.className = 'hose-preview';
    preview.setAttribute('aria-hidden', 'true');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 1000 600');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${start.x} ${start.y} C ${controlOne.x} ${controlOne.y}, ${controlTwo.x} ${controlTwo.y}, ${end.x} ${end.y}`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#8b5e3c');
    path.setAttribute('stroke-width', '8');
    path.setAttribute('stroke-linecap', 'round');
    svg.appendChild(path);
    preview.appendChild(svg);
    this.scene.appendChild(preview);
    this.renderSnapPreview(snapCandidate);
  }

  clearHosePreview() {
    this.scene.querySelector('.hose-preview')?.remove();
  }

  renderSnapPreview(candidate) {
    this.clearSnapPreview(false);
    if (!candidate) return;

    const preview = document.createElement('div');
    preview.className = 'snap-preview';
    preview.setAttribute('aria-hidden', 'true');

    const line = document.createElement('span');
    line.className = 'snap-preview-line';
    const distance = Math.hypot(
      candidate.targetPoint.x - candidate.sourcePoint.x,
      candidate.targetPoint.y - candidate.sourcePoint.y,
    );
    line.style.left = `${candidate.sourcePoint.x}px`;
    line.style.top = `${candidate.sourcePoint.y}px`;
    line.style.width = `${distance}px`;
    line.style.transform = `rotate(${Math.atan2(
      candidate.targetPoint.y - candidate.sourcePoint.y,
      candidate.targetPoint.x - candidate.sourcePoint.x,
    ) * 180 / Math.PI}deg)`;

    const sourceDot = document.createElement('span');
    sourceDot.className = 'snap-preview-dot snap-preview-source';
    sourceDot.style.left = `${candidate.sourcePoint.x}px`;
    sourceDot.style.top = `${candidate.sourcePoint.y}px`;

    const targetDot = document.createElement('span');
    targetDot.className = 'snap-preview-dot snap-preview-target';
    targetDot.style.left = `${candidate.targetPoint.x}px`;
    targetDot.style.top = `${candidate.targetPoint.y}px`;

    preview.append(line, sourceDot, targetDot);
    this.scene.appendChild(preview);
    this.dispatchEvent(new CustomEvent('snapchange', { detail: { active: true, candidate } }));
  }

  clearSnapPreview(emit = true) {
    this.scene.querySelector('.snap-preview')?.remove();
    if (emit) {
      this.dispatchEvent(new CustomEvent('snapchange', { detail: { active: false } }));
    }
  }

  handleWheel(event) {
    event.preventDefault();
    const bounds = this.viewport.getBoundingClientRect();
    const pointerX = event.clientX - bounds.left;
    const pointerY = event.clientY - bounds.top;
    const zoomFactor = Math.exp(-event.deltaY * 0.0015);
    const nextZoom = clamp(this.view.zoom * zoomFactor, MIN_ZOOM, MAX_ZOOM);
    const worldX = (pointerX - this.view.panX) / this.view.zoom;
    const worldY = (pointerY - this.view.panY) / this.view.zoom;

    this.view.zoom = nextZoom;
    this.view.panX = pointerX - worldX * nextZoom;
    this.view.panY = pointerY - worldY * nextZoom;
    this.render();
  }

  handleKeydown(event) {
    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      this.zoomBy(1.2);
    }
    if (event.key === '-' || event.key === '_') {
      event.preventDefault();
      this.zoomBy(1 / 1.2);
    }
  }

  zoomBy(factor) {
    const bounds = this.viewport.getBoundingClientRect();
    const centerX = bounds.width / 2;
    const centerY = bounds.height / 2;
    const nextZoom = clamp(this.view.zoom * factor, MIN_ZOOM, MAX_ZOOM);
    const worldX = (centerX - this.view.panX) / this.view.zoom;
    const worldY = (centerY - this.view.panY) / this.view.zoom;

    this.view.zoom = nextZoom;
    this.view.panX = centerX - worldX * nextZoom;
    this.view.panY = centerY - worldY * nextZoom;
    this.render();
  }

  resetView() {
    const bounds = this.viewport.getBoundingClientRect();
    this.view = {
      zoom: 1,
      panX: bounds.width / 2,
      panY: bounds.height / 2,
    };
    this.render();
  }

  screenToWorld(clientX, clientY) {
    const bounds = this.viewport.getBoundingClientRect();
    return {
      x: (clientX - bounds.left - this.view.panX) / this.view.zoom,
      y: (clientY - bounds.top - this.view.panY) / this.view.zoom,
    };
  }

  render() {
    const gridSize = BASE_GRID_SIZE * this.view.zoom;
    const offsetX = ((this.view.panX % gridSize) + gridSize) % gridSize;
    const offsetY = ((this.view.panY % gridSize) + gridSize) % gridSize;

    this.scene.style.transform = `translate3d(${this.view.panX}px, ${this.view.panY}px, 0) scale(${this.view.zoom})`;
    this.viewport.style.setProperty('--grid-size', `${gridSize}px`);
    this.viewport.style.setProperty('--grid-offset-x', `${offsetX}px`);
    this.viewport.style.setProperty('--grid-offset-y', `${offsetY}px`);
    this.dispatchEvent(new CustomEvent('viewchange', { detail: this.view }));
  }

  recordHistory(before) {
    const after = this.store.snapshot();
    if (snapshotsEqual(before, after)) return;

    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push({ before, after });
    this.historyIndex += 1;
    this.emitHistoryChange();
  }

  emitHistoryChange() {
    this.dispatchEvent(new CustomEvent('historychange', {
      detail: {
        canUndo: this.canUndo,
        canRedo: this.canRedo,
      },
    }));
  }
}
