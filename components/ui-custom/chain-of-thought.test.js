const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const ROOT = join(__dirname, "..", "..");

function readProjectFile(...segments) {
	return readFileSync(join(ROOT, ...segments), "utf8");
}

const COMPONENT_SOURCE = readProjectFile("components/ui-custom/chain-of-thought.tsx");
const DEMO_SOURCE = readProjectFile("components/website/demos/ui-custom/chain-of-thought-demo.tsx");
const DETAILS_SOURCE = readProjectFile("app/data/details/ui-custom.ts");
const REGISTRY_SOURCE = readProjectFile("components/website/registry.ts");

test("ChainOfThoughtScenario composes the primitive chain-of-thought parts", () => {
	assert.match(COMPONENT_SOURCE, /export interface ChainOfThoughtScenarioStep/u);
	assert.match(COMPONENT_SOURCE, /export interface ChainOfThoughtScenarioProps/u);
	assert.match(COMPONENT_SOURCE, /export const ChainOfThoughtScenario = memo/u);
	assert.match(COMPONENT_SOURCE, /<ChainOfThought[\s\S]*defaultOpen=\{state === "thinking"\}/u);
	assert.match(COMPONENT_SOURCE, /<ChainOfThoughtHeader[\s\S]*showChevron=\{state !== "preload" && steps\.length > 0\}[\s\S]*state=\{state\}/u);
	assert.match(COMPONENT_SOURCE, /<ChainOfThoughtContent[\s\S]*className=\{contentClassName\}/u);
	assert.match(COMPONENT_SOURCE, /<ChainOfThoughtStep[\s\S]*status=\{step\.status\}/u);
	assert.match(COMPONENT_SOURCE, /ChainOfThoughtScenario\.displayName = "ChainOfThoughtScenario"/u);
});

test("Chain of Thought docs include Studio-quality AI usage recipes", () => {
	for (const demoSlug of [
		"chain-of-thought-demo-studio-agent-generation-flow",
		"chain-of-thought-demo-automation-trigger-flow",
		"chain-of-thought-demo-research-retrieval-flow",
		"chain-of-thought-demo-tool-call-details-flow",
	]) {
		assert.match(DETAILS_SOURCE, new RegExp(demoSlug, "u"));
		assert.match(REGISTRY_SOURCE, new RegExp(`"${demoSlug}"`, "u"));
	}

	assert.match(DETAILS_SOURCE, /ChainOfThoughtScenario/u);
	assert.match(DETAILS_SOURCE, /AI usage guidance:/u);
	assert.match(DETAILS_SOURCE, /Never use placeholder labels/u);
	assert.match(DEMO_SOURCE, /export function ChainOfThoughtDemoStudioAgentGenerationFlow/u);
	assert.match(DEMO_SOURCE, /export function ChainOfThoughtDemoAutomationTriggerFlow/u);
	assert.match(DEMO_SOURCE, /export function ChainOfThoughtDemoResearchRetrievalFlow/u);
	assert.match(DEMO_SOURCE, /export function ChainOfThoughtDemoToolCallDetailsFlow/u);
});

test("Chain of Thought docs demos center their preview content", () => {
	assert.match(DEMO_SOURCE, /function ChainOfThoughtDemoFrame/u);
	assert.match(DEMO_SOURCE, /data-chain-of-thought-demo-frame="true"/u);
	assert.match(DEMO_SOURCE, /className="flex min-h-\[400px\] w-full items-center justify-center/u);

	const frameUsageCount = DEMO_SOURCE.match(/<ChainOfThoughtDemoFrame>/gu)?.length ?? 0;
	assert.equal(frameUsageCount, 11);
});

test("Chain of Thought tool icon table does not add a second outer preview border", () => {
	assert.match(DEMO_SOURCE, /<div className="w-full max-w-4xl overflow-hidden rounded-md bg-background">/u);
	assert.doesNotMatch(DEMO_SOURCE, /<div className="w-full max-w-4xl rounded-xl border border-border bg-background">/u);
});
