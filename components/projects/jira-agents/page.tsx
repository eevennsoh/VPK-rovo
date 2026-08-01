"use client";

import { Gallery } from "@/components/blocks/gallery";
import { JIRA_AGENTS_GALLERY_ITEMS } from "./data/gallery-items";

export default function JiraAgentsPage(): React.ReactElement {
	return (
		<div className="relative h-dvh w-full overflow-hidden bg-surface">
			<Gallery items={JIRA_AGENTS_GALLERY_ITEMS} stagePosition="center" title="Jira Agents" />
		</div>
	);
}
