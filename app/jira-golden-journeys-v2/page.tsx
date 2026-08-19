"use client";

import { Suspense, createElement, use } from "react";
import { loadDemoComponent } from "@/components/website/demo-registry-loader";

function JiraGoldenJourneysV2Content() {
	const Demo = use(loadDemoComponent("jira-golden-journeys-v2", "projects"));
	if (!Demo) return null;
	return createElement(Demo);
}

export default function JiraGoldenJourneysV2Page() {
	return (
		<Suspense>
			<JiraGoldenJourneysV2Content />
		</Suspense>
	);
}
