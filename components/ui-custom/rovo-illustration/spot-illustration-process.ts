import {
	ILLUS_ELEMENTS,
	ILLUS_HAND_DRAWN,
	ILLUS_ROTATE_GROUP,
} from "./spot-illustration-config";

let _illusClipCounter = 0;

function getMaskReferenceId(maskReference: string | null): string | null {
	const match = maskReference?.match(/^url\(["']?#([^"')]+)["']?\)$/u);
	return match?.[1] ?? null;
}

function readSvgNumber(value: string | null): number | null {
	if (!value) return null;
	const parsed = Number.parseFloat(value);
	return Number.isFinite(parsed) ? parsed : null;
}

function getMosaicMaskBounds(svg: SVGSVGElement, maskReference: string | null, fallback: { x: number; y: number; width: number; height: number }) {
	const maskId = getMaskReferenceId(maskReference);
	const mask = maskId
		? Array.from(svg.querySelectorAll('mask')).find(maskEl => maskEl.getAttribute('id') === maskId)
		: null;
	const x = readSvgNumber(mask?.getAttribute('x') ?? null);
	const y = readSvgNumber(mask?.getAttribute('y') ?? null);
	const width = readSvgNumber(mask?.getAttribute('width') ?? null);
	const height = readSvgNumber(mask?.getAttribute('height') ?? null);
	if (x === null || y === null || width === null || height === null) {
		return fallback;
	}
	return { x, y, width, height };
}

function getMosaicBaseUnderlayFills(baseFill: string | null): [string, string, string, string] {
	const normalizedFill = baseFill?.toUpperCase();
	const blue = normalizedFill === '#1558BC' ? '#1558BC' : '#1868DB';
	const orange = normalizedFill === '#1558BC' || normalizedFill === '#E56E00' ? '#E56E00' : '#FCA700';
	return [blue, '#6A9A23', '#AF59E1', orange];
}

function appendMosaicBaseUnderlay(doc: Document, wrapper: SVGGElement, cx: number, cy: number, radius: number, fills: [string, string, string, string]): void {
	const underlay = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
	underlay.setAttribute('data-mosaic-base-underlay', '');
	underlay.setAttribute('aria-hidden', 'true');
	const circles = [
		{ cx: cx - radius * 0.45, cy: cy - radius * 0.35, fill: fills[0] },
		{ cx: cx + radius * 0.45, cy: cy - radius * 0.35, fill: fills[1] },
		{ cx: cx - radius * 0.2, cy: cy + radius * 0.45, fill: fills[2] },
		{ cx: cx + radius * 0.55, cy: cy + radius * 0.45, fill: fills[3] },
	];
	circles.forEach(circleConfig => {
		const circle = doc.createElementNS('http://www.w3.org/2000/svg', 'circle');
		circle.setAttribute('cx', String(circleConfig.cx));
		circle.setAttribute('cy', String(circleConfig.cy));
		circle.setAttribute('r', String(radius * 0.72));
		circle.setAttribute('fill', circleConfig.fill);
		underlay.appendChild(circle);
	});
	wrapper.appendChild(underlay);
}

