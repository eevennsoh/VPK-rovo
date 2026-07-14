"use client";

import { RovoChatProvider } from "@/app/contexts/context-rovo-chat";
import { Gallery } from "@/components/blocks/gallery";
import JiraListPage from "@/components/blocks/jira-list/page";
import { ASX_GALLERY_ITEMS } from "./data/gallery-items";
import { CardKanbanStage } from "./components/card-kanban-stage";
import { KanbanStage } from "./components/kanban-stage";

// ---------------------------------------------------------------------------
// ASX — Agent Sessions Experience
//
// The gallery dock is the base surface: each card is a design pattern for the
// agent sessions experience. Selecting a card reveals its design in the gallery
// stage via `renderSelectedItem`. Card Kanban shows a jira-issue card, while
// Kanban and List show their full Jira blocks. The remaining patterns fall back
// to a large title placeholder.
// ---------------------------------------------------------------------------

function ListStage(): React.ReactElement {
	return (
		<div className="relative left-1/2 -mb-80 flex h-[calc(100dvh-6.5rem)] w-screen -translate-x-1/2 flex-col px-8">
			<JiraListPage />
		</div>
	);
}

function renderAsxItem(item: (typeof ASX_GALLERY_ITEMS)[number]): React.ReactNode {
	if (item.id === "card") return <CardKanbanStage />;
	if (item.id === "kanban") return <KanbanStage />;
	if (item.id === "list") return <ListStage />;

	return (
		<h2 className="text-center font-semibold text-4xl tracking-tight text-text sm:text-6xl">
			{item.title}
		</h2>
	);
}

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
					renderSelectedItem={renderAsxItem}
				/>
			</div>
		</RovoChatProvider>
	);
}
