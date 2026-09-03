import { expect, test, type Locator, type Page } from "@playwright/test";

const JIRA_GOLDEN_JOURNEYS_V4_URL = (
	process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000"
) + "/jira-golden-journeys-v4";

const DESIGN_VARIANTS_STORAGE_KEY = "ui-design-variants";
const AGENT_SESSION_COLUMN_WIDTH_PX = 280;
const AGENT_SESSION_COLUMN_COLLAPSED_WIDTH_PX = 32;

function getPanel(page: Page): Locator {
	// The panel is a <section> with an accessible name, so it exposes role
	// "region".
	return page.getByRole("region", { name: "Untracked work panel" });
}

/** The untracked-work column itself, wherever it currently lives. */
function getAgentSessionColumn(page: Page): Locator {
	return page.locator("[data-agent-session-column]");
}

async function openBoard(page: Page, options?: { panelVariant?: boolean }): Promise<void> {
	if (options?.panelVariant) {
		// Seeding the store before navigation is deterministic and keeps the
		// overlay tests independent of the settings dropdown; one test below
		// drives the real menu to prove the toggle is wired.
		await page.addInitScript(
			([key, value]) => {
				window.localStorage.setItem(key, value);
			},
			[DESIGN_VARIANTS_STORAGE_KEY, JSON.stringify({ panel: true })] as const,
		);
	}
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(JIRA_GOLDEN_JOURNEYS_V4_URL, { waitUntil: "domcontentloaded" });
	await expect(page.getByRole("heading", { name: "Jira Design" })).toBeVisible({
		timeout: 30_000,
	});
}

/** The panel mounts minimised; open it to its full 280px. */
async function expandPanel(page: Page): Promise<void> {
	await page.getByRole("button", { name: "Expand Untracked work column" }).click();
	await expect.poll(async () => (await getPanel(page).boundingBox())?.width)
		.toBe(AGENT_SESSION_COLUMN_WIDTH_PX);
}

interface HorizontalSpan {
	left: number;
	right: number;
}

async function readSpan(locator: Locator): Promise<HorizontalSpan> {
	const box = await locator.boundingBox();
	expect(box).not.toBeNull();
	if (!box) throw new Error("element is not laid out");
	return { left: box.x, right: box.x + box.width };
}

test("the panel floats over the board instead of taking a column of its own", async ({ page }) => {
	await openBoard(page, { panelVariant: true });
	const panel = getPanel(page);
	await expect(panel).toBeVisible();
	await expandPanel(page);

	const panelSpan = await readSpan(panel);
	const scrollportSpan = await readSpan(page.locator("[data-jira-kanban-scrollport]"));

	// The panel is pinned to the trailing edge, so the board's scrollport starts
	// well before it and runs to at least its trailing edge: the board owns the
	// full region width and the panel is layered on top of it.
	expect(scrollportSpan.left).toBeLessThan(panelSpan.left);
	expect(scrollportSpan.right).toBeGreaterThanOrEqual(panelSpan.right);

	// The decisive claim: real board content occupies the panel's x-range. An
	// in-flow column would have left the panel's strip empty.
	const columnUnderPanel = await page
		.locator("[data-jira-kanban-card-list]")
		.evaluateAll((nodes, panelLeft) => nodes.some((node) => {
			const rect = node.getBoundingClientRect();
			return rect.right > panelLeft;
		}), panelSpan.left);
	expect(columnUnderPanel).toBe(true);

	// And the overlap is the panel painting over the card list, not the other
	// way round — hit-testing inside the panel resolves to the panel.
	const panelOwnsItsPixels = await panel.evaluate((node) => {
		const rect = node.getBoundingClientRect();
		const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
		return hit !== null && node.contains(hit);
	});
	expect(panelOwnsItsPixels).toBe(true);
});

