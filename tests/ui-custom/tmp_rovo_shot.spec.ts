import { test } from "@playwright/test";
test("shot", async ({ page }) => {
  await page.goto((process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:4343") + "/components/ui-custom/stack-trace", { waitUntil: "networkidle" });
  const card = page.locator(".not-prose").first();
  await card.scrollIntoViewIfNeeded();
  await card.screenshot({ path: "output/playwright/stack-trace-card.png" });
});
