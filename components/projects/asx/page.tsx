"use client";

import { RovoChatProvider } from "@/app/contexts/context-rovo-chat";
import { Gallery } from "@/components/blocks/gallery";
import { ASX_GALLERY_ITEMS } from "./data/gallery-items";
import { KanbanStage } from "./components/kanban-stage";

// ---------------------------------------------------------------------------
// ASX — Agent Sessions Experience
//
// The gallery dock is the base surface: each card is a design pattern for the
// agent sessions experience. Selecting a card reveals its design in the gallery
// stage via `renderSelectedItem`. Kanban shows the real jira-kanban board; other
// patterns fall back to a large title placeholder until their design is added.
// ---------------------------------------------------------------------------

export default function AsxPage(): React.ReactElement {
	return (
		// The provider lives here (not only in the /asx route layout) so the demo
		// works on every render path — the standalone route, the catalog
		// (`/components/projects/asx`), and preview (`/preview/projects/asx`).
		// KanbanStage calls useRovoChat(), which throws without this provider.
		<RovoChatProvider>
			<div className="relative min-h-dvh w-full bg-surface">
				<Gallery
					items={ASX_GALLERY_ITEMS}
					renderSelectedItem={(item) =>
						item.id === "kanban" ? (
							<KanbanStage />
						) : (
							<h2 className="text-center font-semibold text-4xl tracking-tight text-text sm:text-6xl">
								{item.title}
							</h2>
						)
					}
				/>
			</div>
		</RovoChatProvider>
	);
}