test("the panel docks from the tab strip down, clear of the board header", async ({ page }) => {
	await openBoard(page, { panelVariant: true });
	await expandPanel(page);

	const tabStrip = page.locator("header [role=tablist]").first();
	const tabsBox = await tabStrip.boundingBox();
	expect(tabsBox).not.toBeNull();
	if (!tabsBox) throw new Error("tab strip is not laid out");
	const tabsBottom = tabsBox.y + tabsBox.height;
	const panelBox = await getPanel(page).boundingBox();
	expect(panelBox).not.toBeNull();
	if (!panelBox) throw new Error("panel is not laid out");

	// The panel takes a real `top` offset, so its top edge must land exactly on
	// the underside of the tab strip's rule — not near it. This is the guard on
	// BOARD_HEADER_TAB_STRIP_BOTTOM_PX, and the tolerance is zero on purpose: at
	// 83 (the band's height) the panel starts on the rule's own 1px row and
	// punches a visible hole in it for the rail's width. A ±2px tolerance let
	// exactly that ship once already.
	expect(panelBox.y).toBe(tabsBottom);

	// Its own header sits below the tabs and is fully visible, not clipped.
	const headerBox = await page.locator("[data-slot=panel-header]").boundingBox();
	expect(headerBox).not.toBeNull();
	expect(headerBox!.y).toBeGreaterThanOrEqual(tabsBottom);
	await expect(page.getByRole("button", { name: "Collapse panel" })).toBeVisible();
});

test("the tab strip's rule runs unbroken beneath the docked rail", async ({ page }) => {
	await openBoard(page, { panelVariant: true });

	const tabStrip = page.locator("header [role=tablist]").first();
	const tabsBox = await tabStrip.boundingBox();
	expect(tabsBox).not.toBeNull();
	if (!tabsBox) throw new Error("tab strip is not laid out");

	// Sample the rule's own row across the full width, including the band the
	// rail occupies. Nothing may paint over it: `elementFromPoint` returning a
	// node inside the panel means the rule is occluded there — the "hole".
	const ruleY = Math.round(tabsBox.y + tabsBox.height) - 1;
	const samples = await page.evaluate(
		({ y, right }) => {
			const xs = [10, Math.round(right / 2), right - 40, right - 16, right - 2];
			return xs.map((x) => {
				const el = document.elementFromPoint(x, y);
				return { x, occludedByPanel: Boolean(el?.closest("[data-slot=panel-container]")) };
			});
		},
		{ y: ruleY, right: Math.round(tabsBox.x + tabsBox.width) },
	);

	expect(samples.filter((sample) => sample.occludedByPanel)).toEqual([]);
});

test("the docked rail is persistent — nothing can dismiss it", async ({ page }) => {
	await openBoard(page, { panelVariant: true });
	const panel = getPanel(page);
	await expect(panel).toBeVisible();

	// The rail IS the entry point, so the board header must not carry a
	// show/hide control — a closed state would be unreachable.
	await expect(page.getByRole("button", { name: /untracked work panel/i })).toHaveCount(0);

	// Collapsed: still mounted, still hosting the column.
	await expect(panel.locator("[data-agent-session-column]")).toHaveCount(1);

	// Expanded: the header offers collapse and no close.
	await expandPanel(page);
	await expect(page.getByRole("button", { name: "Collapse panel" })).toBeVisible();
	await expect(page.getByRole("button", { name: /close/i })).toHaveCount(0);
	await expect(panel).toBeVisible();
});

test("collapse shrinks the panel to the rail and the rail expands it back", async ({ page }) => {
	await openBoard(page, { panelVariant: true });
	const panel = getPanel(page);
	await expandPanel(page);
	await expect(page.getByRole("button", { name: "Collapse panel" })).toBeVisible();

	await page.getByRole("button", { name: "Collapse panel" }).click();
	await expect.poll(async () => (await panel.boundingBox())?.width)
		.toBe(AGENT_SESSION_COLUMN_COLLAPSED_WIDTH_PX);
	// At 32px the panel drops its own header — the rail carries the only
	// expand control, so a second header would be chrome on chrome.
	await expect(page.getByRole("button", { name: "Collapse panel" })).toHaveCount(0);
	await expect(panel.locator("[data-agent-session-column][data-collapsed]")).toHaveCount(1);

	await expandPanel(page);
	await expect(page.getByRole("button", { name: "Collapse panel" })).toBeVisible();
	await expect(panel.locator("[data-agent-session-column][data-collapsed]")).toHaveCount(0);
});

