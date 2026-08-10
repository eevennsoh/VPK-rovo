import {
	expect,
	test,
	type Locator,
	type Page,
} from "@playwright/test";

const JIRA_AGENTS_URL = `${
	process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000"
}/jira-agents`;

const CHAPTERS = ["Brief", "Plan", "Working", "Handoff", "Review", "Done"] as const;

function chapterButton(page: Page, name: (typeof CHAPTERS)[number]): Locator {
	return page.getByRole("button", { exact: true, name });
}

function orchestrationEntry(page: Page): Locator {
	return page.locator('[data-jira-activity-entry-id="story-channel-orchestration"]');
}

async function selectGalleryItem(page: Page, name: "Work Item"): Promise<void> {
	const openGallery = page.getByRole("button", { name: "Open gallery" });
	if (await openGallery.isVisible()) {
		await openGallery.click();
	}
	await page.getByRole("button", { name: `Select ${name}` }).click();
	await page.getByRole("button", { name: "Close gallery" }).click();
}

async function openWorkItem(page: Page): Promise<void> {
	await page.goto(JIRA_AGENTS_URL, { waitUntil: "domcontentloaded" });
	await selectGalleryItem(page, "Work Item");
	await expect(page.getByRole("group", { name: "Open a software delivery story chapter" })).toBeVisible();
	await expect(
		page.getByRole("region", { name: "Add guest checkout to the storefront" }),
	).toBeVisible();
}

async function selectChapter(
	page: Page,
	name: (typeof CHAPTERS)[number],
): Promise<void> {
	const button = chapterButton(page, name);
	await button.click();
	await expect(button).toHaveAttribute("aria-pressed", "true");
}

function sharedComposer(page: Page): Locator {
	return page.getByRole("textbox", {
		name: "Comment, @mention an agent, or / for skills",
	});
}

async function submitSharedComposer(page: Page, text: string): Promise<void> {
	await sharedComposer(page).fill(text);
	await page
		.locator("[data-jira-work-item-composer-dock]")
		.getByRole("button", { name: "Send" })
		.click();
}

async function expectWorkingAgents(page: Page, count: number): Promise<void> {
	const workingPill = page.getByRole("button", {
		name: new RegExp(`^${count} agents? working$`, "u"),
	});

	if (count === 0) {
		await expect(page.getByRole("button", { name: /^\d+ agents? working$/u })).toHaveCount(0);
		return;
	}

	await expect(workingPill).toBeVisible();
}

async function expectEyesReaction(page: Page, count: number): Promise<void> {
	const entry = orchestrationEntry(page);
	if (count === 0) {
		await expect(entry.getByRole("button", { name: /reacted with eyes$/u })).toHaveCount(0);
		return;
	}

	await expect(entry.getByRole("button", { name: `${count} reacted with eyes` })).toBeVisible();
}

test("the shared-channel story exposes six keyboard-selectable chapters and canonical working counts", async ({ page }) => {
	await openWorkItem(page);
	const description = page.getByRole("textbox", { name: "Work item description" });
	await expect(description).toContainText("Acceptance criteria");
	await expect(description).toContainText("Declined payments and recoverable validation errors do not clear safe customer input.");
	await expect(page.getByRole("link", { name: "Reduce storefront checkout abandonment" })).toBeVisible();
	await expect(page.getByRole("button", { name: "Change project" })).toContainText("Storefront Platform");
	await page.getByRole("button", { name: "See more" }).click();
	await expect(page.getByRole("button", { name: "Change parent" })).toContainText("Reduce storefront checkout abandonment");

	await page.getByRole("button", { name: "Subtasks · 1/3" }).click();
	const requirementsTask = page.getByRole("link", {
		name: "SHOP-4824: Define guest checkout requirements and success metrics Done",
	});
	const apiTask = page.getByRole("link", {
		name: "SHOP-4822: Build guest checkout and order-creation API In progress",
	});
	const storefrontStory = page.getByRole("link", {
		name: "SHOP-4823: Build and integrate the storefront checkout flow To do",
	});
	await expect(requirementsTask).toBeVisible();
	await expect(apiTask).toBeVisible();
	await expect(storefrontStory).toBeVisible();
	for (const workItem of [requirementsTask, apiTask, storefrontStory]) {
		const iconTile = workItem.locator('[data-slot="icon-tile"]');
		await expect(iconTile).toHaveCount(1);
	}

	await page.getByRole("button", { name: "Linked work items · 1" }).focus();
	await page.keyboard.press("Enter");
	const researchTask = page.getByRole("link", {
		name: "SHOP-4760: Research checkout abandonment and guest conversion Done",
	});
	await expect(researchTask).toBeVisible();
	await expect(researchTask.locator('[data-slot="icon-tile"]')).toHaveCount(1);

	const controls = page.getByRole("group", { name: "Open a software delivery story chapter" });
	await expect(controls.getByRole("button")).toHaveCount(CHAPTERS.length);
	for (const chapter of CHAPTERS) {
		await expect(chapterButton(page, chapter)).toBeVisible();
	}

	await expect(chapterButton(page, "Brief")).toHaveAttribute("aria-pressed", "true");
	await expectWorkingAgents(page, 0);
	await expect(orchestrationEntry(page)).toHaveCount(0);

	await chapterButton(page, "Brief").focus();
	await page.keyboard.press("Tab");
	await expect(chapterButton(page, "Plan")).toBeFocused();
	await page.keyboard.press("Enter");
	await expect(chapterButton(page, "Plan")).toHaveAttribute("aria-pressed", "true");
	await expectWorkingAgents(page, 3);
	await expectEyesReaction(page, 3);

	const progression = [
		["Working", 3],
		["Handoff", 2],
		["Review", 1],
		["Done", 0],
	] as const;
	for (const [chapter, count] of progression) {
		await selectChapter(page, chapter);
		await expectWorkingAgents(page, count);
		await expectEyesReaction(page, count);
	}
});

