import { expect, test, type Locator, type Page } from "@playwright/test";

import {
	probeFocusIndicatorClearance,
	probeNearestOwnerContainment,
} from "@/tests/helpers/jira-interaction-contracts";

const JIRA_GOLDEN_JOURNEYS_V3_URL = (
	process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000"
) + "/jira-golden-journeys-v3";

const CHAPTERS = ["Terminal", "Build", "Review", "Fix", "Approve", "Release"] as const;

function chapterButton(page: Page, name: (typeof CHAPTERS)[number]): Locator {
	return page.getByRole("button", {
		exact: true,
		name: name === "Terminal" ? /^Terminal · [1-5] of 5$/u : name,
	});
}

function contextBar(page: Page): Locator {
	return page.locator("[data-pr-context-bar][data-pr-number='1847']");
}

async function expectFocusIndicatorNotClipped(
	page: Page,
	indicatorOwner: Locator,
	focusTargetSelector?: string,
): Promise<void> {
	const result = await probeFocusIndicatorClearance(page, indicatorOwner, focusTargetSelector);

	expect(result.focused).toBe(true);
	expect(result.focusVisible).toBe(true);
	expect(result.visibleIndicator).toBe(true);
	expect(result.indicatorPlacement).not.toBe("none");
	if (result.indicatorPlacement === "outset") {
		expect(result.outsets.top).toBeGreaterThan(0);
		expect(result.outsets.right).toBeGreaterThan(0);
		expect(result.outsets.bottom).toBeGreaterThan(0);
		expect(result.outsets.left).toBeGreaterThan(0);
	}
	expect(result.clips).toEqual([]);
}

async function openStory(page: Page): Promise<void> {
	await page.goto(JIRA_GOLDEN_JOURNEYS_V3_URL, { waitUntil: "domcontentloaded" });
	await expect(page.getByRole("heading", { name: "Jira Golden Journeys v3" })).toBeVisible();
	await expect(
		page.getByRole("group", { name: "Open a software delivery story chapter" })
			.or(page.getByRole("button", { name: "Jump to chapter" })),
	).toBeVisible();
}

async function selectChapter(
	page: Page,
	name: (typeof CHAPTERS)[number],
): Promise<void> {
	const button = chapterButton(page, name);
	if (await button.isVisible()) {
		await button.click();
		await expect(button).toHaveAttribute("aria-pressed", "true");
		return;
	}

	const jumpToChapter = page.getByRole("button", { name: "Jump to chapter" });
	const activeLabel = (await jumpToChapter.textContent())?.trim();
	const activeIndex = CHAPTERS.findIndex((chapter) => chapter === activeLabel);
	const targetIndex = CHAPTERS.indexOf(name);
	const direction = targetIndex > activeIndex ? "Next chapter" : "Previous chapter";
	for (let index = 0; index < Math.abs(targetIndex - activeIndex); index += 1) {
		await page.getByRole("button", { name: direction }).click();
	}
	await expect(jumpToChapter).toContainText(name);
}

async function openBuild(page: Page): Promise<Locator> {
	await openStory(page);
	await selectChapter(page, "Build");
	await expect(page.getByRole("region", {
		name: "Add guest checkout to the storefront",
	})).toBeVisible();
	await expect(contextBar(page)).toBeVisible();
	return contextBar(page);
}

async function openMetadataRail(page: Page): Promise<void> {
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.setViewportSize({ width: 1920, height: 1080 });
	await openBuild(page);
	await expect(page.getByRole("region", { name: "Agent chat" })).toHaveCount(0);
	await expect(page.getByRole("button", { name: "Change assignee" })).toBeVisible();
}

