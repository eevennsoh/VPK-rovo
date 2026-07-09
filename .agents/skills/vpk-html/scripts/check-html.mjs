#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { collectFaviconIssues, cssVarName, loadTokens } from "./shared.mjs";
import { isDeck } from "./presentation.mjs";

const __filename = fileURLToPath(import.meta.url);

function collectMatches(regex, source) {
	const matches = [];
	let match;
	while ((match = regex.exec(source)) !== null) {
		matches.push(match[0]);
	}
	return matches;
}

export function collectColorTokenIssues(source, label = "document") {
	if (/[/\\]assets[/\\]html-effectiveness[/\\]/.test(label)) return [];
	if (/data-vpk-raw-colors-allowed=["']true["']/.test(source)) return [];

	const stripped = source
		.replace(/<svg\b(?=[^>]*\bdata-vpk-external-asset\b)[\s\S]*?<\/svg>/gi, "<svg data-vpk-external-asset></svg>")
		.replace(/url\(["']?data:font\/(?:woff2|otf|ttf);base64,[^)]+?\)/g, "url(data:font/...,...)")
		.replace(/url\(["']?data:image\/[^)]+?\)/g, "url(data:image/...)")
		.replace(/\[[^\]]*(?:fill|stroke)=["']#[0-9A-Fa-f]{3,8}["'][^\]]*\]/g, "[svg-color-selector]")
		.replace(/\b(?:href|id|for|aria-controls|aria-labelledby)=["']#[^"']+["']/gi, "fragment-ref")
		.replace(/\b(?:PR|Pull Request)\s+#[0-9A-Fa-f]{3,8}\b/g, "issue-ref")
		.replace(/&#[0-9A-Fa-f]+;/g, "numeric-entity");

	const issues = [];
	const colorPattern = /#[0-9A-Fa-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\([^)]*\)/gi;
	const lines = stripped.split("\n");
	for (let index = 0; index < lines.length; index++) {
		const line = lines[index];
		const matches = [...line.matchAll(colorPattern)]
			.map(match => match[0])
			.filter(match => !(line.includes("<") && /^#[0-9]{3,8}$/.test(match)));
		if (matches.length === 0) continue;

		const isTokenDeclaration = isAllowedTokenColorDeclaration(line);
		const isBrandOverrideFallback = /var\(--ds-brand-override,\s*#[0-9A-Fa-f]{3,8}\)/.test(line);
		const isAllowedGeneratedNoise = /sourceMappingURL=/.test(line);

		if (!isTokenDeclaration && !isBrandOverrideFallback && !isAllowedGeneratedNoise) {
			issues.push(`line ${index + 1}: ${[...new Set(matches)].join(", ")}`);
			if (issues.length >= 12) break;
		}
	}

	if (issues.length > 0) {
		return [`contains raw color literals outside the vpk semantic alias layer (${issues.join("; ")})`];
	}
	return [];
}

function normalizeColorDeclarationValue(value) {
	return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function buildAllowedTokenDeclarations() {
	const tokens = loadTokens();
	const declarations = new Map();
	for (const mode of ["semantic", "light", "dark"]) {
		for (const [key, value] of Object.entries(tokens[mode] ?? {})) {
			const cssName = key === "shadow" ? "--shadow" : cssVarName(key);
			if (!declarations.has(cssName)) declarations.set(cssName, new Set());
			declarations.get(cssName).add(normalizeColorDeclarationValue(value));
		}
	}
	return declarations;
}

let allowedTokenDeclarations;

function isAllowedTokenColorDeclaration(line) {
	const match = line.match(/^\s*(--[\w-]+)\s*:\s*([^;]+);/);
	if (!match) return false;
	allowedTokenDeclarations ??= buildAllowedTokenDeclarations();
	const allowedValues = allowedTokenDeclarations.get(match[1]);
	return allowedValues?.has(normalizeColorDeclarationValue(match[2])) ?? false;
}

const ALLOWED_FIGURE_TOKENS = new Set([
	"--paper",
	"--paper-background",
	"--surface-raised",
	"--surface-overlay",
	"--surface-sunken",
	"--headline",
	"--body-text",
	"--ink",
	"--muted-text",
	"--subtlest-text",
	"--inverse-text",
	"--focal",
	"--ill-line",
	"--ill-tone1",
	"--ill-tone2",
	"--ill-tone3",
	"--ill-hatch",
	"--ill-ink50",
	"--ill-guide",
	"--ill-guide-dashed",
	"--ill-frame",
	"--ill-fill",
	"--ill-fill-alt",
	"--rule",
	"--rule-strong",
	"--selected",
	"--heat0",
	"--heat1",
	"--heat2",
	"--heat3",
	"--heat4",
	"--code-surface",
	"--code-ink",
	"--code-inverse",
	"--math-highlight",
	"--success",
	"--success-tint",
	"--warning",
	"--warning-tint",
	"--danger",
	"--danger-tint",
	"--info",
	"--info-tint",
]);

function isAllowedFigureColorValue(value) {
	const normalized = value.trim().replace(/\s+/g, " ");
	if (/^(none|transparent|currentColor|inherit)$/i.test(normalized)) return true;
	const token = normalized.match(/^var\((--[\w-]+)\)$/);
	if (token) return ALLOWED_FIGURE_TOKENS.has(token[1]);
	const mix = normalized.match(/^color-mix\(\s*in\s+srgb\s*,\s*var\((--[\w-]+)\)\s+[\d.]+%\s*,\s*(?:transparent|var\((--[\w-]+)\))\s*\)$/i);
	if (mix) {
		return ALLOWED_FIGURE_TOKENS.has(mix[1]) && (!mix[2] || ALLOWED_FIGURE_TOKENS.has(mix[2]));
	}
	return false;
}

function findLineNumber(source, index) {
	return source.slice(0, index).split("\n").length;
}

function collectSvgColorIssues(svg, baseLine) {
	const issues = [];
	const attrPattern = /\b(fill|stroke|stop-color|color)=["']([^"']+)["']/gi;
	let match;
	while ((match = attrPattern.exec(svg)) !== null) {
		if (match[1].toLowerCase() === "fill") {
			const tagStart = svg.lastIndexOf("<", match.index);
			const tag = tagStart >= 0 ? svg.slice(tagStart, match.index) : "";
			if (/^<\s*(?:animate|animateTransform|animateMotion|set)\b/i.test(tag)) continue;
		}
		if (!isAllowedFigureColorValue(match[2])) {
			issues.push(`line ${baseLine + findLineNumber(svg, match.index) - 1}: ${match[1]}="${match[2]}" must use grayscale figure tokens`);
		}
	}

	const styleAttrPattern = /\bstyle=["']([^"']+)["']/gi;
	while ((match = styleAttrPattern.exec(svg)) !== null) {
		const style = match[1];
		for (const property of style.matchAll(/\b(fill|stroke|stop-color|color)\s*:\s*([^;]+)/gi)) {
			if (!isAllowedFigureColorValue(property[2])) {
				issues.push(`line ${baseLine + findLineNumber(svg, match.index) - 1}: ${property[1]}:${property[2].trim()} must use grayscale figure tokens`);
			}
		}
	}

	const styleBlockPattern = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
	while ((match = styleBlockPattern.exec(svg)) !== null) {
		for (const property of match[1].matchAll(/\b(fill|stroke|stop-color|color)\s*:\s*([^;}]+)/gi)) {
			if (!isAllowedFigureColorValue(property[2])) {
				issues.push(`line ${baseLine + findLineNumber(svg, match.index) - 1}: ${property[1]}:${property[2].trim()} must use grayscale figure tokens`);
			}
		}
	}
	return issues;
}

function collectSvgFontIssues(svg, baseLine) {
	const issues = [];
	const pattern = /\bfont-family=["']([^"']+)["']|\bfont-family\s*:\s*([^;}"']+)/gi;
	let match;
	while ((match = pattern.exec(svg)) !== null) {
		const family = (match[1] ?? match[2] ?? "").trim();
		if (!/(Geist Mono|var\(--font-mono\)|var\(--font-numeric\)|Geist Mono Numeric)/i.test(family)) {
			issues.push(`line ${baseLine + findLineNumber(svg, match.index) - 1}: SVG font-family must resolve to Geist Mono, got "${family}"`);
		}
	}
	return issues;
}

function collectSvgStrokeWidthIssues(svg, baseLine) {
	const issues = [];
	const pattern = /\bstroke-width=["']?([^"'\s>]+)["']?|\bstroke-width\s*:\s*([^;}"']+)/gi;
	let match;
	while ((match = pattern.exec(svg)) !== null) {
		const raw = (match[1] ?? match[2] ?? "").trim();
		if (/^(?:var|calc)\(/i.test(raw)) continue;
		const value = Number(raw);
		if (!Number.isFinite(value) || value < 0.5 || value > 2.5) {
			issues.push(`line ${baseLine + findLineNumber(svg, match.index) - 1}: stroke-width "${raw}" must be numeric within 0.5-2.5`);
		}
	}
	return issues;
}

export function collectSvgGrammarIssues(source) {
	const issues = [];
	const svgPattern = /<svg\b[\s\S]*?<\/svg>/gi;
	let match;
	while ((match = svgPattern.exec(source)) !== null) {
		const svg = match[0];
		const root = svg.match(/^<svg\b[^>]*>/i)?.[0] ?? "";
		if (/\bdata-vpk-external-asset\b/i.test(root)) continue;
		const baseLine = findLineNumber(source, match.index);

		if (/<(?:linearGradient|radialGradient|filter|feDropShadow)\b|filter\s*=|drop-shadow\(/i.test(svg)) {
			issues.push(`line ${baseLine}: SVG must not use gradients, filters, or drop shadows`);
		}
		if (/var\(--(?:accent|link)[\w-]*\)/i.test(svg)) {
			issues.push(`line ${baseLine}: SVG must not use accent or link tokens`);
		}
		issues.push(...collectSvgColorIssues(svg, baseLine));
		issues.push(...collectSvgFontIssues(svg, baseLine));
		issues.push(...collectSvgStrokeWidthIssues(svg, baseLine));
		if (issues.length >= 12) return [`SVG grammar violations (${issues.slice(0, 12).join("; ")})`];
	}
	return issues.length > 0 ? [`SVG grammar violations (${issues.slice(0, 12).join("; ")})`] : [];
}

export function collectSelfReferentialCustomPropertyIssues(source) {
	const issues = [];
	const lines = source.split("\n");
	for (let index = 0; index < lines.length; index++) {
		const match = lines[index].match(/^\s*(--[\w-]+)\s*:\s*var\(\1\);\s*$/);
		if (!match) continue;
		issues.push(`line ${index + 1}: ${match[1]}`);
		if (issues.length >= 12) break;
	}

	if (issues.length > 0) {
		return [`contains self-referential custom properties that invalidate theme tokens (${issues.join("; ")})`];
	}
	return [];
}

export function collectPresentationIssues(source) {
	if (!isDeck(source)) return [];
	const issues = [];
	if (!/<script\b[^>]*\bdata-vpk-presentation-runtime\b/i.test(source)) {
		issues.push("deck is missing the shared presentation runtime script");
	}
	if (!/\.speaker-notes\s*\{[\s\S]*?display:\s*none\s*!important/i.test(source)) {
		issues.push("deck does not hide .speaker-notes by default");
	}
	if (!/@media\s+print\s*\{[\s\S]*?(?:animation|transition|transform):\s*none\s*!important/i.test(source)) {
		issues.push("deck is missing the print motion neutralizer");
	}
	return issues;
}

export function collectSmilMotionIssues(source) {
	const animations = collectMatches(/<animateTransform\b[^>]*>/gi, source);
	if (animations.length === 0) return [];

	const issues = [];
	const unsafe = animations.find(tag => !/\bbegin=["']indefinite["']/i.test(tag));
	if (unsafe) {
		issues.push(`animateTransform must use begin="indefinite": ${unsafe}`);
	}
	if (!/<script\b[^>]*\bdata-vpk-smil-starter\b/i.test(source)) {
		issues.push("animateTransform requires a data-vpk-smil-starter script");
	}
	return issues;
}

function hasAttribute(tag, attribute) {
	return new RegExp(`\\s${attribute}(?:\\s*=|\\s|>)`, "i").test(tag);
}

export function validateHtmlString(html, label = "document") {
	const failures = [];

	// Landing/product-site mode (opt-in, parallels data-vpk-upstream-demo): a
	// screen-first page may legitimately load remote assets (analytics, OG images)
	// and link companion files (sitemap, canonical). This loosens ONLY the
	// remote-asset + external-stylesheet rules; every other offline invariant
	// (embedded fonts, dark block, a11y, main landmark, no unresolved {{...}})
	// still applies.
	const isLanding = /<html\b[^>]*\bdata-vpk-landing=["']true["']/i.test(html);

	if (/{{[^}]+}}/.test(html) && !/data-vpk-literal-double-braces="true"/.test(html)) {
		failures.push("contains unresolved {{...}} placeholder tokens");
	}

	const remotePatterns = [
		/<script\b[^>]*\bsrc=["']https?:\/\//gi,
		/<link\b[^>]*\bhref=["']https?:\/\//gi,
		/<(?:img|source|iframe|audio|video|object|embed)\b[^>]*(?:src|data|poster)=["']https?:\/\//gi,
		/url\(\s*["']?https?:\/\//gi,
		/@import\s+(?:url\()?["']?https?:\/\//gi,
	];
	if (!isLanding) {
		for (const pattern of remotePatterns) {
			const matches = collectMatches(pattern, html);
			if (matches.length > 0) {
				failures.push(`contains remote runtime asset reference: ${matches[0]}`);
			}
		}
	}

	if (!/@font-face[\s\S]+data:font\/(?:woff2|otf|ttf);base64,/.test(html)) {
		failures.push("does not embed local fonts as data URIs");
	}

	if (!isLanding && /<link\b[^>]*rel=["'][^"']*stylesheet/i.test(html)) {
		failures.push("contains an external stylesheet link instead of inline CSS");
	}

	if (/<script\b[^>]*\bsrc=/i.test(html)) {
		failures.push("contains a non-inline script");
	}

	if (!/<style>[\s\S]*<\/style>/i.test(html)) {
		failures.push("does not contain inline CSS");
	}

	failures.push(...collectColorTokenIssues(html, label));
	failures.push(...collectSelfReferentialCustomPropertyIssues(html));
	failures.push(...collectFaviconIssues(html));
	failures.push(...collectPresentationIssues(html));
	failures.push(...collectSmilMotionIssues(html));
	failures.push(...collectSvgGrammarIssues(html));

	if (!/\[data-theme="dark"\]/.test(html) || !/color-scheme:\s*light dark/.test(html)) {
		failures.push("does not contain the dark-mode token block");
	}

	if (/data-vpk-toggle-allowed="true"/.test(html) && !/data-vpk-theme-toggle/.test(html)) {
		failures.push("allows theme toggle but does not render the toggle control");
	}

	const metadataComments = collectMatches(/<!--[\s\S]*?-->/g, html);
	for (const comment of metadataComments) {
		if (/\/Users\/|[A-Za-z]:\\/.test(comment)) {
			failures.push("metadata comment contains an absolute source path");
			break;
		}
	}

	const imageTags = collectMatches(/<img\b[^>]*>/gi, html);
	for (const tag of imageTags) {
		if (!hasAttribute(tag, "alt")) {
			failures.push(`image tag lacks alt text: ${tag}`);
			break;
		}
	}

	const svgTags = collectMatches(/<svg\b[^>]*>/gi, html);
	for (const tag of svgTags) {
		if (!hasAttribute(tag, "aria-label") && !hasAttribute(tag, "aria-hidden") && !hasAttribute(tag, "aria-labelledby")) {
			failures.push(`svg lacks accessible name or decorative marker: ${tag}`);
			break;
		}
	}

	const controlTags = collectMatches(/<(?:button|textarea|input)\b[^>]*>/gi, html);
	for (const tag of controlTags) {
		if (/<input\b/i.test(tag) && /type=["']hidden["']/i.test(tag)) continue;
		if (/<button\b/i.test(tag)) {
			const tagEnd = html.indexOf("</button>", html.indexOf(tag));
			const text = tagEnd >= 0 ? html.slice(html.indexOf(tag) + tag.length, tagEnd).trim() : "";
			if (!text && !hasAttribute(tag, "aria-label") && !hasAttribute(tag, "aria-labelledby")) {
				failures.push(`button lacks accessible name: ${tag}`);
				break;
			}
		}
	}

	if (!/<main\b/i.test(html)) {
		failures.push("does not contain a main landmark");
	}

	return {
		ok: failures.length === 0,
		label,
		failures,
	};
}

export function validateHtmlFile(filePath) {
	const html = fs.readFileSync(filePath, "utf8");
	return validateHtmlString(html, filePath);
}

export function auditColorTokensFile(filePath) {
	const html = fs.readFileSync(filePath, "utf8");
	return {
		ok: collectColorTokenIssues(html, filePath).length === 0,
		label: filePath,
		failures: collectColorTokenIssues(html, filePath),
	};
}

async function main() {
	const files = process.argv.slice(2);
	if (files.length === 0) {
		console.error("Usage: check-html.mjs <file.html> [more.html]");
		process.exitCode = 1;
		return;
	}

	const results = files.map(file => validateHtmlFile(path.resolve(process.cwd(), file)));
	for (const result of results) {
		if (result.ok) {
			console.log(`ok ${result.label}`);
		} else {
			console.error(`not ok ${result.label}`);
			for (const failure of result.failures) {
				console.error(`- ${failure}`);
			}
		}
	}

	if (results.some(result => !result.ok)) {
		process.exitCode = 1;
	}
}

if (process.argv[1] === __filename) {
	await main();
}
