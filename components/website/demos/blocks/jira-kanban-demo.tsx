"use client";

import Page from "@/components/blocks/jira-kanban/page";
import ExperimentalPage from "@/components/blocks/jira-kanban/experimental/page";
import ExperimentalV2Page from "@/components/blocks/jira-kanban/experimental-v2/page";

export default function JiraKanbanDemo() {
	return <Page />;
}

export function JiraKanbanDemoStandard() {
	return <Page />;
}

export function JiraKanbanDemoExperimental() {
	return <ExperimentalPage />;
}

export function JiraKanbanDemoExperimentalV2() {
	return <ExperimentalV2Page />;
}
