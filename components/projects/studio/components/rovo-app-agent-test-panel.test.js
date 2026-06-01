const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const AGENT_TEST_PANEL_SOURCE = fs.readFileSync(
	path.join(__dirname, "rovo-app-agent-test-panel.tsx"),
	"utf8",
);

test("AgentTestPanel isolates the publish-ready agent in a nested chat provider", () => {
	assert.match(AGENT_TEST_PANEL_SOURCE, /export interface AgentTestPanelProps \{[\s\S]*entry: StudioSessionAgentEntry;[\s\S]*className\?: string;[\s\S]*\}/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /aria-label="Agent test"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /data-testid="agent-test-panel"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /const id = `agent-test-\$\{entry\.profile\.id\}`;/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /function buildAgentTestProfile\(entry: StudioSessionAgentEntry\): RovoAgentProfile/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /const publishReadySnapshotKey = JSON\.stringify\(entry\.publishReadyResult\);/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /const snapshotKey = `\$\{entry\.profile\.id\}:\$\{publishReadySnapshotKey\}`;/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /<RovoChatProvider[\s\S]*key=\{snapshotKey\}[\s\S]*agentProfiles=\{\[testAgentProfile\]\}[\s\S]*autoSelectAgentId=\{testAgentProfile\.id\}/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /const \{ selectedAgentId, selectAgent \} = useRovoChat\(\);/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /selectAgent\(testAgentProfile\.id, \{ preserveCurrentThread: true \}\);/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /<ChatPanel[\s\S]*abortOnUnmount=\{false\}[\s\S]*customAgentTabs=\{\{[\s\S]*trigger: <AgentTestTriggerView entry=\{entry\} \/>[\s\S]*activity: <AgentTestActivityView entry=\{entry\} \/>[\s\S]*\}\}[\s\S]*hideHeader/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /greeting=\{\{[\s\S]*heading: testAgentProfile\.name,[\s\S]*suggestions: testAgentProfile\.starters,[\s\S]*\}\}/u);
});

test("AgentTestPanel builds test profile data from the publish-ready snapshot", () => {
	assert.match(AGENT_TEST_PANEL_SOURCE, /const payload = entry\.publishReadyResult as AgentResultPayload;/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /getPayloadString\(payload, \["name", "agentName", "title"\]\) \?\? entry\.profile\.name \?\? "Agent test"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /getPayloadString\(payload, \["byline", "sourceLabel", "generatedBy", "source"\]\) \?\? "Custom agent test"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /getPayloadString\(payload, \["avatarSrc", "avatarUrl", "iconSrc"\]\) \?\? entry\.profile\.avatarSrc/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /getPayloadString\(payload, \["description", "summary", "shortDescription"\]\)[\s\S]*entry\.profile\.description/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /getConversationStarterLabels\(payload\)\.map\(\(starter, index\) =>[\s\S]*createAgentTestStarter\(id, starter, index\)/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /contextDescription: createAgentTestContextDescription\(\{/u);
});
