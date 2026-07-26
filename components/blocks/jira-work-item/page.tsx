"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import JiraWorkItem, { type JiraWorkItemVariant } from "./index";

export {
	JiraWorkItem,
	type JiraWorkItemProps,
	type JiraWorkItemVariant,
	type JiraWorkItemExperimentalPreset,
} from "./index";

export default function JiraWorkItemPage() {
	const [activeVariant, setActiveVariant] = useState<JiraWorkItemVariant | null>(null);

	if (activeVariant) {
		return (
			<JiraWorkItem
				key={activeVariant}
				initialIssueOpen
				variant={activeVariant}
				initialExperimentalPreset="filled"
				onIssueClose={() => setActiveVariant(null)}
			/>
		);
	}

	return (
		<div className="flex h-full min-h-screen items-center justify-center gap-3 p-4">
			<Button type="button" variant="outline" onClick={() => setActiveVariant("default")}>
				Open standard session
			</Button>
			<Button type="button" onClick={() => setActiveVariant("experimental")}>
				Open experimental session
			</Button>
		</div>
	);
}

export function JiraWorkItemExperimentalPage() {
	return <JiraWorkItem variant="experimental" initialExperimentalPreset="filled" />;
}
