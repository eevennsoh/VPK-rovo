const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

const HOOK_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/projects/asx/hooks/use-asx-agent-chat-demo.ts"),
	"utf8",
);

async function loadHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				export {
					ASX_CHAT_AGENT_PROFILES,
					buildAsxAgentChatPlayback,
					buildAsxAgentChatContextBar,
				} from "./components/projects/asx/data/agent-chat-data";
			`,
			loader: "ts",
			resolveDir: process.cwd(),
			sourcefile: "asx-agent-chat-data-harness.ts",
		},
		bundle: true,
		format: "cjs",
		loader: { ".css": "text" },
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text);
}

test("ASX chat profiles include every lifecycle-specific agent", async () => {
	const { ASX_CHAT_AGENT_PROFILES } = await loadHarness();
	const profileIds = new Set(ASX_CHAT_AGENT_PROFILES.map((profile) => profile.id));
	const serviceImpactAgent = ASX_CHAT_AGENT_PROFILES.find((profile) => profile.id === "service-impact-agent");
	const dependencyMapper = ASX_CHAT_AGENT_PROFILES.find((profile) => profile.id === "dependency-mapper");

	assert.equal(profileIds.has("rfp-drafter"), true);
	assert.equal(profileIds.has("service-impact-agent"), true);
	assert.equal(profileIds.has("dependency-mapper"), true);
	assert.equal(serviceImpactAgent.avatarSrc, "/avatar-agent/service-agents/rca-agent.svg");
	assert.equal(dependencyMapper.avatarSrc, "/avatar-agent/teamwork-agents/work-item-planner.svg");
	assert.notEqual(serviceImpactAgent.avatarSrc, dependencyMapper.avatarSrc);
});

test("ASX agent chat playback deterministically advances from thinking to final output", async () => {
	const { buildAsxAgentChatPlayback } = await loadHarness();
	const playback = buildAsxAgentChatPlayback({
		agentId: "rfp-drafter",
		agentName: "RFP Drafter",
		issueKey: "RFP-101",
		issueSummary: "Prepare bid recommendation",
	}, "test-run", 0);

	assert.deepEqual(playback.frames.map((frame) => frame.delayMs), [0, 700, 900, 800]);
	assert.equal(playback.frames[0].parts[0].type, "data-thinking-status");
	assert.equal(playback.frames[1].parts.some((part) => part.type === "data-thinking-event"), true);
	assert.equal(playback.frames[2].parts.at(-1).state, "streaming");
	assert.equal(playback.frames[3].parts.at(-1).state, "done");
});

test("ASX agent chat exposes persistent work-item context for the floating composer", async () => {
	const { buildAsxAgentChatContextBar } = await loadHarness();
	const contextBar = buildAsxAgentChatContextBar({
		agentId: "dependency-mapper",
		agentName: "Dependency mapper",
		issueKey: "PD-40",
		issueSummary: "Implement advanced date-range filter",
	});

	assert.deepEqual(contextBar, {
		iconName: "work-item",
		label: "PD-40: Implement advanced date-range filter",
		showDismissPlaceholder: false,
		signature: "asx-work-item:PD-40",
	});
	assert.equal(contextBar.collapsible, undefined);
});

test("ASX chat hook selects the agent before opening and cancels stale playback timers", () => {
	assert.match(HOOK_SOURCE, /selectAgent\(scenario\.agentId, \{ preserveCurrentThread: true \}\);[\s\S]*openChat\("floating"\);/u);
	assert.match(HOOK_SOURCE, /for \(const timer of timersRef\.current\)[\s\S]*window\.clearTimeout\(timer\);/u);
	assert.match(HOOK_SOURCE, /useEffect\(\(\) => cancelPlayback, \[cancelPlayback\]\);/u);
	assert.match(HOOK_SOURCE, /setChatContextBar\(buildAsxAgentChatContextBar\(scenario\)\);/u);
});
