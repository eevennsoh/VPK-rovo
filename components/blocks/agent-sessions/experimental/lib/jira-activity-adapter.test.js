const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(process.cwd() + "/scripts/lib/esbuild-cjs-loader.js");

const ADAPTER_PATH = path.join(__dirname, "jira-activity-adapter.ts");

let adapterPromise;
function loadAdapter() {
	if (!adapterPromise) {
		adapterPromise = esbuild
			.build({
				entryPoints: [ADAPTER_PATH],
				bundle: true,
				format: "cjs",
				platform: "node",
				tsconfig: path.join(process.cwd(), "tsconfig.json"),
				write: false,
			})
			.then((result) => loadCjsModuleFromText(result.outputFiles[0].text, "jira-activity-adapter-harness.cjs"));
	}
	return adapterPromise;
}

test("maps human activity to a non-replyable Jira comment", async () => {
	const adapter = await loadAdapter();
	const [entry] = adapter.mapActivityEventsToJiraEntries([
		{
			id: "comment-1",
			kind: "human",
			author: { name: "Jordan Lee", avatarUrl: "/jordan.png" },
			content: "Budget qualification is still open.",
			createdAtMs: Date.UTC(2026, 4, 12, 9, 5),
		},
	]);

	assert.deepEqual(entry, {
		id: "comment-1",
		kind: "comment",
		actor: {
			id: "agent-sessions-person-jordan-lee",
			name: "Jordan Lee",
			kind: "person",
			avatarSrc: "/jordan.png",
		},
		timestamp: "9:05 AM",
		body: [{ type: "text", text: "Budget qualification is still open." }],
		allowReply: false,
	});
});

test("maps agent activity to rich Jira comments with lifecycle tags", async () => {
	const adapter = await loadAdapter();
	const statuses = [
		["running", "Working", "blue"],
		["waiting", "Waiting for you", "yellow"],
		["completed", "Done", "green"],
	];

	for (const [index, [status, text, color]] of statuses.entries()) {
		const [entry] = adapter.mapActivityEventsToJiraEntries([
			{
				id: `activity-${index}`,
				kind: "agent",
				sessionId: `session-${index}`,
				agentId: "research-agent",
				agentName: "Research agent",
				agentAvatarSrc: "/research.svg",
				status,
				title: "Review qualification evidence",
				branch: "rovo/rfp-101-qualification",
				elapsedSeconds: 180 + index,
				commandPreview: "Review the qualification evidence",
				responsePreview: `Latest response ${index}`,
				createdAtMs: Date.UTC(2026, 4, 12, 13, index),
			},
		]);

		assert.deepEqual(entry.actor, {
			id: "agent-sessions-agent-research-agent",
			name: "Research agent",
			kind: "agent",
			avatarSrc: "/research.svg",
		});
		assert.deepEqual(entry.tag, { text, color });
		assert.deepEqual(entry.body, [{ type: "text", text: `Latest response ${index}` }]);
		assert.deepEqual(entry.collapsible, {
			label: "Prompt",
			content: [{ type: "text", text: "Review the qualification evidence" }],
		});
		assert.equal(entry.allowReply, status !== "completed");
		assert.deepEqual(entry.sessionItem, {
			id: `session-${index}`,
			title: "Review qualification evidence",
			state: status === "waiting" ? "needs-input" : status === "completed" ? "complete" : "running",
			agent: {
				name: "Research agent",
				avatarSrc: "/research.svg",
			},
			branch: "rovo/rfp-101-qualification",
			elapsedSeconds: 180 + index,
		});
	}
});

test("maps skill activity to the canonical VPK Rovo logo", async () => {
	const adapter = await loadAdapter();
	const [entry] = adapter.mapActivityEventsToJiraEntries([
		{
			id: "activity-skill-1",
			kind: "agent",
			sessionId: "session-skill-1",
			agentId: "skill:improve-description",
			agentName: "Rovo",
			status: "running",
			title: "Improve description",
			branch: "rovo/risk-review",
			elapsedSeconds: 0,
			commandPreview: "/Improve description",
			responsePreview: "Reviewing the current description…",
			createdAtMs: Date.UTC(2026, 4, 12, 13, 30),
		},
	]);

	assert.deepEqual(entry.actor, {
		id: "agent-sessions-agent-skill:improve-description",
		name: "Rovo",
		kind: "agent",
		vpkLogo: "rovo",
	});
	assert.deepEqual(entry.sessionItem.agent, {
		name: "Rovo",
		vpkLogo: "rovo",
	});
});

