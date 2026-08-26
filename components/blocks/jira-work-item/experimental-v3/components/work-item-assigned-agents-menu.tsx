"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import AiAgentAddIcon from "@atlaskit/icon-lab/core/ai-agent-add";

import { WorkingSessionActivityByline } from "@/components/blocks/jira-work-item/experimental-v3/components/agent-session-activity-byline";
import type { AssignedAgentRow } from "@/components/blocks/jira-work-item/experimental-v3/lib/assigned-agent-rows";
import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import {
	RichTextSuggestionMenu,
	type RichTextSuggestionMenuItem,
} from "@/components/ui-custom/rich-text-editor";

/** Reserved row id; agent rows are keyed by their agent id, which never collides. */
const ADD_AGENT_ITEM_ID = "assigned-agents:add-agent";

interface WorkItemAssignedAgentsMenuProps {
	/** Swaps the host dropdown over to the agent-selector palette in place. */
	onAddAgent: () => void;
	/** Only ever called for rows that carry a session. */
	onOpenAgentSession: (row: AssignedAgentRow) => void;
	rows: readonly AssignedAgentRow[];
}

function toAgentItem(row: AssignedAgentRow, rowIndex: number): RichTextSuggestionMenuItem {
	return {
		// Rows without a session open nothing, so they stay informational rather
		// than offering a click that would silently no-op.
		disabled: row.session === undefined,
		icon: null,
		id: row.agentId,
		// A finished session has no narration left to cycle, and an agent that
		// never ran has none at all — both fall back to the resolved status label
		// so a row can never claim "Working" for an agent that is not.
		inlineMetadata: row.session !== undefined && row.session.status !== "completed"
			? <WorkingSessionActivityByline session={row.session} sessionIndex={rowIndex} />
			: <WorkingSessionActivityByline fallbackLabel={row.statusLabel} />,
		label: row.name,
		leadingVisual: (
			<AgentAvatarVisual
				avatarClassName="shrink-0"
				avatarSrc={row.avatarSrc}
				brandName={row.brandName}
				fallbackText={row.name.slice(0, 2).toUpperCase()}
				sizePx={24}
			/>
		),
	};
}

/**
 * Details-rail menu listing the agents already assigned to the work item, each
 * with its live state, plus a footer row that swaps the same dropdown surface
 * over to the full agent-selector palette.
 *
 * Dismissal (outside click, Escape) belongs to the host `DropdownMenuContent`;
 * this component only owns roving selection inside the list.
 */
export function WorkItemAssignedAgentsMenu({
	onAddAgent,
	onOpenAgentSession,
	rows,
}: Readonly<WorkItemAssignedAgentsMenuProps>) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const items: readonly RichTextSuggestionMenuItem[] = [
		...rows.map(toAgentItem),
		{
			icon: <AiAgentAddIcon label="" />,
			iconTileVariant: "transparent",
			id: ADD_AGENT_ITEM_ID,
			label: "Add agent",
			separatorBefore: true,
		},
	];
	const selectableIndexes = items.flatMap((item, index) => (item.disabled ? [] : [index]));

	useEffect(() => {
		// Base UI parks focus on the menu popup after it mounts. Claim it back on
		// the next frame so Arrow/Enter reach this list instead of an empty menu
		// composite that owns no items.
		const frameId = window.requestAnimationFrame(() => {
			containerRef.current?.focus();
		});
		return () => window.cancelAnimationFrame(frameId);
	}, []);

	const handleSelect = (item: RichTextSuggestionMenuItem) => {
		if (item.id === ADD_AGENT_ITEM_ID) {
			onAddAgent();
			return;
		}
		const row = rows.find((candidate) => candidate.agentId === item.id);
		if (!row?.session) {
			return;
		}
		onOpenAgentSession(row);
	};

	const moveSelection = (step: number) => {
		if (selectableIndexes.length === 0) {
			return;
		}
		const cursor = selectableIndexes.indexOf(selectedIndex);
		const nextCursor = cursor === -1
			? (step > 0 ? 0 : selectableIndexes.length - 1)
			: (cursor + step + selectableIndexes.length) % selectableIndexes.length;
		setSelectedIndex(selectableIndexes[nextCursor]);
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key === "ArrowDown" || event.key === "ArrowUp") {
			event.preventDefault();
			moveSelection(event.key === "ArrowDown" ? 1 : -1);
			return;
		}
		if (event.key === "Enter") {
			const item = items[selectedIndex];
			if (!item || item.disabled) {
				return;
			}
			event.preventDefault();
			handleSelect(item);
		}
	};

	return (
		<div
			className="w-full outline-none"
			onKeyDown={handleKeyDown}
			ref={containerRef}
			tabIndex={-1}
		>
			<RichTextSuggestionMenu
				className="rich-text-command-menu-borderless w-full!"
				emptyLabel="No agents assigned"
				items={items}
				onHover={setSelectedIndex}
				onSelect={handleSelect}
				selectedIndex={selectedIndex}
				title="Assigned agents"
			/>
		</div>
	);
}
