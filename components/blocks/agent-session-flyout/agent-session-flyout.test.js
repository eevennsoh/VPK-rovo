const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");

const BLOCK_DIR = __dirname;

function readBlockFile(relativePath) {
	return fs.readFileSync(path.join(BLOCK_DIR, relativePath), "utf8");
}

function readRepoFile(relativePath) {
	return fs.readFileSync(path.join(BLOCK_DIR, "..", "..", "..", relativePath), "utf8");
}

// The rich flyout body is the canonical "latest" flyout and lives in the Jira
// sidebar variant so both the live sidebar and this block render it.
const FLYOUT_BODY_PATH = "components/blocks/product-sidebar/variants/jira-session-flyout.tsx";
const FLYOUT_HANDLE_PATH = "components/blocks/product-sidebar/variants/jira-session-flyout-data.ts";
const FLYOUT_DEMO_DATA_PATH = "components/blocks/agent-session-flyout/agent-session-flyout-data.ts";
const HOVER_CARD_PATH = "components/ui/hover-card.tsx";
const HOVER_CARD_HANDLE_PATH = "components/ui/hover-card-handle.ts";
const QUEUE_DETAIL_ARTIFACTS_PATH = "components/projects/jira-queue/components/queue-detail-artifacts.tsx";
const QUEUE_DETAIL_PANEL_PATH = "components/projects/jira-queue/components/queue-detail-panel.tsx";

// The shared body reuses the shared design-system components rather than
// re-implementing them.
test("shared flyout body reuses SmartLink, agent Tag, Lozenge, and GitHub logo", () => {
	const source = readRepoFile(FLYOUT_BODY_PATH);
	assert.match(source, /export function JiraSessionFlyoutBody\b/u);
	assert.match(source, /import\s*\{[^}]*SmartLink[^}]*\}\s*from\s*"@\/components\/blocks\/smart-link"/u);
	assert.match(source, /import\s*\{[^}]*GithubLogo[^}]*\}\s*from\s*"@\/components\/ui\/logo-third-party"/u);
	assert.match(source, /import\s*\{[^}]*Lozenge[^}]*\}\s*from\s*"@\/components\/ui\/lozenge"/u);
	assert.match(source, /import\s*\{[^}]*Tag[^}]*\}\s*from\s*"@\/components\/ui\/tag"/u);
	assert.match(source, /<SmartLink[\s\S]*item=\{toWorkItem\(session\)\}/u);
	// Agent renders as an agent-type Tag pill; PR state renders as a Lozenge.
	assert.match(source, /<Tag[\s\S]*?type="agent"/u);
	assert.match(source, /<Lozenge variant=\{prState\.variant\}>/u);
});

test("nested Jira previews open right by default while Queue Details overrides them left", () => {
	const flyoutSource = readRepoFile(FLYOUT_BODY_PATH);
	const panelSource = readRepoFile(QUEUE_DETAIL_PANEL_PATH);
	const artifactsSource = readRepoFile(QUEUE_DETAIL_ARTIFACTS_PATH);

	assert.match(flyoutSource, /previewPosition\?: JiraSessionPreviewPosition/u);
	assert.match(flyoutSource, /const agentBannerSrc = getAgentProfileBannerSrc\(session\.agentAvatarSrc\);\s*preload\(agentBannerSrc, \{ as: "image" \}\);/u);
	assert.match(flyoutSource, /<HoverCardContent[\s\S]*align=\{previewPosition\?\.align \?\? "center"\}[\s\S]*alignOffset=\{previewPosition\?\.alignOffset \?\? 0\}[\s\S]*side=\{previewPosition\?\.side \?\? "right"\}/u);
	assert.match(flyoutSource, /<AgentProfileCard[\s\S]*surface="overlay"/u);
	assert.match(flyoutSource, /<SmartLink[\s\S]*align=\{previewPosition\?\.align \?\? "center"\}[\s\S]*alignOffset=\{previewPosition\?\.alignOffset \?\? 0\}[\s\S]*side=\{previewPosition\?\.side \?\? "right"\}/u);
	assert.match(panelSource, /const DETAIL_PREVIEW_POSITION = \{\s*align: "center",\s*alignOffset: 0,\s*side: "left",\s*\} as const;/u);
	assert.match(panelSource, /<JiraSessionFlyoutBody[\s\S]*previewPosition=\{DETAIL_PREVIEW_POSITION\}/u);
	assert.match(artifactsSource, /<SmartLink align="center" alignOffset=\{0\}[\s\S]*side="left"/u);
});

