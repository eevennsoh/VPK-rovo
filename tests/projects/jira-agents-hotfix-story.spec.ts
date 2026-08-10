import {
	expect,
	test,
	type Locator,
	type Page,
} from "@playwright/test";

const JIRA_AGENTS_URL = `${
	process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000"
}/jira-agents`;

const CHAPTERS = [
	"Intake",
	"Plan",
	"Build",
	"Handoff",
	"Review",
	"Fix",
	"Approve",
	"Release",
] as const;

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
		await page.getByRole("button", { name: `Select ${name}` }).click();
		await page.getByRole("button", { name: "Close gallery" }).click();
	}
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

async function showActivity(page: Page): Promise<void> {
	await page.getByRole("button", { exact: true, name: "Activity" }).click();
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

	await showActivity(page);
	await expect(entry.getByRole("button", { name: `${count} reacted with eyes` })).toBeVisible();
}

test("the shared-channel story exposes eight selectable stages and canonical working counts", async ({ page }) => {
	await openWorkItem(page);
	const description = page.getByRole("textbox", { name: "Work item description" });
	await expect(description).toContainText("mandatory account creation is a major source of abandonment");
	await expect(description).toContainText("User outcome");
	await expect(description).toContainText("Initial acceptance criteria");
	await expect(description).not.toContainText("Guest checkout flow");
	await expect(description).not.toContainText("mermaid");
	await expect(page.getByRole("link", { name: "Reduce storefront checkout abandonment" })).toBeVisible();
	await expect(page.getByRole("button", { name: "Change project" })).toContainText("Storefront Platform");
	await page.getByRole("button", { name: "See more" }).click();
	await expect(page.getByRole("button", { name: "Change parent" })).toContainText("Reduce storefront checkout abandonment");

	await expect(page.getByRole("button", { name: /^Subtasks/u })).toHaveCount(0);
	await expect(page.getByRole("button", { name: /^Linked work items/u })).toHaveCount(0);

	const controls = page.getByRole("group", { name: "Open a software delivery story chapter" });
	await expect(controls.getByRole("button")).toHaveCount(CHAPTERS.length);
	for (const chapter of CHAPTERS) {
		await expect(chapterButton(page, chapter)).toBeVisible();
	}

	await expect(chapterButton(page, "Intake")).toHaveAttribute("aria-pressed", "true");
	await expectWorkingAgents(page, 0);
	await expect(orchestrationEntry(page)).toHaveCount(0);

	await chapterButton(page, "Intake").focus();
	await page.keyboard.press("Tab");
	await expect(chapterButton(page, "Plan")).toBeFocused();
	await page.keyboard.press("Enter");
	await expect(chapterButton(page, "Plan")).toHaveAttribute("aria-pressed", "true");
	await expectWorkingAgents(page, 2);
	await expectEyesReaction(page, 2);

	await page.getByRole("button", { exact: true, name: "Details" }).click();
	await page.getByRole("button", { name: "Subtasks 1/3" }).click();
	const requirementsTask = page.getByRole("link", {
		name: "SHOP-4824: Define guest checkout requirements and success metrics Done",
	});
	const apiTask = page.getByRole("link", {
		name: "SHOP-4822: Build guest checkout and order-creation API To do",
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

	await page.getByRole("button", { name: "Linked work items 1" }).focus();
	await page.keyboard.press("Enter");
	const researchTask = page.getByRole("link", {
		name: "SHOP-4760: Research checkout abandonment and guest conversion Done",
	});
	await expect(researchTask).toBeVisible();
	await expect(researchTask.locator('[data-slot="icon-tile"]')).toHaveCount(1);

	const progression = [
		["Build", 1],
		["Handoff", 1],
		["Review", 1],
		["Fix", 1],
		["Approve", 1],
		["Release", 0],
	] as const;
	for (const [chapter, count] of progression) {
		await selectChapter(page, chapter);
		if (chapter === "Approve") {
			await expect(page.getByRole("button", { name: "1 agent needs input" })).toBeVisible();
		} else {
			await expectWorkingAgents(page, count);
		}
		await expectEyesReaction(page, 0);
		if (chapter === "Handoff") {
			await expect(page.getByRole("button", { exact: true, name: "Subtasks" })).toBeVisible();
			await expect(page.getByRole("link", {
				name: "SHOP-4823: Build and integrate the storefront checkout flow Done",
			})).toBeVisible();
		}
	}
});

test("PR #1847 requires every guide chapter before Venn can approve it in place", async ({ page }) => {
	await openWorkItem(page);
	const description = page.getByRole("textbox", { name: "Work item description" });

	await selectChapter(page, "Approve");
	const pullRequestSelector = page.getByRole("combobox", { name: "Review pull request" });
	await pullRequestSelector.click();
	await page.getByRole("option", {
		name: "Pull request #1847: Add guest checkout to the storefront",
	}).click();
	await expect(description).toHaveCount(0);
	const detail = page.locator("[data-jira-work-item-pull-request-detail]");
	await expect(detail).toBeVisible();
	await expect(detail.getByRole("heading", {
		name: "Add guest checkout to the storefront",
	})).toBeVisible();
	await expect(detail.getByText("main", { exact: true })).toBeVisible();
	await expect(detail.getByText("feature/shop-4821-guest-checkout", { exact: true })).toBeVisible();
	const reviewers = page.locator("[data-jira-work-item-pull-request-reviewers]");
	await expect(reviewers).toHaveAccessibleName(/Reviewers:.*Venn \(Pending\)/u);
	const ciChecks = page.getByRole("button", { name: "CI checks 3/3 passed" });
	await expect(ciChecks).toBeVisible();
	await expect(page.getByText("Review required", { exact: true }).first()).toBeVisible();
	await ciChecks.click();
	await expect(page.locator("[data-jira-work-item-pull-request-checks]")).toContainText(
		"Lint and typecheck",
	);
	await detail.getByRole("button", { name: "Review required" }).click();
	await expect(detail.getByRole("tab", { name: "Guide" })).toHaveAttribute("aria-selected", "true");
	const guide = detail.locator("[data-jira-work-item-pull-request-guide]");
	await expect(guide.getByText("01 / 03", { exact: true })).toBeVisible();
	await expect(guide.getByRole("heading", { name: "Start a guest checkout" })).toBeVisible();
	await expect(guide.getByRole("button", { name: "Back", exact: true })).toBeDisabled();
	const approveButton = guide.getByRole("button", { name: "Approve pull request", exact: true });
	await expect(approveButton).toBeDisabled();
	await guide.getByRole("button", { name: "Next", exact: true }).click();
	await expect(guide.getByText("02 / 03", { exact: true })).toBeVisible();
	await expect(approveButton).toBeDisabled();
	await expect(guide.getByRole("heading", {
		name: "Keep order creation server-owned",
	})).toBeVisible();
	await guide.getByRole("button", { name: "Next", exact: true }).click();
	await expect(guide.getByText("03 / 03", { exact: true })).toBeVisible();
	await expect(approveButton).toBeEnabled();
	await approveButton.click();
	await expect(guide.getByRole("button", { name: "Approved", exact: true })).toBeDisabled();
	await expect(detail.getByRole("tab", { name: "Guide" })).toHaveAttribute("aria-selected", "true");
	await expect(detail.getByRole("button", { name: "Merge", exact: true })).toBeVisible();
	await expect(reviewers).toHaveAccessibleName(/Reviewers:.*Venn \(Approved\)/u);

	await detail.getByRole("tab", { name: /Files/u }).click();
	const filesPanel = detail.getByRole("tabpanel", { name: /Files/u });
	await expect(filesPanel.getByRole("tree", { name: "Code review files" })).toBeVisible();
	await expect(filesPanel.getByText("guest-checkout-flow.tsx", { exact: true })).toBeVisible();
	await expect(filesPanel.getByText("guest-orders.js", { exact: true })).toBeVisible();
	await expect(filesPanel.getByText("guest-order-service.js", { exact: true })).toBeVisible();
	await expect(filesPanel.getByText("guest-checkout.spec.ts", { exact: true })).toBeVisible();
	await expect(filesPanel.getByText(
		"components/storefront/checkout/guest-checkout-flow.tsx",
		{ exact: true },
	)).toBeVisible();

	await pullRequestSelector.getByRole("button", { name: "Remove Open pull request #1847" }).click();
	await expect(description).toBeVisible();
	await expect(description).toContainText("Acceptance criteria");

	await pullRequestSelector.focus();
	await page.keyboard.press("Enter");
	await page.keyboard.press("ArrowDown");
	await page.keyboard.press("Enter");
	await expect(detail).toBeVisible();
	await pullRequestSelector.getByRole("button", { name: "Remove Open pull request #1847" }).click();
	await expect(description).toBeVisible();
	await expect(description).toContainText("Acceptance criteria");

	await pullRequestSelector.click();
	await page.getByRole("option", {
		name: "Pull request #1847: Add guest checkout to the storefront",
	}).click();
	await expect(detail).toBeVisible();
	await selectChapter(page, "Release");
	await expect(detail).toHaveCount(0);
	await expect(description).toBeVisible();
	await expect(description).toContainText("Acceptance criteria");
});

test("Plan shows the working agent mentions followed by a Started working label", async ({ page }) => {
	await openWorkItem(page);
	await selectChapter(page, "Plan");
	await showActivity(page);

	const leadActivity = page.locator('[data-jira-activity-entry-id="story-lead-delegated"]');
	await expect(leadActivity.locator("[data-jira-activity-agent-mention]")).toHaveCount(2);
	for (const name of ["Claude Code", "Code Planner"]) {
		await expect(leadActivity.getByText(name, { exact: true })).toBeVisible();
	}
	await expect(leadActivity).toContainText("Started working");
	await expect(leadActivity).not.toContainText(/claimed the lead|delegated implementation|acceptance coverage/u);
});

test("Build broadcasts channel context without resolving the agent wait and reselecting resets the stage", async ({ page }) => {
	await openWorkItem(page);
	await selectChapter(page, "Build");

	const workingPill = page.getByRole("button", { name: /^1 agents? working$/u });
	await workingPill.click();
	await expect(page.getByText("Claude Code", { exact: true }).first()).toBeVisible();
	await page.keyboard.press("Escape");
	await expect(workingPill).toBeFocused();

	const broadcastText = "Keep guest checkout fast and do not create an account before purchase.";
	await submitSharedComposer(page, broadcastText);
	await showActivity(page);

	const broadcastEntry = page
		.locator("[data-jira-activity-entry-id]")
		.filter({ hasText: broadcastText });
	await expect(broadcastEntry).toBeVisible();
	await expect(broadcastEntry.getByRole("button", { name: "1 reacted with eyes" })).toBeVisible();

	await selectChapter(page, "Build");
	await expect(page.getByText(broadcastText, { exact: true })).toHaveCount(0);
	await expectWorkingAgents(page, 1);
	await expectEyesReaction(page, 0);
});

test("Intake requires Improve description before the complete team can advance to Plan and Build", async ({ page }) => {
	await openWorkItem(page);
	const workItemDescription = page.getByRole("textbox", { name: "Work item description", exact: true });
	const rawDescription = await workItemDescription.innerText();
	await submitSharedComposer(
		page,
		"@Claude Code lead the implementation and consult @Code Planner on the secure contract.",
	);
	await expect(chapterButton(page, "Intake")).toHaveAttribute("aria-pressed", "true");

	const useSkills = page.getByRole("button", { name: "Use skills" });
	await useSkills.focus();
	await page.keyboard.press("Enter");
	const skillSearch = page.getByRole("textbox", { name: "Search skills" });
	await skillSearch.fill("Improve description");
	await skillSearch.press("ArrowDown");
	await page.keyboard.press("Enter");
	await expect(page.getByRole("button", { name: "1 agent working" })).toBeVisible();
	expect(await workItemDescription.innerText()).toBe(rawDescription);
	const agentChat = page.getByRole("region", { name: "Agent chat" });
	await expect(agentChat.locator('[data-slot="skill-tag"]')).toHaveText("improve-description");
	await expect(page.getByRole("button", { name: "1 agent needs input" })).toBeVisible({ timeout: 10_000 });
	await expect(agentChat.getByText("Suggested description", { exact: true })).toBeVisible();
	await expect(agentChat.getByText(/Would you like me to add this suggested output/u)).toBeVisible();
	expect(await workItemDescription.innerText()).toBe(rawDescription);
	const confirmationDialog = agentChat.getByRole("dialog", {
		name: /Would you like me to add this suggested output/u,
	});
	await confirmationDialog.focus();
	await page.keyboard.press("ArrowDown");
	await page.keyboard.press("Enter");
	await expect(agentChat.getByText(/I kept the current work item description unchanged/u)).toBeVisible();
	await expect(agentChat.getByRole("dialog", {
		name: /Would you like me to add this suggested output/u,
	})).toHaveCount(0);
	await expect(page.getByRole("button", { name: "1 agent needs input" })).toHaveCount(0);
	expect(await workItemDescription.innerText()).toBe(rawDescription);
	await agentChat.getByRole("button", { name: "Close" }).click();

	await useSkills.focus();
	await page.keyboard.press("Enter");
	await page.getByRole("textbox", { name: "Search skills" }).fill("Improve description");
	await page.getByRole("textbox", { name: "Search skills" }).press("ArrowDown");
	await page.keyboard.press("Enter");
	await expect(page.getByRole("button", { name: "1 agent needs input" })).toBeVisible({ timeout: 10_000 });
	const applyDialog = agentChat.getByRole("dialog", {
		name: /Would you like me to add this suggested output/u,
	});
	await applyDialog.focus();
	await page.keyboard.press("Enter");
	await expect(agentChat.getByText(/I added the approved description to SHOP-4821/u)).toBeVisible();
	expect(await workItemDescription.innerText()).not.toBe(rawDescription);
	await agentChat.getByRole("button", { name: "Close" }).click();
	await showActivity(page);
	await expect(page.getByText(/Added the approved implementation-ready description/u)).toBeVisible();

	await submitSharedComposer(
		page,
		"@Claude Code lead the implementation and consult @Code Planner on the secure contract.",
	);

	await expect(chapterButton(page, "Plan")).toHaveAttribute("aria-pressed", "true");
	await expectWorkingAgents(page, 2);
	await expect(chapterButton(page, "Build")).toHaveAttribute("aria-pressed", "true", { timeout: 15_000 });
	await expectWorkingAgents(page, 1);

	await selectChapter(page, "Intake");
	expect(await workItemDescription.innerText()).toBe(rawDescription);
	await expect(page.getByRole("region", { name: "Agent chat" })).toHaveCount(0);
	await expect(page.getByRole("button", { name: "1 agent needs input" })).toHaveCount(0);
});

test("Jira Agents shows compact checkout automations instead of the shared empty state", async ({ page }) => {
	await openWorkItem(page);
	const automationDisclosure = page.getByRole("button", { name: "Automation 4" });
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
	await showActivity(page);

	const collapseButton = page.getByRole("button", { name: "Collapse nested comments" });
	await expect(collapseButton).toHaveCount(1);
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

test("Review advances queued to running to failed and reselecting resets it to queued", async ({ page }) => {
	await page.clock.install();
	await openWorkItem(page);
	await selectChapter(page, "Review");
	const claudeEntry = page.locator(
		'[data-jira-activity-entry-id="activity-story-session-claude-code"]',
	);

	await expect(claudeEntry).toContainText("checks are queued");
	await page.clock.fastForward(900);
	await expect(claudeEntry).toContainText("running lint and typecheck");
	await page.clock.fastForward(1_500);
	await expect(claudeEntry).toContainText("nullable delivery-address path");
	await showActivity(page);
	await expect(page.getByText(/blocked PR #1847 after/u)).toBeVisible();

	await selectChapter(page, "Review");
	await expect(claudeEntry).toContainText("checks are queued");
});

test("handoff through release expose the authored dependency chain and artifacts", async ({ page }) => {
	await openWorkItem(page);

	await selectChapter(page, "Handoff");
	await expectWorkingAgents(page, 1);
	await expectEyesReaction(page, 0);
	await expect(page.getByRole("button", { name: "Subtasks 3/3" })).toBeVisible();
	await showActivity(page);
	await expect(page.getByText("Implemented guest checkout end to end", { exact: true })).toBeVisible();
	await expect(page.getByText("Guest checkout implementation", { exact: true })).toBeVisible();
	const replyGroup = page.getByRole("group", { name: "Replies" }).first();
	await expect(replyGroup).toBeVisible();
	await selectChapter(page, "Fix");
	await showActivity(page);
	await expectWorkingAgents(page, 1);
	await expectEyesReaction(page, 0);
	await expect(page.getByText(/blocked PR #1847 after/u)).toBeVisible();
	await expect(page.getByText("Repair delivery-address validation", { exact: true })).toBeVisible();

	await selectChapter(page, "Release");
	await showActivity(page);
	await expectWorkingAgents(page, 0);
	await expectEyesReaction(page, 0);
	await expect(page.getByText("Acceptance matrix passed", { exact: true })).toBeVisible();
	await expect(page.getByText("SHOP-4821 acceptance report", { exact: true })).toBeVisible();
	await expect(page.getByText("Merged", { exact: true })).toBeVisible();
	await expect(page.getByText(/deployed to production behind/u)).toBeVisible();
	await expect(page.getByText("guest_checkout_v1", { exact: true })).toBeVisible();
	await expect(page.getByText(/passed production smoke checks and confirmed healthy telemetry/u)).toBeVisible();
	await expect(page.getByText(/completed the feature-flag rollout to/u)).toBeVisible();
	await expect(page.getByText("100%", { exact: true })).toBeVisible();
});

test("the Build stage passes a scoped semantic accessibility audit", async ({ page }) => {
	await openWorkItem(page);
	await selectChapter(page, "Build");

	await expect(page.getByRole("group", { name: "Open a software delivery story chapter" })).toBeVisible();
	const workingPill = page.getByRole("button", { name: /^1 agents? working$/u });
	await expect(workingPill).toBeVisible();
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
