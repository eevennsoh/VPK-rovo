#!/usr/bin/env node
/*
 * gates — optional content-quality gates for vpk-html artifacts.
 *
 * kami's gates are PDF/pixel-based; vpk-html is HTML-first, so these are
 * re-grounded on the same headless-Chromium page that --verify already opens.
 * They are DOM-measurement heuristics, ADVISORY by default (warnings) and only
 * fail the process under --strict. They never modify the artifact.
 *
 *   density        per-section trailing whitespace (a section padded with empty
 *                  space rather than content)
 *   resume-balance content spilling slightly onto a near-empty extra page
 *   rhythm         >=N consecutive slides with an identical layout fingerprint
 *   orphans        widowed last lines (a single short word ending a paragraph)
 *
 * Thresholds: references/checks-thresholds.json
 * Semantics:  references/quality-gates.md
 *
 * CLI is exposed through scripts/build.mjs:
 *   node scripts/build.mjs --check-density <file> [--strict]
 *   node scripts/build.mjs --check-resume-balance <file> [--strict]
 *   node scripts/build.mjs --check-rhythm <file> [--strict]
 *   node scripts/build.mjs --check-orphans <file> [--strict]
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const THRESHOLDS_FILE = path.join(__dirname, "..", "references", "checks-thresholds.json");

export function loadThresholds() {
	return JSON.parse(fs.readFileSync(THRESHOLDS_FILE, "utf8"));
}

/* ---- in-page measurement (runs in the browser; must be self-contained) ---- */

function measureDensity(t) {
	const sections = [...document.querySelectorAll("main section, body > section, article > section, section")];
	const seen = new Set();
	const findings = [];
	sections.forEach((sec, i) => {
		if (seen.has(sec)) return; seen.add(sec);
		const rect = sec.getBoundingClientRect();
		if (rect.height < t.minSectionHeightPx) return;
		const kids = [...sec.children].filter(c => c.getBoundingClientRect().height > 0);
		if (kids.length === 0) return;
		const lastBottom = Math.max(...kids.map(c => c.getBoundingClientRect().bottom));
		const trailing = rect.bottom - lastBottom;
		const ratio = trailing / rect.height;
		const isLast = i === sections.length - 1;
		if (!isLast && ratio > t.maxTrailingRatio) {
			findings.push(`section #${i + 1} (${sec.className || sec.tagName.toLowerCase()}): ${Math.round(ratio * 100)}% trailing empty space`);
		}
	});
	return findings;
}

function measureResumeBalance(t) {
	const contentHeight = document.body.scrollHeight;
	const pages = contentHeight / t.pageHeightPx;
	if (pages < t.onlyWhenPagesAtLeast) return [];
	const lastPageFill = pages - Math.floor(pages);
	// A near-empty trailing page (small remainder) means a little content spilled over.
	if (lastPageFill > 0 && lastPageFill < t.minLastPageFill) {
		return [`content is ${pages.toFixed(2)} pages — the last page is only ${Math.round(lastPageFill * 100)}% full (tighten to fit ${Math.floor(pages)} page${Math.floor(pages) === 1 ? "" : "s"})`];
	}
	return [];
}

function measureRhythm(t) {
	const slides = [...document.querySelectorAll('.slide, section.slide, [class*="slide"], .deck-slide, section[data-slide]')];
	if (slides.length < t.maxIdenticalConsecutive) return [];
	const fingerprint = (el) => {
		const kids = [...el.children];
		const headings = el.querySelectorAll("h1,h2,h3,h4,h5,h6").length;
		return `${kids.length}:${headings}:${kids.map(c => c.tagName).join(",")}`;
	};
	const fps = slides.map(fingerprint);
	const findings = [];
	let run = 1;
	for (let i = 1; i <= fps.length; i++) {
		if (i < fps.length && fps[i] === fps[i - 1]) { run++; continue; }
		if (run >= t.maxIdenticalConsecutive) {
			findings.push(`${run} consecutive slides share an identical layout (slides ${i - run + 1}–${i})`);
		}
		run = 1;
	}
	return findings;
}

