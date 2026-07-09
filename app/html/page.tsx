"use client";

import { Suspense, createElement, use } from "react";
import { loadDemoComponent } from "@/components/website/demo-registry-loader";

function HtmlContent() {
	const Demo = use(loadDemoComponent("html", "projects"));
	if (!Demo) return null;
	return createElement(Demo);
}

export default function HtmlPage() {
	return (
		<Suspense>
			<HtmlContent />
		</Suspense>
	);
}
