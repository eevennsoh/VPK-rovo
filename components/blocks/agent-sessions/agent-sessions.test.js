const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { readDetailCategorySource } = require(process.cwd() + "/app/data/details/test-source.cjs");
const { readWebsiteRegistrySource } = require(process.cwd() + "/components/website/registry/test-source.cjs");
const { loadCjsModuleFromText } = require(process.cwd() + "/scripts/lib/esbuild-cjs-loader.js");

const BLOCK_DIR = __dirname;
const AGENT_SESSIONS_SOURCE = fs.readFileSync(path.join(BLOCK_DIR, "index.tsx"), "utf8");

function readProjectFile(relativePath) {
	return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function readBlockFile(relativePath) {
	return fs.readFileSync(path.join(BLOCK_DIR, relativePath), "utf8");
}

// The pure model is loaded via esbuild (type-only imports strip to a clean CJS
// bundle) so behavioral coverage can exercise the reducer/timer/selectors without
// a DOM or React harness — mirroring components/projects/jira/lib/rfp-demo-state.test.js.
let modelPromise;
function loadSessionModel() {
	if (!modelPromise) {
		modelPromise = esbuild
			.build({
				entryPoints: [path.join(BLOCK_DIR, "data/session-state.ts")],
				bundle: true,
				format: "cjs",
				platform: "node",
				tsconfig: path.join(process.cwd(), "tsconfig.json"),
				write: false,
			})
			.then((result) => loadCjsModuleFromText(result.outputFiles[0].text, "agent-sessions-model-harness.cjs"));
	}
	return modelPromise;
}

function tickUntil(model, state, predicate, maxTicks = 400) {
	let working = state;
	let ticks = 0;
	while (!predicate(working) && ticks < maxTicks) {
		working = model.agentSessionsReducer(working, { type: "tick", deltaMs: model.AGENT_SESSIONS_TICK_MS });
		ticks += 1;
	}
	return working;
}

// ── Source shape: variant API + experimental preset ──────────────────────────

test("AgentSessions exposes the variant API and the minimal experimental preset prop", () => {
	assert.match(AGENT_SESSIONS_SOURCE, /export type AgentSessionsVariant = "default" \| "experimental";/u);
	assert.match(AGENT_SESSIONS_SOURCE, /variant\?: AgentSessionsVariant;/u);
	assert.match(AGENT_SESSIONS_SOURCE, /variant = "default"/u);
	assert.match(AGENT_SESSIONS_SOURCE, /initialExperimentalPreset\?: AgentSessionsExperimentalPreset;/u);
	assert.match(AGENT_SESSIONS_SOURCE, /initialExperimentalPreset = "filled"/u);
	assert.match(
		AGENT_SESSIONS_SOURCE,
		/variant === "experimental" \? \([\s\S]*<AgentSessionsExperimentalView[\s\S]*\) : \([\s\S]*<AgentSessionsDefaultView/u,
	);
	// The experimental preset type is the model's preset union.
	assert.match(AGENT_SESSIONS_SOURCE, /import type \{ AgentSessionsPreset \} from "@\/components\/blocks\/agent-sessions\/data\/session-state";/u);
});

test("AgentSessions preserves the standard variant behavior (regression)", () => {
	const defaultViewSource = AGENT_SESSIONS_SOURCE.slice(
		AGENT_SESSIONS_SOURCE.indexOf("function AgentSessionsDefaultView"),
		AGENT_SESSIONS_SOURCE.indexOf("function AgentSessionsExperimentalView"),
	);
	// Standard view keeps the Jira work item modal + shared floating Rovo launcher + chat surface.
	assert.match(defaultViewSource, /const \[isIssueOpen, setIsIssueOpen\] = useState\(initialIssueOpen\);/u);
	assert.match(defaultViewSource, /<JiraWorkItemModal isOpen=\{isIssueOpen\} onClose=\{handleIssueClose\} \/>/u);
	assert.match(defaultViewSource, /\{isIssueOpen && chatSurface === null \? \([\s\S]*<FloatingRovoButton[\s\S]*product="jira"[\s\S]*\/>[\s\S]*\) : null\}/u);
	assert.match(defaultViewSource, /\{chatSurface === "floating" \? <RovoFloatingChat key="floating-chat" \/> : null\}/u);
	assert.match(AGENT_SESSIONS_SOURCE, /import FloatingRovoButton from "@\/components\/projects\/shared\/components\/floating-rovo-button";/u);
	assert.match(AGENT_SESSIONS_SOURCE, /import RovoFloatingChat from "@\/components\/projects\/rovo-floating-chat\/components\/rovo-floating-chat";/u);
	// Standard mock context is not inlined into the block source.
	assert.doesNotMatch(defaultViewSource, /Acmecorp: Prepare for bid recommendation for ESM RFP/u);
});

test("AgentSessions experimental view mounts the local composition, not the global Rovo chat", () => {
	const experimentalViewSource = AGENT_SESSIONS_SOURCE.slice(
		AGENT_SESSIONS_SOURCE.indexOf("function AgentSessionsExperimentalView"),
		AGENT_SESSIONS_SOURCE.indexOf("export default AgentSessions"),
	);
	assert.match(experimentalViewSource, /const \[isIssueOpen, setIsIssueOpen\] = useState\(initialIssueOpen\);/u);
	assert.match(experimentalViewSource, /<ExperimentalAgentSessions[\s\S]*open=\{isIssueOpen\}[\s\S]*onClose=\{handleIssueClose\}[\s\S]*initialPreset=\{initialExperimentalPreset\}[\s\S]*\/>/u);
	// The experimental variant must NOT reuse the standard modal or the global Rovo chat surface.
	assert.doesNotMatch(experimentalViewSource, /JiraWorkItemModal/u);
	assert.doesNotMatch(experimentalViewSource, /RovoFloatingChat/u);
	assert.match(AGENT_SESSIONS_SOURCE, /import \{ ExperimentalAgentSessions \} from "@\/components\/blocks\/agent-sessions\/experimental\/experimental-agent-sessions";/u);
	// Shared open/close shell is extracted and used by both views.
	assert.match(AGENT_SESSIONS_SOURCE, /function AgentSessionsShell\(/u);
	assert.equal((AGENT_SESSIONS_SOURCE.match(/<AgentSessionsShell onOpen=/gu) ?? []).length, 2);
});

test("the experimental surface stays out of global Rovo history", () => {
	const compositionSource = readBlockFile("experimental/experimental-agent-sessions.tsx");
	const controllerSource = readBlockFile("experimental/use-agent-sessions-controller.ts");
	const contextSource = readBlockFile("experimental/context-agent-sessions.tsx");
	for (const source of [compositionSource, controllerSource, contextSource]) {
		assert.doesNotMatch(source, /useRovoChat/u);
		assert.doesNotMatch(source, /openChat\("floating"\)/u);
	}
	assert.match(compositionSource, /<AgentSessionsProvider/u);
	assert.match(compositionSource, /<FloatingSessionSurface \/>/u);
});

test("running metronome is gated on the open surface so preset sessions stay pristine until opened (regression)", () => {
	const controllerSource = readBlockFile("experimental/use-agent-sessions-controller.ts");
	const contextSource = readBlockFile("experimental/context-agent-sessions.tsx");
	const compositionSource = readBlockFile("experimental/experimental-agent-sessions.tsx");

	// Controller: the metronome only ticks while the surface is active AND a session
	// is running, and `active` is a dependency so it re-subscribes on open/close. This
	// prevents the inline docs "running" launcher from ticking down to waiting/completed
	// while its dialog is still closed.
	assert.match(controllerSource, /active = true,?/u);
	assert.match(controllerSource, /if \(!active \|\| !isRunning\) return undefined;/u);
	assert.match(controllerSource, /\[active, isRunning, shouldReduceMotion\]/u);

	// Provider forwards the gate to the controller.
	assert.match(contextSource, /active\?: boolean;/u);
	assert.match(contextSource, /useAgentSessionsController\(initialPreset, active\)/u);

	// Composition drives the gate from the dialog open state.
	assert.match(compositionSource, /<AgentSessionsProvider[\s\S]*active=\{open\}[\s\S]*>/u);
});

// ── Source shape: preset chooser page ────────────────────────────────────────

test("page.tsx is the 2-button hero chooser (standard + experimental=filled) that remounts the block", () => {
	const pageSource = readBlockFile("page.tsx");
	assert.match(pageSource, /const \[activeVariant, setActiveVariant\] = useState<AgentSessionsVariant \| null>\(null\);/u);
	assert.match(pageSource, /Open standard session/u);
	assert.match(pageSource, /Open experimental session/u);
	assert.match(pageSource, /onClick=\{\(\) => setActiveVariant\("default"\)\}/u);
	assert.match(pageSource, /onClick=\{\(\) => setActiveVariant\("experimental"\)\}/u);
	// Remounts deterministically via key; experimental uses the filled preset.
	assert.match(pageSource, /<AgentSessions[\s\S]*key=\{activeVariant\}[\s\S]*variant=\{activeVariant\}[\s\S]*initialExperimentalPreset="filled"[\s\S]*\/>/u);
	assert.match(pageSource, /export function AgentSessionsExperimentalPage/u);
});

// ── Registry / details / demo parity (must stay consistent for test:catalog) ──

test("AgentSessions keeps the standard + experimental registry, detail, demo, and preview wiring", () => {
	const detailsSource = readDetailCategorySource("blocks");
	const registrySource = readWebsiteRegistrySource();
	const blockVariantRegistrySource = registrySource.slice(registrySource.indexOf("export const BLOCK_VARIANT_DEMOS"));
	const demoSource = readProjectFile("components/website/demos/blocks/agent-sessions-demo.tsx");
	const previewLayoutSource = readProjectFile("app/preview/blocks/[slug]/layout.tsx");

	assert.match(detailsSource, /title: "Standard"[\s\S]*demoSlug: "agent-sessions-demo-standard"/u);
	assert.match(detailsSource, /title: "Experimental"[\s\S]*demoSlug: "agent-sessions-demo-experimental"/u);
	assert.match(detailsSource, /name: "initialIssueOpen"[\s\S]*Opens the Jira work item modal on initial render/u);
	assert.match(detailsSource, /name: "onIssueClose"[\s\S]*Called after the Jira work item modal closes/u);
	assert.match(detailsSource, /name: "variant"[\s\S]*type: "\\"default\\" \| \\"experimental\\"/u);
	assert.match(detailsSource, /name: "initialExperimentalPreset"[\s\S]*empty[\s\S]*filled[\s\S]*running/u);
	assert.match(registrySource, /"agent-sessions-demo-standard": dynamic[\s\S]*default: mod\.AgentSessionsDemoStandard/u);
	assert.match(registrySource, /"agent-sessions-demo-experimental": dynamic[\s\S]*default: mod\.AgentSessionsDemoExperimental/u);
	assert.match(blockVariantRegistrySource, /"agent-sessions-demo-standard": dynamic[\s\S]*default: mod\.AgentSessionsDemoStandard/u);
	assert.match(blockVariantRegistrySource, /"agent-sessions-demo-experimental": dynamic[\s\S]*default: mod\.AgentSessionsDemoExperimental/u);
	assert.match(demoSource, /export function AgentSessionsDemoStandard/u);
	assert.match(demoSource, /export function AgentSessionsDemoExperimental/u);
	assert.match(demoSource, /<AgentSessions variant="default" \/>/u);
	// The hero demo is the 2-button chooser page; the experimental example is the filled variant.
	assert.match(demoSource, /import AgentSessionsPage from "@\/components\/blocks\/agent-sessions\/page";/u);
	assert.match(demoSource, /return <AgentSessionsPage \/>;/u);
	assert.match(demoSource, /<AgentSessions variant="experimental" initialExperimentalPreset="filled" \/>/u);
	assert.match(previewLayoutSource, /"agent-sessions-demo-standard"/u);
	assert.match(previewLayoutSource, /"agent-sessions-demo-experimental"/u);
});

// ── Behavioral coverage: the pure session-state model ────────────────────────

test("preset initialization: empty/filled/running set up the two dimensions", async () => {
	const model = await loadSessionModel();
	const empty = model.hydratePreset("empty");
	assert.equal(model.selectContextStatus(empty), "empty");
	assert.equal(empty.sessions.length, 0);

	const filled = model.hydratePreset("filled");
	assert.equal(model.selectContextStatus(filled), "filled");
	assert.equal(model.selectWorkingCount(filled), 0);
	assert.ok(filled.sessions.some((session) => session.status === "completed"));

	const running = model.hydratePreset("running");
	assert.equal(model.selectContextStatus(running), "filled");
	assert.equal(model.selectWorkingCount(running), 3); // 2 running + 1 waiting
	assert.ok(running.sessions.some((session) => session.status === "waiting"));
});

test("context derivation flips empty <-> filled as resources change", async () => {
	const model = await loadSessionModel();
	let state = model.hydratePreset("empty");
	assert.equal(model.selectContextStatus(state), "empty");
	state = model.agentSessionsReducer(state, {
		type: "add-context-resource",
		kind: "link",
		item: { id: "l1", key: "RFP-200", summary: "Related", type: "Task", relationship: "relates to" },
	});
	assert.equal(model.selectContextStatus(state), "filled");
	state = model.agentSessionsReducer(state, { type: "remove-context-resource", kind: "link", id: "l1" });
	assert.equal(model.selectContextStatus(state), "empty");
});

test("concurrent launch adds independent running sessions", async () => {
	const model = await loadSessionModel();
	let state = model.hydratePreset("empty");
	state = model.agentSessionsReducer(state, { type: "launch-session", agentId: "a1", agentName: "Agent One" });
	state = model.agentSessionsReducer(state, { type: "launch-session", agentId: "a2", agentName: "Agent Two" });
	assert.equal(state.sessions.length, 2);
	assert.equal(model.selectWorkingCount(state), 2);
	assert.notEqual(state.sessions[0].id, state.sessions[1].id);
});

test("deterministic running -> waiting -> running -> completed lifecycle + resume", async () => {
	const model = await loadSessionModel();
	let state = model.hydratePreset("empty");
	state = model.agentSessionsReducer(state, { type: "launch-session", agentId: "a1", agentName: "Agent One" });
	const sessionId = state.sessions[0].id;

	state = tickUntil(model, state, (s) => s.sessions[0].status === "waiting");
	assert.equal(state.sessions[0].status, "waiting");

	// A reply resumes the waiting agent (from chat or Activity — same path).
	state = model.agentSessionsReducer(state, { type: "reply-session", sessionId, text: "Flag them as gaps." });
	assert.equal(state.sessions[0].status, "running");
	assert.ok(state.sessions[0].messages.some((m) => m.role === "human" && m.content === "Flag them as gaps."));

	state = tickUntil(model, state, (s) => s.sessions[0].status === "completed");
	assert.equal(state.sessions[0].status, "completed");
	assert.equal(state.sessions[0].progress, 1);
});

test("Activity @-reply and chat reply share one session state", async () => {
	const model = await loadSessionModel();
	let state = model.hydratePreset("running");
	const waiting = state.sessions.find((s) => s.status === "waiting");
	state = model.agentSessionsReducer(state, { type: "reply-session", sessionId: waiting.id, text: "5,000 seats" });
	const resumed = state.sessions.find((s) => s.id === waiting.id);
	assert.equal(resumed.status, "running");
	assert.equal(state.activeSessionId, waiting.id);
});

test("session switching sets and clears the active session", async () => {
	const model = await loadSessionModel();
	let state = model.hydratePreset("running");
	assert.equal(model.selectActiveSession(state), null);
	const target = state.sessions[1];
	state = model.agentSessionsReducer(state, { type: "set-active-session", sessionId: target.id });
	assert.equal(model.selectActiveSession(state).id, target.id);
	state = model.agentSessionsReducer(state, { type: "set-active-session", sessionId: null });
	assert.equal(model.selectActiveSession(state), null);
});

test("empty work item launcher opens a general session; filled launcher reopens the latest", async () => {
	const model = await loadSessionModel();
	let empty = model.hydratePreset("empty");
	empty = model.agentSessionsReducer(empty, { type: "open-latest-or-general" });
	assert.equal(empty.sessions.length, 1);
	assert.equal(empty.activeSessionId, empty.sessions[0].id);

	let running = model.hydratePreset("running");
	running = model.agentSessionsReducer(running, { type: "open-latest-or-general" });
	assert.ok(running.activeSessionId);
	assert.equal(running.sessions.length, model.hydratePreset("running").sessions.length); // reopened, not created
});
