"use client";

import { JiraKanban } from "@/components/blocks/jira-kanban";
import { BOARD_AGENTS } from "@/components/projects/jira/data/board-agents";
import { BOARD_COLUMNS } from "@/components/projects/jira/data/board-data";
import { AsxRovoOverlay } from "./asx-rovo-overlay";

/**
 * The "Kanban" design pattern for the Agent Sessions Experience gallery.
 *
 * Reuses the real `components/blocks/jira-kanban` board verbatim (same sample
 * columns + agents as the block's own demo), shown read-only in the gallery
 * stage when the Kanban card is selected.
 *
 * Layout intent: the Gallery viewport is the container. The board breaks out of
 * the stage's centered `max-w-3xl` column to span the full viewport width
 * (`left-1/2 -translate-x-1/2 w-screen`) and fills the available stage height.
 * The pinned dock floats over the board's lower portion via its backdrop blur
 * (the gallery's "content flows under the dock" effect). Columns flow to fill
 * the width and scroll their own cards.
 *
 * The arbitrary variants complete the board's flex-column height chain (its
 * shared root is only `flex-1 min-h-0`, so its inner section would otherwise
 * grow to content height) — scoped here so the /jira board and the block demo
 * keep their existing behavior.
 */
export function KanbanStage(): React.ReactElement {
	return (
		<div className="relative left-1/2 flex h-full min-h-0 w-screen -translate-x-1/2 flex-col px-8 [&>div]:flex [&>div]:min-h-0 [&>div]:flex-col [&>div>section]:flex [&>div>section]:min-h-0">
			<JiraKanban boardColumns={BOARD_COLUMNS} agents={BOARD_AGENTS} paddingTop={0} />
			<AsxRovoOverlay />
		</div>
	);
}