test("PR #1847 opens a selectable guided review and restores the exact description", async ({ page }) => {
	await openWorkItem(page);
	const description = page.getByRole("textbox", { name: "Work item description" });
	const originalDescription = await description.innerText();

	await selectChapter(page, "Review");
	const pullRequestsToggle = page.getByRole("button", { name: "Pull requests" });
	await pullRequestsToggle.click();
	await expect(pullRequestsToggle).toHaveAttribute("aria-pressed", "true");

	const pullRequestCard = page.locator('[data-jira-work-item-pull-request-card="1847"]');
	const pullRequestButton = pullRequestCard.getByRole("button", {
		name: /#1847: Add guest checkout to the storefront Open/u,
	});
	await pullRequestButton.hover();
	const flyoutLink = page
		.locator('[id^="smart-link-card-"]')
		.getByRole("link", { name: "#1847: Add guest checkout to the storefront" });
	await expect(flyoutLink).toHaveAttribute(
		"href",
		"https://github.com/eevensoh/vpk-rovo/pull/1847",
	);

	await pullRequestButton.click();
	await expect(pullRequestButton).toHaveAttribute("aria-pressed", "true");
	await expect(description).toHaveCount(0);
	const detail = page.locator("[data-jira-work-item-pull-request-detail]");
	await expect(detail).toBeVisible();
	await expect(detail.getByRole("heading", {
		name: "Add guest checkout to the storefront",
	})).toBeVisible();
	await expect(detail.getByText("main", { exact: true })).toBeVisible();
	await expect(detail.getByText("feature/shop-4821-guest-checkout", { exact: true })).toBeVisible();
	await expect(detail.getByText("Description", { exact: true })).toBeVisible();
	await expect(detail.getByText("Checks", { exact: true })).toHaveCount(0);
	await expect(detail.getByText("5 groups passed · 18 checks", { exact: true })).toHaveCount(0);
	await expect(page.getByText("CI checks")).toBeVisible();
	await expect(page.getByText("3/3 passed", { exact: true })).toBeVisible();
	await expect(page.getByText("Ready to merge", { exact: true })).toBeVisible();
	await page.getByRole("button", { name: /CI checks/u }).click();
	await expect(page.locator("[data-jira-work-item-pull-request-checks]")).toContainText(
		"Lint and typecheck",
	);
	await expect(detail.getByRole("button", { name: "Open in GitHub" })).toHaveAttribute(
		"href",
		"https://github.com/eevensoh/vpk-rovo/pull/1847",
	);

	await detail.getByRole("tab", { name: "Guide" }).click();
	const guide = detail.locator("[data-jira-work-item-pull-request-guide]");
	await expect(guide.getByText("01 / 03", { exact: true })).toBeVisible();
	await expect(guide.getByRole("heading", { name: "Start a guest checkout" })).toBeVisible();
	await expect(guide.getByRole("button", { name: "Back", exact: true })).toBeDisabled();
	await guide.getByRole("button", { name: "Next", exact: true }).click();
	await expect(guide.getByText("02 / 03", { exact: true })).toBeVisible();
	await expect(guide.getByRole("heading", {
		name: "Keep order creation server-owned",
	})).toBeVisible();
	await guide.getByRole("button", { name: "Next", exact: true }).click();
	await expect(guide.getByText("03 / 03", { exact: true })).toBeVisible();
	await guide.getByRole("button", { name: "Finish", exact: true }).click();
	await expect(detail.getByRole("tab", { name: "Overview" })).toHaveAttribute(
		"aria-selected",
		"true",
	);

	await detail.getByRole("tab", { name: "Files 4" }).click();
	const filesPanel = detail.getByRole("tabpanel", { name: "Files 4" });
	await expect(filesPanel.getByRole("tree", { name: "Code review files" })).toBeVisible();
	await expect(filesPanel.getByText("guest-checkout-flow.tsx", { exact: true })).toBeVisible();
	await expect(filesPanel.getByText("guest-orders.js", { exact: true })).toBeVisible();
	await expect(filesPanel.getByText("guest-order-service.js", { exact: true })).toBeVisible();
	await expect(filesPanel.getByText("guest-checkout.spec.ts", { exact: true })).toBeVisible();
	await expect(filesPanel.getByText(
		"components/storefront/checkout/guest-checkout-flow.tsx",
		{ exact: true },
	)).toBeVisible();

	await pullRequestButton.click();
	await expect(pullRequestButton).toHaveAttribute("aria-pressed", "false");
	await expect(description).toBeVisible();
	expect(await description.innerText()).toBe(originalDescription);

	await pullRequestButton.focus();
	await page.keyboard.press("Enter");
	await expect(detail).toBeVisible();
	await pullRequestButton.click();
	await expect(pullRequestButton).toHaveAttribute("aria-pressed", "false");
	await expect(description).toBeVisible();
	expect(await description.innerText()).toBe(originalDescription);

	await pullRequestButton.focus();
	await page.keyboard.press("Enter");
	await expect(detail).toBeVisible();
	await selectChapter(page, "Done");
	await expect(detail).toHaveCount(0);
	await expect(description).toBeVisible();
	expect(await description.innerText()).toBe(originalDescription);
});

