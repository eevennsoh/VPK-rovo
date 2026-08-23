"use client";

import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronLeftIcon from "@atlaskit/icon/core/chevron-left";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { FOCUS_RING_CLIP_GUTTER } from "@/components/ui/focus-ring";
import { cn } from "@/lib/utils";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { JIRA_GOLDEN_JOURNEYS_V3_STORY_CHAPTERS } from "./data/hotfix-story";
import { JIRA_GOLDEN_JOURNEYS_V3_TERMINAL_STEP_COUNT } from "./data/terminal-story";
import type { JiraGoldenJourneysV3StoryController } from "./use-hotfix-story";

export function JiraGoldenJourneysV3StoryControls({
	controller,
	terminalStep,
}: Readonly<{
	controller: JiraGoldenJourneysV3StoryController;
	terminalStep: number;
}>): React.ReactElement {
	return (
		<div
			className={cn(
				"scrollbar-none max-w-[calc(100vw-12rem)] overflow-x-auto",
				FOCUS_RING_CLIP_GUTTER,
			)}
		>
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
						{option.value === "terminal"
							? `${option.label} · ${terminalStep} of ${JIRA_GOLDEN_JOURNEYS_V3_TERMINAL_STEP_COUNT}`
							: option.label}
					</Button>
				))}
			</ButtonGroup>
		</div>
	);
}

export function JiraGoldenJourneysV3CompactStoryControls({
	controller,
}: Readonly<{ controller: JiraGoldenJourneysV3StoryController }>): React.ReactElement {
	const activeIndex = JIRA_GOLDEN_JOURNEYS_V3_STORY_CHAPTERS.findIndex(
		(option) => option.value === controller.chapter,
	);
	const activeChapter = JIRA_GOLDEN_JOURNEYS_V3_STORY_CHAPTERS[activeIndex];
	const previousChapter = JIRA_GOLDEN_JOURNEYS_V3_STORY_CHAPTERS[activeIndex - 1];
	const nextChapter = JIRA_GOLDEN_JOURNEYS_V3_STORY_CHAPTERS[activeIndex + 1];

	return (
		<div className="flex items-center text-sm text-text">
			<Button
				type="button"
				variant="outline"
				size="icon-compact"
				className="mr-2"
				aria-label="Previous chapter"
				onClick={() => previousChapter ? controller.selectChapter(previousChapter.value) : undefined}
				disabled={!previousChapter}
			>
				<ChevronLeftIcon label="" size="small" />
			</Button>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<button
							type="button"
							className="mr-2 flex items-center gap-1 rounded-sm px-1 py-0.5 text-text outline-none hover:text-text-subtle focus-visible:ring-2 focus-visible:ring-ring/50"
							aria-label="Jump to chapter"
						/>
					}
				>
					<span>{activeChapter?.label ?? "Chapter"}</span>
					<ChevronDownIcon label="" size="small" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="center" portalled={false}>
					{JIRA_GOLDEN_JOURNEYS_V3_STORY_CHAPTERS.map((option) => (
						<DropdownMenuItem
							key={option.value}
							selected={option.value === controller.chapter}
							onSelect={() => controller.selectChapter(option.value)}
						>
							{option.label}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
			<Button
				type="button"
				variant="outline"
				size="icon-compact"
				aria-label="Next chapter"
				onClick={() => nextChapter ? controller.selectChapter(nextChapter.value) : undefined}
				disabled={!nextChapter}
			>
				<ChevronRightIcon label="" size="small" />
			</Button>
		</div>
	);
}
