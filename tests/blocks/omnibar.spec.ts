import { expect, test } from "@playwright/test";

const OMNIBAR_URL = `${
	process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000"
}/preview/blocks/omnibar`;

test("keyboard activation moves focus from the Omnibar pill into the revealed composer", async ({ page }) => {
	await page.goto(OMNIBAR_URL, { waitUntil: "domcontentloaded" });

	const omnibar = page.locator('[data-slot="omnibar"]');
	const pill = omnibar.getByRole("button", { name: "Ask Rovo" });

	await pill.focus();
	await page.keyboard.press("Enter");

	await expect(omnibar).toHaveAttribute("data-state", "expanded");
	await expect(omnibar.getByRole("textbox", { name: "Ask Rovo" })).toBeFocused();
});
