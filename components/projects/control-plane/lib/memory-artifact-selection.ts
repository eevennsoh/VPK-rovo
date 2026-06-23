import type { WikiMemoryExplorerNode } from "@/lib/rovo-runtime-types";

export type MemoryArtifactKind = "brief" | "deck";

interface MemoryArtifactSelectionInput {
	kind: MemoryArtifactKind;
	selectedNode: Pick<WikiMemoryExplorerNode, "id" | "title"> | null;
	selectedNodeId: string | null;
}

interface MemoryArtifactSelection {
	selectedNodeIds: string[];
	title: string;
}

const FULL_VIEW_TITLES: Record<MemoryArtifactKind, string> = {
	brief: "Memory Explorer Brief",
	deck: "Memory Explorer Deck",
};

export function resolveExplicitMemoryArtifactNode<T extends { id: string }>(
	nodes: ReadonlyArray<T> | null | undefined,
	selectedNodeId: string | null,
): T | null {
	if (selectedNodeId === null) {
		return null;
	}

	return nodes?.find((node) => node.id === selectedNodeId) ?? null;
}

export function buildMemoryArtifactSelection({
	kind,
	selectedNode,
	selectedNodeId,
}: MemoryArtifactSelectionInput): MemoryArtifactSelection {
	const explicitSelectedNode =
		selectedNodeId !== null && selectedNode?.id === selectedNodeId
			? selectedNode
			: null;

	if (!explicitSelectedNode) {
		return {
			selectedNodeIds: [],
			title: FULL_VIEW_TITLES[kind],
		};
	}

	return {
		selectedNodeIds: [explicitSelectedNode.id],
		title: `${explicitSelectedNode.title} ${kind}`,
	};
}
