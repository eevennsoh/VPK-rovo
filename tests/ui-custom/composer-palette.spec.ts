import { expect, test } from "@playwright/test";

/**
 * E2E coverage for the tiptap chat-composer palette (Phase 2).
 *
 * Requires a running stack (defaults to http://localhost:3000; override with
 * PLAYWRIGHT_BASE_URL). NOT part of the `ci:pr` gate — run with
 * `pnpm exec playwright test tests/ui-custom/composer-palette.spec.ts`.
 *
 * Targets the chat-composer block demo, which renders the shared PromptInput
 * primitive — now a mentions-only tiptap contentEditable with the `/` and `@`
 * palettes. Assertions are anchored to real catalog labels from
 * app/data/directory (skills/people) so they stay meaningful as data evolves.
 */

const COMPOSER_URL = `${
	process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000"
}/preview/blocks/chat-composer`;

// The tiptap editor renders as a ProseMirror contentEditable inside the primitive.
const EDITOR = ".ProseMirror[contenteditable='true']";

test.beforeEach(async ({ page }) => {
	await page.goto(COMPOSER_URL);
	await expect(page.locator(EDITOR).first()).toBeVisible();
});

test("`/` opens the slash menu with reference categories and excludes text formatting", async ({ page }) => {
	const editor = page.locator(EDITOR).first();
	await editor.click();
	await page.keyboard.type("/");

	// The slash surface lists Ask Rovo + reference categories…
	await expect(page.getByText("Ask Rovo", { exact: false })).toBeVisible();
	await expect(page.getByText(/skills/i).first()).toBeVisible();

	// …but NOT the document editor's block-formatting commands (includeFormat:false).
	await expect(page.getByText(/^Heading 1$/)).toHaveCount(0);
	await expect(page.getByText(/^Bullet list$/)).toHaveCount(0);
});

test("`@` opens the mention menu for people and teams", async ({ page }) => {
	const editor = page.locator(EDITOR).first();
	await editor.click();
	await page.keyboard.type("@");

	// People/team mention targets surface (catalog has people like "Priya Nair").
	await expect(page.getByText(/people|team/i).first()).toBeVisible();
});

test("selecting a `/` reference inserts an inline token, and Escape closes the menu", async ({ page }) => {
	const editor = page.locator(EDITOR).first();
	await editor.click();

	// Escape closes the open menu without inserting anything.
	await page.keyboard.type("/");
	await expect(page.getByText("Ask Rovo", { exact: false })).toBeVisible();
	await page.keyboard.press("Escape");
	await expect(page.getByText("Ask Rovo", { exact: false })).toHaveCount(0);

	// Re-open, narrow to a known skill, and select it -> inline mention token.
	await page.keyboard.type("/Summarize");
	const option = page.getByText(/Summarize/i).first();
	await expect(option).toBeVisible();
	await option.click();

	// The inserted reference renders as an inline mention chip inside the editor.
	await expect(editor.locator(".rich-text-mention, [data-mention]").first()).toBeVisible();
});

test("Shift+Enter inserts a newline rather than submitting", async ({ page }) => {
	const editor = page.locator(EDITOR).first();
	await editor.click();
	await page.keyboard.type("first line");
	await page.keyboard.press("Shift+Enter");
	await page.keyboard.type("second line");

	// Both lines remain in the still-focused editor (no submit/clear happened).
	await expect(editor).toContainText("first line");
	await expect(editor).toContainText("second line");
});
