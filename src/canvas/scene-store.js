const DEFAULT_WIDTH = 180;
const DEFAULT_HEIGHT = 140;
const MAX_IMPORT_SIZE = 220;

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

const getAnnotationBounds = (start, end, type) => {
  if (type === 'text' || type === 'number') {
    return { x: start.x, y: start.y, width: type === 'number' ? 34 : 150, height: type === 'number' ? 34 : 32 };
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

  const stroke = '#356f66';
  if (object.annotationType === 'text') {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', '21');
    text.setAttribute('fill', stroke);
    text.setAttribute('font-size', '16');
    text.setAttribute('font-family', 'Inter, sans-serif');
    text.textContent = object.text;
    svg.appendChild(text);
  } else if (object.annotationType === 'number') {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '17');
    circle.setAttribute('cy', '17');
    circle.setAttribute('r', '15');
    circle.setAttribute('fill', '#e3f1ed');
    circle.setAttribute('stroke', stroke);
    circle.setAttribute('stroke-width', '2');
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '17');
    text.setAttribute('y', '22');
    text.setAttribute('fill', stroke);
    text.setAttribute('font-size', '14');
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
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-linecap', 'round');
    if (object.annotationType === 'arrow') {
      line.setAttribute('marker-end', 'url(#annotation-arrow)');
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      marker.setAttribute('id', 'annotation-arrow');
      marker.setAttribute('markerWidth', '8');
      marker.setAttribute('markerHeight', '8');
      marker.setAttribute('refX', '7');
      marker.setAttribute('refY', '4');
      marker.setAttribute('orient', 'auto');
      const head = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      head.setAttribute('d', 'M0 0L8 4L0 8z');
      head.setAttribute('fill', stroke);
      marker.appendChild(head);
      svg.appendChild(marker);
    }
    svg.appendChild(line);
  } else if (object.annotationType === 'rectangle') {
    const rectangle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rectangle.setAttribute('x', '0');
    rectangle.setAttribute('y', '0');
    rectangle.setAttribute('width', object.width);
    rectangle.setAttribute('height', object.height);
    rectangle.setAttribute('fill', 'rgba(83, 170, 139, .08)');
    rectangle.setAttribute('stroke', stroke);
    rectangle.setAttribute('stroke-width', '2');
    svg.appendChild(rectangle);
  } else if (object.annotationType === 'circle') {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    circle.setAttribute('cx', object.width / 2);
    circle.setAttribute('cy', object.height / 2);
    circle.setAttribute('rx', object.width / 2);
    circle.setAttribute('ry', object.height / 2);
    circle.setAttribute('fill', 'rgba(83, 170, 139, .08)');
    circle.setAttribute('stroke', stroke);
    circle.setAttribute('stroke-width', '2');
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
  document.querySelectorAll('script, foreignObject').forEach((node) => node.remove());

  document.querySelectorAll('*').forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      const attributeName = attribute.name.toLowerCase();
      const attributeValue = attribute.value.trim().toLowerCase();
      const isEventHandler = attributeName.startsWith('on');
      const isJavascriptUrl = (
        ['href', 'xlink:href', 'src'].includes(attributeName)
        && attributeValue.startsWith('javascript:')
      );

      if (isEventHandler || isJavascriptUrl) {
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
    this.render();
  }

  get selectedObjects() {
    return this.objects.filter((object) => this.selectedIds.has(object.id));
  }

  snapshot() {
    return {
      objects: this.objects.map((object) => ({
        ...object,
        points: object.points?.map((point) => ({ ...point })),
        start: object.start ? { ...object.start } : undefined,
        end: object.end ? { ...object.end } : undefined,
        liquid: object.liquid ? { ...object.liquid } : undefined,
      })),
      selectedIds: [...this.selectedIds],
    };
  }

  restore(snapshot) {
    this.objects = snapshot.objects.map((object) => ({ ...object }));
    this.selectedIds = new Set(snapshot.selectedIds);
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
    };

    this.objects.push(object);
    this.selectedIds = new Set([object.id]);
    this.render();
    this.notify();
    return object.id;
  }

  addAnnotation(annotationType, start, end = start, metadata = {}) {
    const bounds = getAnnotationBounds(start, end, annotationType);
    const object = {
      id: makeId(),
      type: 'annotation',
      annotationType,
      name: annotationType === 'text' ? '文字標註' : `${annotationType} 標註`,
      ...metadata,
      start: { ...start },
      end: { ...end },
      ...bounds,
      width: Math.max(bounds.width, 1),
      height: Math.max(bounds.height, 1),
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

  updateAnnotationText(id, text) {
    const object = this.getObject(id);
    if (!object || object.type !== 'annotation') return;
    object.text = text;
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
    selected.forEach((object) => { object.groupId = groupId; });
    this.render();
    this.notify();
  }

  ungroupSelected() {
    const groupIds = new Set(this.selectedObjects.map((object) => object.groupId).filter(Boolean));
    if (!groupIds.size) return;
    this.objects.forEach((object) => {
      if (groupIds.has(object.groupId)) object.groupId = null;
    });
    this.render();
    this.notify();
  }

  updateLiquid(id, liquid) {
    const object = this.getObject(id);
    if (!object || object.type !== 'svg') return;
    object.liquid = {
      level: Math.min(100, Math.max(0, Number(liquid.level) || 0)),
      color: liquid.color || '#67aee8',
      opacity: Math.min(1, Math.max(0, Number(liquid.opacity) || 0)),
    };
    this.render();
    this.notify();
  }

  updateHose(id, points) {
    const object = this.getObject(id);
    if (!object || object.type !== 'hose') return;
    Object.assign(object, getHoseBounds(points), {
      points: points.map((point) => ({ ...point })),
    });
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

  updateObjects(ids, updater) {
    ids.forEach((id) => {
      const object = this.objects.find((candidate) => candidate.id === id);
      if (object) updater(object);
    });

    this.render();
    this.notify();
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

  render() {
    this.scene.querySelectorAll('.canvas-object, .selection-overlay').forEach((node) => node.remove());
    const emptyMessage = this.scene.querySelector('.empty-canvas-message');
    emptyMessage.hidden = this.objects.length > 0;

    this.objects.forEach((object) => {
      if (object.visible === false) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'canvas-object';
      wrapper.dataset.objectId = object.id;
      wrapper.setAttribute('role', 'img');
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
        if (object.liquid?.level > 0) {
          const liquid = document.createElement('span');
          liquid.className = 'liquid-overlay';
          liquid.style.height = `${object.liquid.level}%`;
          liquid.style.background = object.liquid.color;
          liquid.style.opacity = String(object.liquid.opacity);
          wrapper.appendChild(liquid);
        }
      }

      this.scene.appendChild(wrapper);
    });

    this.renderSelectionOverlay();
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
    }

    this.scene.appendChild(overlay);
  }

  notify() {
    this.dispatchEvent(new CustomEvent('change', {
      detail: {
        objects: this.objects,
        selectedObjects: this.selectedObjects,
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
