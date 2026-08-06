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
				// The adapter's import graph reaches Atlaskit packages that `require()`
				// their compiled CSS. Node only needs the module's behavior, so drop
				// stylesheets instead of failing the bundle.
				loader: { ".css": "empty" },
				tsconfig: path.join(process.cwd(), "tsconfig.json"),
				write: false,
			})
			.then((result) => loadCjsModuleFromText(result.outputFiles[0].text, "jira-activity-adapter-v2-harness.cjs"));
	}
	return adapterPromise;
}

test("uses Venn as the Jira work-item current user with the supplied face avatar", async () => {
	const adapter = await loadAdapter();

	assert.deepEqual(adapter.JIRA_WORK_ITEM_CURRENT_USER, {
		id: "jira-work-item-current-user",
		name: "Venn",
		kind: "person",
		avatarSrc: "/avatar-user/venn/venn.png",
	});
});

test("maps human activity to a replyable Jira comment", async () => {
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
			id: "jira-work-item-person-jordan-lee",
			name: "Jordan Lee",
			kind: "person",
			avatarSrc: "/jordan.png",
		},
		timestamp: "9:05 AM",
		body: [{ type: "text", text: "Budget qualification is still open." }],
		allowReply: true,
	});
});

test("maps activity timestamps relative to the supplied story clock", async () => {
	const adapter = await loadAdapter();
	const referenceTimeMs = Date.UTC(2026, 4, 12, 9, 9);
	const [entry] = adapter.mapActivityEventsToJiraEntries([
		{
			id: "comment-relative-time",
			kind: "human",
			author: { name: "Maya Chen" },
			content: "Keep the release focused.",
			createdAtMs: Date.UTC(2026, 4, 12, 9, 5),
		},
	], referenceTimeMs);

	assert.equal(entry.timestamp, "4 minutes ago");
});

test("maps authored eyes reactions and agent handoff replies into Jira comments", async () => {
	const adapter = await loadAdapter();
	const [humanEntry, agentEntry] = adapter.mapActivityEventsToJiraEntries([
		{
			id: "comment-broadcast",
			kind: "human",
			author: { name: "Venn" },
			content: "Check the live reconnect path.",
			createdAtMs: Date.UTC(2026, 4, 12, 9, 5),
			threadReplies: [{
				id: "human-reply-1",
				authorName: "Maya Chen",
				authorAvatarSrc: "/maya.png",
				content: "Include mobile web in the acceptance proof.",
				createdAtMs: Date.UTC(2026, 4, 12, 9, 5, 30),
			}],
			reactions: [{
				emoji: "👀",
				actorIds: ["jira-work-item-agent-service-impact", "jira-work-item-agent-claude-code"],
			}],
		},
		{
			id: "activity-claude",
			kind: "agent",
			sessionId: "session-claude",
			agentId: "claude-code",
			agentName: "Claude Code",
			status: "waiting",
			waitingOn: {
				kind: "agent",
				agentId: "service-impact",
				agentName: "Service Impact agent",
				agentAvatarSrc: "/service-impact.svg",
			},
			title: "Patch reconnect handling",
			branch: "codex/jra-4821",
			elapsedSeconds: 45,
			commandPreview: "Fix the reset",
			createdAtMs: Date.UTC(2026, 4, 12, 9, 6),
			threadReplies: [{
				id: "handoff-1",
				agentId: "service-impact",
				agentName: "Service Impact agent",
				agentAvatarSrc: "/service-impact.svg",
				content: "The stale filter snapshot is restored after the reconnect subscription resolves.",
				createdAtMs: Date.UTC(2026, 4, 12, 9, 7),
			}],
		},
	]);

	assert.deepEqual(humanEntry.reactions, [{
		emoji: "👀",
		actorIds: ["jira-work-item-agent-service-impact", "jira-work-item-agent-claude-code"],
	}]);
	assert.deepEqual(humanEntry.replies, [{
		id: "human-reply-1",
		actor: {
			id: "jira-work-item-person-maya-chen",
			name: "Maya Chen",
			kind: "person",
			avatarSrc: "/maya.png",
		},
		timestamp: "9:05 AM",
		body: "Include mobile web in the acceptance proof.",
	}]);
	assert.deepEqual(agentEntry.tag, { text: "Waiting for Service Impact agent", color: "yellow" });
	assert.deepEqual(agentEntry.replies, [{
		id: "handoff-1",
		actor: {
			id: "jira-work-item-agent-service-impact",
			name: "Service Impact agent",
			kind: "agent",
			avatarSrc: "/service-impact.svg",
		},
		timestamp: "9:07 AM",
		body: "The stale filter snapshot is restored after the reconnect subscription resolves.",
	}]);
});

