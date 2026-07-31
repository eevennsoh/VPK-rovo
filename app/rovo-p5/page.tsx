"use client";

import { Suspense, createElement, use } from "react";
import { loadDemoComponent } from "@/components/website/demo-registry-loader";

function RovoP5Content() {
	const Demo = use(loadDemoComponent("rovo-p5", "arts"));
	if (!Demo) return null;
	return createElement(Demo);
}

export default function RovoP5Page() {
	return (
		<Suspense>
			<RovoP5Content />
		</Suspense>
	);
}
