"use client";

import { usePathname } from "next/navigation";

import { JiraForYouWorkspace } from "@/components/projects/jira-for-you";

export default function JiraForYouDemo() {
	const pathname = usePathname();
	const isStandalonePreview = pathname.startsWith("/preview/");

	if (isStandalonePreview) {
		return (
			<div className="h-full min-h-0 overflow-hidden rounded-lg border border-border bg-surface">
				<JiraForYouWorkspace chrome="plain" className="h-full min-h-0" />
			</div>
		);
	}

	return <JiraForYouWorkspace chrome="plain" className="h-full min-h-0" />;
}