test("composes visible delegated sessions as replies beneath one lead agent", async () => {
	const adapter = await loadAdapter();
	const events = [
		{
			id: "activity-planner",
			kind: "agent",
			sessionId: "session-planner",
			agentId: "code-planner",
			agentName: "Code Planner",
			status: "running",
			title: "Plan guest checkout",
			branch: "rovo/plan",
			elapsedSeconds: 12,
			commandPreview: "Lead the plan",
			responsePreview: "Designing the checkout contract…",
			createdAtMs: 100,
		},
		{
			id: "activity-copilot",
			kind: "agent",
			sessionId: "session-copilot",
			agentId: "github-copilot",
			agentName: "GitHub Copilot",
			status: "running",
			title: "Implement guest checkout",
			branch: "rovo/implement",
			elapsedSeconds: 8,
			commandPreview: "Implement guest checkout",
			responsePreview: "Implementing against the approved contract…",
			createdAtMs: 200,
			threadReplies: [{
				id: "copilot-test-handoff",
				agentId: "unit-test-creator",
				agentName: "Unit Test Creator",
				agentAvatarSrc: "/unit-test-creator.svg",
				content: "The implementation is ready for acceptance coverage.",
				createdAtMs: 250,
			}],
		},
		{
			id: "activity-tests",
			kind: "agent",
			sessionId: "session-tests",
			agentId: "unit-test-creator",
			agentName: "Unit Test Creator",
			status: "running",
			title: "Verify acceptance coverage",
			branch: "rovo/tests",
			elapsedSeconds: 4,
			commandPreview: "Build acceptance proof",
			responsePreview: "Building deterministic acceptance cases…",
			createdAtMs: 300,
		},
	];
	const config = {
		parentSessionId: "session-planner",
		childSessionIds: ["session-copilot", "session-tests"],
		visibleSessionIds: ["session-planner", "session-copilot"],
	};

	const composed = adapter.composeActivitySessionThread(events, config);
	assert.equal(composed.length, 1);
	assert.equal(composed[0].sessionId, "session-planner");
	assert.deepEqual(composed[0].threadReplies, [{
		id: "activity-copilot-thread-reply",
		sessionId: "session-copilot",
		agentId: "github-copilot",
		agentName: "GitHub Copilot",
		agentAvatarSrc: undefined,
		content: "Implementing against the approved contract…",
		createdAtMs: 200,
	}, {
		id: "copilot-test-handoff",
		agentId: "unit-test-creator",
		agentName: "Unit Test Creator",
		agentAvatarSrc: "/unit-test-creator.svg",
		content: "The implementation is ready for acceptance coverage.",
		createdAtMs: 250,
	}]);

	const [mappedEntry] = adapter.mapActivityEventsToJiraEntries(composed, undefined, events);
	assert.deepEqual(
		mappedEntry.replies.map((reply) => reply.sessionItem?.id),
		["session-copilot", "session-tests"],
		"agent replies retain the session used by their View action",
	);

	assert.deepEqual(
		adapter.composeActivitySessionThread(events, { ...config, visibleSessionIds: [] }),
		[],
	);
	assert.equal(events.length, 3, "composition must not mutate the source timeline");
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
			id: "jira-work-item-agent-research-agent",
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
		id: "jira-work-item-agent-skill:improve-description",
		name: "Rovo",
		kind: "agent",
		vpkLogo: "rovo",
	});
	assert.deepEqual(entry.sessionItem.agent, {
		name: "Rovo",
		vpkLogo: "rovo",
	});
});

test("maps third-party coding-agent identity through activity, session, and mention surfaces", async () => {
	const adapter = await loadAdapter();
	const [comment, claudeEntry] = adapter.mapActivityEventsToJiraEntries([
		{
			id: "comment-claude",
			kind: "human",
			author: { name: "Venn" },
			content: "Ask @Claude Code to implement the change.",
			createdAtMs: Date.UTC(2026, 4, 12, 13, 30),
		},
		{
			id: "activity-claude-branded",
			kind: "agent",
			sessionId: "session-claude-branded",
			agentId: "claude-code",
			agentName: "Claude Code",
			agentAvatarSrc: "/wrong-custom-avatar.svg",
			agentBrandName: "claude",
			status: "running",
			title: "Implement the change",
			branch: "feature/change",
			elapsedSeconds: 10,
			commandPreview: "Implement the change",
			createdAtMs: Date.UTC(2026, 4, 12, 13, 31),
		},
	]);

	assert.deepEqual(claudeEntry.actor, {
		id: "jira-work-item-agent-claude-code",
		name: "Claude Code",
		kind: "agent",
		brandName: "claude",
	});
	assert.deepEqual(claudeEntry.sessionItem.agent, {
		name: "Claude Code",
		brandName: "claude",
	});
	assert.deepEqual(comment.body, [
		{ type: "text", text: "Ask " },
		{ type: "agent-mention", text: "Claude Code", brandName: "claude" },
		{ type: "text", text: " to implement the change." },
	]);
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
			author: { name: "Venn" },
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
	assert.deepEqual(entries[0].actor, adapter.JIRA_WORK_ITEM_CURRENT_USER);
	assert.deepEqual(entries[1].body, []);
	assert.equal(entries[1].sessionItem.agent.avatarSrc, entries[1].actor.avatarSrc);
});

