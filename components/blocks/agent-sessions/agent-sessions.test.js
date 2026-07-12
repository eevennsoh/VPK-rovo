const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const AGENT_SESSIONS_SOURCE = fs.readFileSync(path.join(__dirname, "index.tsx"), "utf8");

test("AgentSessions opens the Jira work item modal from a button", () => {
	assert.match(AGENT_SESSIONS_SOURCE, /const \[isIssueOpen, setIsIssueOpen\] = useState\(false\);/u);
	assert.match(AGENT_SESSIONS_SOURCE, /className="flex h-full min-h-\[400px\] items-center justify-center p-4"/u);
	assert.match(AGENT_SESSIONS_SOURCE, /<Button[\s\S]*onClick=\{\(\) => setIsIssueOpen\(true\)\}[\s\S]*Open work item[\s\S]*<\/Button>/u);
	assert.match(
		AGENT_SESSIONS_SOURCE,
		/<JiraWorkItemModal isOpen=\{isIssueOpen\} onClose=\{\(\) => setIsIssueOpen\(false\)\} \/>/u,
	);
	assert.doesNotMatch(AGENT_SESSIONS_SOURCE, /<JiraWorkItemModal isOpen(?:\s|>)/u);
	assert.doesNotMatch(AGENT_SESSIONS_SOURCE, /Acmecorp: Prepare for bid recommendation for ESM RFP/u);
	assert.doesNotMatch(AGENT_SESSIONS_SOURCE, /bg-bg-neutral/u);
	assert.doesNotMatch(AGENT_SESSIONS_SOURCE, /relative h-full min-h-\[400px\]/u);
});

test("AgentSessions includes the shared floating Rovo launcher and chat surface", () => {
	assert.match(
		AGENT_SESSIONS_SOURCE,
		/import FloatingRovoButton from "@\/components\/projects\/shared\/components\/floating-rovo-button";/u,
	);
	assert.match(
		AGENT_SESSIONS_SOURCE,
		/import RovoFloatingChat from "@\/components\/projects\/rovo-floating-chat\/components\/rovo-floating-chat";/u,
	);
	assert.match(AGENT_SESSIONS_SOURCE, /\{chatSurface === null \? \([\s\S]*<FloatingRovoButton[\s\S]*product="jira"[\s\S]*\/>[\s\S]*\) : null\}/u);
	assert.match(AGENT_SESSIONS_SOURCE, /\{chatSurface === "floating" \? \([\s\S]*<RovoFloatingChat key="floating-chat" \/>[\s\S]*\) : null\}/u);
});
