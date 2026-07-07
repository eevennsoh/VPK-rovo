"use strict";

const DEFAULT_AUTOMATION_WORKFLOW_SINCE = "30d";

function getNonEmptyString(value) {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed ? trimmed : null;
}

function normalizeSinceWindow(value, fallback = "7d") {
	if (typeof value !== "string") return fallback;
	const trimmed = value.trim().toLowerCase();
	return /^\d{1,3}[dwm]$/u.test(trimmed) ? trimmed : fallback;
}

function formatRelationshipLabel(relationshipName) {
	return String(relationshipName ?? "related")
		.replace(/^atlassian_user_/u, "")
		.replace(/^atlassian_/u, "")
		.replace(/_/gu, " ");
}

function buildAutomationEdge(sourceId, targetId, edgeKind, relationshipName) {
	return {
		id: `${edgeKind}:${sourceId}->${targetId}`,
		kind: edgeKind,
		label: formatRelationshipLabel(relationshipName),
		metadata: { relationship: relationshipName, relationships: [relationshipName] },
		relationKinds: [edgeKind],
		source: sourceId,
		target: targetId,
	};
}

function mergeEdgeMetadata(existing, next) {
	const relationships = new Set([
		...(Array.isArray(existing.metadata?.relationships) ? existing.metadata.relationships : []),
		existing.metadata?.relationship,
		...(Array.isArray(next.metadata?.relationships) ? next.metadata.relationships : []),
		next.metadata?.relationship,
	].filter((value) => typeof value === "string" && value.trim()));
	return {
		...existing,
		label: existing.label || next.label,
		metadata: {
			...existing.metadata,
			...next.metadata,
			relationship: existing.metadata?.relationship ?? next.metadata?.relationship,
			relationships: [...relationships],
		},
		relationKinds: [...new Set([...existing.relationKinds, ...next.relationKinds])],
	};
}

function finalizeAutomationExplorer(nodesById, edgeEntries, generatedAt = new Date().toISOString()) {
	const edgesById = new Map();
	for (const edge of edgeEntries) {
		if (!edge || typeof edge.id !== "string") continue;
		const existing = edgesById.get(edge.id);
		edgesById.set(edge.id, existing ? mergeEdgeMetadata(existing, edge) : edge);
	}

	const nodes = [...nodesById.values()].map((node) => ({ ...node, connectionCount: 0 }));
	const finalizedNodesById = new Map(nodes.map((node) => [node.id, node]));
	const edges = [...edgesById.values()].filter((edge) => (
		finalizedNodesById.has(edge.source) && finalizedNodesById.has(edge.target)
	));
	for (const edge of edges) {
		const sourceNode = finalizedNodesById.get(edge.source);
		const targetNode = finalizedNodesById.get(edge.target);
		if (sourceNode) sourceNode.connectionCount += 1;
		if (targetNode) targetNode.connectionCount += 1;
	}

	return {
		edges,
		generatedAt,
		nodes,
		stats: {
			danglingCount: nodes.filter((node) => node.dangling).length,
			edgeCount: edges.length,
			nodeCount: nodes.length,
			rawCount: nodes.filter((node) => node.kind === "raw").length,
			wikiCount: nodes.filter((node) => node.kind !== "entity" && node.kind !== "raw").length,
		},
	};
}

function createSyntheticNode({
	bodyPreview = "",
	externalUrl = null,
	frontmatter = {},
	id,
	kind,
	title,
}) {
	return {
		bodyPreview,
		connectionCount: 0,
		dangling: false,
		externalUrl,
		frontmatter,
		id,
		kind,
		label: title,
		missing: false,
		path: null,
		provider: "twg",
		relativePath: id,
		size: 1,
		slug: encodeURIComponent(id),
		title,
		updatedAt: null,
	};
}

function requireTwgRuntime(runTwg, parseJsonOrThrow) {
	if (typeof runTwg !== "function" || typeof parseJsonOrThrow !== "function") {
		throw new Error("Automation workflow TWG runtime is not configured.");
	}
}

