"use client";

import { useCallback, useState } from "react";

import { useRovoChat } from "@/app/contexts";
import {
	JiraSessionFlyoutSurface,
	createJiraSessionFlyoutHandle,
} from "@/components/blocks/product-sidebar/variants/jira-session-flyout";
import { cn } from "@/lib/utils";

import { AGENT_LIST_ITEMS } from "./data";
import { AgentListCard } from "./agent-list-card";
import type {
	AgentListItem,
	AgentListProps,
} from "./agent-list-types";

export function AgentList({
	className,
	composerChatSurface = "sidebar",
	flyout = "session",
	items = AGENT_LIST_ITEMS,
	variant = "default",
	onSubmitPrompt,
	onView,
	selectedItemId,
}: Readonly<AgentListProps>) {
	const { openChat, sendPrompt } = useRovoChat();
	const handleFlyoutSubmit = useCallback((item: AgentListItem, prompt: string) => {
		if (onSubmitPrompt) {
			void onSubmitPrompt(item, prompt);
			return;
		}

		openChat(composerChatSurface);
		void sendPrompt(prompt);
	}, [composerChatSurface, onSubmitPrompt, openChat, sendPrompt]);
	// One payload-aware flyout for the whole list: the popup stays mounted and
	// follows the hovered row, so sliding down the list crossfades instead of
	// tearing down and remounting a card per row. Unused by the composer variant,
	// whose Agent States card owns local state and must stay per-row.
	const [flyoutHandle] = useState(createJiraSessionFlyoutHandle);

	return (
		<>
			<ul
				className={cn(
					"divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface",
					className,
				)}
			>
				{items.map((item: AgentListItem) => (
					<AgentListCard
						flyout={flyout}
						flyoutHandle={flyoutHandle}
						isSelected={item.id === selectedItemId}
						item={item}
						key={item.id}
						onView={onView}
						onFlyoutSubmit={(prompt) => handleFlyoutSubmit(item, prompt)}
						variant={variant}
					/>
				))}
			</ul>
			{flyout === "session" ? (
				<JiraSessionFlyoutSurface handle={flyoutHandle} />
			) : null}
		</>
	);
}

export { AGENT_LIST_ITEMS } from "./data";
export { AgentListActivityHeader } from "./agent-list-card";
export {
	deriveIssueKeyFromBranch,
	toAgentSessionFlyoutItem,
	toAgentSessionStatus,
} from "./agent-list-session";
export type {
	AgentListAgent,
	AgentListFlyout,
	AgentListInvoker,
	AgentListItem,
	AgentListPrStatus,
	AgentListProps,
	AgentListSessionDetails,
	AgentListState,
	AgentListVariant,
} from "./agent-list-types";