function measureOrphans(t) {
	const blocks = [...document.querySelectorAll("p, li")];
	const findings = [];
	for (const el of blocks) {
		const text = (el.textContent || "").trim();
		if (text.length < 40) continue; // short blocks legitimately end short
		const range = document.createRange();
		range.selectNodeContents(el);
		const rects = [...range.getClientRects()].filter(r => r.width > 0);
		if (rects.length < 2) continue; // single-line block can't widow
		const widest = Math.max(...rects.map(r => r.width));
		const last = rects[rects.length - 1];
		const lastWords = text.split(/\s+/).slice(-1)[0] || "";
		if (last.width / widest < t.minLastLineWidthRatio && lastWords.length < t.minLastLineChars) {
			findings.push(`widowed last line ("${lastWords}") in: "${text.slice(0, 48)}${text.length > 48 ? "…" : ""}"`);
			if (findings.length >= 12) break;
		}
	}
	return findings;
}

const GATES = {
	density: { label: "density", key: "density" },
	"resume-balance": { label: "resume-balance", key: "resumeBalance" },
	rhythm: { label: "rhythm", key: "rhythm" },
	orphans: { label: "orphans", key: "orphans" },
};
const MEASURERS = { density: measureDensity, "resume-balance": measureResumeBalance, rhythm: measureRhythm, orphans: measureOrphans };

/**
 * Run one or more gates against a single HTML file.
 * @returns {Promise<{ ok: boolean, results: Array<{gate,findings}> }>} ok=false only
 *          signals findings exist; the CLI decides warn-vs-error via --strict.
 */
export async function runGates(htmlPath, { gates = Object.keys(GATES), thresholds = loadThresholds() } = {}) {
	const abs = path.resolve(htmlPath);
	if (!fs.existsSync(abs)) throw new Error(`File not found: ${abs}`);
	const { chromium } = await import("@playwright/test");
	const browser = await chromium.launch();
	const results = [];
	try {
		const page = await browser.newPage();
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.goto(pathToFileURL(abs).href, { waitUntil: "domcontentloaded", timeout: 15_000 });
		try { await page.waitForLoadState("networkidle", { timeout: 4_000 }); } catch { /* fine */ }
		await page.evaluate(async () => { try { await document.fonts.ready; } catch { /* noop */ } });
		for (const g of gates) {
			const def = GATES[g];
			if (!def) throw new Error(`Unknown gate: ${g}`);
			const findings = await page.evaluate(
				([src, th]) => {
					// eslint-disable-next-line no-new-func
					const fn = new Function(`return (${src})`)();
					return fn(th);
				},
				[MEASURERS[g].toString(), thresholds[def.key]],
			);
			results.push({ gate: def.label, findings });
		}
	} finally {
		await browser.close();
	}
	return { ok: results.every(r => r.findings.length === 0), results };
}

/* ----------------------------- CLI ----------------------------- */

async function main() {
	const argv = process.argv.slice(2);
	const strict = argv.includes("--strict");
	const positional = argv.filter(a => !a.startsWith("--"));
	const flagGates = argv.filter(a => a.startsWith("--check-")).map(a => a.replace("--check-", ""));
	const file = positional[0];
	if (!file) {
		console.error("Usage: gates.mjs <file.html> [--check-density|--check-resume-balance|--check-rhythm|--check-orphans] [--strict]");
		process.exitCode = 1;
		return;
	}
	const gates = flagGates.length > 0 ? flagGates : Object.keys(GATES);
	const { results } = await runGates(file, { gates });
	let total = 0;
	for (const { gate, findings } of results) {
		if (findings.length === 0) {
			console.log(`✓ ${gate}: clean`);
		} else {
			total += findings.length;
			console.log(`${strict ? "✗" : "⚠"} ${gate}: ${findings.length} finding${findings.length === 1 ? "" : "s"}`);
			for (const f of findings) console.log(`    - ${f}`);
		}
	}
	if (total > 0 && strict) process.exitCode = 1;
	else if (total > 0) console.log(`\n${total} advisory finding(s) — warnings only (pass --strict to fail).`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
	await main();
}
