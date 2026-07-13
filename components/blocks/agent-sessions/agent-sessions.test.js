const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { readDetailCategorySource } = require(process.cwd() + "/app/data/details/test-source.cjs");
const { readWebsiteRegistrySource } = require(process.cwd() + "/components/website/registry/test-source.cjs");

const AGENT_SESSIONS_SOURCE = fs.readFileSync(path.join(__dirname, "index.tsx"), "utf8");

function readProjectFile(relativePath) {
	return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("AgentSessions opens the Jira work item modal from a button", () => {
	assert.match(AGENT_SESSIONS_SOURCE, /initialIssueOpen\?: boolean;/u);
	assert.match(AGENT_SESSIONS_SOURCE, /onIssueClose\?: \(\) => void;/u);
	assert.match(AGENT_SESSIONS_SOURCE, /initialIssueOpen = false,/u);
	assert.match(AGENT_SESSIONS_SOURCE, /const \[isIssueOpen, setIsIssueOpen\] = useState\(initialIssueOpen\);/u);
	assert.match(AGENT_SESSIONS_SOURCE, /function handleIssueClose\(\)[\s\S]*setIsIssueOpen\(false\);[\s\S]*onIssueClose\?\.\(\);/u);
	assert.match(AGENT_SESSIONS_SOURCE, /className="flex h-full min-h-\[400px\] items-center justify-center p-4"/u);
	assert.match(AGENT_SESSIONS_SOURCE, /<Button[\s\S]*onClick=\{\(\) => setIsIssueOpen\(true\)\}[\s\S]*Open work item[\s\S]*<\/Button>/u);
	assert.match(
		AGENT_SESSIONS_SOURCE,
		/<JiraWorkItemModal isOpen=\{isIssueOpen\} onClose=\{handleIssueClose\} \/>/u,
	);
	assert.doesNotMatch(AGENT_SESSIONS_SOURCE, /<JiraWorkItemModal isOpen(?:\s|>)/u);
	assert.doesNotMatch(AGENT_SESSIONS_SOURCE, /Acmecorp: Prepare for bid recommendation for ESM RFP/u);
	assert.doesNotMatch(AGENT_SESSIONS_SOURCE, /bg-bg-neutral/u);
	assert.doesNotMatch(AGENT_SESSIONS_SOURCE, /relative h-full min-h-\[400px\]/u);
});

test("AgentSessions includes the shared floating Rovo launcher and chat surface", () => {
	assert.match(
		AGENT_SESSIONS_SOURCE,
		/import FloatingRovoButton from "@\/components\/projects\/shared\/components\/floating-rovo-button";/u,
	);
	assert.match(
		AGENT_SESSIONS_SOURCE,
		/import RovoFloatingChat from "@\/components\/projects\/rovo-floating-chat\/components\/rovo-floating-chat";/u,
	);
	assert.match(AGENT_SESSIONS_SOURCE, /\{isIssueOpen && chatSurface === null \? \([\s\S]*<FloatingRovoButton[\s\S]*product="jira"[\s\S]*\/>[\s\S]*\) : null\}/u);
	assert.equal((AGENT_SESSIONS_SOURCE.match(/\{isIssueOpen && chatSurface === null \? \(/gu) ?? []).length, 2);
	assert.match(AGENT_SESSIONS_SOURCE, /\{chatSurface === "floating" \? \([\s\S]*<RovoFloatingChat key="floating-chat" \/>[\s\S]*\) : null\}/u);
});

test("AgentSessions exposes default and experimental variations", () => {
	const pageSource = readProjectFile("components/blocks/agent-sessions/page.tsx");
	const detailsSource = readDetailCategorySource("blocks");
	const registrySource = readWebsiteRegistrySource();
	const demoSource = readProjectFile("components/website/demos/blocks/agent-sessions-demo.tsx");
	const previewLayoutSource = readProjectFile("app/preview/blocks/[slug]/layout.tsx");
	const defaultViewSource = AGENT_SESSIONS_SOURCE.slice(
		AGENT_SESSIONS_SOURCE.indexOf("function AgentSessionsDefaultView"),
		AGENT_SESSIONS_SOURCE.indexOf("function AgentSessionsExperimentalView"),
	);
	const experimentalViewSource = AGENT_SESSIONS_SOURCE.slice(
		AGENT_SESSIONS_SOURCE.indexOf("function AgentSessionsExperimentalView"),
		AGENT_SESSIONS_SOURCE.indexOf("export default AgentSessions"),
	);

	assert.match(AGENT_SESSIONS_SOURCE, /export type AgentSessionsVariant = "default" \| "experimental";/u);
	assert.match(AGENT_SESSIONS_SOURCE, /variant\?: AgentSessionsVariant;/u);
	assert.match(AGENT_SESSIONS_SOURCE, /variant = "default"/u);
	assert.match(
		AGENT_SESSIONS_SOURCE,
		/variant === "experimental" \? \([\s\S]*<AgentSessionsExperimentalView initialIssueOpen=\{initialIssueOpen\} onIssueClose=\{onIssueClose\} \/>[\s\S]*\) : \([\s\S]*<AgentSessionsDefaultView initialIssueOpen=\{initialIssueOpen\} onIssueClose=\{onIssueClose\} \/>/u,
	);
	assert.doesNotMatch(AGENT_SESSIONS_SOURCE, /AgentSessionsCurrentView/u);
	assert.match(defaultViewSource, /const \[isIssueOpen, setIsIssueOpen\] = useState\(initialIssueOpen\);/u);
	assert.match(defaultViewSource, /<JiraWorkItemModal isOpen=\{isIssueOpen\} onClose=\{handleIssueClose\} \/>/u);
	assert.match(experimentalViewSource, /const \[isIssueOpen, setIsIssueOpen\] = useState\(initialIssueOpen\);/u);
	assert.match(experimentalViewSource, /<JiraWorkItemModal isOpen=\{isIssueOpen\} onClose=\{handleIssueClose\} \/>/u);
	assert.equal((AGENT_SESSIONS_SOURCE.match(/const \[isIssueOpen, setIsIssueOpen\] = useState\(initialIssueOpen\);/gu) ?? []).length, 2);
	assert.match(pageSource, /type AgentSessionsVariant/u);
	assert.match(pageSource, /const \[activeVariant, setActiveVariant\] = useState<AgentSessionsVariant \| null>\(null\);/u);
	assert.match(pageSource, /if \(activeVariant\) \{[\s\S]*<AgentSessions[\s\S]*initialIssueOpen[\s\S]*variant=\{activeVariant\}[\s\S]*onIssueClose=\{\(\) => setActiveVariant\(null\)\}[\s\S]*\/>[\s\S]*\}/u);
	assert.match(pageSource, /className="flex h-full min-h-screen items-center justify-center gap-3 p-4"/u);
	assert.match(pageSource, /Open standard session/u);
	assert.match(pageSource, /Open experimental session/u);
	assert.match(pageSource, /variant="outline"[\s\S]*onClick=\{\(\) => setActiveVariant\("default"\)\}/u);
	assert.match(pageSource, /onClick=\{\(\) => setActiveVariant\("default"\)\}/u);
	assert.match(pageSource, /onClick=\{\(\) => setActiveVariant\("experimental"\)\}/u);
	assert.match(pageSource, /export function AgentSessionsExperimentalPage/u);
	assert.match(pageSource, /<AgentSessions variant="experimental" \/>/u);
	assert.match(detailsSource, /title: "Standard"[\s\S]*demoSlug: "agent-sessions-demo-standard"/u);
	assert.match(detailsSource, /title: "Experimental"[\s\S]*demoSlug: "agent-sessions-demo-experimental"/u);
	assert.match(detailsSource, /name: "initialIssueOpen"[\s\S]*Opens the Jira work item modal on initial render/u);
	assert.match(detailsSource, /name: "onIssueClose"[\s\S]*Called after the Jira work item modal closes/u);
	assert.match(detailsSource, /name: "variant"[\s\S]*type: "\\"default\\" \| \\"experimental\\"/u);
	assert.match(registrySource, /"agent-sessions-demo-standard": dynamic[\s\S]*default: mod\.AgentSessionsDemoStandard/u);
	assert.match(registrySource, /"agent-sessions-demo-experimental": dynamic[\s\S]*default: mod\.AgentSessionsDemoExperimental/u);
	assert.match(demoSource, /import AgentSessionsPage from "@\/components\/blocks\/agent-sessions\/page";/u);
	assert.match(demoSource, /return <AgentSessionsPage \/>;/u);
	assert.match(demoSource, /export function AgentSessionsDemoStandard/u);
	assert.match(demoSource, /export function AgentSessionsDemoExperimental/u);
	assert.match(demoSource, /<AgentSessions variant="default" \/>/u);
	assert.match(demoSource, /<AgentSessions variant="experimental" \/>/u);
	assert.match(previewLayoutSource, /"agent-sessions-demo-standard"/u);
	assert.match(previewLayoutSource, /"agent-sessions-demo-experimental"/u);
});
