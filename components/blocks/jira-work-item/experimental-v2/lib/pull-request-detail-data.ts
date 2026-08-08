import type { JiraActivityEventEntry } from "@/components/blocks/jira-activity";
import type { ChangedFile } from "@/components/blocks/code-review";
import type { CodeListItem } from "@/components/ui-custom/code-list";

import { getPullRequestIdentity } from "./jira-activity-adapter";

const GUIDED_REVIEW_PULL_REQUEST_IDENTITY = "eevensoh/vpk-rovo#1847";

export interface PullRequestGuideChapter {
	id: string;
	title: string;
	description: string;
	fileIds: readonly string[];
}

export interface PullRequestTestGroup {
	id: string;
	label: string;
	checks: number;
	status: "passed";
}

export interface PullRequestDiscussion {
	id: string;
	author: string;
	avatarSrc?: string;
	type?: string;
	body: string;
	timestamp: string;
	filePath?: string;
	resolved?: boolean;
}

export interface PullRequestGuidedReview {
	summary: readonly string[];
	testGroups: readonly PullRequestTestGroup[];
	totalChecks: number;
	discussion: readonly PullRequestDiscussion[];
	chapters: readonly PullRequestGuideChapter[];
	files: readonly PullRequestReviewFile[];
}

export type PullRequestReviewFile = ChangedFile & CodeListItem;

export interface PullRequestDetailData {
	identity: string;
	number: number;
	title: string;
	repository: string;
	status: "Open" | "Merged";
	authorName: string;
	authorAvatarSrc?: string;
	baseBranch: string | null;
	headBranch: string | null;
	additions: number;
	deletions: number;
	updatedTime: string;
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
	testGroups: [
		{ id: "checkout-ui", label: "Guest checkout UI", checks: 4, status: "passed" },
		{ id: "guest-order-route", label: "Guest order route", checks: 4, status: "passed" },
		{ id: "guest-order-service", label: "Guest order service", checks: 3, status: "passed" },
		{ id: "recovery", label: "Checkout recovery", checks: 3, status: "passed" },
		{ id: "browser-flow", label: "Guest checkout browser flow", checks: 4, status: "passed" },
	],
	totalChecks: 18,
	discussion: [
		{
			id: "github-actions-verification",
			author: "github-actions",
			type: "bot",
			body: "All 18 checks passed. The guest checkout preview is ready for review.",
			timestamp: "2 minutes ago",
		},
		{
			id: "code-planner-review",
			author: "Code Planner",
			avatarSrc: "/avatar-agent/dev-agents/code-planner.svg",
			type: "reviewed",
			body: "Order creation stays server-owned, and the route forwards only the fields the guest-order service accepts.",
			timestamp: "6 minutes ago",
			filePath: "backend/services/guest-order-service.js",
			resolved: true,
		},
		{
			id: "unit-test-creator-review",
			author: "Unit Test Creator",
			avatarSrc: "/avatar-agent/dev-agents/unit-test-creator.svg",
			type: "reviewed",
			body: "The browser flow covers guest selection, safe input recovery, server validation, and the final confirmation state.",
			timestamp: "4 minutes ago",
			filePath: "tests/storefront/guest-checkout.spec.ts",
			resolved: true,
		},
	],
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

function fallbackPullRequestUrl(repository: string, number: number): string {
	return repository ? `https://github.com/${repository}/pull/${number}` : "https://github.com";
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
	return {
		identity,
		number: pullRequest.number,
		title: pullRequest.title,
		repository,
		status: pullRequest.status,
		authorName: pullRequest.authorName ?? "Unknown author",
		authorAvatarSrc: guidedReview ? "/avatar-user/venn/venn.png" : undefined,
		baseBranch: guidedReview ? "main" : null,
		headBranch: guidedReview ? "feature/shop-4821-guest-checkout" : null,
		additions: pullRequest.additions,
		deletions: pullRequest.deletions,
		updatedTime: entry.timestamp,
		url: pullRequest.url ?? fallbackPullRequestUrl(pullRequest.repository ?? "", pullRequest.number),
		guidedReview,
	};
}