async function setAutomation(
	page: Page,
	settings: Readonly<{ autoFix: boolean; autoMerge: boolean }>,
): Promise<void> {
	await page.locator("[data-ci-automation-trigger]").click();
	const autoFix = page.getByRole("switch", {
		name: /Auto-fix CI & address comments/u,
	});
	const autoMerge = page.getByRole("switch", {
		name: /Auto-merge when ready/u,
	});
	if ((await autoFix.getAttribute("aria-checked")) !== String(settings.autoFix)) {
		await autoFix.click();
	}
	if ((await autoMerge.getAttribute("aria-checked")) !== String(settings.autoMerge)) {
		await autoMerge.click();
	}
	await expect(autoFix).toHaveAttribute("aria-checked", String(settings.autoFix));
	await expect(autoMerge).toHaveAttribute("aria-checked", String(settings.autoMerge));
	await page.keyboard.press("Escape");
}

test("the desktop chapter control keeps its keyboard focus indicator clear of the gallery scrollport", async ({
	page,
}) => {
	await openStory(page);
	await expectFocusIndicatorNotClipped(page, chapterButton(page, "Build"));
});

test("the focus-clearance probe reports a deliberately clipped fixture", async ({ page }) => {
	await page.setContent(`
		<style>
			#clip { width: 48px; height: 32px; overflow: hidden; }
			#clipped { width: 48px; height: 32px; }
			#clipped:focus-visible { outline: 4px solid blue; outline-offset: 4px; }
		</style>
		<div id="clip"><button id="clipped">Focus</button></div>
	`);

	const result = await probeFocusIndicatorClearance(page, page.locator("#clipped"));
	expect(result.indicatorPlacement).toBe("outset");
	expect(result.visibleIndicator).toBe(true);
	expect(result.clips).not.toEqual([]);
	expect(result.clips[0].clippedEdges).toEqual(["top", "right", "bottom", "left"]);
});

test("the focus-clearance probe does not mistake a resting shadow for a focus indicator", async ({
	page,
}) => {
	await page.setContent(`
		<style>
			#resting-shadow {
				box-shadow: 0 0 0 4px rgb(255 0 0);
				outline: none;
			}
			#resting-shadow:focus-visible { outline: none; }
		</style>
		<button id="resting-shadow">Focus</button>
	`);

	const result = await probeFocusIndicatorClearance(page, page.locator("#resting-shadow"));
	expect(result.focused).toBe(true);
	expect(result.focusVisible).toBe(true);
	expect(result.focusSpecificDelta).toBe(false);
	expect(result.indicatorPlacement).toBe("none");
	expect(result.visibleIndicator).toBe(false);
});

test("the containment probe reports owner and document overflow independently", async ({ page }) => {
	await page.setContent(`
		<style>
			html, body { margin: 0; width: 100%; overflow-x: clip; }
			#owner { width: 100px; overflow-x: auto; }
			#subject { width: 200px; height: 20px; }
		</style>
		<div id="owner"><div id="subject">Subject</div></div>
	`);

	const result = await probeNearestOwnerContainment(page.locator("#subject"));
	expect(result.owner).toBe("#owner");
	expect(result.containmentKnown).toBe(true);
	expect(result.ownerHorizontalOverflow).toBe(100);
	expect(result.documentHorizontalOverflow).toBe(0);
});

test("the containment probe finds clipping owners before the viewport", async ({ page }) => {
	await page.setContent(`
		<style>
			html, body { margin: 0; width: 100%; }
			.owner { width: 100px; height: 32px; }
			#hidden-owner { overflow: hidden; }
			#clip-owner { overflow: clip; }
			#paint-owner { contain: paint; }
			#clip-path-owner { clip-path: inset(0); }
			.subject { width: 200px; height: 20px; }
		</style>
		<div id="hidden-owner" class="owner"><div id="hidden-subject" class="subject"></div></div>
		<div id="clip-owner" class="owner"><div id="clip-subject" class="subject"></div></div>
		<div id="paint-owner" class="owner"><div id="paint-subject" class="subject"></div></div>
		<div id="clip-path-owner" class="owner"><div id="clip-path-subject" class="subject"></div></div>
	`);

	for (const overflow of ["hidden", "clip", "paint", "clip-path"] as const) {
		const result = await probeNearestOwnerContainment(
			page.locator(`#${overflow}-subject`),
		);
		expect(result.owner).toBe(`#${overflow}-owner`);
		expect(result.ownerHorizontalOverflow).toBe(100);
		expect(result.documentHorizontalOverflow).toBe(0);
		expect(result.containmentKnown).toBe(overflow !== "clip-path");
		expect(result.contained).toBe(false);
	}
});

