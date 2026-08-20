"use client";

import { useEffect } from "react";

import { TerminalStage } from "@/components/projects/jira-golden-journeys-v1/components/terminal-stage";
import type { TerminalDemoController } from "@/components/projects/jira-golden-journeys-v1/hooks/use-terminal-demo";

export interface JiraGoldenJourneysV3TerminalStoryProps {
	controller: TerminalDemoController;
	resetKey?: number | string;
	theme?: "dark" | "light";
}

export function JiraGoldenJourneysV3TerminalStory({
	controller,
	resetKey,
	theme = "dark",
}: Readonly<JiraGoldenJourneysV3TerminalStoryProps>): React.ReactElement {
	const { restart } = controller;

	useEffect(() => {
		restart();
	}, [resetKey, restart]);

	return (
		<div
			className="relative left-1/2 h-full min-h-0 w-[100cqw] -translate-x-1/2 bg-surface"
			data-pr-number="1847"
			data-story-complete={controller.state.finished ? "true" : "false"}
			data-color-mode={theme}
			data-subtree-theme=""
			data-theme={`${theme}:${theme} spacing:spacing typography:typography shape:shape`}
		>
			<p className="sr-only" aria-live="polite">
				{controller.state.finished
					? "PR #1847 created. Priya Narayanan and Jordan Lee requested as reviewers. CI is running. Select Build to continue."
					: "Local Claude session for SHOP-4821."}
			</p>
			<TerminalStage controller={controller} />
		</div>
	);
}
