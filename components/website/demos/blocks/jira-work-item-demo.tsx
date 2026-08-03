"use client";

import JiraWorkItem from "@/components/blocks/jira-work-item";
import JiraWorkItemPage from "@/components/blocks/jira-work-item/page";

export default function JiraWorkItemDemo() {
	return <JiraWorkItemPage />;
}

export function JiraWorkItemDemoStandard() {
	return <JiraWorkItem variant="default" />;
}

export function JiraWorkItemDemoExperimental() {
	return <JiraWorkItem variant="experimental" initialExperimentalPreset="filled" />;
}

export function JiraWorkItemDemoExperimentalEmpty() {
	return <JiraWorkItem variant="experimental" initialExperimentalPreset="empty" />;
}

export function JiraWorkItemDemoExperimentalRunning() {
	return <JiraWorkItem variant="experimental" initialExperimentalPreset="running" />;
}

export function JiraWorkItemDemoExperimentalV2() {
	return <JiraWorkItem variant="experimental-v2" initialExperimentalPreset="filled" />;
}

export function JiraWorkItemDemoExperimentalV2Empty() {
	return <JiraWorkItem variant="experimental-v2" initialExperimentalPreset="empty" />;
}

export function JiraWorkItemDemoExperimentalV2Running() {
	return <JiraWorkItem variant="experimental-v2" initialExperimentalPreset="running" />;
}
