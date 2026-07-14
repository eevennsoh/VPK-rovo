"use client";

import { Suspense, createElement, use } from "react";
import { loadDemoComponent } from "@/components/website/demo-registry-loader";

function AsxContent() {
	const Demo = use(loadDemoComponent("asx", "projects"));
	if (!Demo) return null;
	return createElement(Demo);
}

export default function AsxPage() {
	return (
		<Suspense>
			<AsxContent />
		</Suspense>
	);
}
