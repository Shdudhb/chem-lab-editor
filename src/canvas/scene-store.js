import { getSnapPoints } from './snap-system.js';
import { getLiquidVesselProfile } from '../equipment/equipment-geometry.js';

const DEFAULT_WIDTH = 180;
const DEFAULT_HEIGHT = 140;
const MAX_IMPORT_SIZE = 220;
const defaultLiquidVessel = {
  top: 12,
  bottom: 88,
  leftTop: 8,
  rightTop: 92,
  leftBottom: 8,
  rightBottom: 92,
};

const clampPercent = (value) => Math.min(100, Math.max(0, value));
const interpolatePercent = (start, end, ratio) => start + (end - start) * ratio;

const normalizeLiquidVessel = (vessel = defaultLiquidVessel) => {
  const percentOr = (value, fallback) => {
    const number = Number(value);
    return Number.isFinite(number) ? clampPercent(number) : fallback;
  };
  const top = percentOr(vessel.top, defaultLiquidVessel.top);
  const bottom = Math.max(top + 1, percentOr(vessel.bottom, defaultLiquidVessel.bottom));
  return {
    top,
    bottom: Math.min(100, bottom),
    leftTop: percentOr(vessel.leftTop, defaultLiquidVessel.leftTop),
    rightTop: percentOr(vessel.rightTop, defaultLiquidVessel.rightTop),
    leftBottom: percentOr(vessel.leftBottom, defaultLiquidVessel.leftBottom),
    rightBottom: percentOr(vessel.rightBottom, defaultLiquidVessel.rightBottom),
  };
};

export const getLiquidVessel = (sourceId, customVessel) => normalizeLiquidVessel(
  customVessel ?? getLiquidVesselProfile(sourceId) ?? defaultLiquidVessel,
);

const getLiquidBandGeometry = (vessel, layerOffset, layerLevel) => {
  const normalizedVessel = normalizeLiquidVessel(vessel);
  const availableHeight = Math.max(1, normalizedVessel.bottom - normalizedVessel.top);
  const layerHeight = Math.min(
    clampPercent(Number(layerLevel)),
    Math.max(0, 100 - clampPercent(Number(layerOffset))),
  );
  if (layerHeight <= 0) return null;

  const bandBottom = normalizedVessel.bottom - (availableHeight * clampPercent(Number(layerOffset))) / 100;
  const bandTop = bandBottom - (availableHeight * layerHeight) / 100;
  const height = Math.max(1, normalizedVessel.bottom - normalizedVessel.top);
  const ratio = (value) => clampPercent((value - normalizedVessel.top) / height);
  const leftAt = (value) => interpolatePercent(normalizedVessel.leftTop, normalizedVessel.leftBottom, ratio(value));
  const rightAt = (value) => interpolatePercent(normalizedVessel.rightTop, normalizedVessel.rightBottom, ratio(value));
  return {
    layerHeight,
    bandTop,
    bandBottom,
    leftTop: leftAt(bandTop),
    rightTop: rightAt(bandTop),
    leftBottom: leftAt(bandBottom),
    rightBottom: rightAt(bandBottom),
  };
};

export const getLiquidBandGeometryForObject = (object, layerOffset, layerLevel) => (
  getLiquidBandGeometry(
    getLiquidVessel(object?.sourceId, object?.liquidVessel),
    layerOffset,
    layerLevel,
  )
);

const getLiquidBandClipPath = (geometry) => {
  if (!geometry) return '';
  return `polygon(${geometry.leftTop}% 0%, ${geometry.rightTop}% 0%, ${geometry.rightBottom}% 100%, ${geometry.leftBottom}% 100%)`;
};

export const DEFAULT_LIQUID_LAYER = Object.freeze({
  level: 0,
  color: '#67aee8',
  opacity: 0.72,
  visible: true,
});

const normalizeLiquidLayer = (layer = {}) => ({
  level: Math.min(100, Math.max(0, Number(layer.level) || 0)),
  color: /^#[0-9a-f]{6}$/i.test(layer.color ?? '') ? layer.color : DEFAULT_LIQUID_LAYER.color,
  opacity: layer.opacity === undefined || !Number.isFinite(Number(layer.opacity))
    ? DEFAULT_LIQUID_LAYER.opacity
    : Math.min(1, Math.max(0, Number(layer.opacity))),
  visible: layer.visible !== false,
});

const normalizeLiquidLayers = (layers) => {
  let usedLevel = 0;
  return layers.map((layer) => {
    const normalized = normalizeLiquidLayer(layer);
    const level = Math.min(normalized.level, Math.max(0, 100 - usedLevel));
    usedLevel += level;
    return { ...normalized, level };
  });
};

