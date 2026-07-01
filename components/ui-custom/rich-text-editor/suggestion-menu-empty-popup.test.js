const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function readProjectFile(filePath) {
	return fs.readFileSync(path.join(process.cwd(), filePath), "utf8");
}

const SOURCE = readProjectFile("components/ui-custom/rich-text-editor/suggestion-menu.tsx");

function getSourceBetween(startMarker, endMarker) {
	const start = SOURCE.indexOf(startMarker);
	const end = SOURCE.indexOf(endMarker, start);
	assert.ok(start > -1, `expected to find start marker: ${startMarker}`);
	assert.ok(end > start, `expected to find end marker after: ${endMarker}`);
	return SOURCE.slice(start, end);
}

function assertPopupHidesBeforeRenderingEmptyState(source) {
	const displayAssignment = 'popupState.element.style.display = shouldHidePopup ? "none" : "";';
	const displayAssignmentIndex = source.indexOf(displayAssignment);
	const hideCheckIndex = source.indexOf("if (shouldHidePopup)");
	const updatePropsIndex = source.indexOf("popupState.component?.updateProps");

	assert.ok(displayAssignmentIndex > -1, "expected the popup display assignment");
	assert.ok(hideCheckIndex > -1, "expected an early shouldHidePopup guard");
	assert.ok(
		displayAssignmentIndex < hideCheckIndex,
		"expected the popup display assignment before the early hide guard",
	);
	assert.ok(updatePropsIndex > hideCheckIndex, "expected popup rendering after the hide guard");
	assert.match(
		source.slice(hideCheckIndex, updatePropsIndex),
		/if \(shouldHidePopup\) \{\s*return;\s*\}/u,
	);
}

test("slash suggestion filters hide the popup when no rows and no Ask Rovo header remain", () => {
	const slashUpdate = getSourceBetween(
		"function update(props: SuggestionProps<RichTextSlashAction, RichTextSlashAction>)",
		"\t/** Clamp/snap the selection onto a selectable row (skips headings). */",
	);

	assert.match(
		slashUpdate,
		/const shouldShowAskRovoHeader = showAskRovoPrompt && \(isFlat \|\| !activeCategory\);/u,
	);
	assert.match(
		slashUpdate,
		/const shouldHidePopup = items\.length === 0 && !shouldShowAskRovoHeader;/u,
	);
	assertPopupHidesBeforeRenderingEmptyState(slashUpdate);
});

test("mention suggestion filters hide the popup instead of rendering a no-results box", () => {
	const mentionUpdate = getSourceBetween(
		"function update(props: SuggestionProps<RichTextMentionItem, RichTextMentionItem>)",
		"\t/** Resolve a mention by id across both \"@\" parent categories. */",
	);

	assert.match(mentionUpdate, /const shouldHidePopup = items\.length === 0;/u);
	assertPopupHidesBeforeRenderingEmptyState(mentionUpdate);
});
