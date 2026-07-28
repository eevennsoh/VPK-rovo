const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function readProjectFile(relativePath) {
	return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("Jira Golden Journeys resolves one public slug across catalogs, detail metadata, and its demo route", () => {
	const components = readProjectFile("app/data/components.ts");
	const manifest = readProjectFile("app/data/component-manifest.ts");
	const details = readProjectFile("app/data/details/projects.ts");
	const route = readProjectFile("app/jira-golden-journeys/page.tsx");
	const demos = readProjectFile("components/website/registry/projects.ts");
	const demo = readProjectFile("components/website/demos/projects/jira-golden-journeys-demo.tsx");

	for (const source of [components, manifest]) {
		assert.match(
			source,
			/projectComponent\("jira-golden-journeys", "Jira Golden Journeys"\)/u,
		);
		assert.doesNotMatch(source, /projectComponent\("jira-golden-paths"/u);
	}

	assert.match(details, /"jira-golden-journeys": \{[\s\S]*import JgpPage from "@\/components\/projects\/jira-golden-journeys"/u);
	assert.match(route, /loadDemoComponent\("jira-golden-journeys", "projects"\)/u);
	assert.match(
		demos,
		/"jira-golden-journeys": dynamic\([\s\S]*jira-golden-journeys-demo/u,
	);
	assert.match(
		demo,
		/import JgpPage from "@\/components\/projects\/jira-golden-journeys\/page"/u,
	);
});
