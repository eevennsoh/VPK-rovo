"use client";

import { JiraIssue } from "@/components/blocks/jira-issue";

const DEMO_TAGS = [
	{ text: "Acmecorp", color: "discovery" },
	{ text: "qualification", color: "blue" },
	{ text: "enterprise", color: "discovery" },
] as const;

export default function JiraIssueDemo() {
	return (
		<div className="flex w-full justify-center p-6">
			<JiraIssue
				assigneeAvatarSrc="/avatar-user/andrea-wilson/color/asow-service-yellow.png"
				className="w-full max-w-[464px]"
				issueKey="RFP-101"
				priority="major"
				summary="Acmecorp: Prepare for bid recommendation for ESM RFP"
				tags={DEMO_TAGS}
			/>
		</div>
	);
}
