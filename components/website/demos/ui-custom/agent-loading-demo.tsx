"use client";

import { useState } from "react";

import {
	AgentLoading,
	type AgentLoadingAgent,
} from "@/components/ui-custom/agent-loading";
import { Button } from "@/components/ui/button";

const ACTIVE_AGENTS: readonly AgentLoadingAgent[] = [
	{
		id: "cursor",
		name: "Cursor",
		status: "working",
		avatar: { brandName: "cursor" },
	},
	{
		id: "jira-coding-agent",
		name: "Jira Coding agent",
		status: "working",
		avatar: {
			avatarSrc: "/avatar-agent/dev-agents/basic-coding-agent-template.svg",
		},
	},
	{
		id: "rovo",
		name: "Rovo",
		status: "working",
		avatar: { vpkLogo: "rovo" },
	},
] as const;

function withFinishedStatus(finished: boolean): readonly AgentLoadingAgent[] {
	return ACTIVE_AGENTS.map((agent) => ({
		...agent,
		status: finished ? "finished" : agent.status,
	}));
}

export default function AgentLoadingDemo() {
	const [finished, setFinished] = useState(false);

	return (
		<div className="flex flex-col items-start gap-4">
			<AgentLoading
				agents={withFinishedStatus(finished)}
				label={finished ? "Completed" : "Needs input…"}
			/>
			<Button onClick={() => setFinished((current) => !current)} size="compact" variant="outline">
				{finished ? "Resume agents" : "Finish all agents"}
			</Button>
		</div>
	);
}

export function AgentLoadingDemoFinished() {
	return <AgentLoading agents={withFinishedStatus(true)} label="Completed" />;
}

export function AgentLoadingDemoSmall() {
	return <AgentLoading agents={withFinishedStatus(false)} label="Needs input…" size="small" />;
}
