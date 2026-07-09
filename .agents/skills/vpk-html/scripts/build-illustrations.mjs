#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEMOS, ILLUSTRATIONS, buildFaviconLinkBlock, buildSharedCssBlock } from "./shared.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function page({ slug, title, summary, svg, script = "" }) {
	const starter = script ? `\n<script data-vpk-smil-starter>\n${script}\n</script>` : "";
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title} · vpk-html illustration</title>
<meta name="author" content="vpk-html">
<meta name="description" content="${summary}">
<meta name="keywords" content="vpk-html, technical illustration, ${slug}">
<meta name="generator" content="vpk-html">
${buildFaviconLinkBlock()}
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
${buildSharedCssBlock()}

* { box-sizing: border-box; margin: 0; padding: 0; }

html {
\tbackground: var(--paper-background);
\tcolor: var(--ink);
\tfont-family: "Geist Mono Numeric", var(--font-body);
\tline-height: 1.6;
}

body {
\tbackground: var(--paper-background);
\tmin-height: 100vh;
\tpadding: clamp(24px, 5vw, 56px);
}

main {
\tdisplay: grid;
\tgap: 24px;
\tmargin: 0 auto;
\tmax-width: 1080px;
}

.eyebrow {
\tcolor: var(--muted-text);
\tfont-family: var(--font-body);
\tfont-size: 13px;
\tletter-spacing: 0;
\ttext-transform: none;
}

h1 {
\tcolor: var(--headline);
\tfont-family: var(--font-display);
\tfont-size: 36px;
\tfont-weight: 500;
\tletter-spacing: 0;
\tline-height: 1.14;
}

.summary {
\tcolor: var(--muted-text);
\tfont-size: 17px;
\tline-height: 1.6;
\tmax-width: 64ch;
}

.figure-frame {
\tbackground: var(--paper);
\tborder: 1px solid var(--rule);
\tborder-radius: 6px;
\tpadding: clamp(18px, 4vw, 36px);
}

svg[data-vpk-illustration] {
\tdisplay: block;
\theight: auto;
\tmargin: 0 auto;
\tmax-width: 920px;
\twidth: 100%;
}

.caption {
\tborder-top: 1px solid var(--rule);
\tcolor: var(--muted-text);
\tfont-size: 14px;
\tmargin-top: 18px;
\tpadding-top: 12px;
}

@media print {
\tbody { background: var(--paper); padding: 18mm; }
\t.figure-frame { break-inside: avoid; }
}
</style>
</head>
<body data-vpk-motion="document">
<main>
\t<p class="eyebrow">technical illustration · ${slug}</p>
\t<h1>${title}</h1>
\t<p class="summary">${summary}</p>
\t<figure class="figure-frame">
${svg}
\t\t<figcaption class="caption">${summary}</figcaption>
\t</figure>
</main>${starter}
</body>
</html>
`;
}

const smilStarter = `(() => {
\tconst reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
\tif (reduceMotion) return;
\tdocument.querySelectorAll('svg[data-vpk-illustration] animateTransform[begin="indefinite"]').forEach((animation, index) => {
\t\twindow.setTimeout(() => animation.beginElement(), index * 90);
\t});
})();`;

const examples = [
	{
		slug: "isometric-device",
		title: "Isometric Device",
		summary: "An isometric hardware shell using the grayscale figure ramp for faces, edges, and labels.",
		svg: `\t\t<svg data-vpk-illustration viewBox="0 0 720 420" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Isometric device shell with labeled screen, base, and connector rail.">
\t\t\t<path d="M170 132 390 64 552 136 332 214Z" fill="var(--ill-tone1)" stroke="var(--ill-line)"/>
\t\t\t<path d="M332 214 552 136 552 264 332 342Z" fill="var(--ill-tone2)" stroke="var(--ill-line)"/>
\t\t\t<path d="M170 132 332 214 332 342 170 258Z" fill="var(--ill-tone3)" stroke="var(--ill-line)"/>
\t\t\t<path d="M228 148 390 100 494 144 332 198Z" fill="var(--paper)" stroke="var(--ill-line)"/>
\t\t\t<path d="M252 232 302 256M252 250 302 274M252 268 302 292" stroke="var(--ill-hatch)" stroke-width="2"/>
\t\t\t<path d="M426 246h82M426 264h60M426 282h72" stroke="var(--ill-line)" stroke-dasharray="24 6"/>
\t\t\t<path d="M116 110h94" stroke="var(--ill-line)" stroke-dasharray="24 6"/>
\t\t\t<path d="M210 110 196 102v16Z" fill="var(--ill-line)"/>
\t\t\t<text x="72" y="114" fill="var(--ill-ink50)" font-family="Geist Mono, monospace" font-size="10" letter-spacing="0">screen</text>
\t\t\t<path d="M556 304c34 0 42-18 64-18" stroke="var(--ill-line)"/>
\t\t\t<text x="626" y="290" fill="var(--ill-ink50)" font-family="Geist Mono, monospace" font-size="10" letter-spacing="0">rail</text>
\t\t</svg>`,
	},
	{
		slug: "exploded-assembly",
		title: "Exploded Assembly",
		summary: "An exploded component stack with indefinite SMIL transforms started only when motion is allowed.",
		svg: `\t\t<svg data-vpk-illustration viewBox="0 0 720 420" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Exploded assembly with three isometric plates moving into assembled position.">