test("the containment probe does not claim arbitrary clip-path geometry is contained", async ({
	page,
}) => {
	await page.setContent(`
		<style>
			#shape-owner {
				position: relative;
				width: 100px;
				height: 100px;
				clip-path: circle(1px at 50% 50%);
			}
			#shape-subject {
				position: absolute;
				top: 40px;
				left: 40px;
				width: 20px;
				height: 20px;
			}
		</style>
		<div id="shape-owner"><div id="shape-subject"></div></div>
	`);

	const result = await probeNearestOwnerContainment(page.locator("#shape-subject"));
	expect(result.owner).toBe("#shape-owner");
	expect(result.containmentKnown).toBe(false);
	expect(result.contained).toBe(false);
});

test("the metadata rail keeps field focus indicators clear of its body scrollport", async ({
	page,
}) => {
	await openMetadataRail(page);
	const assignee = page.getByRole("button", { name: "Change assignee" });
	await expectFocusIndicatorNotClipped(page, assignee.locator(".."), "button");
});

test("ArtifactPane header actions keep their keyboard focus indicators clear of reveal slots", async ({
	page,
}) => {
	await openMetadataRail(page);
	const manageAutomations = page.getByRole("button", { name: "Manage automations" });
	await expect(manageAutomations).toBeAttached();
	await expectFocusIndicatorNotClipped(page, manageAutomations);
});

test("the PR context-bar CI trigger keeps its keyboard focus indicator clear of the content lane", async ({
	page,
}) => {
	await openBuild(page);
	await expectFocusIndicatorNotClipped(page, page.locator("[data-ci-automation-trigger]"));
});

test("work-item navigation keeps section and pull-request focus indicators clear", async ({
	page,
}) => {
	await openBuild(page);
	await expectFocusIndicatorNotClipped(page, page.getByRole("link", { name: "Description" }));
	await expectFocusIndicatorNotClipped(page, page.getByRole("combobox", { name: "Pull requests. 1" }));
});

test("activity actions keep session and artifact focus indicators clear of reveal slots", async ({
	page,
}) => {
	await openBuild(page);
	await expectFocusIndicatorNotClipped(page, page.getByRole("button", { name: "View" }).first());
	await expectFocusIndicatorNotClipped(
		page,
		page.getByRole("button", { name: "Code changes: 86 additions, 21 deletions" }),
	);
});

test("activity sort reveal closes after pointer use and remains keyboard discoverable", async ({
	page,
}) => {
	await openBuild(page);
	const activityHeading = page.getByRole("heading", { name: "Activity", exact: true });
	const sort = page.getByRole("button", { name: /^Show (?:latest|oldest)$/u });

	await expect(sort).toHaveCSS("opacity", "0");
	await activityHeading.hover();
	await expect(sort).toHaveCSS("opacity", "1");
	await sort.click();
	await page.getByRole("menuitemradio", { name: "Latest" }).click();
	await page.mouse.click(1, 1);
	await page.mouse.move(0, 0);
	await expect(sort).toHaveAttribute("aria-expanded", "false");
	await expect(sort).toHaveCSS("opacity", "0");

	await page.keyboard.press("Tab");
	await sort.focus();
	await expect(sort).toBeFocused();
	await expect(sort).toHaveCSS("opacity", "1");
});

