// CSS builders for the generated design-system and component-variants pages.
// Extracted from generate-design-pages.mjs to keep both under the file-size budget.

import { containsRawColor } from "./generate-design-pages.mjs";

function cssDefinitionsForCatalog(tokens, semantic) {
	const lines = [":root {"];
	for (const token of tokens) {
		if (semantic.has(token.name)) continue;
		if (!token.value || token.value.includes("{") || token.value.includes("}")) continue;
		if (containsRawColor(token.value)) continue;
		lines.push(`\t${token.name}: ${token.value};`);
	}
	lines.push("}");
	return lines.length > 2 ? lines.join("\n") : "";
}

export function buildDesignCss(tokens, semantic) {
	return `${cssDefinitionsForCatalog(tokens, semantic)}

* {
	box-sizing: border-box;
}

body {
	margin: 0;
	background: var(--paper-background);
	color: var(--ink);
	font-family: var(--font-body);
	font-size: 15px;
	line-height: 1.55;
	-webkit-font-smoothing: antialiased;
}

main {
	max-width: 1240px;
	margin: 0 auto;
	padding: var(--page-pad-y) var(--page-pad-x);
}

.vpkh-hero {
	display: grid;
	grid-template-columns: minmax(0, 1.4fr) minmax(280px, .6fr);
	gap: 32px;
	align-items: end;
	padding: 48px 0 28px;
	border-bottom: 1px solid var(--rule);
}

.vpkh-eyebrow {
	display: block;
	margin-bottom: 12px;
	color: var(--muted-text);
	font-family: var(--font-mono);
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0;
	text-transform: uppercase;
}

h1,
h2,
h3,
p {
	margin: 0;
}

h1 {
	max-width: 780px;
	color: var(--headline);
	font-family: var(--font-display);
	font-size: clamp(34px, 6vw, 68px);
	font-weight: 520;
	letter-spacing: 0;
	line-height: .95;
}

.vpkh-hero p {
	max-width: 680px;
	margin-top: 18px;
	color: var(--muted-text);
	font-size: 17px;
	line-height: 1.6;
}

.vpkh-stats {
	display: grid;
	gap: 10px;
}

.vpkh-stat {
	display: flex;
	justify-content: space-between;
	gap: 18px;
	padding: 12px 0;
	border-top: 1px solid var(--rule);
	font-family: var(--font-mono);
	font-size: 12px;
}

.vpkh-stat strong {
	color: var(--headline);
	font-size: 16px;
}

.vpkh-actions {
	position: sticky;
	top: 0;
	z-index: 20;
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 14px;
	margin: 24px 0 36px;
	padding: 12px 0;
	background: color-mix(in srgb, var(--paper-background) 94%, transparent);
	-webkit-backdrop-filter: blur(12px);
	backdrop-filter: blur(12px);
	border-bottom: 1px solid var(--rule);
}

.vpkh-action-group {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	align-items: center;
}

.vpkh-button {
	min-height: 34px;
	padding: 0 14px;
	border: 1px solid var(--rule-strong);
	border-radius: 999px;
	background: var(--surface-raised);
	color: var(--ink);
	font: 600 12px/1 var(--font-mono);
	cursor: pointer;
}

.vpkh-button[data-primary="true"] {
	background: var(--ink);
	color: var(--inverse-text);
}

.vpkh-notice {
	min-height: 18px;
	color: var(--muted-text);
	font-family: var(--font-mono);
	font-size: 12px;
}

.vpkh-index {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin: 0 0 48px;
}

.vpkh-index a {
	padding: 7px 10px;
	border: 1px solid var(--rule);
	border-radius: 999px;
	color: var(--ink);
	font-family: var(--font-mono);
	font-size: 12px;
	text-decoration: none;
}

.vpkh-section {
	margin: 0 0 56px;
}

.vpkh-section-head {
	display: grid;
	grid-template-columns: 64px minmax(0, 1fr);
	gap: 18px;
	align-items: baseline;
	margin-bottom: 18px;
}

.vpkh-section-head p {
	color: var(--muted-text);
	font-family: var(--font-mono);
	font-size: 12px;
}

.vpkh-section-head h2 {
	color: var(--headline);
	font-size: 28px;
	font-weight: 520;
	letter-spacing: 0;
}

.vpkh-token-table {
	border-top: 1px solid var(--rule-strong);
}

.vpkh-token-header,
.vpkh-token-row {
	display: grid;
	grid-template-columns: 92px minmax(180px, .9fr) minmax(220px, 1.1fr) minmax(150px, .8fr) 92px minmax(190px, .8fr);
	gap: 14px;
	align-items: center;
}

.vpkh-token-header {
	position: sticky;
	top: 60px;
	z-index: 10;
	padding: 10px 0;
	background: var(--paper-background);
	border-bottom: 1px solid var(--rule-strong);
	color: var(--muted-text);
	font-family: var(--font-mono);
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
}

.vpkh-token-row {
	min-height: 72px;
	padding: 12px 0;
	border-bottom: 1px solid var(--rule);
}

.vpkh-swatch {
	display: block;
	width: 48px;
	height: 48px;
	border: 1px solid var(--rule-strong);
	border-radius: 6px;
}

.vpkh-value-preview {
	display: inline-flex;
	max-width: 100%;
	min-height: 32px;
	align-items: center;
	padding: 0 10px;
	border: 1px solid var(--rule);
	border-radius: 6px;
	background: var(--surface-raised);
	color: var(--muted-text);
	font-family: var(--font-mono);
	font-size: 11px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

code {
	font-family: var(--font-mono);
	font-size: 12px;
}

.vpkh-token-value,
.vpkh-token-semantic,
.vpkh-token-count {
	color: var(--muted-text);
	font-family: var(--font-mono);
	font-size: 12px;
}

.vpkh-token-value {
	display: grid;
	gap: 3px;
	min-width: 0;
}

.vpkh-token-value code {
	color: var(--ink);
	overflow-wrap: anywhere;
}

.vpkh-muted {
	color: var(--subtlest-text);
}

.vpkh-token-editor input {
	width: 100%;
	min-height: 34px;
	border: 1px solid var(--rule-strong);
	border-radius: 6px;
	background: var(--surface-raised);
	color: var(--ink);
	font: 12px/1.2 var(--font-mono);
}

.vpkh-token-editor input[type="color"] {
	padding: 3px;
	cursor: pointer;
}

.vpkh-token-editor input[type="text"] {
	padding: 0 10px;
}

.vpkh-token-editor input:focus-visible,
.vpkh-button:focus-visible,
.vpkh-index a:focus-visible {
	outline: 2px solid var(--focus-ring);
	outline-offset: 2px;
}

@media (max-width: 980px) {
	main {
		padding: var(--page-pad-y-compact) var(--page-pad-x-compact);
	}

	.vpkh-hero {
		grid-template-columns: 1fr;
	}

	.vpkh-token-header {
		display: none;
	}

	.vpkh-token-row {
		grid-template-columns: 56px minmax(0, 1fr);
		gap: 8px 12px;
	}

	.vpkh-token-editor,
	.vpkh-token-value,
	.vpkh-token-semantic,
	.vpkh-token-count {
		grid-column: 2;
	}
}`;
}

