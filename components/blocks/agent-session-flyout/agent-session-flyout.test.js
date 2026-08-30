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

// The Jira sidebar variant owns both the property-free hover surface and the
// richer detail body used by full detail panels. Property names stay on the
// row as accessible labels only — never as a visible label column.
const FLYOUT_BODY_PATH = "components/blocks/product-sidebar/variants/jira-session-flyout.tsx";
const FLYOUT_HANDLE_PATH = "components/blocks/product-sidebar/variants/jira-session-flyout-data.ts";
const FLYOUT_DEMO_DATA_PATH = "components/blocks/agent-session-flyout/agent-session-flyout-data.ts";
const HOVER_CARD_PATH = "components/ui/hover-card.tsx";
const HOVER_CARD_HANDLE_PATH = "components/ui/hover-card-handle.ts";
const QUEUE_DETAIL_ARTIFACTS_PATH = "components/projects/jira-queue/components/queue-detail-artifacts.tsx";
const QUEUE_DETAIL_PANEL_PATH = "components/projects/jira-queue/components/queue-detail-panel.tsx";

test("shared hover flyout defaults to session details and exposes composer and untracked-work variants", () => {
	const source = readRepoFile(FLYOUT_BODY_PATH);
	assert.match(source, /export type JiraSessionFlyoutContent = "details" \| "composer" \| "untracked-work";/u);
	assert.match(source, /content = "details"/u);
	assert.match(source, /case "details":/u);
	assert.match(source, /<JiraSessionFlyoutBody session=\{session\} \/>/u);
	assert.match(source, /case "composer":/u);
	assert.match(source, /case "untracked-work":/u);
	assert.match(source, /<JiraSessionFlyoutBody[\s\S]*session=\{session\}[\s\S]*variant="untracked-work"/u);
	assert.match(source, /showSeparator/u);
	assert.match(source, /Link to \{session\.issueKey\}/u);
	assert.match(source, /<JiraSessionSectionHeading meta="High confidence" showSeparator>/u);
	assert.match(source, /flex min-w-0 shrink-0 items-center gap-1\.5 text-xs font-medium leading-4 text-text-subtle/u);
	assert.match(source, /className="shrink-0 text-xs font-normal text-text-subtlest"/u);
	assert.doesNotMatch(source, /<span aria-hidden="true"> · <\/span>/u);
	assert.match(source, /aria-label=\{`Link to \$\{session\.issueKey\}, High confidence`\}/u);
	assert.match(source, /This session appears related to \{session\.issueKey\}/u);
	assert.match(source, /<ButtonGroup aria-label=\{`Link \$\{issueKey\}`\} variant="split">/u);
	assert.match(source, /Link to \{issueKey\}/u);
	assert.match(source, /aria-disabled=\{linkUnavailable\}/u);
	assert.match(source, /onClick=\{\(\) => onLinkWorkItem\?\.\(issueKey\)\}/u);
	assert.match(source, /aria-label=\{`More link options for \$\{issueKey\}`\}/u);
	assert.match(source, /<DropdownMenuItem[\s\S]*disabled=\{addAsSubtaskUnavailable\}[\s\S]*onSelect=\{\(\) => onAddAsSubtask\?\.\(issueKey\)\}[\s\S]*>\s*Add as a subtask/u);
	assert.match(source, /Create new/u);
	assert.match(source, /aria-disabled=\{createUnavailable\}/u);
	assert.match(source, /onClick=\{onCreateWorkItem\}/u);
	assert.match(source, /onLinkWorkItem\?: \(session: JiraSidebarSessionItem, workItemKey: string\) => void;/u);
	assert.match(source, /onCreateWorkItem\?: \(session: JiraSidebarSessionItem\) => void;/u);
	assert.match(source, /onAddAsSubtask\?: \(session: JiraSidebarSessionItem, workItemKey: string\) => void;/u);
	assert.match(
		source,
		/<AgentStates[\s\S]*agent=\{\{[\s\S]*id: session\.id,[\s\S]*name: session\.agentName,[\s\S]*state=\{toAgentStatesState\(session\.status\)\}/u,
	);
	assert.match(source, /function toAgentStatesState\(/u);
	assert.match(source, /status === "awaiting-input"\) return "awaiting-input"/u);
	assert.match(source, /status === "running"\) return "working"/u);
	assert.match(source, /return "completed"/u);
});

test("shared Agent States flyout forwards submission, timing, and stopped lifecycle data", () => {
	const source = readRepoFile(FLYOUT_BODY_PATH);
	const jiraSource = readRepoFile("components/blocks/product-sidebar/variants/jira.tsx");
	const queueSource = readRepoFile("components/projects/jira-queue/data/queue-sessions.ts");

	assert.match(source, /onSubmitPrompt\?: \(session: JiraSidebarSessionItem, prompt: string\) => void;/u);
	assert.match(source, /onSubmit=\{onSubmitPrompt \? \(prompt\) => onSubmitPrompt\(session, prompt\) : undefined\}/u);
	for (const prop of ["completedAtMs", "completedSecondsAgo", "initialElapsedSeconds", "startedAtMs"]) {
		assert.match(source, new RegExp(`${prop}=\\{session\\.${prop}\\}`, "u"));
		assert.match(jiraSource, new RegExp(`${prop}\\?: number;`, "u"));
	}
	assert.match(source, /function toAgentStatesMessage\(/u);
	assert.match(source, /status !== "stopped"\) return undefined;/u);
	assert.match(source, /This session was stopped before the requested work was completed\./u);
	assert.match(source, /message=\{toAgentStatesMessage\(session\.status\)\}/u);
	assert.match(queueSource, /const QUEUE_SESSION_TIMING:/u);
	assert.match(queueSource, /stopped: \{ completedSecondsAgo:/u);
});

// Detail panels still reuse the shared design-system property components rather
// than re-implementing them inside each panel.
test("shared detail body reuses SmartLink, agent Tag, Lozenge, GitHub logo, and CI progress circle", () => {
	const source = readRepoFile(FLYOUT_BODY_PATH);
	const jiraSource = readRepoFile("components/blocks/product-sidebar/variants/jira.tsx");
	assert.match(source, /export function JiraSessionFlyoutBody\b/u);
	assert.match(source, /import\s*\{[^}]*SmartLink[^}]*\}\s*from\s*"@\/components\/blocks\/smart-link"/u);
	assert.match(source, /import\s*\{[^}]*GithubLogo[^}]*\}\s*from\s*"@\/components\/ui\/logo-third-party"/u);
	assert.match(source, /import\s*\{[^}]*Lozenge[^}]*\}\s*from\s*"@\/components\/ui\/lozenge"/u);
	assert.match(source, /import\s*\{[^}]*Tag[^}]*\}\s*from\s*"@\/components\/ui\/tag"/u);
	assert.match(source, /import\s*\{[^}]*ProgressCircle[^}]*\}\s*from\s*"@\/components\/ui-custom\/progress-circle"/u);
	assert.match(jiraSource, /export interface JiraSidebarSessionChecks \{\s*failed: number;\s*passed: number;\s*\}/u);
	assert.match(source, /const workItemRelationship = variant === "untracked-work" \? "suggested" : "primary";/u);
	assert.match(source, /<SmartLink[\s\S]*item=\{toWorkItem\(session, workItemRelationship\)\}/u);
	assert.match(source, /showStatus=\{workItemRelationship === "primary"\}/u);
	assert.match(source, /relationship === "suggested" \? "Suggested" : "Primary"/u);
	assert.match(source, /\.\.\.\(relationship === "primary"[\s\S]*actions: SMART_LINK_MODAL_ACTIONS/u);
	// Agent renders as the canonical at-mention Tag; PR state renders as a Lozenge.
	assert.match(
		source,
		/<Tag[\s\S]*color="gray"[\s\S]*type="agent"[\s\S]*variant="editor"/u,
	);
	assert.match(
		source,
		/<AgentAvatarVisual[\s\S]*sizePx=\{16\}/u,
	);
	assert.doesNotMatch(source, /TileAvatar/u);
	assert.match(source, /<Lozenge variant=\{prState\.variant\}>/u);
	assert.match(
		source,
		/<ProgressCircle[\s\S]*aria-hidden[\s\S]*animated=\{false\}[\s\S]*size="xs"[\s\S]*value=\{checksTotal > 0 \? Math\.round\(\(session\.checks\.passed \/ checksTotal\) \* 100\) : 0\}[\s\S]*variant="outline"/u,
	);
	assert.match(source, /`\$\{checks\.passed\}\/\$\{total\} passed \$\{checks\.failed\} failed`/u);
	assert.match(source, /`\$\{checks\.passed\}\/\$\{total\} passed`/u);
	assert.match(source, /className="shrink-0 text-xs font-normal text-text"/u);
	assert.doesNotMatch(source, /CheckCircleIcon/u);
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

// The block delegates to the shared surface and reuses the /jira-golden-journeys-v0 seeds rather than
// re-declaring its own flyout card or placeholder lifecycle copy.
test("block delegates to the shared flyout surface and reuses /jira-golden-journeys-v0 data", () => {
	const source = readBlockFile("components/agent-session-flyout.tsx");
	const dataSource = readRepoFile(FLYOUT_DEMO_DATA_PATH);
	assert.match(
		source,
		/import\s*\{[^}]*JiraSessionFlyoutSurface[^}]*JiraSessionFlyoutTrigger[^}]*\}\s*from\s*"@\/components\/blocks\/product-sidebar\/variants\/jira-session-flyout"/u,
	);
	assert.match(source, /<JiraSessionFlyoutSurface[\s\S]*content=\{content\}[\s\S]*handle=\{flyoutHandle\}[\s\S]*onLinkWorkItem=\{onLinkWorkItem\}/u);
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

