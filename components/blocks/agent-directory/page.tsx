"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
	AgentsDirectoryDialog,
	type AgentsDirectoryAgent,
	type AgentsDirectoryVariant,
} from "@/components/blocks/agent-directory";
import { DEMO_AGENT_BROWSER_AGENTS } from "@/app/data/directory/agents";

const DEMO_SESSION_AGENTS: readonly AgentsDirectoryAgent[] = [
	{
		id: "workflow-synthesizer",
		name: "Workflow Synthesizer",
		byline: "Workflow design by Revenue Operations",
		attributionKind: "team",
		avatarSrc: "/avatar-agent/teamwork-agents/progress-tracker.svg",
		description: "Turns scattered requests into durable operating workflows.",
		rating: 4.7,
		feedbackCount: 428,
		chatCount: 8400,
		verified: true,
	},
	{
		id: "research-brief-writer",
		name: "Research Brief Writer",
		byline: "Research synthesis by Alex Kim",
		attributionKind: "person",
		avatarSrc: "/avatar-agent/teamwork-agents/wildcard-3.svg",
		description: "Condenses long research inputs into crisp team-ready briefs.",
		rating: 4.5,
		feedbackCount: 214,
		chatCount: 3600,
		verified: false,
	},
];

export default function AgentsDirectoryPage() {
	const [open, setOpen] = useState(false);
	const [variant, setVariant] = useState<AgentsDirectoryVariant>("default");

	function openDirectory(nextVariant: AgentsDirectoryVariant) {
		setVariant(nextVariant);
		setOpen(true);
	}

	function handleSelectAgent() {
		setOpen(false);
	}

	return (
		<div className="flex h-full min-h-[400px] items-center justify-center gap-3 p-4">
			<Button onClick={() => openDirectory("default")} variant="outline">
				Open standard directory
			</Button>
			<Button onClick={() => openDirectory("experimental")}>
				Open experimental directory
			</Button>
			<AgentsDirectoryDialog
				open={open}
				onOpenChange={setOpen}
				agents={DEMO_AGENT_BROWSER_AGENTS}
				sessionAgents={DEMO_SESSION_AGENTS}
				onSelectAgent={handleSelectAgent}
				onSelectTemplateAgent={handleSelectAgent}
				variant={variant}
			/>
		</div>
	);
}

export function AgentsDirectoryExperimentalPage() {
	const [open, setOpen] = useState(false);

	return (
		<AgentsDirectoryPageShell
			open={open}
			onOpenChange={setOpen}
			variant="experimental"
		/>
	);
}

function AgentsDirectoryPageShell({
	open,
	onOpenChange,
	variant,
}: Readonly<{
	open: boolean;
	onOpenChange: (open: boolean) => void;
	variant?: AgentsDirectoryVariant;
}>) {
	function handleSelectAgent() {
		onOpenChange(false);
	}

	return (
		<div className="flex h-full min-h-[400px] items-center justify-center p-4">
			<Button onClick={() => onOpenChange(true)}>
				{variant === "experimental" ? "Open experimental directory" : "Open standard directory"}
			</Button>
			<AgentsDirectoryDialog
				open={open}
				onOpenChange={onOpenChange}
				agents={DEMO_AGENT_BROWSER_AGENTS}
				sessionAgents={DEMO_SESSION_AGENTS}
				onSelectAgent={handleSelectAgent}
				onSelectTemplateAgent={handleSelectAgent}
				variant={variant}
			/>
		</div>
	);
}
