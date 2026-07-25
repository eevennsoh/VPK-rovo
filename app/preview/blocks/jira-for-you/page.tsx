"use client";

import { RovoChatProvider } from "@/app/contexts/context-rovo-chat";
import { JiraForYouShell } from "@/components/blocks/jira-for-you/page";

export default function JiraForYouPreviewPage() {
	return (
		<RovoChatProvider>
			<JiraForYouShell />
		</RovoChatProvider>
	);
}
