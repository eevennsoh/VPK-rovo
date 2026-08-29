"use client";

import { Suspense, createElement, use } from "react";
import { loadDemoComponent } from "@/components/website/demo-registry-loader";

function JiraGoldenJourneysV4Content() {
	const Demo = use(loadDemoComponent("jira-golden-journeys-v4", "projects"));
	if (!Demo) return null;
	return createElement(Demo);
}

export default function JiraGoldenJourneysV4Page() {
	return (
		<Suspense>
			<JiraGoldenJourneysV4Content />
		</Suspense>
	);
}