\t\t\t<g>
\t\t\t\t<path d="M180 158 350 104 520 158 350 220Z" fill="var(--ill-tone1)" stroke="var(--ill-line)"/>
\t\t\t\t<animateTransform attributeName="transform" type="translate" begin="indefinite" dur="240ms" values="0 -46; 0 0" keySplines="0.25 0.1 0.25 1" calcMode="spline" fill="freeze"/>
\t\t\t</g>
\t\t\t<g>
\t\t\t\t<path d="M180 216 350 162 520 216 350 278Z" fill="var(--ill-tone2)" stroke="var(--ill-line)"/>
\t\t\t\t<path d="M250 218h200" stroke="var(--ill-hatch)" stroke-width="2" stroke-dasharray="10 10"/>
\t\t\t\t<animateTransform attributeName="transform" type="translate" begin="indefinite" dur="240ms" values="0 0; 0 0" keySplines="0.25 0.1 0.25 1" calcMode="spline" fill="freeze"/>
\t\t\t</g>
\t\t\t<g>
\t\t\t\t<path d="M180 274 350 220 520 274 350 336Z" fill="var(--ill-tone3)" stroke="var(--ill-line)"/>
\t\t\t\t<animateTransform attributeName="transform" type="translate" begin="indefinite" dur="240ms" values="0 46; 0 0" keySplines="0.25 0.1 0.25 1" calcMode="spline" fill="freeze"/>
\t\t\t</g>
\t\t\t<path d="M112 158h60M112 216h60M112 274h60" stroke="var(--ill-line)" stroke-dasharray="24 6"/>
\t\t\t<text x="66" y="162" fill="var(--ill-ink50)" font-family="Geist Mono, monospace" font-size="10" letter-spacing="0">top</text>
\t\t\t<text x="52" y="220" fill="var(--ill-ink50)" font-family="Geist Mono, monospace" font-size="10" letter-spacing="0">core</text>
\t\t\t<text x="44" y="278" fill="var(--ill-ink50)" font-family="Geist Mono, monospace" font-size="10" letter-spacing="0">base</text>
\t\t</svg>`,
		script: smilStarter,
	},
	{
		slug: "annotated-mechanism",
		title: "Annotated Mechanism",
		summary: "Dimension lines, leader curls, and compact mono labels for a compact mechanism diagram.",
		svg: `\t\t<svg data-vpk-illustration viewBox="0 0 720 420" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Annotated mechanism with dimension line, curled leader, actuator, and guide rail.">
\t\t\t<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 10 5 0 10Z" fill="var(--ill-line)"/></marker></defs>
\t\t\t<rect x="180" y="164" width="300" height="82" rx="8" fill="var(--ill-tone1)" stroke="var(--ill-line)"/>
\t\t\t<path d="M208 204h242" stroke="var(--ill-hatch)" stroke-width="2" stroke-dasharray="12 10"/>
\t\t\t<circle cx="268" cy="204" r="34" fill="var(--ill-tone2)" stroke="var(--ill-line)"/>
\t\t\t<circle cx="396" cy="204" r="34" fill="var(--ill-tone3)" stroke="var(--ill-line)"/>
\t\t\t<path d="M268 204h128" stroke="var(--ill-line)" stroke-width="2.5"/>
\t\t\t<path d="M180 286h300" stroke="var(--ill-line)" stroke-dasharray="24 6" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
\t\t\t<path d="M180 252v50M480 252v50" stroke="var(--ill-line)"/>
\t\t\t<text x="330" y="312" text-anchor="middle" fill="var(--ill-ink50)" font-family="Geist Mono, monospace" font-size="10" letter-spacing="0">300 unit span</text>
\t\t\t<path d="M520 154c34-18 52 2 40 22-10 16 8 28 36 20" stroke="var(--ill-line)"/>
\t\t\t<text x="602" y="202" fill="var(--ill-ink50)" font-family="Geist Mono, monospace" font-size="10" letter-spacing="0">curl leader</text>
\t\t</svg>`,
	},
	{
		slug: "hatched-cross-section",
		title: "Hatched Cross Section",
		summary: "A cutaway panel using bundled hatch strokes and two-tone faces without gradients.",
		svg: `\t\t<svg data-vpk-illustration viewBox="0 0 720 420" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Hatched cross section with outer shell, inner channel, and material layers.">
