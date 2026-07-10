"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { EventEmitter } = require("node:events");

const {
	TwgAuthError,
	TwgNotFoundError,
	buildAutomationWorkflowExplorer,
	buildTwgExplorer,
	expandTwgExplorerNode,
	fetchSlice,
	getTwgContextArgsForNode,
	mergeTwgExplorers,
	normalizeContextResponse,
} = require("./personal-graph-twg-source");

const FIXTURE = JSON.parse(
	fs.readFileSync(path.join(__dirname, "__fixtures__", "twg-context-user.json"), "utf8"),
);

function createFakeChild({ stdout = "", stderr = "", code = 0, error = null, throwOnSpawn = null } = {}) {
	const spawnImpl = () => {
		if (throwOnSpawn) {
			throw throwOnSpawn;
		}
		const child = new EventEmitter();
		child.stdout = new EventEmitter();
		child.stderr = new EventEmitter();
		queueMicrotask(() => {
			if (error) {
				child.emit("error", error);
				return;
			}
			if (stdout) child.stdout.emit("data", Buffer.from(stdout));
			if (stderr) child.stderr.emit("data", Buffer.from(stderr));
			child.emit("close", code);
		});
		return child;
	};
	return spawnImpl;
}

function createContextPayload(root, relationships = []) {
	return {
		data: {
			object: root,
			relationshipSummary: relationships,
		},
	};
}

function createSpawnImplForPayloads(payloads, calls = []) {
	return (_bin, args) => {
		calls.push(args);
		const payload = payloads.shift();
		const child = new EventEmitter();
		child.stdout = new EventEmitter();
		child.stderr = new EventEmitter();
		queueMicrotask(() => {
			child.stdout.emit("data", Buffer.from(JSON.stringify(payload)));
			child.emit("close", 0);
		});
		return child;
	};
}

function createSpawnImplForArgs(resolvePayload, calls = []) {
	return (_bin, args) => {
		calls.push(args);
		const payload = resolvePayload(args);
		const child = new EventEmitter();
		child.stdout = new EventEmitter();
		child.stderr = new EventEmitter();
		queueMicrotask(() => {
			child.stdout.emit("data", Buffer.from(JSON.stringify(payload)));
			child.emit("close", 0);
		});
		return child;
	};
}

function createSpawnImplForStdout(resolveStdout, calls = []) {
	return (_bin, args) => {
		calls.push(args);
		const stdout = resolveStdout(args);
		const child = new EventEmitter();
		child.stdout = new EventEmitter();
		child.stderr = new EventEmitter();
		queueMicrotask(() => {
			child.stdout.emit("data", Buffer.from(stdout));
			child.emit("close", 0);
		});
		return child;
	};
}

const ROOT_USER = {
	ari: "ari:cloud:identity::user/me",
	name: "Me",
	type: "AtlassianAccountUser",
};

const PAGE_ONE = {
	ari: "ari:cloud:confluence:site:page/1",
	type: "ConfluencePage",
};

const PAGE_TWO = {
	ari: "ari:cloud:confluence:site:page/2",
	type: "ConfluencePage",
};

const BLOG_ONE = {
	ari: "ari:cloud:confluence:site:blogpost/3",
	type: "ConfluenceBlogPost",
};

const ISSUE_ONE = {
	ari: "ari:cloud:jira:site:issue/4",
	type: "JiraIssue",
};

const WHITEBOARD_ONE = {
	ari: "ari:cloud:confluence:site:whiteboard/5",
	type: "ConfluenceWhiteboard",
};

const LOOM_ONE = {
	ari: "ari:cloud:loom:site:video/6",
	type: "LoomVideo",
};

