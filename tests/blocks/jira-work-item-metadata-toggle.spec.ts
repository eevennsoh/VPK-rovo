import { expect, test } from "@playwright/test";

const JIRA_WORK_ITEM_URL = `${
	process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000"
}/preview/blocks/jira-work-item-demo-experimental`;

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
