const assert = require("node:assert/strict");
const { registerHooks } = require("node:module");
const test = require("node:test");

registerHooks({
	resolve(specifier, context, nextResolve) {
		if (specifier.startsWith("./") && !specifier.endsWith(".ts")) {
			try {
				return nextResolve(`${specifier}.ts`, context);
			} catch {
				return nextResolve(specifier, context);
			}
		}
		return nextResolve(specifier, context);
	},
});

const visualModeModule = import("./personal-graph-visual-mode.ts");
const paramsModule = import("./neural-graph/params.ts");

function vaultNode(id, frontmatter = {}) {
	return {
		bodyPreview: "",
		connectionCount: 1,
		dangling: false,
		externalUrl: null,
		frontmatter,
		id,
		kind: "synthesis",
		label: id,
		missing: false,
		path: null,
		provider: "twg",
		relativePath: id,
		size: 1,
		slug: id,
		title: id,
		updatedAt: null,
	};
}

function explorer(nodes) {
	return {
		edges: [],
		generatedAt: "2026-06-30T00:00:00.000Z",
		nodes,
		stats: {
			danglingCount: 0,
			edgeCount: 0,
			nodeCount: nodes.length,
			rawCount: 0,
			wikiCount: nodes.length,
		},
	};
}

test("getPersonalGraphVisualMode only enables radial mode for automation chat explorers", async () => {
	const {
		getPersonalGraphLabelStrategy,
		getPersonalGraphVisualMode,
		isAutomationWorkflowExplorer,
	} = await visualModeModule;

	assert.equal(getPersonalGraphVisualMode(null), "default");
	assert.equal(getPersonalGraphVisualMode(explorer([vaultNode("context", { slice: "context-user" })])), "default");

	const automationExplorer = explorer([
		vaultNode("root", { slice: "automation-workflows", type: "AutomationWorkflowRoot" }),
	]);
	assert.equal(isAutomationWorkflowExplorer(automationExplorer), true);
	assert.equal(getPersonalGraphVisualMode(automationExplorer), "automation-workflow-radial");
	assert.equal(getPersonalGraphLabelStrategy("automation-workflow-radial"), "workflowTree");
	assert.equal(getPersonalGraphLabelStrategy("default"), "default");
});

test("getPersonalGraphParamsForVisualMode applies the automation radial preset", async () => {
	const { getPersonalGraphParamsForVisualMode } = await visualModeModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS } = await paramsModule;
	const automationExplorer = explorer(
		Array.from({ length: 120 }, (_, index) =>
			vaultNode(`node-${index}`, index === 0 ? { type: "AutomationWorkflowRoot" } : { slice: "automation-workflows" }),
		),
	);

	const defaultParams = getPersonalGraphParamsForVisualMode(DEFAULT_NEURAL_GRAPH_PARAMS, "default", automationExplorer);
	assert.equal(defaultParams, DEFAULT_NEURAL_GRAPH_PARAMS);

	const automationParams = getPersonalGraphParamsForVisualMode(
		DEFAULT_NEURAL_GRAPH_PARAMS,
		"automation-workflow-radial",
		automationExplorer,
	);
	assert.equal(automationParams.layoutShape, "radialCluster");
	assert.equal(automationParams.showRays, false);
	assert.equal(automationParams.showSignals, false);
	assert.equal(automationParams.showLabels, true);
	assert.equal(automationParams.radialArcAngle, 360);
	assert.equal(automationParams.radialDepthCurve, 1);
	assert.equal(automationParams.originY, 0.5);
	assert.equal(automationParams.rayOriginY, 0.5);
	assert.equal(automationParams.nodeSize, 4);
	assert.equal(automationParams.edgeOpacity, 0.72);
	assert.equal(automationParams.edgeOpacityActive, 0.9);
	assert.equal(automationParams.edgeWidth, 3.6);
	assert.equal(automationParams.rayOpacity, 0.12);
	assert.equal(automationParams.rayWidth, 4);
	assert.equal(automationParams.maxVisibleNodes, 120);
	assert.equal(automationParams.colorSynthesis, "var(--ds-icon-accent-purple)");
	assert.equal(automationParams.colorSource, "var(--ds-icon-accent-blue)");
	assert.equal(automationParams.colorConcept, "var(--ds-icon-accent-orange)");
	assert.equal(automationParams.colorRaw, "var(--ds-icon-accent-gray)");
});
