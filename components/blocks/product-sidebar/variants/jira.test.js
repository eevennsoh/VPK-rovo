const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const JIRA_SIDEBAR_SOURCE = fs.readFileSync(path.join(__dirname, "jira.tsx"), "utf8");

test("Jira sidebar uses the shared Studio-style side nav row contract", () => {
	assert.match(
		JIRA_SIDEBAR_SOURCE,
		/import \{ SidebarNavItem, SidebarNavItemAction \} from "@\/components\/ui-custom\/sidebar-nav-item";/u,
	);
	assert.match(JIRA_SIDEBAR_SOURCE, /<nav aria-label="Jira" className="flex shrink-0 flex-col gap-3">/u);
	assert.match(
		JIRA_SIDEBAR_SOURCE,
		/className="px-1\.5 text-xs font-semibold leading-4 text-text-subtlest"/u,
	);
	assert.match(JIRA_SIDEBAR_SOURCE, /title="Starred"/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /STARRED_PROJECTS\.map/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /JIRA_EXTERNAL_LINKS\.map/u);
	assert.doesNotMatch(JIRA_SIDEBAR_SOURCE, /NavigationItem/u);
	assert.doesNotMatch(JIRA_SIDEBAR_SOURCE, /NavigationItemWithHoverChevron/u);
	assert.doesNotMatch(JIRA_SIDEBAR_SOURCE, /SectionHeading/u);
	assert.doesNotMatch(JIRA_SIDEBAR_SOURCE, /<Divider/u);
});
