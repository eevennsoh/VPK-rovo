"use client";

import ChatPanel from "@/components/projects/sidebar-chat/page";

/**
 * The "Rovo" design pattern for the Agent Sessions Experience gallery.
 *
 * Reuses the `components/projects/sidebar-chat` project verbatim — the same
 * `ChatPanel` (with smart widgets + sidebar smart generation) that the
 * standalone `/sidebar-chat` demo renders — shown as a bounded sidebar panel
 * in the gallery stage when the Rovo card is selected.
 *
 * Layout intent: the sidebar chat is a narrow, bounded panel. The gallery runs
 * this stage with the default `stagePosition="top"` (shared by the board/list/
 * terminal stages), so centering is done here. The pinned dock is treated as a
 * pure overlay — we do NOT reserve its footprint — so the panel is vertically
 * (and horizontally) centered within the full stage height as if the dock were
 * absent, with the dock's backdrop blur floating over the panel's lower edge.
 * A `max-h` keeps it reading as a floating sidebar card rather than stretching
 * edge-to-edge; `h-full` lets it shrink on short viewports. `ChatPanel` carries
 * its own raised surface + border + radius (see the sidebar-chat
 * `chatStyles.chatPanel`), so no extra chrome is needed here.
 *
 * The chat runs on the ASX-wide `RovoChatProvider` (see `../page.tsx`); the
 * gallery resets it when the Rovo card is entered so the panel opens at its
 * greeting instead of inheriting the Kanban demo's conversation.
 */
export function RovoStage(): React.ReactElement {
	return (
		<div className="flex h-full min-h-0 w-full items-center justify-center">
			<div className="flex h-full max-h-[680px] min-h-0 w-full max-w-[440px] flex-col">
				<ChatPanel
					onClose={() => {}}
					enableSmartWidgets
					sendPromptOptions={{
						smartGeneration: {
							enabled: true,
							surface: "sidebar",
						},
					}}
				/>
			</div>
		</div>
	);
}
