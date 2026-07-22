"use client";

import { Suspense, createElement, use } from "react";
import { loadDemoComponent } from "@/components/website/demo-registry-loader";

function JgpContent() {
	const Demo = use(loadDemoComponent("jira-golden-paths", "projects"));
	if (!Demo) return null;
	return createElement(Demo);
}

export default function JgpPage() {
	return (
		<Suspense>
			<JgpContent />
		</Suspense>
	);
}
