#!/usr/bin/env node

// Run from the repo root: node .agents/skills/vpk-html/scripts/inject-enhancements.mjs

import fs from "node:fs";
import path from "node:path";
import { DEMOS, ROOT, TEMPLATES } from "./shared.mjs";

const START = "<!-- vpkh-enhance:begin -->";
const END = "<!-- vpkh-enhance:end -->";

const ENHANCEMENT_BLOCK = `${START}
<style data-vpkh-enhance>
.vpkh-scroll-fade {
	position: fixed;
	left: 0;
	right: 0;
	z-index: 2147483000;
	height: 64px;
	pointer-events: none;
	opacity: 0;
	transition: opacity var(--vpk-dur-fast, 140ms) var(--ease-out, ease);
}

.vpkh-scroll-fade[data-edge="top"] {
	top: 0;
	background: linear-gradient(to bottom, var(--paper-background, var(--paper)) 0%, color-mix(in srgb, var(--paper-background, var(--paper)) 84%, transparent) 42%, transparent 100%);
	-webkit-backdrop-filter: blur(10px);
	backdrop-filter: blur(10px);
}

.vpkh-scroll-fade[data-edge="bottom"] {
	bottom: 0;
	background: linear-gradient(to top, var(--paper-background, var(--paper)) 0%, color-mix(in srgb, var(--paper-background, var(--paper)) 84%, transparent) 42%, transparent 100%);
	-webkit-backdrop-filter: blur(10px);
	backdrop-filter: blur(10px);
}

html.vpkh-has-scroll.vpkh-show-top .vpkh-scroll-fade[data-edge="top"],
html.vpkh-has-scroll.vpkh-show-bottom .vpkh-scroll-fade[data-edge="bottom"] {
	opacity: 1;
}

.vpkh-zoomable {
	cursor: zoom-in;
}

body.vpkh-lightbox-open {
	overflow: hidden;
}

.vpkh-lightbox {
	position: fixed;
	inset: 0;
	z-index: 2147483100;
	background: color-mix(in srgb, var(--ink) 72%, transparent);
	-webkit-backdrop-filter: blur(12px);
	backdrop-filter: blur(12px);
}

.vpkh-lightbox__stage {
	position: absolute;
	inset: 0;
	overflow: hidden;
	cursor: zoom-out;
	touch-action: none;
}

.vpkh-lightbox__stage.is-pannable {
	cursor: grab;
}

.vpkh-lightbox__stage.is-dragging {
	cursor: grabbing;
}

.vpkh-lightbox__visual {
	position: absolute;
	top: 50%;
	left: 50%;
	display: block;
	max-width: calc(100vw - 48px);
	max-height: calc(100vh - 112px);
	width: auto;
	height: auto;
	background: var(--paper);
	border: 1px solid var(--rule-strong);
	border-radius: 6px;
	box-shadow: var(--shadow);
	object-fit: contain;
	transform-origin: center center;
	user-select: none;
}

.vpkh-lightbox__visual:is(svg) {
	width: auto;
	height: auto;
}

.vpkh-lightbox__visual:is(video) {
	width: min(1120px, calc(100vw - 48px));
	height: auto;
}

.vpkh-lightbox__controls {
	position: absolute;
	right: 20px;
	bottom: 20px;
	display: flex;
	gap: 8px;
	z-index: 1;
}

.vpkh-lightbox__control {
	display: inline-grid;
	width: 42px;
	height: 42px;
	place-items: center;
	border: 1px solid var(--rule-strong);
	border-radius: 999px;
	background: color-mix(in srgb, var(--surface-raised) 92%, transparent);
	color: var(--ink);
	font: 600 12px/1 var(--font-mono, ui-monospace, monospace);
	box-shadow: var(--shadow);
	cursor: pointer;
}

.vpkh-lightbox__control:focus-visible {
	outline: 2px solid var(--focus-ring, var(--ink));
	outline-offset: 2px;
}

.vpkh-lightbox__status {
	position: absolute;
	left: 20px;
	bottom: 28px;
	color: var(--inverse-text, var(--paper));
	font: 600 12px/1 var(--font-mono, ui-monospace, monospace);
	letter-spacing: 0;
	pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
	.vpkh-scroll-fade,
	.vpkh-lightbox__control {
		transition: none !important;
	}
}
</style>
<script data-vpkh-enhance>
(() => {
	const TOKEN_KEY = "vpkh-token-overrides";
	const root = document.documentElement;
	const appliedTokens = new Set();
	const visualSelector = "img, svg, video, canvas";
	const containerSelector = "figure, .chart-figure, .figure-frame, .frame, .diagram, .illustration, .visual, .media, .svg-frame";
	const skipSelector = "a, button, input, select, textarea, summary, label, [role='button'], [contenteditable='true'], .vpkh-lightbox";
	let lightbox = null;
	let activeTrigger = null;

	function readTokenOverrides() {
		try {
			const parsed = JSON.parse(localStorage.getItem(TOKEN_KEY) || "{}");
			if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
			const clean = {};
			for (const [name, value] of Object.entries(parsed)) {
				if (/^--[\\w-]+$/.test(name) && typeof value === "string") clean[name] = value;
			}
			return clean;
		} catch {
			return {};
		}
	}

	function applyTokenOverrides(next) {
		for (const name of [...appliedTokens]) {
			if (Object.prototype.hasOwnProperty.call(next, name)) continue;
			root.style.removeProperty(name);
			appliedTokens.delete(name);
		}
		for (const [name, value] of Object.entries(next)) {
			root.style.setProperty(name, value);
			appliedTokens.add(name);
		}
	}

	applyTokenOverrides(readTokenOverrides());
	window.addEventListener("storage", event => {
		if (event.key === TOKEN_KEY) applyTokenOverrides(readTokenOverrides());
	});

	function createScrollFade(edge) {
		const node = document.createElement("div");
		node.className = "vpkh-scroll-fade";
		node.dataset.edge = edge;
		node.setAttribute("aria-hidden", "true");
		document.body.appendChild(node);
	}

	function updateScrollFades() {
		const doc = document.documentElement;
		const maxScroll = Math.max(0, doc.scrollHeight - window.innerHeight);
		const current = window.scrollY || doc.scrollTop || 0;
		const hasOverflow = maxScroll > 2;
		doc.classList.toggle("vpkh-has-scroll", hasOverflow);
		doc.classList.toggle("vpkh-show-top", hasOverflow && current > 2);
		doc.classList.toggle("vpkh-show-bottom", hasOverflow && current < maxScroll - 2);
	}

	let scrollFrame = 0;
	function scheduleScrollUpdate() {
		if (scrollFrame) return;
		scrollFrame = requestAnimationFrame(() => {
			scrollFrame = 0;
			updateScrollFades();
			refreshZoomables();
		});
	}

	function isSubstantial(node) {
		if (!node || node.closest(".vpkh-lightbox")) return false;
		const rect = node.getBoundingClientRect();
		if (!rect || rect.width < 160 || rect.height < 100) return false;
		return rect.width * rect.height >= 28000;
	}

	function findVisualFromContainer(node) {
		const visual = node.matches(visualSelector) ? node : node.querySelector(visualSelector);
		return visual && isSubstantial(visual) ? visual : null;
	}

	function refreshZoomables() {
		for (const node of document.querySelectorAll(".vpkh-zoomable")) {
			if (!isSubstantial(findVisualFromContainer(node) || node)) node.classList.remove("vpkh-zoomable");
		}
		for (const node of document.querySelectorAll(visualSelector + ", " + containerSelector)) {
			if (node.closest(".vpkh-lightbox")) continue;
			if (findVisualFromContainer(node)) node.classList.add("vpkh-zoomable");
		}
	}

	function findTrigger(target) {
		if (!target || target.closest(skipSelector)) return null;
		const visual = target.closest(visualSelector);
		if (visual && isSubstantial(visual)) return visual;
		const container = target.closest(containerSelector);
		if (!container || container.closest(skipSelector)) return null;
		return findVisualFromContainer(container);
	}

	function cloneVisual(source) {
		const tag = source.tagName.toLowerCase();
		if (tag === "canvas") {
			const image = document.createElement("img");
			image.alt = source.getAttribute("aria-label") || "Canvas preview";
			try {
				image.src = source.toDataURL("image/png");
			} catch {
				image.alt = "Canvas preview unavailable";
			}
			return image;
		}
		const clone = source.cloneNode(true);
		if (tag === "video") {
			clone.controls = true;
			clone.autoplay = false;
			try { clone.currentTime = source.currentTime || 0; } catch { /* noop */ }
		}
		if (tag === "img" && !clone.alt) clone.alt = "Expanded visual";
		clone.removeAttribute("id");
		return clone;
	}

	function clamp(value, min, max) {
		return Math.min(max, Math.max(min, value));
	}

	function openLightbox(source) {
		if (lightbox) closeLightbox();
		activeTrigger = source;
		let scale = 1;
		let panX = 0;
		let panY = 0;
		let drag = null;
		let dragged = false;

		lightbox = document.createElement("div");
		lightbox.className = "vpkh-lightbox";
		lightbox.setAttribute("role", "dialog");
		lightbox.setAttribute("aria-modal", "true");
		lightbox.setAttribute("aria-label", "Expanded visual viewer");
		lightbox.tabIndex = -1;

		const stage = document.createElement("div");
		stage.className = "vpkh-lightbox__stage";

		const visual = cloneVisual(source);
		visual.classList.add("vpkh-lightbox__visual");
		visual.draggable = false;

		const controls = document.createElement("div");
		controls.className = "vpkh-lightbox__controls";

		const status = document.createElement("div");
		status.className = "vpkh-lightbox__status";

		function makeButton(label, text, action) {
			const button = document.createElement("button");
			button.type = "button";
			button.className = "vpkh-lightbox__control";
			button.setAttribute("aria-label", label);
			button.textContent = text;
			button.addEventListener("click", action);
			controls.appendChild(button);
			return button;
		}

		function render() {
			stage.classList.toggle("is-pannable", scale > 1);
			visual.style.transform = "translate(-50%, -50%) translate(" + panX + "px, " + panY + "px) scale(" + scale + ")";
			status.textContent = Math.round(scale * 100) + "%";
		}

		function setScale(next) {
			scale = clamp(next, 0.5, 6);
			if (scale <= 1) {
				panX = 0;
				panY = 0;
			}
			render();
		}

		makeButton("Reset zoom", "1:1", () => {
			scale = 1;
			panX = 0;
			panY = 0;
			render();
		});
		makeButton("Zoom in", "+", () => setScale(scale * 1.25));
		makeButton("Zoom out", "-", () => setScale(scale / 1.25));

		stage.appendChild(visual);
		lightbox.appendChild(stage);
		lightbox.appendChild(controls);
		lightbox.appendChild(status);
		document.body.appendChild(lightbox);
		document.body.classList.add("vpkh-lightbox-open");
		render();
		lightbox.focus({ preventScroll: true });

		stage.addEventListener("wheel", event => {
			event.preventDefault();
			setScale(scale * (event.deltaY < 0 ? 1.25 : 0.8));
		}, { passive: false });

		stage.addEventListener("pointerdown", event => {
			if (event.button !== 0 || event.target.closest(".vpkh-lightbox__controls")) return;
			dragged = false;
			drag = {
				id: event.pointerId,
				x: event.clientX,
				y: event.clientY,
				panX,
				panY,
			};
			stage.classList.add("is-dragging");
			stage.setPointerCapture(event.pointerId);
		});

		stage.addEventListener("pointermove", event => {
			if (!drag || event.pointerId !== drag.id) return;
			const dx = event.clientX - drag.x;
			const dy = event.clientY - drag.y;
			if (Math.abs(dx) + Math.abs(dy) > 3) dragged = true;
			if (scale > 1) {
				panX = drag.panX + dx;
				panY = drag.panY + dy;
				render();
			}
		});

		stage.addEventListener("pointerup", event => {
			if (drag && event.pointerId === drag.id) {
				try { stage.releasePointerCapture(event.pointerId); } catch { /* noop */ }
				drag = null;
				stage.classList.remove("is-dragging");
			}
		});

		stage.addEventListener("click", event => {
			if (event.target === stage && !dragged) closeLightbox();
		});

		document.addEventListener("keydown", onLightboxKeydown, true);
	}

	function closeLightbox() {
		if (!lightbox) return;
		document.removeEventListener("keydown", onLightboxKeydown, true);
		lightbox.remove();
		lightbox = null;
		document.body.classList.remove("vpkh-lightbox-open");
		if (activeTrigger && typeof activeTrigger.focus === "function") {
			try { activeTrigger.focus({ preventScroll: true }); } catch { /* noop */ }
		}
		activeTrigger = null;
	}

	function focusableNodes() {
		if (!lightbox) return [];
		return [...lightbox.querySelectorAll("button, video, [href], [tabindex]:not([tabindex='-1'])")]
			.filter(node => !node.disabled && node.offsetParent !== null);
	}

	function onLightboxKeydown(event) {
		if (!lightbox) return;
		if (event.key === "Escape") {
			event.preventDefault();
			closeLightbox();
			return;
		}
		if (event.key !== "Tab") return;
		const nodes = focusableNodes();
		if (nodes.length === 0) {
			event.preventDefault();
			lightbox.focus({ preventScroll: true });
			return;
		}
		const first = nodes[0];
		const last = nodes[nodes.length - 1];
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}

	document.addEventListener("click", event => {
		const trigger = findTrigger(event.target);
		if (!trigger) return;
		event.preventDefault();
		openLightbox(trigger);
	});

	function init() {
		createScrollFade("top");
		createScrollFade("bottom");
		updateScrollFades();
		refreshZoomables();
		window.addEventListener("scroll", scheduleScrollUpdate, { passive: true });
		window.addEventListener("resize", scheduleScrollUpdate, { passive: true });
		if ("ResizeObserver" in window) new ResizeObserver(scheduleScrollUpdate).observe(document.body);
		new MutationObserver(scheduleScrollUpdate).observe(document.body, { childList: true, subtree: true, attributes: true });
	}

	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
	else init();
})();
</script>
${END}`;

