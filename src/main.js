import './styles.css';
import { CanvasController } from './canvas/canvas-controller.js';
import { SceneStore } from './canvas/scene-store.js';
import { exportScene } from './export/exporter.js';
import { createSceneStorage, parseScene, serializeScene } from './storage/scene-storage.js';
import { createEquipmentUserStore } from './equipment/equipment-user-store.js';
import {
  equipmentCatalog,
  equipmentCategories,
  equipmentCategoryIcons,
} from './equipment/equipment-catalog.js';

const viewport = document.querySelector('#canvasViewport');
const scene = document.querySelector('#canvasScene');
const zoomReadout = document.querySelector('#zoomReadout');
const coordinatesReadout = document.querySelector('#coordinatesReadout');
const renderReadout = document.querySelector('#renderReadout');
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
const liquidLayers = document.querySelector('#liquidLayers');
const addLiquidLayerButton = document.querySelector('#addLiquidLayer');
const annotationControls = document.querySelector('#annotationControls');
const annotationText = document.querySelector('#annotationText');
const annotationColor = document.querySelector('#annotationColor');
const annotationWidth = document.querySelector('#annotationWidth');
const annotationWidthValue = document.querySelector('#annotationWidthValue');
const annotationFontSize = document.querySelector('#annotationFontSize');
const annotationFontSizeValue = document.querySelector('#annotationFontSizeValue');
const annotationFontFamily = document.querySelector('#annotationFontFamily');
const annotationArrowStyle = document.querySelector('#annotationArrowStyle');
const annotationFontSizeControl = document.querySelector('#annotationFontSizeControl');
const annotationFontFamilyControl = document.querySelector('#annotationFontFamilyControl');
const annotationArrowStyleControl = document.querySelector('#annotationArrowStyleControl');
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
const saveSceneButton = document.querySelector('#saveSceneButton');
const openSceneButton = document.querySelector('#openSceneButton');
const sceneFileInput = document.querySelector('#sceneFileInput');
const customEquipmentButton = document.querySelector('#openCustomEquipmentButton');
const customEquipmentDialog = document.querySelector('#customEquipmentDialog');
const customEquipmentForm = document.querySelector('#customEquipmentForm');
const customEquipmentName = document.querySelector('#customEquipmentName');
const customEquipmentDescription = document.querySelector('#customEquipmentDescription');
const customEquipmentSvg = document.querySelector('#customEquipmentSvg');
const appShell = document.querySelector('.app-shell');
const mobilePanelBackdrop = document.querySelector('#mobilePanelBackdrop');
const mobilePanelButtons = [...document.querySelectorAll('[data-mobile-panel]')];
const mobileDeleteButton = document.querySelector('[data-action="delete-selection"]');

const mobilePanelNames = ['equipment', 'layers', 'properties'];
const mobilePanelClass = (panel) => `is-mobile-${panel}-open`;
const isMobilePanelOpen = () => mobilePanelNames.some((panel) => appShell.classList.contains(mobilePanelClass(panel)));
const closeMobilePanels = () => {
  mobilePanelNames.forEach((panel) => appShell.classList.remove(mobilePanelClass(panel)));
  mobilePanelButtons.forEach((button) => button.setAttribute('aria-expanded', 'false'));
  mobilePanelBackdrop.hidden = true;
};
const toggleMobilePanel = (panel) => {
  const nextState = !appShell.classList.contains(mobilePanelClass(panel));
  closeMobilePanels();
  if (!nextState) return;
  appShell.classList.add(mobilePanelClass(panel));
  mobilePanelButtons
    .filter((button) => button.dataset.mobilePanel === panel)
    .forEach((button) => button.setAttribute('aria-expanded', 'true'));
  mobilePanelBackdrop.hidden = false;
};

const sceneStore = new SceneStore(scene);
const canvasController = new CanvasController(viewport, sceneStore);
const sceneStorage = createSceneStorage({ endpoint: import.meta.env.VITE_SCENE_STORAGE_URL });
const equipmentUserStore = createEquipmentUserStore();
let autoSaveTimer = null;

const DEFAULT_LIQUID_LAYER = { level: 0, color: '#67aee8', opacity: 0 };

