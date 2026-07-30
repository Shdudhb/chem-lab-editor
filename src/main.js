import './styles.css';
import { CanvasController } from './canvas/canvas-controller.js';
import { SceneStore } from './canvas/scene-store.js';

const viewport = document.querySelector('#canvasViewport');
const scene = document.querySelector('#canvasScene');
const zoomReadout = document.querySelector('#zoomReadout');
const coordinatesReadout = document.querySelector('#coordinatesReadout');
const canvasHint = document.querySelector('#canvasHint');
const fileInput = document.querySelector('#svgFileInput');
const importButton = document.querySelector('[data-action="import-svg"]');
const undoButton = document.querySelector('[data-action="undo"]');
const redoButton = document.querySelector('[data-action="redo"]');
const propertyEmptyState = document.querySelector('#propertyEmptyState');
const propertySelectionState = document.querySelector('#propertySelectionState');
const selectionCount = document.querySelector('#selectionCount');
const selectionDimensions = document.querySelector('#selectionDimensions');
const selectionRotation = document.querySelector('#selectionRotation');
const objectLayerCount = document.querySelector('#objectLayerCount');

const sceneStore = new SceneStore(scene);
const canvasController = new CanvasController(viewport, sceneStore);

const updateViewReadouts = ({ zoom, panX, panY }) => {
  zoomReadout.textContent = `${Math.round(zoom * 100)}%`;
  const viewportCenterX = viewport.clientWidth / 2;
  const viewportCenterY = viewport.clientHeight / 2;
  const worldCenterX = (viewportCenterX - panX) / zoom;
  const worldCenterY = (viewportCenterY - panY) / zoom;
  coordinatesReadout.textContent = `X ${Math.round(worldCenterX)} · Y ${Math.round(worldCenterY)}`;
};

const updateSelectionPanel = ({ selectedObjects }) => {
  const selectedCount = selectedObjects.length;
  const hasSelection = selectedCount > 0;
  propertyEmptyState.hidden = hasSelection;
  propertySelectionState.hidden = !hasSelection;
  objectLayerCount.textContent = `${sceneStore.objects.length} 個物件`;

  if (!hasSelection) return;

  selectionCount.textContent = selectedCount === 1
    ? '已選取 1 個 SVG 物件'
    : `已選取 ${selectedCount} 個 SVG 物件`;

  if (selectedCount === 1) {
    const [object] = selectedObjects;
    selectionDimensions.textContent = `${Math.round(object.width)} × ${Math.round(object.height)} px`;
    selectionRotation.textContent = `${Math.round(object.rotation)}°`;
  } else {
    const bounds = sceneStore.getSelectionBounds();
    selectionDimensions.textContent = `${Math.round(bounds.width)} × ${Math.round(bounds.height)} px`;
    selectionRotation.textContent = '—';
  }
};

const updateHistoryButtons = ({ canUndo, canRedo }) => {
  undoButton.disabled = !canUndo;
  redoButton.disabled = !canRedo;
};

canvasController.addEventListener('viewchange', (event) => {
  updateViewReadouts(event.detail);
});

sceneStore.addEventListener('change', (event) => {
  updateSelectionPanel(event.detail);
});

canvasController.addEventListener('historychange', (event) => {
  updateHistoryButtons(event.detail);
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

importButton.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async () => {
  const [file] = fileInput.files;
  if (!file) return;

  try {
    canvasController.importSvg(await file.text());
    canvasHint.textContent = 'SVG 已匯入 · 拖曳移動 · 拖曳控制點縮放或旋轉';
  } catch (error) {
    canvasHint.textContent = error.message;
  } finally {
    fileInput.value = '';
  }
});

undoButton.addEventListener('click', () => canvasController.undo());
redoButton.addEventListener('click', () => canvasController.redo());

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
      : '點擊 SVG 選取 · Shift 多選 · 拖曳移動';
  });
});

window.addEventListener('keydown', (event) => {
  const isModifierPressed = event.metaKey || event.ctrlKey;
  const key = event.key.toLowerCase();

  if (isModifierPressed && key === 'z' && !event.shiftKey) {
    event.preventDefault();
    canvasController.undo();
    return;
  }

  if (isModifierPressed && (key === 'y' || (key === 'z' && event.shiftKey))) {
    event.preventDefault();
    canvasController.redo();
    return;
  }

  if (event.key === '0' && !isModifierPressed) {
    canvasController.resetView();
  }
});

updateViewReadouts(canvasController.view);
updateSelectionPanel({ selectedObjects: [] });
updateHistoryButtons({ canUndo: false, canRedo: false });
