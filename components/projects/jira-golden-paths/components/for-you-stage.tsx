"use client";

import { JiraForYouShell } from "@/components/projects/jira-for-you/page";

export function ForYouStage(): React.ReactElement {
	return (
		<div className="relative left-1/2 h-full min-h-0 w-screen -translate-x-1/2 overflow-hidden">
			<JiraForYouShell shellHeight="parent" />
		</div>
	);
}
