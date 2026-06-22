"use client";

import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { EntityCardAgent, type EntityCardAgentProps } from "./agent";
import { EntityCardAgentExpanded, type EntityCardAgentExpandedProps } from "./agent-expanded";
import { EntityCardApp, type EntityCardAppProps } from "./app";
import { EntityCardKnowledge, type EntityCardKnowledgeProps } from "./knowledge";
import { EntityCardShell } from "./card";
import { EntityCardSkill, type EntityCardSkillProps } from "./skill";
import { EntityCardTool, type EntityCardToolProps } from "./tool";

// Ready-made directory cards — each wraps the matching entity-card content in the
// hover-elevating `EntityCardShell` with a whole-card select affordance. Use these
// in directory/grid surfaces; use the bare content components (`EntityCard.Agent`,
// `EntityCard.Skill`, …) when you need the content without the card shell.

export interface EntityCardAgentCardProps extends EntityCardAgentProps {
	moreAction?: ReactNode;
	onSelect?: () => void;
}

/** Agent directory card — hexagon avatar, attribution, rating, and chat stats. */
export function EntityCardAgentCard({
	active = false,
	className,
	moreAction,
	name,
	onMoreActions,
	onSelect,
	...entityProps
}: Readonly<EntityCardAgentCardProps>) {
	return (
		<EntityCardShell active={active} className={cn("gap-4", className)} onSelect={onSelect} selectLabel={`Select ${name}`}>
			<EntityCardAgent
				{...entityProps}
				active={active}
				action={moreAction}
				name={name}
				onMoreActions={onMoreActions}
			/>
		</EntityCardShell>
	);
}

export interface EntityCardAgentExpandedCardProps extends EntityCardAgentExpandedProps {
	onSelect?: () => void;
}

/**
 * Expanded agent directory card — cover banner, attribution, scrollable
 * capabilities, and hover footer action.
 */
export function EntityCardAgentExpandedCard({
	className,
	name,
	onSelect,
	...entityProps
}: Readonly<EntityCardAgentExpandedCardProps>) {
	return (
		<EntityCardShell
			className={cn("gap-0 overflow-clip p-0", className)}
			onSelect={onSelect}
			selectLabel={`Select ${name}`}
		>
			<EntityCardAgentExpanded {...entityProps} name={name} onSelect={onSelect} />
		</EntityCardShell>
	);
}

export interface EntityCardAppCardProps extends EntityCardAppProps {
	moreAction?: ReactNode;
	/**
	 * Toggles selection. Pass `selected` alongside it to enter multi-select mode
	 * (leading checkbox swap + persistent selected border); without `selected`
	 * the whole-card click is a plain open/navigate action.
	 */
	onSelect?: (checked?: boolean) => void;
}

/** App directory card — app logo tile, tool/knowledge counts, and teammate usage. */
export function EntityCardAppCard({
	active = false,
	className,
	moreAction,
	name,
	onMoreActions,
	onSelect,
	selected,
	...entityProps
}: Readonly<EntityCardAppCardProps>) {
	const selectable = selected !== undefined;
	const selectLabel = `${selected ? "Deselect" : "Select"} ${name}`;
	return (
		<EntityCardShell
			active={active}
			className={cn("gap-4", className)}
			onSelect={onSelect ? () => onSelect() : undefined}
			selectLabel={selectLabel}
			selected={selected}
		>
			<EntityCardApp
				{...entityProps}
				active={active}
				action={moreAction}
				name={name}
				onMoreActions={onMoreActions}
				onSelectedChange={onSelect}
				selectLabel={selectLabel}
				selectable={selectable}
				selected={selected}
			/>
		</EntityCardShell>
	);
}

export interface EntityCardKnowledgeCardProps extends EntityCardKnowledgeProps {
	/** See `EntityCardAppCardProps.onSelect`. */
	onSelect?: (checked?: boolean) => void;
}

/** Knowledge directory card — app identity, description, and provider metadata. */
export function EntityCardKnowledgeCard({
	className,
	name,
	onSelect,
	selected,
	...entityProps
}: Readonly<EntityCardKnowledgeCardProps>) {
	const selectable = selected !== undefined;
	const selectLabel = `${selected ? "Deselect" : "Select"} ${name}`;
	return (
		<EntityCardShell
			className={cn("gap-4", className)}
			onSelect={onSelect ? () => onSelect() : undefined}
			selectLabel={selectLabel}
			selected={selected}
		>
			<EntityCardKnowledge
				{...entityProps}
				name={name}
				onSelectedChange={onSelect}
				selectLabel={selectLabel}
				selectable={selectable}
				selected={selected}
			/>
		</EntityCardShell>
	);
}

export interface EntityCardSkillCardProps extends EntityCardSkillProps {
	/** Keeps the shell hover treatment active while nested menus/popovers are open. */
	active?: boolean;
	moreAction?: ReactNode;
	/** See `EntityCardAppCardProps.onSelect`. */
	onSelect?: (checked?: boolean) => void;
}

/** Skill directory card — icon tile, byline attribution, and usage stats. */
export function EntityCardSkillCard({
	active = false,
	className,
	moreAction,
	name,
	onSelect,
	selected,
	action,
	...entityProps
}: Readonly<EntityCardSkillCardProps>) {
	const selectable = selected !== undefined;
	const selectLabel = `${selected ? "Deselect" : "Select"} ${name}`;
	return (
		<EntityCardShell
			active={active}
			className={className}
			onSelect={onSelect ? () => onSelect() : undefined}
			selectLabel={selectLabel}
			selected={selected}
		>
			<EntityCardSkill
				{...entityProps}
				action={moreAction ?? action}
				name={name}
				onSelectedChange={onSelect}
				selectLabel={selectLabel}
				selectable={selectable}
				selected={selected}
			/>
		</EntityCardShell>
	);
}

export interface EntityCardToolCardProps extends EntityCardToolProps {
	moreAction?: ReactNode;
	/** See `EntityCardAppCardProps.onSelect`. */
	onSelect?: (checked?: boolean) => void;
}

/** Tool directory card — app logo tile, tool count, and teammate usage. */
export function EntityCardToolCard({
	active = false,
	className,
	moreAction,
	name,
	onMoreActions,
	onSelect,
	selected,
	...entityProps
}: Readonly<EntityCardToolCardProps>) {
	const selectable = selected !== undefined;
	const selectLabel = `${selected ? "Deselect" : "Select"} ${name}`;
	return (
		<EntityCardShell
			active={active}
			className={cn("gap-4", className)}
			onSelect={onSelect ? () => onSelect() : undefined}
			selectLabel={selectLabel}
			selected={selected}
		>
			<EntityCardTool
				{...entityProps}
				active={active}
				action={moreAction}
				name={name}
				onMoreActions={onMoreActions}
				onSelectedChange={onSelect}
				selectLabel={selectLabel}
				selectable={selectable}
				selected={selected}
			/>
		</EntityCardShell>
	);
}
