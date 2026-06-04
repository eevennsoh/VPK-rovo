const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const SUBAGENTS_PAGE_SOURCE = readFileSync(join(__dirname, "page.tsx"), "utf8");
const SUBAGENTS_NAVIGATOR_SOURCE = readFileSync(join(__dirname, "subagents-navigator.tsx"), "utf8");
const SUBAGENTS_INDEX_SOURCE = readFileSync(join(__dirname, "index.ts"), "utf8");
const SUBAGENTS_DATA_SOURCE = readFileSync(join(__dirname, "data", "demo-agents.ts"), "utf8");
const SUBAGENTS_PROMPT_FIELDS_SOURCE = readFileSync(
	join(__dirname, "components", "subagent-prompt-fields.tsx"),
	"utf8",
);
const SUBAGENTS_PROMPTS_LIB_SOURCE = readFileSync(
	join(__dirname, "lib", "subagent-prompts.ts"),
	"utf8",
);
const AGENT_SOURCE = readFileSync(join(__dirname, "..", "..", "ui-custom", "agent.tsx"), "utf8");
const SUBAGENTS_DEMO_SOURCE = readFileSync(
	join(__dirname, "..", "..", "website", "demos", "blocks", "subagents-demo.tsx"),
	"utf8",
);
const WEBSITE_REGISTRY_SOURCE = readFileSync(join(__dirname, "..", "..", "website", "registry.ts"), "utf8");
const BLOCK_DETAILS_SOURCE = readFileSync(
	join(__dirname, "..", "..", "..", "app", "data", "details", "blocks.ts"),
	"utf8",
);

test("Subagents models one base agent with conditional prompt copies", () => {
	assert.match(SUBAGENTS_PAGE_SOURCE, /initialBaseAgent\?: SubagentsBaseAgent/u);
	assert.match(SUBAGENTS_PAGE_SOURCE, /initialSubagents\?: ReadonlyArray<SubagentPrompt>/u);
	assert.match(SUBAGENTS_PAGE_SOURCE, /initialActiveSubagentId\?: string/u);
	assert.match(SUBAGENTS_PAGE_SOURCE, /getBaseConfigWithSubagents/u);
	assert.match(SUBAGENTS_PAGE_SOURCE, /profileConfig=\{baseConfig\}/u);
	assert.match(SUBAGENTS_PAGE_SOURCE, /onProfileTextChange=\{handleBaseTextChange\}/u);
	assert.doesNotMatch(SUBAGENTS_PAGE_SOURCE, /SubagentsActiveAgentField/u);
	assert.doesNotMatch(SUBAGENTS_PAGE_SOURCE, /SubagentsAgentAvatar/u);
	assert.doesNotMatch(SUBAGENTS_PAGE_SOURCE, /SubagentsAgent/u);
	assert.doesNotMatch(SUBAGENTS_INDEX_SOURCE, /SubagentsAgent/u);
});

test("Subagent prompt data has trigger metadata and no separate agent identity", () => {
	const promptInterfaceStart = SUBAGENTS_DATA_SOURCE.indexOf("export interface SubagentPrompt");
	const baseFixtureStart = SUBAGENTS_DATA_SOURCE.indexOf("export const DEFAULT_SUBAGENTS_BASE_AGENT", promptInterfaceStart);
	const promptInterface = SUBAGENTS_DATA_SOURCE.slice(promptInterfaceStart, baseFixtureStart);
	const promptFixturesStart = SUBAGENTS_DATA_SOURCE.indexOf("export const SUBAGENTS_DEMO_PROMPTS");
	const promptFixtures = SUBAGENTS_DATA_SOURCE.slice(promptFixturesStart);

	assert.match(SUBAGENTS_DATA_SOURCE, /export interface SubagentsBaseAgent/u);
	assert.match(promptInterface, /export interface SubagentPrompt/u);
	assert.match(promptInterface, /triggerName: string/u);
	assert.match(promptInterface, /condition: string/u);
	assert.match(SUBAGENTS_DATA_SOURCE, /subagents: \[\]/u);
	assert.doesNotMatch(SUBAGENTS_DATA_SOURCE, /SubagentsAgentKind|kind: "master"|kind: "subagent"/u);
	assert.doesNotMatch(promptInterface, /avatarSrc|name\?|agentId/u);
	assert.doesNotMatch(promptFixtures, /avatarSrc|agentId: "policy-source-needed"|agentId: "benefits-question"/u);
});

