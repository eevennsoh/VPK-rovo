import type { VaultExplorer, VaultNode } from "./lib/personal-graph-types";

export function getSelectedNode(explorer: VaultExplorer | null, selectedNodeId: string | null) {
	if (!explorer || !selectedNodeId) return null;
	return explorer.nodes.find((node) => node.id === selectedNodeId) ?? null;
}

export function getRelatedNodes(explorer: VaultExplorer | null, node: VaultNode | null) {
	if (!explorer || !node) return [];
	const seenRelatedIds = new Set<string>();
	const relatedIds: string[] = [];
	for (const edge of explorer.edges) {
		const neighborId = edge.source === node.id
			? edge.target
			: edge.target === node.id
				? edge.source
				: null;
		if (neighborId === null || seenRelatedIds.has(neighborId)) continue;
		seenRelatedIds.add(neighborId);
		relatedIds.push(neighborId);
	}
	const nodesById = new Map(explorer.nodes.map((candidate) => [candidate.id, candidate]));
	return relatedIds
		.flatMap((nodeId) => {
			const relatedNode = nodesById.get(nodeId);
			return relatedNode ? [relatedNode] : [];
		})
		.slice(0, 3);
}

export function getGraphStatsText(explorer: VaultExplorer | null) {
	return explorer
		? `${explorer.stats.wikiCount} wiki pages · ${explorer.stats.rawCount} raw sources`
		: "Obsidian-backed second-brain graph";
}

export function isTwgAuthRequiredError(error: Error | null): boolean {
	return /twg_auth_required/iu.test(error?.message ?? "");
}

function formatRelativeTime(iso: string | null): string | null {
	if (!iso) return null;
	const then = new Date(iso).getTime();
	if (Number.isNaN(then)) return null;
	const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
	if (seconds < 60) return "just now";
	const minutes = Math.round(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.round(hours / 24);
	return `${days}d ago`;
}

export function getTwgGraphStatsText(explorer: VaultExplorer | null, generatedAt: string | null) {
	if (!explorer) return "Team Work Graph view";
	const byKind = new Map<string, number>();
	for (const node of explorer.nodes) {
		byKind.set(node.kind, (byKind.get(node.kind) ?? 0) + 1);
	}
	const counts = [
		byKind.get("source") ? `${byKind.get("source")} artifacts` : null,
		byKind.get("entity") ? `${byKind.get("entity")} people` : null,
	].filter(Boolean).join(" · ");
	const updated = formatRelativeTime(generatedAt);
	return [counts || `${explorer.stats.nodeCount} items`, updated && `updated ${updated}`]
		.filter(Boolean)
		.join(" · ");
}
