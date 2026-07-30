import {
  SceneStore,
  getRotatedCornerWorldPoint,
  inverseRotate,
  parseSvgAsset,
  rotateVector,
} from './scene-store.js';

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
    const bounds = this.viewport.getBoundingClientRect();
    const center = this.screenToWorld(bounds.width / 2, bounds.height / 2);
    const before = this.store.snapshot();

    this.store.addSvg(asset, {
      x: center.x - asset.width / 2,
      y: center.y - asset.height / 2,
    });

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
    const objectElement = target?.closest('.canvas-object');

    if (event.button === 0 && handle && this.store.selectedObjects.length === 1) {
      this.startHandleDrag(event, handle.dataset.handle, handle.dataset.corner);
      return;
    }

    if (event.button === 0 && objectElement && this.tool === 'select') {
      const id = objectElement.dataset.objectId;
      const wasSelected = this.store.selectedIds.has(id);
      this.store.select(id, event.shiftKey);

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
    };

    this.viewport.setPointerCapture(event.pointerId);
    this.viewport.classList.add('is-dragging-object');
    event.preventDefault();
  }

  startHandleDrag(event, handle, corner) {
    const object = this.store.selectedObjects[0];
    const pointer = this.screenToWorld(event.clientX, event.clientY);

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
        startObject: { ...object },
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

      this.store.updateObjects(
        this.dragState.positions.map((position) => position.id),
        (object) => {
          const original = this.dragState.positions.find((position) => position.id === object.id);
          object.x = original.x + deltaX;
          object.y = original.y + deltaY;
        },
      );
      return;
    }

    const pointer = this.screenToWorld(event.clientX, event.clientY);
    if (this.dragState.type === 'resize') {
      this.resizeObject(pointer);
      return;
    }

    if (this.dragState.type === 'rotate') {
      this.rotateObject(pointer, event.shiftKey);
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

  handlePointerUp(event) {
    if (!this.dragState || event.pointerId !== this.dragState.pointerId) return;

    const state = this.dragState;
    this.dragState = null;
    this.viewport.classList.remove('is-panning', 'is-dragging-object', 'is-transforming');

    if (state.before) {
      this.recordHistory(state.before);
    }

    if (this.viewport.hasPointerCapture(event.pointerId)) {
      this.viewport.releasePointerCapture(event.pointerId);
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
