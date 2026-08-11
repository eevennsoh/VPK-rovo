import { expect, test, type Locator, type Page } from "@playwright/test";

const CODE_REVIEW_URL = `${
	process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000"
}/preview/blocks/code-review`;

type DiffSide = "additions" | "deletions";

function getDiffLine(page: Page, side: DiffSide, lineNumber: number): Locator {
	const lineType = side === "additions" ? "change-addition" : "change-deletion";

	return page
		.locator("diffs-container")
		.locator([
			`[data-${side}] [data-line="${lineNumber}"]`,
			`[data-unified] [data-line="${lineNumber}"][data-line-type="${lineType}"]`,
		].join(", "))
		.first();
}

function getDiffLineNumber(page: Page, side: DiffSide, lineNumber: number): Locator {
	const lineType = side === "additions" ? "change-addition" : "change-deletion";

	return page
		.locator("diffs-container")
		.locator([
			`[data-${side}] [data-column-number="${lineNumber}"]`,
			`[data-unified] [data-column-number="${lineNumber}"][data-line-type="${lineType}"]`,
		].join(", "))
		.first();
}

async function getCenter(locator: Locator, description: string) {
	const box = await locator.boundingBox();
	if (!box) {
		throw new Error(`Expected ${description} to have a visible bounding box.`);
	}

	return {
		x: box.x + box.width / 2,
		y: box.y + box.height / 2,
	};
}

async function getLineNumberSelectionPoint(locator: Locator, description: string) {
	const box = await locator.boundingBox();
	if (!box) {
		throw new Error(`Expected ${description} to have a visible bounding box.`);
	}

	return {
		x: box.x + 2,
		y: box.y + box.height / 2,
	};
}

async function getGutterButton(page: Page, side: DiffSide, lineNumber: number) {
	await getDiffLine(page, side, lineNumber).hover();
	const button = page.getByRole("button", { name: "Add inline comment" });
	await expect(button).toBeVisible();
	return button;
}

async function dragGutterToLine({
	endLineNumber,
	endSide,
	page,
	side,
	startLineNumber,
}: {
	endLineNumber: number;
	endSide?: DiffSide;
	page: Page;
	side: DiffSide;
	startLineNumber: number;
}) {
	const resolvedEndSide = endSide ?? side;
	const button = await getGutterButton(page, side, startLineNumber);
	const start = await getCenter(button, "Pierre's gutter utility");
	const endLine = await getCenter(
		getDiffLine(page, resolvedEndSide, endLineNumber),
		`diff line ${endLineNumber}`,
	);

	await page.mouse.move(start.x, start.y);
	await page.mouse.down();
	await page.mouse.move(endLine.x, endLine.y, { steps: 8 });
	await page.mouse.up();
}

async function selectLineRange({
	endLineNumber,
	page,
	side,
	startLineNumber,
}: {
	endLineNumber: number;
	page: Page;
	side: DiffSide;
	startLineNumber: number;
}) {
	const start = await getLineNumberSelectionPoint(
		getDiffLineNumber(page, side, startLineNumber),
		`line number ${startLineNumber}`,
	);
	const end = await getLineNumberSelectionPoint(
		getDiffLineNumber(page, side, endLineNumber),
		`line number ${endLineNumber}`,
	);

	await page.mouse.move(start.x, start.y);
	await page.mouse.down();
	await page.mouse.move(end.x, end.y, { steps: 8 });
	await page.mouse.up();
}

async function commitOpenComment(page: Page, accessibleName: string, comment: string) {
	const editor = page.getByRole("textbox", { name: accessibleName });
	const draft = page.locator('[data-inline-comment-kind="draft"]').filter({ has: editor });
	await expect(editor).toHaveCount(1);
	await expect(editor).toBeFocused();
	await editor.fill(comment);
	await editor.press("Control+Enter");
	await expect(draft).toHaveCount(0);
	await expect(page.locator('[data-inline-comment-kind="comment"]').filter({ has: editor })).toHaveCount(1);
}

