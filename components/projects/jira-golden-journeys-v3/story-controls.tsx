"use client";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { JIRA_GOLDEN_JOURNEYS_V3_STORY_CHAPTERS } from "./data/hotfix-story";
import type { JiraGoldenJourneysV3StoryController } from "./use-hotfix-story";

export function JiraGoldenJourneysV3StoryControls({
	controller,
}: Readonly<{ controller: JiraGoldenJourneysV3StoryController }>): React.ReactElement {
	return (
		<div className="scrollbar-none max-w-[calc(100vw-12rem)] overflow-x-auto">
			<ButtonGroup
				aria-label="Open a software delivery story chapter"
				className="w-max [&>[data-slot]~[data-slot]]:-ml-px [&>[data-slot]~[data-slot]]:border-l!"
				variant="connected"
			>
				{JIRA_GOLDEN_JOURNEYS_V3_STORY_CHAPTERS.map((option) => (
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
		</div>
	);
}
