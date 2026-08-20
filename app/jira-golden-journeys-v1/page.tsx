"use client";

import { Suspense, createElement, use } from "react";
import { loadDemoComponent } from "@/components/website/demo-registry-loader";

function JiraGoldenJourneysV1Content() {
	const Demo = use(loadDemoComponent("jira-golden-journeys-v1", "projects"));
	if (!Demo) return null;
	return createElement(Demo);
}

export default function JiraGoldenJourneysV1Page() {
	return (
		<Suspense>
			<JiraGoldenJourneysV1Content />
		</Suspense>
	);
}
