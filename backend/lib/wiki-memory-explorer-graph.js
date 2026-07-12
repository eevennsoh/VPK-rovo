"use strict";

const path = require("node:path");

const EDGE_KIND_PRIORITY = Object.freeze({
	proposal_to_canonical: 0,
	canonical_to_compiled: 1,
	wiki_link: 2,
	same_thread: 3,
	shared_tag: 4,
	inferred_topic: 5,
	same_scope: 6,
});
const RELATION_HUB_KIND_PRIORITY = Object.freeze({
	"canonical-memory": 0,
	"compiled-context": 1,
	"raw-proposal": 2,
	"linked-knowledge": 3,
});

function ensureArray(value) {
	return Array.isArray(value) ? value : [];
}

function getNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: null;
}

function slugify(value) {
	const normalized = typeof value === "string"
		? value.replace(/\r\n?/gu, "\n").trim()
		: "";
	const slug = normalized
		.toLowerCase()
		.replace(/[`*_~[\]{}()<>]+/gu, " ")
		.replace(/[^a-z0-9]+/gu, "-")
		.replace(/^-+|-+$/gu, "");
	return slug || "untitled";
}

function normalizeKey(value) {
	return slugify(value).replace(/-/gu, "");
}

function buildNodeAliases(node) {
	const aliases = new Set();
	const title = getNonEmptyString(node.title);
	if (title) {
		aliases.add(normalizeKey(title));
	}

	if (node.relativePath) {
		const withoutExtension = node.relativePath.replace(/\.md$/u, "");
		aliases.add(normalizeKey(withoutExtension));
		aliases.add(normalizeKey(path.basename(withoutExtension)));
	}

	if (node.kind === "canonical-memory") {
		aliases.add(node.scope === "profile" ? "self" : "workcontext");
		aliases.add(node.scope === "profile" ? "profile" : "work");
	}

	return Array.from(aliases).filter(Boolean);
}

function createEdgeStore(nodes) {
	const edgeMap = new Map();
	const nodeConnectionCount = new Map(nodes.map((node) => [node.id, 0]));

	function addEdge(source, target, kind, metadata = {}) {
		if (!source || !target || source === target) {
			return;
		}

		const isSymmetric =
			kind === "shared_tag"
			|| kind === "same_thread"
			|| kind === "inferred_topic"
			|| kind === "same_scope";
		const [resolvedSource, resolvedTarget] = isSymmetric && source > target
			? [target, source]
			: [source, target];
		const key = `${resolvedSource}::${resolvedTarget}`;
		const existing = edgeMap.get(key);

		if (!existing) {
			edgeMap.set(key, {
				id: `edge:${key}`,
				kind,
				label: kind.replace(/_/gu, " "),
				metadata: {
					...metadata,
				},
				relationKinds: [kind],
				source: resolvedSource,
				target: resolvedTarget,
			});
			nodeConnectionCount.set(resolvedSource, (nodeConnectionCount.get(resolvedSource) ?? 0) + 1);
			nodeConnectionCount.set(resolvedTarget, (nodeConnectionCount.get(resolvedTarget) ?? 0) + 1);
			return;
		}

		if (!existing.relationKinds.includes(kind)) {
			existing.relationKinds.push(kind);
		}
		existing.metadata = {
			...existing.metadata,
			...metadata,
		};

		const currentPriority = EDGE_KIND_PRIORITY[existing.kind] ?? Number.MAX_SAFE_INTEGER;
		const nextPriority = EDGE_KIND_PRIORITY[kind] ?? Number.MAX_SAFE_INTEGER;
		if (nextPriority < currentPriority) {
			existing.kind = kind;
			existing.label = kind.replace(/_/gu, " ");
		}
	}

	return {
		addEdge,
		getEdges() {
			return Array.from(edgeMap.values());
		},
		getNodeConnectionCounts() {
			return nodeConnectionCount;
		},
	};
}

function sortNodeIdsForRelationHub(nodeIds, nodeById) {
	return Array.from(new Set(nodeIds))
		.filter((nodeId) => nodeById.has(nodeId))
		.sort((leftId, rightId) => {
			const left = nodeById.get(leftId);
			const right = nodeById.get(rightId);
			const leftPriority = RELATION_HUB_KIND_PRIORITY[left?.kind] ?? Number.MAX_SAFE_INTEGER;
			const rightPriority = RELATION_HUB_KIND_PRIORITY[right?.kind] ?? Number.MAX_SAFE_INTEGER;
			if (leftPriority !== rightPriority) {
				return leftPriority - rightPriority;
			}

			const leftUpdated = left?.updatedAt ?? left?.createdAt ?? "";
			const rightUpdated = right?.updatedAt ?? right?.createdAt ?? "";
			return rightUpdated.localeCompare(leftUpdated)
				|| (left?.title ?? "").localeCompare(right?.title ?? "")
				|| leftId.localeCompare(rightId);
		});
}

function addHubRelationshipEdges({ edgeStore, groups, kind, metadataKey, nodeById }) {
	for (const [metadataValue, nodeIds] of groups.entries()) {
		const sortedNodeIds = sortNodeIdsForRelationHub(nodeIds, nodeById);
		if (sortedNodeIds.length < 2) {
			continue;
		}

		const hubNodeId = sortedNodeIds[0];
		for (const nodeId of sortedNodeIds.slice(1)) {
			edgeStore.addEdge(hubNodeId, nodeId, kind, {
				[metadataKey]: metadataValue,
				hubNodeId,
			});
		}
	}
}

function addNodeToGroup(groups, groupKey, nodeId) {
	const nodeIds = groups.get(groupKey) ?? [];
	nodeIds.push(nodeId);
	groups.set(groupKey, nodeIds);
}

function buildExplorerGraph(nodes) {
	const edgeStore = createEdgeStore(nodes);
	const nodeById = new Map(nodes.map((node) => [node.id, node]));
	const aliasToNodeId = new Map();

	for (const node of nodes) {
		for (const alias of buildNodeAliases(node)) {
			if (!aliasToNodeId.has(alias)) {
				aliasToNodeId.set(alias, node.id);
			}
		}
	}

	for (const node of nodes) {
		if (node.kind === "raw-proposal" && node.scope) {
			edgeStore.addEdge(node.id, `canonical:${node.scope}`, "proposal_to_canonical", {
				scope: node.scope,
			});
		}

		if (node.kind === "compiled-context" && node.scope) {
			edgeStore.addEdge(`canonical:${node.scope}`, node.id, "canonical_to_compiled", {
				scope: node.scope,
			});
		}

		for (const rawLink of ensureArray(node.wikiLinks)) {
			const linkedNodeId = aliasToNodeId.get(normalizeKey(rawLink));
			if (linkedNodeId && linkedNodeId !== node.id) {
				edgeStore.addEdge(node.id, linkedNodeId, "wiki_link", {
					link: rawLink,
				});
			}
		}
	}

	const nodesByThread = new Map();
	const nodesByTag = new Map();
	const nodesByScope = new Map();
	const nodesByTopic = new Map();

	for (const node of nodes) {
		if (node.sourceThreadId) {
			addNodeToGroup(nodesByThread, node.sourceThreadId, node.id);
		}

		for (const tag of ensureArray(node.tags)) {
			addNodeToGroup(nodesByTag, tag, node.id);
		}

		if (node.scope) {
			addNodeToGroup(nodesByScope, node.scope, node.id);
		}

		for (const topic of ensureArray(node.topics)) {
			addNodeToGroup(nodesByTopic, topic, node.id);
		}
	}

	for (const [threadId, nodeIds] of nodesByThread.entries()) {
		for (let index = 0; index < nodeIds.length; index += 1) {
			for (let offset = index + 1; offset < nodeIds.length; offset += 1) {
				edgeStore.addEdge(nodeIds[index], nodeIds[offset], "same_thread", {
					threadId,
				});
			}
		}
	}

	addHubRelationshipEdges({
		edgeStore,
		groups: nodesByTag,
		kind: "shared_tag",
		metadataKey: "tag",
		nodeById,
	});

	for (const [scope, nodeIds] of nodesByScope.entries()) {
		const scopeNodes = nodeIds.map((nodeId) => nodeById.get(nodeId)).filter(Boolean);
		const canonicalNode = scopeNodes.find((node) => node.kind === "canonical-memory");
		if (!canonicalNode) {
			continue;
		}

		for (const node of scopeNodes) {
			if (
				node.id !== canonicalNode.id
				&& node.kind === "linked-knowledge"
			) {
				edgeStore.addEdge(canonicalNode.id, node.id, "same_scope", {
					scope,
				});
			}
		}
	}

	addHubRelationshipEdges({
		edgeStore,
		groups: nodesByTopic,
		kind: "inferred_topic",
		metadataKey: "topic",
		nodeById,
	});

	const edges = edgeStore.getEdges();
	const connectionCounts = edgeStore.getNodeConnectionCounts();
	const hydratedNodes = nodes.map((node) => ({
		...node,
		connectionCount: connectionCounts.get(node.id) ?? 0,
	}));

	return {
		edges,
		nodes: hydratedNodes,
	};
}

module.exports = {
	buildExplorerGraph,
};