test("Plan shows the working agent mentions followed by a Started working label", async ({ page }) => {
	await openWorkItem(page);
	await selectChapter(page, "Plan");

	const leadActivity = page.locator('[data-jira-activity-entry-id="story-lead-delegated"]');
	await expect(leadActivity.locator("[data-jira-activity-agent-mention]")).toHaveCount(3);
	for (const name of ["@Code Planner", "@GitHub Copilot", "@Unit Test Creator"]) {
		await expect(leadActivity.getByText(name, { exact: true })).toBeVisible();
	}
	await expect(leadActivity).toContainText("Started working");
	await expect(leadActivity).not.toContainText(/claimed the lead|delegated implementation|acceptance coverage/u);
});

test("Working broadcasts channel context without resolving the agent wait and reselecting resets the chapter", async ({ page }) => {
	await openWorkItem(page);
	await selectChapter(page, "Working");

	const workingPill = page.getByRole("button", { name: "3 agents working" });
	await workingPill.click();
	await expect(page.getByText("Waiting for Code Planner", { exact: true })).toBeVisible();
	await page.keyboard.press("Escape");
	await expect(workingPill).toBeFocused();
	await workingPill.click();
	await page.getByRole("heading", { name: "Jira Agents" }).click();
	await expect(page.getByText("Waiting for Code Planner", { exact: true })).toHaveCount(0);

	const broadcastText = "Keep guest checkout fast and do not create an account before purchase.";
	await submitSharedComposer(page, broadcastText);

	const broadcastEntry = page
		.locator("[data-jira-activity-entry-id]")
		.filter({ hasText: broadcastText });
	await expect(broadcastEntry).toBeVisible();
	await expect(broadcastEntry.getByRole("button", { name: "3 reacted with eyes" })).toBeVisible();
	await expect(
		page.locator('[data-jira-activity-entry-id="activity-story-session-github-copilot"]'),
	).toContainText("Waiting for Code Planner");

	await selectChapter(page, "Working");
	await expect(page.getByText(broadcastText, { exact: true })).toHaveCount(0);
	await expectWorkingAgents(page, 3);
	await expectEyesReaction(page, 3);
});