const getLiquidLayers = (object) => {
  const layers = Array.isArray(object?.liquid?.layers)
    ? object.liquid.layers
    : object?.liquid
      ? [object.liquid]
      : [DEFAULT_LIQUID_LAYER];
  return layers.length ? layers : [DEFAULT_LIQUID_LAYER];
};

const createLiquidLayerCard = (index) => {
  const card = document.createElement('div');
  card.className = 'liquid-layer-card';
  card.dataset.liquidIndex = String(index);
  card.innerHTML = `
    <div class="liquid-layer-heading">
      <strong>液層 ${index + 1}</strong>
      <button class="layer-action" type="button" data-action="remove-liquid-layer" aria-label="移除液層">×</button>
    </div>
    <label class="property-control">
      <span>液層高度 <output data-liquid-level-value>0%</output></span>
      <input data-liquid-level type="range" min="0" max="100" step="1" value="0" />
    </label>
    <label class="property-control">
      <span>液體顏色</span>
      <input data-liquid-color type="color" value="#67aee8" />
    </label>
    <label class="property-control">
      <span>透明度 <output data-liquid-opacity-value>0%</output></span>
      <input data-liquid-opacity type="range" min="0" max="100" step="1" value="0" />
    </label>
  `;

  card.querySelector('[data-liquid-level]').addEventListener('input', (event) => {
    card.querySelector('[data-liquid-level-value]').textContent = `${event.target.value}%`;
    updateSelectedLiquidLayer(index, { level: Number(event.target.value) });
  });
  card.querySelector('[data-liquid-color]').addEventListener('input', (event) => {
    updateSelectedLiquidLayer(index, { color: event.target.value });
  });
  card.querySelector('[data-liquid-opacity]').addEventListener('input', (event) => {
    card.querySelector('[data-liquid-opacity-value]').textContent = `${event.target.value}%`;
    updateSelectedLiquidLayer(index, { opacity: Number(event.target.value) / 100 });
  });
  card.querySelector('[data-action="remove-liquid-layer"]').addEventListener('click', () => {
    const object = sceneStore.selectedObjects[0];
    if (sceneStore.selectedObjects.length !== 1 || object?.type !== 'svg') return;
    const before = sceneStore.snapshot();
    sceneStore.removeLiquidLayer(object.id, index);
    canvasController.recordHistory(before);
  });
  return card;
};

const renderLiquidLayerControls = (object) => {
  if (object?.type !== 'svg') {
    liquidLayers.replaceChildren();
    return;
  }

  const layers = getLiquidLayers(object);
  if (liquidLayers.children.length !== layers.length) {
    liquidLayers.replaceChildren(...layers.map((_, index) => createLiquidLayerCard(index)));
  }

  layers.forEach((layer, index) => {
    const card = liquidLayers.children[index];
    card.dataset.liquidIndex = String(index);
    card.querySelector('strong').textContent = `液層 ${index + 1}`;
    card.querySelector('[data-liquid-level]').value = String(layer.level);
    card.querySelector('[data-liquid-level-value]').textContent = `${layer.level}%`;
    card.querySelector('[data-liquid-color]').value = layer.color;
    card.querySelector('[data-liquid-opacity]').value = String(Math.round(layer.opacity * 100));
    card.querySelector('[data-liquid-opacity-value]').textContent = `${Math.round(layer.opacity * 100)}%`;
    card.querySelector('[data-action="remove-liquid-layer"]').disabled = layers.length <= 1;
  });
};

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
  mobileDeleteButton.disabled = !selectedObjects.some((object) => !object.locked);
  propertyEmptyState.hidden = hasSelection;
  propertySelectionState.hidden = !hasSelection;
  hoseControls.hidden = !(selectedCount === 1 && selectedObjects[0]?.type === 'hose');
  hoseStyleControls.hidden = !(selectedCount === 1 && selectedObjects[0]?.type === 'hose');
  liquidControls.hidden = !(selectedCount === 1 && selectedObjects[0]?.type === 'svg');
  annotationControls.hidden = !(selectedCount === 1 && selectedObjects[0]?.type === 'annotation');
  objectLayerCount.textContent = `${sceneStore.objects.length} 個物件`;
  renderLiquidLayerControls(selectedObjects[0]);

  if (!hasSelection) return;

  const selectedType = selectedCount === 1
    ? (selectedObjects[0].type === 'annotation' && selectedObjects[0].annotationType === 'freehand'
      ? '自由線'
      : ({ hose: '橡膠軟管', annotation: '標註', svg: 'SVG 物件' }[selectedObjects[0].type] ?? '物件'))
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
    annotationText.value = object.type === 'annotation' ? object.text : '';
    if (object.type === 'annotation') {
      annotationColor.value = object.stroke ?? '#356f66';
      annotationWidth.value = String(object.strokeWidth ?? 2);
      annotationWidthValue.textContent = `${annotationWidth.value} px`;
      annotationFontSize.value = String(object.fontSize ?? 16);
      annotationFontSizeValue.textContent = `${annotationFontSize.value} px`;
      annotationFontFamily.value = object.fontFamily ?? 'Inter, sans-serif';
      annotationArrowStyle.value = object.arrowStyle ?? 'filled';
      const isTextLike = ['text', 'number'].includes(object.annotationType);
      annotationFontSizeControl.hidden = !isTextLike;
      annotationFontFamilyControl.hidden = !isTextLike;
      annotationArrowStyleControl.hidden = object.annotationType !== 'arrow';
    }
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

