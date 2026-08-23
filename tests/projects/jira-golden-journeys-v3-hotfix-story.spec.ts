import { expect, test, type Locator, type Page } from "@playwright/test";

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

type FocusClip = Readonly<{
	clippedEdges: readonly string[];
	clippingAncestor: string;
	overflowX: string;
	overflowY: string;
}>;

async function expectFocusIndicatorNotClipped(
	page: Page,
	indicatorOwner: Locator,
	focusTargetSelector?: string,
): Promise<void> {
	await page.keyboard.press("Tab");
	const result = await indicatorOwner.evaluate(async (element, selector) => {
		const focusTarget = selector
			? element.querySelector<HTMLElement>(selector)
			: element as HTMLElement;
		if (!focusTarget) throw new Error(`Missing focus target: ${selector}`);
		focusTarget.focus();
		await new Promise((resolve) => window.setTimeout(resolve, 200));
		function splitShadows(value: string): string[] {
			const shadows: string[] = [];
			let current = "";
			let parenthesisDepth = 0;
			for (const character of value) {
				if (character === "(") parenthesisDepth += 1;
				if (character === ")") parenthesisDepth -= 1;
				if (character === "," && parenthesisDepth === 0) {
					shadows.push(current);
					current = "";
					continue;
				}
				current += character;
			}
			if (current) shadows.push(current);
			return shadows;
		}

		const style = getComputedStyle(element);
		const outlineOutset = style.outlineStyle === "none"
			? 0
			: Math.max(0, parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset));
		const outsets = {
			top: outlineOutset,
			right: outlineOutset,
			bottom: outlineOutset,
			left: outlineOutset,
		};
		for (const shadow of splitShadows(style.boxShadow)) {
			if (shadow.includes("inset")) continue;
			const lengths = (shadow.match(/-?(?:\d+\.?\d*|\.\d+)px/gu) ?? [])
				.map((length) => Number.parseFloat(length));
			const [offsetX = 0, offsetY = 0, blur = 0, spread = 0] = lengths;
			outsets.top = Math.max(outsets.top, spread + blur - offsetY);
			outsets.right = Math.max(outsets.right, spread + blur + offsetX);
			outsets.bottom = Math.max(outsets.bottom, spread + blur + offsetY);
			outsets.left = Math.max(outsets.left, spread + blur - offsetX);
		}

		const clips: FocusClip[] = [];
		const controlRect = element.getBoundingClientRect();
		const clippedOverflowValues = new Set(["auto", "clip", "hidden", "scroll"]);
		let ancestor = element.parentElement;
		while (ancestor) {
			const ancestorStyle = getComputedStyle(ancestor);
			const clipsX = clippedOverflowValues.has(ancestorStyle.overflowX)
				|| ancestorStyle.contain.includes("paint")
				|| ancestorStyle.clipPath !== "none";
			const clipsY = clippedOverflowValues.has(ancestorStyle.overflowY)
				|| ancestorStyle.contain.includes("paint")
				|| ancestorStyle.clipPath !== "none";
			if (clipsX || clipsY) {
				const ancestorRect = ancestor.getBoundingClientRect();
				const innerLeft = ancestorRect.left + parseFloat(ancestorStyle.borderLeftWidth);
				const innerRight = ancestorRect.right - parseFloat(ancestorStyle.borderRightWidth);
				const innerTop = ancestorRect.top + parseFloat(ancestorStyle.borderTopWidth);
				const innerBottom = ancestorRect.bottom - parseFloat(ancestorStyle.borderBottomWidth);
				const clippedEdges = [
					clipsX && controlRect.left - outsets.left < innerLeft ? "left" : null,
					clipsX && controlRect.right + outsets.right > innerRight ? "right" : null,
					clipsY && controlRect.top - outsets.top < innerTop ? "top" : null,
					clipsY && controlRect.bottom + outsets.bottom > innerBottom ? "bottom" : null,
				].filter((edge): edge is string => edge !== null);
				if (clippedEdges.length > 0) {
					clips.push({
						clippedEdges,
						clippingAncestor: ancestor.getAttribute("data-jira-work-item-scroll-region") !== null
							? "[data-jira-work-item-scroll-region]"
							: `${ancestor.tagName.toLowerCase()}.${ancestor.className}`,
						overflowX: ancestorStyle.overflowX,
						overflowY: ancestorStyle.overflowY,
					});
				}
			}
			ancestor = ancestor.parentElement;
		}

		return {
			clips,
			focused: document.activeElement === focusTarget,
			focusVisible: focusTarget.matches(":focus-visible"),
			outsets,
		};
	}, focusTargetSelector);

	expect(result.focused).toBe(true);
	expect(result.focusVisible).toBe(true);
	expect(result.outsets.top).toBeGreaterThan(0);
	expect(result.outsets.right).toBeGreaterThan(0);
	expect(result.outsets.bottom).toBeGreaterThan(0);
	expect(result.outsets.left).toBeGreaterThan(0);
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
	const agentChat = page.getByRole("region", { name: "Agent chat" });
	await expect(agentChat).toBeVisible();
	await agentChat.getByRole("button", { name: "Close" }).click();
	await expect(page.getByRole("button", { name: "Change assignee" })).toBeVisible();
}

async function setAutomation(
	page: Page,
	settings: Readonly<{ autoFix: boolean; autoMerge: boolean }>,
): Promise<void> {
	await page.locator("[data-ci-automation-trigger]").click();
	const autoFix = page.getByRole("menuitemcheckbox", {
		name: "Auto-fix CI & address comments",
	});
	const autoMerge = page.getByRole("menuitemcheckbox", {
		name: "Auto-merge when ready",
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
	await expect(handoff).toContainText("PR #1847 is open for SHOP-4821");
	await expect(handoff).toContainText("Priya Narayanan and Jordan Lee");
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
	const autoFix = page.getByRole("menuitemcheckbox", {
		name: "Auto-fix CI & address comments",
	});
	await expect(autoFix).toBeVisible();
	await autoFix.focus();
	await page.keyboard.press("Space");
	await expect(autoFix).toHaveAttribute("aria-checked", "true");

	const geometry = await bar.evaluate((element) => {
		const rect = element.getBoundingClientRect();
		const branch = element.querySelector<HTMLElement>(
			"[title='feature/shop-4821-guest-checkout']",
		);
		return {
			left: rect.left,
			right: rect.right,
			textOverflow: branch ? getComputedStyle(branch).textOverflow : null,
			viewportWidth: window.innerWidth,
			pageScrollWidth: document.documentElement.scrollWidth,
		};
	});
	expect(geometry.left).toBeGreaterThanOrEqual(0);
	expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth);
	expect(geometry.pageScrollWidth).toBe(geometry.viewportWidth);
	expect(geometry.textOverflow).toBe("ellipsis");
});