test("Brief multi-mentions launch all named agents once without directory duplicates", async ({ page }) => {
	await openWorkItem(page);
	await submitSharedComposer(
		page,
		"@Code Planner define the checkout contract, @GitHub Copilot implement it, @GitHub Copilot keep the branch scoped, and @Unit Test Creator verify it.",
	);

	await expectWorkingAgents(page, 3);
	const launchedEntries = page.locator('[data-jira-activity-entry-id^="activity-session-"]');
	await expect(launchedEntries).toHaveCount(3);
	for (const agentName of ["Code Planner", "GitHub Copilot", "Unit Test Creator"]) {
		await expect(launchedEntries.filter({ hasText: agentName })).toHaveCount(1);
	}
});

test("Jira Agents shows compact checkout automations instead of the shared empty state", async ({ page }) => {
	await openWorkItem(page);
	const automationDisclosure = page.getByRole("button", { name: "Automation · 4" });
	await expect(automationDisclosure).toBeVisible();
	await automationDisclosure.click();

	const rules = page.getByRole("list", { name: "Available automations" });
	await expect(page.getByRole("button", { exact: true, name: "Create automation" })).toBeVisible();
	await expect(rules.getByRole("button")).toHaveCount(4);
	for (const title of [
		"Reduce storefront checkout abandonment",
		"Validate guest checkout order totals",
		"Prevent duplicate payment on retry",
		"Run guest checkout regression suite",
	]) {
		await expect(rules.getByRole("button", { exact: true, name: title })).toBeVisible();
	}
	await expect(page.getByText("Create an automation to perform tasks", { exact: false })).toHaveCount(0);
	await expect(page.getByRole("button", { exact: true, name: "Manage automations" })).toBeVisible();

	const tileSizes = await rules.locator('[data-slot="icon-tile"]').evaluateAll((tiles) =>
		tiles.map((tile) => {
			const bounds = tile.getBoundingClientRect();
			return [bounds.width, bounds.height];
		}),
	);
	expect(tileSizes).toEqual([[24, 24], [24, 24], [24, 24], [24, 24]]);

	const rowBounds = await rules.locator(":scope > li").evaluateAll((rows) =>
		rows.map((row) => {
			const bounds = row.getBoundingClientRect();
			return { bottom: bounds.bottom, top: bounds.top };
		}),
	);
	for (let index = 1; index < rowBounds.length; index += 1) {
		expect(rowBounds[index]?.top).toBe(rowBounds[index - 1]?.bottom);
	}
});

test("a comment with nested replies can collapse and restore its entire thread from the header", async ({ page }) => {
	await openWorkItem(page);

	const collapseButton = page.getByRole("button", { name: "Collapse nested comments" });
	await expect(collapseButton).toHaveCount(1);
	await expect(collapseButton).toBeHidden();
	const activityCard = page.locator('[class~="group/activity-card"]').filter({ has: collapseButton }).first();
	await activityCard.hover();
	await expect(collapseButton).toBeVisible();
	await expect(collapseButton).toHaveAttribute("aria-expanded", "true");
	const repliesId = await collapseButton.getAttribute("aria-controls");
	expect(repliesId).toBeTruthy();
	const replies = page.locator(`#${repliesId}`);
	await expect(replies).toBeVisible();

	await collapseButton.click();
	const expandButton = page.getByRole("button", { name: "Expand nested comments" });
	await expect(expandButton).toHaveAttribute("aria-expanded", "false");
	await expect(replies).toBeHidden();
	const threadSummary = page.getByRole("button", { name: "View all comments, 1 reply" });
	await expect(threadSummary).toContainText("1 reply");
	await expect(threadSummary).toContainText(/ago|AM|PM/u);
	await threadSummary.hover();
	await expect(threadSummary).toContainText("View all comments");

	await threadSummary.click();
	await expect(collapseButton).toHaveAttribute("aria-expanded", "true");
	await expect(replies).toBeVisible();
});