const AUTOMATION_WORK_PAYLOAD = {
	data: {
		comments: [
			{
				content: "Prototype link: https://vpk-studio.example.test",
				id: "comment-prototype",
				url: "https://loom.example.test/comment",
			},
		],
		devActivity: [
			{
				displayName: "d36f040",
				id: "commit-review",
				message: "Address PR review feedback",
				url: "https://bitbucket.example.test/commit",
			},
		],
		pages: [
			{
				id: "page-feedback",
				title: "Agent builder feedback and themes",
				webUrl: "https://hello.example.test/feedback",
			},
			{
				id: "page-weekly",
				title: "Rovo Chat Triad [Recurring]",
				webUrl: "https://hello.example.test/triad",
			},
		],
		projects: [
			{
				key: "ATLAS-1",
				name: "Agents creation experience vision",
				url: "https://home.example.test/project",
			},
		],
		videos: [
			{
				id: "loom-agent-builder",
				name: "Agent builder — 5 Jun",
				url: "https://loom.example.test/agent-builder",
			},
			{
				id: "loom-custom-skills",
				name: "Custom skills — 25 June",
				url: "https://loom.example.test/custom-skills",
			},
		],
	},
};

const AUTOMATION_CONTEXT_PAYLOAD = createContextPayload(ROOT_USER, [
	{
		direction: "outbound",
		relationshipName: "atlassian_user_created_loom_video",
		targets: [
			{
				ari: "ari:cloud:loom:site:video/agent-builder",
				name: "Creating AI Agents in Studio, End to End",
				url: "https://loom.example.test/end-to-end",
			},
		],
	},
	{
		direction: "outbound",
		relationshipName: "atlassian_user_invited_to_loom_meeting",
		targets: [
			{
				ari: "ari:cloud:loom:site:meeting/weekly",
				name: "Rovo Agents Leads",
				url: "https://loom.example.test/meeting",
			},
		],
	},
]);

