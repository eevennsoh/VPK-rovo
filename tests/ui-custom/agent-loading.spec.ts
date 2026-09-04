import { expect, test } from "@playwright/test";

const AGENT_LOADING_URL = `${
	process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000"
}/components/ui-custom/agent-loading`;

test("a live reduced-motion preference stops Agent Loading before it resumes", async ({ page }) => {
	await page.goto(AGENT_LOADING_URL, { waitUntil: "domcontentloaded" });

	const activeStatus = page.getByRole("status").filter({ hasText: "Needs input" });
	const finishButton = page.getByRole("button", { name: "Finish all agents" });
	await expect(activeStatus).toHaveCount(1);

	await finishButton.focus();
	await page.keyboard.press("Enter");
	await expect(page.getByRole("button", { name: "Resume agents" })).toBeFocused();

	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.evaluate(() => new Promise<void>((resolve) =>
		requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
	));
	await page.getByRole("button", { name: "Resume agents" }).press("Enter");

	const resumedStatus = page.getByRole("status").filter({ hasText: "Needs input" });
	const frontAvatar = resumedStatus.locator('[data-agent-loading-slot="front"]');
	const initialFrontFingerprint = await frontAvatar.innerHTML();
	await page.waitForTimeout(2_300);

	expect((await frontAvatar.innerHTML()) === initialFrontFingerprint).toBe(true);
	expect(await resumedStatus.locator(".agent-loading").getAttribute("data-swapping")).not.toBe("true");
});
