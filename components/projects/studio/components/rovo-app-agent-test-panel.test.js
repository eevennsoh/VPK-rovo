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
	assert.match(AGENT_TEST_PANEL_SOURCE, /type AgentTestSurface =[\s\S]*\| \{ kind: "start" \}[\s\S]*\| \{ kind: "chat" \}[\s\S]*\| \{ kind: "automation"; ruleId: string \};/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /const \[selectedSurface, setSelectedSurface\] = useState<AgentTestSurface>\(\{ kind: "start" \}\);/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /const id = `agent-test-\$\{entry\.profile\.id\}`;/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /function buildAgentTestProfile\([\s\S]*entry: StudioSessionAgentEntry,[\s\S]*result: RovoDataParts\["agent-result"\],[\s\S]*versionLabel: string,[\s\S]*\): RovoAgentProfile/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /const selectedResult = selectedOption\.result;/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /const snapshotKey = `\$\{entry\.profile\.id\}:\$\{selectedOption\.id\}:\$\{JSON\.stringify\(selectedResult\)\}`;/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /<RovoChatProvider[\s\S]*key=\{`\$\{snapshotKey\}:\$\{resetKey\}`\}[\s\S]*agentProfiles=\{\[testAgentProfile\]\}[\s\S]*autoSelectAgentId=\{testAgentProfile\.id\}/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /const \{ selectedAgentId, selectAgent \} = useRovoChat\(\);/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /selectAgent\(testAgentProfile\.id, \{ preserveCurrentThread: true \}\);/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /import RefreshIcon from "@atlaskit\/icon\/core\/refresh";/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /className="flex shrink-0 items-center justify-between gap-3 py-3"/u);
	assert.doesNotMatch(AGENT_TEST_PANEL_SOURCE, /className="flex shrink-0 items-center justify-between gap-3 border-b border-border py-3"/u);
	assert.doesNotMatch(AGENT_TEST_PANEL_SOURCE, /className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-1 py-3"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /className="shrink-0 gap-1\.5"[\s\S]*onClick=\{onBack\}[\s\S]*Back to testing options/u);
	assert.doesNotMatch(AGENT_TEST_PANEL_SOURCE, /className="shrink-0 gap-1\.5 px-2"[\s\S]*Back to testing options/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /<div className="hidden h-4 w-px shrink-0 bg-border md:block" \/>[\s\S]*<AgentTestVersionSelect[\s\S]*<div className="hidden min-w-0 md:block">[\s\S]*<h2 className="truncate text-sm font-semibold leading-5 text-text">/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /<div className="hidden min-w-0 md:block">[\s\S]*<h2 className="truncate text-sm font-semibold leading-5 text-text">[\s\S]*\{title\}/u);
	assert.doesNotMatch(AGENT_TEST_PANEL_SOURCE, /<div className="hidden min-w-0 px-3 md:block">/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /onClick=\{onReset\}[\s\S]*<RefreshIcon label="" size="small" spacing="none" \/>[\s\S]*Reset/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /const \[resetKey, setResetKey\] = useState\(0\);/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /onReset=\{\(\) => setResetKey\(\(currentKey\) => currentKey \+ 1\)\}/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /<ChatPanel[\s\S]*abortOnUnmount=\{false\}[\s\S]*showAgentTestControls[\s\S]*suppressCustomAgentTabs[\s\S]*hideHeader/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /containerClassName="h-full min-h-0 w-full overflow-visible"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /composerContainerClassName="px-0"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /conversationContentClassName="px-0"/u);
	assert.doesNotMatch(AGENT_TEST_PANEL_SOURCE, /containerClassName="mx-auto h-full min-h-0 w-full max-w-\[800px\] overflow-visible"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /<ChatPanel[\s\S]*hideAiCursor[\s\S]*hideComposerSourceAndModelControls[\s\S]*hideHeader/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /greeting=\{\{[\s\S]*heading: testAgentProfile\.name,[\s\S]*suggestions: testAgentProfile\.starters,[\s\S]*\}\}/u);
	assert.doesNotMatch(AGENT_TEST_PANEL_SOURCE, /customAgentTabs=\{\{/u);
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

test("AgentTestPanel starts with chat and per-automation chooser rows", () => {
	assert.match(AGENT_TEST_PANEL_SOURCE, /function AgentTestStartView\(/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /data-testid="agent-test-start"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /max-w-xl[\s\S]*rounded-3xl[\s\S]*border border-border[\s\S]*bg-surface/u);
	assert.doesNotMatch(AGENT_TEST_PANEL_SOURCE, /max-w-xl[^"]*shadow-/u);
	assert.doesNotMatch(AGENT_TEST_PANEL_SOURCE, /max-w-\[600px\]|rounded-\[32px\]|w-\[120px\]/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /AGENT_TEST_CHAT_ILLUSTRATION_LIGHT_SRC = "\/illustration-spot\/general\/chat-6\/light\.svg"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /AGENT_TEST_CHAT_ILLUSTRATION_DARK_SRC = "\/illustration-spot\/general\/chat-6\/dark\.svg"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /AGENT_TEST_AUTOMATION_ILLUSTRATION_LIGHT_SRC = "\/illustration-spot\/general\/automation-2\/light\.svg"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /AGENT_TEST_AUTOMATION_ILLUSTRATION_DARK_SRC = "\/illustration-spot\/general\/automation-2\/dark\.svg"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /import ChevronRightIcon from "@atlaskit\/icon\/core\/chevron-right";/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /<Button[\s\S]*aria-label=\{`Test \$\{title\}`\}[\s\S]*className="h-auto w-full justify-start gap-4 rounded-none border-x-0 border-t-0 border-b border-border p-2 pr-4 text-left shadow-none last:border-b-0"[\s\S]*data-testid=\{testId\}[\s\S]*variant="ghost"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /opacity-0[\s\S]*group-hover\/button:opacity-100[\s\S]*group-focus-visible\/button:opacity-100[\s\S]*<ChevronRightIcon label="" color=\{token\("color\.icon\.subtle"\)\} size="small" spacing="none" \/>/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /className="flex h-14 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /testId="agent-test-chat-option"[\s\S]*title="Chat"/u);
	assert.doesNotMatch(AGENT_TEST_PANEL_SOURCE, /AgentTestChatMetadata/u);
	assert.doesNotMatch(AGENT_TEST_PANEL_SOURCE, /<Badge variant="neutral">Default<\/Badge>/u);
	assert.doesNotMatch(AGENT_TEST_PANEL_SOURCE, /Test this agent in conversation\./u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /aria-label=\{`Test \$\{title\}`\}/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /function AgentTestAutomationFlow\(/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /import \{ AgentAutomationFlowCover \} from "@\/components\/blocks\/triggers\/components\/agent-automation-flow-cover";/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /<AgentAutomationFlowCover[\s\S]*aria-hidden=\{false\}[\s\S]*aria-label=\{getAutomationOptionMetadata\(rule\)\}[\s\S]*rootElement="span"[\s\S]*triggers=\{rule\.triggers\}/u);
	assert.doesNotMatch(AGENT_TEST_PANEL_SOURCE, /const visibleTriggers = rule\.triggers\.slice\(0, 2\);/u);
	assert.doesNotMatch(AGENT_TEST_PANEL_SOURCE, /<AiSparkleIcon label="" size="small" spacing="none" \/>/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /automationRules\.map\(\(rule, ruleIndex\) => \(/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /testId=\{`agent-test-automation-option-\$\{rule\.id\}`\}/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /title=\{getAgentAutomationRuleLabel\(rule, ruleIndex\)\}/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /data-testid="agent-test-no-automation-empty"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /<AgentTestAutomationThumbnail disabled imageClassName="grayscale opacity-\(--opacity-disabled\)" \/>/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /"flex h-14 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface"[\s\S]*disabled && "border-dashed"/u);
	assert.doesNotMatch(AGENT_TEST_PANEL_SOURCE, /border-border-disabled/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /className=\{cn\("size-10 object-contain", imageClassName\)\}/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /className="truncate text-sm font-semibold leading-5 text-text-disabled">No automations yet<\/div>/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /No automations yet/u);
	assert.doesNotMatch(AGENT_TEST_PANEL_SOURCE, /Chat is ready to test\. Add an automation to create event-based testing options\./u);
	assert.doesNotMatch(AGENT_TEST_PANEL_SOURCE, /<TabsTrigger value="trigger">Trigger<\/TabsTrigger>/u);
});

test("AgentTestPanel opens selected automation detail before running callbacks", () => {
	assert.match(AGENT_TEST_PANEL_SOURCE, /type AgentAutomationRule/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /const automationRules = useMemo<readonly AgentAutomationRule\[\]>\([\s\S]*\(\) => selectedResult\.automationRules \?\? \[\]/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /onSelectAutomation=\{\(ruleId\) => setSelectedSurface\(\{ kind: "automation", ruleId \}\)\}/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /key=\{`\$\{snapshotKey\}:\$\{resetKey\}`\}/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /<AgentTestAutomationDetailView[\s\S]*rule=\{selectedAutomation\}[\s\S]*ruleIndex=\{selectedAutomationIndex\}/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /key=\{`\$\{snapshotKey\}:\$\{selectedAutomation\.id\}:\$\{resetKey\}`\}/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /export function AgentTestAutomationDetailView\(/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /<AutomationTestCard[\s\S]*setPendingSelection\(\{ ruleId: rule\.id, triggerId: trigger\.id \}\)/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /rule\.triggers\.map\(\(trigger\) => \([\s\S]*<AutomationTestEventRow/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /<Button[\s\S]*onClick=\{onTest\}[\s\S]*size="compact"[\s\S]*type="button"[\s\S]*variant="outline"[\s\S]*Test/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /function createAutomationTestResult\([\s\S]*automationName = getAgentAutomationRuleLabel\(rule, ruleIndex\)[\s\S]*automationId: rule\.id[\s\S]*eventTriggerId: trigger\.id[\s\S]*getProviderSampleData\(trigger\)/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /Callback result/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /Sample event payload/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /case "jira":[\s\S]*issueKey: "PROJ-248"/u);
	assert.match(AGENT_TEST_PANEL_SOURCE, /case "confluence":[\s\S]*pageId: "983421"/u);
});
