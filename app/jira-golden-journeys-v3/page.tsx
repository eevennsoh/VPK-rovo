"use client";

import { Suspense, createElement, use } from "react";
import { loadDemoComponent } from "@/components/website/demo-registry-loader";

function JiraGoldenJourneysV3Content() {
	const Demo = use(loadDemoComponent("jira-golden-journeys-v3", "projects"));
	if (!Demo) return null;
	return createElement(Demo);
}

export default function JiraGoldenJourneysV3Page() {
	return (
		<Suspense>
			<JiraGoldenJourneysV3Content />
		</Suspense>
	);
}