// The block delegates to the shared body and reuses the /asx seeds rather than
// re-declaring its own flyout body or placeholder lifecycle copy.
test("block delegates to the shared flyout body and reuses /asx data", () => {
	const source = readBlockFile("components/agent-session-flyout.tsx");
	const dataSource = readRepoFile(FLYOUT_DEMO_DATA_PATH);
	assert.match(
		source,
		/import\s*\{[^}]*JiraSessionFlyoutSurface[^}]*JiraSessionFlyoutTrigger[^}]*\}\s*from\s*"@\/components\/blocks\/product-sidebar\/variants\/jira-session-flyout"/u,
	);
	assert.match(source, /<JiraSessionFlyoutSurface handle=\{flyoutHandle\} \/>/u);
	assert.match(source, /<JiraSessionFlyoutTrigger[\s\S]*?session=\{session\}/u);
	assert.match(source, /AGENT_SESSION_FLYOUT_SESSIONS/u);
	assert.match(dataSource, /ASX_QUEUE_SESSION_SEEDS\.map\(createAsxQueueSidebarSessionItem\)/u);
	assert.doesNotMatch(source, /function AgentSessionFlyoutBody\b/u);
	assert.doesNotMatch(source, /STATUS_META|<h3\b|<section\b/u);
	assert.doesNotMatch(source, /paused for input|pull request is open|actively working/u);
});

