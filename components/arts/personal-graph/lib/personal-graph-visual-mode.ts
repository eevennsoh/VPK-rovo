import type { NeuralGraphParams } from "./neural-graph/params";
import type { VaultExplorer, VaultNode } from "./personal-graph-types";

export type PersonalGraphVisualMode = "default" | "automation-workflow-radial";

export function isAutomationWorkflowNode(node: VaultNode) {
	return node.frontmatter?.slice === "automation-workflows" || node.frontmatter?.type === "AutomationWorkflowRoot";
}

export function isAutomationWorkflowExplorer(explorer: VaultExplorer | null) {
	return Boolean(explorer?.nodes.some(isAutomationWorkflowNode));
}

export function getPersonalGraphVisualMode(chatExplorer: VaultExplorer | null): PersonalGraphVisualMode {
	return isAutomationWorkflowExplorer(chatExplorer) ? "automation-workflow-radial" : "default";
}

export function getPersonalGraphLabelStrategy(visualMode: PersonalGraphVisualMode) {
	return visualMode === "automation-workflow-radial" ? "workflowTree" : "default";
}

export function getPersonalGraphParamsForVisualMode(
	baseParams: NeuralGraphParams,
	visualMode: PersonalGraphVisualMode,
	explorer: VaultExplorer | null,
): NeuralGraphParams {
	if (visualMode !== "automation-workflow-radial") {
		return baseParams;
	}

	return {
		...baseParams,
		amplitude: Math.min(baseParams.amplitude, 0.035),
		colorConcept: "var(--ds-icon-accent-orange)",
		colorEntity: "var(--ds-icon-accent-lime)",
		colorRaw: "var(--ds-icon-accent-gray)",
		colorSource: "var(--ds-icon-accent-blue)",
		colorSynthesis: "var(--ds-icon-accent-purple)",
		edgeOpacity: Math.max(baseParams.edgeOpacity, 0.72),
		edgeOpacityActive: Math.max(baseParams.edgeOpacityActive, 0.9),
		edgeSelectedColor: "var(--ds-icon-accent-orange)",
		edgeWidth: Math.max(baseParams.edgeWidth, 3.6),
		glowIntensity: Math.min(baseParams.glowIntensity, 0.18),
		glowSize: Math.min(baseParams.glowSize, 3.2),
		labelSize: Math.max(baseParams.labelSize, 13),
		layoutShape: "radialCluster",
		maxVisibleNodes: Math.min(180, Math.max(baseParams.maxVisibleNodes, explorer?.nodes.length ?? 0)),
		nodeOpacity: Math.max(baseParams.nodeOpacity, 0.9),
		nodeOpacityFocused: Math.max(baseParams.nodeOpacityFocused, 0.2),
		nodeOpacityRelated: Math.max(baseParams.nodeOpacityRelated, 0.94),
		nodeSelectedColor: "var(--ds-icon-accent-orange)",
		nodeSize: Math.max(baseParams.nodeSize, 4),
		octaves: Math.min(baseParams.octaves, 1),
		originOffset: 0,
		originY: 0.5,
		rayColor: "var(--ds-icon-accent-gray)",
		rayOpacity: Math.max(baseParams.rayOpacity, 0.12),
		rayOriginY: 0.5,
		rayWidth: Math.max(baseParams.rayWidth, 4),
		radialArcAngle: 360,
		radialDepthCurve: 1,
		showLabels: true,
		showRays: false,
		showSignals: false,
		speed: Math.min(baseParams.speed, 0.2),
	};
}