test("Terminal tells the local Claude-to-PR story and waits for the presenter to choose Build", async ({
	page,
}) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	await openStory(page);

	const controls = page.getByRole("group", {
		name: "Open a software delivery story chapter",
	});
	await expect(controls.getByRole("button")).toHaveCount(CHAPTERS.length);
	for (const chapter of CHAPTERS) {
		await expect(chapterButton(page, chapter)).toBeVisible();
	}
	await expect(page.getByRole("button", { exact: true, name: "Intake" })).toHaveCount(0);
	await expect(page.getByRole("button", { exact: true, name: "Plan" })).toHaveCount(0);
	await expect(chapterButton(page, "Terminal")).toHaveAttribute("aria-pressed", "true");
	await expect(chapterButton(page, "Terminal")).toHaveText("Terminal · 1 of 5");
	await expect(page.getByRole("button", {
		name: "Cycle theme, current theme: Dark",
	})).toBeVisible();
	const terminalStory = page.locator("[data-story-complete][data-pr-number='1847']");
	const terminalGeometry = await terminalStory.evaluate((element) => {
		const rect = element.getBoundingClientRect();
		return { left: rect.left, right: rect.right, viewportWidth: window.innerWidth };
	});
	expect(terminalGeometry.left).toBe(0);
	expect(terminalGeometry.right).toBe(terminalGeometry.viewportWidth);
	await expect(page.locator("[data-terminal-layout='claude-only']")).toBeVisible();
	await expect(page.locator("[data-terminal-pane='claude']")).toBeVisible();
	await expect(page.locator("[data-terminal-pane='jira']")).toHaveCount(0);

	await chapterButton(page, "Terminal").focus();
	await page.keyboard.press("Tab");
	await expect(chapterButton(page, "Build")).toBeFocused();

	await page.getByRole("button", {
		name: "Start Claude working on SHOP-4821",
	}).click();
	const forwardSteps = [
		{ hint: "→ next: run the local checks", step: 2 },
		{ hint: "→ next: create PR #1847 from this session", step: 3 },
		{ hint: "→ next: confirm CI has started", step: 4 },
	] as const;
	for (const { hint, step } of forwardSteps) {
		await expect(page.getByText(hint, { exact: true })).toBeVisible();
		await expect(chapterButton(page, "Terminal")).toHaveText(`Terminal · ${step} of 5`);
		await page.keyboard.press("ArrowRight");
	}

	await expect(terminalStory).toHaveAttribute("data-story-complete", "true");
	await expect(chapterButton(page, "Terminal")).toHaveText("Terminal · 5 of 5");
	await expect(page.getByText("opened PR #1847 · Add guest checkout to the storefront", {
		exact: true,
	})).toBeVisible();
	await expect(page.getByText("Priya Narayanan and Jordan Lee requested", {
		exact: true,
	})).toBeVisible();
	await expect(page.getByText("CI started for PR #1847", { exact: true })).toBeVisible();
	await expect(chapterButton(page, "Terminal")).toHaveAttribute("aria-pressed", "true");
	await expect(chapterButton(page, "Build")).toHaveAttribute("aria-pressed", "false");

	await selectChapter(page, "Build");
	await expect(page.getByRole("region", {
		name: "Add guest checkout to the storefront",
	})).toBeVisible();
	await expect(page.getByRole("region", { name: "Agent chat" })).toHaveCount(0);
	await expect(page.getByRole("button", { name: "Change assignee" })).toBeVisible();
});

