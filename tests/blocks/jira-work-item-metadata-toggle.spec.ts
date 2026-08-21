import { expect, test } from "@playwright/test";

const JIRA_WORK_ITEM_URL = `${
	process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000"
}/preview/blocks/jira-work-item-demo-experimental`;

const JIRA_WORK_ITEM_V3_URL = `${
	process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000"
}/preview/blocks/jira-work-item-demo-experimental-v3`;

test("rapid metadata toggles settle with visible title actions", async ({ page }) => {
	await page.goto(JIRA_WORK_ITEM_URL, { waitUntil: "domcontentloaded" });
	await page.getByRole("button", { name: "Open work item" }).click();

	const toggle = page.getByRole("button", { name: /metadata panel/u });
	await expect(toggle).toHaveAccessibleName("Hide metadata panel");

	const toggleBackAsSoonAsEnabled = toggle.evaluate(
		(button) => new Promise<void>((resolve) => {
			if (!(button instanceof HTMLButtonElement)) {
				throw new Error("Expected the metadata disclosure to render as a button.");
			}
			const observer = new MutationObserver(() => {
				if (button.getAttribute("aria-label") !== "Show metadata panel" || button.disabled) return;

				observer.disconnect();
				button.click();
				resolve();
			});
			observer.observe(button, {
				attributeFilter: ["aria-label", "disabled"],
				attributes: true,
			});
		}),
	);

	await toggle.click();
	await toggleBackAsSoonAsEnabled;
	await expect(toggle).toHaveAccessibleName("Hide metadata panel");
	await expect(toggle).toBeEnabled();

	const titleActions = page.locator("[data-jira-work-item-title] + div");
	await expect(titleActions).not.toHaveAttribute("aria-hidden");
	await expect(titleActions).not.toHaveAttribute("inert");
	await expect(titleActions).toHaveCSS("opacity", "1");
});

test("opening v3 resolves section links to the visible desktop scrollport", async ({ page }) => {
	await page.goto(JIRA_WORK_ITEM_V3_URL, { waitUntil: "domcontentloaded" });
	await page.getByRole("button", { name: "Open work item" }).click();

	const sectionNav = page.getByRole("navigation", { name: "Work item sections" });
	const activityLink = sectionNav.getByRole("link", { name: /^Activity/u });
	const sectionScrollport = page.locator(
		"[data-jira-work-item-scroll-region]:has([data-work-item-section-id='activity'])",
	);
	await expect(sectionNav).toBeVisible();
	await expect(sectionScrollport).toHaveCSS("overflow-y", "auto");

	const scrollSettled = sectionScrollport.evaluate((element) => new Promise<void>((resolve) => {
		element.addEventListener("scrollend", () => resolve(), { once: true });
	}));
	await activityLink.focus();
	await expect(activityLink).toBeFocused();
	await page.keyboard.press("Enter");
	await scrollSettled;
	await page.waitForTimeout(700);

	await expect(activityLink).toHaveAttribute("aria-current", "location");
	await expect.poll(() => sectionScrollport.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
});

test("v3 section links keep working in the narrow reduced-motion layout", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto(JIRA_WORK_ITEM_V3_URL, { waitUntil: "domcontentloaded" });
	await page.getByRole("button", { name: "Open work item" }).click();

	const sectionNav = page.getByRole("navigation", { name: "Work item sections" });
	const activityLink = sectionNav.getByRole("link", { name: /^Activity/u });
	await expect(sectionNav).toBeVisible();
	await activityLink.click();

	await expect(activityLink).toHaveAttribute("aria-current", "location");
	await expect.poll(() => activityLink.evaluate((link) => {
		let ancestor = link.parentElement;
		while (ancestor) {
			const overflowY = window.getComputedStyle(ancestor).overflowY;
			if (/auto|scroll/u.test(overflowY) && ancestor.scrollHeight > ancestor.clientHeight) {
				return ancestor.scrollTop;
			}
			ancestor = ancestor.parentElement;
		}
		return -1;
	})).toBeGreaterThan(0);
	await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
});
