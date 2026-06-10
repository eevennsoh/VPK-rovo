"use client";

import {
	EntityCard,
	type EntityCardAgentProfileProps,
} from "@/components/ui-custom/entity-card";

export type AgentCardProps = EntityCardAgentProfileProps;

function AgentCard(props: Readonly<AgentCardProps>) {
	return <EntityCard.AgentProfile {...props} />;
}

export { AgentCard };
