#!/usr/bin/env node
/*
 * port-kami — re-skins kami's editorial sources into vpk-html's Atlassian deck
 * identity (Charlie Display mastheads + Charlie Text body + Atlassian Mono
 * numerals/code). Consolidates the former port-templates.mjs, port-diagrams.mjs,
 * and port-demos.mjs into one CLI; layout, @page rules, SVG geometry, and
 * {{placeholders}} are preserved verbatim — only chrome (fonts, colors,
 * @font-face/theme blocks) changes, plus mode-specific identity overrides.
 *
 * Source: https://github.com/tw93/Kami (MIT)
 *
 * Usage:
 *   node scripts/port-kami.mjs                 # all three modes
 *   node scripts/port-kami.mjs --templates
 *   node scripts/port-kami.mjs --diagrams
 *   node scripts/port-kami.mjs --demos
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
	addLabeledMainLandmark,
	addMainLandmark,
	buildFontFaceBlock,
	ensureFaviconLinks,
	FONT_STACKS,
	readStylesCss,
	stripSelfReferentialCustomProperties,
} from "./shared.mjs";
import { rewriteKamiColors } from "./kami-color-map.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILL_ROOT = path.resolve(__dirname, "..");
const KAMI_ROOT = path.join(os.homedir(), ".agents/skills/kami");
const KAMI_TEMPLATES = path.join(KAMI_ROOT, "assets/templates");
const KAMI_DIAGRAMS = path.join(KAMI_ROOT, "assets/diagrams");
const KAMI_DEMOS = path.join(KAMI_ROOT, "assets/demos");
const VPK_TEMPLATES = path.join(SKILL_ROOT, "assets/templates");
const VPK_DIAGRAMS = path.join(SKILL_ROOT, "assets/diagrams");
const VPK_DEMOS = path.join(SKILL_ROOT, "assets/demos");

/* ============================ shared plumbing ============================ */

