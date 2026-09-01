import type { AgentSessionItem } from "@/components/blocks/agent-session";

export function isAgentSessionLinkable(
	item: AgentSessionItem,
	capturedItemIds?: ReadonlySet<string>,
): boolean {
	return capturedItemIds === undefined || !capturedItemIds.has(item.id);
}

export function collectLinkableAgentSessions(
	items: readonly AgentSessionItem[],
	capturedItemIds?: ReadonlySet<string>,
): readonly AgentSessionItem[] {
	return items.filter((item: AgentSessionItem) => isAgentSessionLinkable(item, capturedItemIds));
}

function resolveLinkWorkItemKey(
	item: AgentSessionItem,
	getSuggestedWorkItemKey?: (item: AgentSessionItem) => string | undefined,
	getSuggestedWorkItemKeys?: (item: AgentSessionItem) => readonly string[] | undefined,
): string | undefined {
	const firstKey = getSuggestedWorkItemKeys?.(item)?.[0];
	if (firstKey !== undefined) {
		return firstKey;
	}

	return getSuggestedWorkItemKey?.(item) ?? item.sessionDetails?.issueKey;
}

export function linkAllAgentSessions(
	items: readonly AgentSessionItem[],
	options: Readonly<{
		capturedItemIds?: ReadonlySet<string>;
		getSuggestedWorkItemKey?: (item: AgentSessionItem) => string | undefined;
		getSuggestedWorkItemKeys?: (item: AgentSessionItem) => readonly string[] | undefined;
		onLinkWorkItem: (item: AgentSessionItem, workItemKey?: string) => void;
	}>,
): void {
	for (const item of collectLinkableAgentSessions(items, options.capturedItemIds)) {
		options.onLinkWorkItem(
			item,
			resolveLinkWorkItemKey(
				item,
				options.getSuggestedWorkItemKey,
				options.getSuggestedWorkItemKeys,
			),
		);
	}
}
