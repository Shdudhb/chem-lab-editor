import './styles.css';
import { CanvasController } from './canvas/canvas-controller.js';

const viewport = document.querySelector('#canvasViewport');
const zoomReadout = document.querySelector('#zoomReadout');
const coordinatesReadout = document.querySelector('#coordinatesReadout');
const canvasHint = document.querySelector('#canvasHint');
const canvasController = new CanvasController(viewport);

const updateViewReadouts = ({ zoom, panX, panY }) => {
  zoomReadout.textContent = `${Math.round(zoom * 100)}%`;
  const viewportCenterX = viewport.clientWidth / 2;
  const viewportCenterY = viewport.clientHeight / 2;
  const worldCenterX = (viewportCenterX - panX) / zoom;
  const worldCenterY = (viewportCenterY - panY) / zoom;
  coordinatesReadout.textContent = `X ${Math.round(worldCenterX)} · Y ${Math.round(worldCenterY)}`;
};

canvasController.addEventListener('viewchange', (event) => {
  updateViewReadouts(event.detail);
});

document.querySelector('[data-action="zoom-in"]').addEventListener('click', () => {
  canvasController.zoomBy(1.2);
});

document.querySelector('[data-action="zoom-out"]').addEventListener('click', () => {
  canvasController.zoomBy(1 / 1.2);
});

document.querySelector('[data-action="reset-view"]').addEventListener('click', () => {
  canvasController.resetView();
});

document.querySelectorAll('[data-tool]').forEach((button) => {
  button.addEventListener('click', () => {
    const tool = button.dataset.tool;
    document.querySelectorAll('[data-tool]').forEach((candidate) => {
      const isActive = candidate === button;
      candidate.classList.toggle('is-active', isActive);
      candidate.setAttribute('aria-pressed', String(isActive));
    });
    canvasController.setTool(tool);
    canvasHint.textContent = tool === 'pan'
      ? '拖曳畫布以平移 · 滾輪縮放'
      : '拖曳空白處以平移 · 滾輪縮放';
  });
});

window.addEventListener('keydown', (event) => {
  if (event.key === '0' && !event.metaKey && !event.ctrlKey) {
    canvasController.resetView();
  }
});

updateViewReadouts(canvasController.view);
