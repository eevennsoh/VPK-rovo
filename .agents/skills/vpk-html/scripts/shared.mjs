import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT = path.resolve(__dirname, "..");
export const TEMPLATES = path.join(ROOT, "assets", "templates");
export const DIAGRAMS = path.join(ROOT, "assets", "diagrams");
export const ILLUSTRATIONS = path.join(ROOT, "assets", "illustrations");
export const DEMOS = path.join(ROOT, "assets", "demos");
export const FONTS_DIR = path.join(ROOT, "assets", "fonts");
export const TOKENS_FILE = path.join(ROOT, "references", "tokens.json");
export const STYLES_FILE = path.join(ROOT, "styles.css");
export const SHARED_CSS_START = "/* vpk-shared:start */";
export const SHARED_CSS_END = "/* vpk-shared:end */";

export const FONT_STACKS = {
	display: '"Charlie Display", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
	body: '"Charlie Text", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
	mono: '"Atlassian Mono", ui-monospace, "SFMono-Regular", Consolas, monospace',
	numeric: '"Atlassian Mono Numeric", "Atlassian Mono", ui-monospace, "SFMono-Regular", Consolas, monospace',
};

FONT_STACKS.sans = FONT_STACKS.body;

const FONT_METADATA = {
	otf: { format: "opentype", mime: "font/otf" },
	ttf: { format: "truetype", mime: "font/ttf" },
	woff2: { format: "woff2", mime: "font/woff2" },
};

export const FONT_FILES = [
	{ family: "Charlie Display", file: "CharlieDisplay-Regular.otf", weight: 400 },
	{ family: "Charlie Display", file: "CharlieDisplay-Semibold.otf", weight: 600 },
	{ family: "Charlie Display", file: "CharlieDisplay-Bold.otf", weight: 700 },
	{ family: "Charlie Display", file: "CharlieDisplay-Black.otf", weight: 900 },
	{ family: "Charlie Display", file: "CharlieDisplay-Italic.otf", weight: 400, style: "italic" },
	{ family: "Charlie Text", file: "CharlieText-Regular.otf", weight: 400 },
	{ family: "Charlie Text", file: "CharlieText-Semibold.otf", weight: 600 },
	{ family: "Charlie Text", file: "CharlieText-Bold.otf", weight: 700 },
	{ family: "Charlie Text", file: "CharlieText-Italic.otf", weight: 400, style: "italic" },
	{ family: "Atlassian Mono", file: "AtlassianMono.v2.ttf", weight: 400 },
	{ family: "Atlassian Mono", file: "AtlassianMonoItalic.v2.ttf", weight: 400, style: "italic" },
	{ family: "Atlassian Mono Numeric", file: "AtlassianMono.v2.ttf", weight: 400, unicodeRange: "U+0030-0039" },
].map(font => {
	const extension = path.extname(font.file).slice(1).toLowerCase();
	const metadata = FONT_METADATA[extension];
	if (!metadata) throw new Error(`Unsupported font type: ${font.file}`);
	return {
		style: "normal",
		...metadata,
		...font,
	};
});

const VPK_FAVICON_SVGS = {
	fallback: '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="32" rx="8" fill="#121212"/><circle cx="11" cy="21" r="5" fill="white"/><circle cx="21" cy="21" r="5" fill="white"/><circle cx="11" cy="11" r="5" fill="white"/><circle cx="21" cy="11" r="5" fill="white"/></svg>',
	dark: '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="9" cy="23" r="5" fill="#121212"/><circle cx="23" cy="23" r="5" fill="#121212"/><circle cx="9" cy="9" r="5" fill="#121212"/><circle cx="23" cy="9" r="5" fill="#121212"/></svg>',
	light: '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="9" cy="23" r="5" fill="white" stroke="#121212" stroke-width="1.25"/><circle cx="23" cy="23" r="5" fill="white" stroke="#121212" stroke-width="1.25"/><circle cx="9" cy="9" r="5" fill="white" stroke="#121212" stroke-width="1.25"/><circle cx="23" cy="9" r="5" fill="white" stroke="#121212" stroke-width="1.25"/></svg>',
};

