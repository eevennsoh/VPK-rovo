"use client";

import type { JiraForYouItem } from "@/components/blocks/jira-for-you";
import JiraForYouPage from "@/components/blocks/jira-for-you/page";
import { cn } from "@/lib/utils";

interface ForYouStageLayoutProps {
	dockOpen: boolean;
	onItemClick: (item: JiraForYouItem) => void;
}

/** Shared full-width Gallery stage layout for the Jira "For you" feed. */
export function ForYouStageLayout({
	dockOpen,
	onItemClick,
}: Readonly<ForYouStageLayoutProps>): React.ReactElement {
	return (
		<div className="relative left-1/2 h-full min-h-0 w-screen -translate-x-1/2 overflow-y-auto">
			<div className={cn("mx-auto w-full max-w-3xl px-6", dockOpen ? "pb-56" : "pb-8")}>
				<JiraForYouPage onItemClick={onItemClick} />
			</div>
		</div>
	);
}
