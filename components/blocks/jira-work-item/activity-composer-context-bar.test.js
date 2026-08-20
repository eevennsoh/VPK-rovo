const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/blocks/jira-work-item/experimental-v2/experimental-v2-jira-work-item.tsx"),
	"utf8",
);
const COMPOSER_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/blocks/jira-work-item/experimental-v2/components/activity-composer.tsx"),
	"utf8",
);

test("the host-owned composer context bar is optional and reaches ActivityComposer", () => {
	assert.match(ROOT_SOURCE, /composerContextBar\?: ReactNode;/u);
	assert.match(ROOT_SOURCE, /composerContextBar=\{props\.composerContextBar\}/u);
	assert.match(ROOT_SOURCE, /<ActivityComposer[\s\S]*composerContextBar=\{composerContextBar\}/u);
});

test("the host-owned bar replaces only the standard context-pill row", () => {
	assert.match(COMPOSER_SOURCE, /composerContextBar\?: ReactNode;/u);
	assert.match(
		COMPOSER_SOURCE,
		/hasExpandedPullRequestComposer \? null : \([\s\S]*composerContextBar !== undefined \? composerContextBar : \([\s\S]*<ActivityComposerContextPills/u,
	);
	assert.match(COMPOSER_SOURCE, /onInvokeAgent=\{handleInvokeAgent\}/u);
	assert.match(COMPOSER_SOURCE, /onInvokeSkill=\{handleInvokeSkill\}/u);
});
