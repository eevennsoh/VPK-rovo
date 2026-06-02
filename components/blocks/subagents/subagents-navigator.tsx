"use client";

import { useId, useMemo, useState, type FocusEvent, type KeyboardEvent } from "react";
import { useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@/components/ui/vpk-icons";
import type { SubagentsAgent } from "@/components/blocks/subagents/data/demo-agents";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

interface SubagentsNavigatorProps {
	activeAgentId: string;
	agents: ReadonlyArray<SubagentsAgent>;
	className?: string;
	onCreateSubagent: () => void;
	onSelectAgent: (id: string) => void;
}

const BAR_HEIGHT_PX = 2;
const BAR_GAP_PX = 12;
const MINIMAP_PADDING_Y_PX = 12;
const MINIMAP_PADDING_X_PX = 4;
const MINIMAP_WIDTH_PX = 32;
const MINIMAP_MAX_BAR_WIDTH_PX = 24;
const SWITCHER_OPEN_WIDTH_PX = 280;
const SWITCHER_OPEN_MAX_HEIGHT_PX = 360;

function getAgentDisplayName(agent: SubagentsAgent): string {
	return agent.config.name?.trim() || (agent.kind === "master" ? "Master orchestrator" : "Untitled subagent");
}

function getAgentDescription(agent: SubagentsAgent): string {
	return agent.config.description?.trim() || agent.config.summary?.trim() || "Configure this agent's role and behavior.";
}

function getBarWidth(agent: SubagentsAgent): number {
	const length = `${getAgentDisplayName(agent)} ${getAgentDescription(agent)}`.length;
	if (length < 36) return 8;
	if (length <= 96) return 16;
	return MINIMAP_MAX_BAR_WIDTH_PX;
}

function toSnippet(text: string, maxLength = 54): string {
	const normalized = text.replace(/\s+/gu, " ").trim();
	if (normalized.length <= maxLength) {
		return normalized;
	}

	return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
}

export function SubagentsNavigator({
	activeAgentId,
	agents,
	className,
	onCreateSubagent,
	onSelectAgent,
}: Readonly<SubagentsNavigatorProps>) {
	const switcherId = useId();
	const shouldReduceMotion = useReducedMotion();
	const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
	const masterAgent = agents.find((agent) => agent.kind === "master") ?? agents[0];
	const subagents = useMemo(() => agents.filter((agent) => agent.kind === "subagent"), [agents]);
	const switcherItems = useMemo(
		() => (masterAgent ? [masterAgent, ...subagents] : subagents),
		[masterAgent, subagents],
	);
	const closedHeight =
		2 * MINIMAP_PADDING_Y_PX +
		switcherItems.length * BAR_HEIGHT_PX +
		Math.max(0, switcherItems.length - 1) * BAR_GAP_PX;
	const openHeight = Math.min(
		64 + subagents.length * 52,
		SWITCHER_OPEN_MAX_HEIGHT_PX,
	);
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
		return (
			<div className={className}>
				<Button
					type="button"
					aria-label="Create subagent"
					className="h-7 rounded-full px-3"
					onClick={onCreateSubagent}
					size="compact"
					variant="outline"
				>
					<PlusIcon size="small" />
					Create subagent
				</Button>
			</div>
		);
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
					{switcherItems.map((agent) => {
						const isActive = agent.id === activeAgentId;
						return (
							<div
								className={cn(
									"shrink-0 rounded-full transition-colors duration-normal",
									isActive ? "bg-icon" : "bg-icon-disabled",
								)}
								key={agent.id}
								style={{
									width: getBarWidth(agent),
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
					<div className="min-h-0 flex-1 overflow-y-auto">
						{masterAgent ? (
							<SubagentsSwitcherButton
								agent={masterAgent}
								isActive={masterAgent.id === activeAgentId}
								onSelectAgent={onSelectAgent}
								variant="master"
							/>
						) : null}
						<div aria-hidden className="my-2 h-px bg-border" />
						<div className="px-2 pb-1 text-xs font-semibold leading-4 text-text-subtlest">
							Subagents
						</div>
						<div className="flex flex-col gap-0.5">
							{subagents.map((agent, index) => (
								<SubagentsSwitcherButton
									agent={agent}
									isActive={agent.id === activeAgentId}
									key={agent.id}
									onSelectAgent={onSelectAgent}
									variant={index === subagents.length - 1 ? "last" : "subagent"}
								/>
							))}
						</div>
						<div className="pt-1">
							<button
								type="button"
								aria-label="Create subagent"
								className="flex h-8 w-full items-center gap-1 rounded-lg px-2 text-left text-xs font-medium leading-4 text-text-subtle transition-colors duration-normal hover:bg-surface-hovered hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-selected"
								onClick={onCreateSubagent}
							>
								<PlusIcon size="small" />
								Create subagent
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function SubagentsSwitcherButton({
	agent,
	isActive,
	onSelectAgent,
	variant,
}: Readonly<{
	agent: SubagentsAgent;
	isActive: boolean;
	onSelectAgent: (id: string) => void;
	variant: "master" | "subagent" | "last";
}>) {
	const name = getAgentDisplayName(agent);
	const description = getAgentDescription(agent);

	return (
		<button
			type="button"
			aria-label={`Select ${name}`}
			aria-pressed={isActive}
			className={cn(
				"flex w-full min-w-0 flex-col gap-0.5 p-2 text-left transition-colors duration-normal ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-selected",
				isActive
					? "bg-bg-selected text-text-selected"
					: "bg-transparent text-text-subtle hover:bg-surface-hovered hover:text-text",
				variant === "master" ? "rounded-lg" : null,
				variant === "subagent" ? "rounded" : null,
				variant === "last" ? "rounded-b-lg rounded-t" : null,
			)}
			onClick={() => onSelectAgent(agent.id)}
		>
			<span className="w-full truncate text-sm font-semibold leading-5">
				{name}
			</span>
			<span className="w-full truncate text-xs leading-4">
				{toSnippet(description)}
			</span>
		</button>
	);
}