test("normalizeContextResponse builds root + targets from fixture", () => {
	const explorer = normalizeContextResponse(FIXTURE);
	assert.ok(explorer.nodes.length > 1, "should produce more than just the root node");
	const root = explorer.nodes.find((node) => node.kind === "entity");
	assert.ok(root, "root entity present");
	assert.equal(root.provider, "twg");
	assert.equal(root.externalUrl, null);
	assert.match(root.id, /^ari:cloud:identity::user\//u);

	const allTwg = explorer.nodes.every((node) => node.provider === "twg");
	assert.ok(allTwg, "every node has provider=twg");

	const someEdges = explorer.edges.length > 0;
	assert.ok(someEdges, "produces edges");
	const edgeKinds = new Set(explorer.edges.map((edge) => edge.kind));
	for (const kind of edgeKinds) {
		assert.ok(
			["worked-on", "mentioned-in", "viewed", "attended", "reports-to", "aligned-to", "member-of", "reviewed", "related"].includes(kind),
			`edge kind ${kind} is in the widened union`,
		);
	}
});

test("getTwgContextArgsForNode routes supported TWG entity types", () => {
	assert.deepEqual(getTwgContextArgsForNode({ id: ROOT_USER.ari, frontmatter: { type: "AtlassianAccountUser" } }), [
		"context",
		"user",
		ROOT_USER.ari,
	]);
	assert.deepEqual(getTwgContextArgsForNode({ id: ISSUE_ONE.ari, frontmatter: { type: "JiraIssue" } }), [
		"context",
		"jira",
		"workitem",
		ISSUE_ONE.ari,
	]);
	assert.deepEqual(getTwgContextArgsForNode({ id: "ari:cloud:jira:site:workitem/7", frontmatter: { type: "JiraWorkItem" } }), [
		"context",
		"jira",
		"workitem",
		"ari:cloud:jira:site:workitem/7",
	]);
	assert.deepEqual(getTwgContextArgsForNode({ id: PAGE_ONE.ari, frontmatter: { type: "ConfluencePage" } }), [
		"context",
		"confluence",
		"page",
		PAGE_ONE.ari,
	]);
	assert.deepEqual(getTwgContextArgsForNode({ id: BLOG_ONE.ari, frontmatter: { type: "ConfluenceBlogPost" } }), [
		"context",
		"confluence",
		"blogpost",
		BLOG_ONE.ari,
	]);
	assert.deepEqual(getTwgContextArgsForNode({ id: WHITEBOARD_ONE.ari, frontmatter: { type: "ConfluenceWhiteboard" } }), [
		"context",
		"confluence",
		"whiteboard",
		WHITEBOARD_ONE.ari,
	]);
	assert.equal(getTwgContextArgsForNode({ id: LOOM_ONE.ari, frontmatter: { type: "LoomVideo" } }), null);
});

test("normalizeContextResponse handles non-user roots and generic relationship labels", () => {
	const explorer = normalizeContextResponse(createContextPayload(PAGE_ONE, [
		{
			direction: "outbound",
			relationshipName: "confluence_page_mentioned_jira_work_item",
			targets: [{ ...ISSUE_ONE, name: "JRA-1 Expand Graph" }],
		},
	]));

	const root = explorer.nodes.find((node) => node.id === PAGE_ONE.ari);
	assert.equal(root.kind, "source");
	assert.equal(root.title, "Confluence Page 1");
	const edge = explorer.edges[0];
	assert.equal(edge.source, PAGE_ONE.ari);
	assert.equal(edge.target, ISSUE_ONE.ari);
	assert.equal(edge.kind, "mentioned-in");
	assert.equal(edge.label, "confluence page mentioned jira work item");
});

test("normalizeContextResponse keeps externalUrl when target has url, null otherwise", () => {
	const explorer = normalizeContextResponse(FIXTURE);
	const withUrl = explorer.nodes.filter((node) => node.externalUrl);
	const withoutUrl = explorer.nodes.filter((node) => !node.externalUrl);
	assert.ok(withUrl.length > 0, "some nodes have external URLs");
	assert.ok(withoutUrl.length > 0, "some nodes have no URL (Confluence pages without hydration)");
	for (const node of withUrl) {
		assert.match(node.externalUrl, /^https?:\/\//u, "externalUrl is a real URL when set");
	}
});

test("normalizeContextResponse keeps unmapped relationship names as related edges", () => {
	const consoleWarn = console.warn;
	const warnings = [];
	console.warn = (...args) => warnings.push(args.join(" "));
	try {
		const payload = {
			data: {
				object: { ari: "ari:cloud:identity::user/me", type: "AtlassianAccountUser", name: "Me" },
				relationshipSummary: [
					{
						relationshipName: "atlassian_user_does_a_brand_new_thing",
						count: 1,
						targets: [{ ari: "ari:cloud:foo::thing/123", type: "Thing" }],
					},
					{
						relationshipName: "atlassian_user_viewed_confluence_page",
						count: 1,
						targets: [{ ari: "ari:cloud:confluence:c1:page/1", type: "ConfluencePage" }],
					},
				],
			},
		};
		const explorer = normalizeContextResponse(payload);
		assert.equal(explorer.nodes.length, 3, "root + mapped and generic targets remain");
		assert.equal(explorer.edges.length, 2, "mapped and generic edges remain");
		const genericEdge = explorer.edges.find((edge) => edge.kind === "related");
		assert.equal(genericEdge.label, "does a brand new thing");
		assert.equal(genericEdge.metadata.relationship, "atlassian_user_does_a_brand_new_thing");
		assert.equal(warnings.length, 0);
		assert.ok(!warnings.some((w) => w.includes("atlassian_user_viewed_confluence_page")));
	} finally {
		console.warn = consoleWarn;
	}
});

test("normalizeContextResponse handles empty relationships → root only", () => {
	const explorer = normalizeContextResponse({
		data: {
			object: { ari: "ari:cloud:identity::user/me", type: "AtlassianAccountUser", name: "Me" },
			relationshipSummary: [],
		},
	});
	assert.equal(explorer.nodes.length, 1);
	assert.equal(explorer.edges.length, 0);
	assert.equal(explorer.stats.nodeCount, 1);
});

test("buildAutomationWorkflowExplorer creates a curated workflow dendrogram", () => {
	const explorer = buildAutomationWorkflowExplorer({
		contextPayload: AUTOMATION_CONTEXT_PAYLOAD,
		generatedAt: "2026-06-30T00:00:00.000Z",
		since: "30d",
		workPayload: AUTOMATION_WORK_PAYLOAD,
	});
	const root = explorer.nodes.find((node) => node.id === "personal-graph:automation:root");
	const workflowNodes = explorer.nodes.filter((node) => node.frontmatter?.type === "AutomationWorkflowCandidate");
	const actionNodes = explorer.nodes.filter((node) => node.frontmatter?.type === "AutomationDraftAction");
	const evidenceNodes = explorer.nodes.filter((node) => node.frontmatter?.type === "AutomationWorkflowEvidence");

	assert.equal(root.title, "Repeated manual workflows");
	assert.equal(root.kind, "synthesis");
	assert.equal(root.frontmatter.since, "30d");
	assert.equal(workflowNodes.length, 4);
	assert.equal(actionNodes.length, 4);
	assert.ok(evidenceNodes.length >= 4, "each workflow has at least one evidence node");
	assert.ok(evidenceNodes.some((node) => node.kind === "source"), "live TWG evidence uses source nodes");
	assert.ok(explorer.nodes.every((node) => node.provider === "twg"));
	assert.ok(explorer.edges.every((edge) => edge.kind === "related"));
	assert.ok(explorer.edges.some((edge) =>
		edge.source === "personal-graph:automation:root" &&
		edge.target === "personal-graph:automation:workflow:loom-shareback-distribution"
	));
	assert.ok(explorer.edges.some((edge) =>
		edge.source === "personal-graph:automation:workflow:loom-shareback-distribution" &&
		edge.target === "personal-graph:automation:action:loom-shareback-distribution"
	));

	const loomWorkflow = explorer.nodes.find((node) => node.id === "personal-graph:automation:workflow:loom-shareback-distribution");
	const loomAction = explorer.nodes.find((node) => node.id === "personal-graph:automation:action:loom-shareback-distribution");
	const reviewEvidence = explorer.nodes.find((node) => node.title === "Address PR review feedback");
	assert.equal(loomWorkflow.kind, "synthesis");
	assert.equal(loomWorkflow.title, "Loom shareback distribution");
	assert.equal(loomWorkflow.frontmatter.confidence, "high");
	assert.equal(loomAction.kind, "concept");
	assert.equal(loomAction.title, "Draft Loom shareback pack");
	assert.equal(reviewEvidence.kind, "source");
	assert.equal(reviewEvidence.externalUrl, "https://bitbucket.example.test/commit");
	assert.equal(explorer.generatedAt, "2026-06-30T00:00:00.000Z");
	assert.equal(explorer.stats.nodeCount, explorer.nodes.length);
	assert.equal(explorer.stats.edgeCount, explorer.edges.length);
});

test("buildAutomationWorkflowExplorer returns fallback workflow nodes for sparse TWG data", () => {
	const explorer = buildAutomationWorkflowExplorer({
		contextPayload: createContextPayload(ROOT_USER, []),
		generatedAt: "2026-06-30T00:00:00.000Z",
		since: "30d",
		workPayload: { data: {} },
	});
	const workflowNodes = explorer.nodes.filter((node) => node.frontmatter?.type === "AutomationWorkflowCandidate");
	const actionNodes = explorer.nodes.filter((node) => node.frontmatter?.type === "AutomationDraftAction");
	const evidenceNodes = explorer.nodes.filter((node) => node.frontmatter?.type === "AutomationWorkflowEvidence");

	assert.equal(explorer.nodes.some((node) => node.id === "personal-graph:automation:root"), true);
	assert.equal(workflowNodes.length, 4);
	assert.equal(actionNodes.length, 4);
	assert.equal(evidenceNodes.length, 4);
	assert.equal(evidenceNodes.every((node) => node.title === "More evidence needed"), true);
	assert.equal(evidenceNodes.every((node) => node.kind === "source"), true);
	assert.equal(explorer.edges.length, 12);
});

test("normalizeContextResponse throws on missing root object", () => {
	assert.throws(() => normalizeContextResponse({ data: {} }), /missing `data.object.ari`/u);
	assert.throws(() => normalizeContextResponse(null), /no JSON payload/u);
});

test("mergeTwgExplorers de-dupes edges and keeps better target hydration", () => {
	const base = normalizeContextResponse(createContextPayload(ROOT_USER, [
		{
			direction: "outbound",
			relationshipName: "atlassian_user_viewed_confluence_page",
			targets: [PAGE_ONE],
		},
	]));
	const expansion = normalizeContextResponse(createContextPayload(ROOT_USER, [
		{
			direction: "outbound",
			relationshipName: "atlassian_user_viewed_confluence_page",
			targets: [{ ...PAGE_ONE, name: "Roadmap", url: "https://example.atlassian.net/wiki/spaces/ROAD" }],
		},
	]));

	const merged = mergeTwgExplorers(base, expansion);
	const hydratedPage = merged.nodes.find((node) => node.id === PAGE_ONE.ari);

	assert.equal(merged.nodes.length, 2);
	assert.equal(merged.edges.length, 1);
	assert.equal(hydratedPage.title, "Roadmap");
	assert.equal(hydratedPage.externalUrl, "https://example.atlassian.net/wiki/spaces/ROAD");
	assert.equal(hydratedPage.connectionCount, 1);
	assert.equal(merged.stats.nodeCount, 2);
	assert.equal(merged.stats.edgeCount, 1);
});

test("buildTwgExplorer wires CLI output through normalize", async () => {
	const stdout = JSON.stringify(FIXTURE);
	const spawnImpl = createFakeChild({ stdout });
	const explorer = await buildTwgExplorer({ hydrateArtifactTitles: false, spawnImpl });
	assert.ok(explorer.nodes.length > 1);
	assert.equal(explorer.nodes[0].provider, "twg");
});

test("fetchSlice automation-workflows queries work and context TWG summaries", async () => {
	const calls = [];
	const spawnImpl = createSpawnImplForArgs((args) => {
		if (args[0] === "work") return AUTOMATION_WORK_PAYLOAD;
		if (args[0] === "context") return AUTOMATION_CONTEXT_PAYLOAD;
		throw new Error(`Unexpected fake twg call: ${args.join(" ")}`);
	}, calls);

	const explorer = await fetchSlice("automation-workflows", { since: "30d" }, { spawnImpl });

	assert.ok(explorer.nodes.some((node) => node.id === "personal-graph:automation:workflow:weekly-recurring-synthesis"));
	assert.ok(calls.some((args) => args.join(" ") === "work query --since 30d --include-viewed --hydrate summary --output json"));
	assert.ok(calls.some((args) => args.join(" ") === "context user me --output json --since 30d --detail summary"));
	assert.equal(calls.length, 2);
});

test("fetchSlice automation-workflows reads TWG agent envelope output files", async (t) => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "personal-graph-twg-envelope-"));
	t.after(() => fs.rmSync(tempDir, { recursive: true, force: true }));
	const workOutputPath = path.join(tempDir, "work.json");
	const contextOutputPath = path.join(tempDir, "context.json");
	fs.writeFileSync(workOutputPath, JSON.stringify(AUTOMATION_WORK_PAYLOAD), "utf8");
	fs.writeFileSync(contextOutputPath, JSON.stringify(AUTOMATION_CONTEXT_PAYLOAD), "utf8");
	const calls = [];
	const spawnImpl = createSpawnImplForStdout((args) => {
		const outputPath = args[0] === "work" ? workOutputPath : contextOutputPath;
		return [
			"output_files:",
			`  stdout: "${outputPath}"`,
			"command: \"projection\"",
			"agent_output:",
			"  summary: \"stats\"",
			"---END---",
		].join("\n");
	}, calls);

	const explorer = await fetchSlice("automation-workflows", { since: "30d" }, { spawnImpl });

	assert.equal(calls.length, 2);
	assert.ok(explorer.nodes.some((node) => node.id === "personal-graph:automation:root"));
	assert.ok(explorer.nodes.some((node) => node.title === "Weekly recurring synthesis"));
});