test("a direct activity reply resumes only its waiting agent and the View action opens that agent thread", async ({ page }) => {
	await openWorkItem(page);
	await selectChapter(page, "Working");

	const copilotEntry = page.locator(
		'[data-jira-activity-entry-id="activity-story-session-github-copilot"]',
	);
	await copilotEntry.getByRole("button", { name: "Reply" }).click();
	const replyComposer = copilotEntry.getByRole("textbox", {
		name: "Ask, @mention, or / for actions",
	});
	await replyComposer.fill("Use the approved checkout API contract and resume the storefront integration.");
	await replyComposer.press("Enter");
	await expect(copilotEntry).not.toContainText("Waiting for Code Planner");
	await expect(copilotEntry.getByRole("status", { name: "Running" })).toBeVisible();
	await expectWorkingAgents(page, 3);

	const viewButton = copilotEntry.getByRole("button", { name: "View" });
	await expect(viewButton).toBeHidden();
	await copilotEntry.hover();
	await expect(viewButton).toBeVisible();
	await viewButton.click();
	const chatColumn = page.locator("[data-jira-work-item-chat-column]");
	await expect(chatColumn).toHaveAttribute("aria-hidden", "false");
	await expect(chatColumn).toContainText("GitHub Copilot");
	await expect(chatColumn).toContainText("SHOP-4821");
});

test("handoff, review, and done expose the authored dependency chain and artifacts", async ({ page }) => {
	await openWorkItem(page);

	await selectChapter(page, "Handoff");
	await expectWorkingAgents(page, 2);
	await expectEyesReaction(page, 2);
	await expect(page.getByText("Shared the checkout contract with GitHub Copilot", { exact: true })).toBeVisible();
	await expect(page.getByText("Guest checkout API contract", { exact: true })).toBeVisible();
	await expect(page.getByText(/attached the OpenAPI contract and validation rules/u)).toBeVisible();
	const replyGroup = page.getByRole("group", { name: "Replies" }).first();
	await expect(replyGroup).toBeVisible();
	const replyRow = replyGroup.locator(":scope > .pl-3");
	await expect(replyRow).toHaveCSS("padding-left", "12px");
	await expect(replyRow.locator(":scope > div")).toHaveCSS("border-width", "0px");
	await expect(replyRow.locator(":scope > div")).toHaveCSS("border-radius", "0px");
	await expect(replyGroup.locator("../..")).toHaveCSS("border-top-width", "1px");
	await expect(
		page.getByText("Acceptance suite is ready. Waiting for GitHub Copilot to share the integrated branch.", {
			exact: true,
		}),
	).toBeVisible();

	await selectChapter(page, "Review");
	await expectWorkingAgents(page, 1);
	await expectEyesReaction(page, 1);
	await expect(page.getByText("Guest checkout implementation", { exact: true })).toBeVisible();
	await expect(page.getByText("#1847: Add guest checkout to the storefront", { exact: true })).toBeVisible();
	await expect(page.getByText(/please run the acceptance matrix against PR #1847/iu)).toBeVisible();

	await selectChapter(page, "Done");
	await expectWorkingAgents(page, 0);
	await expectEyesReaction(page, 0);
	await expect(page.getByText("Acceptance matrix passed", { exact: true })).toBeVisible();
	await expect(page.getByText("SHOP-4821 acceptance report", { exact: true })).toBeVisible();
	await expect(page.getByText("Merged", { exact: true })).toBeVisible();
	await expect(page.getByText("Started the feature-flag rollout", { exact: true })).toBeVisible();
	await expect(page.getByText("Guest checkout rollout note", { exact: true })).toBeVisible();
});

test("the Working chapter passes a scoped semantic accessibility audit", async ({ page }) => {
	await openWorkItem(page);
	await selectChapter(page, "Working");

	await expect(page.getByRole("group", { name: "Open a software delivery story chapter" })).toBeVisible();
	const workingPill = page.getByRole("button", { name: "3 agents working" });
	await expect(workingPill.locator('[role="status"]')).toBeVisible();
	const unnamedButtons = await page.locator('button:visible:not([aria-hidden="true"])').evaluateAll((buttons) =>
		buttons
			.filter((button) => {
				const label = button.getAttribute("aria-label")
					?? button.getAttribute("title")
					?? button.textContent;
				return !label?.trim();
			})
			.map((button) => button.outerHTML),
	);
	expect(unnamedButtons).toEqual([]);
	const duplicateIds = await page.locator("[id]").evaluateAll((elements) => {
		const counts = new Map<string, number>();
		for (const element of elements) {
			counts.set(element.id, (counts.get(element.id) ?? 0) + 1);
		}
		return [...counts.entries()].filter(([, count]) => count > 1);
	});
	expect(duplicateIds).toEqual([]);
});
