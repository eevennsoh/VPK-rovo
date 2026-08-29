import { expect, test, type Page } from "@playwright/test";

const JIRA_GOLDEN_JOURNEYS_V4_URL = (
	process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000"
) + "/jira-golden-journeys-v4";

async function openBoard(page: Page): Promise<void> {
	await page.goto(JIRA_GOLDEN_JOURNEYS_V4_URL, { waitUntil: "domcontentloaded" });
	await expect(page.getByRole("heading", { name: "Jira Design" })).toBeVisible();
}

test("the Payments board is the only Golden Journeys content inside Jira chrome", async ({ page }) => {
	await openBoard(page);

	await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeVisible();
	await expect(page.getByRole("button", { name: "For you" })).not.toBeInViewport();
	await expect(page.getByLabel("Create", { exact: true })).toBeVisible();
	await expect(page.getByRole("button", { name: "Ask Rovo" })).toBeVisible();
	await expect(page.getByRole("heading", { name: "Jira Golden Journeys v4" })).toHaveCount(0);
	await expect(page.getByRole("group", {
		name: "Open a software delivery story chapter",
	})).toHaveCount(0);
	await expect(page.getByRole("button", { name: "Jump to chapter" })).toHaveCount(0);
	const tabs = page.getByRole("tablist");
	await expect(tabs).toBeVisible();
	await expect(tabs.getByRole("tab")).toHaveCount(7);
	await expect(tabs.getByRole("tab", { name: "Board" })).toHaveAttribute("aria-selected", "true");

	const columns = page.locator("[data-jira-kanban-column]");
	await expect(columns).toHaveCount(4);
	await expect(columns.nth(0).locator("[data-variant='default']")).toHaveCount(4);
	await expect(columns.nth(1).locator("[data-variant='default']")).toHaveCount(4);
	await expect(columns.nth(2).locator("[data-variant='default']")).toHaveCount(8);
	await expect(columns.nth(3).locator("[data-variant='default']")).toHaveCount(4);
});

test("the Jira tabs switch away from and back to the board", async ({ page }) => {
	await openBoard(page);

	await page.getByRole("tab", { name: "Summary" }).click();
	await expect(
		page.getByRole("tabpanel", { name: /^Summary/u }).getByText("No RFP content here yet"),
	).toBeVisible();
	await expect(page.locator("[data-jira-kanban-column]")).toHaveCount(0);

	await page.getByRole("tab", { name: "Board" }).click();
	await expect(page.locator("[data-jira-kanban-column]")).toHaveCount(4);
});

test("Insights controls and content are absent from v4", async ({ page }) => {
	await openBoard(page);

	await expect(page.getByRole("button", { name: /^Insights/u })).toHaveCount(0);
	await expect(page.getByLabel("Open 3 new insights")).toHaveCount(0);
	await expect(page.getByRole("region", {
		name: "PAY · Payments SDK v2 migration insights",
	})).toHaveCount(0);
	await expect(page.locator("[data-jira-kanban-column]")).toHaveCount(4);
});

test("PAY-101 no longer leaves the board for a Build phase", async ({ page }) => {
	await openBoard(page);
	await page.getByRole("button", {
		name: /^Inventory every v1 call site across services and name an owner for each/u,
	}).click();

	await expect(page.locator("[data-jira-kanban-column]")).toHaveCount(4);
	await expect(page.getByRole("region", {
		name: "Inventory every v1 call site across services and name an owner for each",
	})).toHaveCount(0);
});

test("responsive Jira chrome releases and restores the sidebar without an update loop", async ({ page }) => {
	const consoleErrors: string[] = [];
	page.on("console", (message) => {
		if (message.type() === "error") consoleErrors.push(message.text());
	});
	await page.setViewportSize({ width: 1200, height: 800 });
	await openBoard(page);
	await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeVisible();
	await page.getByRole("button", { name: "Expand sidebar" }).click();
	await expect(page.getByRole("button", { name: "Collapse sidebar" })).toBeVisible();

	await page.setViewportSize({ width: 1000, height: 800 });
	await expect(page.getByRole("button", { name: "Collapse sidebar" })).toBeVisible();
	await page.setViewportSize({ width: 700, height: 800 });
	await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeVisible();
	await page.setViewportSize({ width: 1200, height: 800 });
	await expect(page.getByRole("button", { name: "Collapse sidebar" })).toBeVisible();

	expect(consoleErrors.filter((message) => message.includes("Maximum update depth exceeded"))).toEqual([]);
});

test("the board stays inside the Jira shell at short viewport heights", async ({ page }) => {
	await page.setViewportSize({ width: 1200, height: 640 });
	await openBoard(page);
	const board = page.getByRole("region", {
		name: "Track the Payments SDK v2 migration. Scroll horizontally to review all delivery statuses.",
	});
	const boardBox = await board.boundingBox();
	expect(boardBox).not.toBeNull();
	expect((boardBox?.y ?? 0) + (boardBox?.height ?? 0)).toBeLessThanOrEqual(640);
});
