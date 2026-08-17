import { getLiquidBandGeometryForObject, getLiquidLayers } from '../canvas/scene-store.js';

const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const EXPORT_PADDING = 24;

const finiteNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const getRotation = (object) => finiteNumber(object.rotation);

const getObjectCorners = (object) => {
  const x = finiteNumber(object.x);
  const y = finiteNumber(object.y);
  const width = Math.max(0, finiteNumber(object.width));
  const height = Math.max(0, finiteNumber(object.height));
  const rotation = getRotation(object) * Math.PI / 180;
  const cosine = Math.cos(rotation);
  const sine = Math.sin(rotation);
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  return [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ].map((corner) => {
    const offsetX = corner.x - centerX;
    const offsetY = corner.y - centerY;
    return {
      x: centerX + offsetX * cosine - offsetY * sine,
      y: centerY + offsetX * sine + offsetY * cosine,
    };
  });
};

const getWorldRotationTransform = (object) => {
  const rotation = getRotation(object);
  if (!rotation) return '';
  const centerX = finiteNumber(object.x) + Math.max(0, finiteNumber(object.width)) / 2;
  const centerY = finiteNumber(object.y) + Math.max(0, finiteNumber(object.height)) / 2;
  return `rotate(${rotation} ${centerX} ${centerY})`;
};

const wrapWithWorldRotation = (object, markup) => {
  const transform = getWorldRotationTransform(object);
  return transform ? `<g transform="${transform}">${markup}</g>` : markup;
};

const hosePath = (points = []) => {
  if (points.length < 2) return '';
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index];
    const start = points[index];
    const end = points[index + 1];
    const next = points[index + 2] ?? end;
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

const getBounds = (objects) => {
  const visible = objects.filter((object) => object.visible !== false);
  if (!visible.length) return { x: 0, y: 0, width: 1000, height: 600 };
  const corners = visible.flatMap(getObjectCorners);
  const padding = Math.max(
    EXPORT_PADDING,
    ...visible.map((object) => Math.max(0, finiteNumber(object.strokeWidth)) / 2 + 4),
  );
  const left = Math.min(...corners.map((corner) => corner.x));
  const top = Math.min(...corners.map((corner) => corner.y));
  const right = Math.max(...corners.map((corner) => corner.x));
  const bottom = Math.max(...corners.map((corner) => corner.y));
  return {
    x: left - padding,
    y: top - padding,
    width: right - left + padding * 2,
    height: bottom - top + padding * 2,
  };
};

const svgObjectMarkup = (object) => {
  const width = Math.max(0, finiteNumber(object.width));
  const height = Math.max(0, finiteNumber(object.height));
  const x = finiteNumber(object.x);
  const y = finiteNumber(object.y);
  const svg = String(object.svgMarkup ?? '')
    .replace('width="100%"', `width="${width}"`)
    .replace('height="100%"', `height="${height}"`);
  let liquidOffset = 0;
  const clipPaths = [];
  const liquid = (object.supportsLiquid === true ? getLiquidLayers(object.liquid) : []).map((layer, layerIndex) => {
    const geometry = getLiquidBandGeometryForObject(object, liquidOffset, layer.level);
    if (!geometry) return '';
    liquidOffset += geometry.layerHeight;
    if (!layer.visible) return '';

    const leftTop = width * geometry.leftTop / 100;
    const rightTop = width * geometry.rightTop / 100;
    const leftBottom = width * geometry.leftBottom / 100;
    const rightBottom = width * geometry.rightBottom / 100;
    const bandTop = height * geometry.bandTop / 100;
    const bandBottom = height * geometry.bandBottom / 100;
    const clipId = `liquid-${String(object.id ?? 'object').replace(/[^a-z0-9_-]/gi, '-')}-${layerIndex}`;
    clipPaths.push(`<clipPath id="${escapeXml(clipId)}"><path d="M ${leftTop} ${bandTop} L ${rightTop} ${bandTop} L ${rightBottom} ${bandBottom} L ${leftBottom} ${bandBottom} Z"/></clipPath>`);
    return `<rect x="0" y="${bandTop}" width="${width}" height="${Math.max(0, bandBottom - bandTop)}" fill="${escapeXml(layer.color)}" opacity="${layer.opacity}" clip-path="url(#${escapeXml(clipId)})"/>`;
  }).join('');
  const rotation = getRotation(object);
  const rotationTransform = rotation ? ` rotate(${rotation} ${width / 2} ${height / 2})` : '';
  const definitions = clipPaths.length ? `<defs>${clipPaths.join('')}</defs>` : '';
  return `<g transform="translate(${x} ${y})${rotationTransform}">${definitions}${svg}${liquid}</g>`;
};

