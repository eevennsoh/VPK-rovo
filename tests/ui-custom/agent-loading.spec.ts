import { expect, test } from "@playwright/test";

const AGENT_LOADING_URL = `${
	process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000"
}/components/ui-custom/agent-loading`;

test("a live reduced-motion preference stops Agent Loading before it resumes", async ({ page }) => {
	await page.goto(AGENT_LOADING_URL, { waitUntil: "domcontentloaded" });

	const activeStatus = page.getByRole("status").filter({ hasText: "Needs input" }).first();
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

	const resumedStatus = page.getByRole("status").filter({ hasText: "Needs input" }).first();
	const frontAvatar = resumedStatus.locator('[data-agent-loading-slot="front"]');
	const initialFrontFingerprint = await frontAvatar.innerHTML();
	await page.waitForTimeout(2_300);

	expect((await frontAvatar.innerHTML()) === initialFrontFingerprint).toBe(true);
	expect(await resumedStatus.locator(".agent-loading").getAttribute("data-swapping")).not.toBe("true");
});

test("re-enabling motion after an interrupted swap does not resurface a mid-flight layout", async ({ page }) => {
	await page.clock.install();
	await page.goto(AGENT_LOADING_URL, { waitUntil: "domcontentloaded" });

	const cycling = page
		.getByRole("status")
		.filter({ hasText: "Needs input" })
		.first()
		.locator(".agent-loading");
	await expect(cycling).toHaveAttribute("data-cycling", "true");

	await expect(async () => {
		await page.clock.runFor(50);
		expect(await cycling.getAttribute("data-swapping")).toBe("true");
	}).toPass({ timeout: 30_000 });

	await page.emulateMedia({ reducedMotion: "reduce" });
	await expect.poll(async () => cycling.getAttribute("data-swapping")).not.toBe("true");

	await page.emulateMedia({ reducedMotion: "no-preference" });
	await page.waitForTimeout(1_000);

	expect(await cycling.getAttribute("data-swapping")).not.toBe("true");
});