const userEquipmentCategories = [
  { id: 'favorites', label: '收藏器材', icon: '★' },
  { id: 'recent', label: '最近使用', icon: '↻' },
  { id: 'custom', label: '自訂器材', icon: '✦' },
];

const getAllEquipment = () => [...equipmentCatalog, ...equipmentUserStore.custom];
const getEquipmentCategories = () => [...equipmentCategories, ...userEquipmentCategories];
const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const sanitizeEquipmentSvg = (svgText) => {
  const parser = new DOMParser();
  const document = parser.parseFromString(svgText, 'image/svg+xml');
  const root = document.documentElement;
  if (!root || root.nodeName.toLowerCase() !== 'svg' || document.querySelector('parsererror')) {
    throw new Error('請提供有效的 SVG 圖形。');
  }
  document.querySelectorAll('script, foreignObject').forEach((node) => node.remove());
  document.querySelectorAll('*').forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      const isUnsafeUrl = ['href', 'xlink:href', 'src'].includes(name) && value.startsWith('javascript:');
      if (name.startsWith('on') || isUnsafeUrl) element.removeAttribute(attribute.name);
    });
  });
  return new XMLSerializer().serializeToString(root);
};

const addEquipmentToScene = (item, screenPoint = null) => {
  canvasController.addSvgMarkup(item.svg, equipmentMetadata(item), screenPoint);
  equipmentUserStore.addRecent(item.id);
};

let activeEquipmentCategory = 'all';
let layerQuery = '';

const layerTypeLabel = (object) => {
  if (object.type === 'hose') return '軟管';
  if (object.type === 'annotation') {
    if (object.annotationType === 'number') return '編號';
    if (object.annotationType === 'freehand') return '自由線';
    return '標註';
  }
  return object.name ?? '器材';
};

const withLayerHistory = (callback) => {
  const before = sceneStore.snapshot();
  callback();
  canvasController.recordHistory(before);
};

