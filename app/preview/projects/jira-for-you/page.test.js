const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const SOURCE = readFileSync(path.join(__dirname, "page.tsx"), "utf8");

test("Jira For You preview route provides Rovo context to the shared Jira shell", () => {
	assert.match(SOURCE, /import \{ RovoChatProvider \} from "@\/app\/contexts\/context-rovo-chat";/u);
	assert.match(SOURCE, /import \{ JiraForYouShell \} from "@\/components\/projects\/jira-for-you\/page";/u);
	assert.match(SOURCE, /<RovoChatProvider>[\s\S]*<JiraForYouShell \/>[\s\S]*<\/RovoChatProvider>/u);
	assert.doesNotMatch(SOURCE, /JiraForYouWorkspace|ProductSidebar|TopNavigation|useState/u);
});
