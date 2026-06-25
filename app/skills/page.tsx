"use client";

import { Suspense, createElement, use } from "react";
import { loadDemoComponent } from "@/components/website/demo-registry-loader";

function SkillsContent() {
	const Demo = use(loadDemoComponent("skills", "projects"));
	if (!Demo) return null;
	return createElement(Demo);
}

export default function SkillsPage() {
	return (
		<div className="flex h-dvh min-h-0 w-full overflow-hidden">
			<Suspense>
				<SkillsContent />
			</Suspense>
		</div>
	);
}