export function buildVariantsCss() {
	return `* {
	box-sizing: border-box;
}

body {
	margin: 0;
	background: var(--paper-background);
	color: var(--ink);
	font-family: var(--font-body);
	font-size: 15px;
	line-height: 1.55;
	-webkit-font-smoothing: antialiased;
}

main {
	max-width: 1180px;
	margin: 0 auto;
	padding: var(--page-pad-y) var(--page-pad-x);
}

.vpkh-hero {
	display: grid;
	grid-template-columns: minmax(0, 1.2fr) minmax(260px, .8fr);
	gap: 32px;
	align-items: end;
	padding: 48px 0 28px;
	border-bottom: 1px solid var(--rule);
}

.vpkh-eyebrow {
	display: block;
	margin-bottom: 12px;
	color: var(--muted-text);
	font-family: var(--font-mono);
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0;
	text-transform: uppercase;
}

h1,
h2,
h3,
p {
	margin: 0;
}

h1 {
	max-width: 760px;
	color: var(--headline);
	font-size: clamp(34px, 6vw, 66px);
	font-weight: 520;
	letter-spacing: 0;
	line-height: .96;
}

.vpkh-hero p {
	max-width: 680px;
	margin-top: 18px;
	color: var(--muted-text);
	font-size: 17px;
	line-height: 1.6;
}

.vpkh-stats {
	display: grid;
	gap: 10px;
}

.vpkh-stat {
	display: flex;
	justify-content: space-between;
	gap: 18px;
	padding: 12px 0;
	border-top: 1px solid var(--rule);
	font-family: var(--font-mono);
	font-size: 12px;
}

.vpkh-stat strong {
	color: var(--headline);
	font-size: 16px;
}

.vpkh-toc {
	position: sticky;
	top: 0;
	z-index: 12;
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	margin: 24px 0 44px;
	padding: 12px 0;
	background: color-mix(in srgb, var(--paper-background) 94%, transparent);
	-webkit-backdrop-filter: blur(12px);
	backdrop-filter: blur(12px);
	border-bottom: 1px solid var(--rule);
}

.vpkh-toc a {
	padding: 7px 10px;
	border: 1px solid var(--rule);
	border-radius: 999px;
	color: var(--ink);
	font-family: var(--font-mono);
	font-size: 12px;
	text-decoration: none;
}

.vpkh-pattern-card {
	display: grid;
	grid-template-columns: 88px minmax(0, 1fr);
	gap: 24px;
	padding: 34px 0;
	border-top: 1px solid var(--rule-strong);
}

.vpkh-pattern-meta {
	display: grid;
	align-content: start;
	gap: 8px;
	color: var(--muted-text);
	font-family: var(--font-mono);
	font-size: 12px;
}

.vpkh-pattern-meta span {
	color: var(--headline);
	font-size: 18px;
}

.vpkh-pattern-body h2 {
	color: var(--headline);
	font-size: 28px;
	font-weight: 520;
	letter-spacing: 0;
}

.vpkh-pattern-body > p {
	max-width: 760px;
	margin-top: 8px;
	color: var(--muted-text);
}

.vpkh-example {
	margin: 22px 0;
	padding: 18px;
	border: 1px solid var(--rule);
	border-radius: 6px;
	background: var(--surface-raised);
}

.vpkh-pattern-grid {
	display: grid;
	grid-template-columns: minmax(0, 1.15fr) minmax(260px, .85fr);
	gap: 18px;
}

.vpkh-pattern-grid h3 {
	margin-bottom: 10px;
	color: var(--muted-text);
	font-family: var(--font-mono);
	font-size: 12px;
	text-transform: uppercase;
}

.vpkh-class-list,
.vpkh-token-list {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.vpkh-class-list span,
.vpkh-token-list code,
.vpkh-chip-row span,
.vpkh-other-example span {
	display: inline-flex;
	min-height: 28px;
	align-items: center;
	gap: 8px;
	padding: 0 10px;
	border: 1px solid var(--rule);
	border-radius: 999px;
	background: var(--surface-raised);
	color: var(--ink);
	font-family: var(--font-mono);
	font-size: 12px;
}

.vpkh-class-list em {
	color: var(--muted-text);
	font-style: normal;
}

.vpkh-muted {
	color: var(--subtlest-text);
	font-family: var(--font-mono);
	font-size: 12px;
}

.vpkh-specimen-text {
	display: grid;
	gap: 8px;
}

.vpkh-specimen-text h3 {
	color: var(--headline);
	font-size: 24px;
	font-weight: 520;
}

.vpkh-specimen-text p {
	color: var(--muted-text);
}

.vpkh-frame-example {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 18px;
	padding: 16px;
	border: 1px solid var(--rule-strong);
	border-radius: 6px;
	background: var(--paper);
}

.vpkh-frame-example strong {
	color: var(--headline);
	font-weight: 560;
}

.vpkh-mini-grid {
	display: grid;
	grid-template-columns: repeat(3, 36px);
	gap: 6px;
}

.vpkh-mini-grid span {
	height: 36px;
	border: 1px solid var(--rule);
	background: var(--surface-sunken);
}

.vpkh-toc-example {
	display: grid;
	gap: 8px;
}

.vpkh-toc-example a {
	display: grid;
	grid-template-columns: 40px minmax(0, 1fr) 56px;
	gap: 12px;
	align-items: center;
	padding: 10px 0;
	border-bottom: 1px solid var(--rule);
	color: var(--ink);
	text-decoration: none;
}

.vpkh-toc-example span,
.vpkh-toc-example em {
	color: var(--muted-text);
	font-family: var(--font-mono);
	font-size: 12px;
	font-style: normal;
}

.vpkh-chip-row {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.vpkh-callout-example {
	padding: 16px;
	border: 1px solid var(--rule);
	border-radius: 6px;
	background: var(--accent-soft);
}

.vpkh-callout-example p {
	max-width: 520px;
	color: var(--ink);
}

.vpkh-metric-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12px;
}

.vpkh-metric-grid div {
	padding: 14px;
	border: 1px solid var(--rule);
	border-radius: 6px;
	background: var(--paper);
}

.vpkh-metric-grid span {
	display: block;
	color: var(--muted-text);
	font-family: var(--font-mono);
	font-size: 12px;
}

.vpkh-metric-grid strong {
	color: var(--headline);
	font-family: var(--font-numeric);
	font-size: 30px;
	font-weight: 520;
}

.vpkh-table-example {
	width: 100%;
	border-collapse: collapse;
	font-family: var(--font-mono);
	font-size: 12px;
}

.vpkh-table-example th,
.vpkh-table-example td {
	padding: 8px 10px;
	border: 1px solid var(--rule);
	text-align: left;
}

.vpkh-table-example th {
	background: var(--table-header);
	font-weight: 600;
}

.vpkh-code-example {
	margin: 0;
	padding: 14px;
	overflow: auto;
	border-radius: 6px;
	background: var(--code-surface);
	color: var(--code-ink);
	font-family: var(--font-mono);
}

.vpkh-code-example span {
	color: var(--syntax-keyword);
}

.vpkh-chart-example {
	margin: 0;
}

.vpkh-chart-example div {
	display: flex;
	align-items: end;
	gap: 10px;
	height: 140px;
	padding: 12px;
	border: 1px solid var(--rule);
	background: var(--paper);
}

.vpkh-chart-example span {
	flex: 1;
	background: var(--focal);
}

.vpkh-chart-example span:nth-child(2) {
	background: var(--heat2);
}

.vpkh-chart-example span:nth-child(4) {
	background: var(--heat3);
}

.vpkh-chart-example figcaption {
	margin-top: 8px;
	color: var(--muted-text);
	font-family: var(--font-mono);
	font-size: 12px;
}

.vpkh-timeline-example {
	display: grid;
	gap: 0;
	margin: 0;
	padding: 0;
	list-style: none;
}

.vpkh-timeline-example li {
	display: grid;
	grid-template-columns: 42px minmax(0, 1fr);
	gap: 12px;
	padding: 10px 0;
	border-bottom: 1px solid var(--rule);
}

.vpkh-timeline-example span {
	color: var(--muted-text);
	font-family: var(--font-mono);
	font-size: 12px;
}

.vpkh-media-example {
	display: flex;
	align-items: center;
	gap: 14px;
}

.vpkh-media-example > div {
	width: 56px;
	height: 56px;
	border: 1px solid var(--rule-strong);
	border-radius: 50%;
	background: var(--ill-fill);
}

.vpkh-media-example p {
	display: grid;
	gap: 2px;
}

.vpkh-media-example span {
	color: var(--muted-text);
	font-size: 13px;
}

.vpkh-control-example {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	align-items: center;
}

.vpkh-control-example button {
	min-height: 34px;
	padding: 0 14px;
	border: 1px solid var(--rule-strong);
	border-radius: 999px;
	background: var(--ink);
	color: var(--inverse-text);
	font: 600 12px/1 var(--font-mono);
}

.vpkh-control-example label {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	color: var(--muted-text);
	font-family: var(--font-mono);
	font-size: 12px;
}

.vpkh-other-example {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

@media (max-width: 900px) {
	main {
		padding: var(--page-pad-y-compact) var(--page-pad-x-compact);
	}

	.vpkh-hero,
	.vpkh-pattern-card,
	.vpkh-pattern-grid {
		grid-template-columns: 1fr;
	}

	.vpkh-pattern-meta {
		display: flex;
		justify-content: space-between;
	}
}`;
}
