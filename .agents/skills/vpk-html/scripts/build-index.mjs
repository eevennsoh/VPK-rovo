#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { buildFaviconLinkBlock, buildSharedCssBlock, ROOT } from "./shared.mjs";

const DEMOS_DIR = path.join(ROOT, "assets", "demos");
const INDEX_FILE = path.join(ROOT, "index.html");

const SECTIONS = [
	{
		id: "document-types",
		title: "Document types",
		items: [
			["demo-one-pager.html", "One-Pager"],
			["demo-long-doc.html", "Long Document"],
			["demo-letter.html", "Letter"],
			["demo-kaku.html", "Portfolio"],
			["demo-musk-resume.html", "Resume"],
			["demo-slides.html", "Slides"],
			["demo-tesla.html", "Equity Report"],
			["demo-changelog.html", "Changelog"],
		],
	},
	{
		id: "exploration",
		title: "Exploration and planning",
		items: [
			["demo-exploration-code-approaches.html", "Code Approaches"],
			["demo-exploration-visual-designs.html", "Visual Designs"],
			["demo-implementation-plan.html", "Implementation Plan"],
		],
	},
	{
		id: "review",
		title: "Code review and understanding",
		items: [
			["demo-code-review-pr.html", "Code Review"],
			["demo-pr-writeup.html", "PR Writeup"],
			["demo-code-understanding.html", "Code Understanding"],
			["demo-postgres-migration.html", "Postgres Migration"],
		],
	},
	{
		id: "design",
		title: "Design",
		items: [
			["demo-design-system.html", "Design System"],
			["demo-component-variants.html", "Component Variants"],
		],
	},
	{
		id: "prototyping",
		title: "Prototyping",
		items: [
			["demo-prototype-animation.html", "Animation Prototype"],
			["demo-prototype-interaction.html", "Interaction Prototype"],
		],
	},
	{
		id: "illustrations",
		title: "Illustrations and diagrams",
		items: [
			["demo-svg-illustrations.html", "SVG Illustrations"],
			["demo-flowchart-diagram.html", "Flowchart Diagram"],
			["demo-illustration-isometric-device.html", "Isometric Device"],
			["demo-illustration-exploded-assembly.html", "Exploded Assembly"],
			["demo-illustration-annotated-mechanism.html", "Annotated Mechanism"],
			["demo-illustration-hatched-cross-section.html", "Hatched Cross Section"],
			["demo-illustration-isometric-pipeline.html", "Isometric Pipeline"],
		],
	},
	{
		id: "decks",
		title: "Decks",
		items: [
			["demo-slide-deck.html", "Engineering Slide Deck"],
			["demo-agent-slides.html", "Agent Keynote"],
		],
	},
	{
		id: "research",
		title: "Research and learning",
		items: [
			["demo-research-feature-explainer.html", "Feature Explainer"],
			["demo-research-concept-explainer.html", "Concept Explainer"],
			["demo-rag-explainer.html", "RAG Explainer"],
		],
	},
	{
		id: "reports",
		title: "Reports",
		items: [
			["demo-status-report.html", "Weekly Status"],
			["demo-incident-report.html", "Incident Timeline"],
			["demo-q2-status.html", "Q2 Status Report"],
			["demo-auth-incident.html", "Auth Incident"],
		],
	},
	{
		id: "editors",
		title: "Custom editing interfaces",
		items: [
			["demo-editor-triage-board.html", "Ticket Triage Board"],
			["demo-editor-feature-flags.html", "Feature Flag Editor"],
			["demo-editor-prompt-tuner.html", "Prompt Tuner"],
		],
	},
	{
		id: "diagrams",
		title: "Diagrams",
		items: [
			["demo-diagram-architecture.html", "Architecture"],
			["demo-diagram-flowchart.html", "Flowchart"],
			["demo-diagram-swimlane.html", "Swimlane"],
			["demo-diagram-state-machine.html", "State Machine"],
			["demo-diagram-timeline.html", "Timeline"],
			["demo-diagram-tree.html", "Tree"],
			["demo-diagram-layer-stack.html", "Layer Stack"],
			["demo-diagram-quadrant.html", "Quadrant"],
			["demo-diagram-venn.html", "Venn"],
		],
	},
	{
		id: "charts-distribution",
		title: "Charts - distributions",
		items: [
			["demo-diagram-box-plot.html", "Box Plot"],
			["demo-diagram-histogram.html", "Histogram"],
			["demo-diagram-ridgeline.html", "Ridgeline"],
			["demo-diagram-beeswarm.html", "Beeswarm"],
			["demo-diagram-dot-strip.html", "Dot Strip"],
		],
	},
	{
		id: "charts-comparison",
		title: "Charts - comparison",
		items: [
			["demo-diagram-bar-chart.html", "Bar Chart"],
			["demo-diagram-slope-chart.html", "Slope Chart"],
			["demo-diagram-dumbbell.html", "Dumbbell"],
			["demo-diagram-lollipop.html", "Lollipop"],
			["demo-diagram-bullet.html", "Bullet"],
			["demo-diagram-population-pyramid.html", "Population Pyramid"],
		],
	},
	{
		id: "charts-time-series",
		title: "Charts - time series",
		items: [
			["demo-diagram-line-chart.html", "Line Chart"],
			["demo-diagram-annotated-line.html", "Annotated Line"],
			["demo-diagram-index-chart.html", "Index Chart"],
			["demo-diagram-small-multiples.html", "Small Multiples"],
			["demo-diagram-band-chart.html", "Band Chart"],
			["demo-diagram-stacked-area.html", "Stacked Area"],
			["demo-diagram-candlestick.html", "Candlestick"],
			["demo-diagram-waterfall.html", "Waterfall"],
		],
	},
	{
		id: "charts-parts-intensity",
		title: "Charts - parts and intensity",
		items: [
			["demo-diagram-donut-chart.html", "Donut Chart"],
			["demo-diagram-calendar-heatmap.html", "Calendar Heatmap"],
			["demo-diagram-matrix-heatmap.html", "Matrix Heatmap"],
			["demo-diagram-waffle.html", "Waffle"],
			["demo-diagram-grid-choropleth.html", "Grid Choropleth"],
			["demo-diagram-treemap.html", "Treemap"],
		],
	},
	{
		id: "charts-relationships",
		title: "Charts - relationships",
		items: [
			["demo-diagram-sankey.html", "Sankey"],
			["demo-diagram-arc-diagram.html", "Arc Diagram"],
			["demo-diagram-scatter.html", "Scatter"],
			["demo-diagram-connected-scatter.html", "Connected Scatter"],
			["demo-diagram-icicle.html", "Icicle"],
		],
	},
];

