const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const MESSAGES_SOURCE = fs.readFileSync(
	path.join(__dirname, "rovo-app-messages.tsx"),
	"utf8",
);
const SHELL_SOURCE = fs.readFileSync(
	path.join(__dirname, "rovo-app-shell.tsx"),
	"utf8",
);
const GENERATING_AGENTS_SOURCE = fs.readFileSync(
	path.join(__dirname, "..", "lib", "studio-automation-generating-agents.ts"),
	"utf8",
);
const MESSAGE_DISPLAY_SOURCE = fs.readFileSync(
	path.join(__dirname, "..", "lib", "rovo-app-message-display.ts"),
	"utf8",
);
const THINKING_TRACE_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/projects/shared/components/assistant-thinking-trace.tsx"),
	"utf8",
);
const TWG_TOOL_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/ui-custom/twg-tool.tsx"),
	"utf8",
);
const CHAIN_OF_THOUGHT_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/ui-custom/chain-of-thought.tsx"),
	"utf8",
);
const USE_ROVO_APP_SOURCE = fs.readFileSync(
	path.join(__dirname, "..", "hooks", "use-rovo-app.ts"),
	"utf8",
);
const BACKEND_SERVER_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "backend/server.js"),
	"utf8",
);

test("Studio automation discovery widget renders with ArtifactList and row selection", () => {
	assert.match(MESSAGES_SOURCE, /import \{ ArtifactList, type ArtifactListItem \} from "@\/components\/ui-custom\/artifact-list";/u);
	assert.match(MESSAGES_SOURCE, /const STUDIO_AUTOMATION_ARTIFACT_LIST_TYPE = "studio-automation-artifact-list";/u);
	assert.match(MESSAGES_SOURCE, /function parseStudioAutomationArtifactListPayload\(payload: unknown\)/u);
	assert.match(MESSAGES_SOURCE, /isGeneratedAgentResult\(agentResult\)/u);
	assert.match(MESSAGES_SOURCE, /function StudioAutomationArtifactListWidget/u);
	assert.match(MESSAGES_SOURCE, /<ArtifactList[\s\S]*openLabel="View agent"[\s\S]*onOpen=\{\(item\) => \{/u);
	assert.match(MESSAGES_SOURCE, /<ArtifactList[\s\S]*openOnRowClick/u);
	assert.match(MESSAGES_SOURCE, /onAgentResultSelect\?\.\(agent, \{ sourceMessageId: messageId \}\);/u);
	assert.match(MESSAGES_SOURCE, /shouldRenderStudioAutomationArtifactList[\s\S]*<StudioAutomationArtifactListWidget/u);
	assert.match(MESSAGES_SOURCE, /onAgentResultSelect=\{onAgentResultSelect\}/u);
	assert.doesNotMatch(MESSAGES_SOURCE, /<section className="w-full max-w-3xl rounded-lg border border-border bg-surface-raised p-3">/u);
});

test("Studio automation discovery result keeps clearance above the sticky composer", () => {
	assert.match(MESSAGES_SOURCE, /"mx-auto flex min-w-0 flex-col gap-4 pt-6 pb-32 md:gap-6"/u);
	assert.doesNotMatch(MESSAGES_SOURCE, /"mx-auto flex min-w-0 flex-col gap-4 py-6 md:gap-6"/u);
});

test("Studio automation discovery widget is visible on text-routed tool responses", () => {
	assert.match(MESSAGE_DISPLAY_SOURCE, /"studio-automation-artifact-list"/u);
	assert.match(MESSAGE_DISPLAY_SOURCE, /ROVO_APP_TOOL_DRIVEN_WIDGET_TYPES\.has\(input\.widgetType\)/u);
});

test("Studio requests preserve their chat SDK source through the Rovo app proxy", () => {
	assert.match(USE_ROVO_APP_SOURCE, /chatSdkSource: "studio"/u);
	assert.match(BACKEND_SERVER_SOURCE, /requestBody\.chatSdkSource = getNonEmptyString\(requestBody\.chatSdkSource\) \|\| "rovo";/u);
});

test("Studio automation discovery clarification emits pre-question thinking before awaiting input", () => {
	assert.match(BACKEND_SERVER_SOURCE, /function buildStudioAutomationDiscoveryInitialQuestionPreflightTrace/u);
	assert.match(BACKEND_SERVER_SOURCE, /toolName: "studio\.scope_agent_discovery"/u);
	assert.match(BACKEND_SERVER_SOURCE, /toolName: "studio\.plan_source_scan"/u);
	assert.match(BACKEND_SERVER_SOURCE, /await writeStudioAutomationDiscoveryQuestionPreflightTrace/u);
	assert.match(BACKEND_SERVER_SOURCE, /label: "Waiting for your choices"/u);
	assert.match(BACKEND_SERVER_SOURCE, /type: "data-thinking-event"[\s\S]*phase: "start"[\s\S]*toolName: STUDIO_AUTOMATION_DISCOVERY_QUESTION_TOOL_NAME/u);
	assert.match(BACKEND_SERVER_SOURCE, /questions: \["priority", "source-weighting", "conservatism"\]/u);
	assert.match(BACKEND_SERVER_SOURCE, /label: "Asking for draft boundaries"/u);
	assert.match(BACKEND_SERVER_SOURCE, /questions: \["creation-boundary", "approval-boundary", "hero-moment"\]/u);
	assert.match(BACKEND_SERVER_SOURCE, /Before I create any agents, I need to lock the decision frame/u);
	assert.doesNotMatch(BACKEND_SERVER_SOURCE, /I found the automation-discovery brief/u);
	assert.doesNotMatch(BACKEND_SERVER_SOURCE, /ranking matches Venn's presentation goals/u);
});

test("Studio automation discovery routes initial and follow-up answers to separate phases", () => {
	assert.match(BACKEND_SERVER_SOURCE, /isStudioAutomationDiscoveryInitialSession\(clarificationSubmission\?\.sessionId\)/u);
	assert.match(BACKEND_SERVER_SOURCE, /isStudioAutomationDiscoveryFollowupSession\(clarificationSubmission\?\.sessionId\)/u);
	assert.match(BACKEND_SERVER_SOURCE, /phase: "discovery"/u);
	assert.match(BACKEND_SERVER_SOURCE, /phase: "generation"/u);
	assert.match(BACKEND_SERVER_SOURCE, /isStudioAutomationDiscoveryInitialDismissalPrompt\(latestVisiblePromptText\)/u);
	assert.match(BACKEND_SERVER_SOURCE, /isStudioAutomationDiscoveryFollowupDismissalPrompt\(latestVisiblePromptText\)/u);
});

test("Studio automation discovery prompt does not enter generic agent creation mode", () => {
	assert.match(SHELL_SOURCE, /function isStudioAutomationDiscoveryDemoPrompt\(prompt: string\): boolean/u);
	assert.match(SHELL_SOURCE, /const isAutomationDiscoveryDemoPrompt = isStudioAutomationDiscoveryDemoPrompt\(trimmedText\);/u);
	assert.match(SHELL_SOURCE, /!isAutomationDiscoveryDemoPrompt/u);
	assert.match(SHELL_SOURCE, /\.\.\.\(shouldStartStudioAgentCreation \? \{ creationMode: "agent" as const \} : \{\}\)/u);
});

test("scripted TWG trace step renders TwgTool as the first-level step header", () => {
	assert.match(THINKING_TRACE_SOURCE, /import \{ TwgTool, type TwgToolSource \} from "@\/components\/ui-custom\/twg-tool";/u);
	assert.match(THINKING_TRACE_SOURCE, /const STUDIO_AUTOMATION_TWG_TOOL_NAME = "twg\.search_work_patterns";/u);
	assert.match(CHAIN_OF_THOUGHT_SOURCE, /headerRender\?: \(context: ChainOfThoughtStepHeaderRenderContext\) => ReactNode;/u);
	assert.match(THINKING_TRACE_SOURCE, /function getStudioAutomationToolByline/u);
	assert.match(THINKING_TRACE_SOURCE, /function StudioAutomationTwgTraceDetail/u);
	assert.match(THINKING_TRACE_SOURCE, /headerRender=\{studioAutomationToolHeader \? \(\) => \([\s\S]*<TwgTool[\s\S]*title=\{studioAutomationToolHeader\.title\}/u);
	assert.doesNotMatch(THINKING_TRACE_SOURCE, /className="pl-11 text-xs leading-5 text-text-subtle"/u);
	assert.doesNotMatch(THINKING_TRACE_SOURCE, /ml-11 space-y-1 text-xs leading-5 text-text-subtle/u);
	assert.doesNotMatch(THINKING_TRACE_SOURCE, /rounded-md border border-border\/60 bg-surface px-2\.5 py-2/u);
	assert.match(THINKING_TRACE_SOURCE, /isStudioAutomationTwgTool \? \(/u);
	assert.match(TWG_TOOL_SOURCE, /import \{ TWGLoader \} from "@\/components\/ui-custom\/twg-loader";/u);
	assert.match(TWG_TOOL_SOURCE, /<TWGLoader label="Teamwork Graph" size="small" \/>/u);
	assert.match(TWG_TOOL_SOURCE, /<CyclingByline>\{description\}<\/CyclingByline>/u);
	assert.doesNotMatch(TWG_TOOL_SOURCE, /AtlassianLogo/u);
	assert.doesNotMatch(TWG_TOOL_SOURCE, /flex w-8 shrink-0 flex-col items-center/u);
});

test("scripted automation trace renders extra tool cycling moments", () => {
	assert.match(THINKING_TRACE_SOURCE, /const STUDIO_AUTOMATION_TOOL_CYCLE_DETAILS/u);
	assert.match(THINKING_TRACE_SOURCE, /"parallel\.source_scan": \{[\s\S]*title: "Cycling through source apps"/u);
	assert.match(THINKING_TRACE_SOURCE, /"studio\.rank_automation_candidates": \{[\s\S]*title: "Cycling create, skip, and evidence buckets"/u);
	assert.match(THINKING_TRACE_SOURCE, /"studio\.create_agent_drafts": \{[\s\S]*title: "Cycling through three Studio drafts"/u);
	assert.match(THINKING_TRACE_SOURCE, /function StudioAutomationToolCycleTraceDetail/u);
	assert.match(THINKING_TRACE_SOURCE, /studioAutomationToolCycleDetail \? \(/u);
});

test("Studio automation discovery create-agent trace drives sidebar generating rows", () => {
	assert.match(GENERATING_AGENTS_SOURCE, /const STUDIO_AUTOMATION_CREATE_AGENT_DRAFTS_TOOL_NAME = "studio\.create_agent_drafts";/u);
	assert.match(GENERATING_AGENTS_SOURCE, /const STUDIO_AUTOMATION_ARTIFACT_LIST_TYPE = "studio-automation-artifact-list";/u);
	assert.match(GENERATING_AGENTS_SOURCE, /avatarSrc: "\/avatar-agent\/product-agents\/feedback-analyzer\.svg"[\s\S]*id: "venn-loom-distribution-agent"/u);
	assert.match(GENERATING_AGENTS_SOURCE, /id: "venn-loom-distribution-agent",[\s\S]*label: "Loom Distribution Agent"/u);
	assert.match(GENERATING_AGENTS_SOURCE, /avatarSrc: "\/avatar-agent\/service-agents\/service-triage\.svg"[\s\S]*id: "venn-inactive-agent-triage-agent"/u);
	assert.match(GENERATING_AGENTS_SOURCE, /id: "venn-inactive-agent-triage-agent",[\s\S]*label: "Inactive Agent Triage Agent"/u);
	assert.match(GENERATING_AGENTS_SOURCE, /avatarSrc: "\/avatar-agent\/strategy-agents\/strategic-insight\.svg"[\s\S]*id: "venn-weekly-sprint-atlas-digest-agent"/u);
	assert.match(GENERATING_AGENTS_SOURCE, /id: "venn-weekly-sprint-atlas-digest-agent",[\s\S]*label: "Weekly Sprint\/Atlas Digest Agent"/u);
	assert.match(GENERATING_AGENTS_SOURCE, /part\.data\?\.type === STUDIO_AUTOMATION_ARTIFACT_LIST_TYPE/u);
	assert.match(GENERATING_AGENTS_SOURCE, /event\.toolName === STUDIO_AUTOMATION_CREATE_AGENT_DRAFTS_TOOL_NAME/u);
	assert.match(GENERATING_AGENTS_SOURCE, /latestCreateDraftEvent\.phase !== "start"/u);
	assert.match(SHELL_SOURCE, /import \{ getStudioAutomationGeneratingAgents \} from "@\/components\/projects\/studio\/lib\/studio-automation-generating-agents";/u);
	assert.match(SHELL_SOURCE, /const studioAutomationGeneratingAgents = useMemo\(\(\) => \(\s*getStudioAutomationGeneratingAgents\(chat\.messages\)\s*\), \[chat\.messages\]\);/u);
	assert.match(SHELL_SOURCE, /generatingAgents=\{studioAutomationGeneratingAgents\}/u);
});

test("Studio automation discovery draft trace uses distinct agent avatar families", () => {
	assert.match(THINKING_TRACE_SOURCE, /id: "loom-agent"[\s\S]*iconSrc: "\/avatar-agent\/product-agents\/feedback-analyzer\.svg"/u);
	assert.match(THINKING_TRACE_SOURCE, /id: "triage-agent"[\s\S]*iconSrc: "\/avatar-agent\/service-agents\/service-triage\.svg"/u);
	assert.match(THINKING_TRACE_SOURCE, /id: "digest-agent"[\s\S]*iconSrc: "\/avatar-agent\/strategy-agents\/strategic-insight\.svg"/u);
});
