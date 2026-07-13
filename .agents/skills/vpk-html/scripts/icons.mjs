// Build-time @atlaskit icon → inline SVG extractor for the pure-HTML vpk-html artifacts.
//
// The offline artifacts are pure HTML (no React), so we cannot import @atlaskit icon
// components. Instead we read the glyph markup that those components render — each
// @atlaskit/icon/core/<name>.js exposes its artwork as a `dangerouslySetGlyph` template
// string (the inner <path fill="currentcolor"> only) — and wrap it in an <svg> that mirrors
// the VPK Icon visual contract: a 16x16 viewBox rendered at a fixed pixel size, painted with
// `currentColor` so it inherits the control's text color and stays theme-correct automatically.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ICON_CORE_DIR = path.join(path.dirname(require.resolve("@atlaskit/icon/package.json")), "core");
const ICON_LAB_CORE_DIR = path.join(path.dirname(require.resolve("@atlaskit/icon-lab/package.json")), "core");

const glyphCache = new Map();

function readGlyph(name) {
	const cached = glyphCache.get(name);
	if (cached !== undefined) {
		return cached;
	}
	const coreFile = path.join(ICON_CORE_DIR, `${name}.js`);
	const file = fs.existsSync(coreFile) ? coreFile : path.join(ICON_LAB_CORE_DIR, `${name}.js`);
	const source = fs.readFileSync(file, "utf8");
	const match = /dangerouslySetGlyph:\s*`([\s\S]*?)`/.exec(source);
	if (!match) {
		throw new Error(`icons.mjs: could not extract glyph for "${name}" from ${file}`);
	}
	const glyph = match[1].trim();
	glyphCache.set(name, glyph);
	return glyph;
}

/**
 * Return a pure-HTML inline <svg> string for an @atlaskit core icon.
 * @param {string} name @atlaskit/icon/core file name (e.g. "arrow-up", "theme")
 * @param {{ size?: number, label?: string, className?: string }} [options]
 *   size: rendered px (default 16, matching VPK Icon "small"); label: sets role="img" + aria-label
 *   (omit for decorative icons, which are aria-hidden); className: optional class on the <svg>.
 */
export function inlineIcon(name, { size = 16, label, className } = {}) {
	const glyph = readGlyph(name);
	const a11y = label
		? `role="img" aria-label="${label}"`
		: `aria-hidden="true" focusable="false"`;
	const classAttr = className ? ` class="${className}"` : "";
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="${size}" height="${size}" fill="currentColor"${classAttr} ${a11y}>${glyph}</svg>`;
}
