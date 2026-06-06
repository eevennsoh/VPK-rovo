"use client";

import { useId, useState, type FocusEvent, type KeyboardEvent, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { DeleteIcon, PlusIcon, SettingsIcon } from "@/components/ui/vpk-icons";
import type { SubagentPrompt, SubagentsBaseAgent } from "@/components/blocks/subagents/data/demo-agents";
import { getSubagentDisplayName } from "@/components/blocks/subagents/lib/subagent-prompts";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

interface SubagentsNavigatorProps {
	activeSubagentId: string | null;
	baseAgent: SubagentsBaseAgent;
	className?: string;
	onCreateSubagent: () => void;
	onDeleteSubagent?: (id: string) => void;
	onManageSubagents?: () => void;
	onSelectBaseAgent: () => void;
	onSelectSubagent: (id: string) => void;
	subagents: ReadonlyArray<SubagentPrompt>;
}

const BAR_HEIGHT_PX = 2;
const BAR_GAP_PX = 12;
const MINIMAP_PADDING_Y_PX = 12;
const MINIMAP_PADDING_X_PX = 4;
const MINIMAP_WIDTH_PX = 32;
const MINIMAP_BASE_BAR_WIDTH_PX = 26;
const MINIMAP_PROMPT_BAR_WIDTH_PX = 16;
const SWITCHER_OPEN_WIDTH_PX = 280;
const SWITCHER_PANEL_PADDING_Y_PX = 16;
const SWITCHER_HEADER_HEIGHT_PX = 45;
const SWITCHER_SECTION_PADDING_Y_PX = 16;
const SWITCHER_SECTION_LABEL_HEIGHT_PX = 20;
const SWITCHER_ROW_HEIGHT_PX = 36;
const SWITCHER_ROW_GAP_PX = 2;
// Footer chrome = top border (1px) + pt-2 (8px); each action button is 36px tall.
const SWITCHER_FOOTER_CHROME_PX = 9;
const SWITCHER_FOOTER_ACTION_HEIGHT_PX = 36;

function getBaseAgentDisplayName(baseAgent: SubagentsBaseAgent): string {
	return baseAgent.config.name?.trim() || "Untitled agent";
}

export function SubagentsNavigator({
	activeSubagentId,
	baseAgent,
	className,
	onCreateSubagent,
	onDeleteSubagent,
	onManageSubagents,
	onSelectBaseAgent,
	onSelectSubagent,
	subagents,
}: Readonly<SubagentsNavigatorProps>) {
	const switcherId = useId();
	const shouldReduceMotion = useReducedMotion();
	const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
	const switcherItemsCount = subagents.length + 1;
	// The footer holds "Create subagent" and, when wired, "Manage subagents".
	const footerActionCount = onManageSubagents ? 2 : 1;
	const footerHeight =
		SWITCHER_FOOTER_CHROME_PX + footerActionCount * SWITCHER_FOOTER_ACTION_HEIGHT_PX;
	const closedHeight =
		2 * MINIMAP_PADDING_Y_PX +
		switcherItemsCount * BAR_HEIGHT_PX +
		Math.max(0, switcherItemsCount - 1) * BAR_GAP_PX;
	const openHeight =
		SWITCHER_PANEL_PADDING_Y_PX +
		SWITCHER_HEADER_HEIGHT_PX +
		SWITCHER_SECTION_PADDING_Y_PX +
		SWITCHER_SECTION_LABEL_HEIGHT_PX +
		subagents.length * SWITCHER_ROW_HEIGHT_PX +
		Math.max(0, subagents.length - 1) * SWITCHER_ROW_GAP_PX +
		footerHeight;
	const shellTransition = shouldReduceMotion
		? undefined
		: [
			"width var(--duration-medium) var(--ease-in-out)",
			"height var(--duration-medium) var(--ease-in-out)",
			"border-radius var(--duration-medium) var(--ease-in-out)",
			"background-color var(--duration-normal) var(--ease-out)",
			"box-shadow var(--duration-medium) var(--ease-out)",
		].join(", ");

	function handleBlur(event: FocusEvent<HTMLDivElement>) {
		if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
			return;
		}

		setIsSwitcherOpen(false);
	}

	function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
		if (event.key === "Escape") {
			event.stopPropagation();
			setIsSwitcherOpen(false);
		}
	}

	if (subagents.length === 0) {
		return null;
	}

	return (
		<div
			className={className}
			onBlur={handleBlur}
			onFocusCapture={() => setIsSwitcherOpen(true)}
			onKeyDown={handleKeyDown}
			onMouseEnter={() => setIsSwitcherOpen(true)}
			onMouseLeave={() => setIsSwitcherOpen(false)}
		>
			<div
				className="relative origin-top-right overflow-hidden text-left"
				id={switcherId}
				style={{
					boxSizing: "border-box",
					width: isSwitcherOpen ? SWITCHER_OPEN_WIDTH_PX : MINIMAP_WIDTH_PX,
					height: isSwitcherOpen ? openHeight : closedHeight,
					borderRadius: isSwitcherOpen ? 16 : 14,
					backgroundColor: isSwitcherOpen ? "var(--ds-surface-overlay)" : "transparent",
					boxShadow: isSwitcherOpen ? token("elevation.shadow.overlay") : "none",
					transition: shellTransition,
				}}
			>
				<button
					aria-controls={switcherId}
					aria-expanded={isSwitcherOpen}
					aria-hidden={isSwitcherOpen}
					aria-label="Open subagent switcher"
					className={cn(
						"absolute inset-0 flex flex-col items-end justify-start transition-opacity duration-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-selected",
						isSwitcherOpen
							? "pointer-events-none opacity-0"
							: "pointer-events-auto opacity-100",
					)}
					inert={isSwitcherOpen}
					onClick={() => setIsSwitcherOpen(true)}
					style={{
						paddingTop: MINIMAP_PADDING_Y_PX,
						paddingBottom: MINIMAP_PADDING_Y_PX,
						paddingLeft: MINIMAP_PADDING_X_PX,
						paddingRight: MINIMAP_PADDING_X_PX,
						gap: BAR_GAP_PX,
					}}
					type="button"
				>
					<div
						className={cn(
							"shrink-0 rounded-full transition-colors duration-normal",
							activeSubagentId === null ? "bg-icon" : "bg-icon-disabled",
						)}
						style={{
							width: MINIMAP_BASE_BAR_WIDTH_PX,
							height: BAR_HEIGHT_PX,
						}}
					/>
					{subagents.map((prompt) => {
						const isActive = prompt.id === activeSubagentId;
						return (
							<div
								className={cn(
									"shrink-0 rounded-full transition-colors duration-normal",
									isActive ? "bg-icon" : "bg-icon-disabled",
								)}
								key={prompt.id}
								style={{
									width: MINIMAP_PROMPT_BAR_WIDTH_PX,
									height: BAR_HEIGHT_PX,
								}}
							/>
						);
					})}
				</button>

				<div
					aria-hidden={!isSwitcherOpen}
					className={cn(
						"absolute inset-0 flex flex-col p-2 text-left transition-opacity duration-normal ease-out",
						isSwitcherOpen
							? "pointer-events-auto opacity-100"
							: "pointer-events-none opacity-0",
					)}
					inert={!isSwitcherOpen}
				>
					<div className="sticky top-0 z-10 shrink-0 bg-surface-overlay">
						<SubagentsSwitcherButton
							isActive={activeSubagentId === null}
							label={getBaseAgentDisplayName(baseAgent)}
							onSelect={onSelectBaseAgent}
						/>
						<div aria-hidden className="mt-2 h-px bg-border" />
					</div>
					<div className="shrink-0 py-2">
						<div className="px-2 pb-1 text-xs font-semibold leading-4 text-text-subtlest">
							Subagents
						</div>
						<div className="flex flex-col gap-0.5">
							{subagents.map((prompt) => (
								<SubagentsSwitcherButton
									isActive={prompt.id === activeSubagentId}
									key={prompt.id}
									label={getSubagentDisplayName(prompt)}
									onDelete={onDeleteSubagent ? () => onDeleteSubagent(prompt.id) : undefined}
									onSelect={() => onSelectSubagent(prompt.id)}
								/>
							))}
						</div>
					</div>
					<div className="sticky bottom-0 z-10 shrink-0 border-t border-border bg-surface-overlay pt-2">
						<SubagentsActionButton
							icon={<PlusIcon size="small" />}
							label="Create subagent"
							onClick={onCreateSubagent}
						/>
						{onManageSubagents ? (
							<SubagentsActionButton
								icon={<SettingsIcon size="small" />}
								label="Manage subagents"
								onClick={onManageSubagents}
							/>
						) : null}
					</div>
				</div>
			</div>
		</div>
	);
}