test("fetchSlice automation-workflows accepts TWG JSON with trailing CLI framing", async () => {
	const calls = [];
	const spawnImpl = createSpawnImplForStdout((args) => {
		const payload = args[0] === "work" ? AUTOMATION_WORK_PAYLOAD : AUTOMATION_CONTEXT_PAYLOAD;
		return `${JSON.stringify(payload)}\ncommand: "projection"\n---END---`;
	}, calls);

	const explorer = await fetchSlice("automation-workflows", { since: "30d" }, { spawnImpl });

	assert.equal(calls.length, 2);
	assert.ok(explorer.nodes.some((node) => node.id === "personal-graph:automation:root"));
	assert.ok(explorer.nodes.some((node) => node.title === "Agent builder feedback synthesis"));
});

test("fetchSlice automation-workflows falls back when one TWG source is malformed", async () => {
	const calls = [];
	const spawnImpl = (_bin, args) => {
		calls.push(args);
		return createFakeChild({
			stdout: args[0] === "work" ? JSON.stringify(AUTOMATION_WORK_PAYLOAD) : "{\"apiVersion\":\"v2\",",
		})();
	};

	const explorer = await fetchSlice("automation-workflows", { since: "30d" }, { spawnImpl });

	assert.equal(calls.length, 2);
	assert.ok(explorer.nodes.some((node) => node.id === "personal-graph:automation:root"));
	assert.ok(explorer.nodes.some((node) => node.title === "Loom shareback distribution"));
	assert.ok(explorer.nodes.some((node) => node.title === "Rovo Chat Triad [Recurring]"));
});

