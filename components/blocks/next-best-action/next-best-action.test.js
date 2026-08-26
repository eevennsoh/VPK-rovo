const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { readDetailCategorySource } = require(process.cwd() + "/app/data/details/test-source.cjs");
const { readWebsiteRegistrySource } = require(process.cwd() + "/components/website/registry/test-source.cjs");

function readProjectFile(relativePath) {
	return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const SOURCE = "components/blocks/next-best-action/components/next-best-action.tsx";

test("Next Best Action is registered as a Blocks component in all four registries", () => {
	assert.match(
		readProjectFile("app/data/components.ts"),
		/blockComponent\("next-best-action", "Next Best Action"\)/u,
	);
	assert.match(
		readProjectFile("app/data/component-manifest.ts"),
		/blockComponent\("next-best-action", "Next Best Action"\)/u,
	);
	assert.match(
		readDetailCategorySource("blocks"),
		/"next-best-action": NEXT_BEST_ACTION_DETAIL/u,
	);
	assert.match(
		readWebsiteRegistrySource(),
		/"next-best-action": dynamic\(\(\) => import\("\.\/demos\/blocks\/next-best-action-demo"\)/u,
	);
});

test("Next Best Action card uses the same raised-surface elevation skin as Artifact List", () => {
	const source = readProjectFile(SOURCE);

	assert.match(source, /min-w-0 max-w-full overflow-hidden rounded-lg bg-surface-raised/u);
	assert.match(source, /boxShadow: token\("elevation\.shadow\.raised"\)/u);
});

test("Next Best Action rows are at least 64px, hover to surface-hovered, and the last row is borderless", () => {
	const source = readProjectFile(SOURCE);

	assert.match(source, /flex min-h-16 items-center px-3 py-2 transition-colors/u);
	assert.match(source, /group\/next-best-action-row min-w-0 w-full/u);
	assert.match(source, /relative flex min-w-0 flex-1 items-center gap-3 overflow-hidden/u);
	assert.match(source, /<span className="shrink-0">\s*<NextBestActionLeadingTile/u);
	assert.match(source, /!isLast && "border-b border-border"/u);
	assert.match(source, /isLast=\{index === items\.length - 1\}/u);
});

test("Next Best Action leading visual uses the ADS tile radius and neutral inset-image rows", () => {
	const source = readProjectFile(SOURCE);

	assert.match(source, /const usesInsetImage = Boolean\(item\.avatarSrc \|\| item\.logoSrc\);/u);
	assert.match(source, /variant=\{usesInsetImage \? "neutral" : item\.tileVariant \?\? "neutral"\}/u);
	assert.match(source, /size=\{variant === "compact" \? "small" : "medium"\}[\s\S]*className=\{cn\([\s\S]*"rounded-tile"/u);
	assert.match(source, /if \(item\.avatarSrc\)[\s\S]*<img[\s\S]*src=\{item\.avatarSrc\}/u);
	assert.match(source, /if \(item\.logoSrc\)[\s\S]*<img[\s\S]*src=\{item\.logoSrc\}/u);
	assert.match(source, /return item\.icon;/u);
	// Suggestion-specific icon names extend the artifact set.
	assert.match(source, /item\.iconName === "automation"[\s\S]*<AutomationIcon label="" size="small" \/>/u);
	assert.match(source, /item\.iconName === "magic-wand"[\s\S]*<MagicWandIcon label="" size="small" \/>/u);
});

test("Next Best Action metadata renders kind · rationale with the small subtlest dot", () => {
	const source = readProjectFile(SOURCE);

	assert.match(source, /<span className="shrink-0 text-text-subtle">\{item\.source\}<\/span>/u);
	assert.equal((source.match(/aria-hidden="true" className="shrink-0 text-text-subtlest">·<\/span>/gu) ?? []).length, 1);
	assert.match(source, /<span aria-hidden="true" className="text-text-subtlest"> · <\/span>/u);
	assert.match(source, /<span className="block w-full truncate text-xs leading-4 text-text-subtle">/u);
	assert.match(source, /<div className="flex min-w-0 flex-1 flex-col overflow-hidden">/u);
	assert.match(source, /<p className="w-full truncate text-xs font-medium leading-4 text-text">\{item\.title\}<\/p>/u);
});

test("Next Best Action action button reveals on row hover/focus and stays keyboard-reachable", () => {
	const source = readProjectFile(SOURCE);

	// In-flow trailing column collapses at rest (0fr) and expands on hover/focus so
	// the raised card's overflow never clips an absolute overlay.
	assert.match(
		source,
		/grid-cols-\[0fr\] group-hover\/next-best-action-row:ml-3 group-hover\/next-best-action-row:grid-cols-\[1fr\]/u,
	);
	assert.match(
		source,
		/group-has-\[:focus-visible\]\/next-best-action-row:ml-3 group-has-\[:focus-visible\]\/next-best-action-row:grid-cols-\[1fr\]/u,
	);
	assert.match(
		source,
		/<Button[\s\S]*pointer-events-none opacity-0[\s\S]*group-hover\/next-best-action-row:pointer-events-auto group-hover\/next-best-action-row:opacity-100[\s\S]*group-has-\[:focus-visible\]\/next-best-action-row:pointer-events-auto group-has-\[:focus-visible\]\/next-best-action-row:opacity-100[\s\S]*focus-visible:pointer-events-auto focus-visible:opacity-100[\s\S]*variant="outline"[\s\S]*size=\{variant === "compact" \? "compact" : "default"\}[\s\S]*type="button"[\s\S]*event\.stopPropagation\(\);[\s\S]*handleAct\(\);/u,
	);
	assert.match(source, /actOnRowClick \? \([\s\S]*<button[\s\S]*type="button"[\s\S]*onClick=\{handleAct\}/u);
	// The focus ring must escape the collapsing grid track.
	assert.match(source, /className="min-w-0 overflow-hidden has-\[:focus-visible\]:overflow-visible"/u);
	assert.doesNotMatch(source, /\binert\b/u);
});

test("Next Best Action lets each suggestion override the action verb", () => {
	const source = readProjectFile(SOURCE);

	assert.match(source, /rowActionLabel\?: string;/u);
	assert.match(source, /const rowActionLabel = item\.rowActionLabel \?\? actionLabel;/u);
	assert.match(source, /actionLabel = "Create"/u);
	// Overlay label and button label both read from the resolved per-row verb.
	assert.match(source, /aria-label=\{`\$\{rowActionLabel\} \$\{item\.title\}`\}/u);
	assert.match(source, /\) : rowActionLabel\}/u);
});

test("Next Best Action compact rows keep the PR byline and diff-stat action", () => {
	const source = readProjectFile(SOURCE);

	assert.match(source, /const compactPullRequestByline = item\.pullRequest \? \(/u);
	assert.match(
		source,
		/<Lozenge variant=\{item\.pullRequest\.status === "Merged" \? "discovery" : "success"\}>/u,
	);
	assert.match(source, /\{compactPullRequestByline \?\? compactMetadata\}/u);
	assert.match(source, /aria-label=\{item\.pullRequest[\s\S]*`Code changes: \$\{item\.pullRequest\.additions\} additions, \$\{item\.pullRequest\.deletions\} deletions`/u);
	assert.match(source, /\{item\.pullRequest \? \([\s\S]*text-text-success[\s\S]*text-text-danger/u);
	assert.match(source, /variant === "compact"[\s\S]*flex min-h-12 items-center px-3 py-2 transition-colors/u);
});

test("Next Best Action never renders a focusable PR link without a destination", () => {
	const source = readProjectFile(SOURCE);

	// The link is gated on a real href; otherwise the byline is plain text.
	assert.match(source, /\{item\.href \? \([\s\S]*<a[\s\S]*href=\{item\.href\}/u);
	assert.doesNotMatch(source, /href="#"/u);
	assert.doesNotMatch(source, /event\.preventDefault\(\)/u);
	assert.match(source, /\) : \([\s\S]*<span[\s\S]*min-w-0 flex-1 truncate text-text[\s\S]*#\{item\.pullRequest\.number\}: \{item\.title\}/u);
});

test("Next Best Action honors prefers-reduced-motion on every transition it adds", () => {
	const source = readProjectFile(SOURCE);

	// VPK duration/easing tokens do not collapse automatically, so each transition
	// needs an explicit guard.
	const transitions = source.match(/transition-\[[^\]]+\]|transition-colors/gu) ?? [];
	assert.ok(transitions.length >= 3, `expected transitions to guard, found ${transitions.length}`);
	assert.equal(
		(source.match(/motion-reduce:transition-none/gu) ?? []).length,
		transitions.length,
		"every transition utility must be paired with motion-reduce:transition-none",
	);
});

test("Next Best Action row-click overlay keeps its focus ring inside the clipping wrapper", () => {
	const source = readProjectFile(SOURCE);

	// The content wrapper is overflow-hidden, so an outward ring-offset would be clipped.
	assert.match(source, /absolute inset-0 z-10[\s\S]*focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/u);
	assert.doesNotMatch(source, /focus-visible:ring-offset-2/u);
});

test("Next Best Action sample data suggests skills, agents, automations, integrations and nudges", () => {
	const page = readProjectFile("components/blocks/next-best-action/page.tsx");
	const demo = readProjectFile("components/website/demos/blocks/next-best-action-demo.tsx");
	const sampleItems = readProjectFile("components/blocks/next-best-action/data/sample-items.tsx");

	assert.match(page, /import \{ NextBestAction \} from "@\/components\/blocks\/next-best-action";/u);
	assert.match(page, /items=\{SAMPLE_NEXT_BEST_ACTIONS\}/u);
	assert.match(page, /items=\{COMPACT_SAMPLE_NEXT_BEST_ACTIONS\}/u);
	assert.match(page, /variant="compact"/u);
	assert.match(demo, /import Page from "@\/components\/blocks\/next-best-action\/page";/u);

	for (const kind of [
		"Suggested skill",
		"Suggested agent",
		"Suggested automation",
		"Suggested integration",
		"Suggested nudge",
	]) {
		assert.ok(sampleItems.includes(kind), `sample items should include a "${kind}" row`);
	}
	// Every non-PR suggestion carries its own verb so the reveal never reads "Create" for a review nudge.
	for (const verb of ["Create", "Enable", "Connect", "Review", "View", "Update"]) {
		assert.ok(
			sampleItems.includes(`rowActionLabel: "${verb}"`),
			`sample items should include a "${verb}" action`,
		);
	}
	assert.match(sampleItems, /id: "review-pull-request"[\s\S]*logoName: "github"[\s\S]*number: 1847[\s\S]*status: "Open"[\s\S]*additions: 148[\s\S]*deletions: 37/u);
});
