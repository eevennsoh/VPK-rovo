const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(process.cwd() + "/scripts/lib/esbuild-cjs-loader.js");

const MODULE_PATH = join(__dirname, "pull-request-detail-data.ts");

let detailDataPromise;
function loadDetailData() {
	if (!detailDataPromise) {
		detailDataPromise = esbuild
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
				"pull-request-detail-data-harness.cjs",
			));
	}
	return detailDataPromise;
}

function pullRequestEntry(overrides = {}) {
	return {
		id: "pr-detail",
		kind: "event",
		actor: { id: "github", name: "GitHub", kind: "app", brandName: "github" },
		timestamp: "2m ago",
		segments: [],
		pullRequest: {
			number: 1847,
			title: "Add guest checkout to the storefront",
			status: "Open",
			additions: 86,
			deletions: 21,
			repository: "eevensoh/vpk-rovo",
			...overrides,
		},
	};
}

test("resolves the #1847 guest-checkout guided review fixture", async () => {
	const { resolvePullRequestDetailData } = await loadDetailData();
	const detail = resolvePullRequestDetailData(pullRequestEntry());

	assert.ok(detail);
	assert.equal(detail.identity, "eevensoh/vpk-rovo#1847");
	assert.equal(detail.url, "https://github.com/eevensoh/vpk-rovo/pull/1847");
	assert.equal(detail.authorName, "Unknown author");
	assert.equal(detail.baseBranch, "main");
	assert.equal(detail.headBranch, "feature/shop-4821-guest-checkout");
	assert.equal(detail.updatedTime, "2m ago");
	assert.equal(detail.guidedReview?.summary.length, 3);
	assert.equal(detail.guidedReview?.testGroups.length, 5);
	assert.equal(detail.guidedReview?.totalChecks, 18);
	assert.equal(
		detail.guidedReview?.testGroups.reduce((total, group) => total + group.checks, 0),
		18,
	);
	assert.ok(detail.guidedReview?.testGroups.every((group) => group.status === "passed"));
	assert.deepEqual(
		detail.guidedReview?.discussion.map((item) => item.author),
		["github-actions", "Code Planner", "Unit Test Creator"],
	);
	assert.equal(detail.guidedReview?.discussion[0]?.type, "bot");
	assert.equal(detail.guidedReview?.discussion[0]?.avatarSrc, undefined);
	assert.ok(detail.guidedReview?.discussion.slice(1).every((item) => item.resolved));
	assert.deepEqual(
		detail.guidedReview?.chapters.map((chapter) => chapter.title),
		[
			"Start a guest checkout",
			"Keep order creation server-owned",
			"Recover safely and verify the flow",
		],
	);
	assert.deepEqual(
		detail.guidedReview?.files.map((file) => ({
			path: file.path,
			additions: file.additions,
			deletions: file.deletions,
		})),
		[
			{ path: "components/storefront/checkout/guest-checkout-flow.tsx", additions: 34, deletions: 8 },
			{ path: "backend/routes/guest-orders.js", additions: 24, deletions: 6 },
			{ path: "backend/services/guest-order-service.js", additions: 18, deletions: 4 },
			{ path: "tests/storefront/guest-checkout.spec.ts", additions: 10, deletions: 3 },
		],
	);
	assert.ok(detail.guidedReview?.files.every((file) => file.code.startsWith("diff --git")));
	assert.ok(detail.guidedReview?.files.every((file) => (
		file.status === "modified"
		&& file.oldContents.length > 0
		&& file.newContents.length > 0
		&& file.explorerPath === file.path
	)));
});

test("keeps URL identity while recognizing the repository fixture", async () => {
	const { resolvePullRequestDetailData } = await loadDetailData();
	const url = "https://github.com/eevensoh/vpk-rovo/pull/1847";
	const detail = resolvePullRequestDetailData(pullRequestEntry({ url }));

	assert.equal(detail?.identity, url);
	assert.ok(detail?.guidedReview);
});

test("falls back to metadata-only overview for other pull requests", async () => {
	const { resolvePullRequestDetailData } = await loadDetailData();
	const detail = resolvePullRequestDetailData(pullRequestEntry({
		number: 1901,
		title: "Routine dependency update",
	}));

	assert.equal(detail?.number, 1901);
	assert.equal(detail?.guidedReview, null);
	assert.equal(resolvePullRequestDetailData({ ...pullRequestEntry(), pullRequest: undefined }), null);
});

test("detail UI exposes stable integration selectors and guided-review controls", () => {
	const contextPanelSource = readFileSync(
		join(__dirname, "../components/context-panel.tsx"),
		"utf8",
	);
	const detailViewSource = readFileSync(
		join(__dirname, "../components/pull-request-detail/pull-request-detail-view.tsx"),
		"utf8",
	);
	const headerSource = readFileSync(
		join(__dirname, "../components/pull-request-detail/pull-request-detail-header.tsx"),
		"utf8",
	);
	const guideSource = readFileSync(
		join(__dirname, "../components/pull-request-detail/pull-request-guide.tsx"),
		"utf8",
	);
	const filesSource = readFileSync(
		join(__dirname, "../components/pull-request-detail/pull-request-files.tsx"),
		"utf8",
	);

	assert.match(contextPanelSource, /import dynamic from "next\/dynamic"/u);
	assert.match(contextPanelSource, /const PullRequestDetailView = dynamic\(\(\) =>[\s\S]*import\("@\/components\/blocks\/jira-work-item\/experimental-v2\/components\/pull-request-detail\/pull-request-detail-view"\)[\s\S]*\.then\(\(module\) => module\.PullRequestDetailView\)/u);
	assert.doesNotMatch(contextPanelSource, /import \{ PullRequestDetailView \} from/u);
	assert.match(detailViewSource, /data-jira-work-item-pull-request-detail/u);
	assert.match(detailViewSource, /Overview[\s\S]*Files \{review\.files\.length\}[\s\S]*Guide/u);
	assert.match(detailViewSource, /onFinish=\{\(\) => setActiveTab\("details"\)\}/u);
	assert.match(headerSource, /data-jira-work-item-pull-request-detail-header/u);
	assert.match(headerSource, /aria-label="Back to description"[\s\S]*onClick=\{onBack\}/u);
	assert.match(headerSource, /data\.authorName[\s\S]*data\.baseBranch[\s\S]*data\.headBranch/u);
	assert.match(headerSource, /data\.repository[\s\S]*data\.additions[\s\S]*data\.deletions[\s\S]*Updated \{data\.updatedTime\}/u);
	assert.match(headerSource, /href=\{data\.url\}[\s\S]*Open in GitHub/u);
	assert.match(guideSource, /data-jira-work-item-pull-request-guide/u);
	assert.match(guideSource, /data-jira-work-item-pull-request-guide-current-step/u);
	assert.match(guideSource, /String\(currentStep \+ 1\)\.padStart\(2, "0"\)[\s\S]*String\(review\.chapters\.length\)\.padStart\(2, "0"\)/u);
	assert.doesNotMatch(guideSource, /<button/u);
	assert.match(guideSource, /isLast \? "Finish" : "Next"/u);
	assert.match(filesSource, /import \{ CodeReviewFileBrowser \} from "@\/components\/blocks\/code-review"/u);
	assert.match(filesSource, /<CodeReviewFileBrowser[\s\S]*files=\{review\.files\}/u);
	assert.doesNotMatch(filesSource, /CodeList/u);
});
