"use client";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { JIRA_AGENTS_STORY_CHAPTERS } from "./data/hotfix-story";
import type { JiraAgentsStoryController } from "./use-hotfix-story";

export function JiraAgentsStoryControls({
	controller,
}: Readonly<{ controller: JiraAgentsStoryController }>): React.ReactElement {
	return (
		<ButtonGroup
			aria-label="Open a software delivery story chapter"
			className="[&>[data-slot]~[data-slot]]:-ml-px [&>[data-slot]~[data-slot]]:border-l!"
			variant="connected"
		>
			{JIRA_AGENTS_STORY_CHAPTERS.map((option) => (
				<Button
					aria-pressed={controller.chapter === option.value}
					className="aria-pressed:z-10"
					key={option.value}
					onClick={() => controller.selectChapter(option.value)}
					size="compact"
					type="button"
					variant="outline"
				>
					{option.label}
				</Button>
			))}
		</ButtonGroup>
	);
}
