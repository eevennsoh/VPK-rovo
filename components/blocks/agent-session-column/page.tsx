"use client";

import ExperimentalJiraKanbanPage from "@/components/blocks/jira-kanban/experimental/page";

import { AgentSessionColumnPanelDemo } from "./agent-session-column-panel-demo";

function DemoSection({
	label,
	children,
}: Readonly<{ label: string; children: React.ReactNode }>) {
	return (
		<div className="flex flex-col gap-3">
			<span className="text-xs font-medium text-text-subtlest">{label}</span>
			{children}
		</div>
	);
}

export default function AgentSessionColumnPage() {
	return (
		<div className="flex h-full w-full flex-col gap-10 bg-surface p-6">
			<DemoSection label="Panel">
				<AgentSessionColumnPanelDemo />
			</DemoSection>
			<DemoSection label="Kanban board">
				<div className="min-h-[560px] h-[640px] overflow-hidden">
					<ExperimentalJiraKanbanPage
						agentSessionPresentation="column"
						insightsEnabled={false}
						showAgentSessionColumn
					/>
				</div>
			</DemoSection>
		</div>
	);
}