test("the panel survives the switch to the List view", async ({ page }) => {
	await openBoard(page, { panelVariant: true });
	const panel = getPanel(page);
	await expandPanel(page);

	await page.getByRole("tab", { name: "List", exact: true }).click();
	await expect(page.getByTestId("jira-list")).toBeVisible();

	// Same overlay, same width, still hosting the column: one panel serves both
	// views because both render into the same content region.
	await expect(panel).toBeVisible();
	await expect(panel.locator("[data-agent-session-column]")).toHaveCount(1);
	const panelSpan = await readSpan(panel);
	expect(panelSpan.right - panelSpan.left).toBe(AGENT_SESSION_COLUMN_WIDTH_PX);

	// The panel is pinned to the trailing edge and the list's leading cells are
	// `sticky left-0`, so nothing sticky sits under it and the list needs no
	// inset — it scrolls underneath exactly like the board does.
	const listSpan = await readSpan(page.getByTestId("jira-list"));
	expect(listSpan.left).toBeLessThan(panelSpan.left);
	expect(listSpan.right).toBeGreaterThan(panelSpan.left);

	// Collapsing narrows the panel without moving the list: there is no reserved
	// width to give back.
	await page.getByRole("button", { name: "Collapse panel" }).click();
	await expect.poll(async () => (await panel.boundingBox())?.width)
		.toBe(AGENT_SESSION_COLUMN_COLLAPSED_WIDTH_PX);
	expect((await readSpan(page.getByTestId("jira-list"))).left).toBe(listSpan.left);
});

test("with the variant off the column stays in flow and no panel renders", async ({ page }) => {
	await openBoard(page);

	await expect(getPanel(page)).toHaveCount(0);

	// Exactly one untracked-work column, and it is a board sibling: the first
	// status column starts after it rather than underneath it.
	const column = getAgentSessionColumn(page);
	await expect(column).toHaveCount(1);
	const columnSpan = await readSpan(column);
	const firstColumnSpan = await readSpan(
		page.locator("[data-jira-kanban-card-list]").first(),
	);
	expect(firstColumnSpan.left).toBeGreaterThanOrEqual(columnSpan.right);
});

test("the settings menu toggles the Panel variant on the live board", async ({ page }) => {
	await openBoard(page);
	await expect(getPanel(page)).toHaveCount(0);
	const inFlowColumnSpan = await readSpan(getAgentSessionColumn(page));

	await page.getByRole("button", { name: "Settings" }).click();
	const panelVariantItem = page.getByRole("menuitemcheckbox", { name: "Panel" });
	await expect(panelVariantItem).not.toBeChecked();
	await panelVariantItem.click();

	const panel = getPanel(page);
	await expect(panel).toBeVisible();
	// The presentations never coexist: the one column moved into the panel.
	await expect(getAgentSessionColumn(page)).toHaveCount(1);
	await expect(panel.locator("[data-agent-session-column]")).toHaveCount(1);
	const panelSpan = await readSpan(panel);
	// Turning the variant on moves the column from the board's leading edge to
	// the trailing edge as a floating panel.
	expect(panelSpan.left).toBeGreaterThan(inFlowColumnSpan.left);

	// The choice is persisted under the shared storage key.
	expect(
		await page.evaluate(
			(key) => window.localStorage.getItem(key),
			DESIGN_VARIANTS_STORAGE_KEY,
		),
	).toBe(JSON.stringify({ panel: true }));
});