async function fetchAutomationContextUser({
	parseJsonOrThrow,
	runTwg,
	signal,
	since = DEFAULT_AUTOMATION_WORKFLOW_SINCE,
	spawnImpl,
} = {}) {
	requireTwgRuntime(runTwg, parseJsonOrThrow);
	const args = ["context", "user", "me", "--output", "json", "--since", since, "--detail", "summary"];
	const stdout = await runTwg(args, { signal, spawnImpl });
	return parseJsonOrThrow(stdout, args);
}

async function fetchAutomationWorkQuery({
	parseJsonOrThrow,
	runTwg,
	signal,
	since = DEFAULT_AUTOMATION_WORKFLOW_SINCE,
	spawnImpl,
} = {}) {
	requireTwgRuntime(runTwg, parseJsonOrThrow);
	const args = [
		"work",
		"query",
		"--since",
		since,
		"--include-viewed",
		"--hydrate",
		"summary",
		"--output",
		"json",
	];
	const stdout = await runTwg(args, { signal, spawnImpl });
	return parseJsonOrThrow(stdout, args);
}

function getWorkItemTitle(item) {
	return (
		getNonEmptyString(item?.title) ??
		getNonEmptyString(item?.name) ??
		getNonEmptyString(item?.summary) ??
		getNonEmptyString(item?.message) ??
		getNonEmptyString(item?.content) ??
		getNonEmptyString(item?.displayName)
	);
}

function getWorkItemUrl(item) {
	return (
		getNonEmptyString(item?.url) ??
		getNonEmptyString(item?.webUrl) ??
		getNonEmptyString(item?.externalUrl)
	);
}

function getWorkItemId(item, fallbackPrefix, fallbackIndex) {
	return (
		getNonEmptyString(item?.id) ??
		getNonEmptyString(item?.ari) ??
		getNonEmptyString(item?.key) ??
		getNonEmptyString(item?.hash) ??
		`personal-graph:automation:evidence:${fallbackPrefix}:${fallbackIndex}`
	);
}

function toEvidenceItem(item, { fallbackPrefix, index, source }) {
	if (!item || typeof item !== "object") return null;
	const title = getWorkItemTitle(item);
	if (!title) return null;
	return {
		id: getWorkItemId(item, fallbackPrefix, index),
		source,
		title,
		url: getWorkItemUrl(item),
	};
}

function collectWorkEvidence(workPayload) {
	const data = workPayload?.data && typeof workPayload.data === "object" ? workPayload.data : {};
	const buckets = {
		comments: Array.isArray(data.comments) ? data.comments : [],
		devActivity: Array.isArray(data.devActivity) ? data.devActivity : [],
		pages: Array.isArray(data.pages) ? data.pages : [],
		projects: Array.isArray(data.projects) ? data.projects : [],
		videos: Array.isArray(data.videos) ? data.videos : [],
	};
	const evidence = [];
	for (const [source, items] of Object.entries(buckets)) {
		items.forEach((item, index) => {
			const evidenceItem = toEvidenceItem(item, { fallbackPrefix: source, index, source });
			if (evidenceItem) evidence.push(evidenceItem);
		});
	}
	return evidence;
}

function collectContextEvidence(contextPayload) {
	const relationships = Array.isArray(contextPayload?.data?.relationshipSummary)
		? contextPayload.data.relationshipSummary
		: [];
	const evidence = [];
	for (const relationship of relationships) {
		const relationshipName = getNonEmptyString(relationship?.relationshipName);
		const targets = Array.isArray(relationship?.targets) ? relationship.targets : [];
		targets.forEach((target, index) => {
			const evidenceItem = toEvidenceItem(target, {
				fallbackPrefix: relationshipName ?? "context",
				index,
				source: relationshipName ?? "context",
			});
			if (evidenceItem) evidence.push(evidenceItem);
		});
	}
	return evidence;
}

