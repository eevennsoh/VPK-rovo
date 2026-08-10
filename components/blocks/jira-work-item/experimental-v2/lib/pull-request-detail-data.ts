import type { JiraActivityEventEntry } from "@/components/blocks/jira-activity";
import type { ChangedFile } from "@/components/blocks/code-review";
import type { CodeListItem } from "@/components/ui-custom/code-list";
import type { TagColor } from "@/components/ui/tag";

import { getPullRequestIdentity } from "./jira-activity-adapter";

const GUIDED_REVIEW_PULL_REQUEST_IDENTITY = "eevensoh/vpk-rovo#1847";

export interface PullRequestGuideChapter {
	id: string;
	title: string;
	description: string;
	fileIds: readonly string[];
}

export interface PullRequestProvider {
	id: "github" | "bitbucket" | "gitlab" | "other";
	name: string;
}

export interface PullRequestPerson {
	id: string;
	name: string;
	avatarSrc?: string;
	/** When omitted, treat as a human person avatar. */
	kind?: "person" | "agent" | "app";
}

export interface PullRequestReviewer extends PullRequestPerson {
	status: "approved" | "changes-requested" | "commented" | "pending";
}

export interface PullRequestLabel {
	id: string;
	name: string;
	color?: TagColor;
}

export interface PullRequestCommit {
	id: string;
	shortSha: string;
	title: string;
	author: PullRequestPerson;
	timestamp: string;
	additions: number;
	deletions: number;
	/** SCM commit page URL opened from the commits rail SHA. */
	url?: string;
}

export interface PullRequestCheck {
	id: string;
	name: string;
	status: "passed" | "failed" | "running" | "queued";
	details: string;
	/** SCM check-run / Actions URL opened from the CI checks rail row. */
	url?: string;
}

export type PullRequestReviewDecision =
	| "approved"
	| "changes-requested"
	| "review-required"
	| "not-required";

export type PullRequestMergeState = "ready" | "blocked" | "conflicts" | "merged";

export interface PullRequestActivityActor extends PullRequestPerson {
	kind: "person" | "agent" | "app";
}

interface PullRequestActivityBase {
	id: string;
	actor: PullRequestActivityActor;
	/** Millisecond timestamp used to establish a deterministic chronological order. */
	occurredAtMs: number;
	/** Provider-supplied display timestamp, retained for the fixture UI. */
	timestamp: string;
}

export type PullRequestActivity =
	| (PullRequestActivityBase & {
			kind: "opened";
			baseBranch: string;
			headBranch: string;
		})
	| (PullRequestActivityBase & {
			kind: "commits-pushed";
			commitCount: number;
			headSha: string;
		})
	| (PullRequestActivityBase & {
			kind: "checks-completed";
			passed: number;
			total: number;
		})
	| (PullRequestActivityBase & {
			kind: "review-submitted";
			decision: "approved" | "changes-requested" | "commented";
			body: string;
			filePath?: string;
		})
	| (PullRequestActivityBase & {
			kind: "thread-resolved";
			filePath: string;
		})
	| (PullRequestActivityBase & {
			kind: "ready-to-merge";
		});

export interface PullRequestGuidedReview {
	summary: readonly string[];
	/** Full markdown body for the Overview TipTap description editor. */
	description: string;
	chapters: readonly PullRequestGuideChapter[];
	files: readonly PullRequestReviewFile[];
}

export type PullRequestReviewFile = ChangedFile & CodeListItem;

export interface PullRequestDetailData {
	identity: string;
	number: number;
	title: string;
	/** Markdown body shown in the Overview TipTap description editor. */
	description: string;
	repository: string;
	status: "Open" | "Merged";
	authorName: string;
	authorAvatarSrc?: string;
	baseBranch: string | null;
	headBranch: string | null;
	additions: number;
	deletions: number;
	provider: PullRequestProvider;
	reviewers: readonly PullRequestReviewer[];
	labels: readonly PullRequestLabel[];
	commits: readonly PullRequestCommit[];
	checks: readonly PullRequestCheck[];
	createdTime: string;
	updatedTime: string;
	reviewDecision: PullRequestReviewDecision;
	mergeState: PullRequestMergeState;
	activity: readonly PullRequestActivity[];
	url: string;
	guidedReview: PullRequestGuidedReview | null;
}

