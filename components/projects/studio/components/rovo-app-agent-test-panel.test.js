const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const AGENT_TEST_PANEL_SOURCE = fs.readFileSync(
	path.join(__dirname, "rovo-app-agent-test-panel.tsx"),
	"utf8",
);

test("AgentTestPanel isolates the live-draft agent in a nested chat provider", () => {
	assert.match(AGENT_TEST_PANEL_SOURCE, /export interface AgentTestPanelProps \{[\s\S]*entry: StudioSessionAgentEntry;[\s\S]*className\?: string;[\s\S]*\}/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /aria-label="Agent test"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /data-testid="agent-test-panel"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /className=\{cn\("h-full min-h-0 px-4", className\)\}/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /const id = `agent-test-\$\{entry\.profile\.id\}`;/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /function buildAgentTestProfile\([\s\S]*entry: StudioSessionAgentEntry,[\s\S]*result: RovoDataParts\["agent-result"\],[\s\S]*versionLabel: string,[\s\S]*\): RovoAgentProfile/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /const selectedResult = selectedOption\.result;/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /const snapshotKey = `\$\{entry\.profile\.id\}:\$\{selectedOption\.id\}:\$\{JSON\.stringify\(selectedResult\)\}`;/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /<RovoChatProvider[\s\S]*key=\{snapshotKey\}[\s\S]*agentProfiles=\{\[testAgentProfile\]\}[\s\S]*autoSelectAgentId=\{testAgentProfile\.id\}/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /const \{ selectedAgentId, selectAgent \} = useRovoChat\(\);/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /selectAgent\(testAgentProfile\.id, \{ preserveCurrentThread: true \}\);/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /<ChatPanel[\s\S]*abortOnUnmount=\{false\}[\s\S]*customAgentTabs=\{\{[\s\S]*trigger: <AgentTestTriggerView result=\{result\} \/>[\s\S]*activity: <AgentTestActivityView result=\{result\} \/>[\s\S]*\}\}[\s\S]*hideHeader/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /containerClassName="h-full min-h-0 w-full overflow-visible"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /composerContainerClassName="px-0"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /conversationContentClassName="px-0"/u);
	assert.doesNotMatch(AGENT_TEST_PANEL_SOURCE, /containerClassName="mx-auto h-full min-h-0 w-full max-w-\[800px\] overflow-visible"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /<ChatPanel[\s\S]*hideAiCursor[\s\S]*hideComposerSourceAndModelControls[\s\S]*hideHeader/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /greeting=\{\{[\s\S]*heading: testAgentProfile\.name,[\s\S]*suggestions: testAgentProfile\.starters,[\s\S]*\}\}/u);
});

test("AgentTestPanel builds test profile data from the live draft", () => {
	assert.match(AGENT_TEST_PANEL_SOURCE, /const payload = result as AgentResultPayload;/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /getPayloadString\(payload, \["name", "agentName", "title"\]\) \?\? entry\.profile\.name \?\? "Agent test"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /getPayloadString\(payload, \["byline", "sourceLabel", "generatedBy", "source"\]\) \?\? "Custom agent test"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /getPayloadString\(payload, \["avatarSrc", "avatarUrl", "iconSrc"\]\) \?\? entry\.profile\.avatarSrc/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /getPayloadString\(payload, \["description", "summary", "shortDescription"\]\)[\s\S]*entry\.profile\.description/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /getConversationStarterLabels\(payload\)\.map\(\(starter, index\) =>[\s\S]*createAgentTestStarter\(id, starter, index, \{/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /contextDescription: createAgentTestContextDescription\(\{[\s\S]*versionLabel,/u);
});

test("AgentTestPanel tests nested event triggers from automation cards", () => {
	assert.match(AGENT_TEST_PANEL_SOURCE, /type AgentAutomationRule/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /const automationRules = useMemo<readonly AgentAutomationRule\[\]>\([\s\S]*\(\) => result\.automationRules \?\? \[\]/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /useEffect\(\(\) => \{[\s\S]*setTestResult\(null\);[\s\S]*\}, \[automationRules\]\);/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /automationRules\.map\(\(rule, ruleIndex\) => \([\s\S]*<AutomationTestCard/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /rule\.triggers\.map\(\(trigger\) => \([\s\S]*<AutomationTestEventRow/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /<Button onClick=\{onTest\} size="compact" type="button" variant="outline">[\s\S]*Test/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /function createAutomationTestResult\([\s\S]*automationName = getAgentAutomationRuleLabel\(rule, ruleIndex\)[\s\S]*automationId: rule\.id[\s\S]*eventTriggerId: trigger\.id[\s\S]*getProviderSampleData\(trigger\)/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /Callback result/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /Sample event payload/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /case "jira":[\s\S]*issueKey: "PROJ-248"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /case "confluence":[\s\S]*pageId: "983421"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /No automations configured\./u);
});
