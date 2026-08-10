const assert = require("node:assert/strict");
const { join } = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(process.cwd() + "/scripts/lib/esbuild-cjs-loader.js");

const MODULE_PATH = join(__dirname, "pull-request-activity-adapter.ts");

let adapterPromise;
function loadAdapter() {
	if (!adapterPromise) {
		adapterPromise = esbuild
			.build({
				entryPoints: [MODULE_PATH],
				bundle: true,
				format: "cjs",
				platform: "node",
				loader: { ".css": "empty" },
				tsconfig: join(process.cwd(), "tsconfig.json"),
				write: false,
			})
			.then((result) => loadCjsModuleFromText(
				result.outputFiles[0].text,
				"pull-request-activity-adapter-harness.cjs",
			));
	}
	return adapterPromise;
}

const VENN = { id: "venn", name: "Venn", kind: "person" };
const GITHUB = { id: "github", name: "GitHub", kind: "app" };

test("adapts provider-neutral activity oldest first without mutating its input", async () => {
	const { adaptPullRequestActivity } = await loadAdapter();
	const activity = [
		{
			id: "ready",
			kind: "ready-to-merge",
			actor: GITHUB,
			occurredAtMs: 300,
			timestamp: "now",
		},
		{
			id: "opened",
			kind: "opened",
			actor: VENN,
			occurredAtMs: 100,
			timestamp: "earlier",
			baseBranch: "main",
			headBranch: "feature/checkout",
		},
		{
			id: "checks",
			kind: "checks-completed",
			actor: GITHUB,
			occurredAtMs: 200,
			timestamp: "later",
			passed: 18,
			total: 18,
		},
	];

	const entries = adaptPullRequestActivity(activity);

	assert.deepEqual(entries.map(({ id }) => id), [
		"pull-request-opened",
		"pull-request-checks",
		"pull-request-ready",
	]);
	assert.deepEqual(activity.map(({ id }) => id), ["ready", "opened", "checks"]);
	assert.equal(entries[1].actor.brandName, "github");
	assert.deepEqual(entries[1].segments.at(-1), {
		type: "lozenge",
		text: "18/18 passed",
		variant: "success",
	});
});

test("moves review discussion into read-only Jira Activity comments", async () => {
	const { adaptPullRequestActivity } = await loadAdapter();
	const [entry] = adaptPullRequestActivity([{
		id: "review",
		kind: "review-submitted",
		actor: {
			id: "code-planner",
			name: "Code Planner",
			kind: "agent",
			avatarSrc: "/avatar-agent/dev-agents/code-planner.svg",
		},
		occurredAtMs: 100,
		timestamp: "6 minutes ago",
		decision: "approved",
		body: "Order creation stays server-owned.",
		filePath: "backend/services/guest-order-service.js",
	}]);

	assert.equal(entry.kind, "comment");
	assert.equal(entry.allowReply, false);
	assert.deepEqual(entry.tag, { text: "Approved", color: "green" });
	assert.deepEqual(entry.body, [
		{ type: "text", text: "approved this pull request. Order creation stays server-owned." },
		{ type: "text", text: " Reviewed " },
		{ type: "link", text: "backend/services/guest-order-service.js" },
	]);
});

test("preserves provider comments, review replies, and connected app branding", async () => {
	const { adaptPullRequestActivity } = await loadAdapter();
	const entries = adaptPullRequestActivity([
		{
			id: "actions",
			kind: "comment-posted",
			actor: { id: "github-actions", name: "github-actions", kind: "app" },
			occurredAtMs: 100,
			timestamp: "7 minutes ago",
			tag: "Bot",
			body: "React Doctor found no new issues.",
			detail: { label: "Review details", body: "Reviewed commit abc1234." },
		},
		{
			id: "codex",
			kind: "review-submitted",
			actor: { id: "codex", name: "Codex", kind: "app" },
			occurredAtMs: 200,
			timestamp: "5 minutes ago",
			decision: "commented",
			body: "Narrow the nullable address.",
			filePath: "guest-order-service.js",
			allowReply: true,
			detail: { label: "About Codex in GitHub", body: "Automated review." },
			replies: [{
				id: "fixed",
				actor: VENN,
				timestamp: "3 minutes ago",
				body: "Fixed in abc1234.",
			}],
		},
	]);

	assert.equal(entries[0].actor.brandName, "github");
	assert.deepEqual(entries[0].tag, { text: "Bot" });
	assert.deepEqual(entries[0].collapsible, {
		label: "Review details",
		content: [{ type: "text", text: "Reviewed commit abc1234." }],
	});
	assert.equal(entries[1].actor.brandName, "openai-codex");
	assert.equal(entries[1].allowReply, true);
	assert.equal(entries[1].replies[0].actor.name, "Venn");
	assert.equal(entries[1].replies[0].body, "Fixed in abc1234.");
});

test("changes the activity revision when provider payload values change", async () => {
	const { getPullRequestActivityRevision } = await loadAdapter();
	const activity = [{
		id: "checks",
		kind: "checks-completed",
		actor: GITHUB,
		occurredAtMs: 100,
		timestamp: "later",
		passed: 2,
		total: 3,
	}];

	assert.notEqual(
		getPullRequestActivityRevision(activity),
		getPullRequestActivityRevision([{ ...activity[0], passed: 3 }]),
	);
});

test("keeps equal-time provider events in source order", async () => {
	const { adaptPullRequestActivity } = await loadAdapter();
	const entries = adaptPullRequestActivity([
		{
			id: "push-a",
			kind: "commits-pushed",
			actor: VENN,
			occurredAtMs: 100,
			timestamp: "1 minute ago",
			commitCount: 2,
			headSha: "abc1234",
		},
		{
			id: "thread",
			kind: "thread-resolved",
			actor: VENN,
			occurredAtMs: 100,
			timestamp: "1 minute ago",
			filePath: "checkout.tsx",
		},
	]);

	assert.deepEqual(entries.map(({ id }) => id), [
		"pull-request-push-a",
		"pull-request-thread",
	]);
});
