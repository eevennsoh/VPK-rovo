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
			title: "Implement guest checkout without account creation",
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
	assert.equal(detail.authorName, "Venn");
	assert.equal(detail.authorAvatarSrc, "/avatar-user/venn/venn.png");
	assert.equal(detail.authorKind, "person");
	assert.equal(detail.baseBranch, "main");
	assert.equal(detail.headBranch, "feature/shop-4821-guest-checkout");
	assert.deepEqual(detail.provider, { id: "github", name: "GitHub" });
	assert.equal(detail.createdTime, "25 minutes ago");
	assert.equal(detail.updatedTime, "2m ago");
	assert.equal(detail.reviewDecision, "review-required");
	assert.equal(detail.mergeState, "blocked");
	// Approvers are people, not agents — every avatar is a human portrait.
	assert.deepEqual(
		detail.reviewers.map(({ name, status }) => ({ name, status })),
		[
			{ name: "Maya Chen", status: "approved" },
			{ name: "Jordan Lee", status: "approved" },
			{ name: "Venn", status: "pending" },
		],
	);
	assert.ok(detail.reviewers.every((reviewer) => reviewer.kind === "person"));
	assert.ok(detail.reviewers.every((reviewer) => reviewer.avatarSrc?.startsWith("/avatar-user/")));
	assert.deepEqual(detail.labels.map(({ name }) => name), ["checkout", "customer experience"]);
	assert.equal(detail.commits.length, 6);
	assert.ok(
		detail.commits.every(
			(commit) =>
				typeof commit.url === "string" &&
				commit.url === `https://github.com/eevensoh/vpk-rovo/commit/${commit.shortSha}`,
		),
	);
	assert.deepEqual(
		detail.commits.map((commit) => ({ name: commit.author.name, kind: commit.author.kind })),
		[
			{ name: "Venn", kind: "person" },
			{ name: "Maya Chen", kind: "person" },
			{ name: "Jordan Lee", kind: "person" },
			{ name: "Priya Narayanan", kind: "person" },
			{ name: "Sam Rivera", kind: "person" },
			{ name: "Maya Chen", kind: "person" },
		],
	);
	assert.ok(detail.commits.every((commit) => commit.author.kind === "person"));
	assert.ok(detail.commits.every((commit) => commit.author.avatarSrc?.startsWith("/avatar-user/")));
	assert.equal(new Set(detail.commits.map((commit) => commit.author.id)).size >= 4, true);
	assert.deepEqual(
		detail.checks.map(({ name, status }) => ({ name, status })),
		[
			{ name: "Lint and typecheck", status: "passed" },
			{ name: "Unit tests", status: "passed" },
			{ name: "Guest checkout browser tests", status: "passed" },
		],
	);
	// Demo-only checks: no SCM URLs so rows never navigate to a real provider.
	assert.ok(detail.checks.every((check) => !("url" in check)));
	assert.equal(detail.guidedReview?.summary.length, 3);
	assert.deepEqual(detail.guidedReview?.metrics, {
		risk: { label: "Low", filled: 1 },
		impact: { label: "Medium", filled: 2 },
		reviewDepth: { label: "3/5", filled: 3 },
		mergeConfidence: { label: "4/5", filled: 4 },
	});
	assert.match(detail.description, /^Adds a guest checkout path/u);
	assert.match(detail.description, /#### Summary\n\n- Lets shoppers complete checkout without creating an account\./u);
	assert.match(detail.description, /#### Changes/u);
	assert.match(detail.description, /#### Test plan/u);
	assert.match(detail.description, /- \[x\] From cart or sign-in/u);
	assert.doesNotMatch(detail.description, /- \[ \] /u);
	assert.equal(detail.guidedReview?.description, detail.description);
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
			"review-submitted",
			"commits-pushed",
			"thread-resolved",
			"checks-completed",
			"comment-posted",
			"review-submitted",
			"review-submitted",
		],
	);
	assert.deepEqual(
		detail.activity.map(({ occurredAtMs }) => occurredAtMs),
		[...detail.activity.map(({ occurredAtMs }) => occurredAtMs)].sort((left, right) => left - right),
	);
	assert.deepEqual(
		detail.activity
			.filter((activity) => activity.kind === "commits-pushed")
			.map(({ commitCount, headSha }) => ({ commitCount, headSha })),
		[
			{ commitCount: 4, headSha: "d34c112" },
			{ commitCount: 2, headSha: "f8cc291" },
		],
	);
	assert.deepEqual(
		detail.commits.map(({ shortSha, timestamp }) => ({ shortSha, timestamp })),
		[
			{ shortSha: "5f02a91", timestamp: "24 minutes ago" },
			{ shortSha: "91c73d4", timestamp: "22 minutes ago" },
			{ shortSha: "a2f74c1", timestamp: "20 minutes ago" },
			{ shortSha: "d34c112", timestamp: "18 minutes ago" },
			{ shortSha: "8b4e6fa", timestamp: "14 minutes ago" },
			{ shortSha: "f8cc291", timestamp: "12 minutes ago" },
		],
	);
	const codexReview = detail.activity.find((activity) => activity.id === "codex-review");
	assert.equal(codexReview?.detail?.body, "Codex reviewed commit d34c112 and posted this suggestion on the pull request.");
	assert.equal(codexReview?.replies?.[0]?.timestamp, "13 minutes ago");
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

test("an approved #1847 entry adds Venn approval and ready-to-merge evidence", async () => {
	const { resolvePullRequestDetailData } = await loadDetailData();
	const detail = resolvePullRequestDetailData(pullRequestEntry({
		mergeState: "ready",
		reviewDecision: "approved",
	}));

	assert.ok(detail);
	assert.equal(detail.reviewDecision, "approved");
	assert.equal(detail.mergeState, "ready");
	assert.deepEqual(
		detail.reviewers.map(({ name, status }) => ({ name, status })),
		[
			{ name: "Maya Chen", status: "approved" },
			{ name: "Jordan Lee", status: "approved" },
			{ name: "Venn", status: "approved" },
		],
	);
	assert.deepEqual(detail.activity.slice(-2).map(({ kind }) => kind), [
		"review-submitted",
		"ready-to-merge",
	]);
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
	assert.deepEqual(
		detail?.reviewers.map(({ name, status }) => ({ name, status })),
		[
			{ name: "Maya Chen", status: "pending" },
			{ name: "Jordan Lee", status: "pending" },
			{ name: "Venn", status: "pending" },
		],
	);
	assert.match(detail?.description ?? "", /- \[ \] From cart or sign-in/u);
	assert.doesNotMatch(detail?.description ?? "", /- \[x\] /u);
	assert.equal(detail?.guidedReview?.description, detail?.description);
	assert.deepEqual(detail?.activity.map(({ kind }) => kind), [
		"opened",
		"commits-pushed",
		"checks-completed",
	]);
	assert.equal(detail?.activity.at(-1)?.kind, "checks-completed");
	assert.equal(detail?.activity.at(-1)?.passed, 1);
	assert.equal(detail?.activity.at(-1)?.total, 2);
});

test("shows the checks spinner only while a check row is non-terminal", async () => {
	const { arePullRequestChecksInProgress, resolvePullRequestDetailData } = await loadDetailData();
	const checks = [
		{
			id: "lint-types",
			name: "Lint and typecheck",
			status: "failed",
			details: "Failed after 42s · deliveryAddress may be null",
		},
		{
			id: "unit-tests",
			name: "Unit tests",
			status: "passed",
			details: "418 tests in 2m 46s",
		},
		{
			id: "browser-tests",
			name: "Guest checkout browser tests",
			status: "passed",
			details: "5 scenarios in 1m 32s",
		},
	];
	const detail = resolvePullRequestDetailData(pullRequestEntry({
		checks,
		mergeState: "blocked",
		reviewDecision: "review-required",
	}));

	assert.ok(detail);
	assert.equal(detail.mergeState, "blocked");
	assert.equal(
		detail.checks.filter((check) => check.status === "passed").length,
		2,
	);
	assert.equal(detail.checks.length, 3);
	assert.equal(arePullRequestChecksInProgress(detail.checks), false);

	const settled = resolvePullRequestDetailData(pullRequestEntry());
	assert.equal(settled?.mergeState, "blocked");
	assert.equal(arePullRequestChecksInProgress(settled.checks), false);
	assert.equal(arePullRequestChecksInProgress([{
		id: "running",
		name: "Running",
		status: "running",
		details: "In progress",
	}]), true);
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
	const metadataRailContextSource = readFileSync(
		join(__dirname, "../context-metadata-rail.tsx"),
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
	const activityComposerSource = readFileSync(
		join(__dirname, "../components/activity-composer.tsx"),
		"utf8",
	);
	const contextPillsSource = readFileSync(
		join(__dirname, "../components/activity-composer-context-pills.tsx"),
		"utf8",
	);

	assert.match(detailViewSource, /data-jira-work-item-pull-request-detail/u);
	assert.match(
		detailViewSource,
		/className="flex min-h-0 min-w-0 flex-1 flex-col"/u,
	);
	assert.match(
		detailViewSource,
		/sticky top-0 z-10 flex shrink-0 flex-col gap-4 bg-surface/u,
	);
	assert.match(
		detailViewSource,
		/sticky top-0 z-10 flex shrink-0 flex-col gap-4 bg-surface[\s\S]*<TabsList/u,
	);
	assert.match(detailViewSource, /className="shrink-0"/u);
	assert.doesNotMatch(detailViewSource, /shrink-0 px-4 sm:px-6/u);
	assert.match(detailViewSource, /min-h-0 flex-1 py-5/u);
	assert.doesNotMatch(detailViewSource, /overflow-hidden|overflow-y-auto|useRef<HTMLDivElement/u);
	assert.match(
		layoutSource,
		/context: \(scrollContainerRef: RefObject<HTMLDivElement \| null>\) => ReactNode[\s\S]*scrollRef=\{setLeftScrollContainerRef\}[\s\S]*context\(leftScrollContainerRef\)/u,
	);
	assert.doesNotMatch(
		layoutSource,
		/COLUMN_CHROME_HEIGHT_VAR|jira-work-item-column-chrome-height/u,
	);
	assert.doesNotMatch(workItemSource, /pinColumnChrome/u);
	assert.doesNotMatch(layoutSource, /pinColumnChrome/u);
	assert.match(
		workItemSource,
		/context=\{\(scrollContainerRef\) => \([\s\S]*<ContextPanel[\s\S]*scrollContainerRef=\{scrollContainerRef\}/u,
	);
	assert.match(
		contextPanelSource,
		/<PullRequestDetailView[\s\S]*approvalState=\{pullRequestApprovalState\}[\s\S]*onReviewProgressChange=\{onPullRequestReviewProgressChange\}[\s\S]*scrollContainerRef=\{scrollContainerRef\}/u,
	);
	assert.match(
		detailViewSource,
		/<PullRequestDetailHeader[\s\S]*scrollContainerRef=\{scrollContainerRef\}/u,
	);
	assert.doesNotMatch(detailViewSource, /ref=\{scrollContainerRef\}/u);
	assert.doesNotMatch(detailViewSource, /overflow-y-auto px-4 py-5 sm:px-6/u);
	assert.match(
		detailViewSource,
		/Overview[\s\S]*Guide[\s\S]*\{review\.files\.length\} Files[\s\S]*text-text-success[\s\S]*\+\{data\.additions\}[\s\S]*text-text-danger[\s\S]*-\{data\.deletions\}/u,
	);
	assert.match(
		detailViewSource,
		/<PullRequestGuide[\s\S]*onChapterReviewedChange=\{handleChapterReviewedChange\}[\s\S]*reviewedChapterIds=\{reviewedChapterIds\}[\s\S]*showFinishAction=\{approvalState === undefined\}/u,
	);
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
	assert.match(headerSource, /mergeState=\{mapPullRequestHeaderMergeState\(data\)\}/u);
	assert.match(
		headerSource,
		/function mapPullRequestHeaderMergeState[\s\S]*case "conflicts":[\s\S]*return "merge-conflicts"[\s\S]*case "blocked":[\s\S]*checks\.some[\s\S]*"failed"[\s\S]*return "checks-failed"[\s\S]*"running"[\s\S]*"queued"[\s\S]*return "checks-running"[\s\S]*reviewDecision === "review-required"[\s\S]*return "review-required"[\s\S]*return "ready"/u,
	);
	assert.match(headerSource, /const \[autoMerge, setAutoMerge\] = useState\(true\)/u);
	assert.match(headerSource, /const isOpen = data\.status === "Open"/u);
	assert.match(headerSource, /const mergeReady = isOpen && data\.mergeState === "ready"/u);
	assert.match(
		headerSource,
		/requestExpandPullRequestSection|useMetadataRail/u,
	);
	assert.match(
		headerSource,
		/const openChecks = \(\) => \{[\s\S]*setPanelView\("details"\)[\s\S]*requestExpandPullRequestSection\(data\.identity, PULL_REQUEST_CHECKS_SECTION_ID\)[\s\S]*onChecksFailedClick=\{openChecks\}[\s\S]*onChecksRunningClick=\{openChecks\}/u,
	);
	assert.match(
		headerSource,
		/onChecksFailedClick=\{openChecks\}[\s\S]*onChecksRunningClick=\{openChecks\}[\s\S]*onReviewRequiredClick=\{onGuideOpen\}/u,
	);
	assert.match(
		headerSource,
		/autoMerge=\{isOpen \? autoMerge : false\}[\s\S]*onAutoMergeChange=\{isOpen \? setAutoMerge : undefined\}[\s\S]*onMergeClick=\{mergeReady \? DEMO_MERGE : undefined\}/u,
	);
	assert.match(
		headerSource,
		/url=\{data\.url\}[\s\S]*scmProviderName=\{data\.provider\.name\}/u,
	);
	assert.match(
		headerSource,
		/baseBranch=\{data\.baseBranch\}[\s\S]*headBranch=\{data\.headBranch\}[\s\S]*repository=\{data\.repository\}/u,
	);
	assert.doesNotMatch(headerSource, /authorName=\{data\.authorName\}/u);
	assert.doesNotMatch(headerSource, /additions=\{data\.additions\}/u);
	assert.doesNotMatch(headerSource, /onMoreActionsClick/u);
	assert.match(headerSource, /className="rounded-xl border p-4"/u);
	assert.match(headerSource, /style=\{\{ borderRadius: 12 \}\}/u);
	assert.doesNotMatch(headerSource, /border-b border-border pb-4/u);
	assert.match(guideSource, /data-jira-work-item-pull-request-guide/u);
	assert.match(guideSource, /data-jira-work-item-pull-request-guide-current-step/u);
	assert.match(guideSource, /data-jira-work-item-pull-request-guide-summary/u);
	assert.match(guideSource, /ChatTimelineNavigator/u);
	assert.match(guideSource, /review\.summary\.join\(" "\)/u);
	assert.match(guideSource, /font: token\("font\.heading\.xlarge"\)[\s\S]*fontWeight: token\("font\.weight\.regular"\)/u);
	assert.match(guideSource, /grid grid-cols-1 gap-4 sm:grid-cols-2/u);
	assert.match(guideSource, /rounded-lg bg-surface-sunken p-3/u);
	assert.match(guideSource, /font-mono text-\[2rem\] leading-8 font-normal/u);
	assert.match(guideSource, /className="absolute -left-6 top-0 z-10"/u);
	assert.doesNotMatch(guideSource, /lg:grid-cols-\[15rem_minmax\(0,1fr\)\]/u);
	assert.match(
		guideSource,
		/review\.metrics\.risk[\s\S]*review\.metrics\.impact[\s\S]*review\.metrics\.reviewDepth[\s\S]*review\.metrics\.mergeConfidence/u,
	);
	assert.match(guideSource, /<Checkbox[\s\S]*checked=\{reviewed\}[\s\S]*onCheckedChange=\{\(checked\) => onChapterReviewedChange\(item\.id, checked === true\)\}/u);
	assert.match(guideSource, />\s*Reviewed\s*<\/label>/u);
	assert.match(guideSource, /IntersectionObserver/u);
	assert.match(
		guideSource,
		/scrollIntoView\(\{[\s\S]*behavior: shouldReduceMotion \? "auto" : "smooth",[\s\S]*block: "start"/u,
	);
	assert.match(
		guideSource,
		/const selectChapter = \(chapterId: string\) => \{[\s\S]*setActiveChapterId\(chapterId\)[\s\S]*onChapterReviewedChange\(chapterId, true\)/u,
	);
	assert.doesNotMatch(guideSource, /Back<\/Button>|Next<\/Button>/u);
	assert.doesNotMatch(guideSource, /<nav aria-label="Guided review chapters">/u);
	assert.doesNotMatch(guideSource, /Approve pull request|onApprove|allChaptersVisited/u);
	assert.match(
		workItemSource,
		/label: approved \? `Review submitted \$\{total\}\/\$\{total\}` : `Submit review \$\{reviewed\}\/\$\{total\}`/u,
	);
	assert.match(workItemSource, /disabled: approved \|\| reviewed !== total \|\| !onPullRequestApprove/u);
	assert.match(workItemSource, /<ActivityComposer[\s\S]*primaryAction=\{pullRequestReviewAction\}/u);
	assert.match(activityComposerSource, /primaryAction=\{primaryAction\}/u);
	assert.match(
		contextPillsSource,
		/\{primaryAction \? \([\s\S]*<ContextBarPill[\s\S]*\{primaryAction\.label\}[\s\S]*\) : null\}[\s\S]*\{workingSessions\.length/u,
	);
	assert.match(
		workItemSource,
		/pullRequestApprovalStates\?: Readonly<Record<string, "available" \| "approved">>/u,
	);
	assert.match(workItemSource, /onPullRequestApprove\?: \(identity: string\) => void/u);
	assert.match(
		workItemSource,
		/pullRequestApprovalStates\?\.\[identity\] !== "approved"[\s\S]*reviewDecision: "approved" as const,[\s\S]*mergeState: "ready" as const/u,
	);
	assert.match(filesSource, /import \{ CodeReviewFileBrowser \} from "@\/components\/blocks\/code-review"/u);
	assert.match(filesSource, /<CodeReviewFileBrowser[\s\S]*files=\{review\.files\}/u);
	assert.doesNotMatch(filesSource, /CodeList/u);
	assert.match(
		railSource,
		/id: "pull-request-details"[\s\S]*id: PULL_REQUEST_CHECKS_SECTION_ID[\s\S]*id: "pull-request-commits"/u,
	);
	assert.match(
		railSource,
		/PULL_REQUEST_CHECKS_SECTION_ID = "pull-request-checks"/u,
	);
	assert.match(
		railSource,
		/pullRequestSectionExpandRequest\.pullRequestIdentity !== data\.identity[\s\S]*consumePullRequestSectionExpandRequest\(nonce\)[\s\S]*onOpenSectionIdsChange=\{setOpenSectionIds\}[\s\S]*openSectionIds=\{openSectionIds\}/u,
	);
	assert.match(
		metadataRailContextSource,
		/requestExpandPullRequestSection: \(pullRequestIdentity: string, sectionId: string\)[\s\S]*consumePullRequestSectionExpandRequest: \(nonce: number\)/u,
	);
	assert.match(
		metadataRailContextSource,
		/current\?\.nonce === nonce \? null : current/u,
	);
	assert.match(railSource, /title: "Details"[\s\S]*ChecksSectionTitle[\s\S]*title: "Commits"/u);
	assert.doesNotMatch(railSource, /id: "pull-request-reviewers"/u);
	assert.match(
		railSource,
		/data-jira-work-item-pull-request-details[\s\S]*?label="Approvers"[\s\S]*?<ApproversValue reviewers=\{data\.reviewers\} \/>/u,
	);
	assert.match(
		railSource,
		/className="flex items-center gap-1"[\s\S]*data-jira-work-item-pull-request-reviewers[\s\S]*role="group"[\s\S]*AvatarStatusIndicator/u,
	);
	assert.match(
		railSource,
		/function ApproversValue[\s\S]*const isAgent = reviewer\.kind === "agent"[\s\S]*shape=\{isAgent \? "hexagon" : "circle"\}[\s\S]*size="default"[\s\S]*AvatarStatusIndicator status=\{avatarStatus\}/u,
	);
	assert.match(
		railSource,
		/function reviewerAvatarStatus[\s\S]*case "approved":\s*return "approved"[\s\S]*case "changes-requested":\s*return "declined"/u,
	);
	assert.doesNotMatch(
		railSource,
		/function ApproversValue[\s\S]*size="sm"[\s\S]*AvatarStatusIndicator/u,
	);
	assert.doesNotMatch(railSource, /AvatarGroup|<AvatarGroup/u);
	assert.doesNotMatch(railSource, /-space-x-/u);
	assert.doesNotMatch(railSource, /flex flex-col gap-2" data-jira-work-item-pull-request-reviewers/u);
	assert.doesNotMatch(railSource, /label="Review decision"|REVIEW_DECISION|Review required/u);
	assert.match(
		railSource,
		/data-jira-work-item-pull-request-commits[\s\S]*group -mx-2 flex w-\[calc\(100%\+1rem\)\] min-w-0 flex-col rounded-md px-2 py-2 transition-colors duration-xxshort ease-out-practical hover:bg-bg-neutral-subtle-hovered motion-reduce:transition-none[\s\S]*commitUrl \? "cursor-pointer"/u,
	);
	const commitsValueSource = railSource.match(
		/function CommitsValue[\s\S]*?(?=function ChecksSectionTitle)/u,
	)?.[0] ?? "";
	assert.ok(commitsValueSource.length > 0);
	assert.match(
		commitsValueSource,
		/rounded-md[\s\S]*hover:bg-bg-neutral-subtle-hovered/u,
	);
	assert.match(
		commitsValueSource,
		/role=\{commitUrl \? "link" : undefined\}[\s\S]*tabIndex=\{commitUrl \? 0 : undefined\}[\s\S]*openScmUrl\(commitUrl\)[\s\S]*handleScmLinkKeyDown\(event, commitUrl\)/u,
	);
	assert.match(
		commitsValueSource,
		/<code className="font-mono text-text-subtlest">\{commit\.shortSha\}<\/code>/u,
	);
	assert.doesNotMatch(
		commitsValueSource,
		/href=\{commit\.url\}|<a[\s\S]*commit\.shortSha/u,
	);
	assert.doesNotMatch(
		commitsValueSource,
		/text-link|text-\[var\(--color-link\)\]|color-link/u,
	);
	assert.match(
		commitsValueSource,
		/copyCommitSha\(event, commit\.shortSha\)/u,
	);
	assert.match(
		railSource,
		/function copyCommitSha[\s\S]*stopPropagation[\s\S]*clipboard\.writeText/u,
	);
	assert.match(
		railSource,
		/function openScmUrl[\s\S]*window\.open\(url, "_blank", "noopener,noreferrer"\)/u,
	);
	assert.match(
		railSource,
		/function handleScmLinkKeyDown[\s\S]*event\.key === "Enter" \|\| event\.key === " "[\s\S]*openScmUrl/u,
	);
	assert.match(
		commitsValueSource,
		/pointer-events-none opacity-0[\s\S]*group-hover:pointer-events-auto group-hover:opacity-100[\s\S]*group-focus-within:pointer-events-auto group-focus-within:opacity-100[\s\S]*focus-visible:pointer-events-auto focus-visible:opacity-100/u,
	);
	assert.match(
		commitsValueSource,
		/className="size-3"[\s\S]*CopyIcon label="" size="small"/u,
	);
	assert.match(
		commitsValueSource,
		/aria-label=\{`Copy commit \$\{commit\.shortSha\}`\}/u,
	);
	assert.match(
		railSource,
		/flex min-w-0 items-center gap-2[\s\S]*inline-flex shrink-0 items-center gap-1 text-xs tabular-nums[\s\S]*text-text-success[\s\S]*text-text-danger/u,
	);
	assert.match(
		railSource,
		/shape=\{isAgent \? "hexagon" : "circle"\}/u,
	);
	assert.match(
		railSource,
		/flex min-w-0 items-center gap-1[\s\S]*PersonAvatar person=\{commit\.author\}[\s\S]*commit\.author\.name/u,
	);
	assert.match(
		commitsValueSource,
		/commit\.timestamp[\s\S]*<span aria-hidden>·<\/span>[\s\S]*commit\.shortSha/u,
	);
	assert.doesNotMatch(railSource, /flex min-w-0 items-start gap-2/u);
	assert.match(railSource, /data-jira-work-item-pull-request-commits/u);
	assert.doesNotMatch(railSource, /data-jira-work-item-pull-request-commits[\s\S]*divide-y|divide-y divide-border/u);
	assert.match(
		railSource,
		/arePullRequestChecksInProgress/u,
	);
	assert.match(railSource, /from "@\/components\/ui\/spinner"/u);
	assert.match(
		railSource,
		/function ChecksSectionTitle[\s\S]*inProgress \? \([\s\S]*<Spinner size="xs" \/>[\s\S]*\) : \([\s\S]*<ProgressCircle[\s\S]*aria-hidden[\s\S]*size="xs"/u,
	);
	assert.match(
		railSource,
		/const checksInProgress = arePullRequestChecksInProgress\(data\.checks\);/u,
	);
	assert.match(
		railSource,
		/ChecksSectionTitle[\s\S]*inProgress=\{checksInProgress\}[\s\S]*passed=\{passedChecks\}/u,
	);
	// Labeled collapsed count; ArtifactPane CollapsedSectionCount owns the · sibling + gap-1.5.
	assert.match(
		railSource,
		/count: `\$\{passedChecks\}\/\$\{data\.checks\.length\} passed`/u,
	);
	assert.match(railSource, /data-jira-work-item-pull-request-checks/u);
	assert.match(
		railSource,
		/function ChecksValue[\s\S]*group\/check-row[\s\S]*<IconTile[\s\S]*status\.renderIcon\(\)[\s\S]*size="small"[\s\S]*variant="transparent"[\s\S]*check\.name[\s\S]*<CheckDetails check=\{check\} \/>/u,
	);
	assert.match(
		railSource,
		/function RunningCheckDetails[\s\S]*ElapsedTime prefix="Running for " startedAtMs=\{startedAtMs\}/u,
	);
	assert.match(
		railSource,
		/function CheckDetails[\s\S]*check\.status !== "running"[\s\S]*parseRunningCheckElapsedSeconds\(check\.details\)[\s\S]*initialSeconds === null[\s\S]*<RunningCheckDetails initialSeconds=\{initialSeconds\} \/>/u,
	);
	assert.match(railSource, /from "@\/components\/ui\/elapsed-time"/u);
	assert.match(
		railSource,
		/from "@\/components\/blocks\/jira-work-item\/experimental-v2\/lib\/pull-request-check-elapsed"/u,
	);
	assert.match(
		railSource,
		/function ChecksValue[\s\S]*group\/check-row[\s\S]*-mx-2[\s\S]*w-\[calc\(100%\+1rem\)\][\s\S]*gap-3[\s\S]*rounded-md[\s\S]*px-2 py-2[\s\S]*hover:bg-bg-neutral-subtle-hovered[\s\S]*motion-reduce:transition-none/u,
	);
	assert.match(
		railSource,
		/function ChecksValue[\s\S]*truncate text-sm text-text[\s\S]*truncate text-xs text-text-subtlest/u,
	);
	// A running check spins in place of a settled status glyph (subtle spinner color, not information blue).
	assert.match(
		railSource,
		/running: \{[\s\S]*iconClassName: "text-icon-subtle"[\s\S]*renderIcon: \(\) => <Spinner label="" size="sm" \/>/u,
	);
	assert.doesNotMatch(
		railSource,
		/running: \{[\s\S]*text-icon-information/u,
	);
	assert.match(
		railSource,
		/queued: \{[\s\S]*iconClassName: "text-icon-disabled"[\s\S]*TaskToDoIcon/u,
	);
	assert.doesNotMatch(railSource, /CheckCircleUncheckedIcon/u);
	// Checks are demo-only: rows never navigate, so no link role, handlers, or button.
	const checksValueSource = railSource.slice(
		railSource.indexOf("function ChecksValue"),
		railSource.indexOf("export function PullRequestDetailsRail"),
	);
	assert.doesNotMatch(checksValueSource, /openScmUrl|handleScmLinkKeyDown|role="link"|<Button/u);
	assert.doesNotMatch(checksValueSource, /\bpe-7\b|absolute end-0|-translate-y-1\/2/u);
	assert.match(
		checksValueSource,
		/<IconTile[\s\S]*shrink-0 text-icon-subtle[\s\S]*LinkExternalIcon[\s\S]*iconSize="small"[\s\S]*size="small"[\s\S]*variant="transparent"/u,
	);
	assert.match(
		checksValueSource,
		/group-hover\/check-row:opacity-100/u,
	);
	assert.doesNotMatch(
		railSource,
		/function ChecksValue[\s\S]*Lozenge|function ChecksValue[\s\S]*status\.tone/u,
	);
	assert.doesNotMatch(railSource, /from "@\/components\/ui\/lozenge"/u);
	assert.match(railSource, /<ArtifactPane[\s\S]*showSeparators=\{false\}/u);
	assert.doesNotMatch(railSource, /label="Merge status"|MERGE_STATE|MergeSuccessIcon/u);
	assert.match(
		railSource,
		/data-jira-work-item-pull-request-details[\s\S]*?label="Approvers"[\s\S]*?label="Created"[\s\S]*?flex min-w-0 items-center gap-2[\s\S]*?PersonAvatar person=\{author\}[\s\S]*?label="Updated"[\s\S]*?label="Labels"[\s\S]*?<\/div>\s*\),\s*\},/u,
	);
	assert.doesNotMatch(railSource, /GlobeIcon|label="Provider"/u);
	assert.doesNotMatch(railSource, /Participants/u);
});
