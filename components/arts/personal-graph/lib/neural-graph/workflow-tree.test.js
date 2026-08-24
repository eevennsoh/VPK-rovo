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

const cameraModule = import("./camera.ts");
const layoutModule = import("./layout.ts");
const paramsModule = import("./params.ts");
const rendererModule = import("./renderer.ts");
const storeModule = import("./store.ts");
const workflowLabelStrategyModule = import("./workflow-label-strategy.ts");

function node(id, title, kind, connectionCount = 0, overrides = {}) {
	return {
		bodyPreview: `${title} preview`,
		connectionCount,
		dangling: false,
		frontmatter: {},
		id,
		kind,
		label: title,
		missing: false,
		path: null,
		relativePath: `${title}.md`,
		size: connectionCount,
		slug: title.toLowerCase(),
		title,
		updatedAt: null,
		...overrides,
	};
}

function edge(source, target, kind = "wiki_link") {
	return {
		id: `${source}-${target}`,
		kind,
		label: kind,
		metadata: {},
		relationKinds: [kind],
		source,
		target,
	};
}

function layoutNode(id, x) {
	return {
		alpha: 1,
		baseSize: 4,
		depthScale: 1,
		id,
		node: {
			degree: 1,
			dangling: false,
			id,
			kind: "concept",
			missing: false,
			original: { frontmatter: {} },
			title: id,
		},
		phase: 0,
		x,
		y: 0,
		z: 0,
	};
}

function layoutEdge(id, source, target) {
	return {
		edge: {
			id,
			index: 0,
			kind: "wiki_link",
			label: "link",
			original: {},
			source: source.id,
			target: target.id,
			weight: 1,
		},
		id,
		source,
		target,
	};
}

function createRecordingCanvasContext() {
	const calls = [];
	let fillStyle = "";
	let globalAlpha = 1;
	let lineWidth = 1;
	let shadowBlur = 0;
	let shadowColor = "";
	let strokeStyle = "";
	let textAlign = "start";
	let textBaseline = "alphabetic";
	const gradient = {
		addColorStop: (...args) => calls.push(["addColorStop", ...args]),
	};

	return {
		calls,
		get fillStyle() {
			return fillStyle;
		},
		set fillStyle(value) {
			fillStyle = value;
			calls.push(["fillStyle", value]);
		},
		get globalAlpha() {
			return globalAlpha;
		},
		set globalAlpha(value) {
			globalAlpha = value;
			calls.push(["globalAlpha", value]);
		},
		get lineWidth() {
			return lineWidth;
		},
		set lineWidth(value) {
			lineWidth = value;
			calls.push(["lineWidth", value]);
		},
		get shadowBlur() {
			return shadowBlur;
		},
		set shadowBlur(value) {
			shadowBlur = value;
			calls.push(["shadowBlur", value]);
		},
		get shadowColor() {
			return shadowColor;
		},
		set shadowColor(value) {
			shadowColor = value;
			calls.push(["shadowColor", value]);
		},
		get strokeStyle() {
			return strokeStyle;
		},
		set strokeStyle(value) {
			strokeStyle = value;
			calls.push(["strokeStyle", value]);
		},
		get textAlign() {
			return textAlign;
		},
		set textAlign(value) {
			textAlign = value;
			calls.push(["textAlign", value]);
		},
		get textBaseline() {
			return textBaseline;
		},
		set textBaseline(value) {
			textBaseline = value;
			calls.push(["textBaseline", value]);
		},
		arc: (...args) => calls.push(["arc", ...args]),
		beginPath: (...args) => calls.push(["beginPath", ...args]),
		bezierCurveTo: (...args) => calls.push(["bezierCurveTo", ...args]),
		closePath: (...args) => calls.push(["closePath", ...args]),
		clearRect: (...args) => calls.push(["clearRect", ...args]),
		createLinearGradient: (...args) => {
			calls.push(["createLinearGradient", ...args]);
			return gradient;
		},
		createRadialGradient: (...args) => {
			calls.push(["createRadialGradient", ...args]);
			return gradient;
		},
		fill: (...args) => calls.push(["fill", ...args]),
		fillRect: (...args) => calls.push(["fillRect", ...args]),
		fillText: (...args) => calls.push(["fillText", ...args]),
		lineTo: (...args) => calls.push(["lineTo", ...args]),
		moveTo: (...args) => calls.push(["moveTo", ...args]),
		quadraticCurveTo: (...args) => calls.push(["quadraticCurveTo", ...args]),
		rect: (...args) => calls.push(["rect", ...args]),
		restore: (...args) => calls.push(["restore", ...args]),
		rotate: (...args) => calls.push(["rotate", ...args]),
		save: (...args) => calls.push(["save", ...args]),
		stroke: (...args) => calls.push(["stroke", ...args]),
		translate: (...args) => calls.push(["translate", ...args]),
	};
}