const renderLayers = () => {
  const query = layerQuery.trim().toLowerCase();
  const collapsedGroups = new Set();
  const objects = [...sceneStore.objects].reverse().filter((object) => {
    const label = `${object.name ?? ''} ${layerTypeLabel(object)}`.toLowerCase();
    if (query && !label.includes(query)) return false;
    if (object.groupId && sceneStore.isGroupCollapsed(object.groupId)) {
      if (collapsedGroups.has(object.groupId)) return false;
      collapsedGroups.add(object.groupId);
    }
    return true;
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
    row.setAttribute('role', 'listitem');
    row.tabIndex = 0;
    row.setAttribute('aria-selected', String(sceneStore.selectedIds.has(object.id)));
    row.classList.toggle('is-current', sceneStore.selectedIds.has(object.id));
    row.classList.toggle('is-hidden', object.visible === false);
    row.classList.toggle('is-locked', object.locked === true);
    row.dataset.objectId = object.id;
    row.addEventListener('click', (event) => {
      if (event.target.closest('button, input')) return;
      if (object.groupId) {
        sceneStore.selectGroup(object.groupId, event.shiftKey);
      } else {
        sceneStore.select(object.id, event.shiftKey);
      }
    });
    row.addEventListener('keydown', (event) => {
      if (event.target instanceof Element && event.target.closest('button, input')) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      if (object.groupId) sceneStore.selectGroup(object.groupId, event.shiftKey);
      else sceneStore.select(object.id, event.shiftKey);
    });

    const isGroupFirst = object.groupId
      && objects.findIndex((candidate) => candidate.groupId === object.groupId) === objects.indexOf(object);
    if (isGroupFirst) {
      const groupToggle = document.createElement('button');
      groupToggle.className = 'layer-action group-toggle';
      groupToggle.type = 'button';
      groupToggle.textContent = sceneStore.isGroupCollapsed(object.groupId) ? '▸' : '▾';
      groupToggle.setAttribute('aria-label', sceneStore.isGroupCollapsed(object.groupId) ? '展開群組' : '收合群組');
      groupToggle.addEventListener('click', (event) => {
        event.stopPropagation();
        withLayerHistory(() => sceneStore.setGroupCollapsed(object.groupId, !sceneStore.isGroupCollapsed(object.groupId)));
      });
      row.appendChild(groupToggle);
    }

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
    meta.textContent = object.groupId
      ? `${sceneStore.objects.filter((candidate) => candidate.groupId === object.groupId).length} 個物件`
      : layerTypeLabel(object);

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

  getEquipmentCategories().forEach((category) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'equipment-category-button';
    button.classList.toggle('is-active', category.id === activeEquipmentCategory);
    button.innerHTML = `
      <span class="equipment-category-main">
        <span class="equipment-category-icon">${category.icon ?? equipmentCategoryIcons[category.id] ?? '•'}</span>
        <span>${category.label}</span>
      </span>
      <span class="equipment-category-trailing">
        <span>${category.id === 'favorites'
          ? getAllEquipment().filter((item) => equipmentUserStore.isFavorite(item.id)).length
          : category.id === 'recent'
            ? equipmentUserStore.recent.filter((id) => getAllEquipment().some((item) => item.id === id)).length
            : category.id === 'all'
              ? getAllEquipment().length
              : getAllEquipment().filter((item) => item.category === category.id).length}</span>
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
  const allEquipment = getAllEquipment();
  const filtered = allEquipment.filter((item) => {
    const matchesCategory = activeEquipmentCategory === 'all'
      || activeEquipmentCategory === 'favorites' && equipmentUserStore.isFavorite(item.id)
      || activeEquipmentCategory === 'recent' && equipmentUserStore.recent.includes(item.id)
      || item.category === activeEquipmentCategory;
    const matchesQuery = !query
      || item.name.toLowerCase().includes(query)
      || item.description.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });

  const activeCategory = getEquipmentCategories().find((category) => category.id === activeEquipmentCategory);
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
    const card = document.createElement('div');
    card.className = 'equipment-card';
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `${item.name}：${item.description}`);
    card.tabIndex = 0;
    card.draggable = true;
    card.dataset.equipmentId = item.id;
    card.innerHTML = `
      <span class="equipment-preview" aria-hidden="true">${item.svg}</span>
      <span class="equipment-card-copy">
        <strong>${escapeHtml(item.name)}</strong>
        <small>${escapeHtml(item.description)}</small>
      </span>
      <span class="equipment-card-actions">
        <button class="equipment-favorite ${equipmentUserStore.isFavorite(item.id) ? 'is-active' : ''}" type="button" aria-label="${equipmentUserStore.isFavorite(item.id) ? '取消收藏' : '加入收藏'}">★</button>
        ${item.category === 'custom' ? '<button class="equipment-delete" type="button" aria-label="刪除自訂器材">×</button>' : ''}
        <span class="equipment-add-icon" aria-hidden="true">＋</span>
      </span>
    `;

    const addCardEquipment = () => {
      addEquipmentToScene(item);
      canvasHint.textContent = `${item.name} 已加入畫布 · 拖曳物件調整位置`;
    };
    card.addEventListener('click', (event) => {
      if (event.target.closest('button')) return;
      addCardEquipment();
    });
    card.addEventListener('keydown', (event) => {
      if (event.target instanceof Element && event.target.closest('button')) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      addCardEquipment();
    });
    card.querySelector('.equipment-favorite').addEventListener('click', (event) => {
      event.stopPropagation();
      equipmentUserStore.toggleFavorite(item.id);
      renderEquipmentCategories();
      renderEquipmentList();
    });
    card.querySelector('.equipment-delete')?.addEventListener('click', (event) => {
      event.stopPropagation();
      equipmentUserStore.removeCustom(item.id);
      renderEquipmentCategories();
      renderEquipmentList();
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
  if (event.detail.performance) {
    const { lastDuration, objectCount, mode } = event.detail.performance;
    renderReadout.textContent = `渲染 ${lastDuration.toFixed(1)} ms · ${objectCount} 物件 · ${mode === 'partial' ? '局部' : '完整'}`;
  }
  scheduleLocalAutosave();
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

mobileDeleteButton.addEventListener('click', () => {
  if (!canvasController.deleteSelected()) return;
  canvasHint.textContent = '已刪除選取物件';
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

document.querySelectorAll('[data-action="close-export"]').forEach((button) => {
  button.addEventListener('click', () => exportDialog.close());
});

exportFormat.addEventListener('change', () => {
  exportScaleControl.hidden = ['svg', 'json'].includes(exportFormat.value);
  exportTransparent.disabled = ['jpg', 'json'].includes(exportFormat.value);
});

exportForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submit = document.querySelector('#exportSubmit');
  submit.disabled = true;
  try {
    if (exportFormat.value === 'json') {
      const sceneDocument = getSceneDocument();
      await sceneStorage.save(sceneDocument);
      downloadSceneDocument(sceneDocument);
    } else {
      await exportScene(sceneStore.objects, {
        format: exportFormat.value,
        scale: Number(exportScale.value),
        transparent: exportTransparent.checked,
      });
    }
    exportDialog.close();
    canvasHint.textContent = `已匯出 ${exportFormat.value.toUpperCase()} 圖稿。`;
  } catch (error) {
    canvasHint.textContent = `匯出失敗：${error.message}`;
  } finally {
    submit.disabled = false;
  }
});

const getSceneDocument = () => ({
  ...sceneStore.snapshot(),
  view: { ...canvasController.view },
});

const scheduleLocalAutosave = () => {
  if (import.meta.env.VITE_SCENE_STORAGE_URL) return;
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(async () => {
    autoSaveTimer = null;
    try {
      await sceneStorage.save(getSceneDocument());
    } catch {
      // Autosave errors should not interrupt editing.
    }
  }, 350);
};

const downloadSceneDocument = (sceneDocument) => {
  const blob = new Blob([serializeScene(sceneDocument)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `chem-lab-scene-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

const saveScene = async () => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
  }
  const sceneDocument = getSceneDocument();
  await sceneStorage.save(sceneDocument);
  downloadSceneDocument(sceneDocument);
  canvasHint.textContent = '場景已儲存，可用「開啟場景」重新載入。';
};

const loadSceneDocument = (sceneDocument) => {
  canvasController.loadScene(sceneDocument, sceneDocument.view);
  canvasHint.textContent = '場景已開啟。';
};

saveSceneButton.addEventListener('click', async () => {
  saveSceneButton.disabled = true;
  try {
    await saveScene();
  } catch (error) {
    canvasHint.textContent = `儲存失敗：${error.message}`;
  } finally {
    saveSceneButton.disabled = false;
  }
});

openSceneButton.addEventListener('click', () => sceneFileInput.click());

sceneFileInput.addEventListener('change', async () => {
  const [file] = sceneFileInput.files;
  if (!file) return;
  try {
    loadSceneDocument(parseScene(await file.text()));
  } catch (error) {
    canvasHint.textContent = `開啟失敗：${error.message}`;
  } finally {
    sceneFileInput.value = '';
  }
});

customEquipmentButton.addEventListener('click', () => {
  customEquipmentForm.reset();
  customEquipmentDialog.showModal();
});

document.querySelectorAll('[data-action="close-custom-equipment"]').forEach((button) => {
  button.addEventListener('click', () => customEquipmentDialog.close());
});

customEquipmentForm.addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    const item = equipmentUserStore.addCustom({
      name: customEquipmentName.value.trim(),
      description: customEquipmentDescription.value.trim() || '自訂實驗器材',
      svg: sanitizeEquipmentSvg(customEquipmentSvg.value),
    });
    customEquipmentDialog.close();
    activeEquipmentCategory = 'custom';
    renderEquipmentCategories();
    renderEquipmentList();
    canvasHint.textContent = `${item.name} 已加入自訂器材。`;
  } catch (error) {
    canvasHint.textContent = `自訂器材無法加入：${error.message}`;
  }
});