const GUIDED_REVIEW_FILES = [
	{
		id: "guest-checkout-flow",
		path: "components/storefront/checkout/guest-checkout-flow.tsx",
		status: "modified",
		language: "tsx",
		oldContents: `export function CheckoutFlow() {
	return <AccountSignIn onComplete={startCheckout} />;
}`,
		newContents: `export function CheckoutFlow() {
	return (
		<GuestCheckoutForm
			onSubmit={createGuestOrder}
			onRecoverableError={restoreCheckoutDraft}
		/>
	);
}`,
		additions: 34,
		deletions: 8,
		defaultExpanded: true,
		explorerPath: "components/storefront/checkout/guest-checkout-flow.tsx",
		code: `diff --git a/components/storefront/checkout/guest-checkout-flow.tsx b/components/storefront/checkout/guest-checkout-flow.tsx
@@ -42,8 +42,15 @@ export function CheckoutFlow() {
-\treturn <AccountSignIn onComplete={startCheckout} />;
+\treturn (
+\t\t<GuestCheckoutForm
+\t\t\tonSubmit={createGuestOrder}
+\t\t\tonRecoverableError={restoreCheckoutDraft}
+\t\t/>
+\t);
 }`,
	},
	{
		id: "guest-orders-route",
		path: "backend/routes/guest-orders.js",
		status: "modified",
		language: "javascript",
		oldContents: `router.post("/guest-orders", async (req, res) => {
	const order = await orders.create(req.body);
	res.status(201).json({ orderId: order.id });
});`,
		newContents: `router.post("/guest-orders", async (req, res) => {
	const order = await guestOrderService.create({
		cartId: req.body.cartId,
		delivery: req.body.delivery,
		email: req.body.email,
	});
	res.status(201).json({ orderId: order.id });
});`,
		additions: 24,
		deletions: 6,
		defaultExpanded: false,
		explorerPath: "backend/routes/guest-orders.js",
		code: `diff --git a/backend/routes/guest-orders.js b/backend/routes/guest-orders.js
@@ -8,6 +8,13 @@ router.post("/guest-orders", async (req, res) => {
-\tconst order = await orders.create(req.body);
+\tconst order = await guestOrderService.create({
+\t\tcartId: req.body.cartId,
+\t\tdelivery: req.body.delivery,
+\t\temail: req.body.email,
+\t});
 \tres.status(201).json({ orderId: order.id });
 });`,
	},
	{
		id: "guest-order-service",
		path: "backend/services/guest-order-service.js",
		status: "modified",
		language: "javascript",
		oldContents: `export async function createGuestOrder(input) {
	return commerceClient.orders.create(input);
}`,
		newContents: `export async function createGuestOrder(input) {
	const order = await commerceClient.orders.create({
		...input,
		customerMode: "guest",
	});
	return { id: order.id, recoveryToken: order.recoveryToken };
}`,
		additions: 18,
		deletions: 4,
		defaultExpanded: false,
		explorerPath: "backend/services/guest-order-service.js",
		code: `diff --git a/backend/services/guest-order-service.js b/backend/services/guest-order-service.js
@@ -15,7 +15,12 @@ export async function createGuestOrder(input) {
-\treturn commerceClient.orders.create(input);
+\tconst order = await commerceClient.orders.create({
+\t\t...input,
+\t\tcustomerMode: "guest",
+\t});
+\treturn { id: order.id, recoveryToken: order.recoveryToken };
 }`,
	},
	{
		id: "guest-checkout-spec",
		path: "tests/storefront/guest-checkout.spec.ts",
		status: "modified",
		language: "typescript",
		oldContents: `test("guest checkout", async ({ page }) => {
	await page.goto("/checkout");
});`,
		newContents: `test("guest checkout", async ({ page }) => {
	await page.goto("/checkout");
	await page.getByRole("button", { name: "Checkout as guest" }).click();
	await page.getByLabel("Email").fill("guest@example.com");
	await page.getByRole("button", { name: "Place order" }).click();
	await expect(page.getByRole("heading", { name: "Order confirmed" })).toBeVisible();
});`,
		additions: 10,
		deletions: 3,
		defaultExpanded: false,
		explorerPath: "tests/storefront/guest-checkout.spec.ts",
		code: `diff --git a/tests/storefront/guest-checkout.spec.ts b/tests/storefront/guest-checkout.spec.ts
@@ -21,6 +21,11 @@ test("guest checkout", async ({ page }) => {
+\tawait page.getByRole("button", { name: "Checkout as guest" }).click();
+\tawait page.getByLabel("Email").fill("guest@example.com");
+\tawait page.getByRole("button", { name: "Place order" }).click();
+\tawait expect(page.getByRole("heading", { name: "Order confirmed" })).toBeVisible();
 });`,
	},
] as const satisfies readonly PullRequestReviewFile[];

