import { getPageUrlForPin } from "./page-path";
import type { SelectorPin, StyleReport } from "./types";

const MAX_SNIPPET_CHARS = 500;

export type VpkHtmlVideoNarration =
	| { source: "notes"; content: string }
	| { source: "script"; content: string }
	| { source: "none" };

export type VpkHtmlVideoSound =
	| { source: "none" }
	| { source: "description"; content: string }
	| { source: "path"; content: string };

export interface ComposeVpkHtmlVideoPromptOptions {
	artifactAbsolutePath: string;
	narration: VpkHtmlVideoNarration;
	outputSlug?: string;
	pagePath: string;
	sound: VpkHtmlVideoSound;
}

function truncateSnippet(snippet: string): string {
	if (snippet.length <= MAX_SNIPPET_CHARS) {
		return snippet;
	}

	return `${snippet.slice(0, MAX_SNIPPET_CHARS - 3)}...`;
}

function formatScopeInstruction(pin: SelectorPin): string {
	if (pin.scope === "everywhere") {
		return "scope: everywhere - edit .agents/skills/vpk-html/references/tokens.json, then run node scripts/build.mjs --write-styles from .agents/skills/vpk-html/.";
	}

	return "scope: element - make page-local edits after the vpk-shared:end sentinel or inline; do not touch generated styles.css or tokens.json.";
}

function formatTokenChains(report: StyleReport): string[] {
	return report.matchedRules.tokenChains.flatMap((finding) =>
		finding.chains.map((chain) => {
			const names = chain.map((entry) => `${entry.name}=${entry.value || "(missing)"}`).join(" -> ");
			return `  token: ${finding.property} ${finding.value} (${names}); computed ${finding.computedValue}`;
		}),
	);
}

function formatOverrides(report: StyleReport): string[] {
	return report.matchedRules.overrides.map((override) => {
		const marker = override.tokenOverride ? "token override" : "override";
		return `  ${marker}: ${override.property}=${override.value} from ${override.origin} (${override.selector})`;
	});
}

function formatStyleFindings(report: StyleReport | undefined): string[] {
	if (!report) {
		return [];
	}

	const lines = [
		`- computed size: ${report.computed.box.size}`,
		`- typography: ${report.computed.typography.fontFamily}; ${report.computed.typography.fontSize}; weight ${report.computed.typography.fontWeight}; line-height ${report.computed.typography.lineHeight}`,
		`- colors: text ${report.computed.colors.color}; background ${report.computed.colors.background}`,
	];
	const tokenLines = formatTokenChains(report);
	const overrideLines = formatOverrides(report);

	if (tokenLines.length > 0 || overrideLines.length > 0) {
		lines.push("- style findings:");
		lines.push(...tokenLines, ...overrideLines);
	}

	return lines;
}

function formatStyleEdits(pin: SelectorPin): string[] {
	if (!pin.styleEdits || pin.styleEdits.length === 0) {
		return [];
	}

	return pin.styleEdits.map((edit) =>
		`- style change: ${edit.property} ${edit.previousValue || "(empty)"} -> ${edit.nextValue || "(empty)"}`,
	);
}

export function composeHtmlSelectorPrompt(pins: ReadonlyArray<SelectorPin>): string {
	if (pins.length === 0) {
		return "";
	}

	const lines = [
		"[HTML Selector Annotations]",
		"These annotations refer to plain HTML pages served by the VPK app.",
		"Architecture: source pages live under .agents/skills/vpk-html/ and are served at /api/vpk-html/<path>.",
		"The shared inlined block between /* vpk-shared:start */ and /* vpk-shared:end */ plus styles.css are generated.",
		"For scope \"everywhere\", edit .agents/skills/vpk-html/references/tokens.json, then run node scripts/build.mjs --write-styles from .agents/skills/vpk-html/.",
		"For scope \"element\", make page-local edits after the vpk-shared:end sentinel or inline. Never hand-edit generated styles.css.",
	];

	pins.forEach((pin, index) => {
		lines.push("");
		lines.push(`#${index + 1}: ${pin.comment ? `"${pin.comment}"` : "(no comment)"}`);
		if (pin.diskPath) {
			lines.push(`- file: ${pin.diskPath}`);
		}
		lines.push(`- page: ${getPageUrlForPin(pin.pagePath)}`);
		lines.push(`- selector: ${pin.selector}`);
		lines.push(`- element: ${pin.tagSummary}`);
		lines.push(`- outerHTML: ${truncateSnippet(pin.outerHtmlSnippet)}`);
		lines.push(`- ${formatScopeInstruction(pin)}`);
		lines.push(...formatStyleEdits(pin));
		lines.push(...formatStyleFindings(pin.styleFindings));
	});

	return lines.join("\n");
}

export function getVpkHtmlOutputSlug(pagePath: string): string {
	const fileName = pagePath.split("/").filter(Boolean).at(-1) ?? "index.html";
	const withoutExtension = fileName.replace(/\.html$/iu, "") || "index";
	return withoutExtension
		.toLowerCase()
		.replace(/[^a-z0-9-]+/gu, "-")
		.replace(/^-+|-+$/gu, "") || "artifact";
}

function formatVideoNarration(narration: VpkHtmlVideoNarration): string[] {
	if (narration.source === "none") {
		return ["Narration: none. Build a silent visual video unless the artifact itself supplies text timing."];
	}

	const label = narration.source === "notes" ? "speaker notes" : "inline script";
	const content = narration.content.trim() || "(empty)";
	return [
		`Narration source: ${label}.`,
		"Use this narration content:",
		"```text",
		content,
		"```",
	];
}

function formatVideoSound(sound: VpkHtmlVideoSound): string {
	if (sound.source === "description") {
		return `Background sound: generate or source audio from this description: ${sound.content.trim() || "(empty description)"}.`;
	}
	if (sound.source === "path") {
		return `Background sound: use this local file path if it exists: ${sound.content.trim() || "(empty path)"}.`;
	}

	return "Background sound: none.";
}

export function composeVpkHtmlVideoPrompt({
	artifactAbsolutePath,
	narration,
	outputSlug,
	pagePath,
	sound,
}: Readonly<ComposeVpkHtmlVideoPromptOptions>): string {
	const slug = outputSlug || getVpkHtmlOutputSlug(pagePath);
	const lines = [
		"[vpk-html video conversion]",
		"Load and follow the repo-local vpk-html skill and the hyperframes skill before starting.",
		"Use the HTML artifact as the source of truth; do not rewrite the catalog source unless the video workflow absolutely requires a derived copy.",
		`Artifact absolute path: ${artifactAbsolutePath}`,
		`Served page path: /api/vpk-html/${pagePath}`,
		`Write all generated video project files, captures, audio, and exports under output/vpk-html/${slug}/.`,
		"Keep intermediate assets inside that output folder and report the final video/export path when finished.",
		"",
		...formatVideoNarration(narration),
		"",
		formatVideoSound(sound),
	];

	return lines.join("\n");
}