test("Subagent prompt views expose dedicated trigger and condition fields", () => {
	assert.match(SUBAGENTS_PROMPT_FIELDS_SOURCE, /function SubagentPromptFields/u);
	assert.match(SUBAGENTS_PROMPT_FIELDS_SOURCE, />\s*Trigger\s*</u);
	assert.match(SUBAGENTS_PROMPT_FIELDS_SOURCE, />\s*Condition\s*</u);
	assert.match(SUBAGENTS_PROMPT_FIELDS_SOURCE, /placeholder="Placeholder"/u);
	assert.match(SUBAGENTS_PROMPT_FIELDS_SOURCE, /Describe the situation that should trigger this subagent\./u);
	assert.match(SUBAGENTS_PAGE_SOURCE, /compactFooterBefore=\{activePrompt/u);
	assert.match(SUBAGENTS_PAGE_SOURCE, /handleTriggerNameChange/u);
	assert.match(SUBAGENTS_PAGE_SOURCE, /handleConditionChange/u);
});

test("Subagents switcher uses base agent header and trigger-name prompt rows", () => {
	assert.match(SUBAGENTS_NAVIGATOR_SOURCE, /baseAgent: SubagentsBaseAgent/u);
	assert.match(SUBAGENTS_NAVIGATOR_SOURCE, /subagents: ReadonlyArray<SubagentPrompt>/u);
	assert.match(SUBAGENTS_NAVIGATOR_SOURCE, /getSubagentDisplayName\(prompt/u);
	assert.match(SUBAGENTS_NAVIGATOR_SOURCE, /prompt\.triggerName\.trim\(\) \|\| "Untitled trigger"/u);
	assert.match(SUBAGENTS_NAVIGATOR_SOURCE, /MINIMAP_BASE_BAR_WIDTH_PX = 26/u);
	assert.match(SUBAGENTS_NAVIGATOR_SOURCE, /MINIMAP_PROMPT_BAR_WIDTH_PX = 16/u);
	assert.doesNotMatch(SUBAGENTS_NAVIGATOR_SOURCE, /getAgentDescription|toSnippet|config\.name\?\.trim\(\) \|\| \(agent\.kind/u);
	assert.doesNotMatch(SUBAGENTS_NAVIGATOR_SOURCE, /variant ===|rounded-b-lg|rounded-t"/u);
	assert.doesNotMatch(SUBAGENTS_NAVIGATOR_SOURCE, /SWITCHER_OPEN_MAX_HEIGHT_PX|Math\.min\(|overflow-y-auto/u);
	assert.match(SUBAGENTS_NAVIGATOR_SOURCE, /sticky top-0[\s\S]*shrink-0 py-2[\s\S]*sticky bottom-0/u);
	assert.match(SUBAGENTS_NAVIGATOR_SOURCE, /gap-2 rounded-lg px-2 py-2 text-left text-sm text-text-subtle/u);
});

test("Create subagent adds and selects an empty prompt copy", () => {
	assert.match(SUBAGENTS_PROMPTS_LIB_SOURCE, /function createDraftSubagentPrompt/u);
	assert.match(SUBAGENTS_PROMPTS_LIB_SOURCE, /triggerName: ""/u);
	assert.match(SUBAGENTS_PROMPTS_LIB_SOURCE, /condition: ""/u);
	assert.match(SUBAGENTS_PAGE_SOURCE, /setSubagentPrompts\(\(currentPrompts\) => \[\.\.\.currentPrompts, prompt\]\)/u);
	assert.match(SUBAGENTS_PAGE_SOURCE, /setActiveSubagentId\(prompt\.id\)/u);
});

test("Subagents creation is routed through the compact control panel", () => {
	assert.match(SUBAGENTS_NAVIGATOR_SOURCE, /if \(subagents\.length === 0\) \{\s*return null;\s*\}/u);
	assert.doesNotMatch(SUBAGENTS_NAVIGATOR_SOURCE, /h-7 rounded-full px-3|variant="outline"/u);
	assert.match(AGENT_SOURCE, /function AgentCompactSubagentsNavButton/u);
	assert.match(AGENT_SOURCE, /Manage subagents/u);
	assert.match(AGENT_SOURCE, /if \(item\.count === 0\)[\s\S]*onCreateSubagent/u);
	assert.match(AGENT_SOURCE, /onSelectListItem\?\.\("subagents", index\)/u);
	assert.match(SUBAGENTS_PAGE_SOURCE, /function handleSelectConfigListItem/u);
	assert.match(SUBAGENTS_PAGE_SOURCE, /onManageSubagents=\{handleCreateSubagent\}/u);
	assert.match(SUBAGENTS_PAGE_SOURCE, /onSelectListItem=\{handleSelectConfigListItem\}/u);
});

test("Subagents docs describe prompt copies instead of agent-directory links", () => {
	const subagentsDetailsStart = BLOCK_DETAILS_SOURCE.indexOf("subagents: {");
	const terminalSwitchStart = BLOCK_DETAILS_SOURCE.indexOf('"terminal-switch"', subagentsDetailsStart);
	const subagentsDetails = BLOCK_DETAILS_SOURCE.slice(subagentsDetailsStart, terminalSwitchStart);

	assert.match(subagentsDetails, /SubagentsBaseAgent/u);
	assert.match(subagentsDetails, /SubagentPrompt/u);
	assert.match(subagentsDetails, /triggerName/u);
	assert.match(subagentsDetails, /initialBaseAgent/u);
	assert.match(subagentsDetails, /initialSubagents/u);
	assert.match(subagentsDetails, /No subagents/u);
	assert.match(subagentsDetails, /subagents-demo-empty/u);
	assert.doesNotMatch(subagentsDetails, /SubagentsAgent|initialAgents|master orchestrator|agent directory|Chat transcript/u);
});

test("Subagents exposes a no-subagents demo variant with an empty prompt list", () => {
	assert.match(SUBAGENTS_DEMO_SOURCE, /SubagentsDemoEmpty/u);
	assert.match(SUBAGENTS_DEMO_SOURCE, /initialSubagents=\{\[\]\}/u);
	assert.match(WEBSITE_REGISTRY_SOURCE, /"subagents-demo-empty"/u);
	assert.match(WEBSITE_REGISTRY_SOURCE, /SubagentsDemoEmpty/u);
});
