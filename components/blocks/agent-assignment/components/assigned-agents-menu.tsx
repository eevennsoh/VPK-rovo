"use client";

import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";

import ArchiveBoxIcon from "@atlaskit/icon/core/archive-box";
import AiAgentAddIcon from "@atlaskit/icon-lab/core/ai-agent-add";

import type { AgentAssignmentAgent } from "@/components/blocks/agent-assignment/components/agent-assignment";
import { Button } from "@/components/ui/button";
import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import {
	RichTextSuggestionMenu,
	type RichTextSuggestionMenuItem,
} from "@/components/ui-custom/rich-text-editor";

interface AssignedAgentsMenuProps {
	onAddAgent: () => void;
	onArchiveAgent: (agent: AgentAssignmentAgent) => void;
	onSelectAgent: (agent: AgentAssignmentAgent) => void;
	rows: readonly AgentAssignmentAgent[];
}

function toAgentItem(
	row: AgentAssignmentAgent,
	onArchiveAgent: (agent: AgentAssignmentAgent) => void,
	onSelectAgent: (agent: AgentAssignmentAgent) => void,
): RichTextSuggestionMenuItem {
	return {
		icon: null,
		id: row.id,
		inlineMetadata: row.status,
		hoverActions: {
			onPrimary: () => onSelectAgent(row),
			onSecondary: () => onArchiveAgent(row),
			primaryLabel: "View",
			secondaryIcon: <ArchiveBoxIcon label="" size="small" />,
			secondaryLabel: "Archive",
		},
		label: row.name,
		leadingVisual: (
			<AgentAvatarVisual
				avatarClassName="shrink-0"
				avatarSrc={row.avatarSrc}
				brandName={row.brandName}
				fallbackText={row.name.slice(0, 2).toUpperCase()}
				logoName={row.logoName}
				sizePx={24}
			/>
		),
	};
}

export function AssignedAgentsMenu({
	onAddAgent,
	onArchiveAgent,
	onSelectAgent,
	rows,
}: Readonly<AssignedAgentsMenuProps>) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const items: readonly RichTextSuggestionMenuItem[] = rows.map((row) =>
		toAgentItem(row, onArchiveAgent, onSelectAgent)
	);

	const focusOptionAt = (index: number) => {
		containerRef.current
			?.querySelectorAll<HTMLButtonElement>("[data-suggestion-option]")
			.item(index)
			?.focus();
	};

	useEffect(() => {
		const frameId = window.requestAnimationFrame(() => {
			containerRef.current?.focus();
		});
		return () => window.cancelAnimationFrame(frameId);
	}, []);

	const handleSelect = (item: RichTextSuggestionMenuItem) => {
		const row = rows.find((candidate) => candidate.id === item.id);
		if (row) {
			onSelectAgent(row);
		}
	};

	const moveSelection = (step: number) => {
		const nextIndex = selectedIndex === -1
			? (step > 0 ? 0 : items.length - 1)
			: (selectedIndex + step + items.length) % items.length;
		focusOptionAt(nextIndex);
	};

	const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
		const options = containerRef.current?.querySelectorAll<HTMLButtonElement>("[data-suggestion-option]");
		if (!options || !(event.target instanceof HTMLButtonElement)) {
			return;
		}
		const index = [...options].indexOf(event.target);
		if (index !== -1) {
			setSelectedIndex(index);
		}
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key === "ArrowDown" || event.key === "ArrowUp") {
			event.preventDefault();
			moveSelection(event.key === "ArrowDown" ? 1 : -1);
		}
	};

	return (
		<div
			className="w-full outline-none"
			onFocus={handleFocus}
			onKeyDown={handleKeyDown}
			ref={containerRef}
			tabIndex={-1}
		>
			<>
				<RichTextSuggestionMenu
					className="rich-text-command-menu-embedded w-full!"
					emptyLabel="No agents assigned"
					items={items}
					onHover={setSelectedIndex}
					onSelect={handleSelect}
					selectedIndex={selectedIndex}
					title="Assigned agents"
				/>
				<div className="sticky bottom-0 z-10 mx-1 flex shrink-0 flex-col border-t border-border bg-popover p-0 pt-1 pb-1">
					<Button
						className="h-8 min-h-8 w-full justify-start gap-3 pl-2 pr-3 py-0 text-left text-sm font-normal"
						onClick={onAddAgent}
						type="button"
						variant="ghost"
					>
						<span className="grid size-6 shrink-0 place-items-center text-icon-subtle">
							<AiAgentAddIcon label="" />
						</span>
						<span className="text-text-subtle">Add agent</span>
					</Button>
				</div>
			</>
		</div>
	);
}