test("computeNeuralGraphLayout anchors automation workflow roots ahead of higher-degree candidates", async () => {
	const { computeNeuralGraphLayout } = await layoutModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS, clampNeuralGraphParams } = await paramsModule;
	const { createNeuralGraphStore } = await storeModule;
	const automationExplorer = {
		edges: [
			edge("root", "workflow-a"),
			edge("root", "workflow-b"),
			edge("workflow-a", "action-a"),
			edge("workflow-a", "evidence-a"),
			edge("workflow-a", "evidence-b"),
			edge("workflow-b", "action-b"),
			edge("workflow-b", "evidence-a"),
		],
		generatedAt: "2026-06-30T00:00:00.000Z",
		nodes: [
			node("root", "Repeated manual workflows", "synthesis", 2, {
				frontmatter: { slice: "automation-workflows", type: "AutomationWorkflowRoot" },
			}),
			node("workflow-a", "Weekly recurring synthesis", "synthesis", 4, {
				frontmatter: { slice: "automation-workflows", type: "AutomationWorkflowCandidate" },
			}),
			node("workflow-b", "Loom shareback distribution", "synthesis", 3, {
				frontmatter: { slice: "automation-workflows", type: "AutomationWorkflowCandidate" },
			}),
			node("action-a", "Draft weekly synthesis", "concept", 1, {
				frontmatter: { slice: "automation-workflows", type: "AutomationDraftAction" },
			}),
			node("action-b", "Draft Loom shareback pack", "concept", 1, {
				frontmatter: { slice: "automation-workflows", type: "AutomationDraftAction" },
			}),
			node("evidence-a", "Rovo Chat Triad [Recurring]", "source", 2, {
				frontmatter: { slice: "automation-workflows", type: "AutomationWorkflowEvidence" },
			}),
			node("evidence-b", "Custom skills weekly", "source", 1, {
				frontmatter: { slice: "automation-workflows", type: "AutomationWorkflowEvidence" },
			}),
		],
		stats: { danglingCount: 0, edgeCount: 7, nodeCount: 7, rawCount: 0, wikiCount: 7 },
	};
	const params = clampNeuralGraphParams({
		...DEFAULT_NEURAL_GRAPH_PARAMS,
		amplitude: 0,
		layoutShape: "radialCluster",
		maxVisibleNodes: 20,
		radialArcAngle: 360,
		speed: 0,
		spread: 400,
	});
	const layout = computeNeuralGraphLayout({
		params,
		selectedNodeId: null,
		store: createNeuralGraphStore(automationExplorer),
		viewport: { height: 700, width: 1000 },
	});
	const originBranches = layout.treeBranches.filter((branch) => branch.sourceId === null);
	const workflowBranchTargets = layout.treeBranches
		.filter((branch) => branch.sourceId === "root")
		.map((branch) => branch.targetId)
		.sort();
	const root = layout.nodesById.get("root");

	assert.equal(originBranches.at(0)?.targetId, "root");
	assert.equal(root.x, 0);
	assert.equal(root.y, 0);
	assert.deepEqual(workflowBranchTargets, ["workflow-a", "workflow-b"]);
	assert.ok(Math.hypot(layout.nodesById.get("workflow-a").x, layout.nodesById.get("workflow-a").y) > 1);
});

