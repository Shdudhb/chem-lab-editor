const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const getLiquidLayers = (object) => {
  const layers = Array.isArray(object.liquid?.layers)
    ? object.liquid.layers
    : object.liquid
      ? [object.liquid]
      : [];
  return layers.map((layer) => ({
    level: Math.min(100, Math.max(0, Number(layer.level) || 0)),
    color: /^#[0-9a-f]{6}$/i.test(layer.color ?? '') ? layer.color : '#67aee8',
    opacity: Math.min(1, Math.max(0, Number(layer.opacity) || 0)),
  }));
};

const hosePath = (points) => {
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
  const left = Math.min(...visible.map((object) => object.x));
  const top = Math.min(...visible.map((object) => object.y));
  const right = Math.max(...visible.map((object) => object.x + object.width));
  const bottom = Math.max(...visible.map((object) => object.y + object.height));
  return { x: left - 24, y: top - 24, width: right - left + 48, height: bottom - top + 48 };
};

const svgObjectMarkup = (object) => {
  const svg = object.svgMarkup
    .replace('width="100%"', `width="${object.width}"`)
    .replace('height="100%"', `height="${object.height}"`);
  let liquidOffset = 0;
  const liquid = getLiquidLayers(object).map((layer) => {
    const layerHeight = Math.min(layer.level, 100 - liquidOffset);
    if (layerHeight <= 0) return '';
    const markup = `<rect x="${object.width * .18}" y="${object.height * (1 - (liquidOffset + layerHeight) / 100)}" width="${object.width * .64}" height="${object.height * layerHeight / 100}" rx="8" fill="${escapeXml(layer.color)}" opacity="${layer.opacity}"/>`;
    liquidOffset += layerHeight;
    return markup;
  }).join('');
  return `<g transform="translate(${object.x} ${object.y}) rotate(${object.rotation} ${object.width / 2} ${object.height / 2})">${svg}${liquid}</g>`;
};

const annotationMarkup = (object) => {
  const stroke = object.stroke ?? '#356f66';
  const strokeWidth = object.strokeWidth ?? 2;
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
      if (object.type === 'hose') return `<path d="${hosePath(object.points)}" fill="none" stroke="${escapeXml(object.color)}" stroke-width="${object.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`;
      return annotationMarkup(object);
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