const GUIDED_REVIEW: PullRequestGuidedReview = {
	summary: [
		"Lets shoppers complete checkout without creating an account.",
		"Keeps privileged order creation on the server behind a dedicated guest-order route.",
		"Preserves checkout details after recoverable errors and verifies the full guest flow.",
	],
	description: `Adds a guest checkout path so shoppers can finish purchase without creating an account, while keeping privileged commerce work on the server.

#### Summary

- Lets shoppers complete checkout without creating an account.
- Keeps privileged order creation on the server behind a dedicated guest-order route.
- Preserves checkout details after recoverable errors and verifies the full guest flow.

#### Changes

- **Storefront guest flow** — Replace the account-required checkout entry with \`GuestCheckoutForm\`, wired to \`createGuestOrder\` and \`restoreCheckoutDraft\` so delivery and contact details survive recoverable failures.
- **Guest-order route** — Narrow \`POST /guest-orders\` to accept cart, delivery, and email only, then delegate to \`guestOrderService.create\` instead of creating orders from the raw request body.
- **Server-owned order service** — Create guest orders with \`customerMode: "guest"\` and return a recovery token so the client can resume safely after validation or payment issues.
- **Browser coverage** — Extend the guest checkout Playwright spec to click “Checkout as guest”, submit email, place the order, and assert the confirmation heading.

#### Test plan

- [ ] From cart or sign-in, choose **Checkout as guest** and complete delivery → payment → confirmation without creating an account
- [ ] Confirm declined payments and recoverable validation errors keep safe checkout fields populated
- [ ] Retry a failed submission and verify the guest-order route does not create a duplicate order
- [ ] Spot-check that privileged pricing / inventory / order creation still runs only through the guest-order service
- [ ] Run lint, unit tests, and the guest checkout browser suite`,
	chapters: [
		{
			id: "start-guest-checkout",
			title: "Start a guest checkout",
			description: "Follow the new storefront path from the guest choice through validated delivery details.",
			fileIds: ["guest-checkout-flow"],
		},
		{
			id: "server-owned-order",
			title: "Keep order creation server-owned",
			description: "Review the narrow API boundary and the service that owns privileged commerce calls.",
			fileIds: ["guest-orders-route", "guest-order-service"],
		},
		{
			id: "recover-and-verify",
			title: "Recover safely and verify the flow",
			description: "Check recoverable-error behavior and the browser test that completes a guest order.",
			fileIds: ["guest-checkout-flow", "guest-checkout-spec"],
		},
	],
	files: GUIDED_REVIEW_FILES,
};

const VENN: PullRequestActivityActor = {
	id: "venn",
	name: "Venn",
	kind: "person",
	avatarSrc: "/avatar-user/venn/venn.png",
};

const CODE_PLANNER: PullRequestActivityActor = {
	id: "code-planner",
	name: "Code Planner",
	kind: "agent",
	avatarSrc: "/avatar-agent/dev-agents/code-planner.svg",
};

const UNIT_TEST_CREATOR: PullRequestActivityActor = {
	id: "unit-test-creator",
	name: "Unit Test Creator",
	kind: "agent",
	avatarSrc: "/avatar-agent/dev-agents/unit-test-creator.svg",
};

const GITHUB: PullRequestActivityActor = {
	id: "github",
	name: "GitHub",
	kind: "app",
};

const GUIDED_REVIEW_REPO_COMMIT_URL = "https://github.com/eevensoh/vpk-rovo/commit";

const GUIDED_REVIEW_COMMITS: readonly PullRequestCommit[] = [
	{
		id: "5f02a91",
		shortSha: "5f02a91",
		title: "Add the guest checkout storefront flow",
		author: VENN,
		timestamp: "17 minutes ago",
		additions: 34,
		deletions: 8,
		url: `${GUIDED_REVIEW_REPO_COMMIT_URL}/5f02a91`,
	},
	{
		id: "91c73d4",
		shortSha: "91c73d4",
		title: "Keep guest order creation server-owned",
		author: CODE_PLANNER,
		timestamp: "15 minutes ago",
		additions: 24,
		deletions: 6,
		url: `${GUIDED_REVIEW_REPO_COMMIT_URL}/91c73d4`,
	},
	{
		id: "a2f74c1",
		shortSha: "a2f74c1",
		title: "Preserve checkout drafts after recoverable failures",
		author: VENN,
		timestamp: "12 minutes ago",
		additions: 18,
		deletions: 4,
		url: `${GUIDED_REVIEW_REPO_COMMIT_URL}/a2f74c1`,
	},
	{
		id: "d34c112",
		shortSha: "d34c112",
		title: "Cover declined payments and idempotent retries",
		author: UNIT_TEST_CREATOR,
		timestamp: "10 minutes ago",
		additions: 10,
		deletions: 3,
		url: `${GUIDED_REVIEW_REPO_COMMIT_URL}/d34c112`,
	},
	{
		id: "8b4e6fa",
		shortSha: "8b4e6fa",
		title: "Fix nullable delivery-address validation in CI",
		author: VENN,
		timestamp: "5 minutes ago",
		additions: 7,
		deletions: 2,
		url: `${GUIDED_REVIEW_REPO_COMMIT_URL}/8b4e6fa`,
	},
	{
		id: "f8cc291",
		shortSha: "f8cc291",
		title: "Tighten checkout keyboard coverage",
		author: UNIT_TEST_CREATOR,
		timestamp: "3 minutes ago",
		additions: 5,
		deletions: 1,
		url: `${GUIDED_REVIEW_REPO_COMMIT_URL}/f8cc291`,
	},
];

