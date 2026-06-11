const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const DIR = __dirname;

function readProjectFile(relativePath) {
	return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const COMPONENT_SOURCE = fs.readFileSync(path.join(DIR, "components", "twg-agent-card.tsx"), "utf8");
const DATA_SOURCE = fs.readFileSync(path.join(DIR, "data", "demo.ts"), "utf8");
const PAGE_SOURCE = fs.readFileSync(path.join(DIR, "page.tsx"), "utf8");
const INDEX_SOURCE = fs.readFileSync(path.join(DIR, "index.ts"), "utf8");
const KNOWLEDGE_SOURCE = readProjectFile("components/ui-custom/knowledge.tsx");
const AGENT_CARD_INDEX_SOURCE = readProjectFile("components/blocks/agent-card/index.ts");
const COMPONENTS_SOURCE = readProjectFile("app/data/components.ts");
const COMPONENT_MANIFEST_SOURCE = readProjectFile("app/data/component-manifest.ts");
const BLOCK_DETAILS_SOURCE = readProjectFile("app/data/details/blocks.ts");
const REGISTRY_SOURCE = readProjectFile("components/website/registry.ts");
const DEMO_SOURCE = readProjectFile("components/website/demos/blocks/twg-agent-card-demo.tsx");
const PREVIEW_SOURCE = readProjectFile("app/preview/blocks/twg-agent-card/page.tsx");

test("TWG Agent Card exposes the public component and type API", () => {
	assert.match(INDEX_SOURCE, /export \{ TWGAgentCard \} from "\.\/components\/twg-agent-card";/u);
	assert.match(INDEX_SOURCE, /TWGAgentCardProps/u);
	assert.match(INDEX_SOURCE, /TWGAgentSuggestion/u);
	assert.match(COMPONENT_SOURCE, /export interface TWGAgentCardProps/u);
	assert.match(COMPONENT_SOURCE, /export interface TWGAgentSuggestion/u);
});

test("TWG Agent Card reuses shared VPK and TWG primitives", () => {
	assert.match(COMPONENT_SOURCE, /import \{ AgentCardShell \} from "@\/components\/blocks\/agent-card";/u);
	assert.match(COMPONENT_SOURCE, /import \{ Avatar, AvatarFallback, AvatarImage \} from "@\/components\/ui\/avatar";/u);
	assert.match(COMPONENT_SOURCE, /import \{ TeamworkGraphMark \} from "@\/components\/ui-custom\/teamwork-graph-mark";/u);
	assert.match(COMPONENT_SOURCE, /import \{ TWGAppstack, type TwgToolSource \} from "@\/components\/ui-custom\/twg-appstack";/u);
	assert.match(COMPONENT_SOURCE, /import \{ TwgToolBannerBackground \} from "@\/components\/ui-custom\/twg-tool";/u);
	assert.match(COMPONENT_SOURCE, /import \{ ROVO_COLOR_SWATCHES \} from "@\/lib\/rovo-colors";/u);
	assert.match(AGENT_CARD_INDEX_SOURCE, /export \{ AgentCardShell \} from "\.\/components\/agent-card-parts";/u);
	assert.match(AGENT_CARD_INDEX_SOURCE, /AgentCardShellProps/u);
});

test("TWG Agent Card uses VPK primitive sizing instead of custom primitive overrides", () => {
	assert.doesNotMatch(COMPONENT_SOURCE, /from "next\/image"/u);
	assert.match(COMPONENT_SOURCE, /<Avatar aria-hidden>/u);
	assert.match(COMPONENT_SOURCE, /<AvatarImage alt="" src=\{userAvatarSrc\} \/>/u);
	assert.doesNotMatch(COMPONENT_SOURCE, /size-7|height=\{28\}|width=\{28\}/u);
	assert.doesNotMatch(COMPONENT_SOURCE, /className="size-14 rounded-\[16px\]/u);
	assert.match(COMPONENT_SOURCE, /<TeamworkGraphMark \/>/u);
	assert.doesNotMatch(COMPONENT_SOURCE, /<TeamworkGraphMark className=/u);
});

test("Teamwork Graph mark is shared with Knowledge", () => {
	const markSource = readProjectFile("components/ui-custom/teamwork-graph-mark.tsx");

	assert.match(markSource, /export function TeamworkGraphMark/u);
	assert.match(markSource, /ROVO_COLOR_SWATCHES/u);
	assert.match(KNOWLEDGE_SOURCE, /import \{ TeamworkGraphMark \} from "@\/components\/ui-custom\/teamwork-graph-mark";/u);
	assert.match(KNOWLEDGE_SOURCE, /<TeamworkGraphMark \/>/u);
	assert.doesNotMatch(KNOWLEDGE_SOURCE, /function TeamworkGraphIcon/u);
});

test("TWG Agent Card keeps the experimental Agent Card footprint and decoration contract", () => {
	assert.match(COMPONENT_SOURCE, /h-\[423px\] w-full max-w-\[376px\]/u);
	assert.match(COMPONENT_SOURCE, /rounded-\[16px\]/u);
	assert.match(COMPONENT_SOURCE, /\/gestural-line\/eyelash-3\.svg/u);
	assert.match(COMPONENT_SOURCE, /bg-orange-300/u);
	assert.match(COMPONENT_SOURCE, /suggestedAgents\.length/u);
	assert.match(COMPONENT_SOURCE, /visibleSuggestions = suggestedAgents\.slice\(0, 3\)/u);
});

test("TWG Agent Card default data includes Teamwork Graph sources and three suggestions", () => {
	assert.match(DATA_SOURCE, /DEFAULT_TWG_AGENT_CARD_SOURCES/u);
	assert.match(DATA_SOURCE, /id: "twg", label: "Teamwork Graph", provider: "twg"/u);
	assert.match(DATA_SOURCE, /id: "jira", label: "Jira", provider: "jira"/u);
	assert.match(DATA_SOURCE, /id: "google-drive", label: "Google Drive", provider: "google-drive"/u);
	assert.match(DATA_SOURCE, /DEFAULT_TWG_AGENT_CARD_SUGGESTIONS/u);
	assert.equal((DATA_SOURCE.match(/name: "/gu) ?? []).length, 3);
});

test("TWG Agent Card catalog wiring is present", () => {
	assert.match(COMPONENTS_SOURCE, /blockComponent\("twg-agent-card", "TWG Agent Card"\)/u);
	assert.match(COMPONENT_MANIFEST_SOURCE, /blockComponent\("twg-agent-card", "TWG Agent Card"\)/u);
	assert.match(BLOCK_DETAILS_SOURCE, /"twg-agent-card": \{/u);
	assert.match(BLOCK_DETAILS_SOURCE, /import \{ TWGAgentCard \} from "@\/components\/blocks\/twg-agent-card";/u);
	assert.match(BLOCK_DETAILS_SOURCE, /"twg-agent-card": \{[\s\S]*demoLayout: \{ previewHeight: "default" \}/u);
	assert.match(REGISTRY_SOURCE, /"twg-agent-card": dynamic\(\(\) => import\("\.\/demos\/blocks\/twg-agent-card-demo"\)/u);
	assert.match(DEMO_SOURCE, /import \{ TWGAgentCard \} from "@\/components\/blocks\/twg-agent-card";/u);
	assert.match(DEMO_SOURCE, /className="flex w-full justify-center p-6"/u);
	assert.match(PREVIEW_SOURCE, /import TWGAgentCardPage from "@\/components\/blocks\/twg-agent-card\/page";/u);
	assert.match(PREVIEW_SOURCE, /title: getPreviewPageTitle\("twg-agent-card", "blocks"\),/u);
	assert.match(PAGE_SOURCE, /<TWGAgentCard onSelect=\{\(\) => \{\}\} \/>/u);
});

test("TWG Agent Card avoids raw ADS CSS variable utilities", () => {
	for (const source of [COMPONENT_SOURCE, PAGE_SOURCE]) {
		assert.doesNotMatch(source, /(?:bg|text)-\[var\(--ds-/u);
	}
});
