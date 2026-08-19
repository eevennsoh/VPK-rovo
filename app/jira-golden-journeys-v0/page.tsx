"use client";

import { Suspense, createElement, use } from "react";
import { loadDemoComponent } from "@/components/website/demo-registry-loader";

function JiraGoldenJourneysV0Content() {
	const Demo = use(loadDemoComponent("jira-golden-journeys-v0", "projects"));
	if (!Demo) return null;
	return createElement(Demo);
}

export default function JiraGoldenJourneysV0Page() {
	return (
		<Suspense>
			<JiraGoldenJourneysV0Content />
		</Suspense>
	);
}