function htmlFilesIn(directory) {
	return fs.readdirSync(directory)
		.filter(file => file.endsWith(".html"))
		.sort((a, b) => a.localeCompare(b))
		.map(file => path.join(directory, file));
}

function targetFiles() {
	return [
		path.join(ROOT, "index.html"),
		...htmlFilesIn(DEMOS),
		...htmlFilesIn(TEMPLATES),
	];
}

function inject(html, filePath) {
	const markerPattern = new RegExp(`${START.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`, "i");
	const withoutExisting = html.replace(markerPattern, "");
	if (/<\/body>/i.test(withoutExisting)) {
		return withoutExisting.replace(/<\/body>/i, `${ENHANCEMENT_BLOCK}\n</body>`);
	}
	if (/<body\b/i.test(withoutExisting) && /<\/html>/i.test(withoutExisting)) {
		return withoutExisting.replace(/<\/html>/i, `${ENHANCEMENT_BLOCK}\n</body>\n</html>`);
	}
	if (!/<\/body>/i.test(withoutExisting)) {
		throw new Error(`missing </body>: ${filePath}`);
	}
	return withoutExisting;
}

function main() {
	let changed = 0;
	const targets = targetFiles();
	for (const filePath of targets) {
		const before = fs.readFileSync(filePath, "utf8");
		const after = inject(before, filePath);
		if (after !== before) {
			fs.writeFileSync(filePath, after);
			changed += 1;
		}
	}
	console.log(`vpkh inject complete: injected=${targets.length} changed=${changed}`);
	for (const filePath of targets) {
		console.log(`- ${path.relative(ROOT, filePath)}`);
	}
}

main();