test("buildTwgExplorer hydrates Confluence artifact titles from native get commands", async () => {
	const rootPayload = createContextPayload(ROOT_USER, [
		{
			direction: "outbound",
			relationshipName: "atlassian_user_contributed_to_confluence_page",
			targets: [PAGE_ONE],
		},
		{
			direction: "outbound",
			relationshipName: "atlassian_user_contributed_to_confluence_blogpost",
			targets: [BLOG_ONE],
		},
		{
			direction: "outbound",
			relationshipName: "atlassian_user_contributed_to_confluence_whiteboard",
			targets: [WHITEBOARD_ONE],
		},
	]);
	const calls = [];
	const spawnImpl = createSpawnImplForArgs((args) => {
		if (args[0] === "context") return rootPayload;
		if (args[1] === "page") {
			return {
				data: {
					id: PAGE_ONE.ari,
					links: { base: "https://hello.atlassian.net/wiki", webUi: "/spaces/ENG/pages/1/Roadmap" },
					title: "Roadmap",
				},
			};
		}
		if (args[1] === "blog") {
			return {
				data: {
					_links: { base: "https://hello.atlassian.net/wiki", webui: "/spaces/ENG/blog/3/Launch" },
					id: "3",
					title: "Launch update",
				},
			};
		}
		if (args[1] === "whiteboard") {
			return {
				data: {
					id: "5",
					title: "System sketch",
					webUrl: "https://hello.atlassian.net/wiki/spaces/ENG/whiteboard/5",
				},
			};
		}
		throw new Error(`Unexpected fake twg call: ${args.join(" ")}`);
	}, calls);

	const explorer = await buildTwgExplorer({ depth: 1, spawnImpl });
	const page = explorer.nodes.find((node) => node.id === PAGE_ONE.ari);
	const blog = explorer.nodes.find((node) => node.id === BLOG_ONE.ari);
	const whiteboard = explorer.nodes.find((node) => node.id === WHITEBOARD_ONE.ari);

	assert.equal(page.title, "Roadmap");
	assert.equal(page.label, "Roadmap");
	assert.equal(page.externalUrl, "https://hello.atlassian.net/wiki/spaces/ENG/pages/1/Roadmap");
	assert.equal(blog.title, "Launch update");
	assert.equal(blog.externalUrl, "https://hello.atlassian.net/wiki/spaces/ENG/blog/3/Launch");
	assert.equal(whiteboard.title, "System sketch");
	assert.equal(whiteboard.externalUrl, "https://hello.atlassian.net/wiki/spaces/ENG/whiteboard/5");
	assert.ok(calls.some((args) => args.join(" ") === `confluence page get --page 1 --site site --body none --comments none --skip-ancestors --output json`));
	assert.ok(calls.some((args) => args.join(" ") === `confluence blog get 3 --site site --output json`));
	assert.ok(calls.some((args) => args.join(" ") === `confluence whiteboard get 5 --site site --output json`));
});