const updateSelectedLiquidLayer = (layerIndex, patch) => {
  const object = sceneStore.selectedObjects[0];
  if (sceneStore.selectedObjects.length !== 1 || object?.type !== 'svg') return;
  const before = sceneStore.snapshot();
  sceneStore.updateLiquid(object.id, patch, layerIndex);
  canvasController.recordHistory(before);
};

addLiquidLayerButton.addEventListener('click', () => {
  const object = sceneStore.selectedObjects[0];
  if (sceneStore.selectedObjects.length !== 1 || object?.type !== 'svg') return;
  const before = sceneStore.snapshot();
  sceneStore.addLiquidLayer(object.id);
  canvasController.recordHistory(before);
});

annotationText.addEventListener('input', () => {
  const object = sceneStore.selectedObjects[0];
  if (sceneStore.selectedObjects.length !== 1 || object?.type !== 'annotation') return;
  const before = sceneStore.snapshot();
  sceneStore.updateAnnotationText(object.id, annotationText.value);
  canvasController.recordHistory(before);
});

const updateSelectedAnnotationStyle = (patch) => {
  const object = sceneStore.selectedObjects[0];
  if (sceneStore.selectedObjects.length !== 1 || object?.type !== 'annotation') return;
  const before = sceneStore.snapshot();
  sceneStore.updateAnnotationStyle(object.id, patch);
  canvasController.recordHistory(before);
};

