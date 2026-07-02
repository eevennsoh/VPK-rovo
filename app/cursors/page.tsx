"use client";

import { Suspense, createElement, use } from "react";
import { loadDemoComponent } from "@/components/website/demo-registry-loader";

function CursorsContent() {
	const Demo = use(loadDemoComponent("cursors", "arts"));
	if (!Demo) return null;
	return createElement(Demo);
}

export default function CursorsPage() {
	return (
		<Suspense>
			<CursorsContent />
		</Suspense>
	);
}
