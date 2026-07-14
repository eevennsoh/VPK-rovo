"use client";

import { useState, type ReactElement } from "react";

import { JiraEpic } from "@/components/blocks/jira-epic";
import { JIRA_EPIC_DEMO_EPICS } from "@/components/blocks/jira-epic/data/demo-epics";

export default function JiraEpicPage(): ReactElement {
	const [selectedEpicId, setSelectedEpicId] = useState<string | null>("agentic-jira");

	function handleAddParent() {
		setSelectedEpicId("work-pals");
	}

	function handleRemoveParent() {
		setSelectedEpicId(null);
	}

	return (
		<div className="flex h-full min-h-[360px] w-full items-center justify-center bg-surface p-6">
			<div className="w-[320px] rounded-lg border border-border bg-surface p-4">
				<JiraEpic
					epics={JIRA_EPIC_DEMO_EPICS}
					onAddParent={handleAddParent}
					onEpicSelect={setSelectedEpicId}
					onRemoveParent={handleRemoveParent}
					onViewParent={() => undefined}
					selectedEpicId={selectedEpicId}
				/>
			</div>
		</div>
	);
}

export { JiraEpic } from "@/components/blocks/jira-epic";
export type { JiraEpicColor, JiraEpicOption, JiraEpicProps } from "@/components/blocks/jira-epic";