test("rules-gated delivery repairs CI, stages both approvals, and merges before Release", async ({
	page,
}) => {
	test.setTimeout(45_000);
	const bar = await openBuild(page);

	await expect(bar).toHaveAttribute("data-ci-status", "running");
	await expect(bar).toHaveAttribute("data-approvals-current", "0");
	await expect(bar).toHaveAttribute("data-auto-fix-enabled", "false");
	await expect(bar).toHaveAttribute("data-auto-merge-enabled", "false");
	await expect(bar).toHaveAttribute("data-merge-state", "disabled");
	await expect(bar.locator("[data-slot='lozenge']")).toHaveText("Open");
	await expect(bar.locator("[data-slot='spinner']")).toBeVisible();
	await expect(bar.getByText("eevensoh/vpk-rovo", { exact: true })).toHaveCount(0);
	await expect(bar.locator("[data-approvals-summary]")).toHaveCount(0);
	await expect(bar.locator("[data-merge-state-label]")).toHaveCount(0);

	await page.getByRole("navigation", { name: "Work item sections" }).getByRole("link", { name: /^Activity/ }).click();
	const handoff = page.locator(
		"[data-jira-activity-entry-id='story-channel-claude-pr-handoff']",
	);
	await expect(page.locator("[data-jira-activity-entry-id='story-changed-files']")).toHaveCount(0);
	await expect(handoff).toContainText("Implemented guest checkout for SHOP-4821");
	await expect(handoff).toContainText("Implement guest checkout without account creation");
	await expect(handoff).toContainText("guest-checkout-final.png");
	await expect(handoff).not.toContainText("Changed 12 files");
	await expect(handoff).toContainText("Open PR #1847 and request Priya and Jordan");
	await expect(page.getByRole("link", {
		name: "#1847: Implement guest checkout without account creation",
	})).toBeVisible();

	await setAutomation(page, { autoFix: true, autoMerge: true });
	await expect(bar).toHaveAttribute("data-auto-fix-enabled", "true");
	await expect(bar).toHaveAttribute("data-auto-merge-enabled", "true");

	await selectChapter(page, "Review");
	await expect(bar).toHaveAttribute("data-ci-status", "failed", { timeout: 10_000 });
	await expect(bar).toHaveAttribute("data-merge-state", "blocked");
	await expect(page.locator("[data-ci-automation-trigger]")).toHaveAccessibleName(
		"CI failed. 1 failed, 2 passed. Configure CI automation",
	);
	await expect(page.locator("[data-jira-activity-entry-id='story-ci-failed']")).toContainText(
		"lint-and-typecheck",
	);

	await selectChapter(page, "Fix");
	await expect(page.locator("[data-ci-automation-trigger]")).toHaveAccessibleName(
		"CI running. 2 passed, 1 rerunning. Configure CI automation",
	);
	await expect(bar).toHaveAttribute("data-ci-status", "passed", { timeout: 8_000 });
	await expect(page.locator("[data-jira-activity-entry-id='story-ci-passed']")).toContainText(
		"3 checks passed",
	);
	await expect(bar).toHaveAttribute("data-merge-state", "blocked");

	await selectChapter(page, "Approve");
	await expect(bar).toHaveAttribute("data-approvals-current", "0");
	await expect(bar).toHaveAttribute("data-approvals-current", "1", { timeout: 5_000 });
	await expect(page.locator("[data-jira-activity-entry-id='story-priya-approved']")).toContainText(
		"approved PR #1847",
	);
	await expect(bar).toHaveAttribute("data-merge-state", "blocked");
	await expect(bar).toHaveAttribute("data-approvals-current", "2", { timeout: 5_000 });
	await expect(page.locator("[data-jira-activity-entry-id='story-jordan-approved']")).toContainText(
		"approved PR #1847",
	);
	await expect(bar).toHaveAttribute("data-merge-state", "queued");
	await expect(bar).toHaveAttribute("data-merge-state", "merged", { timeout: 5_000 });

	await selectChapter(page, "Release");
	await expect(page.getByRole("button", {
		name: "Change status. Current status: Done",
	})).toBeVisible();
	await expect(bar).toHaveAttribute("data-ci-status", "passed");
	await expect(bar).toHaveAttribute("data-approvals-current", "2");
	await expect(bar).toHaveAttribute("data-merge-state", "merged");
	await expect(page.locator("[data-jira-activity-entry-id='story-pr-merged']")).toContainText(
		"automatically merged PR #1847 after CI and 2 required approvals passed",
	);

	await selectChapter(page, "Fix");
	await expect(bar).toHaveAttribute("data-ci-status", "passed");
	await expect(bar).toHaveAttribute("data-approvals-current", "0");
	await expect(bar).toHaveAttribute("data-merge-state", "blocked");
	await expect(page.locator("[data-jira-activity-entry-id='story-pr-merged']")).toHaveCount(0);
});