function SubagentsActionButton({
	icon,
	label,
	onClick,
}: Readonly<{
	icon: ReactNode;
	label: string;
	onClick: () => void;
}>) {
	return (
		<button
			type="button"
			aria-label={label}
			className="flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-sm text-text-subtle transition-colors duration-normal hover:bg-bg-neutral-subtle-hovered hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-selected"
			onClick={onClick}
		>
			{icon}
			<span className="min-w-0 truncate">{label}</span>
		</button>
	);
}

function SubagentsSwitcherButton({
	isActive,
	label,
	onDelete,
	onSelect,
}: Readonly<{
	isActive: boolean;
	label: string;
	onDelete?: () => void;
	onSelect: () => void;
}>) {
	return (
		<div className="group/switcher-row relative">
			<button
				type="button"
				aria-label={`Select ${label}`}
				aria-pressed={isActive}
				className={cn(
					"flex h-9 w-full min-w-0 items-center rounded-lg p-2 text-left transition-colors duration-normal ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-selected",
					isActive
						? "bg-bg-selected text-text-selected"
						: "bg-transparent text-text-subtle hover:bg-surface-hovered hover:text-text",
					onDelete && "pr-9",
				)}
				onClick={onSelect}
			>
				<span className="w-full truncate text-sm font-semibold leading-5">
					{label}
				</span>
			</button>
			{onDelete ? (
				<button
					type="button"
					aria-label={`Delete ${label}`}
					className="absolute right-1 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-text-subtlest opacity-0 transition-[colors,opacity] duration-normal hover:bg-bg-danger-hovered hover:text-text-danger focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-selected group-hover/switcher-row:opacity-100"
					onClick={onDelete}
				>
					<DeleteIcon size="small" />
				</button>
			) : null}
		</div>
	);
}
