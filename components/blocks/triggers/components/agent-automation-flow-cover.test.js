const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const COMPONENT_SOURCE = fs.readFileSync(
	path.join(__dirname, "agent-automation-flow-cover.tsx"),
	"utf8",
);

const TEST_PANEL_SOURCE = fs.readFileSync(
	path.join(__dirname, "../../../projects/studio/components/rovo-app-agent-test-panel.tsx"),
	"utf8",
);

const TRIGGER_CONFIG_SOURCE = fs.readFileSync(
	path.join(__dirname, "../../trigger-config/components/trigger-config.tsx"),
	"utf8",
);
const AGENT_PROFILE_COVER_SOURCE = TRIGGER_CONFIG_SOURCE.match(/function AgentProfileCover[\s\S]*?\n\}/u)?.[0] ?? "";

test("AgentAutomationFlowCover owns the automation-to-agent visual treatment", () => {
	assert.match(COMPONENT_SOURCE, /export function AgentAutomationFlowCover\(/u);
	assert.match(COMPONENT_SOURCE, /visibleTriggers = triggers\.slice\(0, 5\)/u);
	assert.match(COMPONENT_SOURCE, /className="rich-text-command-menu-avatar inline-flex size-8 shrink-0 items-center justify-center"/u);
	assert.match(COMPONENT_SOURCE, /renderAgentTriggerProviderTileIcon\(trigger\) \?\? <AutomationIcon label="" size="small" \/>/u);
	assert.match(COMPONENT_SOURCE, /className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-border bg-bg-input px-1\.5 text-xs font-medium leading-4 text-text-subtle"/u);
	assert.match(COMPONENT_SOURCE, /className="h-px w-6 shrink-0 bg-border"/u);
	assert.match(COMPONENT_SOURCE, /icon=\{<GenerativeIndicatorIcon label="" size="small" \/>\}[\s\S]*size="small"[\s\S]*variant="gray"/u);
});

test("AgentProfileCover and AgentTestAutomationFlow use the same shared cover", () => {
	assert.match(TRIGGER_CONFIG_SOURCE, /import \{ AgentAutomationFlowCover \} from "@\/components\/blocks\/triggers\/components\/agent-automation-flow-cover";/u);
	assert.match(TRIGGER_CONFIG_SOURCE, /function AgentProfileCover\([\s\S]*return <AgentAutomationFlowCover triggers=\{primaryRule\?\.triggers \?\? \[\]\} \/>;/u);
	assert.doesNotMatch(AGENT_PROFILE_COVER_SOURCE, /GenerativeIndicatorIcon/u);
	assert.doesNotMatch(AGENT_PROFILE_COVER_SOURCE, /visibleTriggers = triggers\.slice/u);

	assert.match(TEST_PANEL_SOURCE, /import \{ AgentAutomationFlowCover \} from "@\/components\/blocks\/triggers\/components\/agent-automation-flow-cover";/u);
	assert.match(TEST_PANEL_SOURCE, /function AgentTestAutomationFlow[\s\S]*<AgentAutomationFlowCover[\s\S]*rootElement="span"[\s\S]*triggers=\{rule\.triggers\}/u);
	assert.doesNotMatch(TEST_PANEL_SOURCE, /function AgentTestAutomationFlow[\s\S]*AiSparkleIcon/u);
	assert.doesNotMatch(TEST_PANEL_SOURCE, /function AgentTestAutomationFlow[\s\S]*rule\.triggers\.slice\(0, 2\)/u);
});

test("TriggerConfig instructions can run with or without a custom prompt", () => {
	assert.match(TRIGGER_CONFIG_SOURCE, /type AgentRunPromptMode = "run-agent" \| "custom-prompt";/u);
	assert.match(TRIGGER_CONFIG_SOURCE, /const \[runPromptMode, setRunPromptMode\] = useState<AgentRunPromptMode>/u);
	assert.match(TRIGGER_CONFIG_SOURCE, /if \(value === "run-agent"\) \{[\s\S]*handleMentionInventoryChange\(\[\]\);[\s\S]*onInstructionsChange\?\.\(""\);[\s\S]*\}/u);
	assert.match(TRIGGER_CONFIG_SOURCE, /\}, \[handleMentionInventoryChange, onInstructionsChange\]\);/u);
	assert.match(TRIGGER_CONFIG_SOURCE, /aria-label="Agent run prompt mode"/u);
	assert.match(TRIGGER_CONFIG_SOURCE, /role="radiogroup"/u);
	assert.match(TRIGGER_CONFIG_SOURCE, /role="radio"/u);
	assert.match(TRIGGER_CONFIG_SOURCE, /aria-checked=\{runPromptMode === "run-agent"\}/u);
	assert.match(TRIGGER_CONFIG_SOURCE, /aria-checked=\{runPromptMode === "custom-prompt"\}/u);
	assert.match(TRIGGER_CONFIG_SOURCE, /onClick=\{\(\) => handleRunPromptModeChange\("run-agent"\)\}[\s\S]*<GenerativeIndicatorIcon label="" size="small" \/>[\s\S]*Run agent/u);
	assert.match(TRIGGER_CONFIG_SOURCE, /onClick=\{\(\) => handleRunPromptModeChange\("custom-prompt"\)\}[\s\S]*Pass a custom prompt/u);
	assert.match(TRIGGER_CONFIG_SOURCE, /\{showCustomPromptEditor \? \([\s\S]*<RichTextEditor[\s\S]*aria-label="Agent instructions"[\s\S]*onMarkdownChange=\{onInstructionsChange\}/u);
});