annotationColor.addEventListener('input', () => updateSelectedAnnotationStyle({ stroke: annotationColor.value }));
annotationWidth.addEventListener('input', () => {
  annotationWidthValue.textContent = `${annotationWidth.value} px`;
  updateSelectedAnnotationStyle({ strokeWidth: Number(annotationWidth.value) });
});
annotationFontSize.addEventListener('input', () => {
  annotationFontSizeValue.textContent = `${annotationFontSize.value} px`;
  updateSelectedAnnotationStyle({ fontSize: Number(annotationFontSize.value) });
});
annotationFontFamily.addEventListener('change', () => {
  updateSelectedAnnotationStyle({ fontFamily: annotationFontFamily.value });
});
annotationArrowStyle.addEventListener('change', () => {
  updateSelectedAnnotationStyle({ arrowStyle: annotationArrowStyle.value });
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
  const item = getAllEquipment().find((candidate) => candidate.id === equipmentId);
  if (!item) return;

  addEquipmentToScene(item, {
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
        : tool === 'freehand'
          ? '拖曳繪製自由線，放開滑鼠完成。'
        : '點擊 SVG 選取 · Shift 多選 · 拖曳移動';
  });
});

mobilePanelButtons.forEach((button) => {
  button.addEventListener('click', () => toggleMobilePanel(button.dataset.mobilePanel));
});

mobilePanelBackdrop.addEventListener('click', closeMobilePanels);

if (typeof window.matchMedia === 'function') {
  const mobileLayoutQuery = window.matchMedia('(max-width: 820px), (max-width: 1024px) and (orientation: landscape)');
  const handleLayoutChange = (event) => {
    if (!event.matches) closeMobilePanels();
  };
  if (typeof mobileLayoutQuery.addEventListener === 'function') {
    mobileLayoutQuery.addEventListener('change', handleLayoutChange);
  } else {
    mobileLayoutQuery.addListener(handleLayoutChange);
  }
}

window.addEventListener('keydown', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const isEditable = target && (target.matches('input, textarea, select') || target.isContentEditable);
  if (event.defaultPrevented || isEditable) return;
  if (event.key === 'Escape' && isMobilePanelOpen()) {
    closeMobilePanels();
    return;
  }
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
renderReadout.textContent = `渲染 ${sceneStore.renderMetrics.lastDuration.toFixed(1)} ms · 0 物件 · 完整`;
equipmentSearch.value = '';
renderEquipmentCategories();
renderEquipmentList();
renderLayers();

sceneStorage.load().then((savedScene) => {
  if (savedScene) loadSceneDocument(savedScene);
}).catch(() => {
  // A missing or unavailable autosave should not prevent the editor from opening.
});
