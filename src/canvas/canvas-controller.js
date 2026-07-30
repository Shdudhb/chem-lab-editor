const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
const BASE_GRID_SIZE = 20;

const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);

export class CanvasController extends EventTarget {
  constructor(viewport) {
    super();
    this.viewport = viewport;
    this.scene = viewport.querySelector('#canvasScene');
    this.tool = 'select';
    this.view = { zoom: 1, panX: 0, panY: 0 };
    this.dragState = null;
    this.resizeObserver = new ResizeObserver(() => this.render());

    this.bindEvents();
    this.resizeObserver.observe(this.viewport);
    this.resetView();
  }

  bindEvents() {
    this.viewport.addEventListener('pointerdown', (event) => this.startPan(event));
    this.viewport.addEventListener('pointermove', (event) => this.movePan(event));
    this.viewport.addEventListener('pointerup', (event) => this.endPan(event));
    this.viewport.addEventListener('pointercancel', (event) => this.endPan(event));
    this.viewport.addEventListener('wheel', (event) => this.handleWheel(event), { passive: false });
    this.viewport.addEventListener('keydown', (event) => this.handleKeydown(event));
  }

  setTool(tool) {
    this.tool = tool;
    this.viewport.classList.toggle('is-pan-tool', tool === 'pan');
  }

  startPan(event) {
    const isPrimaryPointer = event.button === 0;
    const isMiddlePointer = event.button === 1;
    const shouldPan = isMiddlePointer || isPrimaryPointer;

    if (!shouldPan) return;

    this.dragState = {
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

  movePan(event) {
    if (!this.dragState || event.pointerId !== this.dragState.pointerId) return;

    this.view.panX = this.dragState.panX + event.clientX - this.dragState.startX;
    this.view.panY = this.dragState.panY + event.clientY - this.dragState.startY;
    this.render();
  }

  endPan(event) {
    if (!this.dragState || event.pointerId !== this.dragState.pointerId) return;

    this.dragState = null;
    this.viewport.classList.remove('is-panning');
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
}