function dedupeEvidence(items) {
	const seen = new Set();
	const deduped = [];
	for (const item of items) {
		const key = item.id || `${item.title}:${item.url ?? ""}`;
		if (seen.has(key)) continue;
		seen.add(key);
		deduped.push(item);
	}
	return deduped;
}

function evidenceMatches(item, patterns) {
	const haystack = `${item.title} ${item.source ?? ""}`.toLowerCase();
	return patterns.some((pattern) => pattern.test(haystack));
}

function selectEvidence(evidence, patterns, limit = 3) {
	return evidence.filter((item) => evidenceMatches(item, patterns)).slice(0, limit);
}

function createAutomationWorkflowDefinitions(evidence) {
	return [
		{
			actionTitle: "Draft Loom shareback pack",
			bodyPreview: "Repeated design Looms and prototype links suggest a workflow for drafting channel posts, stakeholder FYIs, and follow-up trackers.",
			confidence: "high",
			evidence: selectEvidence(evidence, [
				/\bloom\b/u,
				/\bagent builder\b/u,
				/\bcustom skills?\b/u,
				/\bstitch\b/u,
				/\bprototype\b/u,
			]),
			id: "loom-shareback-distribution",
			title: "Loom shareback distribution",
		},
		{
			actionTitle: "Draft weekly synthesis",
			bodyPreview: "Recurring triads, shiprooms, syncs, and design crits suggest a workflow for weekly updates, decisions, risks, and next-focus summaries.",
			confidence: "high",
			evidence: selectEvidence(evidence, [
				/\bweekly\b/u,
				/\brecurring\b/u,
				/\btriad\b/u,
				/\bshiproom\b/u,
				/\bsync\b/u,
				/\bdesign crit\b/u,
			]),
			id: "weekly-recurring-synthesis",
			title: "Weekly recurring synthesis",
		},
		{
			actionTitle: "Draft feedback themes",
			bodyPreview: "Agent builder feedback, roadmap, and design-plan artifacts suggest a workflow for clustering feedback into themes and follow-up recommendations.",
			confidence: "medium",
			evidence: selectEvidence(evidence, [
				/\bagent builder\b/u,
				/\bagent creation\b/u,
				/\bagents creation\b/u,
				/\bfeedback\b/u,
				/\bthemes?\b/u,
				/\broadmap\b/u,
				/\bdesign plan\b/u,
			]),
			id: "agent-builder-feedback-themes",
			title: "Agent builder feedback synthesis",
		},
		{
			actionTitle: "Draft change-review summary",
			bodyPreview: "Dense authored change activity suggests a lower-confidence workflow for summarizing review themes, CI fixes, and follow-up cleanup.",
			confidence: "low",
			evidence: selectEvidence(evidence, [
				/\bcommit\b/u,
				/\breview\b/u,
				/\bci\b/u,
				/\bfix\b/u,
				/\baddress\b/u,
				/\bconsolidate\b/u,
				/\bmove\b/u,
				/\broute\b/u,
			]),
			id: "dev-change-review-summary",
			title: "Dev change-review summarization",
		},
	];
}

