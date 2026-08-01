import './styles.css';
import { CanvasController } from './canvas/canvas-controller.js';
import { SceneStore } from './canvas/scene-store.js';
import { exportScene } from './export/exporter.js';
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
const hoseControls = document.querySelector('#hoseControls');
const hoseStyleControls = document.querySelector('#hoseStyleControls');
const hoseColor = document.querySelector('#hoseColor');
const hoseWidth = document.querySelector('#hoseWidth');
const hoseWidthValue = document.querySelector('#hoseWidthValue');
const liquidControls = document.querySelector('#liquidControls');
const liquidLevel = document.querySelector('#liquidLevel');
const liquidLevelValue = document.querySelector('#liquidLevelValue');
const liquidColor = document.querySelector('#liquidColor');
const liquidOpacity = document.querySelector('#liquidOpacity');
const liquidOpacityValue = document.querySelector('#liquidOpacityValue');
const annotationControls = document.querySelector('#annotationControls');
const annotationText = document.querySelector('#annotationText');
const selectionCount = document.querySelector('#selectionCount');
const selectionDimensions = document.querySelector('#selectionDimensions');
const selectionRotation = document.querySelector('#selectionRotation');
const objectLayerCount = document.querySelector('#objectLayerCount');
const equipmentSearch = document.querySelector('#equipmentSearch');
const equipmentCategoriesElement = document.querySelector('#equipmentCategories');
const equipmentCategoryLabel = document.querySelector('#equipmentCategoryLabel');
const equipmentCategoryCount = document.querySelector('#equipmentCategoryCount');
const equipmentList = document.querySelector('#equipmentList');
const layerSearch = document.querySelector('#layerSearch');
const layerList = document.querySelector('#layerList');
const exportDialog = document.querySelector('#exportDialog');
const exportForm = document.querySelector('#exportForm');
const exportFormat = document.querySelector('#exportFormat');
const exportScale = document.querySelector('#exportScale');
const exportTransparent = document.querySelector('#exportTransparent');
const exportScaleControl = document.querySelector('#exportScaleControl');

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
  hoseControls.hidden = !(selectedCount === 1 && selectedObjects[0]?.type === 'hose');
  hoseStyleControls.hidden = !(selectedCount === 1 && selectedObjects[0]?.type === 'hose');
  liquidControls.hidden = !(selectedCount === 1 && selectedObjects[0]?.type === 'svg');
  annotationControls.hidden = !(selectedCount === 1 && selectedObjects[0]?.type === 'annotation');
  objectLayerCount.textContent = `${sceneStore.objects.length} 個物件`;

  if (!hasSelection) return;

  const selectedType = selectedCount === 1
    ? ({ hose: '橡膠軟管', annotation: '標註', svg: 'SVG 物件' }[selectedObjects[0].type] ?? '物件')
    : '物件';
  selectionCount.textContent = selectedCount === 1
    ? `已選取 1 個${selectedType}`
    : `已選取 ${selectedCount} 個物件`;

  if (selectedCount === 1) {
    const [object] = selectedObjects;
    selectionDimensions.textContent = `${Math.round(object.width)} × ${Math.round(object.height)} px`;
    selectionRotation.textContent = `${Math.round(object.rotation)}°`;
    hoseColor.value = object.type === 'hose' ? object.color : '#8b5e3c';
    hoseWidth.value = object.type === 'hose' ? String(object.strokeWidth) : '8';
    hoseWidthValue.textContent = `${hoseWidth.value} px`;
    const liquid = object.liquid ?? { level: 0, color: '#67aee8', opacity: 0 };
    liquidLevel.value = String(liquid.level);
    liquidLevelValue.textContent = `${liquid.level}%`;
    liquidColor.value = liquid.color;
    liquidOpacity.value = String(Math.round(liquid.opacity * 100));
    liquidOpacityValue.textContent = `${Math.round(liquid.opacity * 100)}%`;
    annotationText.value = object.type === 'annotation' ? object.text : '';
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
let layerQuery = '';

const layerTypeLabel = (object) => {
  if (object.type === 'hose') return '軟管';
  if (object.type === 'annotation') return object.annotationType === 'number' ? '編號' : '標註';
  return object.name ?? '器材';
};

const withLayerHistory = (callback) => {
  const before = sceneStore.snapshot();
  callback();
  canvasController.recordHistory(before);
};

const renderLayers = () => {
  const query = layerQuery.trim().toLowerCase();
  const objects = [...sceneStore.objects].reverse().filter((object) => {
    const label = `${object.name ?? ''} ${layerTypeLabel(object)}`.toLowerCase();
    return !query || label.includes(query);
  });
  layerList.replaceChildren();

  if (!objects.length) {
    const empty = document.createElement('p');
    empty.className = 'layer-list-empty';
    empty.textContent = '找不到圖層';
    layerList.appendChild(empty);
    return;
  }

  objects.forEach((object) => {
    const row = document.createElement('div');
    row.className = 'layer-row';
    row.classList.toggle('is-current', sceneStore.selectedIds.has(object.id));
    row.classList.toggle('is-hidden', object.visible === false);
    row.classList.toggle('is-locked', object.locked === true);
    row.dataset.objectId = object.id;
    row.addEventListener('click', (event) => {
      if (event.target.closest('button, input')) return;
      sceneStore.select(object.id, event.shiftKey);
    });

    const visibility = document.createElement('button');
    visibility.className = 'layer-action';
    visibility.type = 'button';
    visibility.textContent = object.visible === false ? '○' : '◉';
    visibility.setAttribute('aria-label', object.visible === false ? '顯示圖層' : '隱藏圖層');
    visibility.addEventListener('click', (event) => {
      event.stopPropagation();
      withLayerHistory(() => sceneStore.setVisibility(object.id, object.visible === false));
    });

    const swatch = document.createElement('span');
    swatch.className = 'layer-swatch';

    const name = document.createElement('input');
    name.className = 'layer-name';
    name.type = 'text';
    name.value = object.name ?? layerTypeLabel(object);
    name.title = '重新命名圖層';
    name.addEventListener('click', (event) => event.stopPropagation());
    name.addEventListener('change', () => withLayerHistory(() => sceneStore.renameObject(object.id, name.value)));

    const meta = document.createElement('span');
    meta.className = 'layer-meta';
    meta.textContent = object.groupId ? '群組' : layerTypeLabel(object);

    const up = document.createElement('button');
    up.className = 'layer-action';
    up.type = 'button';
    up.textContent = '↑';
    up.setAttribute('aria-label', '圖層上移');
    up.addEventListener('click', (event) => {
      event.stopPropagation();
      withLayerHistory(() => sceneStore.reorderObject(object.id, 'up'));
    });

    const down = document.createElement('button');
    down.className = 'layer-action';
    down.type = 'button';
    down.textContent = '↓';
    down.setAttribute('aria-label', '圖層下移');
    down.addEventListener('click', (event) => {
      event.stopPropagation();
      withLayerHistory(() => sceneStore.reorderObject(object.id, 'down'));
    });

    const lock = document.createElement('button');
    lock.className = 'layer-action';
    lock.type = 'button';
    lock.textContent = object.locked ? '🔒' : '⌑';
    lock.setAttribute('aria-label', object.locked ? '解除鎖定' : '鎖定圖層');
    lock.addEventListener('click', (event) => {
      event.stopPropagation();
      withLayerHistory(() => sceneStore.setLocked(object.id, !object.locked));
    });

    row.append(visibility, swatch, name, meta, up, down, lock);
    layerList.appendChild(row);
  });
};

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
  renderLayers();
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

document.querySelector('[data-action="add-hose-point"]').addEventListener('click', () => {
  canvasController.addHoseControlPoint();
});

document.querySelector('[data-action="remove-hose-point"]').addEventListener('click', () => {
  canvasController.removeHoseControlPoint();
});

const updateSelectedHoseStyle = (patch) => {
  const object = sceneStore.selectedObjects[0];
  if (sceneStore.selectedObjects.length !== 1 || object?.type !== 'hose') return;
  const before = sceneStore.snapshot();
  sceneStore.updateHoseStyle(object.id, {
    color: object.color,
    strokeWidth: object.strokeWidth,
    ...patch,
  });
  canvasController.recordHistory(before);
};

hoseColor.addEventListener('input', () => {
  updateSelectedHoseStyle({ color: hoseColor.value });
});

hoseWidth.addEventListener('input', () => {
  hoseWidthValue.textContent = `${hoseWidth.value} px`;
  updateSelectedHoseStyle({ strokeWidth: Number(hoseWidth.value) });
});

document.querySelector('[data-action="group-selection"]').addEventListener('click', () => {
  withLayerHistory(() => sceneStore.groupSelected());
});

document.querySelector('[data-action="ungroup-selection"]').addEventListener('click', () => {
  withLayerHistory(() => sceneStore.ungroupSelected());
});

layerSearch.addEventListener('input', () => {
  layerQuery = layerSearch.value;
  renderLayers();
});

document.querySelector('[data-action="open-export"]').addEventListener('click', () => {
  exportDialog.showModal();
});

exportFormat.addEventListener('change', () => {
  exportScaleControl.hidden = exportFormat.value === 'svg';
  exportTransparent.disabled = exportFormat.value === 'jpg';
});

exportForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submit = document.querySelector('#exportSubmit');
  submit.disabled = true;
  try {
    await exportScene(sceneStore.objects, {
      format: exportFormat.value,
      scale: Number(exportScale.value),
      transparent: exportTransparent.checked,
    });
    exportDialog.close();
    canvasHint.textContent = `已匯出 ${exportFormat.value.toUpperCase()} 圖稿。`;
  } catch (error) {
    canvasHint.textContent = `匯出失敗：${error.message}`;
  } finally {
    submit.disabled = false;
  }
});