function svgDataUrl(svg) {
	return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const FAVICON_LINKS = [
	{ variant: "fallback", href: svgDataUrl(VPK_FAVICON_SVGS.fallback) },
	{ variant: "dark", href: svgDataUrl(VPK_FAVICON_SVGS.dark), media: "(prefers-color-scheme: light)" },
	{ variant: "light", href: svgDataUrl(VPK_FAVICON_SVGS.light), media: "(prefers-color-scheme: dark)" },
];

export function buildFaviconLinkBlock() {
	return FAVICON_LINKS.map(({ href, media }) => {
		const mediaAttribute = media ? ` media="${media}"` : "";
		return `<link rel="icon" type="image/svg+xml" sizes="any"${mediaAttribute} href="${href}">`;
	}).join("\n");
}

export function stripSelfReferentialCustomProperties(source) {
	return source.replace(/^[\t ]*(--[\w-]+)\s*:\s*var\(\1\);\s*$/gm, "");
}

export function hasVpkFaviconLinks(html) {
	return FAVICON_LINKS.every(({ href, media }) => {
		const hrefPattern = escapeRegExp(href);
		const mediaPattern = media ? `(?=[^>]*\\bmedia=["']${escapeRegExp(media)}["'])` : "";
		const pattern = new RegExp(`<link\\b(?=[^>]*\\brel=["'][^"']*\\bicon\\b[^"']*["'])(?=[^>]*\\bhref=["']${hrefPattern}["'])${mediaPattern}[^>]*>`, "i");
		return pattern.test(html);
	});
}

export function collectFaviconIssues(html) {
	if (!/<meta\s+name=["']generator["']\s+content=["']vpk-html["']/i.test(html)) {
		return [];
	}
	if (hasVpkFaviconLinks(html)) {
		return [];
	}
	return ["missing vpk-rovo favicon link set"];
}

export function ensureFaviconLinks(html) {
	if (hasVpkFaviconLinks(html)) {
		return html;
	}

	const faviconBlock = buildFaviconLinkBlock();
	const generatorMeta = /(<meta\s+name=["']generator["']\s+content=["']vpk-html["']\s*\/?>\s*)/i;
	if (generatorMeta.test(html)) {
		return html.replace(generatorMeta, `$1\n${faviconBlock}\n`);
	}

	const viewportMeta = /(<meta\s+name=["']viewport["'][^>]*>\s*)/i;
	if (viewportMeta.test(html)) {
		return html.replace(viewportMeta, `$1\n${faviconBlock}\n`);
	}

	return html.replace(/(<style\b)/i, `${faviconBlock}\n$1`);
}

const TOKEN_ORDER = [
	"paper",
	"paperBackground",
	"surfaceRaised",
	"surfaceOverlay",
	"surfaceSunken",
	"headline",
	"bodyText",
	"ink",
	"mutedText",
	"subtlestText",
	"inverseText",
	"primaryBlue",
	"primaryBlueTint",
	"primaryBlueTintStrong",
	"illLine",
	"illTone1",
	"illTone2",
	"illTone3",
	"illHatch",
	"illInk50",
	"rule",
	"ruleStrong",
	"link",
	"linkPressed",
	"selected",
	"accentLime",
	"accentPurple",
	"accentSaffron",
	"accentOrange",
	"accentNavy",
	"accentGreen",
	"accentRed",
	"collectionSoftware",
	"collectionProduct",
	"collectionService",
	"gridDot",
	"gridLine",
	"focusRing",
	"codeSurface",
	"codeInk",
	"codeInverse",
	"mathHighlight",
	"success",
	"successTint",
	"warning",
	"warningTint",
	"danger",
	"dangerTint",
	"info",
	"infoTint",
];

const ROOT_BLOCK = /:root\s*\{([^}]*)\}/s;
const DARK_BLOCK = /\[data-theme=["']dark["']\]\s*\{([^}]*)\}/s;
const CSS_VAR = /(--[\w-]+)\s*:\s*([^;]+);/g;

function cssVarName(key) {
	return `--${key.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)}`;
}

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeCss(css) {
	return css.trim().replace(/\r\n/g, "\n");
}

function semanticWithFallback(semanticValue, fallbackValue) {
	const match = semanticValue.match(/^var\((--ds-[^,\s]+),\s*[^)]+\)$/);
	if (!match) return fallbackValue.toLowerCase();
	return `var(${match[1]}, ${fallbackValue.toLowerCase()})`;
}

function pushThemeAliases(lines) {
	lines.push(`\t--font-display: ${FONT_STACKS.display};`);
	lines.push(`\t--font-body: ${FONT_STACKS.body};`);
	lines.push(`\t--font-mono: ${FONT_STACKS.mono};`);
	lines.push(`\t--font-numeric: ${FONT_STACKS.numeric};`);
	lines.push("\t--font-sans: var(--font-body);");
	lines.push("\t--brand: var(--primary-blue);");
	lines.push("\t--accent: var(--primary-blue);");
	lines.push("\t--primary: var(--primary-blue);");
	lines.push("\t--accent-primary: var(--primary-blue);");
	lines.push("\t--ease-out: cubic-bezier(0.23,1,0.32,1);");
	lines.push("\t--ease-in-out: cubic-bezier(0.77,0,0.175,1);");
	lines.push("\t--vpk-dur-fast: 160ms;");
	lines.push("\t--vpk-dur-enter: 280ms;");
	lines.push("\t--vpk-dur-slide-out: 180ms;");
	lines.push("\t--vpk-stagger: 40ms;");
	lines.push("\t--vpk-enter-y: 12px;");
	lines.push("\t--collection-accent-software: var(--collection-software);");
	lines.push("\t--collection-accent-product: var(--collection-product);");
	lines.push("\t--collection-accent-service: var(--collection-service);");
	lines.push("\t--paper-rule: var(--grid-dot);");
	lines.push("\t--grid-major-size: 72px;");
	lines.push("\t--grid-dot-gap: 12px;");
	lines.push("\t--grid-background: radial-gradient(circle at 1px 1px, var(--grid-dot) 1.25px, transparent 1.5px), radial-gradient(circle at 1px 1px, var(--grid-dot) 1.25px, transparent 1.5px);");
	lines.push("\t--grid-background-size: var(--grid-major-size) var(--grid-dot-gap), var(--grid-dot-gap) var(--grid-major-size);");
}

export function buildMotionCssBlock() {
	return `/* vpk motion system */
@keyframes vpk-enter {
\tfrom {
\t\topacity: 0;
\t\ttransform: translateY(var(--vpk-enter-y));
\t}
\tto {
\t\topacity: 1;
\t\ttransform: translateY(0);
\t}
}

@keyframes vpk-slide-in {
\tfrom {
\t\topacity: 0;
\t\ttransform: var(--vpk-slide-enter-from, translateX(24px));
\t}
\tto {
\t\topacity: 1;
\t\ttransform: var(--vpk-slide-enter-to, translateX(0));
\t}
}

@keyframes vpk-slide-out {
\tfrom { opacity: 1; }
\tto { opacity: 0; }
}

body[data-vpk-motion] main > * {
\tanimation: vpk-enter var(--vpk-dur-enter) var(--ease-out) both;
}

body[data-vpk-motion] main > *:nth-child(1) { animation-delay: 0ms; }
body[data-vpk-motion] main > *:nth-child(2) { animation-delay: calc(var(--vpk-stagger) * 1); }
body[data-vpk-motion] main > *:nth-child(3) { animation-delay: calc(var(--vpk-stagger) * 2); }
body[data-vpk-motion] main > *:nth-child(4) { animation-delay: calc(var(--vpk-stagger) * 3); }
body[data-vpk-motion] main > *:nth-child(5) { animation-delay: calc(var(--vpk-stagger) * 4); }
body[data-vpk-motion] main > *:nth-child(n + 6) { animation-delay: calc(var(--vpk-stagger) * 5); }

@supports (animation-timeline: view()) {
\tbody[data-vpk-motion="document"] main section {
\t\tanimation-name: vpk-enter;
\t\tanimation-duration: var(--vpk-dur-enter);
\t\tanimation-fill-mode: both;
\t\tanimation-timing-function: var(--ease-out);
\t\tanimation-timeline: view();
\t\tanimation-range: entry 0% entry 40%;
\t}
}

a,
button,
summary,
[role="button"],
.toc a,
.demo-row {
\ttransition:
\t\tbackground-color var(--vpk-dur-fast) var(--ease-out),
\t\tborder-color var(--vpk-dur-fast) var(--ease-out),
\t\tbox-shadow var(--vpk-dur-fast) var(--ease-out),
\t\tcolor var(--vpk-dur-fast) var(--ease-out),
\t\topacity var(--vpk-dur-fast) var(--ease-out),
\t\ttransform var(--vpk-dur-fast) var(--ease-out);
}

button:active,
[role="button"]:active,
.demo-row:active {
\ttransform: scale(0.97);
}

@media (prefers-reduced-motion: reduce) {
\t:root {
\t\t--vpk-enter-y: 0px;
\t\t--vpk-stagger: 0ms;
\t}

\tbody[data-vpk-motion] *,
\tbody[data-vpk-motion] *::before,
\tbody[data-vpk-motion] *::after {
\t\tanimation-duration: 200ms !important;
\t\ttransition-duration: 200ms !important;
\t}

\tbody[data-vpk-motion] .slide.is-active,
\tbody[data-vpk-motion] .slide.is-leaving {
\t\ttransform: var(--vpk-slide-enter-to, none) !important;
\t}
}

@media print {
\t*,
\t*::before,
\t*::after {
\t\tanimation: none !important;
\t\ttransition: none !important;
\t\ttransform: none !important;
\t\topacity: 1 !important;
\t}
}`;
}

function listHtmlFiles(directory) {
	if (!fs.existsSync(directory)) return [];
	return fs.readdirSync(directory)
		.filter(name => name.endsWith(".html"))
		.map(name => path.join(directory, name));
}

function collectBlockVars(source, blockPattern) {
	const block = blockPattern.exec(source)?.[1];
	if (!block) return null;

	const vars = new Map();
	for (const match of block.matchAll(CSS_VAR)) {
		if (!vars.has(match[1])) vars.set(match[1], match[2].trim());
	}
	return vars;
}

function collectStyleVars(source) {
	return {
		root: collectBlockVars(source, ROOT_BLOCK),
		dark: collectBlockVars(source, DARK_BLOCK),
	};
}

function compareStyleVars(filePath, expected, actual) {
	const issues = [];
	for (const mode of ["root", "dark"]) {
		const expectedVars = expected[mode];
		const actualVars = actual[mode];
		if (!expectedVars || !actualVars) {
			issues.push(`${path.relative(ROOT, filePath)} missing ${mode === "root" ? ":root" : "[data-theme=\"dark\"]"} token block`);
			continue;
		}
		for (const [name, expectedValue] of expectedVars) {
			const actualValue = actualVars.get(name);
			if (actualValue !== undefined && actualValue.toLowerCase() !== expectedValue.toLowerCase()) {
				issues.push(`${path.relative(ROOT, filePath)}: ${name} expected ${expectedValue}, got ${actualValue}`);
			}
		}
	}
	return issues;
}

export function loadTokens() {
	return readJson(TOKENS_FILE);
}

export function buildStylesCssFromTokens(tokens = loadTokens()) {
	const lines = [":root {", "\tcolor-scheme: light dark;"];
	for (const key of TOKEN_ORDER) {
		if (!tokens.semantic[key]) throw new Error(`Missing semantic token: ${key}`);
		lines.push(`\t${cssVarName(key)}: ${tokens.semantic[key]};`);
	}
	pushThemeAliases(lines);
	lines.push(`\t--shadow: var(--ds-shadow-raised, ${tokens.light.shadow});`);
	lines.push("}", "");
	lines.push('[data-theme="dark"] {');
	for (const key of TOKEN_ORDER) {
		if (!tokens.semantic[key]) throw new Error(`Missing semantic token: ${key}`);
		if (!tokens.dark[key]) throw new Error(`Missing dark token: ${key}`);
		lines.push(`\t${cssVarName(key)}: ${semanticWithFallback(tokens.semantic[key], tokens.dark[key])};`);
	}
	pushThemeAliases(lines);
	lines.push(`\t--shadow: var(--ds-shadow-raised, ${tokens.dark.shadow});`);
	lines.push("}", "");
	lines.push("@media (prefers-reduced-motion: reduce) {");
	lines.push("\t*,");
	lines.push("\t*::before,");
	lines.push("\t*::after {");
	lines.push("\t\tanimation-duration: 0.001ms !important;");
	lines.push("\t\tscroll-behavior: auto !important;");
	lines.push("\t\ttransition-duration: 0.001ms !important;");
	lines.push("\t}");
	lines.push("}");
	lines.push("");
	lines.push(buildMotionCssBlock());
	return `${lines.join("\n")}\n`;
}

export function readStylesCss() {
	if (!fs.existsSync(STYLES_FILE)) {
		throw new Error(`Styles file not found: ${STYLES_FILE}`);
	}
	return fs.readFileSync(STYLES_FILE, "utf8").trim();
}

export function wrapSharedCss(css = readStylesCss()) {
	if (css.includes(SHARED_CSS_START) && css.includes(SHARED_CSS_END)) return css;
	return `${SHARED_CSS_START}\n${css.trim()}\n${SHARED_CSS_END}`;
}

export function checkStyleSource() {
	const expected = normalizeCss(buildStylesCssFromTokens());
	const actual = normalizeCss(readStylesCss());
	if (actual === expected) return [];
	return [
		"styles.css does not match references/tokens.json",
		"run: node .agents/skills/vpk-html/scripts/build.mjs --write-styles",
	];
}

export function writeStylesCssFromTokens() {
	fs.writeFileSync(STYLES_FILE, buildStylesCssFromTokens(), "utf8");
}

export function checkStyleConsumers() {
	const sharedCss = readStylesCss();
	const expected = collectStyleVars(sharedCss);
	const files = [
		...listHtmlFiles(TEMPLATES),
		...listHtmlFiles(DIAGRAMS),
		...listHtmlFiles(ILLUSTRATIONS),
		...listHtmlFiles(DEMOS),
	];
	const drift = [];
	for (const filePath of files) {
		const content = fs.readFileSync(filePath, "utf8");
		drift.push(...compareStyleVars(filePath, expected, collectStyleVars(content)));
	}
	return drift;
}

export function inlineFont(fileName, mime = "font/woff2") {
	const filePath = path.join(FONTS_DIR, fileName);
	if (!fs.existsSync(filePath)) {
		throw new Error(`Font file not found: ${filePath}`);
	}
	return `data:${mime};base64,${fs.readFileSync(filePath).toString("base64")}`;
}

export function buildFontFaceBlock() {
	return FONT_FILES.map(({ family, file, format, mime, weight, style, unicodeRange }) => {
		const unicodeRangeRule = unicodeRange ? `\n\tunicode-range: ${unicodeRange};` : "";
		return `@font-face {
\tfont-family: "${family}";
\tsrc: url("${inlineFont(file, mime)}") format("${format}");
\tfont-weight: ${weight};
\tfont-style: ${style};
\tfont-display: swap;
${unicodeRangeRule}}`;
	}).join("\n");
}

export function buildSharedCssBlock() {
	return `${buildFontFaceBlock()}\n${wrapSharedCss()}`;
}

// Wrap the body's visible content in a <main> landmark, closing before any
// trailing <script> (or </body> when there is none). Idempotent. Slice-based
// placement; used by the editorial templates (see scripts/build.test.js).
export function addMainLandmark(text) {
	if (/<main\b/i.test(text)) return text;
	const bodyOpenMatch = /<body([^>]*)>/i.exec(text);
	if (!bodyOpenMatch) return text;
	const bodyOpenEnd = bodyOpenMatch.index + bodyOpenMatch[0].length;
	const bodyTail = text.slice(bodyOpenEnd);
	const bodyCloseMatch = /<\/body>/i.exec(bodyTail);
	if (!bodyCloseMatch) return text;
	const bodyContent = bodyTail.slice(0, bodyCloseMatch.index);
	const bodyScriptMatch = /<script\b/i.exec(bodyContent);
	const mainCloseOffset = bodyOpenEnd + (bodyScriptMatch ? bodyScriptMatch.index : bodyCloseMatch.index);
	return `${text.slice(0, bodyOpenEnd)}\n<main>${text.slice(bodyOpenEnd, mainCloseOffset)}\n</main>${text.slice(mainCloseOffset)}`;
}

// Regex two-step landmark with an aria-label, used by the curated + upstream demo
// families. Distinct whitespace handling from addMainLandmark — kept separate so
// each family's output stays byte-for-byte stable. Idempotent.
export function addLabeledMainLandmark(html, label) {
	if (/<main\b/i.test(html)) return html;
	return html
		.replace(/<body([^>]*)>/i, `<body$1>\n<main aria-label="${label}">`)
		.replace(/(\s*)(<script\b|<\/body>)/i, `\n</main>$1$2`);
}