function buildAutomationWorkflowExplorer({
	contextPayload,
	generatedAt = new Date().toISOString(),
	since = DEFAULT_AUTOMATION_WORKFLOW_SINCE,
	workPayload,
} = {}) {
	const evidence = dedupeEvidence([
		...collectWorkEvidence(workPayload),
		...collectContextEvidence(contextPayload),
	]);
	const workflowDefinitions = createAutomationWorkflowDefinitions(evidence);
	const rootNode = createSyntheticNode({
		bodyPreview: `Curated from Team Work Graph activity over the last ${since}.`,
		frontmatter: { slice: "automation-workflows", since, type: "AutomationWorkflowRoot" },
		id: "personal-graph:automation:root",
		kind: "synthesis",
		title: "Repeated manual workflows",
	});
	const nodesById = new Map([[rootNode.id, rootNode]]);
	const edgeEntries = [];

	for (const workflow of workflowDefinitions) {
		const workflowNode = createSyntheticNode({
			bodyPreview: workflow.bodyPreview,
			frontmatter: {
				confidence: workflow.confidence,
				slice: "automation-workflows",
				type: "AutomationWorkflowCandidate",
			},
			id: `personal-graph:automation:workflow:${workflow.id}`,
			kind: "synthesis",
			title: workflow.title,
		});
		nodesById.set(workflowNode.id, workflowNode);
		edgeEntries.push(buildAutomationEdge(rootNode.id, workflowNode.id, "related", "automation_workflow_candidate"));

		const actionNode = createSyntheticNode({
			bodyPreview: `Draft automation: ${workflow.actionTitle}.`,
			frontmatter: {
				confidence: workflow.confidence,
				slice: "automation-workflows",
				type: "AutomationDraftAction",
				workflowId: workflow.id,
			},
			id: `personal-graph:automation:action:${workflow.id}`,
			kind: "concept",
			title: workflow.actionTitle,
		});
		nodesById.set(actionNode.id, actionNode);
		edgeEntries.push(buildAutomationEdge(workflowNode.id, actionNode.id, "related", "automation_workflow_draft_action"));

		const selectedEvidence = workflow.evidence.length > 0
			? workflow.evidence
			: [{
				id: `personal-graph:automation:evidence-needed:${workflow.id}`,
				source: "fallback",
				title: "More evidence needed",
				url: null,
			}];

		for (const [index, item] of selectedEvidence.entries()) {
			const evidenceNodeId = item.id.startsWith("personal-graph:")
				? item.id
				: `personal-graph:automation:evidence:${encodeURIComponent(item.id)}`;
			const evidenceNode = createSyntheticNode({
				bodyPreview: item.source === "fallback"
					? "TWG did not return enough matching signals for this candidate in the selected window."
					: `Evidence from ${item.source}.`,
				externalUrl: item.url ?? null,
				frontmatter: {
					source: item.source,
					slice: "automation-workflows",
					type: "AutomationWorkflowEvidence",
					workflowId: workflow.id,
				},
				id: evidenceNodeId,
				kind: "source",
				title: item.title,
			});
			nodesById.set(evidenceNode.id, evidenceNode);
			edgeEntries.push(buildAutomationEdge(workflowNode.id, evidenceNode.id, "related", `automation_workflow_evidence_${index + 1}`));
		}
	}

	return finalizeAutomationExplorer(nodesById, edgeEntries, generatedAt);
}

async function buildAutomationWorkflowExplorerFromTwg({
	parseJsonOrThrow,
	runTwg,
	signal,
	since,
	spawnImpl,
	TwgAuthError,
	TwgNotFoundError,
} = {}) {
	const resolvedSince = normalizeSinceWindow(since, DEFAULT_AUTOMATION_WORKFLOW_SINCE);
	const [workResult, contextResult] = await Promise.allSettled([
		fetchAutomationWorkQuery({ parseJsonOrThrow, runTwg, signal, since: resolvedSince, spawnImpl }),
		fetchAutomationContextUser({ parseJsonOrThrow, runTwg, signal, since: resolvedSince, spawnImpl }),
	]);
	if (workResult.status === "rejected" && contextResult.status === "rejected") {
		const primaryError = workResult.reason ?? contextResult.reason;
		if (
			(TwgAuthError && primaryError instanceof TwgAuthError) ||
			(TwgNotFoundError && primaryError instanceof TwgNotFoundError)
		) {
			throw primaryError;
		}
	}
	const workPayload = workResult.status === "fulfilled" ? workResult.value : { data: {} };
	const contextPayload = contextResult.status === "fulfilled" ? contextResult.value : { data: {} };
	return buildAutomationWorkflowExplorer({ contextPayload, since: resolvedSince, workPayload });
}

module.exports = {
	DEFAULT_AUTOMATION_WORKFLOW_SINCE,
	buildAutomationWorkflowExplorer,
	buildAutomationWorkflowExplorerFromTwg,
	fetchAutomationContextUser,
	fetchAutomationWorkQuery,
};