function escapeHtml(value) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function fileSizeMeta(fileName) {
	const filePath = path.join(DEMOS_DIR, fileName);
	if (!fs.existsSync(filePath)) return "missing";
	const bytes = fs.statSync(filePath).size;
	return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function renderSidebar() {
	const nav = SECTIONS.map((section, index) => {
		const number = `${index + 1}.`;
		return `<a href="#${section.id}"><span>${number}</span>${escapeHtml(section.title)}</a>`;
	}).join("\n\t\t\t\t");

	return `<aside id="site-sidebar-right" aria-label="Catalog navigation">
	<div class="sidebar">
		<div class="sidebar__brand">
			<div class="sidebar__logo" aria-hidden="true">v</div>
			<div>
				<div class="sidebar__title">vpk-html</div>
				<p>Offline editorial HTML artifacts.</p>
			</div>
		</div>
		<form class="sidebar__search" role="search" aria-label="Catalog search">
			<input class="search-input -desktop" type="search" placeholder="Search" aria-label="Search catalog" disabled>
			<button class="search__icon -desktop" type="button" aria-label="Search" disabled>⌕</button>
		</form>
		<nav class="sidebar__section" aria-label="Catalog sections">
			<div class="sidebar-list">
				${nav}
			</div>
		</nav>
		<div class="sidebar__bottom-links" aria-label="Reference links">
			<a href="SKILL.md">Skill</a>
			<a href="README.md">Readme</a>
			<a href="CHEATSHEET.md">Cheatsheet</a>
		</div>
	</div>
</aside>`;
}

function renderSections() {
	return SECTIONS.map((section, sectionIndex) => {
		const rows = section.items.map(([fileName, label], itemIndex) => {
			const number = `${sectionIndex + 1}.${itemIndex + 1}`;
			const href = `assets/demos/${fileName}`;
			const meta = fileSizeMeta(fileName);
			return `<div class="module-index-post">
					<span class="module-index-number module-index-post__number">${number}</span>
					<div class="module-index-post__title"><a class="demo-row" href="${href}">${escapeHtml(label)}</a></div>
					<div class="in-review-item__count"><span class="module-index-post__views">${meta}</span></div>
				</div>`;
		}).join("\n");

		return `<section class="module-index-section demo-category" id="${section.id}" aria-labelledby="${section.id}-title">
			<div class="module-index-section-header demo-category-head">
				<div class="module-index-heading">
					<span class="module-index-number">${sectionIndex + 1}.</span>
					<h2 class="module-index-heading__title" id="${section.id}-title">${escapeHtml(section.title)}</h2>
				</div>
			</div>
			<div class="module-index-posts">
				${rows}
			</div>
		</section>`;
	}).join("\n");
}

function buildIndexHtml() {
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>vpk-html · Index</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="vpk-html reference index for offline Algebrica editorial HTML artifacts.">
<meta name="generator" content="vpk-html">
${buildFaviconLinkBlock()}
<style>
${buildSharedCssBlock()}

*,
*::before,
*::after {
	box-sizing: border-box;
}

html {
	background: var(--paper-background);
}

body {
	background: var(--paper-background);
	color: var(--ink);
	font-family: "Geist Mono Numeric", var(--font-body);
	font-size: 15px;
	line-height: 1.4;
	margin: 0;
	min-height: 100vh;
}

a {
	color: inherit;
	text-decoration-line: none;
}

a:hover {
	color: var(--ink);
}

.container {
	margin: 0 auto;
	max-width: 1130px;
	width: 1130px;
}

.site-container {
	display: flex;
	margin-bottom: 20px;
	min-height: 100vh;
}

#site-sidebar-right {
	flex: 0 0 330px;
	left: 0;
	max-width: 330px;
	position: fixed;
	top: 0;
	width: 330px;
	z-index: 10000;
}

.sidebar {
	background: var(--paper-background);
	border-right: 1px solid var(--rule);
	display: flex;
	flex-direction: column;
	height: 100vh;
	max-height: 100vh;
	overflow-y: auto;
	padding: 40px;
}

.sidebar__brand {
	align-items: center;
	display: flex;
	gap: 14px;
	margin-bottom: 40px;
}

.sidebar__logo {
	align-items: center;
	background: var(--ink);
	border-radius: 12px;
	color: var(--inverse-text);
	display: flex;
	font-family: var(--font-mono);
	font-size: 18px;
	font-weight: 600;
	height: 40px;
	justify-content: center;
	width: 40px;
}

.sidebar__title {
	color: var(--ink);
	font-size: 15px;
	font-weight: 600;
	margin-bottom: 2px;
}

.sidebar__brand p {
	color: var(--muted-text);
	font-size: 13px;
	line-height: 1.35;
	margin: 0;
}

.sidebar__search {
	margin-bottom: 30px;
	position: relative;
}

.search-input {
	background: transparent;
	border: 1px solid var(--search-border);
	border-radius: 24px;
	color: var(--ink);
	font: 14px var(--font-body);
	height: 38px;
	padding: 0 58px 2px 14px;
	width: 100%;
}

.search-input::placeholder {
	color: var(--subtlest-text);
}

.search-input:focus {
	border-color: var(--search-focus);
	box-shadow: 0 0 0 2px var(--accent-soft);
	outline: 0;
}

.search__icon {
	align-items: center;
	background: transparent;
	border: 0;
	color: var(--muted-text);
	display: flex;
	font: 18px var(--font-mono);
	height: 38px;
	justify-content: center;
	opacity: .8;
	padding: 0;
	position: absolute;
	right: 14px;
	top: 0;
	width: 22px;
}

.sidebar__section {
	border-bottom: 1px solid var(--rule);
	margin-bottom: 18px;
	padding-bottom: 20px;
}

.sidebar-list {
	font-size: 15px;
}

.sidebar-list a {
	align-items: center;
	color: var(--ink);
	display: flex;
	font-weight: 600;
	padding: 7px 0;
	text-decoration-line: none;
}

.sidebar-list a:hover {
	color: var(--meta-text);
}

.sidebar-list span {
	color: var(--muted-text);
	display: inline-block;
	font-family: var(--font-mono);
	font-size: 13px;
	margin-right: 10px;
	min-width: 32px;
}

.sidebar__bottom-links {
	color: var(--subtlest-text);
	font-size: 14px;
	margin-top: auto;
}

.sidebar__bottom-links a {
	color: var(--subtlest-text);
	display: block;
	margin-bottom: 10px;
	text-decoration-line: none;
}

.sidebar__bottom-links a:hover {
	color: var(--meta-text);
}

.site-column-main {
	flex-basis: 800px;
	margin-left: auto;
	margin-right: 0;
	position: relative;
}

main {
	padding: 54px 0 70px;
}

.hero {
}

.hero-intro {
	color: var(--muted-text);
	font-size: 15px;
	line-height: 1.5;
	margin: 0 0 50px 52px;
	max-width: 500px;
}

.demo-contents {
}

.module-index__title {
	border-top: 1px solid var(--rule-strong);
	color: var(--headline);
	font-family: var(--font-display);
	font-size: 36px;
	font-weight: 500;
	line-height: 1.2;
	margin: 0 0 30px;
	padding-top: 40px;
}

.demo-category {
}

.demo-category:last-child {
}

.module-index-heading__title {
	color: var(--ink);
	font-size: 15px;
	font-weight: 600;
	line-height: 32px;
	margin: 0;
}

.module-index-post {
	border-top: 1px solid var(--rule);
}

.module-index-post:first-child {
	border-top: 0;
}

.demo-row {
	color: var(--ink);
	display: inline;
	text-decoration-line: underline;
	text-decoration-color: transparent;
	text-decoration-thickness: 1px;
	text-underline-offset: 4px;
}

.demo-row:hover,
.demo-row:focus-visible {
	text-decoration-color: currentColor;
}

.demo-row:focus-visible {
	border-radius: 2px;
	box-shadow: 0 0 0 2px var(--focus-ring);
	outline: 0;
}

@media (max-width: 1130px) {
	.container {
		max-width: 100%;
		width: 100%;
	}

	.site-container {
		display: block;
	}

	#site-sidebar-right {
		max-width: none;
		position: static;
		width: 100%;
	}

	.sidebar {
		border-bottom: 1px solid var(--rule);
		border-right: 0;
		height: auto;
		padding: 24px;
	}

	.sidebar__search {
		display: none;
	}

	.sidebar-list {
		display: grid;
		gap: 2px 18px;
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.site-column-main {
		margin: 10px;
		max-width: calc(100% - 20px);
		width: calc(100% - 20px);
	}

	main {
		padding-top: 20px;
	}

	.hero-intro {
		margin-left: 0;
	}
}

@media (max-width: 640px) {
	.sidebar-list {
		grid-template-columns: 1fr;
	}

	.module-index-post {
		align-items: flex-start;
	}
}
</style>
</head>
<body data-vpk-motion="document">
<div class="container">
	<div class="site-container">
		${renderSidebar()}
		<main class="site-column-main" aria-labelledby="catalog-title">
			<div class="module-index">
				<div class="module-index__title" id="catalog-title">Index</div>
				<p class="hero-intro">A compact catalog of document templates, technical diagrams, demos, and editing surfaces.</p>
				<div class="demo-contents" aria-label="Catalog groups">
					${renderSections()}
				</div>
			</div>
		</main>
	</div>
</div>
</body>
</html>
`;
}

function main() {
	fs.writeFileSync(INDEX_FILE, buildIndexHtml(), "utf8");
	console.log(`wrote ${path.relative(process.cwd(), INDEX_FILE)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
	main();
}