export const getLiquidLayers = (liquid) => {
  const layers = Array.isArray(liquid?.layers)
    ? liquid.layers
    : liquid
      ? [liquid]
      : [DEFAULT_LIQUID_LAYER];
  return layers.length ? normalizeLiquidLayers(layers) : [{ ...DEFAULT_LIQUID_LAYER }];
};

const cloneSceneObject = (object) => ({
  ...object,
  points: object.points?.map((point) => ({ ...point })),
  start: object.start ? { ...object.start } : undefined,
  end: object.end ? { ...object.end } : undefined,
  liquid: object.liquid
    ? {
      ...object.liquid,
      layers: object.liquid.layers?.map((layer) => ({ ...layer })),
    }
    : undefined,
  connections: object.connections
    ? {
      start: object.connections.start ? { ...object.connections.start } : null,
      end: object.connections.end ? { ...object.connections.end } : null,
    }
    : undefined,
});

const getHoseBounds = (points) => {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  const right = Math.max(...xs);
  const bottom = Math.max(...ys);
  return { x: left, y: top, width: Math.max(1, right - left), height: Math.max(1, bottom - top) };
};

const getHosePath = (points, bounds) => {
  if (points.length < 2) return '';
  const local = points.map((point) => ({ x: point.x - bounds.x, y: point.y - bounds.y }));
  let path = `M ${local[0].x} ${local[0].y}`;

  for (let index = 0; index < local.length - 1; index += 1) {
    const previous = local[index - 1] ?? local[index];
    const start = local[index];
    const end = local[index + 1];
    const next = local[index + 2] ?? end;
    const controlOne = {
      x: start.x + (end.x - previous.x) / 6,
      y: start.y + (end.y - previous.y) / 6,
    };
    const controlTwo = {
      x: end.x - (next.x - start.x) / 6,
      y: end.y - (next.y - start.y) / 6,
    };
    path += ` C ${controlOne.x} ${controlOne.y}, ${controlTwo.x} ${controlTwo.y}, ${end.x} ${end.y}`;
  }

  return path;
};

const getAnnotationBounds = (start, end, type, points = []) => {
  if (type === 'text' || type === 'number') {
    return { x: start.x, y: start.y, width: type === 'number' ? 34 : 150, height: type === 'number' ? 34 : 32 };
  }

  if (type === 'freehand' && points.length) {
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    return {
      x,
      y,
      width: Math.max(1, Math.max(...xs) - x),
      height: Math.max(1, Math.max(...ys) - y),
    };
  }

  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  return {
    x,
    y,
    width: Math.max(1, Math.abs(end.x - start.x)),
    height: Math.max(1, Math.abs(end.y - start.y)),
  };
};

const createAnnotationSvg = (object) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${object.width} ${object.height}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('overflow', 'visible');

  const stroke = object.stroke ?? '#356f66';
  const strokeWidth = object.strokeWidth ?? 2;
  if (object.annotationType === 'text') {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '0');
    const fontSize = object.fontSize ?? 16;
    text.setAttribute('y', String(fontSize));
    text.setAttribute('fill', stroke);
    text.setAttribute('font-size', String(fontSize));
    text.setAttribute('font-family', object.fontFamily ?? 'Inter, sans-serif');
    String(object.text ?? '').split(/\r?\n/).forEach((line, index) => {
      const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      tspan.setAttribute('x', '0');
      tspan.setAttribute('dy', index === 0 ? '0' : String(fontSize * 1.2));
      tspan.textContent = line;
      text.appendChild(tspan);
    });
    svg.appendChild(text);
  } else if (object.annotationType === 'number') {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '17');
    circle.setAttribute('cy', '17');
    circle.setAttribute('r', '15');
    circle.setAttribute('fill', '#e3f1ed');
    circle.setAttribute('stroke', stroke);
    circle.setAttribute('stroke-width', String(strokeWidth));
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '17');
    text.setAttribute('y', '22');
    text.setAttribute('fill', stroke);
    text.setAttribute('font-size', String(object.fontSize ?? 14));
    text.setAttribute('font-family', object.fontFamily ?? 'Inter, sans-serif');
    text.setAttribute('font-weight', '700');
    text.setAttribute('text-anchor', 'middle');
    text.textContent = object.text;
    svg.append(circle, text);
  } else if (object.annotationType === 'arrow' || object.annotationType === 'line') {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', object.start.x - object.x);
    line.setAttribute('y1', object.start.y - object.y);
    line.setAttribute('x2', object.end.x - object.x);
    line.setAttribute('y2', object.end.y - object.y);
    line.setAttribute('stroke', stroke);
    line.setAttribute('stroke-width', String(strokeWidth));
    line.setAttribute('stroke-linecap', 'round');
    if (object.annotationType === 'arrow' && object.arrowStyle !== 'none') {
      const markerId = `annotation-arrow-${object.id}`;
      line.setAttribute('marker-end', `url(#${markerId})`);
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      marker.setAttribute('id', markerId);
      marker.setAttribute('markerWidth', '8');
      marker.setAttribute('markerHeight', '8');
      marker.setAttribute('refX', '7');
      marker.setAttribute('refY', '4');
      marker.setAttribute('orient', 'auto');
      const head = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      head.setAttribute('d', 'M0 0L8 4L0 8z');
      head.setAttribute('fill', object.arrowStyle === 'open' ? 'none' : stroke);
      head.setAttribute('stroke', stroke);
      head.setAttribute('stroke-width', String(Math.max(1, strokeWidth / 2)));
      marker.appendChild(head);
      svg.appendChild(marker);
    }
    svg.appendChild(line);
  } else if (object.annotationType === 'freehand') {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const points = object.points ?? [object.start, object.end];
    path.setAttribute('d', points.map((point, index) => `${index ? 'L' : 'M'} ${point.x - object.x} ${point.y - object.y}`).join(' '));
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', stroke);
    path.setAttribute('stroke-width', String(strokeWidth));
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);
  } else if (object.annotationType === 'rectangle') {
    const rectangle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rectangle.setAttribute('x', '0');
    rectangle.setAttribute('y', '0');
    rectangle.setAttribute('width', object.width);
    rectangle.setAttribute('height', object.height);
    rectangle.setAttribute('fill', 'rgba(83, 170, 139, .08)');
    rectangle.setAttribute('stroke', stroke);
    rectangle.setAttribute('stroke-width', String(strokeWidth));
    svg.appendChild(rectangle);
  } else if (object.annotationType === 'circle') {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    circle.setAttribute('cx', object.width / 2);
    circle.setAttribute('cy', object.height / 2);
    circle.setAttribute('rx', object.width / 2);
    circle.setAttribute('ry', object.height / 2);
    circle.setAttribute('fill', 'rgba(83, 170, 139, .08)');
    circle.setAttribute('stroke', stroke);
    circle.setAttribute('stroke-width', String(strokeWidth));
    svg.appendChild(circle);
  }

  return svg;
};

