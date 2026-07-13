"use client";

import { JiraIssue } from "@/components/blocks/jira-issue";

const JIRA_ISSUE_DEMO_TAGS = [
	{ text: "Acmecorp", color: "discovery" },
	{ text: "qualification", color: "blue" },
	{ text: "enterprise", color: "discovery" },
] as const;

export default function JiraIssuePage(): React.ReactElement {
	return (
		<div className="flex h-full min-h-[360px] w-full items-center justify-center bg-surface p-6">
			<JiraIssue
				assigneeAvatarSrc="/avatar-user/andrea-wilson/color/asow-service-yellow.png"
				className="w-full max-w-[464px]"
				issueKey="RFP-101"
				priority="major"
				summary="Acmecorp: Prepare for bid recommendation for ESM RFP"
				tags={JIRA_ISSUE_DEMO_TAGS}
			/>
		</div>
	);
}

export { JiraIssue } from "@/components/blocks/jira-issue";
export type { JiraIssuePriority, JiraIssueProps, JiraIssueTag } from "@/components/blocks/jira-issue";