test("buildTwgExplorer expands a bounded depth-2 TWG explorer", async () => {
	const rootPayload = createContextPayload(ROOT_USER, [
		{
			direction: "outbound",
			relationshipName: "atlassian_user_viewed_confluence_page",
			targets: [PAGE_ONE, ISSUE_ONE, BLOG_ONE, LOOM_ONE],
		},
	]);
	const pageExpansion = createContextPayload({ ...PAGE_ONE, name: "Hydrated Page" }, [
		{
			direction: "outbound",
			relationshipName: "confluence_page_mentioned_jira_work_item",
			targets: [{ ...PAGE_TWO, name: "Sibling Page" }],
		},
	]);
	const issueExpansion = createContextPayload({ ...ISSUE_ONE, name: "JRA-4" }, [
		{
			direction: "outbound",
			relationshipName: "jira_work_item_aligned_to_confluence_page",
			targets: [WHITEBOARD_ONE],
		},
	]);
	const calls = [];
	const spawnImpl = createSpawnImplForPayloads([rootPayload, pageExpansion, issueExpansion], calls);

	const explorer = await buildTwgExplorer({ fanoutLimit: 2, hydrateArtifactTitles: false, spawnImpl });

	assert.equal(calls.length, 3);
	assert.deepEqual(calls[0].slice(0, 3), ["context", "user", "me"]);
	assert.deepEqual(calls[1].slice(0, 4), ["context", "confluence", "page", PAGE_ONE.ari]);
	assert.deepEqual(calls[2].slice(0, 4), ["context", "jira", "workitem", ISSUE_ONE.ari]);
	assert.ok(explorer.nodes.some((node) => node.title === "Hydrated Page"));
	assert.ok(explorer.nodes.some((node) => node.id === PAGE_TWO.ari));
	assert.ok(explorer.nodes.some((node) => node.id === WHITEBOARD_ONE.ari));
	assert.equal(explorer.nodes.some((node) => node.id === BLOG_ONE.ari), true, "unexpanded fanout node remains in root graph");
});