// SCM fields remain available to full detail panels. Visible rows are icon +
// value only; the property name is screen-reader-only so a label column cannot
// regress back into the flyout.
test("session flyout metadata is compact and property-free", () => {
	const source = readRepoFile(FLYOUT_BODY_PATH);
	assert.doesNotMatch(source, /grid-cols-\[16px_84px_minmax\(0,1fr\)\]/u);
	assert.match(source, /<span className="sr-only">\{label\}<\/span>/u);
	assert.doesNotMatch(source, /<span className="text-text-subtlest">\{label\}<\/span>/u);
	assert.doesNotMatch(source, /font-mono/u);
	assert.match(source, /return \(\s*<div className="flex flex-col gap-2">/u);
	assert.doesNotMatch(source, /<Alert\b|<AlertTitle\b|>Development</u);
	for (const label of ["Session", "Agent", "Work item", "Pull request", "Checks", "Repository", "Branch", "Worktree"]) {
		assert.match(source, new RegExp(`label="${label}"`, "u"), `missing accessible property name "${label}"`);
	}
});

// The live Jira sidebar row renders the same property-free shared flyout.
test("the live sidebar row renders the shared flyout surface", () => {
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

// The four /jira-golden-journeys-v0 seeds must cover the states shown in the flyout screenshots and
// carry the PR metadata the flyout renders for local sessions.
test("/jira-golden-journeys-v0 seeds provide the four expected states with PR fields", () => {
	const seeds = readRepoFile("components/projects/jira-queue/data/queue-sessions.ts");

	for (const status of ["awaiting-input", "running", "pr-open", "merged"]) {
		assert.match(seeds, new RegExp(`status:\\s*"${status}"`, "u"), `missing seed with status "${status}"`);
	}
	// PR-bearing sessions carry a pull-request number + checks.
	assert.match(seeds, /pullRequestNumber:\s*1847/u);
	assert.match(seeds, /pullRequestNumber:\s*1842/u);
	assert.match(seeds, /checks:\s*\{ passed: 2, failed: 1 \}/u);
	assert.match(seeds, /checks:\s*\{ passed: 6, failed: 0 \}/u);
});

test("block is registered across catalog, manifest, details, and demo registry", () => {
	assert.match(readRepoFile("components/website/registry/blocks.ts"), /"agent-session-flyout":\s*dynamic\(/u);
	assert.match(readRepoFile("app/data/details/blocks.ts"), /"agent-session-flyout":\s*AGENT_SESSION_FLYOUT_DETAIL/u);
	assert.match(readRepoFile("app/data/component-manifest.ts"), /blockComponent\("agent-session-flyout", "Agent Session Flyout"\)/u);
	assert.match(readRepoFile("app/data/components.ts"), /blockComponent\("agent-session-flyout", "Agent Session Flyout"\)/u);
});

test("catalog defaults to session details and exposes composer and untracked-work options", () => {
	const source = readBlockFile("components/agent-session-flyout.tsx");
	const pageSource = readBlockFile("page.tsx");
	const demoSource = readRepoFile("components/website/demos/blocks/agent-session-flyout-demo.tsx");
	const detailSource = readRepoFile("app/data/details/blocks/agent-session-flyout.ts");
	const variantRegistry = readRepoFile("components/website/registry/blocks-variants.ts");

	assert.match(source, /content = "details"/u);
	assert.match(source, /content\?: JiraSessionFlyoutContent/u);
	assert.match(pageSource, /content = "details"/u);
	assert.match(pageSource, /\{ label: "Details", value: "details" \}/u);
	assert.match(pageSource, /\{ label: "Composer", value: "composer" \}/u);
	assert.match(pageSource, /\{ label: "Untracked work", value: "untracked-work" \}/u);
	assert.match(pageSource, /<AgentSessionFlyout[\s\S]*content=\{flyoutContent\}/u);
	assert.match(pageSource, /onLinkWorkItem=\{/u);
	assert.match(pageSource, /onCreateWorkItem=\{/u);
	assert.match(pageSource, /onAddAsSubtask=\{/u);
	assert.match(pageSource, /aria-live="polite"/u);
	assert.match(demoSource, /export function AgentSessionFlyoutDemoComposer/u);
	assert.match(demoSource, /<Page content="composer" \/>/u);
	assert.match(demoSource, /export function AgentSessionFlyoutDemoUntrackedWork/u);
	assert.match(demoSource, /<Page content="untracked-work" \/>/u);
	assert.match(detailSource, /name: "content"/u);
	assert.match(detailSource, /type: '"details" \| "composer" \| "untracked-work"'/u);
	assert.match(detailSource, /default: '"details"'/u);
	assert.match(detailSource, /title: "Composer flyout"/u);
	assert.match(detailSource, /demoSlug: "agent-session-flyout-demo-composer"/u);
	assert.match(detailSource, /title: "Untracked work"/u);
	assert.match(detailSource, /demoSlug: "agent-session-flyout-demo-untracked-work"/u);
	assert.match(variantRegistry, /"agent-session-flyout-demo-composer": dynamic/u);
	assert.match(variantRegistry, /default: mod\.AgentSessionFlyoutDemoComposer/u);
	assert.match(variantRegistry, /"agent-session-flyout-demo-untracked-work": dynamic/u);
	assert.match(variantRegistry, /default: mod\.AgentSessionFlyoutDemoUntrackedWork/u);
});