test("drawNeuralGraph keeps radial tree branches visible when decorative rays are disabled", async () => {
	const { createNeuralCamera } = await cameraModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS } = await paramsModule;
	const { drawNeuralGraph } = await rendererModule;
	const viewport = { height: 300, width: 400 };
	const root = {
		...layoutNode("root", 0),
		node: {
			...layoutNode("root", 0).node,
			original: { frontmatter: { type: "AutomationWorkflowRoot" } },
		},
		y: 0,
	};
	const workflow = {
		...layoutNode("workflow", 140),
		node: {
			...layoutNode("workflow", 140).node,
			original: { frontmatter: { type: "AutomationWorkflowCandidate" } },
		},
		y: -80,
	};
	const evidence = {
		...layoutNode("evidence", 220),
		node: {
			...layoutNode("evidence", 220).node,
			original: { frontmatter: { type: "AutomationWorkflowEvidence" } },
		},
		y: -140,
	};
	const workflowEdge = layoutEdge("root-workflow", root, workflow);
	const evidenceEdge = layoutEdge("workflow-evidence", workflow, evidence);
	const layout = {
		edges: [workflowEdge, evidenceEdge],
		layoutShape: "radialCluster",
		nodes: [root, workflow, evidence],
		nodesById: new Map([
			[root.id, root],
			[workflow.id, workflow],
			[evidence.id, evidence],
		]),
		origin: { x: 0, y: 0 },
		treeBranches: [
			{ edge: null, id: "origin-root", source: null, sourceId: null, target: root, targetId: root.id },
			{ edge: workflowEdge.edge, id: workflowEdge.id, source: root, sourceId: root.id, target: workflow, targetId: workflow.id },
			{ edge: evidenceEdge.edge, id: evidenceEdge.id, source: workflow, sourceId: workflow.id, target: evidence, targetId: evidence.id },
		],
		viewport,
	};
	const ctx = createRecordingCanvasContext();

	drawNeuralGraph(ctx, layout, {
		background: "transparent",
		camera: createNeuralCamera(),
		focusProgress: 0,
		hoveredNodeId: null,
		labelStrategy: "workflowTree",
		params: {
			...DEFAULT_NEURAL_GRAPH_PARAMS,
			colorSource: "#0055CC",
			colorSynthesis: "#5E4DB2",
			layoutShape: "radialCluster",
			showLabels: false,
			showRays: false,
			showSignals: false,
		},
		selectedNodeId: null,
		theme: "light",
		viewport,
	});

	const radialBranchIndexes = ctx.calls.flatMap(([name], index) => name === "bezierCurveTo" ? [index] : []);
	const branchStrokeStyles = ctx.calls
		.filter(([name]) => name === "strokeStyle")
		.map(([, value]) => value);

	assert.equal(radialBranchIndexes.length, 3);
	assert.ok(branchStrokeStyles.includes("#5E4DB2"));
	assert.ok(branchStrokeStyles.includes("#0055CC"));
});

test("getRadialLabelNodes keeps workflow tree labels visible without labeling every evidence leaf on mobile", async () => {
	const { getRadialLabelNodes } = await workflowLabelStrategyModule;
	const workflowNode = (id, title, type, x) => {
		const base = layoutNode(id, x);
		return {
			...base,
			node: {
				...base.node,
				original: { frontmatter: { type } },
				title,
			},
		};
	};
	const root = workflowNode("root", "Repeated manual workflows", "AutomationWorkflowRoot", 0);
	const workflow = workflowNode("workflow", "Weekly recurring synthesis", "AutomationWorkflowCandidate", 160);
	const action = workflowNode("action", "Draft weekly synthesis", "AutomationDraftAction", 260);
	const evidence = workflowNode("evidence", "Rovo Chat Triad [Recurring]", "AutomationWorkflowEvidence", 300);
	const workflowEdge = layoutEdge("root-workflow", root, workflow);
	const actionEdge = layoutEdge("workflow-action", workflow, action);
	const evidenceEdge = layoutEdge("workflow-evidence", workflow, evidence);
	const layout = {
		edges: [workflowEdge, actionEdge, evidenceEdge],
		layoutShape: "radialCluster",
		nodes: [root, workflow, action, evidence],
		nodesById: new Map([
			[root.id, root],
			[workflow.id, workflow],
			[action.id, action],
			[evidence.id, evidence],
		]),
		origin: { x: 0, y: 0 },
		treeBranches: [
			{ edge: null, id: "origin-root", source: null, sourceId: null, target: root, targetId: root.id },
			{ edge: workflowEdge.edge, id: workflowEdge.id, source: root, sourceId: root.id, target: workflow, targetId: workflow.id },
			{ edge: actionEdge.edge, id: actionEdge.id, source: workflow, sourceId: workflow.id, target: action, targetId: action.id },
			{ edge: evidenceEdge.edge, id: evidenceEdge.id, source: workflow, sourceId: workflow.id, target: evidence, targetId: evidence.id },
		],
		viewport: { height: 720, width: 960 },
	};

	assert.deepEqual(
		getRadialLabelNodes(layout, {
			labelStrategy: "workflowTree",
			shouldDrawAllLabels: false,
		}).map((layoutNode) => layoutNode.id),
		["root", "workflow", "action"],
	);
	assert.deepEqual(
		getRadialLabelNodes(layout, {
			labelStrategy: "workflowTree",
			shouldDrawAllLabels: true,
		}).map((layoutNode) => layoutNode.id),
		["root", "workflow", "action", "evidence"],
	);
	assert.deepEqual(
		getRadialLabelNodes(layout, {
			activeNodeId: "action",
			labelStrategy: "default",
			shouldDrawAllLabels: false,
		}).map((layoutNode) => layoutNode.id),
		["action"],
	);
	assert.deepEqual(
		getRadialLabelNodes(layout, {
			labelStrategy: "default",
			shouldDrawAllLabels: true,
		}).map((layoutNode) => layoutNode.id),
		["action", "evidence"],
	);
});
