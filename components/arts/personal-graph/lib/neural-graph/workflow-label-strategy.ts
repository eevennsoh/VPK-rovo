import type { NeuralGraphLayout, NeuralLayoutNode } from "./layout";

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
