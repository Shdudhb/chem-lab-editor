const DEFAULT_WIDTH = 180;
const DEFAULT_HEIGHT = 140;
const MAX_IMPORT_SIZE = 220;

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
      objects: this.objects.map((object) => ({ ...object })),
      selectedIds: [...this.selectedIds],
    };
  }

  restore(snapshot) {
    this.objects = snapshot.objects.map((object) => ({ ...object }));
    this.selectedIds = new Set(snapshot.selectedIds);
    this.render();
    this.notify();
  }

  addSvg(asset, position) {
    const object = {
      id: makeId(),
      type: 'svg',
      svgMarkup: asset.markup,
      x: position.x,
      y: position.y,
      width: asset.width,
      height: asset.height,
      rotation: 0,
    };

    this.objects.push(object);
    this.selectedIds = new Set([object.id]);
    this.render();
    this.notify();
    return object.id;
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
      const wrapper = document.createElement('div');
      wrapper.className = 'canvas-object';
      wrapper.dataset.objectId = object.id;
      wrapper.setAttribute('role', 'img');
      wrapper.setAttribute('aria-label', '匯入的 SVG 物件');
      wrapper.classList.toggle('is-selected', this.selectedIds.has(object.id));
      wrapper.style.left = `${object.x}px`;
      wrapper.style.top = `${object.y}px`;
      wrapper.style.width = `${object.width}px`;
      wrapper.style.height = `${object.height}px`;
      wrapper.style.transform = `rotate(${object.rotation}deg)`;

      const parser = new DOMParser();
      const parsedDocument = parser.parseFromString(object.svgMarkup, 'image/svg+xml');
      const svg = parsedDocument.documentElement;
      if (svg?.nodeName.toLowerCase() === 'svg') {
        wrapper.appendChild(document.importNode(svg, true));
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
