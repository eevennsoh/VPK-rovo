import { expect, test, type Locator, type Page } from "@playwright/test";

const JIRA_GOLDEN_JOURNEYS_V4_URL = (
	process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000"
) + "/jira-golden-journeys-v4";

async function openBoard(page: Page): Promise<void> {
	await page.goto(JIRA_GOLDEN_JOURNEYS_V4_URL, { waitUntil: "domcontentloaded" });
	await expect(page.getByRole("heading", { name: "Jira Design" })).toBeVisible({
		timeout: 15_000,
	});
	const expandUntracked = page.getByRole("button", { name: "Expand Untracked work column" });
	if (await expandUntracked.isVisible()) {
		await expandUntracked.click();
	}
}

async function openAgentViewMenu(page: Page): Promise<void> {
	await page.getByRole("button", { name: "Configure board view" }).click();
	// Click, not hover: Base UI does not reliably expand this submenu on hover.
	await page.getByRole("menuitem", { name: "Agent" }).click();
}

function getIssueArticle(page: Page, issueKey: string): Locator {
	return page.locator("article", {
		has: page.getByText(issueKey, { exact: true }),
	}).first();
}

function getIssueDropZone(page: Page, issueKey: string): Locator {
	return page.locator(
		`[data-board-agent-session-drop-zone="issue"][data-issue-key="${issueKey}"]`,
	);
}

async function getUntrackedSessionCount(page: Page): Promise<number> {
	const label = await page.getByLabel(/^Untracked work,/u).getAttribute("aria-label");
	const count = Number(label?.match(/\d+/u)?.[0]);
	expect(Number.isFinite(count)).toBe(true);
	return count;
}

