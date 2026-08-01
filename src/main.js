import './styles.css';
import { CanvasController } from './canvas/canvas-controller.js';
import { SceneStore } from './canvas/scene-store.js';
import {
  equipmentCatalog,
  equipmentCategories,
  equipmentCategoryIcons,
  getEquipmentById,
} from './equipment/equipment-catalog.js';

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
const equipmentSearch = document.querySelector('#equipmentSearch');
const equipmentCategoriesElement = document.querySelector('#equipmentCategories');
const equipmentCategoryLabel = document.querySelector('#equipmentCategoryLabel');
const equipmentCategoryCount = document.querySelector('#equipmentCategoryCount');
const equipmentList = document.querySelector('#equipmentList');

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

const equipmentMetadata = (item) => ({
  sourceId: item.id,
  name: item.name,
  category: item.category,
});

let activeEquipmentCategory = 'all';

const renderEquipmentCategories = () => {
  equipmentCategoriesElement.replaceChildren();

  equipmentCategories.forEach((category) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'equipment-category-button';
    button.classList.toggle('is-active', category.id === activeEquipmentCategory);
    button.innerHTML = `
      <span class="equipment-category-main">
        <span class="equipment-category-icon">${equipmentCategoryIcons[category.id]}</span>
        <span>${category.label}</span>
      </span>
      <span class="equipment-category-trailing">
        <span>${category.id === 'all' ? equipmentCatalog.length : equipmentCatalog.filter((item) => item.category === category.id).length}</span>
        <span class="equipment-category-chevron" aria-hidden="true">›</span>
      </span>
    `;
    button.addEventListener('click', () => {
      activeEquipmentCategory = category.id;
      if (category.id === 'all') equipmentSearch.value = '';
      renderEquipmentCategories();
      renderEquipmentList();
    });
    equipmentCategoriesElement.appendChild(button);
  });
};

const renderEquipmentList = () => {
  const query = equipmentSearch.value.trim().toLowerCase();
  const filtered = equipmentCatalog.filter((item) => {
    const matchesCategory = activeEquipmentCategory === 'all'
      || item.category === activeEquipmentCategory;
    const matchesQuery = !query
      || item.name.toLowerCase().includes(query)
      || item.description.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });

  const activeCategory = equipmentCategories.find((category) => category.id === activeEquipmentCategory);
  equipmentCategoryLabel.textContent = query
    ? `搜尋結果${activeCategory && activeCategory.id !== 'all' ? ` · ${activeCategory.label}` : ''}`
    : activeCategory?.label ?? '全部器材';
  equipmentCategoryCount.textContent = String(filtered.length);
  equipmentList.replaceChildren();

  if (!filtered.length) {
    const empty = document.createElement('p');
    empty.className = 'equipment-list-empty';
    empty.textContent = '找不到符合的器材';
    equipmentList.appendChild(empty);
    return;
  }

  filtered.forEach((item) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'equipment-card';
    card.draggable = true;
    card.dataset.equipmentId = item.id;
    card.innerHTML = `
      <span class="equipment-preview" aria-hidden="true">${item.svg}</span>
      <span class="equipment-card-copy">
        <strong>${item.name}</strong>
        <small>${item.description}</small>
      </span>
      <span class="equipment-add-icon" aria-hidden="true">＋</span>
    `;

    card.addEventListener('click', () => {
      canvasController.addSvgMarkup(item.svg, equipmentMetadata(item));
      canvasHint.textContent = `${item.name} 已加入畫布 · 拖曳物件調整位置`;
    });

    card.addEventListener('dragstart', (event) => {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('application/x-chem-lab-equipment', item.id);
    });

    equipmentList.appendChild(card);
  });
};

canvasController.addEventListener('viewchange', (event) => {
  updateViewReadouts(event.detail);
});

canvasController.addEventListener('snapchange', ({ detail }) => {
  if (detail.active) {
    canvasHint.textContent = '已偵測到吸附接點，放開滑鼠即可完成對位。';
  }
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

equipmentSearch.addEventListener('input', renderEquipmentList);

viewport.addEventListener('dragover', (event) => {
  if (!event.dataTransfer.types.includes('application/x-chem-lab-equipment')) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
  viewport.classList.add('is-drop-target');
});

viewport.addEventListener('dragleave', () => {
  viewport.classList.remove('is-drop-target');
});

viewport.addEventListener('drop', (event) => {
  event.preventDefault();
  viewport.classList.remove('is-drop-target');

  const equipmentId = event.dataTransfer.getData('application/x-chem-lab-equipment');
  const item = getEquipmentById(equipmentId);
  if (!item) return;

  canvasController.addSvgMarkup(item.svg, equipmentMetadata(item), {
    x: event.clientX,
    y: event.clientY,
  });
  canvasHint.textContent = `${item.name} 已放置 · 拖曳物件調整位置`;
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
equipmentSearch.value = '';
renderEquipmentCategories();
renderEquipmentList();
