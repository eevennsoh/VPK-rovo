const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

function readProjectFile(relativePath) {
	return readFileSync(join(process.cwd(), relativePath), "utf8");
}

const AGENT_2_SOURCE = readProjectFile("components/blocks/agent-2/components/agent-2.tsx");
const COMPACT_NAV_SOURCE = readProjectFile("components/blocks/agent-2/components/agent-compact-nav-menu.tsx");
const CONFIG_MODEL_SOURCE = readProjectFile("components/blocks/agent-2/lib/agent-config-model.ts");
const REFERENCE_MAPPING_SOURCE = readProjectFile("components/blocks/agent-2/lib/agent-reference-mapping.ts");

test("Agent 2 delegates compact nav menu focus and keep-open behavior", () => {
	assert.match(AGENT_2_SOURCE, /from "@\/components\/blocks\/agent-2\/components\/agent-compact-nav-menu";/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function shouldClearCompactNavInitialHighlight/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function clearCompactNavInitialHighlight/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function useCompactNavMenuKeepOpen/u);
	assert.match(COMPACT_NAV_SOURCE, /export function shouldClearCompactNavInitialHighlight/u);
	assert.match(COMPACT_NAV_SOURCE, /eventDetails\.reason === "trigger-hover"/u);
	assert.match(COMPACT_NAV_SOURCE, /event instanceof PointerEvent/u);
	assert.match(COMPACT_NAV_SOURCE, /export function clearCompactNavInitialHighlight/u);
	assert.match(COMPACT_NAV_SOURCE, /querySelectorAll<HTMLElement>\("\[data-highlighted\]"\)/u);
	assert.match(COMPACT_NAV_SOURCE, /contentElement\.focus\(\{ preventScroll: true \}\)/u);
	assert.match(COMPACT_NAV_SOURCE, /"\[data-slot='menubar-content'\], \[data-slot='dropdown-menu-content'\]"/u);
	assert.match(COMPACT_NAV_SOURCE, /contentElement\.addEventListener\("focusin", redirectInitialAutoFocus\)/u);
	assert.match(COMPACT_NAV_SOURCE, /queueMicrotask/u);
	assert.match(COMPACT_NAV_SOURCE, /requestAnimationFrame\(clear\)/u);
	assert.match(COMPACT_NAV_SOURCE, /window\.setTimeout\(clear, 120\)/u);
	assert.match(COMPACT_NAV_SOURCE, /export function useCompactNavMenuKeepOpen/u);
	assert.match(COMPACT_NAV_SOURCE, /keepOpenRef\.current = true/u);
	assert.match(COMPACT_NAV_SOURCE, /window\.setTimeout\(\(\) => \{[\s\S]*keepOpenRef\.current = false;[\s\S]*\}, 150\)/u);
});

test("Agent 2 consumes config model helpers from a local lib owner", () => {
	assert.match(AGENT_2_SOURCE, /from "@\/components\/blocks\/agent-2\/lib\/agent-config-model";/u);
	assert.match(AGENT_2_SOURCE, /export \{ toggleAgentConfigDisabledItem \} from "@\/components\/blocks\/agent-2\/lib\/agent-config-model";/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /export function toggleAgentConfigDisabledItem/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function isAgentListItemDisabled/u);
	assert.match(CONFIG_MODEL_SOURCE, /export interface AgentConfigFormValue/u);
	assert.match(CONFIG_MODEL_SOURCE, /automationRules\?: readonly AgentAutomationRule\[\];/u);
	assert.match(CONFIG_MODEL_SOURCE, /export function getSkillConfigLabel\(value: string\): string/u);
	assert.match(CONFIG_MODEL_SOURCE, /return slugifySkillName\(value\);/u);
	assert.match(CONFIG_MODEL_SOURCE, /export function getSkillConfigItems\(items: readonly string\[\] \| undefined\): readonly string\[\]/u);
	assert.match(CONFIG_MODEL_SOURCE, /\.map\(getSkillConfigLabel\)/u);
	assert.match(CONFIG_MODEL_SOURCE, /export function toggleAgentConfigDisabledItem/u);
	assert.match(CONFIG_MODEL_SOURCE, /const nextDisabledItems: Partial<Record<AgentConfigListFieldName, readonly string\[\]>>/u);
});

test("Agent 2 consumes reference mention mapping from a local lib owner", () => {
	assert.match(AGENT_2_SOURCE, /from "@\/components\/blocks\/agent-2\/lib\/agent-reference-mapping";/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function mapConfigValuesToMentionItems/u);
	assert.doesNotMatch(AGENT_2_SOURCE, /function mergeMentionItems/u);
	assert.match(REFERENCE_MAPPING_SOURCE, /export const AGENT_CONFIG_FIELD_BY_REFERENCE_CATEGORY/u);
	assert.match(REFERENCE_MAPPING_SOURCE, /export const AGENT_REFERENCE_CATEGORY_BY_CONFIG_FIELD/u);
	assert.match(REFERENCE_MAPPING_SOURCE, /export function mapConfigValuesToMentionItems/u);
	assert.match(REFERENCE_MAPPING_SOURCE, /getDirectoryMentionItemOrFallback\(category, value\)/u);
	assert.match(REFERENCE_MAPPING_SOURCE, /export function mapSubagentConfigValuesToMentionItems/u);
	assert.match(REFERENCE_MAPPING_SOURCE, /export function mapMemoryToKnowledgeItems/u);
	assert.match(REFERENCE_MAPPING_SOURCE, /export function mergeMentionItems/u);
	assert.match(REFERENCE_MAPPING_SOURCE, /const key = `\$\{item\.category\}:\$\{item\.id\}:\$\{getNormalizedAgentReferenceValue\(item\.label\)\}`;/u);
});
