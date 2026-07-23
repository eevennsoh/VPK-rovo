const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const SOURCE = readFileSync(path.join(__dirname, "page.tsx"), "utf8");

test("Jira For You preview route wraps the reusable workspace in Jira shell chrome only at the preview boundary", () => {
	assert.match(SOURCE, /import \{ RovoChatProvider \} from "@\/app\/contexts\/context-rovo-chat";/u);
	assert.match(SOURCE, /import ProductSidebar from "@\/components\/blocks\/product-sidebar\/page";/u);
	assert.match(SOURCE, /import TopNavigation from "@\/components\/blocks\/top-navigation\/page";/u);
	assert.match(SOURCE, /<RovoChatProvider>[\s\S]*<JiraForYouPreviewShell \/>[\s\S]*<\/RovoChatProvider>/u);
	assert.match(
		SOURCE,
		/<TopNavigation[\s\S]*forceShowRovoAction[\s\S]*product="jira"[\s\S]*searchAlignment="sidebar"[\s\S]*variant="shell"/u,
	);
	assert.match(
		SOURCE,
		/sidebar=\{\(slot\) => \([\s\S]*<ProductSidebar[\s\S]*product="jira"[\s\S]*asChromeSlot[\s\S]*topOffset/u,
	);
	assert.match(
		SOURCE,
		/<JiraForYouWorkspace chrome="plain" className="h-full min-h-0 flex-1" \/>/u,
	);
	assert.doesNotMatch(SOURCE, /usePathname|startsWith\("\/preview\/"\)/u);
});