test("buildTwgExplorer throws on non-zero exit with stderr captured", async () => {
	const spawnImpl = createFakeChild({ stdout: "", stderr: "boom went the dynamite", code: 1 });
	await assert.rejects(buildTwgExplorer({ spawnImpl }), /exited 1: boom went the dynamite/u);
});

test("buildTwgExplorer maps auth-related stderr to TwgAuthError", async () => {
	const spawnImpl = createFakeChild({ stderr: "error: not authenticated; please run twg login", code: 1 });
	await assert.rejects(buildTwgExplorer({ spawnImpl }), TwgAuthError);
});

test("buildTwgExplorer maps ENOENT on spawn to TwgNotFoundError", async () => {
	const enoent = Object.assign(new Error("spawn twg ENOENT"), { code: "ENOENT" });
	const spawnImpl = createFakeChild({ error: enoent });
	await assert.rejects(buildTwgExplorer({ spawnImpl }), TwgNotFoundError);
});

test("buildTwgExplorer rejects with malformed-JSON message including snippet", async () => {
	const spawnImpl = createFakeChild({ stdout: "<html>oops not json</html>", code: 0 });
	await assert.rejects(buildTwgExplorer({ spawnImpl }), /malformed JSON: <html>oops not json<\/html>/u);
});

test("buildTwgExplorer respects an aborted signal", async () => {
	const controller = new AbortController();
	let spawnedSignal = null;
	const spawnImpl = (_bin, _args, options) => {
		spawnedSignal = options?.signal ?? null;
		const child = new EventEmitter();
		child.stdout = new EventEmitter();
		child.stderr = new EventEmitter();
		options?.signal?.addEventListener("abort", () => {
			child.emit("error", Object.assign(new Error("aborted"), { name: "AbortError" }));
		});
		return child;
	};
	const promise = buildTwgExplorer({ spawnImpl, signal: controller.signal });
	controller.abort();
	await assert.rejects(promise, /aborted/u);
	assert.equal(spawnedSignal, controller.signal, "signal forwarded to spawn");
});

