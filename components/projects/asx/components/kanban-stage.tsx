"use client";

import { AnimatePresence } from "motion/react";
import { JiraKanban } from "@/components/blocks/jira-kanban";
import { BOARD_AGENTS } from "@/components/projects/jira/data/board-agents";
import { BOARD_COLUMNS } from "@/components/projects/jira/data/board-data";
import FloatingRovoButton from "@/components/projects/shared/components/floating-rovo-button";
import RovoFloatingChat from "@/components/projects/rovo-floating-chat/components/rovo-floating-chat";
import { useRovoChat } from "@/app/contexts";

/**
 * The "Kanban" design pattern for the Agent Sessions Experience gallery.
 *
 * Reuses the real `components/blocks/jira-kanban` board verbatim (same sample
 * columns + agents as the block's own demo), shown read-only in the gallery
 * stage when the Kanban card is selected.
 *
 * Layout intent: the viewport is the container, and the board is sized as if the
 * gallery dock weren't there — it breaks out of the stage's centered `max-w-3xl`
 * column to span the full viewport width (`left-1/2 -translate-x-1/2 w-screen`)
 * and fills the full viewport height (top padding down to a small bottom margin).
 * The pinned dock then floats over the board's lower portion via its backdrop
 * blur (the gallery's "content flows under the dock" effect). The large negative
 * bottom margin cancels the stage's oversized `pb-80` so the taller board never
 * makes the page scroll. Columns flow to fill the width (no fixed width, so no
 * horizontal overflow / "scroll for more") and scroll their own cards.
 *
 * The arbitrary variants complete the board's flex-column height chain (its
 * shared root is only `flex-1 min-h-0`, so its inner section would otherwise
 * grow to content height) — scoped here so the /jira board and the block demo
 * keep their existing behavior.
 */
export function KanbanStage(): React.ReactElement {
	const { chatSurface } = useRovoChat();

	return (
		<div className="relative left-1/2 -mb-80 flex h-[calc(100dvh-6.5rem)] w-screen -translate-x-1/2 flex-col px-8 [&>div]:flex [&>div]:min-h-0 [&>div]:flex-col [&>div>section]:flex [&>div>section]:min-h-0">
			<JiraKanban boardColumns={BOARD_COLUMNS} agents={BOARD_AGENTS} paddingTop={0} />
			{chatSurface === null ? (
				<FloatingRovoButton
					ariaLabel="Open Rovo chat"
					forceVisible
					positioning="container"
					product="home"
				/>
			) : null}
			<AnimatePresence>
				{chatSurface === "floating" ? <RovoFloatingChat key="floating-chat" /> : null}
			</AnimatePresence>
		</div>
	);
}