test("Auto-merge never completes with failed CI or fewer than two approvals", async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	const bar = await openBuild(page);
	await setAutomation(page, { autoFix: false, autoMerge: true });

	await selectChapter(page, "Review");
	await expect(bar).toHaveAttribute("data-ci-status", "failed");
	await expect(bar).toHaveAttribute("data-merge-state", "blocked");

	await selectChapter(page, "Approve");
	await expect(bar).toHaveAttribute("data-approvals-current", "0");
	await expect(bar).toHaveAttribute("data-merge-state", "blocked");

	await selectChapter(page, "Release");
	await expect(bar).toHaveAttribute("data-ci-status", "failed");
	await expect(bar).toHaveAttribute("data-approvals-current", "0");
	await expect(bar).toHaveAttribute("data-merge-state", "blocked");
	await expect(page.getByRole("button", {
		name: "Change status. Current status: In review",
	})).toBeVisible();
	await expect(page.locator("[data-jira-activity-entry-id='story-pr-merged']")).toHaveCount(0);
});

test("Reset clears automation and reduced motion collapses authored transitions", async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	const bar = await openBuild(page);
	await setAutomation(page, { autoFix: true, autoMerge: true });

	await selectChapter(page, "Review");
	await expect(bar).toHaveAttribute("data-ci-status", "failed");
	await selectChapter(page, "Fix");
	await expect(bar).toHaveAttribute("data-ci-status", "passed");
	await selectChapter(page, "Approve");
	await expect(bar).toHaveAttribute("data-approvals-current", "2");
	await expect(bar).toHaveAttribute("data-merge-state", "merged");

	await page.getByRole("button", { exact: true, name: "Reset" }).click();
	await expect(chapterButton(page, "Terminal")).toHaveAttribute("aria-pressed", "true");
	await expect(page.locator("[data-story-complete]")).toHaveAttribute(
		"data-story-complete",
		"false",
	);

	await selectChapter(page, "Build");
	await expect(contextBar(page)).toHaveAttribute("data-auto-fix-enabled", "false");
	await expect(contextBar(page)).toHaveAttribute("data-auto-merge-enabled", "false");
	await expect(contextBar(page)).toHaveAttribute("data-merge-state", "disabled");
});

test("dismissing the PR context restores the default pills until Reset", async ({ page }) => {
	await openBuild(page);
	await page.getByRole("button", { name: "Dismiss pull request context" }).click();
	await expect(contextBar(page)).toHaveCount(0);
	await expect(page.getByRole("button", { name: "Assign agents" })).toBeVisible();
	await expect(page.getByRole("button", { name: "Use skills" })).toBeVisible();

	await selectChapter(page, "Review");
	await expect(contextBar(page)).toHaveCount(0);
	await expect(page.getByRole("button", { name: "Assign agents" })).toBeVisible();

	await page.getByRole("button", { exact: true, name: "Reset" }).click();
	await selectChapter(page, "Build");
	await expect(contextBar(page)).toBeVisible();
	await expect(page.getByRole("button", { name: "Dismiss pull request context" })).toBeVisible();
});

test("the PR bar is keyboard operable and contained at a narrow viewport", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	const bar = await openBuild(page);
	const trigger = page.locator("[data-ci-automation-trigger]");
	await trigger.focus();
	await page.keyboard.press("Enter");
	const autoFix = page.getByRole("switch", {
		name: /Auto-fix CI & address comments/u,
	});
	await expect(autoFix).toBeVisible();
	await autoFix.focus();
	await page.keyboard.press("Space");
	await expect(autoFix).toHaveAttribute("aria-checked", "true");

	const containment = await probeNearestOwnerContainment(bar);
	const geometry = await bar.evaluate((element) => {
		const branch = element.querySelector<HTMLElement>(
			"[title='feature/shop-4821-guest-checkout']",
		);
		return {
			textOverflow: branch ? getComputedStyle(branch).textOverflow : null,
		};
	});
	expect(containment.containmentKnown).toBe(true);
	expect(containment.contained).toBe(true);
	expect(containment.ownerHorizontalOverflow).toBe(0);
	expect(containment.documentHorizontalOverflow).toBe(0);
	expect(geometry.textOverflow).toBe("ellipsis");
});