export function processIllustrationSvg(svgText: string, illusId: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  if (!svg) return svgText;
  const vb = (svg.getAttribute('viewBox') || '0 0 100 100').split(/\s+/).map(Number);
  if (illusId === 'ai-first-jira') {
    const jiraClipGroup = svg.querySelector('g[clip-path="url(#clip1_jira)"]');
    if (jiraClipGroup) {
      const inner = jiraClipGroup.querySelector('g[transform]');
      if (inner) inner.setAttribute('data-jira-logo', '');
    }
  }
  svg.querySelectorAll('g[mask]').forEach((mg) => {
    const wrapper = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
    wrapper.setAttribute('data-mosaic-rotate', '');
    const maskBounds = getMosaicMaskBounds(svg, mg.getAttribute('mask'), { x: vb[0], y: vb[1], width: vb[2], height: vb[3] });
    const maskCenterX = maskBounds.x + maskBounds.width / 2;
    const maskCenterY = maskBounds.y + maskBounds.height / 2;
    const maskRadius = Math.hypot(maskBounds.width, maskBounds.height) / 2;
    wrapper.setAttribute('style', `transform-origin: ${maskCenterX}px ${maskCenterY}px`);
    let baseFill: string | null = null;
    for (const child of Array.from(mg.children)) {
      const f = child.getAttribute('fill');
      if (f && f.startsWith('#') && f.toUpperCase() !== '#FFFFFF' && f.toUpperCase() !== '#FFF' && f.toUpperCase() !== '#000' && f.toUpperCase() !== '#000000') {
        baseFill = f;
        break;
      }
    }
    if (baseFill) {
      const baseR = Math.hypot(vb[2], vb[3]);
      const baseCircle = doc.createElementNS('http://www.w3.org/2000/svg', 'circle');
      baseCircle.setAttribute('cx', String(maskCenterX));
      baseCircle.setAttribute('cy', String(maskCenterY));
      baseCircle.setAttribute('r', String(baseR));
      baseCircle.setAttribute('fill', baseFill);
      baseCircle.setAttribute('data-mosaic-base', '');
      wrapper.appendChild(baseCircle);
    }
    appendMosaicBaseUnderlay(doc, wrapper, maskCenterX, maskCenterY, maskRadius, getMosaicBaseUnderlayFills(baseFill));
    while (mg.firstChild) wrapper.appendChild(mg.firstChild);
    mg.appendChild(wrapper);
  });
  const groups = ILLUS_HAND_DRAWN[illusId];
  if (groups) {
    const children = Array.from(svg.children);
    groups.forEach((group, gi) => {
      group.forEach(idx => {
        const el = children[idx];
        if (el instanceof Element) {
          el.classList.add('illus-gesture');
          el.setAttribute('data-gesture-group', String(gi));
          if (gi % 2 === 1) el.classList.add('illus-gesture-stagger');
        }
      });
    });
  }
  const elemConfig = ILLUS_ELEMENTS[illusId];
  const rotGroupConfig = ILLUS_ROTATE_GROUP[illusId];
  let savedRotateGroupRefs: Element[] = [];
  if (rotGroupConfig) {
    const preChildren = Array.from(svg.children);
    savedRotateGroupRefs = rotGroupConfig.elements
      .map(idx => preChildren[idx])
      .filter((el): el is Element => el instanceof Element);
  }
  if (elemConfig) {
    const allChildren = Array.from(svg.children);
    const greyChildren: Element[] = [];
    allChildren.forEach((child, i) => {
      let layer: string | null = null;
      let isGreyBack = false;
      let isMosaicTop = false;
      if (elemConfig.greyBack && elemConfig.greyBack.includes(i)) { layer = 'grey'; isGreyBack = true; }
      else if (elemConfig.grey.includes(i)) layer = 'grey';
      else if (elemConfig.mosaicTop && elemConfig.mosaicTop.includes(i)) { layer = 'mosaic'; isMosaicTop = true; }
      else if (elemConfig.mosaic.includes(i)) layer = 'mosaic';
      else if (elemConfig.overlap.includes(i)) layer = 'overlap';
      if (layer && child instanceof Element) {
        if (layer === 'grey') greyChildren.push(child);
        const wrapper = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
        wrapper.setAttribute('data-illus-layer', layer);
        if (isGreyBack) wrapper.setAttribute('data-illus-grey-back', '');
        if (isMosaicTop) wrapper.setAttribute('data-illus-mosaic-top', '');
        if (layer === 'mosaic' || layer === 'overlap') {
          wrapper.setAttribute('style', 'transform-box: fill-box; transform-origin: center center;');
        }
        child.replaceWith(wrapper);
        wrapper.appendChild(child);
      }
    });
    if (greyChildren.length > 0 && elemConfig.overlap.length > 0) {
      const maskId = `illus-grey-mask-${illusId}-${++_illusClipCounter}`;
      const mask = doc.createElementNS('http://www.w3.org/2000/svg', 'mask');
      mask.setAttribute('id', maskId);
      mask.setAttribute('maskUnits', 'userSpaceOnUse');
      const vb = (svg.getAttribute('viewBox') || '0 0 100 100').split(/\s+/).map(Number);
      mask.setAttribute('x', String(vb[0] - 50));
      mask.setAttribute('y', String(vb[1] - 50));
      mask.setAttribute('width', String(vb[2] + 100));
      mask.setAttribute('height', String(vb[3] + 100));
      const maskG = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
      maskG.setAttribute('data-illus-grey-clip', '');
      greyChildren.forEach(greyEl => {
        const clone = greyEl.cloneNode(true) as Element;
        clone.setAttribute('fill', 'white');
        clone.setAttribute('stroke', 'none');
        clone.removeAttribute('class');
        clone.removeAttribute('data-jira-logo');
        clone.querySelectorAll('[data-jira-logo]').forEach(n => n.removeAttribute('data-jira-logo'));
        clone.querySelectorAll('*').forEach(child => {
          if (child.hasAttribute('fill') && child.getAttribute('fill') !== 'none') child.setAttribute('fill', 'white');
          if (child.hasAttribute('stroke')) child.setAttribute('stroke', 'none');
        });
        maskG.appendChild(clone);
      });
      mask.appendChild(maskG);
      svg.insertBefore(mask, svg.firstChild);
      svg.querySelectorAll('[data-illus-layer="overlap"]').forEach(overlapWrapper => {
        overlapWrapper.setAttribute('mask', `url(#${maskId})`);
      });
    }
    const mosaicLayers = Array.from(svg.querySelectorAll('[data-illus-layer="mosaic"]:not([data-illus-mosaic-top])'));
    const mosaicTopLayers = Array.from(svg.querySelectorAll('[data-illus-layer="mosaic"][data-illus-mosaic-top]'));
    const greyBackLayers = Array.from(svg.querySelectorAll('[data-illus-layer="grey"][data-illus-grey-back]'));
    const greyLayers = Array.from(svg.querySelectorAll('[data-illus-layer="grey"]:not([data-illus-grey-back])'));
    const overlapLayers = Array.from(svg.querySelectorAll('[data-illus-layer="overlap"]'));
    greyBackLayers.forEach(w => svg.appendChild(w));
    mosaicLayers.forEach(w => svg.appendChild(w));
    greyLayers.forEach(w => svg.appendChild(w));
    overlapLayers.forEach(w => svg.appendChild(w));
    mosaicTopLayers.forEach(w => svg.appendChild(w));
    Array.from(svg.children).forEach(child => {
      if (child instanceof Element && child.classList.contains('illus-gesture')) {
        svg.appendChild(child);
      }
    });
  }
  if (rotGroupConfig) {
    if (savedRotateGroupRefs.length > 0 && elemConfig) {
      const effectiveRefs = savedRotateGroupRefs.map(el => {
        const parent = el.parentElement;
        if (parent && parent.hasAttribute('data-illus-layer')) return parent;
        return el;
      });
      const seen = new Set<Element>();
      const uniqueRefs: Element[] = [];
      effectiveRefs.forEach(el => { if (!seen.has(el)) { seen.add(el); uniqueRefs.push(el); } });
      const allCurrentChildren = Array.from(svg.children);
      uniqueRefs.sort((a, b) => allCurrentChildren.indexOf(a) - allCurrentChildren.indexOf(b));
      if (uniqueRefs.length > 0 && (uniqueRefs[0].parentElement as Element | null) === (svg as unknown as Element)) {
        const wrapper = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
        wrapper.setAttribute('data-illus-rotate', '');
        uniqueRefs[0].before(wrapper);
        uniqueRefs.forEach(el => {
          if ((el.parentElement as Element | null) === (svg as unknown as Element)) wrapper.appendChild(el);
        });
      }
    } else {
      const allChildren = Array.from(svg.children);
      const sortedIndices = [...rotGroupConfig.elements].sort((a, b) => a - b);
      const firstEl = allChildren[sortedIndices[0]];
      if (firstEl instanceof Element) {
        const wrapper = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
        wrapper.setAttribute('data-illus-rotate', '');
        firstEl.before(wrapper);
        sortedIndices.forEach(idx => {
          const el = allChildren[idx];
          if (el instanceof Element) {
            wrapper.appendChild(el);
          }
        });
      }
    }
  }
  const greyBackToReorder = Array.from(svg.querySelectorAll('[data-illus-grey-back]'));
  if (greyBackToReorder.length > 0) {
    const firstNonDef = Array.from(svg.children).find(
      child => child.tagName !== 'mask' && child.tagName !== 'defs' && child.tagName !== 'style'
    );
    greyBackToReorder.forEach(el => {
      if (firstNonDef && el !== firstNonDef) svg.insertBefore(el, firstNonDef);
    });
  }
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('overflow', 'visible');
  const existingStyle = svg.getAttribute('style') || '';
  svg.setAttribute('style', `${existingStyle}${existingStyle ? '; ' : ''}overflow: visible`);
  const style = doc.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = `.illus-gesture { transform-box: fill-box; transform-origin: center center; animation: illusGesturePulse 0.8s steps(1) infinite; } .illus-gesture-stagger { animation-delay: 0.4s; } @keyframes illusGesturePulse { 0%, 49.9% { transform: scale(1); } 50%, 100% { transform: scale(0.95); } }`;
  svg.insertBefore(style, svg.firstChild);
  return new XMLSerializer().serializeToString(svg);
}