test("promotes @mentions of agents with a session in the stream into mention chips", async () => {
	const adapter = await loadAdapter();
	const [comment] = adapter.mapActivityEventsToJiraEntries([
		{
			id: "comment-orchestration",
			kind: "human",
			author: { name: "Venn" },
			content: "@Code Planner lead the plan, and @Unit Test Creator prove it.",
			createdAtMs: Date.UTC(2026, 4, 12, 9),
		},
		{
			id: "activity-planner",
			kind: "agent",
			sessionId: "session-planner",
			agentId: "code-planner",
			agentName: "Code Planner",
			agentAvatarSrc: "/planner.png",
			status: "running",
			title: "Plan",
			branch: "rovo/plan",
			elapsedSeconds: 10,
			commandPreview: "Plan",
			createdAtMs: Date.UTC(2026, 4, 12, 9, 1),
		},
		{
			id: "activity-tests",
			kind: "agent",
			sessionId: "session-tests",
			agentId: "unit-test-creator",
			agentName: "Unit Test Creator",
			agentAvatarSrc: "/tests.png",
			status: "running",
			title: "Test",
			branch: "rovo/test",
			elapsedSeconds: 10,
			commandPreview: "Test",
			createdAtMs: Date.UTC(2026, 4, 12, 9, 2),
		},
	]);

	assert.deepEqual(comment.body, [
		{ type: "agent-mention", text: "Code Planner", avatarSrc: "/planner.png" },
		{ type: "text", text: " lead the plan, and " },
		{ type: "agent-mention", text: "Unit Test Creator", avatarSrc: "/tests.png" },
		{ type: "text", text: " prove it." },
	]);
});

test("leaves @text with no matching agent session as plain comment copy", async () => {
	const adapter = await loadAdapter();
	const [comment] = adapter.mapActivityEventsToJiraEntries([
		{
			id: "comment-unmatched",
			kind: "human",
			author: { name: "Venn" },
			content: "Email @support and ping @Code Planners about the retry.",
			createdAtMs: Date.UTC(2026, 4, 12, 9),
		},
		{
			id: "activity-planner",
			kind: "agent",
			sessionId: "session-planner",
			agentId: "code-planner",
			agentName: "Code Planner",
			agentAvatarSrc: "/planner.png",
			status: "running",
			title: "Plan",
			branch: "rovo/plan",
			elapsedSeconds: 10,
			commandPreview: "Plan",
			createdAtMs: Date.UTC(2026, 4, 12, 9, 1),
		},
	]);

	assert.deepEqual(comment.body, [
		{ type: "text", text: "Email @support and ping @Code Planners about the retry." },
	]);
});

test("keeps delegated agents mentionable after their sessions fold into the lead thread", async () => {
	const adapter = await loadAdapter();
	const events = [
		{
			id: "comment-orchestration",
			kind: "human",
			author: { name: "Venn" },
			content: "@Code Planner lead, @GitHub Copilot build, @Unit Test Creator verify.",
			createdAtMs: Date.UTC(2026, 4, 12, 9),
		},
		{
			id: "activity-planner",
			kind: "agent",
			sessionId: "session-planner",
			agentId: "code-planner",
			agentName: "Code Planner",
			agentAvatarSrc: "/planner.png",
			status: "running",
			title: "Plan",
			branch: "rovo/plan",
			elapsedSeconds: 10,
			commandPreview: "Plan",
			createdAtMs: Date.UTC(2026, 4, 12, 9, 1),
		},
		{
			id: "activity-copilot",
			kind: "agent",
			sessionId: "session-copilot",
			agentId: "github-copilot",
			agentName: "GitHub Copilot",
			agentAvatarSrc: "/copilot.png",
			status: "running",
			title: "Build",
			branch: "rovo/build",
			elapsedSeconds: 10,
			commandPreview: "Build",
			responsePreview: "Building the service.",
			createdAtMs: Date.UTC(2026, 4, 12, 9, 2),
		},
		{
			id: "activity-tests",
			kind: "agent",
			sessionId: "session-tests",
			agentId: "unit-test-creator",
			agentName: "Unit Test Creator",
			agentAvatarSrc: "/tests.png",
			status: "running",
			title: "Verify",
			branch: "rovo/verify",
			elapsedSeconds: 10,
			commandPreview: "Verify",
			responsePreview: "Writing acceptance cases.",
			createdAtMs: Date.UTC(2026, 4, 12, 9, 3),
		},
	];

	// The delegated sessions no longer exist as standalone agent events here.
	const composed = adapter.composeActivitySessionThread(events, {
		parentSessionId: "session-planner",
		childSessionIds: ["session-copilot", "session-tests"],
		visibleSessionIds: ["session-planner", "session-copilot", "session-tests"],
	});
	const [comment] = adapter.mapActivityEventsToJiraEntries(composed);

	assert.deepEqual(
		comment.body.filter((segment) => segment.type === "agent-mention"),
		[
			{ type: "agent-mention", text: "Code Planner", avatarSrc: "/planner.png" },
			{ type: "agent-mention", text: "GitHub Copilot", avatarSrc: "/copilot.png" },
			{ type: "agent-mention", text: "Unit Test Creator", avatarSrc: "/tests.png" },
		],
	);
});
