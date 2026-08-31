import { expect, test, type Page } from "@playwright/test";

const JIRA_GOLDEN_JOURNEYS_V4_URL = (
	process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000"
) + "/jira-golden-journeys-v4";

async function openBoard(page: Page): Promise<void> {
	await page.goto(JIRA_GOLDEN_JOURNEYS_V4_URL, { waitUntil: "domcontentloaded" });
	await expect(page.getByRole("heading", { name: "Jira Design" })).toBeVisible({
		timeout: 15_000,
	});
}

async function openAgentViewMenu(page: Page): Promise<void> {
	await page.getByRole("button", { name: "Configure board view" }).click();
	// Click, not hover: Base UI does not reliably expand this submenu on hover.
	await page.getByRole("menuitem", { name: "Agent" }).click();
}

test("Untracked is on by default and PAY-101 shows a nearby untracked row", async ({ page }) => {
	await openBoard(page);

	const pay101Stack = page.locator("[data-issue-key='PAY-101']");
	await expect(pay101Stack.getByTestId("agent-session-row-lw-scope-thread")).toBeVisible();

	await openAgentViewMenu(page);
	await expect(page.getByRole("menuitemcheckbox", { name: "Untracked" })).toBeChecked();
});

test("unchecking Untracked hides board-adjacent rows and leaves the column", async ({ page }) => {
	await openBoard(page);

	const pay101Proximity = page.locator("[data-issue-key='PAY-101']")
		.getByTestId("agent-session-row-lw-scope-thread");
	await expect(pay101Proximity).toBeVisible();
	await expect(page.getByLabel(/^Untracked work,/u)).toBeVisible();

	await openAgentViewMenu(page);
	await page.getByRole("menuitemcheckbox", { name: "Untracked" }).click();

	await expect(pay101Proximity).toHaveCount(0);
	await expect(page.getByLabel(/^Untracked work,/u)).toBeVisible();
	await expect(
		page.locator("[data-agent-session-column]").getByTestId("agent-session-row-lw-scope-thread"),
	).toBeVisible();
});

test("hovering a column session for PAY-121 spotlights that issue", async ({ page }) => {
	await openBoard(page);

	const columnSession = page.locator("[data-agent-session-column]")
		.getByTestId("agent-session-row-lw-kickoff-killswitch-session");
	await columnSession.hover();

	const pay121 = page.locator("[data-issue-key='PAY-121']");
	const pay101 = page.locator("[data-issue-key='PAY-101']");
	await expect(pay121).toHaveClass(/bg-bg-accent-blue-subtlest/);
	await expect(pay101).toHaveClass(/opacity-40/);
	await expect(page.getByLabel(/^Untracked work,/u)).not.toHaveClass(/opacity-40/);
});

test("hover auto-scroll keeps Untracked frozen and allows the status pane to scroll back", async ({ page }) => {
	await openBoard(page);

	const untrackedColumn = page.getByLabel(/^Untracked work,/u);
	const statusScrollport = page.locator("[data-jira-kanban-scrollport]");
	const frozenLeft = (await untrackedColumn.boundingBox())?.x;
	const columnSession = page.locator("[data-agent-session-column]")
		.getByTestId("agent-session-row-lw-kickoff-killswitch-session");
	const pay121 = page.locator("[data-issue-key='PAY-121']");
	const pay121ColumnScrollport = pay121.locator("xpath=ancestor::*[@data-jira-kanban-card-list]");

	await columnSession.hover();
	await expect.poll(
		() => statusScrollport.evaluate((element) => element.scrollLeft),
	).toBeGreaterThan(0);
	await expect.poll(
		() => pay121ColumnScrollport.evaluate((element) => element.scrollTop),
	).toBeGreaterThan(0);

	await statusScrollport.evaluate((element) => {
		element.scrollTo({ behavior: "instant", left: 0 });
	});
	await pay121ColumnScrollport.evaluate((element) => {
		element.scrollTo({ behavior: "instant", top: 0 });
	});
	await page.waitForTimeout(500);

	expect(await statusScrollport.evaluate((element) => element.scrollLeft)).toBe(0);
	expect(await pay121ColumnScrollport.evaluate((element) => element.scrollTop)).toBe(0);
	expect((await untrackedColumn.boundingBox())?.x).toBe(frozenLeft);
	await expect(pay121).toHaveClass(/bg-bg-accent-blue-subtlest/);
});