const annotationMarkup = (object) => {
  const stroke = escapeXml(object.stroke ?? '#356f66');
  const strokeWidth = Math.max(1, finiteNumber(object.strokeWidth, 2));
  if (object.annotationType === 'text') {
    return `<text x="${object.x}" y="${object.y + (object.fontSize ?? 16)}" fill="${stroke}" font-family="${escapeXml(object.fontFamily ?? 'Inter, sans-serif')}" font-size="${object.fontSize ?? 16}">${escapeXml(object.text)}</text>`;
  }
  if (object.annotationType === 'number') {
    const fontSize = object.fontSize ?? 14;
    return `<circle cx="${object.x + 17}" cy="${object.y + 17}" r="15" fill="#e3f1ed" stroke="${stroke}" stroke-width="${strokeWidth}"/><text x="${object.x + 17}" y="${object.y + 17 + fontSize / 3}" fill="${stroke}" font-family="${escapeXml(object.fontFamily ?? 'Inter, sans-serif')}" font-size="${fontSize}" font-weight="700" text-anchor="middle">${escapeXml(object.text)}</text>`;
  }
  if (object.annotationType === 'arrow' || object.annotationType === 'line') {
    const marker = object.annotationType === 'arrow' && object.arrowStyle !== 'none' ? ` marker-end="url(#export-arrow-${object.arrowStyle ?? 'filled'})"` : '';
    return `<line x1="${object.start.x}" y1="${object.start.y}" x2="${object.end.x}" y2="${object.end.y}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round"${marker}/>`;
  }
  if (object.annotationType === 'freehand') {
    const points = object.points ?? [object.start, object.end];
    const path = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
    return `<path d="${path}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  if (object.annotationType === 'rectangle') {
    return `<rect x="${object.x}" y="${object.y}" width="${object.width}" height="${object.height}" fill="rgba(83,170,139,.08)" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
  }
  return `<ellipse cx="${object.x + object.width / 2}" cy="${object.y + object.height / 2}" rx="${object.width / 2}" ry="${object.height / 2}" fill="rgba(83,170,139,.08)" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
};

export const buildSceneSvg = (objects, { transparent = false } = {}) => {
  const bounds = getBounds(objects);
  const content = objects
    .filter((object) => object.visible !== false)
    .map((object) => {
      if (object.type === 'svg') return svgObjectMarkup(object);
      if (object.type === 'hose') {
        const path = `<path d="${hosePath(object.points)}" fill="none" stroke="${escapeXml(object.color)}" stroke-width="${Math.max(1, finiteNumber(object.strokeWidth, 8))}" stroke-linecap="round" stroke-linejoin="round"/>`;
        return wrapWithWorldRotation(object, path);
      }
      return wrapWithWorldRotation(object, annotationMarkup(object));
    })
    .join('');
  const background = transparent ? '' : `<rect x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" fill="#ffffff"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.width}" height="${bounds.height}" viewBox="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}"><defs><marker id="export-arrow-filled" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8z" fill="context-stroke"/></marker><marker id="export-arrow-open" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8z" fill="none" stroke="context-stroke"/></marker></defs>${background}${content}</svg>`;
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportScene = async (objects, options = {}) => {
  const { format = 'svg', scale = 1, transparent = false } = options;
  const svgMarkup = buildSceneSvg(objects, { transparent });
  const baseName = `chem-lab-diagram-${new Date().toISOString().slice(0, 10)}`;

  if (format === 'svg') {
    downloadBlob(new Blob([svgMarkup], { type: 'image/svg+xml' }), `${baseName}.svg`);
    return;
  }

  const bounds = getBounds(objects);
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(bounds.width * scale);
  canvas.height = Math.ceil(bounds.height * scale);
  const context = canvas.getContext('2d');
  if (!transparent || format === 'jpg') {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
  const extension = format === 'jpg' ? 'jpg' : 'png';
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, .92));
  downloadBlob(blob, `${baseName}-${scale}x.${extension}`);
};
