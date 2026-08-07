"use client";

import { useCallback } from "react";

import { useRovoChat } from "@/app/contexts";
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

	return (
		<ul
			className={cn(
				"divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface",
				className,
			)}
		>
			{items.map((item: AgentListItem) => (
				<AgentListCard
					isSelected={item.id === selectedItemId}
					item={item}
					key={item.id}
					onView={onView}
					onFlyoutSubmit={(prompt) => handleFlyoutSubmit(item, prompt)}
					variant={variant}
				/>
			))}
		</ul>
	);
}

export { AGENT_LIST_ITEMS } from "./data";
export { AgentListActivityHeader } from "./agent-list-card";
export type {
	AgentListAgent,
	AgentListInvoker,
	AgentListItem,
	AgentListPrStatus,
	AgentListProps,
	AgentListState,
	AgentListVariant,
} from "./agent-list-types";
