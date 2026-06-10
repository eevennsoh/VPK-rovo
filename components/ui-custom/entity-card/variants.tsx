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
	onSelect?: () => void;
}

/** App directory card — app logo tile, tool/knowledge counts, and teammate usage. */
export function EntityCardAppCard({
	active = false,
	className,
	moreAction,
	name,
	onMoreActions,
	onSelect,
	...entityProps
}: Readonly<EntityCardAppCardProps>) {
	return (
		<EntityCardShell active={active} className={cn("gap-4", className)} onSelect={onSelect} selectLabel={`Select ${name}`}>
			<EntityCardApp
				{...entityProps}
				active={active}
				action={moreAction}
				name={name}
				onMoreActions={onMoreActions}
			/>
		</EntityCardShell>
	);
}

export interface EntityCardKnowledgeCardProps extends EntityCardKnowledgeProps {
	onSelect?: () => void;
}

/** Knowledge directory card — app identity, description, and provider metadata. */
export function EntityCardKnowledgeCard({
	className,
	name,
	onSelect,
	...entityProps
}: Readonly<EntityCardKnowledgeCardProps>) {
	return (
		<EntityCardShell
			className={cn("gap-4", className)}
			onSelect={onSelect}
			selectLabel={`Select ${name}`}
		>
			<EntityCardKnowledge {...entityProps} name={name} />
		</EntityCardShell>
	);
}

export interface EntityCardSkillCardProps extends EntityCardSkillProps {
	onSelect?: () => void;
}

/** Skill directory card — icon tile, byline attribution, and usage stats. */
export function EntityCardSkillCard({
	className,
	name,
	onSelect,
	...entityProps
}: Readonly<EntityCardSkillCardProps>) {
	return (
		<EntityCardShell className={className} onSelect={onSelect} selectLabel={`Select ${name}`}>
			<EntityCardSkill {...entityProps} name={name} />
		</EntityCardShell>
	);
}

export interface EntityCardToolCardProps extends EntityCardToolProps {
	moreAction?: ReactNode;
	onSelect?: () => void;
}

/** Tool directory card — app logo tile, tool count, and teammate usage. */
export function EntityCardToolCard({
	active = false,
	className,
	moreAction,
	name,
	onMoreActions,
	onSelect,
	...entityProps
}: Readonly<EntityCardToolCardProps>) {
	return (
		<EntityCardShell active={active} className={cn("gap-4", className)} onSelect={onSelect} selectLabel={`Select ${name}`}>
			<EntityCardTool
				{...entityProps}
				active={active}
				action={moreAction}
				name={name}
				onMoreActions={onMoreActions}
			/>
		</EntityCardShell>
	);
}