// Strip every kami @font-face block and inject vpk-html's font-face + theme
// block once, just before :root (or right after <style>). Identical across the
// former template and demo porters.
function rewriteFontFaceBlocks(text, fontFaceBlock, themeBlock) {
	let out = text;
	out = out.replace(/@font-face\s*\{[\s\S]*?\}\s*/g, "");
	const injected = `${fontFaceBlock}\n\n${themeBlock}`;
	if (/:root\s*\{/.test(out)) {
		out = out.replace(/(:root\s*\{)/, `${injected}\n\n  $1`);
	} else if (/<style>/.test(out)) {
		out = out.replace(/<style>/, `<style>\n${injected}\n`);
	}
	return out;
}

/* ============================ templates mode ============================ */

const TEMPLATES = [
	{ source: "one-pager-en.html", slug: "one-pager" },
	{ source: "long-doc-en.html", slug: "long-doc" },
	{ source: "letter-en.html", slug: "letter" },
	{ source: "portfolio-en.html", slug: "portfolio" },
	{ source: "resume-en.html", slug: "resume" },
	{ source: "slides-weasy-en.html", slug: "slides" },
	{ source: "equity-report-en.html", slug: "equity-report" },
	{ source: "changelog-en.html", slug: "changelog" },
];

const VPK_OVERRIDES = `

  /* ===== vpk-html Atlassian deck identity overrides ===== */

  html, body { background: var(--paper-background) !important; }

  /* Strip section chrome unless a component opts into raised-surface treatment. */
  .frame, .page, section, .card, .metric, .metric-card,
  .header, .hero, .cover, .doc-cover,
  .quote, .pull-quote, .callout, .verdict, .tag, .pill {
    background: transparent !important;
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }

  /* Preserve a single hairline border ONLY on tables (they need column rules). */
  table, th, td {
    border-color: var(--rule) !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }

  /* Hairline rule between sections — flat 1px, no inset, no shadow. */
  hr, .rule, .section-rule {
    background: var(--rule) !important;
    border: 0 !important;
    height: 1px !important;
  }

  body, p, li, dd, dt, blockquote, td, th, .body, .lead, .prose {
    font-family: "Atlassian Mono Numeric", var(--font-body) !important;
    font-size: 16px !important;
    line-height: 1.8 !important;
    color: var(--ink) !important;
  }
  h1, h2, h3, h4, h5, h6,
  .cover-title, .doc-title, .resume-name, .deck-cover .title,
  .hero h1, .title-block h1, .equity-header .ticker, .letter-subject,
  .section-title {
    font-family: var(--font-display) !important;
    font-size: 16px !important;
    line-height: 1.8 !important;
    font-weight: 700 !important;
    letter-spacing: 0 !important;
    color: var(--ink) !important;
    margin: 0 !important;
  }

  /* Masthead role: cover-title / first h1 carries the primary deck accent. */
  .cover h1:first-child, .cover-title:first-child,
  .hero h1:first-child, .doc-title h1:first-child,
  .resume-name {
    font-family: var(--font-display) !important;
    color: var(--headline) !important;
    font-weight: 900 !important;
    text-transform: none !important;
    letter-spacing: 0 !important;
  }

  /* Margin labels / eyebrows / figure tags: Atlassian Mono, 10-12px, primary blue. */
  .eyebrow, .label, .meta-mono, .kicker,
  .figure-tag, .margin-label, .fig-num, .stage-name {
    font-family: var(--font-mono) !important;
    font-size: 10px !important;
    line-height: 14px !important;
    letter-spacing: 0.08em !important;
    text-transform: uppercase !important;
    color: var(--primary-blue) !important;
    font-weight: 400 !important;
  }

  /* Secondary metadata / captions: 14px, ink-muted. */
  .caption, .meta, .footnote, .annotation, .subtitle, .cover-sub, .cover-meta,
  .doc-meta, .release-meta, .stage-detail, .stage-meta {
    font-family: "Atlassian Mono Numeric", var(--font-body) !important;
    font-size: 14px !important;
    line-height: 22px !important;
    color: var(--muted-text) !important;
  }

  /* Links: primary blue with restrained editorial underline. */
  a, a:visited {
    color: var(--link) !important;
    text-decoration: none !important;
  }
  a:hover {
    text-decoration: underline !important;
    text-decoration-thickness: 1px !important;
    text-underline-offset: 3px !important;
  }

  /* Emphasis: italic preferred; bold reserved for headings. */
  .hl, mark, strong { color: var(--primary-blue) !important; background: transparent !important; font-weight: 600 !important; }
  em, i { font-style: italic !important; color: var(--ink) !important; }

  /* Dotted rule utility. */
  .dotted-rule, .vpk-dotted-rule {
    background-image: radial-gradient(circle, var(--ink) 1px, transparent 1px) !important;
    background-size: 8px 8px !important;
    background-repeat: repeat-x !important;
    background-position: 0 50% !important;
    background-color: transparent !important;
    border: 0 !important;
    height: 8px !important;
    margin: 32px 0 !important;
  }

  /* Drop cap on the first paragraph after a section break. */
  section > p:first-child::first-letter,
  .lead::first-letter,
  .cover + p::first-letter {
    font-family: var(--font-display) !important;
    color: var(--ink) !important;
    float: left !important;
    font-size: 48px !important;
    line-height: 1 !important;
    padding-right: 8px !important;
    padding-top: 4px !important;
    font-weight: 600 !important;
  }
`;

function rewriteFontStacksTemplates(text) {
	let out = text;
	out = out.replace(
		/Charter,\s*Georgia,\s*\n?\s*Palatino,\s*"Times New Roman",\s*serif/g,
		FONT_STACKS.sans,
	);
	out = out.replace(/Charter,\s*Georgia,\s*Palatino,\s*serif/g, FONT_STACKS.sans);
	out = out.replace(/Charter,\s*Georgia,\s*Palatino,\s*"Songti SC",\s*serif/g, FONT_STACKS.sans);
	out = out.replace(
		/"TsangerJinKai02"[^;]*serif/g,
		'"Charlie Text", "Noto Sans CJK SC", ui-sans-serif, system-ui, sans-serif',
	);
	out = out.replace(/JetBrainsMono\.woff2/g, "AtlassianMono.v2.ttf");
	out = out.replace(/"JetBrains Mono",\s*"SF Mono",\s*Consolas,\s*monospace/g, FONT_STACKS.mono);
	out = out.replace(/"JetBrains Mono",\s*"SF Mono",\s*"Fira Code"[^;]*/g, FONT_STACKS.mono);
	return out;
}

function rewriteTemplateHeader(text, slug) {
	const friendly = slug.replace(/-/g, " ");
	const headerComment = `<!-- ==================================================================
     TEMPLATE · ${friendly} (vpk-html · Atlassian deck identity)
     Ported from kami's editorial template library, restyled with the
     vpk-html semantic aliases: paper (var(--paper)), ink
     (var(--ink)), primary blue (var(--primary-blue)),
     status accents, and muted text (var(--muted-text)).
     Charlie Display mastheads, Charlie Text body, Atlassian Mono numerals and labels.
     No section borders. No shadows. No grid. No rounded corners.
     Layout and double-curly placeholders preserved verbatim from kami.
     Source: https://github.com/tw93/Kami (MIT)
     Design language: Atlassian deck/editorial language
     ================================================================== -->`;
	let out = text;
	out = out.replace(/<!--[\s\S]*?-->\n?/, `${headerComment}\n`);
	if (/<meta\s+name="generator"/i.test(out)) {
		out = out.replace(/<meta\s+name="generator"\s+content="[^"]*"\s*\/?>/i, `<meta name="generator" content="vpk-html">`);
	} else {
		out = out.replace(/<meta\s+charset="[^"]*"\s*\/?>/i, match => `${match}\n<meta name="generator" content="vpk-html">`);
	}
	return out;
}

function transformTemplate(rawHtml, slug, fontFaceBlock, themeBlock) {
	let out = rawHtml;
	out = rewriteFontStacksTemplates(out);
	out = rewriteKamiColors(out);
	out = rewriteFontFaceBlocks(out, fontFaceBlock, themeBlock);
	out = stripSelfReferentialCustomProperties(out);
	out = rewriteTemplateHeader(out, slug);
	out = ensureFaviconLinks(out);
	out = out.replace(/<\/style>/, `${VPK_OVERRIDES}</style>`);
	out = addMainLandmark(out);
	return out;
}

function portTemplates() {
	if (!fs.existsSync(KAMI_TEMPLATES)) {
		throw new Error(`Kami templates not found at ${KAMI_TEMPLATES}`);
	}
	fs.mkdirSync(VPK_TEMPLATES, { recursive: true });
	const fontFaceBlock = buildFontFaceBlock();
	const themeBlock = readStylesCss();
	let missing = [];
	for (const { source, slug } of TEMPLATES) {
		const sourcePath = path.join(KAMI_TEMPLATES, source);
		const targetPath = path.join(VPK_TEMPLATES, `${slug}.html`);
		if (!fs.existsSync(sourcePath)) {
			missing.push(source);
			console.warn(`skip ${slug} — ${source} not found in kami source`);
			continue;
		}
		const raw = fs.readFileSync(sourcePath, "utf8");
		fs.writeFileSync(targetPath, transformTemplate(raw, slug, fontFaceBlock, themeBlock), "utf8");
		console.log(`✓ template ${slug} (from ${source})`);
	}
	console.log(`Ported ${TEMPLATES.length - missing.length}/${TEMPLATES.length} templates → ${path.relative(process.cwd(), VPK_TEMPLATES)}`);
	return { missing };
}

/* ============================ diagrams mode ============================ */

const DIAGRAM_FONT_REPLACEMENTS = [
	{ pattern: /Charter,\s*Georgia,\s*Palatino,\s*serif/g, replacement: FONT_STACKS.sans },
	{
		pattern:
			/'JetBrains Mono',\s*"SF Mono",\s*Consolas,\s*"TsangerJinKai02",\s*"Source Han Serif SC",\s*"Noto Serif CJK SC",\s*"Songti SC",\s*monospace/g,
		replacement: FONT_STACKS.mono,
	},
	{ pattern: /'JetBrains Mono',\s*monospace/g, replacement: "'Atlassian Mono', monospace" },
];

function buildDiagramHead() {
	return `<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

${readStylesCss()}

  :root {
    --font-sans: ${FONT_STACKS.body};
    --font-mono: ${FONT_STACKS.mono};
    --font-display: ${FONT_STACKS.display};
  }

${buildFontFaceBlock()}

  body {
    background:
      var(--grid-background),
      var(--paper-background);
    background-size: var(--grid-background-size);
    color: var(--ink);
    font-family: "Atlassian Mono Numeric", var(--font-sans);
    font-size: 16px;
    line-height: 1.8;
    min-height: 100vh;
    padding: clamp(2rem, 4vw, 4rem);
  }

  .frame {
    margin: 0 auto;
    max-width: 1080px;
    padding: 0;
  }

  .eyebrow {
    color: var(--primary-blue);
    font-family: var(--font-mono);
    font-size: 10px;
    line-height: 14px;
    letter-spacing: 0.18em;
    margin-bottom: 12px;
    text-transform: uppercase;
  }

  h1 {
    color: var(--headline);
    font-family: var(--font-display);
    font-size: 16px;
    line-height: 1.8;
    font-weight: 900;
    letter-spacing: 0;
    text-transform: none;
    margin-bottom: 24px;
  }

  svg { display: block; min-width: 860px; width: 100%; }

  .caption {
    border-top: 1px solid var(--rule);
    color: var(--muted-text);
    font-family: var(--font-sans);
    font-size: 14px;
    line-height: 22px;
    margin-top: 24px;
    max-width: 60ch;
    padding-top: 16px;
  }
</style>`;
}

function rewriteDiagramFonts(text) {
	let out = text;
	for (const { pattern, replacement } of DIAGRAM_FONT_REPLACEMENTS) {
		out = out.replace(pattern, replacement);
	}
	return out;
}

function transformDiagram(rawHtml, slug, headBlock) {
	const sourceColored = rewriteKamiColors(rawHtml);
	const sourceFonted = rewriteDiagramFonts(sourceColored);
	const styled = sourceFonted.replace(/<style>[\s\S]*?<\/style>/, headBlock);
	const eyebrowReplaced = styled.replace(
		/<p class="eyebrow">[^<]*<\/p>/,
		`<p class="eyebrow">${slug.replace(/-/g, " ")} · vpk-html diagram</p>`,
	);
	const titleReplaced = eyebrowReplaced.replace(
		/<title>[^<]*<\/title>/,
		`<title>${slug.replace(/-/g, " ")} · vpk-html diagram</title>`,
	);
	const faviconed = ensureFaviconLinks(titleReplaced);
	const headerComment = `<!-- ==================================================================
     DIAGRAM · ${slug.replace(/-/g, " ")} (vpk-html palette)
     SVG primitive ported from kami's diagram library, restyled with the
     vpk-html identity: Charlie Display headline, Charlie Text body,
     primary blue focal accent. Drop the <svg> block into a
     long-doc, portfolio, or design-system payload via section.trustedHtml.
     ================================================================== -->`;
	return faviconed.replace(/<!--[\s\S]*?-->\n?/, `${headerComment}\n`);
}

function portDiagrams() {
	if (!fs.existsSync(KAMI_DIAGRAMS)) {
		throw new Error(`Kami diagrams not found at ${KAMI_DIAGRAMS}`);
	}
	fs.mkdirSync(VPK_DIAGRAMS, { recursive: true });
	const headBlock = buildDiagramHead();
	const files = fs.readdirSync(KAMI_DIAGRAMS).filter(name => name.endsWith(".html"));
	for (const file of files) {
		const slug = file.replace(/\.html$/, "");
		const raw = fs.readFileSync(path.join(KAMI_DIAGRAMS, file), "utf8");
		fs.writeFileSync(path.join(VPK_DIAGRAMS, file), transformDiagram(raw, slug, headBlock), "utf8");
		console.log(`✓ diagram ${slug}`);
	}
	console.log(`Ported ${files.length} diagrams → ${path.relative(process.cwd(), VPK_DIAGRAMS)}`);
	return { count: files.length };
}

/* ============================ demos mode ============================ */

const DEMOS = [
	"demo-agent-slides.html",
	"demo-kaku.html",
	"demo-musk-resume.html",
	"demo-tesla.html",
];

const KAKU_HERO_FIGURE = `<svg viewBox="0 0 480 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Kaku terminal interface diagram with command output and AI recovery panel.">
      <rect x="0.5" y="0.5" width="479" height="319" fill="none" stroke="var(--rule)"/>
      <rect x="40" y="48" width="400" height="224" rx="8" fill="var(--surface-sunken)" stroke="var(--rule-strong)"/>
      <rect x="40" y="48" width="400" height="34" rx="8" fill="var(--ink)"/>
      <circle cx="62" cy="65" r="4" fill="var(--danger)"/>
      <circle cx="78" cy="65" r="4" fill="var(--warning)"/>
      <circle cx="94" cy="65" r="4" fill="var(--success)"/>
      <text x="240" y="69" text-anchor="middle" font-family="Atlassian Mono, ui-monospace, monospace" font-size="10" fill="var(--inverse-text)">kaku</text>
      <text x="64" y="112" font-family="Atlassian Mono, ui-monospace, monospace" font-size="12" fill="var(--primary-blue)">$ kaku ai</text>
      <text x="64" y="140" font-family="Atlassian Mono, ui-monospace, monospace" font-size="11" fill="var(--ink)">assistant.toml loaded</text>
      <text x="64" y="162" font-family="Atlassian Mono, ui-monospace, monospace" font-size="11" fill="var(--muted-text)">mode: command recovery</text>
      <rect x="246" y="104" width="154" height="82" rx="6" fill="var(--primary-blue-tint)" stroke="var(--primary-blue)"/>
      <text x="323" y="134" text-anchor="middle" font-family="Atlassian Mono, ui-monospace, monospace" font-size="11" fill="var(--primary-blue)">AI recovery</text>
      <text x="323" y="156" text-anchor="middle" font-family="Atlassian Mono, ui-monospace, monospace" font-size="9" fill="var(--muted-text)">explain and patch</text>
      <path d="M64 210h300" fill="none" stroke="var(--rule-strong)" stroke-width="1"/>
      <text x="64" y="236" font-family="Atlassian Mono, ui-monospace, monospace" font-size="10" fill="var(--muted-text)">Cmd + Shift + E applies the suggested command</text>
    </svg>`;

const KAKU_ACTION_FIGURE = `<svg viewBox="0 0 480 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Kaku workflow from shell command to assistant suggestion and confirmed action.">
      <rect x="0.5" y="0.5" width="479" height="319" fill="none" stroke="var(--rule)"/>
      <rect x="42" y="96" width="112" height="74" rx="6" fill="var(--surface-sunken)" stroke="var(--rule-strong)"/>
      <rect x="184" y="96" width="112" height="74" rx="6" fill="var(--primary-blue-tint)" stroke="var(--primary-blue)"/>
      <rect x="326" y="96" width="112" height="74" rx="6" fill="var(--surface-sunken)" stroke="var(--rule-strong)"/>
      <path d="M154 133h30M296 133h30" fill="none" stroke="var(--primary-blue)" stroke-width="2"/>
      <text x="98" y="126" text-anchor="middle" font-family="Atlassian Mono, ui-monospace, monospace" font-size="12" fill="var(--ink)">shell</text>
      <text x="98" y="146" text-anchor="middle" font-family="Atlassian Mono, ui-monospace, monospace" font-size="9" fill="var(--muted-text)">failed command</text>
      <text x="240" y="126" text-anchor="middle" font-family="Atlassian Mono, ui-monospace, monospace" font-size="12" fill="var(--primary-blue)">assistant</text>
      <text x="240" y="146" text-anchor="middle" font-family="Atlassian Mono, ui-monospace, monospace" font-size="9" fill="var(--muted-text)">safe suggestion</text>
      <text x="382" y="126" text-anchor="middle" font-family="Atlassian Mono, ui-monospace, monospace" font-size="12" fill="var(--ink)">apply</text>
      <text x="382" y="146" text-anchor="middle" font-family="Atlassian Mono, ui-monospace, monospace" font-size="9" fill="var(--muted-text)">confirmed action</text>
      <text x="240" y="220" text-anchor="middle" font-family="Atlassian Mono, ui-monospace, monospace" font-size="10" fill="var(--muted-text)">Kaku keeps the loop inside the command session.</text>
    </svg>`;

function rewriteFontStacksDemos(text) {
	let out = text;
	out = out.replace(/Charter,\s*Georgia,?\s*(Palatino,?\s*)?serif/g, FONT_STACKS.sans);
	out = out.replace(/Charter,\s*Georgia,\s*Palatino,\s*"Songti SC",\s*serif/g, FONT_STACKS.sans);
	out = out.replace(
		/"TsangerJinKai02",\s*"Source Han Serif SC",\s*"Noto Serif CJK SC",\s*"Songti SC",\s*"STSong",\s*Georgia,\s*serif/g,
		'"Charlie Text", "Noto Sans CJK SC", ui-sans-serif, system-ui, sans-serif',
	);
	out = out.replace(
		/"TsangerJinKai02",\s*"Source Han Serif SC",\s*"Noto Serif CJK SC",\s*"Songti SC",\s*Georgia,\s*serif/g,
		'"Charlie Text", "Noto Sans CJK SC", ui-sans-serif, system-ui, sans-serif',
	);
	out = out.replace(
		/"YuMincho",\s*"Yu Mincho",\s*"Hiragino Mincho ProN",\s*"Noto Serif CJK JP",\s*"Source Han Serif JP",\s*"TsangerJinKai02",\s*Georgia,\s*serif/g,
		'"Charlie Text", "Hiragino Sans", "Yu Gothic", "Noto Sans CJK JP", ui-sans-serif, system-ui, sans-serif',
	);
	out = out.replace(/"JetBrains Mono",\s*"SF Mono",\s*"Fira Code"[^;]*/g, FONT_STACKS.mono);
	out = out.replace(/"JetBrains Mono",\s*"SF Mono",\s*Consolas,\s*monospace/g, FONT_STACKS.mono);
	return out;
}

function rewriteDemoHeader(text, slug) {
	const headerComment = `<!-- ==================================================================
     DEMO · ${slug.replace(/^demo-/, "").replace(/-/g, " ")} (vpk-html palette)
     Ported from kami's curated demos library and restyled with the
     vpk-html identity: Charlie display/body type, Atlassian Mono numbers,
     and primary blue accents. Layout, content, and SVG
     geometry are preserved verbatim from kami.
     Source: https://github.com/tw93/Kami
     ================================================================== -->`;
	let out = text;
	out = out.replace(/<!--[\s\S]*?-->\n?/, `${headerComment}\n`);
	out = out.replace(/<meta\s+name="generator"\s+content="[^"]*"\s*\/?>/i, `<meta name="generator" content="vpk-html">`);
	return out;
}

function rewriteDemoBodyAccent(text) {
	const gridOverride = `

  /* vpk-html identity overrides */
  html { background: var(--paper-background); }
  body {
    background:
      var(--grid-background),
      var(--paper-background);
    background-size: var(--grid-background-size);
  }
  /* Frame the document with vpk-html chrome when a kami .page or .frame exists */
  .page, .frame {
    border: 2px solid var(--ink) !important;
    box-shadow: var(--shadow) !important;
  }
`;
	return text.replace(/<\/style>/, `${gridOverride}</style>`);
}

// Demo-mode landmark uses the labeled regex two-step variant (see shared.mjs).

function markDecorativeSvgs(html) {
	return html.replace(/<svg\b(?![^>]*\baria-(?:label|hidden|labelledby)=)([^>]*)>/gi, "<svg aria-hidden=\"true\"$1>");
}

function rewriteKakuImageTags(text) {
	const imageTagWithAlt = (altText) => new RegExp(`<${"img"}\\s+src="[^"]+"\\s+alt="${altText}"\\s*/?>`, "g");
	return text
		.replace(/\.contact-screenshot img/g, ".contact-screenshot svg")
		.replace(imageTagWithAlt("Kaku terminal interface"), KAKU_HERO_FIGURE)
		.replace(imageTagWithAlt("Kaku terminal in action"), KAKU_ACTION_FIGURE);
}

function transformDemo(rawHtml, slug, fontFaceBlock, themeBlock) {
	let out = rawHtml;
	out = rewriteFontStacksDemos(out);
	out = rewriteKamiColors(out);
	out = rewriteFontFaceBlocks(out, fontFaceBlock, themeBlock);
	out = rewriteDemoHeader(out, slug);
	out = ensureFaviconLinks(out);
	out = rewriteKakuImageTags(out);
	out = rewriteDemoBodyAccent(out);
	out = addLabeledMainLandmark(out, "vpk-html curated demo");
	out = markDecorativeSvgs(out);
	return out;
}

function portDemos() {
	if (!fs.existsSync(KAMI_DEMOS)) {
		throw new Error(`Kami demos not found at ${KAMI_DEMOS}`);
	}
	fs.mkdirSync(VPK_DEMOS, { recursive: true });
	const fontFaceBlock = buildFontFaceBlock();
	const themeBlock = readStylesCss();
	let missing = [];
	for (const file of DEMOS) {
		const slug = file.replace(/\.html$/, "");
		const sourcePath = path.join(KAMI_DEMOS, file);
		if (!fs.existsSync(sourcePath)) {
			missing.push(file);
			console.warn(`skip ${slug} — not found in kami source`);
			continue;
		}
		const raw = fs.readFileSync(sourcePath, "utf8");
		fs.writeFileSync(path.join(VPK_DEMOS, file), transformDemo(raw, slug, fontFaceBlock, themeBlock), "utf8");
		console.log(`✓ demo ${slug}`);
	}
	console.log(`Ported ${DEMOS.length - missing.length}/${DEMOS.length} curated demos → ${path.relative(process.cwd(), VPK_DEMOS)}`);
	return { missing };
}

/* ============================ main ============================ */

const MODES = { "--templates": portTemplates, "--diagrams": portDiagrams, "--demos": portDemos };

function main() {
	const args = process.argv.slice(2);
	const unknown = args.filter(a => !(a in MODES));
	if (unknown.length > 0) {
		console.error(`Unknown argument(s): ${unknown.join(", ")}`);
		console.error("Usage: node scripts/port-kami.mjs [--templates] [--diagrams] [--demos]");
		process.exitCode = 1;
		return;
	}
	const selected = args.length > 0 ? args : ["--templates", "--diagrams", "--demos"];
	console.log("Inlining local Atlassian fonts as base64 data URIs…");
	for (const mode of selected) {
		try {
			MODES[mode]();
		} catch (error) {
			console.error(error.message);
			process.exitCode = 1;
		}
	}
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
	main();
}

export { transformTemplate, transformDiagram, transformDemo };
