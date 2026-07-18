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

// The shared body reuses the shared design-system components rather than
// re-implementing them.
test("shared flyout body reuses SmartLink, agent Tag, Lozenge, and GitHub logo", () => {
	const source = readRepoFile(FLYOUT_BODY_PATH);
	assert.match(source, /export function JiraSessionFlyoutBody\b/u);
	assert.match(source, /import\s*\{[^}]*SmartLink[^}]*\}\s*from\s*"@\/components\/blocks\/smart-link"/u);
	assert.match(source, /import\s*\{[^}]*GithubLogo[^}]*\}\s*from\s*"@\/components\/ui\/logo-third-party"/u);
	assert.match(source, /import\s*\{[^}]*Lozenge[^}]*\}\s*from\s*"@\/components\/ui\/lozenge"/u);
	assert.match(source, /import\s*\{[^}]*Tag[^}]*\}\s*from\s*"@\/components\/ui\/tag"/u);
	assert.match(source, /<SmartLink item=\{toWorkItem\(session\)\}/u);
	// Agent renders as an agent-type Tag pill; PR state renders as a Lozenge.
	assert.match(source, /<Tag[\s\S]*?type="agent"/u);
	assert.match(source, /<Lozenge variant=\{prState\.variant\}>/u);
});

// The block only supplies demo chrome; it delegates to the shared body and
// reuses the /asx seeds rather than re-declaring its own flyout body.
test("block delegates to the shared flyout body and reuses /asx data", () => {
	const source = readBlockFile("components/agent-session-flyout.tsx");
	assert.match(
		source,
		/import\s*\{[^}]*JiraSessionFlyoutBody[^}]*\}\s*from\s*"@\/components\/blocks\/product-sidebar\/variants\/jira-session-flyout"/u,
	);
	assert.match(source, /<JiraSessionFlyoutBody session=\{session\} \/>/u);
	assert.match(source, /ASX_QUEUE_SESSION_SEEDS\.map\(createAsxQueueSidebarSessionItem\)/u);
	assert.doesNotMatch(source, /function AgentSessionFlyoutBody\b/u);
});

// Each flyout must render inside the real anchored HoverCard chrome (the modal
// menu), not a flat inline card, and each session gets its own <section>.
test("each demo renders in a HoverCard popover inside its own section", () => {
	const source = readBlockFile("components/agent-session-flyout.tsx");
	assert.match(source, /import\s*\{[^}]*HoverCardContent[^}]*\}\s*from\s*"@\/components\/ui\/hover-card"/u);
	assert.match(source, /<HoverCardTrigger/u);
	assert.match(source, /<HoverCardContent\b[\s\S]*?shadow-overlay[\s\S]*?\/>/u);
	assert.match(source, /<HoverCardContent\b[\s\S]*?side="right"[\s\S]*?\/>/u);
	assert.match(source, /<section\b/u);
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
	assert.match(jiraSource, /import \{ JiraSessionFlyoutBody \} from "\.\/jira-session-flyout";/u);
	assert.match(jiraSource, /<JiraSessionFlyoutBody session=\{session\} \/>/u);
	assert.doesNotMatch(jiraSource, /JiraSessionHoverDetails/u);
});

test("all four session lifecycle states are labeled", () => {
	const source = readBlockFile("components/agent-session-flyout.tsx");
	for (const label of ["Awaiting user response", "In progress", "PR open", "PR merged"]) {
		assert.ok(source.includes(label), `expected label "${label}" in the block`);
	}
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
