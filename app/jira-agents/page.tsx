"use client";

import { Suspense, createElement, use } from "react";
import { loadDemoComponent } from "@/components/website/demo-registry-loader";

function JiraAgentsContent() {
	const Demo = use(loadDemoComponent("jira-agents", "projects"));
	if (!Demo) return null;
	return createElement(Demo);
}

export default function JiraAgentsPage() {
	return (
		<Suspense>
			<JiraAgentsContent />
		</Suspense>
	);
}