async function dragPointer(
	source: Locator,
	target: Locator,
	page: Page,
): Promise<void> {
	const sourceBox = await source.boundingBox();
	const targetBox = await target.boundingBox();
	expect(sourceBox).not.toBeNull();
	expect(targetBox).not.toBeNull();
	if (!sourceBox || !targetBox) return;

	const sourcePoint = {
		x: sourceBox.x + sourceBox.width / 2,
		y: sourceBox.y + sourceBox.height / 2,
	};
	await page.mouse.move(sourcePoint.x, sourcePoint.y);
	await page.mouse.down();
	await page.mouse.move(sourcePoint.x + 4, sourcePoint.y + 4);
	await page.mouse.move(
		targetBox.x + targetBox.width / 2,
		targetBox.y + targetBox.height / 2,
		{ steps: 12 },
	);
	if (await target.getAttribute("data-board-agent-session-drop-zone") === "issue") {
		await expect(target).toHaveAttribute("data-board-agent-session-target", "attach");
	}
	const dragOverlay = page.locator("[data-session-drag-overlay]");
	await expect(dragOverlay).toHaveCount(1);
	expect(await dragOverlay.evaluate((node) => node.parentElement === document.body)).toBe(true);
	await page.mouse.up();
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

test("hovering a column session leaves Jira issues unfocused and unmoved", async ({ page }) => {
	await openBoard(page);

	const statusScrollport = page.locator("[data-jira-kanban-scrollport]");
	const pay121 = page.locator("[data-issue-key='PAY-121']");
	const pay101 = page.locator("[data-issue-key='PAY-101']");
	const pay121ColumnScrollport = pay121.locator("xpath=ancestor::*[@data-jira-kanban-card-list]");
	const columnSession = page.locator("[data-agent-session-column]")
		.getByTestId("agent-session-row-lw-kickoff-killswitch-session");

	const scrollLeftBefore = await statusScrollport.evaluate((element) => element.scrollLeft);
	const scrollTopBefore = await pay121ColumnScrollport.evaluate((element) => element.scrollTop);

	await columnSession.hover();

	await expect(pay121).not.toHaveClass(/bg-bg-accent-blue-subtlest/);
	await expect(pay101).not.toHaveClass(/opacity-40/);
	expect(await statusScrollport.evaluate((element) => element.scrollLeft)).toBe(scrollLeftBefore);
	expect(await pay121ColumnScrollport.evaluate((element) => element.scrollTop)).toBe(scrollTopBefore);
});

test("clicking a column session for PAY-121 spotlights that issue", async ({ page }) => {
	await openBoard(page);

	const columnSession = page.locator("[data-agent-session-column]")
		.getByTestId("agent-session-row-lw-kickoff-killswitch-session");
	await columnSession.click();

	const pay121 = page.locator("[data-issue-key='PAY-121']");
	const pay101 = page.locator("[data-issue-key='PAY-101']");
	await expect(pay121).toHaveClass(/bg-bg-accent-blue-subtlest/);
	await expect(pay101).toHaveClass(/opacity-40/);
	await expect(page.getByLabel(/^Untracked work,/u)).not.toHaveClass(/opacity-40/);
});

test("click auto-scroll keeps Untracked frozen and allows the status pane to scroll back", async ({ page }) => {
	await openBoard(page);

	const untrackedColumn = page.getByLabel(/^Untracked work,/u);
	const statusScrollport = page.locator("[data-jira-kanban-scrollport]");
	const frozenLeft = (await untrackedColumn.boundingBox())?.x;
	const columnSession = page.locator("[data-agent-session-column]")
		.getByTestId("agent-session-row-lw-kickoff-killswitch-session");
	const pay121 = page.locator("[data-issue-key='PAY-121']");
	const pay121ColumnScrollport = pay121.locator("xpath=ancestor::*[@data-jira-kanban-card-list]");

	await columnSession.click();
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

test("Untracked stays frozen while the status pane scrolls", async ({ page }) => {
	await openBoard(page);

	const untrackedColumn = page.getByLabel(/^Untracked work,/u);
	const statusScrollport = page.locator("[data-jira-kanban-scrollport]");
	const frozenLeft = (await untrackedColumn.boundingBox())?.x;

	await statusScrollport.evaluate((element) => {
		element.scrollTo({ behavior: "instant", left: 400 });
	});

	expect(await statusScrollport.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
	expect((await untrackedColumn.boundingBox())?.x).toBe(frozenLeft);

	await statusScrollport.evaluate((element) => {
		element.scrollTo({ behavior: "instant", left: 0 });
	});
	expect(await statusScrollport.evaluate((element) => element.scrollLeft)).toBe(0);
	expect((await untrackedColumn.boundingBox())?.x).toBe(frozenLeft);
});

test("a linked session moves atomically to another Jira work item", async ({ page }) => {
	await openBoard(page);

	const sourceCard = getIssueArticle(page, "PAY-112");
	const sourceSession = sourceCard.getByRole("button", {
		name: /^Open Review Agent in Rovo chat:/u,
	});

	await dragPointer(sourceSession, getIssueDropZone(page, "PAY-118"), page);

	await expect(sourceCard.getByRole("button", {
		name: /^Open Review Agent in Rovo chat:/u,
	})).toHaveCount(0);
	await expect(getIssueArticle(page, "PAY-118").getByRole("button", {
		name: /^Open Review Agent in Rovo chat:/u,
	})).toBeVisible();
});

test("a linked session can detach and then attach to a different work item", async ({ page }) => {
	await openBoard(page);

	const sourceCard = getIssueArticle(page, "PAY-112");
	const sourceSession = sourceCard.getByRole("button", {
		name: /^Open Review Agent in Rovo chat:/u,
	});
	const sourceBox = await sourceSession.boundingBox();
	expect(sourceBox).not.toBeNull();
	if (!sourceBox) return;

	const sourcePoint = {
		x: sourceBox.x + sourceBox.width / 2,
		y: sourceBox.y + sourceBox.height / 2,
	};
	await page.mouse.move(sourcePoint.x, sourcePoint.y);
	await page.mouse.down();
	await page.mouse.move(sourcePoint.x + 4, sourcePoint.y + 4);
	const unlinkWell = sourceCard.getByRole("img", {
		name: /Unlink Review Agent from this work item/u,
	});
	await expect(unlinkWell).toBeVisible();
	const unlinkBox = await unlinkWell.boundingBox();
	expect(unlinkBox).not.toBeNull();
	if (!unlinkBox) return;
	await page.mouse.move(
		unlinkBox.x + unlinkBox.width / 2,
		unlinkBox.y + unlinkBox.height / 2,
		{ steps: 8 },
	);
	await page.mouse.up();

	const detachedSession = sourceCard.getByTestId("agent-session-row-PAY-112:review-agent");
	await expect(detachedSession).toBeVisible();
	await dragPointer(detachedSession, getIssueDropZone(page, "PAY-118"), page);

	await expect(detachedSession).toHaveCount(0);
	await expect(getIssueArticle(page, "PAY-118").getByRole("button", {
		name: /^Open Review Agent in Rovo chat:/u,
	})).toBeVisible();
});

test("an Untracked work card attaches to any Jira work item and leaves the column", async ({ page }) => {
	await openBoard(page);

	const untrackedColumn = page.locator("[data-agent-session-column]");
	const untrackedSession = untrackedColumn.getByTestId("agent-session-row-lw-scope-thread");
	const initialCount = await getUntrackedSessionCount(page);

	await dragPointer(untrackedSession, getIssueDropZone(page, "PAY-118"), page);

	await expect(untrackedColumn.getByTestId("agent-session-row-lw-scope-thread")).toHaveCount(0);
	await expect(page.getByLabel(`Untracked work, ${initialCount - 1} sessions`)).toBeVisible();
	await expect(getIssueArticle(page, "PAY-118").getByRole("button", {
		name: /^Open Claude in Rovo chat:/u,
	})).toBeVisible();
});

test("releasing an Untracked work drag outside a Jira target makes no change", async ({ page }) => {
	await openBoard(page);

	const untrackedColumn = page.locator("[data-agent-session-column]");
	const untrackedSession = untrackedColumn.getByTestId("agent-session-row-lw-scope-thread");
	const initialCount = await getUntrackedSessionCount(page);
	await dragPointer(untrackedSession, page.getByRole("heading", { name: "Jira Design" }), page);

	await expect(untrackedSession).toBeVisible();
	await expect(page.getByLabel(`Untracked work, ${initialCount} sessions`)).toBeVisible();
	await expect(getIssueArticle(page, "PAY-118").getByRole("button", {
		name: /^Open Claude in Rovo chat:/u,
	})).toHaveCount(0);
});

test("session flyouts close for a Jira card drag and recover after drag end", async ({ page }) => {
	await openBoard(page);

	const sourceCard = getIssueArticle(page, "PAY-112");
	const sourceSession = sourceCard.getByRole("button", {
		name: /^Open Review Agent in Rovo chat:/u,
	});
	const nextSession = getIssueArticle(page, "PAY-123").getByRole("button", {
		name: "Open Claude Code in Rovo chat: Working",
	});
	const flyout = page.locator("[data-slot='hover-card-content']");
	await sourceSession.hover();
	await expect(flyout).toBeVisible();

	const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
	await sourceCard.dispatchEvent("dragstart", { dataTransfer });
	await expect(flyout).toHaveCount(0);
	await nextSession.hover();
	await page.waitForTimeout(250);
	await expect(flyout).toHaveCount(0);

	await sourceCard.dispatchEvent("dragend", { dataTransfer });
	await page.getByRole("heading", { name: "Jira Design" }).hover();
	await nextSession.hover();
	await expect(flyout).toBeVisible();
});

test("a stationary linked-session click still opens Rovo chat without detaching", async ({ page }) => {
	await openBoard(page);

	const sourceCard = getIssueArticle(page, "PAY-112");
	const sourceSession = sourceCard.getByRole("button", {
		name: /^Open Review Agent in Rovo chat:/u,
	});
	await sourceSession.click();

	await expect(page.locator("[data-rovo-chat-placement='floating']")).toBeVisible();
	await expect(sourceSession).toBeVisible();
	await expect(sourceCard.getByTestId("agent-session-row-PAY-112:review-agent")).toHaveCount(0);
});