const makeId = () => (
  globalThis.crypto?.randomUUID?.()
  ?? `svg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
);

const parseNumber = (value, fallback) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const angleToRadians = (degrees) => degrees * Math.PI / 180;

const rotatePoint = (point, degrees) => {
  const radians = angleToRadians(degrees);
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  return {
    x: point.x * cosine - point.y * sine,
    y: point.x * sine + point.y * cosine,
  };
};

const sanitizeSvgDocument = (document) => {
  document.querySelectorAll('script, style, foreignObject, iframe, object, embed, audio, video').forEach((node) => node.remove());

  document.querySelectorAll('*').forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      const attributeName = attribute.name.toLowerCase();
      const attributeValue = attribute.value.trim().toLowerCase();
      const isEventHandler = attributeName.startsWith('on');
      const isExternalUrl = ['href', 'xlink:href', 'src'].includes(attributeName)
        && !attributeValue.startsWith('#');
      const isExternalPaint = ['fill', 'stroke', 'filter', 'clip-path', 'mask', 'marker-start', 'marker-mid', 'marker-end']
        .includes(attributeName)
        && attributeValue.includes('url(')
        && !/^url\(\s*['"]?#[-\w:.]+['"]?\s*\)$/i.test(attributeValue);
      const isInlineStyle = attributeName === 'style';

      if (isEventHandler || isExternalUrl || isExternalPaint || isInlineStyle) {
        element.removeAttribute(attribute.name);
      }
    });
  });
};

export const parseSvgAsset = (svgText) => {
  const parser = new DOMParser();
  const document = parser.parseFromString(svgText, 'image/svg+xml');
  const root = document.documentElement;

  if (!root || root.nodeName.toLowerCase() !== 'svg' || document.querySelector('parsererror')) {
    throw new Error('無法解析 SVG 檔案。');
  }

  sanitizeSvgDocument(document);
  const viewBox = root.getAttribute('viewBox')
    ?.trim()
    .split(/[\s,]+/)
    .map(Number);
  const viewBoxWidth = viewBox?.length === 4 ? parseNumber(viewBox[2], DEFAULT_WIDTH) : null;
  const viewBoxHeight = viewBox?.length === 4 ? parseNumber(viewBox[3], DEFAULT_HEIGHT) : null;
  const sourceWidth = viewBoxWidth ?? parseNumber(root.getAttribute('width'), DEFAULT_WIDTH);
  const sourceHeight = viewBoxHeight ?? parseNumber(root.getAttribute('height'), DEFAULT_HEIGHT);
  const scale = Math.min(1, MAX_IMPORT_SIZE / Math.max(sourceWidth, sourceHeight));

  root.removeAttribute('width');
  root.removeAttribute('height');
  root.setAttribute('width', '100%');
  root.setAttribute('height', '100%');
  root.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  return {
    markup: new XMLSerializer().serializeToString(root),
    width: Math.max(24, Math.round(sourceWidth * scale)),
    height: Math.max(24, Math.round(sourceHeight * scale)),
  };
};

export class SceneStore extends EventTarget {
  constructor(scene) {
    super();
    this.scene = scene;
    this.objects = [];
    this.selectedIds = new Set();
    this.renderFrame = null;
    this.pendingRenderIds = new Set();
    this.pendingFullRender = false;
    this.renderMetrics = { renders: 0, lastDuration: 0, mode: 'full', objectCount: 0 };
    this.render();
  }

  get selectedObjects() {
    return this.objects.filter((object) => this.selectedIds.has(object.id));
  }

  snapshot() {
    return {
      objects: this.objects.map(cloneSceneObject),
      selectedIds: [...this.selectedIds],
    };
  }

  restore(snapshot) {
    if (this.renderFrame) {
      if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this.renderFrame);
      else clearTimeout(this.renderFrame);
      this.renderFrame = null;
    }
    this.pendingRenderIds.clear();
    this.pendingFullRender = false;
    this.objects = snapshot.objects.map(cloneSceneObject);
    this.selectedIds = new Set(snapshot.selectedIds);
    this.refreshHoseConnections();
    this.render();
    this.notify();
  }

  addSvg(asset, position, metadata = {}) {
    const object = {
      id: makeId(),
      type: 'svg',
      ...metadata,
      svgMarkup: asset.markup,
      x: position.x,
      y: position.y,
      width: asset.width,
      height: asset.height,
      rotation: 0,
      visible: true,
      locked: false,
      groupId: null,
    };

    this.objects.push(object);
    this.selectedIds = new Set([object.id]);
    this.render();
    this.notify();
    return object.id;
  }

  addHose(points, metadata = {}) {
    const bounds = getHoseBounds(points);
    const object = {
      id: makeId(),
      type: 'hose',
      name: '橡膠軟管',
      ...metadata,
      points: points.map((point) => ({ ...point })),
      ...bounds,
      rotation: 0,
      visible: true,
      locked: false,
      groupId: null,
      color: metadata.color ?? '#8b5e3c',
      strokeWidth: metadata.strokeWidth ?? 8,
      connections: {
        start: metadata.connections?.start ? { ...metadata.connections.start } : null,
        end: metadata.connections?.end ? { ...metadata.connections.end } : null,
      },
    };

    this.objects.push(object);
    this.selectedIds = new Set([object.id]);
    this.render();
    this.notify();
    return object.id;
  }

  addAnnotation(annotationType, start, end = start, metadata = {}) {
    const bounds = getAnnotationBounds(start, end, annotationType, metadata.points ?? []);
    if (annotationType === 'text') {
      const lines = String(metadata.text ?? '').split(/\r?\n/).length;
      const fontSize = Number(metadata.fontSize) || 16;
      bounds.height = Math.max(bounds.height, fontSize * 1.2 * lines);
    }
    const object = {
      id: makeId(),
      type: 'annotation',
      annotationType,
      name: annotationType === 'text'
        ? '文字標註'
        : annotationType === 'freehand'
          ? '自由線'
          : `${annotationType} 標註`,
      ...metadata,
      start: { ...start },
      end: { ...end },
      points: metadata.points?.map((point) => ({ ...point })),
      ...bounds,
      width: Math.max(bounds.width, 1),
      height: Math.max(bounds.height, 1),
      rotation: 0,
      visible: true,
      locked: false,
      groupId: null,
      stroke: metadata.stroke ?? '#356f66',
      strokeWidth: metadata.strokeWidth ?? 2,
      fontSize: metadata.fontSize ?? (annotationType === 'number' ? 14 : 16),
      fontFamily: metadata.fontFamily ?? 'Inter, sans-serif',
      arrowStyle: metadata.arrowStyle ?? 'filled',
    };

    this.objects.push(object);
    this.selectedIds = new Set([object.id]);
    this.render();
    this.notify();
    return object.id;
  }

  updateAnnotation(id, start, end) {
    const object = this.getObject(id);
    if (!object || object.type !== 'annotation') return;
    Object.assign(object, getAnnotationBounds(start, end, object.annotationType), {
      start: { ...start },
      end: { ...end },
    });
    this.render();
    this.notify();
  }

  updateAnnotationStyle(id, style) {
    const object = this.getObject(id);
    if (!object || object.type !== 'annotation') return;
    if (typeof style.stroke === 'string' && /^#[0-9a-f]{6}$/i.test(style.stroke)) {
      object.stroke = style.stroke;
    }
    if (style.strokeWidth !== undefined && Number.isFinite(Number(style.strokeWidth))) {
      object.strokeWidth = Math.min(20, Math.max(1, Number(style.strokeWidth)));
    }
    if (style.fontSize !== undefined && Number.isFinite(Number(style.fontSize))) {
      object.fontSize = Math.min(72, Math.max(8, Number(style.fontSize)));
      if (object.annotationType === 'text') {
        object.height = Math.max(32, object.fontSize * 1.2 * String(object.text ?? '').split(/\r?\n/).length);
      }
    }
    if (typeof style.fontFamily === 'string' && style.fontFamily) {
      object.fontFamily = style.fontFamily;
    }
    if (['filled', 'open', 'none'].includes(style.arrowStyle)) {
      object.arrowStyle = style.arrowStyle;
    }
    this.render();
    this.notify();
  }

  updateAnnotationText(id, text) {
    const object = this.getObject(id);
    if (!object || object.type !== 'annotation') return;
    object.text = text;
    if (object.annotationType === 'text') {
      object.height = Math.max(32, (object.fontSize ?? 16) * 1.2 * String(text).split(/\r?\n/).length);
    }
    this.render();
    this.notify();
  }

  setVisibility(id, visible) {
    const object = this.getObject(id);
    if (!object) return;
    object.visible = visible;
    if (!visible) this.selectedIds.delete(id);
    this.render();
    this.notify();
  }

  removeObjects(ids) {
    const removeIds = new Set(ids);
    if (!removeIds.size) return;
    this.objects = this.objects.filter((object) => !removeIds.has(object.id));
    this.objects.forEach((object) => {
      if (object.type !== 'hose' || !object.connections) return;
      ['start', 'end'].forEach((endpoint) => {
        if (removeIds.has(object.connections[endpoint]?.objectId)) object.connections[endpoint] = null;
      });
    });
    removeIds.forEach((id) => this.selectedIds.delete(id));
    this.refreshHoseConnections();
    this.render();
    this.notify();
  }

  setLocked(id, locked) {
    const object = this.getObject(id);
    if (!object) return;
    object.locked = locked;
    this.render();
    this.notify();
  }

  renameObject(id, name) {
    const object = this.getObject(id);
    if (!object) return;
    object.name = name.trim() || object.name;
    this.render();
    this.notify();
  }

  reorderObject(id, direction) {
    const index = this.objects.findIndex((object) => object.id === id);
    const nextIndex = direction === 'up' ? index + 1 : index - 1;
    if (index < 0 || nextIndex < 0 || nextIndex >= this.objects.length) return;
    [this.objects[index], this.objects[nextIndex]] = [this.objects[nextIndex], this.objects[index]];
    this.render();
    this.notify();
  }

  groupSelected() {
    const selected = this.selectedObjects;
    if (selected.length < 2) return;
    const groupId = makeId();
    selected.forEach((object) => {
      object.groupId = groupId;
      object.groupCollapsed = false;
    });
    this.render();
    this.notify();
  }

  ungroupSelected() {
    const groupIds = new Set(this.selectedObjects.map((object) => object.groupId).filter(Boolean));
    if (!groupIds.size) return;
    this.objects.forEach((object) => {
      if (groupIds.has(object.groupId)) {
        object.groupId = null;
        delete object.groupCollapsed;
      }
    });
    this.render();
    this.notify();
  }

  selectGroup(groupId, additive = false) {
    const ids = this.objects.filter((object) => object.groupId === groupId).map((object) => object.id);
    if (!ids.length) return;
    if (additive) {
      const allSelected = ids.every((id) => this.selectedIds.has(id));
      ids.forEach((id) => (allSelected ? this.selectedIds.delete(id) : this.selectedIds.add(id)));
    } else {
      this.selectedIds = new Set(ids);
    }
    this.render();
    this.notify();
  }

  setGroupCollapsed(groupId, collapsed) {
    const members = this.objects.filter((object) => object.groupId === groupId);
    if (members.length < 2) return;
    members.forEach((object) => { object.groupCollapsed = collapsed; });
    this.render();
    this.notify();
  }

  isGroupCollapsed(groupId) {
    return this.objects.some((object) => object.groupId === groupId && object.groupCollapsed === true);
  }

  updateLiquid(id, liquid, layerIndex = 0) {
    const object = this.getObject(id);
    if (!object || object.type !== 'svg' || object.supportsLiquid !== true) return;
    const layers = getLiquidLayers(object.liquid);
    const index = Math.min(layers.length - 1, Math.max(0, Number(layerIndex) || 0));
    layers[index] = normalizeLiquidLayer({ ...layers[index], ...liquid });
    object.liquid = { layers: normalizeLiquidLayers(layers) };
    this.render();
    this.notify();
  }

  setLiquidVisibility(id, visible, layerIndex = 0) {
    this.updateLiquid(id, { visible: Boolean(visible) }, layerIndex);
  }

  resetLiquid(id) {
    const object = this.getObject(id);
    if (!object || object.type !== 'svg' || object.supportsLiquid !== true) return;
    object.liquid = { layers: [{ ...DEFAULT_LIQUID_LAYER }] };
    this.render();
    this.notify();
  }

  addLiquidLayer(id, layer = {}) {
    const object = this.getObject(id);
    if (!object || object.type !== 'svg' || object.supportsLiquid !== true) return;
    const layers = getLiquidLayers(object.liquid);
    layers.push(normalizeLiquidLayer({
      level: 20,
      color: '#f2a65a',
      opacity: 0.7,
      ...layer,
    }));
    object.liquid = { layers: normalizeLiquidLayers(layers) };
    this.render();
    this.notify();
  }

  removeLiquidLayer(id, layerIndex) {
    const object = this.getObject(id);
    if (!object || object.type !== 'svg' || object.supportsLiquid !== true) return;
    const layers = getLiquidLayers(object.liquid);
    if (layers.length <= 1) return;
    const index = Number(layerIndex);
    if (!Number.isInteger(index) || index < 0 || index >= layers.length) return;
    layers.splice(index, 1);
    object.liquid = { layers };
    this.render();
    this.notify();
  }

  updateHose(id, points, { defer = false } = {}) {
    const object = this.getObject(id);
    if (!object || object.type !== 'hose') return;
    Object.assign(object, getHoseBounds(points), {
      points: points.map((point) => ({ ...point })),
    });
    if (defer) {
      this.requestRender([], { full: true });
    } else {
      this.render();
      this.notify();
    }
  }

  updateHoseConnections(id, connections, { defer = false } = {}) {
    const object = this.getObject(id);
    if (!object || object.type !== 'hose') return;
    object.connections = {
      start: connections.start ? { ...connections.start } : null,
      end: connections.end ? { ...connections.end } : null,
    };
    if (defer) {
      this.requestRender([], { full: true });
    } else {
      this.render();
      this.notify();
    }
  }

  updateHoseStyle(id, style) {
    const object = this.getObject(id);
    if (!object || object.type !== 'hose') return;
    if (typeof style.color === 'string' && /^#[0-9a-f]{6}$/i.test(style.color)) {
      object.color = style.color;
    }
    if (style.strokeWidth !== undefined) {
      const strokeWidth = Number(style.strokeWidth);
      if (Number.isFinite(strokeWidth)) {
        object.strokeWidth = Math.min(20, Math.max(2, strokeWidth));
      }
    }
    this.render();
    this.notify();
  }

  select(id, additive = false) {
    if (!id) {
      this.selectedIds.clear();
    } else if (additive) {
      if (this.selectedIds.has(id)) {
        this.selectedIds.delete(id);
      } else {
        this.selectedIds.add(id);
      }
    } else {
      this.selectedIds = new Set([id]);
    }

    this.render();
    this.notify();
  }

  updateObjects(ids, updater, { defer = false } = {}) {
    const objectIds = [...ids];
    objectIds.forEach((id) => {
      const object = this.objects.find((candidate) => candidate.id === id);
      if (object) updater(object);
    });

    if (defer) {
      const affectsConnectedHose = this.objects.some((object) => object.type === 'hose'
        && ['start', 'end'].some((endpoint) => object.connections?.[endpoint]
          && objectIds.includes(object.connections[endpoint].objectId)));
      this.requestRender(objectIds, {
        full: objectIds.some((id) => this.getObject(id)?.type !== 'svg') || affectsConnectedHose,
      });
    } else {
      this.refreshHoseConnections();
      this.render();
      this.notify();
    }
  }

  refreshHoseConnections() {
    this.objects.filter((object) => object.type === 'hose' && object.connections).forEach((hose) => {
      const points = hose.points.map((point) => ({ ...point }));
      ['start', 'end'].forEach((endpoint) => {
        const connection = hose.connections[endpoint];
        if (!connection) return;
        const target = this.getObject(connection.objectId);
        const snapPoint = target && getSnapPoints(target).find((point) => point.role === connection.role);
        if (snapPoint) {
          points[endpoint === 'start' ? 0 : points.length - 1] = {
            x: snapPoint.x,
            y: snapPoint.y,
          };
        }
      });
      Object.assign(hose, getHoseBounds(points), { points });
    });
  }

  getObject(id) {
    return this.objects.find((object) => object.id === id);
  }

  getSelectionBounds() {
    const selected = this.selectedObjects;
    if (!selected.length) return null;

    const left = Math.min(...selected.map((object) => object.x));
    const top = Math.min(...selected.map((object) => object.y));
    const right = Math.max(...selected.map((object) => object.x + object.width));
    const bottom = Math.max(...selected.map((object) => object.y + object.height));

    return { x: left, y: top, width: right - left, height: bottom - top };
  }

  requestRender(ids = [], { full = false } = {}) {
    [...ids].forEach((id) => this.pendingRenderIds.add(id));
    this.pendingFullRender ||= full;
    if (this.renderFrame) return;
    const callback = () => {
      this.renderFrame = null;
      const dirtyIds = [...this.pendingRenderIds];
      const needsFullRender = this.pendingFullRender
        || !dirtyIds.length
        || dirtyIds.some((id) => this.getObject(id)?.type !== 'svg');
      this.pendingRenderIds.clear();
      this.pendingFullRender = false;
      this.refreshHoseConnections();
      if (needsFullRender) {
        this.render();
      } else {
        this.renderPartial(dirtyIds);
      }
      this.notify();
    };
    this.renderFrame = typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame(callback)
      : setTimeout(callback, 16);
  }

  flushRender() {
    if (!this.renderFrame) return;
    if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this.renderFrame);
    else clearTimeout(this.renderFrame);
    this.renderFrame = null;
    const dirtyIds = [...this.pendingRenderIds];
    const needsFullRender = this.pendingFullRender
      || !dirtyIds.length
      || dirtyIds.some((id) => this.getObject(id)?.type !== 'svg');
    this.pendingRenderIds.clear();
    this.pendingFullRender = false;
    this.refreshHoseConnections();
    if (needsFullRender) this.render();
    else this.renderPartial(dirtyIds);
    this.notify();
  }

  renderPartial(ids) {
    const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
    ids.forEach((id) => {
      const object = this.getObject(id);
      const wrapper = [...this.scene.querySelectorAll('.canvas-object')]
        .find((node) => node.dataset.objectId === id);
      if (!object || !wrapper) return;
      wrapper.style.left = `${object.x}px`;
      wrapper.style.top = `${object.y}px`;
      wrapper.style.width = `${object.width}px`;
      wrapper.style.height = `${object.height}px`;
      wrapper.style.transform = `rotate(${object.rotation}deg)`;
      wrapper.classList.toggle('is-selected', this.selectedIds.has(object.id));
      wrapper.classList.toggle('is-locked', object.locked === true);
      wrapper.setAttribute('aria-selected', String(this.selectedIds.has(object.id)));
    });
    this.scene.querySelector('.selection-overlay')?.remove();
    this.renderSelectionOverlay();
    this.recordRenderMetric('partial', startedAt);
  }

  recordRenderMetric(mode, startedAt) {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.renderMetrics = {
      renders: this.renderMetrics.renders + 1,
      lastDuration: now - startedAt,
      mode,
      objectCount: this.objects.length,
    };
  }

  render() {
    const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.scene.querySelectorAll('.canvas-object, .selection-overlay').forEach((node) => node.remove());
    const emptyMessage = this.scene.querySelector('.empty-canvas-message');
    emptyMessage.hidden = this.objects.length > 0;

    this.objects.forEach((object) => {
      if (object.visible === false) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'canvas-object';
      wrapper.dataset.objectId = object.id;
      wrapper.setAttribute('role', 'img');
      wrapper.setAttribute('tabindex', '-1');
      wrapper.setAttribute('aria-selected', String(this.selectedIds.has(object.id)));
      wrapper.setAttribute('aria-label', object.name ?? '匯入的 SVG 物件');
      wrapper.classList.toggle('is-selected', this.selectedIds.has(object.id));
      wrapper.classList.toggle('is-locked', object.locked === true);
      wrapper.style.left = `${object.x}px`;
      wrapper.style.top = `${object.y}px`;
      wrapper.style.width = `${object.width}px`;
      wrapper.style.height = `${object.height}px`;
      wrapper.style.transform = `rotate(${object.rotation}deg)`;

      if (object.type === 'hose') {
        wrapper.classList.add('hose-object');
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', `0 0 ${object.width} ${object.height}`);
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.classList.add('hose-path');
        path.setAttribute('d', getHosePath(object.points, object));
        path.setAttribute('stroke', object.color);
        path.setAttribute('stroke-width', object.strokeWidth);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        svg.appendChild(path);
        wrapper.appendChild(svg);

        if (this.selectedIds.has(object.id)) {
          object.points.forEach((point, index) => {
            const controlPoint = document.createElement('span');
            controlPoint.className = 'hose-control-point';
            controlPoint.classList.toggle('is-active', object.activePointIndex === index);
            controlPoint.dataset.hosePoint = String(index);
            controlPoint.style.left = `${point.x - object.x}px`;
            controlPoint.style.top = `${point.y - object.y}px`;
            controlPoint.setAttribute('aria-label', `軟管控制點 ${index + 1}`);
            wrapper.appendChild(controlPoint);
          });
        }
      }

      if (object.type === 'annotation') {
        wrapper.classList.add('annotation-object');
        wrapper.appendChild(createAnnotationSvg(object));
      }

      if (object.type === 'svg') {
        const parser = new DOMParser();
        const parsedDocument = parser.parseFromString(object.svgMarkup, 'image/svg+xml');
        const svg = parsedDocument.documentElement;
        if (svg?.nodeName.toLowerCase() === 'svg') {
          wrapper.appendChild(document.importNode(svg, true));
        }
        if (object.supportsLiquid === true) {
          const vessel = getLiquidVessel(object.sourceId, object.liquidVessel);
          let liquidOffset = 0;
          getLiquidLayers(object.liquid).forEach((layer, layerIndex) => {
            const geometry = getLiquidBandGeometry(vessel, liquidOffset, layer.level);
            if (!geometry) return;
            liquidOffset += geometry.layerHeight;
            if (!layer.visible) return;
            const liquid = document.createElement('span');
            liquid.className = 'liquid-overlay';
            liquid.dataset.liquidLayer = String(layerIndex);
            liquid.style.height = `${geometry.bandBottom - geometry.bandTop}%`;
            liquid.style.bottom = `${Math.max(0, 100 - geometry.bandBottom)}%`;
            liquid.style.background = layer.color;
            liquid.style.opacity = String(layer.opacity);
            liquid.style.zIndex = String(layerIndex + 1);
            const clipPath = getLiquidBandClipPath(geometry);
            liquid.style.clipPath = clipPath;
            liquid.style.webkitClipPath = clipPath;
            wrapper.appendChild(liquid);
          });
        }
      }

      this.scene.appendChild(wrapper);
    });

    this.renderSelectionOverlay();
    this.recordRenderMetric('full', startedAt);
  }

  renderSelectionOverlay() {
    const selected = this.selectedObjects;
    if (!selected.length) return;

    const bounds = this.getSelectionBounds();
    const overlay = document.createElement('div');
    overlay.className = 'selection-overlay';
    overlay.style.left = `${bounds.x}px`;
    overlay.style.top = `${bounds.y}px`;
    overlay.style.width = `${bounds.width}px`;
    overlay.style.height = `${bounds.height}px`;

    if (selected.length === 1) {
      const object = selected[0];
      overlay.dataset.objectId = object.id;
      overlay.style.left = `${object.x}px`;
      overlay.style.top = `${object.y}px`;
      overlay.style.width = `${object.width}px`;
      overlay.style.height = `${object.height}px`;
      overlay.style.transform = `rotate(${object.rotation}deg)`;
      overlay.classList.add('is-single');

      ['nw', 'ne', 'sw', 'se'].forEach((corner) => {
        const handle = document.createElement('span');
        handle.className = `scale-handle scale-handle-${corner}`;
        handle.dataset.handle = 'scale';
        handle.dataset.corner = corner;
        handle.setAttribute('aria-label', `縮放 ${corner}`);
        overlay.appendChild(handle);
      });

      const rotateHandle = document.createElement('span');
      rotateHandle.className = 'rotate-handle';
      rotateHandle.dataset.handle = 'rotate';
      rotateHandle.setAttribute('aria-label', '旋轉物件');
      overlay.appendChild(rotateHandle);
    } else {
      overlay.classList.add('is-multiple');
      const groupId = selected[0].groupId;
      const isGroupSelection = Boolean(groupId) && selected.every((object) => object.groupId === groupId);
      if (isGroupSelection) {
        overlay.classList.add('is-group');
        overlay.dataset.groupId = groupId;
        ['nw', 'ne', 'sw', 'se'].forEach((corner) => {
          const handle = document.createElement('span');
          handle.className = `scale-handle scale-handle-${corner}`;
          handle.dataset.handle = 'group-scale';
          handle.dataset.corner = corner;
          handle.setAttribute('aria-label', `群組縮放 ${corner}`);
          overlay.appendChild(handle);
        });
        const rotateHandle = document.createElement('span');
        rotateHandle.className = 'rotate-handle';
        rotateHandle.dataset.handle = 'group-rotate';
        rotateHandle.setAttribute('aria-label', '旋轉群組');
        overlay.appendChild(rotateHandle);
      }
    }

    this.scene.appendChild(overlay);
  }

  notify() {
    this.dispatchEvent(new CustomEvent('change', {
      detail: {
        objects: this.objects,
        selectedObjects: this.selectedObjects,
        performance: this.renderMetrics,
      },
    }));
  }
}

export const getRotatedCornerWorldPoint = (object, corner) => {
  const signX = corner.includes('e') ? 1 : -1;
  const signY = corner.includes('s') ? 1 : -1;
  const center = {
    x: object.x + object.width / 2,
    y: object.y + object.height / 2,
  };
  const localPoint = {
    x: signX * object.width / 2,
    y: signY * object.height / 2,
  };
  const rotated = rotatePoint(localPoint, object.rotation);

  return {
    x: center.x + rotated.x,
    y: center.y + rotated.y,
  };
};

export const inverseRotate = (point, degrees) => rotatePoint(point, -degrees);
export const rotateVector = (point, degrees) => rotatePoint(point, degrees);