const updateSelectedLiquid = (patch) => {
  const object = sceneStore.selectedObjects[0];
  if (sceneStore.selectedObjects.length !== 1 || object?.type !== 'svg') return;
  const before = sceneStore.snapshot();
  sceneStore.updateLiquid(object.id, {
    level: object.liquid?.level ?? 0,
    color: object.liquid?.color ?? '#67aee8',
    opacity: object.liquid?.opacity ?? 0,
    ...patch,
  });
  canvasController.recordHistory(before);
};

liquidLevel.addEventListener('input', () => {
  liquidLevelValue.textContent = `${liquidLevel.value}%`;
  updateSelectedLiquid({ level: Number(liquidLevel.value) });
});

liquidColor.addEventListener('input', () => {
  updateSelectedLiquid({ color: liquidColor.value });
});

liquidOpacity.addEventListener('input', () => {
  liquidOpacityValue.textContent = `${liquidOpacity.value}%`;
  updateSelectedLiquid({ opacity: Number(liquidOpacity.value) / 100 });
});

annotationText.addEventListener('input', () => {
  const object = sceneStore.selectedObjects[0];
  if (sceneStore.selectedObjects.length !== 1 || object?.type !== 'annotation') return;
  const before = sceneStore.snapshot();
  sceneStore.updateAnnotationText(object.id, annotationText.value);
  canvasController.recordHistory(before);
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
      : tool === 'hose'
        ? '拖曳建立橡膠軟管，端點靠近器材接點時會自動吸附。'
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
renderLayers();
