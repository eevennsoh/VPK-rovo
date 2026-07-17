"use client";

import { Suspense, createElement, use } from "react";
import { loadDemoComponent } from "@/components/website/demo-registry-loader";

function JiraQueueContent() {
	const Demo = use(loadDemoComponent("jira-queue", "projects"));
	if (!Demo) return null;
	return createElement(Demo);
}

export default function JiraQueuePage() {
	return (
		<Suspense>
			<JiraQueueContent />
		</Suspense>
	);
}
