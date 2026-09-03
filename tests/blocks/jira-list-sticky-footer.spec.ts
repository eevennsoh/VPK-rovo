import { expect, test, type Page } from "@playwright/test";

const JIRA_GOLDEN_JOURNEYS_V4_URL = `${
	process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000"
}/jira-golden-journeys-v4`;

interface ListFooterGeometry {
	gapTableToFooter: number;
	footerToSectionBottom: number;
	scrollable: boolean;
	rowCount: number;
}

async function readListFooterGeometry(page: Page): Promise<ListFooterGeometry> {
	return page.evaluate(() => {
		const section = document.querySelector("[data-testid=jira-list]");
		const scrollport = document.querySelector("[data-testid=jira-list-table-scroll]");
		const footer = document.querySelector("[data-testid=jira-list-sticky-footer]");
		const table = scrollport?.querySelector("table");
		if (!section || !scrollport || !footer || !table) {
			throw new Error("Jira list is not mounted");
		}
		const tableRect = table.getBoundingClientRect();
		const footerRect = footer.getBoundingClientRect();
		const sectionRect = section.getBoundingClientRect();
		return {
			gapTableToFooter: footerRect.top - tableRect.bottom,
			footerToSectionBottom: sectionRect.bottom - footerRect.bottom,
			scrollable: scrollport.scrollHeight > scrollport.clientHeight,
			rowCount: scrollport.querySelectorAll("tbody tr").length,
		};
	});
}

async function openWorkItemsList(page: Page) {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(JIRA_GOLDEN_JOURNEYS_V4_URL, { waitUntil: "domcontentloaded" });
	// Team EU splits work items into Board and List tabs.
	await page.getByRole("tab", { name: "List", exact: true }).click();
	await expect(page.getByTestId("jira-list")).toBeVisible();
}

test("the work items list hugs short content instead of stranding its footer", async ({ page }) => {
	await openWorkItemsList(page);

	// Filter down to a handful of rows so the table cannot fill the container.
	await page.getByRole("button", { name: "Filter list by Diego Santos" }).click();

	await expect.poll(async () => (await readListFooterGeometry(page)).rowCount)
		.toBeLessThan(10);

	const geometry = await readListFooterGeometry(page);
	expect(geometry.scrollable).toBe(false);
	// The footer sits directly under the last row — no slack absorbed above it.
	expect(Math.abs(geometry.gapTableToFooter)).toBeLessThanOrEqual(1);
});

test("the work items list anchors its footer once the rows overflow", async ({ page }) => {
	await openWorkItemsList(page);

	const geometry = await readListFooterGeometry(page);
	expect(geometry.rowCount).toBeGreaterThan(10);
	expect(geometry.scrollable).toBe(true);
	// Sticky footer stays parked on the card's bottom edge (1px border).
	expect(geometry.footerToSectionBottom).toBeLessThanOrEqual(2);
});
