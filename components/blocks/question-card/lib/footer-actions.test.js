const test = require("node:test");
const assert = require("node:assert/strict");

const {
	getQuestionCardPrimaryAction,
	shouldShowQuestionCardSkipAction,
	shouldShowQuestionCardFooter,
} = require("./footer-actions.ts");

test("keeps Skip as the footer action when the current question is unanswered", () => {
	// Unanswered current question, more questions remain.
	assert.equal(getQuestionCardPrimaryAction(false, false, true), "skip");
	// Unanswered current question on the last step.
	assert.equal(getQuestionCardPrimaryAction(false, false, false), "skip");
});

test("switches footer action to Next once the current question is answered and a later question remains", () => {
	// Regression: multi-select picks (or custom text) on a non-final question must advance, not skip.
	assert.equal(getQuestionCardPrimaryAction(false, true, true), "next");
});

test("switches footer action to Submit when the answered current question is the last one", () => {
	assert.equal(getQuestionCardPrimaryAction(false, true, false), "submit");
});

test("switches footer action to Submit once every question is answered", () => {
	assert.equal(getQuestionCardPrimaryAction(true, true, false), "submit");
	assert.equal(getQuestionCardPrimaryAction(true, true, true), "submit");
});

test("hides Skip when custom input is off and header dismiss already cancels", () => {
	assert.equal(shouldShowQuestionCardSkipAction(false, "skip", true), false);
	assert.equal(shouldShowQuestionCardFooter(false, "skip", true), false);
});

test("keeps Skip when custom input is off but no dismiss control exists", () => {
	assert.equal(shouldShowQuestionCardSkipAction(false, "skip", false), true);
	assert.equal(shouldShowQuestionCardFooter(false, "skip", false), true);
});

test("keeps Skip in the footer when the custom input row is visible", () => {
	assert.equal(shouldShowQuestionCardSkipAction(true, "skip", true), true);
	assert.equal(shouldShowQuestionCardFooter(true, "skip", true), true);
});

test("keeps Next and Submit in the footer even without a custom input row", () => {
	assert.equal(shouldShowQuestionCardFooter(false, "next", true), true);
	assert.equal(shouldShowQuestionCardFooter(false, "submit", true), true);
});