test("range comments persist across files and layouts and attach to the composer", async ({ page }) => {
	await page.goto(CODE_REVIEW_URL, { waitUntil: "domcontentloaded" });
	await expect(page.getByRole("heading", { name: /TWC-109/u })).toBeVisible();

	await dragGutterToLine({
		endLineNumber: 22,
		page,
		side: "additions",
		startLineNumber: 16,
	});
	await commitOpenComment(
		page,
		"Comment on lines 16 - 22",
		"Guard the complete quantity validation block.",
	);
	await expect(page.getByRole("button", { name: "Review 1 comment" })).toBeVisible();

	const postCommitButton = await getGutterButton(page, "additions", 16);
	await postCommitButton.click();
	const postCommitEditor = page.getByRole("textbox", { name: "Comment on line 16" });
	await expect(postCommitEditor).toHaveCount(1);
	await postCommitEditor.press("Escape");

	const postCancelButton = await getGutterButton(page, "additions", 17);
	await postCancelButton.click();
	const postCancelEditor = page.getByRole("textbox", { name: "Comment on line 17" });
	await expect(postCancelEditor).toHaveCount(1);
	await postCancelEditor.press("Escape");

	await page.getByRole("treeitem", { name: /UserProfileDialog\.ts/u }).click();
	await expect(page.getByRole("button", { name: "Close src/components/UserProfileDialog.ts" })).toBeVisible();
	await page.getByRole("button", { name: "Split diff layout" }).click();
	await expect(page.getByRole("button", { name: "Split diff layout" })).toHaveAttribute("aria-pressed", "true");

	await selectLineRange({
		endLineNumber: 16,
		page,
		side: "deletions",
		startLineNumber: 17,
	});
	await expect(page.getByRole("textbox", { name: "Comment on lines 16 - 17" })).toHaveCount(0);
	const selectedRangeButton = await getGutterButton(page, "deletions", 16);
	const selectedRangeButtonCenter = await getCenter(selectedRangeButton, "selected range gutter utility");
	await page.mouse.click(selectedRangeButtonCenter.x, selectedRangeButtonCenter.y);
	await commitOpenComment(
		page,
		"Comment on lines 16 - 17",
		"Remove both temporary lines before merging.",
	);

	const reviewComments = page.getByRole("button", { name: "Review 2 comments" });
	await expect(reviewComments).toBeVisible();
	await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled();

	await page.getByRole("button", { name: "Unified diff layout" }).click();
	await expect(page.getByRole("button", { name: "Unified diff layout" })).toHaveAttribute("aria-pressed", "true");
	await expect(reviewComments).toBeVisible();

	await reviewComments.click();
	const commentsPopover = page.locator('[data-slot="popover-content"]');
	await expect(commentsPopover).toBeVisible();
	await expect(commentsPopover.getByText("ipc.mp.test.ts", { exact: true })).toBeVisible();
	await expect(commentsPopover.getByText("Lines 16 - 22", { exact: true })).toBeVisible();
	await expect(commentsPopover.getByText("src/components/UserProfileDialog.ts", { exact: true })).toBeVisible();
	await expect(commentsPopover.getByText("Lines 16 - 17", { exact: true })).toBeVisible();
	await page.keyboard.press("Escape");

	await page.getByRole("treeitem", { name: "ipc.mp.test.ts" }).click();
	await page.getByRole("button", {
		name: "Delete comment on ipc.mp.test.ts, lines 16 - 22",
	}).click();
	await expect(page.getByRole("button", { name: "Review 1 comment" })).toBeVisible();

	await page.getByRole("button", { name: "Remove all inline comments" }).click();
	await expect(page.getByTestId("inline-comments-chip")).toHaveCount(0);
	await expect(page.getByRole("button", { name: "Submit" })).toBeDisabled();
});

test("single-line keyboard activation remains available and cancelled ranges create no draft", async ({ page }) => {
	await page.goto(CODE_REVIEW_URL, { waitUntil: "domcontentloaded" });
	await expect(page.getByRole("heading", { name: /TWC-109/u })).toBeVisible();

	const keyboardButton = await getGutterButton(page, "additions", 16);
	await keyboardButton.focus();
	await keyboardButton.press("Enter");
	const singleLineEditor = page.getByRole("textbox", { name: "Comment on line 16" });
	await expect(singleLineEditor).toHaveCount(1);
	await singleLineEditor.press("Escape");
	await expect(singleLineEditor).toHaveCount(0);

	await page.getByRole("button", { name: "Split diff layout" }).click();
	await dragGutterToLine({
		endLineNumber: 16,
		page,
		side: "deletions",
		startLineNumber: 17,
	});
	const reverseRangeEditor = page.getByRole("textbox", { name: "Comment on lines 16 - 17" });
	await expect(reverseRangeEditor).toHaveCount(1);
	await reverseRangeEditor.press("Escape");
	await expect(reverseRangeEditor).toHaveCount(0);
	await page.getByRole("button", { name: "Unified diff layout" }).click();
	await page.getByRole("button", { name: "Split diff layout" }).click();

	await dragGutterToLine({
		endLineNumber: 16,
		endSide: "deletions",
		page,
		side: "additions",
		startLineNumber: 16,
	});
	await expect(page.getByRole("textbox", { name: /Comment on/u })).toHaveCount(0);

	const cancelButton = await getGutterButton(page, "additions", 16);
	const cancelStart = await getCenter(cancelButton, "Pierre's gutter utility");
	const cancelEnd = await getCenter(getDiffLine(page, "additions", 22), "diff line 22");
	await page.mouse.move(cancelStart.x, cancelStart.y);
	await page.mouse.down();
	await page.mouse.move(cancelEnd.x, cancelEnd.y, { steps: 8 });
	await cancelButton.dispatchEvent("pointercancel", {
		bubbles: true,
		composed: true,
		pointerId: 1,
		pointerType: "mouse",
	});
	await page.mouse.up();
	await expect(page.getByRole("textbox", { name: /Comment on/u })).toHaveCount(0);
	await expect(page.getByTestId("inline-comments-chip")).toHaveCount(0);
});
