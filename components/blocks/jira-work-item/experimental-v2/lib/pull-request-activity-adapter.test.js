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
