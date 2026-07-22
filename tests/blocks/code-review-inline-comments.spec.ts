import { expect, test, type Locator, type Page } from "@playwright/test";

const CODE_REVIEW_URL = `${
	process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000"
}/preview/blocks/code-review`;

function getDiffLine(
	page: Page,
	side: "additions" | "deletions",
	lineNumber: number,
): Locator {
	const lineType = side === "additions" ? "change-addition" : "change-deletion";

	return page
		.locator("diffs-container")
		.locator([
			`[data-${side}] [data-line="${lineNumber}"]`,
			`[data-unified] [data-line="${lineNumber}"][data-line-type="${lineType}"]`,
		].join(", "))
		.first();
}

async function addInlineComment({
	comment,
	lineNumber,
	page,
	path,
	side,
}: {
	comment: string;
	lineNumber: number;
	page: Page;
	path: string;
	side: "additions" | "deletions";
}) {
	await getDiffLine(page, side, lineNumber).hover();
	const addButton = page.getByRole("button", { name: "Add inline comment" });
	await expect(addButton).toBeVisible();
	const addButtonBox = await addButton.boundingBox();
	if (!addButtonBox) {
		throw new Error("Expected Pierre's gutter utility to have a visible bounding box.");
	}
	// Pierre renders the React utility through a light-DOM slot inside its
	// shadow-root host. A real pointer click reaches the button, while
	// Playwright's locator actionability sees the host as the hit target.
	await page.mouse.click(
		addButtonBox.x + addButtonBox.width / 2,
		addButtonBox.y + addButtonBox.height / 2,
	);
	const sideLabel = side === "additions" ? "new" : "old";
	const editor = page.getByRole("textbox", {
		name: `Comment on ${path}, ${sideLabel} side, line ${lineNumber}`,
	});
	await expect(editor).toHaveCount(1);
	await expect(editor).toBeFocused();
	await editor.fill(comment);
	await editor.press("Control+Enter");
	await expect(editor).toHaveCount(0);
}

test("inline comments persist across files and layouts and attach to the composer", async ({ page }) => {
	await page.goto(CODE_REVIEW_URL, { waitUntil: "domcontentloaded" });
	await expect(page.getByRole("heading", { name: /TWC-109/u })).toBeVisible();

	await addInlineComment({
		comment: "Guard against NaN before updating quantity.",
		lineNumber: 16,
		page,
		path: "ipc.mp.test.ts",
		side: "additions",
	});
	await expect(page.getByRole("button", { name: "Review 1 comment" })).toBeVisible();

	await page.getByRole("treeitem", { name: "src/components/UserProfileDialog.ts" }).click();
	await expect(page.getByRole("button", { name: "Close src/components/UserProfileDialog.ts" })).toBeVisible();
	await addInlineComment({
		comment: "Remove the temporary logging before merging.",
		lineNumber: 16,
		page,
		path: "src/components/UserProfileDialog.ts",
		side: "deletions",
	});

	const reviewComments = page.getByRole("button", { name: "Review 2 comments" });
	await expect(reviewComments).toBeVisible();
	await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled();

	await page.getByRole("button", { name: "Unified diff layout" }).click();
	await expect(page.getByRole("button", { name: "Unified diff layout" })).toHaveAttribute("aria-pressed", "true");
	await page.getByRole("button", { name: "Split diff layout" }).click();
	await expect(page.getByRole("button", { name: "Split diff layout" })).toHaveAttribute("aria-pressed", "true");
	await expect(reviewComments).toBeVisible();

	await reviewComments.click();
	const commentsPopover = page.getByRole("heading", { name: "Inline review comments" }).locator("..");
	await expect(commentsPopover).toBeVisible();
	await expect(commentsPopover.getByText("ipc.mp.test.ts", { exact: true })).toBeVisible();
	await expect(commentsPopover.getByText("New side · line 16", { exact: true })).toBeVisible();
	await expect(commentsPopover.getByText("src/components/UserProfileDialog.ts", { exact: true })).toBeVisible();
	await expect(commentsPopover.getByText("Old side · line 16", { exact: true })).toBeVisible();
	await page.keyboard.press("Escape");

	await page.getByRole("treeitem", { name: "ipc.mp.test.ts" }).click();
	await page.getByRole("button", {
		name: "Delete comment on ipc.mp.test.ts, new side, line 16",
	}).click();
	await expect(page.getByRole("button", { name: "Review 1 comment" })).toBeVisible();

	await page.getByRole("button", { name: "Remove all inline comments" }).click();
	await expect(page.getByTestId("inline-comments-chip")).toHaveCount(0);
	await expect(page.getByRole("button", { name: "Submit" })).toHaveCount(0);
});
