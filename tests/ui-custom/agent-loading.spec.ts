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

test("re-enabling motion after an interrupted swap does not resurface the swapped layout", async ({ page }) => {
	// A frozen clock makes the 150ms swap window reachable; wall-clock timing
	// would only land inside it for 7% of each 2150ms cycle.
	await page.clock.install();
	await page.goto(AGENT_LOADING_URL, { waitUntil: "domcontentloaded" });

	const cycling = page
		.getByRole("status")
		.filter({ hasText: "Needs input" })
		.locator(".agent-loading");
	await expect(cycling).toHaveAttribute("data-cycling", "true");

	// Advance in small steps until the swap phase opens. Stepping rather than
	// jumping keeps this correct no matter when hydration schedules the hold.
	await expect(async () => {
		await page.clock.runFor(50);
		expect(await cycling.getAttribute("data-swapping")).toBe("true");
	}).toPass({ timeout: 30_000 });

	// Interrupt the swap in flight.
	await page.emulateMedia({ reducedMotion: "reduce" });
	await expect.poll(async () => cycling.getAttribute("data-swapping")).not.toBe("true");

	// Restore motion before any new swap timer exists, then settle the
	// media-query re-render.
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await page.waitForTimeout(1_000);

	// The clock is still paused, so no legitimate swap can have started; a
	// swapped layout here is the stale latch resurfacing.
	expect(await cycling.getAttribute("data-swapping")).not.toBe("true");
});
