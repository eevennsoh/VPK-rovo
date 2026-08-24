import type { NeuralGraphLayout, NeuralLayoutNode } from "./layout";

export type NeuralGraphLabelStrategy = "default" | "workflowTree";

export function getAutomationWorkflowNodeType(node: NeuralLayoutNode) {
	return typeof node.node.original.frontmatter?.type === "string" ? node.node.original.frontmatter.type : null;
}

export function getRadialLeafNodeIds(layout: NeuralGraphLayout) {
	const branchSourceIds = new Set<string>();
	for (const branch of layout.treeBranches ?? []) {
		if (branch.sourceId) branchSourceIds.add(branch.sourceId);
	}
	return new Set(
		layout.nodes
			.filter((node) => !branchSourceIds.has(node.id))
			.map((node) => node.id),
	);
}

export function shouldLabelWorkflowTreeNode(node: NeuralLayoutNode) {
	const nodeType = getAutomationWorkflowNodeType(node);
	return (
		nodeType === "AutomationWorkflowRoot" ||
		nodeType === "AutomationWorkflowCandidate" ||
		nodeType === "AutomationDraftAction"
	);
}

export function getRadialLabelNodes(
	layout: NeuralGraphLayout,
	{
		activeNodeId,
		labelStrategy = "default",
		shouldDrawAllLabels,
	}: {
		activeNodeId?: string | null;
		labelStrategy?: NeuralGraphLabelStrategy;
		shouldDrawAllLabels: boolean;
	},
) {
	const leafNodeIds = getRadialLeafNodeIds(layout);
	if (labelStrategy !== "workflowTree") {
		return shouldDrawAllLabels
			? layout.nodes.filter((node) => leafNodeIds.has(node.id))
			: activeNodeId
				? layout.nodes.filter((node) => node.id === activeNodeId)
				: [];
	}

	const nodesById = new Map<string, NeuralLayoutNode>();
	for (const node of layout.nodes) {
		const nodeType = getAutomationWorkflowNodeType(node);
		if (
			shouldLabelWorkflowTreeNode(node) ||
			(shouldDrawAllLabels && nodeType === "AutomationWorkflowEvidence" && leafNodeIds.has(node.id)) ||
			node.id === activeNodeId
		) {
			nodesById.set(node.id, node);
		}
	}
	return layout.nodes.filter((node) => nodesById.has(node.id));
}
