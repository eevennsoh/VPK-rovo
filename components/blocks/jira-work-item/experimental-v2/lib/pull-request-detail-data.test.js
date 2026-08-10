const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
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
	assert.equal(detail.authorName, "Venn");
	assert.equal(detail.authorAvatarSrc, "/avatar-user/venn/venn.png");
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
	assert.ok(
		detail.commits.every(
			(commit) =>
				typeof commit.url === "string" &&
				commit.url === `https://github.com/eevensoh/vpk-rovo/commit/${commit.shortSha}`,
		),
	);
	assert.deepEqual(
		[...new Set(detail.commits.map((commit) => commit.author.name))],
		["Venn", "Code Planner", "Unit Test Creator"],
	);
	assert.deepEqual(
		detail.commits.map((commit) => ({ name: commit.author.name, kind: commit.author.kind })),
		[
			{ name: "Venn", kind: "person" },
			{ name: "Code Planner", kind: "agent" },
			{ name: "Venn", kind: "person" },
			{ name: "Unit Test Creator", kind: "agent" },
			{ name: "Venn", kind: "person" },
			{ name: "Unit Test Creator", kind: "agent" },
		],
	);
	assert.deepEqual(
		detail.checks.map(({ name, status }) => ({ name, status })),
		[
			{ name: "Lint and typecheck", status: "passed" },
			{ name: "Unit tests", status: "passed" },
			{ name: "Guest checkout browser tests", status: "passed" },
		],
	);
	assert.ok(detail.checks.every((check) => typeof check.url === "string" && check.url.includes("/actions/runs/")));
	assert.equal(detail.guidedReview?.summary.length, 3);
	assert.match(detail.description, /^Adds a guest checkout path/u);
	assert.match(detail.description, /#### Summary\n\n- Lets shoppers complete checkout without creating an account\./u);
	assert.match(detail.description, /#### Changes/u);
	assert.match(detail.description, /#### Test plan/u);
	assert.match(detail.description, /- \[ \] From cart or sign-in/u);
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
			"checks-completed",
			"comment-posted",
			"review-submitted",
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

test("shows the checks spinner only while a check row is non-terminal", async () => {
	const { arePullRequestChecksInProgress, resolvePullRequestDetailData } = await loadDetailData();
	const checks = [
		{
			id: "lint-types",
			name: "Lint and typecheck",
			status: "failed",
			details: "Failed after 42s · deliveryAddress may be null",
			url: "https://github.com/eevensoh/vpk-rovo/actions/runs/18471001",
		},
		{
			id: "unit-tests",
			name: "Unit tests",
			status: "passed",
			details: "418 tests in 2m 46s",
			url: "https://github.com/eevensoh/vpk-rovo/actions/runs/18471002",
		},
		{
			id: "browser-tests",
			name: "Guest checkout browser tests",
			status: "passed",
			details: "5 scenarios in 1m 32s",
			url: "https://github.com/eevensoh/vpk-rovo/actions/runs/18471003",
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
	assert.ok(detail.checks.every((check) => typeof check.url === "string" && check.url.length > 0));

	const settled = resolvePullRequestDetailData(pullRequestEntry());
	assert.equal(settled?.mergeState, "ready");
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
		/<PullRequestDetailView[\s\S]*scrollContainerRef=\{scrollContainerRef\}/u,
	);
	assert.match(
		detailViewSource,
		/<PullRequestDetailHeader[\s\S]*scrollContainerRef=\{scrollContainerRef\}/u,
	);
	assert.doesNotMatch(detailViewSource, /ref=\{scrollContainerRef\}/u);
	assert.doesNotMatch(detailViewSource, /overflow-y-auto px-4 py-5 sm:px-6/u);
	assert.match(
		detailViewSource,
		/Overview[\s\S]*\{review\.files\.length\} Files[\s\S]*text-text-success[\s\S]*\+\{data\.additions\}[\s\S]*text-text-danger[\s\S]*-\{data\.deletions\}[\s\S]*Guide/u,
	);
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
		/mergeState=\{mapPullRequestHeaderMergeState\(data\.mergeState\)\}/u,
	);
	assert.match(
		headerSource,
		/function mapPullRequestHeaderMergeState[\s\S]*case "conflicts":[\s\S]*return "merge-conflicts"[\s\S]*case "blocked":[\s\S]*return "checks-running"/u,
	);
	assert.match(headerSource, /const \[autoMerge, setAutoMerge\] = useState\(true\)/u);
	assert.match(
		headerSource,
		/requestExpandPullRequestSection|useMetadataRail/u,
	);
	assert.match(
		headerSource,
		/onChecksRunningClick=\{\(\) => \{[\s\S]*setPanelView\("details"\)[\s\S]*requestExpandPullRequestSection\(data\.identity, PULL_REQUEST_CHECKS_SECTION_ID\)/u,
	);
	assert.doesNotMatch(
		headerSource,
		/autoMerge=\{autoMerge\}[\s\S]*onAutoMergeChange=\{setAutoMerge\}[\s\S]*onMergeClick=\{\(\) => undefined\}[\s\S]*onChecksRunningClick=[\s\S]*onConvertToDraftClick=\{\(\) => undefined\}[\s\S]*onClosePullRequestClick=\{\(\) => undefined\}/u,
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
	assert.match(guideSource, /String\(currentStep \+ 1\)\.padStart\(2, "0"\)[\s\S]*String\(review\.chapters\.length\)\.padStart\(2, "0"\)/u);
	assert.doesNotMatch(guideSource, /<button/u);
	assert.match(guideSource, /isLast \? "Finish" : "Next"/u);
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
		/data-jira-work-item-pull-request-details[\s\S]*?label="Reviewers"[\s\S]*?<ReviewersValue reviewers=\{data\.reviewers\} \/>/u,
	);
	assert.match(
		railSource,
		/className="flex items-center gap-1"[\s\S]*data-jira-work-item-pull-request-reviewers[\s\S]*role="group"[\s\S]*AvatarStatusIndicator/u,
	);
	assert.match(
		railSource,
		/function ReviewersValue[\s\S]*const isAgent = reviewer\.kind === "agent"[\s\S]*shape=\{isAgent \? "hexagon" : "circle"\}[\s\S]*size="default"[\s\S]*AvatarStatusIndicator status=\{avatarStatus\}/u,
	);
	assert.match(
		railSource,
		/function reviewerAvatarStatus[\s\S]*case "approved":\s*return "approved"[\s\S]*case "changes-requested":\s*return "declined"/u,
	);
	assert.doesNotMatch(
		railSource,
		/function ReviewersValue[\s\S]*size="sm"[\s\S]*AvatarStatusIndicator/u,
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
		/function ChecksValue[\s\S]*group\/check-row[\s\S]*<IconTile[\s\S]*StatusIcon[\s\S]*size="small"[\s\S]*variant="transparent"[\s\S]*check\.name[\s\S]*check\.details/u,
	);
	assert.match(
		railSource,
		/function ChecksValue[\s\S]*group\/check-row[\s\S]*-mx-2[\s\S]*w-\[calc\(100%\+1rem\)\][\s\S]*gap-3[\s\S]*rounded-md[\s\S]*px-2 py-2[\s\S]*hover:bg-bg-neutral-subtle-hovered[\s\S]*motion-reduce:transition-none/u,
	);
	assert.match(
		railSource,
		/function ChecksValue[\s\S]*truncate text-sm text-text[\s\S]*truncate text-xs text-text-subtlest/u,
	);
	assert.match(
		railSource,
		/function ChecksValue[\s\S]*checkUrl \? "cursor-pointer pe-7"/u,
	);
	assert.match(
		railSource,
		/function ChecksValue[\s\S]*role=\{checkUrl \? "link" : undefined\}[\s\S]*tabIndex=\{checkUrl \? 0 : undefined\}[\s\S]*openScmUrl\(checkUrl\)[\s\S]*handleScmLinkKeyDown\(event, checkUrl\)/u,
	);
	assert.match(
		railSource,
		/function ChecksValue[\s\S]*aria-label=\{`Open \$\{check\.name\} check details`\}[\s\S]*stopPropagation[\s\S]*openScmUrl\(checkUrl\)[\s\S]*LinkExternalIcon/u,
	);
	assert.match(
		railSource,
		/group-hover\/check-row:pointer-events-auto group-hover\/check-row:opacity-100[\s\S]*group-focus-within\/check-row:pointer-events-auto group-focus-within\/check-row:opacity-100/u,
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
		/data-jira-work-item-pull-request-details[\s\S]*?label="Reviewers"[\s\S]*?label="Created"[\s\S]*?flex min-w-0 items-center gap-2[\s\S]*?PersonAvatar person=\{author\}[\s\S]*?label="Updated"[\s\S]*?label="Labels"[\s\S]*?<\/div>\s*\),\s*\},/u,
	);
	assert.doesNotMatch(railSource, /GlobeIcon|label="Provider"/u);
	assert.doesNotMatch(railSource, /Participants/u);
});
