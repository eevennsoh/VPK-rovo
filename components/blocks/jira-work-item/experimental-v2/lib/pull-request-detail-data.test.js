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
	assert.deepEqual(detail.provider, { id: "github", name: "GitHub" });
	assert.equal(detail.createdTime, "18 minutes ago");
	assert.equal(detail.updatedTime, "2m ago");
	assert.equal(detail.reviewDecision, "approved");
	assert.equal(detail.mergeState, "ready");
	assert.deepEqual(
		detail.reviewers.map(({ name, status }) => ({ name, status })),
		[
			{ name: "Code Planner", status: "approved" },
			{ name: "Unit Test Creator", status: "approved" },
		],
	);
	assert.deepEqual(detail.labels.map(({ name }) => name), ["checkout", "customer experience"]);
	assert.equal(detail.commits.length, 6);
	assert.deepEqual(
		[...new Set(detail.commits.map((commit) => commit.author.name))],
		["Venn", "Code Planner", "Unit Test Creator"],
	);
	assert.deepEqual(
		detail.checks.map(({ name, status }) => ({ name, status })),
		[
			{ name: "Lint and typecheck", status: "passed" },
			{ name: "Unit tests", status: "passed" },
			{ name: "Guest checkout browser tests", status: "passed" },
		],
	);
	assert.equal(detail.guidedReview?.summary.length, 3);
	assert.match(detail.description, /^## Summary\n\n- Lets shoppers/u);
	assert.equal(detail.description.split("\n- ").length - 1, 3);
	assert.equal(
		detail.activity.find((activity) => activity.kind === "checks-completed")?.passed,
		detail.checks.filter((check) => check.status === "passed").length,
	);
	assert.equal(
		detail.activity.find((activity) => activity.kind === "checks-completed")?.total,
		detail.checks.length,
	);
	assert.deepEqual(
		detail.activity.map(({ kind }) => kind),
		[
			"opened",
			"commits-pushed",
			"checks-completed",
			"review-submitted",
			"review-submitted",
			"thread-resolved",
			"ready-to-merge",
		],
	);
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

test("uses live SCM check state to block a guided pull request", async () => {
	const { resolvePullRequestDetailData } = await loadDetailData();
	const checks = [
		{ id: "lint-types", name: "Lint and typecheck", status: "failed", details: "Failed after 42s" },
		{ id: "unit-tests", name: "Unit tests", status: "passed", details: "418 tests" },
	];
	const detail = resolvePullRequestDetailData(pullRequestEntry({
		checks,
		reviewDecision: "review-required",
	}));

	assert.equal(detail?.mergeState, "blocked");
	assert.equal(detail?.reviewDecision, "review-required");
	assert.deepEqual(detail?.checks, checks);
	assert.deepEqual(detail?.activity.map(({ kind }) => kind), [
		"opened",
		"commits-pushed",
		"checks-completed",
	]);
	assert.equal(detail?.activity.at(-1)?.kind, "checks-completed");
	assert.equal(detail?.activity.at(-1)?.passed, 1);
	assert.equal(detail?.activity.at(-1)?.total, 2);
});

test("falls back to metadata-only overview for other pull requests", async () => {
	const { resolvePullRequestDetailData } = await loadDetailData();
	const detail = resolvePullRequestDetailData(pullRequestEntry({
		number: 1901,
		title: "Routine dependency update",
	}));

	assert.equal(detail?.number, 1901);
	assert.equal(detail?.guidedReview, null);
	assert.equal(detail?.description, "");
	assert.deepEqual(detail?.activity, []);
	assert.equal(detail?.reviewDecision, "not-required");
	assert.equal(detail?.mergeState, "blocked");
	assert.equal(resolvePullRequestDetailData({ ...pullRequestEntry(), pullRequest: undefined }), null);
});

test("recognizes provider-neutral pull request URLs", async () => {
	const { resolvePullRequestDetailData } = await loadDetailData();
	const detail = resolvePullRequestDetailData(pullRequestEntry({
		number: 77,
		url: "https://bitbucket.org/atlassian/storefront/pull-requests/77",
	}));

	assert.deepEqual(detail?.provider, { id: "bitbucket", name: "Bitbucket" });
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
	const railSource = readFileSync(
		join(__dirname, "../components/pull-request-detail/pull-request-details-rail.tsx"),
		"utf8",
	);
	const overviewSource = readFileSync(
		join(__dirname, "../components/pull-request-detail/pull-request-overview.tsx"),
		"utf8",
	);
	const layoutSource = readFileSync(
		join(__dirname, "../components/experimental-work-item-layout.tsx"),
		"utf8",
	);
	const workItemSource = readFileSync(
		join(__dirname, "../experimental-v2-jira-work-item.tsx"),
		"utf8",
	);

	assert.match(detailViewSource, /data-jira-work-item-pull-request-detail/u);
	assert.match(
		detailViewSource,
		/className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"/u,
	);
	assert.doesNotMatch(
		detailViewSource,
		/data-jira-work-item-pull-request-detail[\s\S]*bg-surface/u,
	);
	assert.match(detailViewSource, /className="shrink-0"/u);
	assert.doesNotMatch(detailViewSource, /shrink-0 px-4 sm:px-6/u);
	assert.match(detailViewSource, /min-h-0 flex-1 py-5/u);
	assert.doesNotMatch(detailViewSource, /overflow-y-auto|useRef<HTMLDivElement/u);
	assert.match(
		layoutSource,
		/context: \(scrollContainerRef: RefObject<HTMLDivElement \| null>\) => ReactNode[\s\S]*scrollRef=\{setLeftScrollContainerRef\}[\s\S]*context\(leftScrollContainerRef\)/u,
	);
	assert.match(
		workItemSource,
		/context=\{\(scrollContainerRef\) => \([\s\S]*<ContextPanel[\s\S]*scrollContainerRef=\{scrollContainerRef\}/u,
	);
	assert.match(
		contextPanelSource,
		/<PullRequestDetailView[\s\S]*scrollContainerRef=\{scrollContainerRef\}/u,
	);
	assert.match(
		detailViewSource,
		/<PullRequestDetailHeader[\s\S]*scrollContainerRef=\{scrollContainerRef\}/u,
	);
	assert.doesNotMatch(detailViewSource, /ref=\{scrollContainerRef\}/u);
	assert.doesNotMatch(detailViewSource, /overflow-y-auto px-4 py-5 sm:px-6/u);
	assert.match(detailViewSource, /Overview[\s\S]*Files \{review\.files\.length\}[\s\S]*Guide/u);
	assert.match(detailViewSource, /onFinish=\{\(\) => setActiveTab\("details"\)\}/u);
	assert.match(
		headerSource,
		/import \{ PullRequestHeader \} from "@\/components\/blocks\/pull-request-header"/u,
	);
	assert.match(headerSource, /data-jira-work-item-pull-request-detail-header/u);
	assert.match(
		headerSource,
		/scrollContainerRef: RefObject<HTMLElement \| null>/u,
	);
	assert.match(
		headerSource,
		/scrollContainerRef=\{scrollContainerRef\}/u,
	);
	assert.match(
		headerSource,
		/<PullRequestHeader[\s\S]*number=\{data\.number\}[\s\S]*title=\{data\.title\}[\s\S]*status=\{data\.status\}/u,
	);
	assert.doesNotMatch(headerSource, /px-4 py-4 sm:px-6/u);
	assert.match(overviewSource, /rounded-lg border border-border p-4/u);
	assert.match(
		overviewSource,
		/import \{ ContextDescriptionEditor \} from "@\/components\/blocks\/jira-work-item\/experimental-v2\/components\/context-description-editor"/u,
	);
	assert.match(
		overviewSource,
		/<ContextDescriptionEditor[\s\S]*aria-label="Pull request description"[\s\S]*value=\{description\}[\s\S]*onMarkdownChange=\{setDescription\}/u,
	);
	assert.doesNotMatch(overviewSource, /list-disc|Summary<\/h2>/u);
	assert.doesNotMatch(
		overviewSource,
		/pull-request-description-heading|Description<\/h2>|aria-labelledby="pull-request-description-heading"/u,
	);
	assert.match(overviewSource, /<section aria-label="Description">/u);
	assert.doesNotMatch(overviewSource, /max-w-3xl|mx-auto|space-y-8/u);
	assert.doesNotMatch(overviewSource, /pull-request-checks-heading|testGroups|groups passed/u);
	assert.doesNotMatch(overviewSource, /bg-surface-raised|bg-bg-neutral/u);
	assert.doesNotMatch(headerSource, /Back to description|onBack|ArrowLeftIcon/u);
	assert.match(
		headerSource,
		/authorName=\{data\.authorName\}[\s\S]*baseBranch=\{data\.baseBranch\}[\s\S]*headBranch=\{data\.headBranch\}/u,
	);
	assert.match(
		headerSource,
		/repository=\{data\.repository\}[\s\S]*additions=\{data\.additions\}[\s\S]*deletions=\{data\.deletions\}[\s\S]*updatedTime=\{data\.updatedTime\}[\s\S]*url=\{data\.url\}/u,
	);
	assert.doesNotMatch(headerSource, /Open in GitHub|border-b border-border pb-4/u);
	assert.match(guideSource, /data-jira-work-item-pull-request-guide/u);
	assert.match(guideSource, /data-jira-work-item-pull-request-guide-current-step/u);
	assert.match(guideSource, /String\(currentStep \+ 1\)\.padStart\(2, "0"\)[\s\S]*String\(review\.chapters\.length\)\.padStart\(2, "0"\)/u);
	assert.doesNotMatch(guideSource, /<button/u);
	assert.match(guideSource, /isLast \? "Finish" : "Next"/u);
	assert.match(filesSource, /import \{ CodeReviewFileBrowser \} from "@\/components\/blocks\/code-review"/u);
	assert.match(filesSource, /<CodeReviewFileBrowser[\s\S]*files=\{review\.files\}/u);
	assert.doesNotMatch(filesSource, /CodeList/u);
	assert.match(
		railSource,
		/id: "pull-request-reviewers"[\s\S]*id: "pull-request-details"[\s\S]*id: "pull-request-commits"[\s\S]*id: "pull-request-checks"/u,
	);
	assert.match(railSource, /title: "Reviewers"[\s\S]*title: "Details"[\s\S]*title: "Commits"[\s\S]*ChecksSectionTitle/u);
	assert.match(
		railSource,
		/<AvatarGroup[\s\S]*data-jira-work-item-pull-request-reviewers[\s\S]*AvatarStatusIndicator/u,
	);
	assert.doesNotMatch(railSource, /flex flex-col gap-2" data-jira-work-item-pull-request-reviewers/u);
	assert.doesNotMatch(railSource, /label="Review decision"|REVIEW_DECISION|Review required/u);
	assert.match(
		railSource,
		/data-jira-work-item-pull-request-commits[\s\S]*<div className="-mx-2 flex w-\[calc\(100%\+1rem\)\] min-w-0 flex-col px-2 py-2"/u,
	);
	assert.doesNotMatch(
		railSource,
		/data-jira-work-item-pull-request-commits[\s\S]*<button|hover:bg-bg-neutral-subtle-hovered|focus-visible:ring/u,
	);
	assert.match(
		railSource,
		/flex min-w-0 items-center gap-2[\s\S]*inline-flex shrink-0 items-center gap-1 text-xs tabular-nums[\s\S]*text-text-success[\s\S]*text-text-danger/u,
	);
	assert.doesNotMatch(railSource, /flex min-w-0 items-start gap-2/u);
	assert.match(railSource, /data-jira-work-item-pull-request-commits/u);
	assert.doesNotMatch(railSource, /data-jira-work-item-pull-request-commits[\s\S]*divide-y|divide-y divide-border/u);
	assert.match(railSource, /ProgressCircle[\s\S]*data-jira-work-item-pull-request-checks/u);
	assert.match(railSource, /<ArtifactPane[\s\S]*showSeparators=\{false\}/u);
	assert.ok(railSource.indexOf('id: "pull-request-reviewers"') < railSource.indexOf('id: "pull-request-details"'));
	assert.ok(railSource.indexOf('label="Merge status"') < railSource.indexOf('label="Labels"'));
	assert.match(
		railSource,
		/data-jira-work-item-pull-request-details[\s\S]*?label="Merge status"[\s\S]*?label="Labels"[\s\S]*?<\/div>\s*\),\s*\},/u,
	);
	assert.doesNotMatch(railSource, /GlobeIcon|label="Provider"/u);
	assert.doesNotMatch(railSource, /Participants/u);
});
