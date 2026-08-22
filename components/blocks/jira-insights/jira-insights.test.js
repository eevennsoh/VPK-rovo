const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function readBlockFile(relativePath) {
	return fs.readFileSync(path.join(__dirname, relativePath), "utf8");
}

test("Jira Insights exposes a standalone block and split provider/content/scrubber API", () => {
	const indexSource = readBlockFile("index.tsx");

	assert.match(indexSource, /export function JiraInsights/u);
	assert.match(indexSource, /JiraInsightsProvider/u);
	assert.match(indexSource, /JiraInsightsContent/u);
	assert.match(indexSource, /JiraInsightsScrubber/u);
	assert.match(indexSource, /JiraInsightCheckpoint/u);
	assert.match(indexSource, /JiraInsightSource/u);
	assert.match(indexSource, /JiraInsightsSnapshot/u);
});

test("the decision timeline reuses Jira Activity and synchronizes visible checkpoints", () => {
	const contentSource = readBlockFile("components/jira-insights-content.tsx");

	assert.match(contentSource, /import \{ JiraActivity/u);
	assert.match(contentSource, /composer=\{null\}/u);
	assert.match(contentSource, /hideHeader/u);
	assert.match(contentSource, /sortOrder="descending"/u);
	assert.match(contentSource, /activeEntryId=\{activeCheckpointId/u);
	assert.match(contentSource, /renderEntry=\{/u);
	assert.match(contentSource, /new IntersectionObserver/u);
	assert.match(contentSource, /aria-labelledby=\{summaryHeadingId\}/u);
	assert.match(contentSource, /aria-labelledby=\{decisionsHeadingId\}/u);
});

test("the docked scrubber uses the shared Slider with discrete accessible values", () => {
	const scrubberSource = readBlockFile("components/jira-insights-scrubber.tsx");

	assert.match(scrubberSource, /import \{ Slider \} from "@\/components\/ui\/slider"/u);
	assert.match(scrubberSource, /data-jira-insights-scrubber/u);
	assert.match(scrubberSource, /aria-label="Decision timeline"/u);
	assert.match(scrubberSource, /aria-valuetext=\{activeValueText\}/u);
	assert.match(scrubberSource, /onValueChange=\{handleValueChange\}/u);
	assert.match(scrubberSource, /max=\{checkpoints\.length - 1\}/u);
	assert.match(scrubberSource, /step=\{1\}/u);
});

test("sources use VPK controls and semantic external links", () => {
	const sourcesSource = readBlockFile("components/jira-insights-sources.tsx");

	assert.match(sourcesSource, /import \{ Button \} from "@\/components\/ui\/button"/u);
	assert.match(sourcesSource, /source\.kind === "external-link"/u);
	assert.match(sourcesSource, /nativeButton=\{false\}/u);
	assert.match(sourcesSource, /target="_blank"/u);
	assert.match(sourcesSource, /onSourceSelect\?\.\(source\)/u);
});

test("Jira Insights is registered as a documented block demo", () => {
	const componentsSource = fs.readFileSync(path.join(__dirname, "../../../app/data/components.ts"), "utf8");
	const manifestSource = fs.readFileSync(path.join(__dirname, "../../../app/data/component-manifest.ts"), "utf8");
	const detailsSource = fs.readFileSync(path.join(__dirname, "../../../app/data/details/blocks.ts"), "utf8");
	const registrySource = fs.readFileSync(path.join(__dirname, "../../website/registry/blocks.ts"), "utf8");
	const demoSource = fs.readFileSync(path.join(__dirname, "../../website/demos/blocks/jira-insights-demo.tsx"), "utf8");

	assert.match(componentsSource, /blockComponent\("jira-insights", "Jira Insights"\)/u);
	assert.match(manifestSource, /blockComponent\("jira-insights", "Jira Insights"\)/u);
	assert.match(detailsSource, /JIRA_INSIGHTS_DETAIL/u);
	assert.match(detailsSource, /"jira-insights": JIRA_INSIGHTS_DETAIL/u);
	assert.match(registrySource, /"jira-insights": dynamic\([\s\S]*jira-insights-demo/u);
	assert.match(demoSource, /JiraInsightsPage/u);
});