test("maps a static event to a Jira event row with icon, segments, and timestamp", async () => {
	const adapter = await loadAdapter();
	const [entry] = adapter.mapActivityEventsToJiraEntries([
		{
			id: "static-labelled",
			kind: "event",
			actor: {
				id: "static-triage-assistant",
				name: "Triage assistant",
				kind: "agent",
				avatarSrc: "/triage.svg",
			},
			icon: "label",
			segments: [
				{ type: "text", text: "added " },
				{ type: "label", text: "RFP", color: "blue" },
			],
			createdAtMs: Date.UTC(2026, 4, 12, 13, 5),
		},
	]);

	assert.equal(entry.kind, "event");
	assert.equal(entry.icon, "label");
	assert.deepEqual(entry.actor, {
		id: "static-triage-assistant",
		name: "Triage assistant",
		kind: "agent",
		avatarSrc: "/triage.svg",
	});
	assert.deepEqual(entry.segments, [
		{ type: "text", text: "added " },
		{ type: "label", text: "RFP", color: "blue" },
	]);
	assert.equal(typeof entry.timestamp, "string");
});

test("maps a static event without an icon and an app actor with a brand name", async () => {
	const adapter = await loadAdapter();
	const [entry] = adapter.mapActivityEventsToJiraEntries([
		{
			id: "static-linked",
			kind: "event",
			actor: { id: "static-github", name: "GitHub", kind: "app", brandName: "github" },
			segments: [{ type: "text", text: "linked the response workspace" }],
			createdAtMs: Date.UTC(2026, 4, 12, 13, 20),
		},
	]);

	assert.equal(entry.kind, "event");
	assert.equal(entry.icon, undefined);
	assert.deepEqual(entry.actor, { id: "static-github", name: "GitHub", kind: "app", brandName: "github" });
});

test("forwards pull-request metadata on a static event so it renders the Jira Activity PR row", async () => {
	const adapter = await loadAdapter();
	const pullRequest = {
		number: 1847,
		title: "Add Acmecorp ESM RFP response workspace",
		status: "Open",
		additions: 148,
		deletions: 37,
	};
	const [entry] = adapter.mapActivityEventsToJiraEntries([
		{
			id: "static-linked",
			kind: "event",
			actor: { id: "static-github", name: "GitHub", kind: "app", brandName: "github" },
			icon: "linked",
			segments: [],
			pullRequest,
			createdAtMs: Date.UTC(2026, 4, 12, 13, 20),
		},
	]);

	assert.equal(entry.kind, "event");
	assert.equal(entry.icon, "linked");
	assert.deepEqual(entry.pullRequest, pullRequest);
});

test("maps a static changed-files event to a Jira changed-files card", async () => {
	const adapter = await loadAdapter();
	const [entry] = adapter.mapActivityEventsToJiraEntries([
		{
			id: "static-changed-files",
			kind: "changed-files",
			actor: { id: "static-readiness", name: "Readiness Checker", kind: "agent", avatarSrc: "/readiness.svg" },
			summary: "Updated 3 resources",
			description: "Refreshed the compliance matrix and owners.",
			branch: "#RFP-101",
			sessionItem: {
				id: "readiness-output-session",
				title: "Refresh compliance resources",
				state: "complete",
				agent: { name: "Readiness Checker", avatarSrc: "/readiness.svg" },
				branch: "rovo/rfp-101-risk-review",
				elapsedSeconds: 300,
			},
			outputs: [
				{
					id: "compliance-matrix",
					title: "Acmecorp compliance matrix",
					source: "Confluence page",
					iconName: "globe",
				},
			],
			createdAtMs: Date.UTC(2026, 4, 12, 13, 30),
		},
	]);

	assert.equal(entry.kind, "changed-files");
	assert.equal(entry.summary, "Updated 3 resources");
	assert.equal(entry.description, "Refreshed the compliance matrix and owners.");
	assert.equal(entry.branch, "#RFP-101");
	assert.equal(entry.sessionItem.title, "Refresh compliance resources");
	assert.deepEqual(entry.outputs.map((output) => output.title), ["Acmecorp compliance matrix"]);
	assert.deepEqual(entry.actor, {
		id: "static-readiness",
		name: "Readiness Checker",
		kind: "agent",
		avatarSrc: "/readiness.svg",
	});
});

test("preserves input chronology and represents a missing agent response as an empty body", async () => {
	const adapter = await loadAdapter();
	const entries = adapter.mapActivityEventsToJiraEntries([
		{
			id: "later-human",
			kind: "human",
			author: { name: "You" },
			content: "Keep this first because the input placed it first.",
			createdAtMs: Date.UTC(2026, 4, 12, 12),
		},
		{
			id: "earlier-agent",
			kind: "agent",
			sessionId: "session-1",
			agentId: "rovo",
			agentName: "Rovo",
			status: "running",
			title: "Investigate",
			branch: "rovo/investigate",
			elapsedSeconds: 60,
			commandPreview: "Investigate",
			createdAtMs: Date.UTC(2026, 4, 12, 11),
		},
	]);

	assert.deepEqual(entries.map((entry) => entry.id), ["later-human", "earlier-agent"]);
	assert.deepEqual(entries[0].actor, adapter.AGENT_SESSIONS_CURRENT_USER);
	assert.deepEqual(entries[1].body, []);
	assert.equal(entries[1].sessionItem.agent.avatarSrc, entries[1].actor.avatarSrc);
});
