"use client";

import {
	EntityCard,
	type EntityCardAgentProfileProps,
} from "@/components/ui-custom/entity-card";

export type AgentProfileCardProps = EntityCardAgentProfileProps;

function AgentProfileCard(props: Readonly<AgentProfileCardProps>) {
	return <EntityCard.AgentProfile {...props} />;
}

export { AgentProfileCard };
