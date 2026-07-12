"use client";

import JiraWorkItemModal from "@/components/projects/jira/components/jira-work-item-modal";

function keepIssueViewOpen() {
	return undefined;
}

export function AgentSessions() {
	return (
		<div className="min-h-screen bg-bg-neutral">
			<JiraWorkItemModal isOpen onClose={keepIssueViewOpen} />
		</div>
	);
}

export default AgentSessions;
