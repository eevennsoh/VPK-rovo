"use client";

import { EntityCardAgent } from "./agent";
import { EntityCardAgentExpanded } from "./agent-expanded";
import { EntityCardAgentProfile } from "./agent-profile";
import { EntityCardApp } from "./app";
import { EntityCardShell } from "./card";
import { EntityCardKnowledge } from "./knowledge";
import { EntityCardObjectTile } from "./object-tile";
import {
	EntityCardAddedCheck,
	EntityCardBanner,
	EntityCardByline,
	EntityCardCapabilities,
	EntityCardDescription,
	EntityCardFooter,
	EntityCardHeader,
	EntityCardMoreButton,
	EntityCardSection,
	EntityCardStat,
} from "./parts";
import { EntityCardSkill } from "./skill";
import { EntityCardTool } from "./tool";
import {
	EntityCardAgentCard,
	EntityCardAgentExpandedCard,
	EntityCardAppCard,
	EntityCardKnowledgeCard,
	EntityCardSkillCard,
	EntityCardToolCard,
} from "./variants";

export { EntityCardShell, type EntityCardShellProps } from "./card";
export { EntityCardAgent, type EntityCardAgentProps } from "./agent";
export {
	EntityCardAgentExpanded,
	type EntityCardAgentExpandedProps,
	type EntityCardSkillTag,
} from "./agent-expanded";
export { EntityCardAgentProfile, type EntityCardAgentProfileProps } from "./agent-profile";
export { EntityCardApp, type EntityCardAppProps } from "./app";
export { EntityCardKnowledge, type EntityCardKnowledgeProps } from "./knowledge";
export { EntityCardObjectTile, type EntityCardObjectTileProps } from "./object-tile";
export {
	EntityCardAddedCheck,
	type EntityCardAddedCheckProps,
	EntityCardBanner,
	type EntityCardBannerProps,
	EntityCardByline,
	type EntityCardBylineProps,
	EntityCardCapabilities,
	type EntityCardCapability,
	type EntityCardCapabilityIcon,
	type EntityCardCapabilitiesProps,
	EntityCardDescription,
	EntityCardFooter,
	EntityCardHeader,
	type EntityCardHeaderProps,
	EntityCardMoreButton,
	type EntityCardMoreButtonProps,
	EntityCardSection,
	EntityCardStat,
	type EntityCardStatProps,
	formatCompact,
} from "./parts";
export {
	EntityCardSkill,
	type EntityCardDensity,
	type EntityCardIcon,
	type EntityCardSkillProps,
	type EntityCardSource,
} from "./skill";
export { EntityCardTool, type EntityCardToolProps } from "./tool";
export {
	EntityCardAgentCard,
	type EntityCardAgentCardProps,
	EntityCardAgentExpandedCard,
	type EntityCardAgentExpandedCardProps,
	EntityCardAppCard,
	type EntityCardAppCardProps,
	EntityCardKnowledgeCard,
	type EntityCardKnowledgeCardProps,
	EntityCardSkillCard,
	type EntityCardSkillCardProps,
	EntityCardToolCard,
	type EntityCardToolCardProps,
} from "./variants";

export const EntityCard = {
	// Bare content components — render inside your own container (e.g. a hover card).
	Agent: EntityCardAgent,
	AgentExpanded: EntityCardAgentExpanded,
	AgentProfile: EntityCardAgentProfile,
	App: EntityCardApp,
	Knowledge: EntityCardKnowledge,
	ObjectTile: EntityCardObjectTile,
	Skill: EntityCardSkill,
	Tool: EntityCardTool,
	// Shell + ready-made directory cards (shell + content + whole-card select).
	Shell: EntityCardShell,
	AgentCard: EntityCardAgentCard,
	AgentExpandedCard: EntityCardAgentExpandedCard,
	AppCard: EntityCardAppCard,
	KnowledgeCard: EntityCardKnowledgeCard,
	SkillCard: EntityCardSkillCard,
	ToolCard: EntityCardToolCard,
	// Primitive parts for composing custom cards.
	Header: EntityCardHeader,
	Description: EntityCardDescription,
	Footer: EntityCardFooter,
	Stat: EntityCardStat,
	Byline: EntityCardByline,
	MoreButton: EntityCardMoreButton,
	Section: EntityCardSection,
	Banner: EntityCardBanner,
	Capabilities: EntityCardCapabilities,
	AddedCheck: EntityCardAddedCheck,
} as const;
