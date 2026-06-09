"use client";

import { EntityCardAgent } from "./agent";
import { EntityCardAgentExpanded } from "./agent-expanded";
import { EntityCardAgentProfile } from "./agent-profile";
import { EntityCardKnowledge } from "./knowledge";
import { EntityCardObjectTile } from "./object-tile";
import {
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
import { EntityCardTemplate } from "./template";
import { EntityCardTool } from "./tool";

export { EntityCardAgent, type EntityCardAgentProps } from "./agent";
export { EntityCardAgentExpanded, type EntityCardAgentExpandedProps } from "./agent-expanded";
export { EntityCardAgentProfile, type EntityCardAgentProfileProps } from "./agent-profile";
export { EntityCardKnowledge, type EntityCardKnowledgeProps } from "./knowledge";
export { EntityCardObjectTile, type EntityCardObjectTileProps } from "./object-tile";
export {
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
export {
	EntityCardTemplate,
	type EntityCardTemplateProps,
	type EntityCardTemplateSkill,
} from "./template";
export { EntityCardTool, type EntityCardToolProps } from "./tool";

export const EntityCard = {
	Agent: EntityCardAgent,
	AgentExpanded: EntityCardAgentExpanded,
	AgentProfile: EntityCardAgentProfile,
	Knowledge: EntityCardKnowledge,
	ObjectTile: EntityCardObjectTile,
	Skill: EntityCardSkill,
	Tool: EntityCardTool,
	Template: EntityCardTemplate,
	Header: EntityCardHeader,
	Description: EntityCardDescription,
	Footer: EntityCardFooter,
	Stat: EntityCardStat,
	Byline: EntityCardByline,
	MoreButton: EntityCardMoreButton,
	Section: EntityCardSection,
	Banner: EntityCardBanner,
	Capabilities: EntityCardCapabilities,
} as const;