const GUIDED_REVIEW_CHECKS: readonly PullRequestCheck[] = [
	{
		id: "lint-types",
		name: "Lint and typecheck",
		status: "passed",
		details: "Completed in 1m 18s",
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

const GUIDED_REVIEW_ACTIVITY: readonly PullRequestActivity[] = [
	{
		id: "opened",
		kind: "opened",
		actor: VENN,
		occurredAtMs: Date.UTC(2026, 7, 10, 1, 42),
		timestamp: "18 minutes ago",
		baseBranch: "main",
		headBranch: "feature/shop-4821-guest-checkout",
	},
	{
		id: "commits-pushed",
		kind: "commits-pushed",
		actor: VENN,
		occurredAtMs: Date.UTC(2026, 7, 10, 1, 48),
		timestamp: "12 minutes ago",
		commitCount: GUIDED_REVIEW_COMMITS.length,
		headSha: GUIDED_REVIEW_COMMITS.at(-1)?.shortSha ?? "f8cc291",
	},
	{
		id: "checks-completed",
		kind: "checks-completed",
		actor: GITHUB,
		occurredAtMs: Date.UTC(2026, 7, 10, 1, 52),
		timestamp: "8 minutes ago",
		passed: GUIDED_REVIEW_CHECKS.filter((check) => check.status === "passed").length,
		total: GUIDED_REVIEW_CHECKS.length,
	},
	{
		id: "code-planner-review",
		kind: "review-submitted",
		actor: CODE_PLANNER,
		occurredAtMs: Date.UTC(2026, 7, 10, 1, 54),
		timestamp: "6 minutes ago",
		decision: "approved",
		body: "Order creation stays server-owned, and the route forwards only the fields the guest-order service accepts.",
		filePath: "backend/services/guest-order-service.js",
	},
	{
		id: "unit-test-creator-review",
		kind: "review-submitted",
		actor: UNIT_TEST_CREATOR,
		occurredAtMs: Date.UTC(2026, 7, 10, 1, 56),
		timestamp: "4 minutes ago",
		decision: "approved",
		body: "The browser flow covers guest selection, safe input recovery, server validation, and the final confirmation state.",
		filePath: "tests/storefront/guest-checkout.spec.ts",
	},
	{
		id: "thread-resolved",
		kind: "thread-resolved",
		actor: VENN,
		occurredAtMs: Date.UTC(2026, 7, 10, 1, 57),
		timestamp: "3 minutes ago",
		filePath: "backend/services/guest-order-service.js",
	},
	{
		id: "ready-to-merge",
		kind: "ready-to-merge",
		actor: GITHUB,
		occurredAtMs: Date.UTC(2026, 7, 10, 1, 58),
		timestamp: "2 minutes ago",
	},
];

const GUIDED_REVIEW_REVIEWERS: readonly PullRequestReviewer[] = [
	{ ...CODE_PLANNER, status: "approved" },
	{ ...UNIT_TEST_CREATOR, status: "approved" },
];

const GUIDED_REVIEW_LABELS: readonly PullRequestLabel[] = [
	{ id: "checkout", name: "checkout", color: "blue" },
	{ id: "customer-experience", name: "customer experience", color: "purple" },
];

function fallbackPullRequestUrl(repository: string, number: number): string {
	return repository ? `https://github.com/${repository}/pull/${number}` : "https://github.com";
}

function resolvePullRequestProvider(url: string | undefined): PullRequestProvider {
	if (url?.includes("bitbucket.org")) return { id: "bitbucket", name: "Bitbucket" };
	if (url?.includes("gitlab.com")) return { id: "gitlab", name: "GitLab" };
	if (!url || url.includes("github.com")) return { id: "github", name: "GitHub" };
	return { id: "other", name: "Source code provider" };
}

function resolveGuidedReviewActivity(
	checks: readonly PullRequestCheck[],
	mergeState: PullRequestMergeState,
): readonly PullRequestActivity[] {
	const passed = checks.filter((check) => check.status === "passed").length;
	const checkActivityTemplate = GUIDED_REVIEW_ACTIVITY.find(
		(activity): activity is Extract<PullRequestActivity, { kind: "checks-completed" }> => (
			activity.kind === "checks-completed"
		),
	);
	if (!checkActivityTemplate) return GUIDED_REVIEW_ACTIVITY;
	const checkActivity: PullRequestActivity = {
		...checkActivityTemplate,
		passed,
		total: checks.length,
	};

	if (mergeState === "blocked") {
		return [GUIDED_REVIEW_ACTIVITY[0], GUIDED_REVIEW_ACTIVITY[1], checkActivity];
	}

	return GUIDED_REVIEW_ACTIVITY.map((activity) => (
		activity.kind === "checks-completed" ? checkActivity : activity
	));
}

/**
 * Whether the CI checks section title should show an indeterminate Spinner.
 * A blocked merge can be fully settled on a failed check, so only non-terminal
 * check rows count as progress.
 */
export function arePullRequestChecksInProgress(
	checks: readonly PullRequestCheck[],
): boolean {
	return checks.some((check) => check.status === "running" || check.status === "queued");
}

/** Keep merge status aligned with the rail CI checklist when SCM omits mergeState. */
function resolveMergeState(
	status: "Open" | "Merged",
	explicit: PullRequestMergeState | undefined,
	checks: readonly PullRequestCheck[],
	isGuidedReview: boolean,
): PullRequestMergeState {
	if (status === "Merged") return "merged";
	if (explicit) return explicit;
	if (checks.some((check) => check.status !== "passed")) return "blocked";
	return isGuidedReview ? "ready" : "blocked";
}

export function resolvePullRequestDetailData(
	entry: Readonly<JiraActivityEventEntry>,
): PullRequestDetailData | null {
	const pullRequest = entry.pullRequest;
	if (!pullRequest) return null;

	const identity = getPullRequestIdentity(pullRequest);
	const repository = pullRequest.repository ?? "Repository unavailable";
	const repositoryIdentity = pullRequest.repository
		? `${pullRequest.repository}#${pullRequest.number}`
		: `#${pullRequest.number}`;
	const guidedReview = identity === GUIDED_REVIEW_PULL_REQUEST_IDENTITY
		|| repositoryIdentity === GUIDED_REVIEW_PULL_REQUEST_IDENTITY
		? GUIDED_REVIEW
		: null;
	const url = pullRequest.url ?? fallbackPullRequestUrl(pullRequest.repository ?? "", pullRequest.number);
	const isGuidedReview = guidedReview !== null;
	const commits = pullRequest.commits ?? (isGuidedReview ? GUIDED_REVIEW_COMMITS : []);
	const checks = pullRequest.checks ?? (isGuidedReview ? GUIDED_REVIEW_CHECKS : []);
	const reviewDecision = pullRequest.reviewDecision ?? (isGuidedReview ? "approved" : "not-required");
	const mergeState = resolveMergeState(
		pullRequest.status,
		pullRequest.mergeState,
		checks,
		isGuidedReview,
	);
	return {
		identity,
		number: pullRequest.number,
		title: pullRequest.title,
		description: guidedReview?.description ?? "",
		repository,
		status: pullRequest.status,
		authorName: pullRequest.authorName ?? (isGuidedReview ? VENN.name : "Unknown author"),
		authorAvatarSrc: isGuidedReview ? (VENN.avatarSrc ?? undefined) : undefined,
		baseBranch: guidedReview ? "main" : null,
		headBranch: guidedReview ? "feature/shop-4821-guest-checkout" : null,
		additions: pullRequest.additions,
		deletions: pullRequest.deletions,
		provider: resolvePullRequestProvider(url),
		reviewers: isGuidedReview ? GUIDED_REVIEW_REVIEWERS : [],
		labels: isGuidedReview ? GUIDED_REVIEW_LABELS : [],
		commits,
		checks,
		createdTime: isGuidedReview ? "18 minutes ago" : entry.timestamp,
		updatedTime: entry.timestamp,
		reviewDecision,
		mergeState,
		activity: isGuidedReview ? resolveGuidedReviewActivity(checks, mergeState) : [],
		url,
		guidedReview,
	};
}