// The demo and live sidebar use detached triggers connected to one Preview Card
// root. The shell follows the active trigger, immediately matches the incoming
// content size, and crossfades without adding counter-directional movement.
test("demo sessions share one moving shell with a fade-only content viewport", () => {
	const source = readBlockFile("components/agent-session-flyout.tsx");
	const flyoutSource = readRepoFile(FLYOUT_BODY_PATH);
	const flyoutHandleSource = readRepoFile(FLYOUT_HANDLE_PATH);
	const hoverCardSource = readRepoFile(HOVER_CARD_PATH);
	const hoverCardHandleSource = readRepoFile(HOVER_CARD_HANDLE_PATH);

	assert.match(source, /useState\(createJiraSessionFlyoutHandle\)/u);
	assert.equal(source.match(/<JiraSessionFlyoutSurface\b/gu)?.length, 1);
	assert.match(source, /flex max-w-sm flex-col gap-0\.5 rounded-lg border/u);
	assert.doesNotMatch(source, /<HoverCard\b/u);
	assert.match(flyoutHandleSource, /createHoverCardHandle<JiraSidebarSessionItem>\(\)/u);
	assert.match(flyoutSource, /cloneElement\(childElement, \{[\s\S]*onFocusCapture: \(event\) => \{[\s\S]*handle\.open\(triggerId\);/u);
	assert.match(flyoutSource, /event\.target\.matches\(":focus-visible"\)/u);
	assert.match(flyoutSource, /<HoverCardViewport\b/u);
	assert.match(flyoutSource, /\[&_\[data-current\]\]:transition-opacity/u);
	assert.match(flyoutSource, /\[&_\[data-previous\]\]:transition-opacity/u);
	assert.match(flyoutSource, /\[&_\[data-current\]\[data-starting-style\]\]:opacity-0/u);
	assert.match(flyoutSource, /\[&_\[data-previous\]\[data-ending-style\]\]:opacity-0/u);
	assert.doesNotMatch(flyoutSource, /data-\[activation-direction|translate-y-\[50%\]|will-change:transform/u);
	assert.match(flyoutSource, /transition-\[opacity,scale,translate\] duration-medium ease-in-out/u);
	assert.doesNotMatch(flyoutSource, /transition-\[[^\]]*(?:width|height)/u);
	assert.match(flyoutSource, /transition-\[top,left,right,bottom\] duration-medium ease-in-out/u);
	assert.doesNotMatch(flyoutSource, /\[&_\[(?:data-current|data-previous)\]\]:h-\(--popup-height\)/u);
	assert.match(flyoutSource, /overflow-clip rounded-\[inherit\]/u);
	assert.match(flyoutSource, /motion-reduce:\[&_\[data-current\]\]:transition-none/u);
	assert.match(hoverCardHandleSource, /const createHoverCardHandle = PreviewCardPrimitive\.createHandle/u);
	assert.match(hoverCardSource, /function HoverCardViewport\b/u);
	assert.match(hoverCardSource, /positionerClassName\?: string/u);
});

// SCM fields live in their own separated "Development" block using the normal
// 12px body font (not mono), and the block preserves every field the legacy
// compact flyout carried.
test("development fields are separated, complete, and use the normal body font", () => {
	const source = readRepoFile(FLYOUT_BODY_PATH);
	assert.match(source, />Development</u);
	assert.doesNotMatch(source, /font-mono/u);
	for (const label of ["Pull request", "Checks", "Repository", "Branch", "Worktree"]) {
		assert.match(source, new RegExp(`label="${label}"`, "u"), `missing Development field "${label}"`);
	}
});

// The live Jira sidebar row renders the same shared flyout body, and the old
// compact hover body is fully removed (never coexisting).
test("the live sidebar row renders the shared flyout body", () => {
	const jiraSource = readRepoFile("components/blocks/product-sidebar/variants/jira.tsx");
	assert.match(jiraSource, /JiraSessionFlyoutSurface,[\s\S]*JiraSessionFlyoutTrigger,[\s\S]*createJiraSessionFlyoutHandle/u);
	assert.match(jiraSource, /<JiraSessionFlyoutTrigger[\s\S]*?session=\{session\}/u);
	assert.match(jiraSource, /<JiraSessionFlyoutSurface handle=\{sessionFlyoutHandle\} \/>/u);
	assert.doesNotMatch(jiraSource, /JiraSessionHoverDetails/u);
});

test("demo presents the four sessions as one uninterrupted chat-history list", () => {
	const source = readBlockFile("components/agent-session-flyout.tsx");
	assert.match(source, /sessions\.map\(\(session\) => \([\s\S]*<JiraSessionFlyoutTrigger/u);
	assert.doesNotMatch(source, /AgentSessionFlyoutSection/u);
	assert.doesNotMatch(source, /gap-8/u);
});

// The four /asx seeds must cover the states shown in the flyout screenshots and
// carry the PR metadata the flyout renders for local sessions.
test("/asx seeds provide the four expected states with PR fields", () => {
	const seeds = readRepoFile("components/projects/jira-queue/data/queue-sessions.ts");

	for (const status of ["awaiting-input", "running", "pr-open", "merged"]) {
		assert.match(seeds, new RegExp(`status:\\s*"${status}"`, "u"), `missing seed with status "${status}"`);
	}
	// PR-bearing sessions carry a pull-request number + checks.
	assert.match(seeds, /pullRequestNumber:\s*1847/u);
	assert.match(seeds, /pullRequestNumber:\s*1842/u);
	assert.match(seeds, /checks:\s*"4 checks passing"/u);
	assert.match(seeds, /checks:\s*"6 checks passing"/u);
});

test("block is registered across catalog, manifest, details, and demo registry", () => {
	assert.match(readRepoFile("components/website/registry/blocks.ts"), /"agent-session-flyout":\s*dynamic\(/u);
	assert.match(readRepoFile("app/data/details/blocks.ts"), /"agent-session-flyout":\s*AGENT_SESSION_FLYOUT_DETAIL/u);
	assert.match(readRepoFile("app/data/component-manifest.ts"), /blockComponent\("agent-session-flyout", "Agent Session Flyout"\)/u);
	assert.match(readRepoFile("app/data/components.ts"), /blockComponent\("agent-session-flyout", "Agent Session Flyout"\)/u);
});