test("buildTwgExplorer rejects when aborted during artifact title hydration", async () => {
	const controller = new AbortController();
	const rootPayload = createContextPayload(ROOT_USER, [
		{
			direction: "outbound",
			relationshipName: "atlassian_user_contributed_to_confluence_page",
			targets: [PAGE_ONE],
		},
	]);
	let hydrationSpawned = false;
	const spawnImpl = (_bin, args, options = {}) => {
		const child = new EventEmitter();
		child.stdout = new EventEmitter();
		child.stderr = new EventEmitter();
		if (args[0] === "context") {
			queueMicrotask(() => {
				child.stdout.emit("data", Buffer.from(JSON.stringify(rootPayload)));
				child.emit("close", 0);
			});
			return child;
		}

		hydrationSpawned = true;
		options.signal?.addEventListener("abort", () => {
			child.emit("error", Object.assign(new Error("aborted during hydration"), { name: "AbortError" }));
		});
		queueMicrotask(() => controller.abort(new Error("request aborted")));
		return child;
	};

	await assert.rejects(
		buildTwgExplorer({ depth: 1, signal: controller.signal, spawnImpl }),
		/request aborted/u,
	);
	assert.equal(hydrationSpawned, true);
});

test("expandTwgExplorerNode merges a selected supported node expansion", async () => {
	const explorer = normalizeContextResponse(createContextPayload(ROOT_USER, [
		{
			direction: "outbound",
			relationshipName: "atlassian_user_contributed_to_confluence_page",
			targets: [PAGE_ONE],
		},
	]));
	const expansionPayload = createContextPayload({ ...PAGE_ONE, name: "Hydrated Page" }, [
		{
			direction: "outbound",
			relationshipName: "confluence_page_mentioned_jira_work_item",
			targets: [ISSUE_ONE],
		},
	]);
	const calls = [];
	const spawnImpl = createSpawnImplForPayloads([expansionPayload], calls);

	const result = await expandTwgExplorerNode({
		explorer,
		nodeId: PAGE_ONE.ari,
		spawnImpl,
	});

	assert.deepEqual(calls[0].slice(0, 4), ["context", "confluence", "page", PAGE_ONE.ari]);
	assert.equal(result.expandedNodeId, PAGE_ONE.ari);
	assert.equal(result.addedNodeCount, 1);
	assert.equal(result.addedEdgeCount, 1);
	assert.ok(result.explorer.nodes.some((node) => node.id === ISSUE_ONE.ari));
	assert.equal(result.explorer.nodes.find((node) => node.id === PAGE_ONE.ari).title, "Hydrated Page");
});

test("expandTwgExplorerNode is a no-op for unsupported node types", async () => {
	const explorer = normalizeContextResponse(createContextPayload(ROOT_USER, [
		{
			direction: "outbound",
			relationshipName: "atlassian_user_viewed_loom_video",
			targets: [LOOM_ONE],
		},
	]));
	const result = await expandTwgExplorerNode({
		explorer,
		nodeId: LOOM_ONE.ari,
		spawnImpl: () => {
			throw new Error("unsupported nodes should not spawn twg");
		},
	});

	assert.equal(result.expandedNodeId, LOOM_ONE.ari);
	assert.equal(result.addedNodeCount, 0);
	assert.equal(result.addedEdgeCount, 0);
	assert.equal(result.explorer, explorer);
});

test("expandTwgExplorerNode rejects missing cached nodes", async () => {
	const explorer = normalizeContextResponse(createContextPayload(ROOT_USER, []));
	await assert.rejects(
		expandTwgExplorerNode({ explorer, nodeId: PAGE_ONE.ari }),
		(error) => error?.code === "NODE_NOT_FOUND",
	);
});

test("fetchSlice('context-user') is an alias of buildTwgExplorer", async () => {
	const stdout = JSON.stringify(FIXTURE);
	const spawnImpl = createFakeChild({ stdout });
	const explorer = await fetchSlice("context-user", {}, { hydrateArtifactTitles: false, spawnImpl });
	assert.ok(explorer.nodes.length > 1);
});

test("fetchSlice rejects unknown slice names", async () => {
	await assert.rejects(fetchSlice("does-not-exist"), /Unknown TWG slice/u);
});