\t\t\t<path d="M160 108h400v190H160Z" fill="var(--ill-tone1)" stroke="var(--ill-line)"/>
\t\t\t<path d="M212 156h296v94H212Z" fill="var(--paper)" stroke="var(--ill-line)"/>
\t\t\t<path d="M176 126 248 298M206 126 278 298M236 126 308 298M266 126 338 298M296 126 368 298M326 126 398 298M356 126 428 298M386 126 458 298M416 126 488 298M446 126 518 298" stroke="var(--ill-hatch)" stroke-width="2"/>
\t\t\t<path d="M212 156h296v24H212Z" fill="var(--ill-tone2)" stroke="var(--ill-line)"/>
\t\t\t<path d="M212 226h296v24H212Z" fill="var(--ill-tone3)" stroke="var(--ill-line)"/>
\t\t\t<path d="M520 152h76" stroke="var(--ill-line)" stroke-dasharray="24 6"/>
\t\t\t<text x="604" y="156" fill="var(--ill-ink50)" font-family="Geist Mono, monospace" font-size="10" letter-spacing="0">layer A</text>
\t\t\t<path d="M520 240h76" stroke="var(--ill-line)" stroke-dasharray="24 6"/>
\t\t\t<text x="604" y="244" fill="var(--ill-ink50)" font-family="Geist Mono, monospace" font-size="10" letter-spacing="0">layer B</text>
\t\t</svg>`,
	},
	{
		slug: "isometric-pipeline",
		title: "Isometric Pipeline",
		summary: "A remixable architecture-pipeline illustration with modules, flow arrows, and shaded joins.",
		svg: `\t\t<svg data-vpk-illustration viewBox="0 0 720 420" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Isometric pipeline connecting source, transform, model, and delivery modules.">
\t\t\t<defs><marker id="pipe-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 10 5 0 10Z" fill="var(--ill-line)"/></marker></defs>
\t\t\t<path d="M90 170 174 132 258 170 174 210Z" fill="var(--ill-tone1)" stroke="var(--ill-line)"/>
\t\t\t<path d="M280 170 364 132 448 170 364 210Z" fill="var(--ill-tone2)" stroke="var(--ill-line)"/>
\t\t\t<path d="M470 170 554 132 638 170 554 210Z" fill="var(--ill-tone3)" stroke="var(--ill-line)"/>
\t\t\t<path d="M174 210v58L90 226v-56M174 268l84-42v-56" fill="var(--ill-tone2)" stroke="var(--ill-line)"/>
\t\t\t<path d="M364 210v58l-84-42v-56M364 268l84-42v-56" fill="var(--ill-tone3)" stroke="var(--ill-line)"/>
\t\t\t<path d="M554 210v58l-84-42v-56M554 268l84-42v-56" fill="var(--ill-tone1)" stroke="var(--ill-line)"/>
\t\t\t<path d="M248 204h58M438 204h58" stroke="var(--ill-line)" stroke-width="2" marker-end="url(#pipe-arrow)"/>
\t\t\t<path d="M136 226h78M326 226h78M516 226h78" stroke="var(--ill-hatch)" stroke-width="2" stroke-dasharray="12 10"/>
\t\t\t<text x="174" y="118" text-anchor="middle" fill="var(--ill-ink50)" font-family="Geist Mono, monospace" font-size="10" letter-spacing="0">source</text>
\t\t\t<text x="364" y="118" text-anchor="middle" fill="var(--ill-ink50)" font-family="Geist Mono, monospace" font-size="10" letter-spacing="0">transform</text>
\t\t\t<text x="554" y="118" text-anchor="middle" fill="var(--ill-ink50)" font-family="Geist Mono, monospace" font-size="10" letter-spacing="0">deliver</text>
\t\t</svg>`,
	},
];

function main() {
	fs.mkdirSync(ILLUSTRATIONS, { recursive: true });
	fs.mkdirSync(DEMOS, { recursive: true });
	for (const example of examples) {
		const html = page(example);
		const target = path.join(ILLUSTRATIONS, `${example.slug}.html`);
		const demoTarget = path.join(DEMOS, `demo-illustration-${example.slug}.html`);
		fs.writeFileSync(target, html, "utf8");
		fs.writeFileSync(demoTarget, html, "utf8");
		console.log(`wrote ${path.relative(process.cwd(), target)}`);
		console.log(`wrote ${path.relative(process.cwd(), demoTarget)}`);
	}
	console.log(`${examples.length} technical illustration exemplars generated from ${path.relative(process.cwd(), __dirname)}`);
}

main();
