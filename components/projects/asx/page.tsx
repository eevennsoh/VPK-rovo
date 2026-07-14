"use client";

import { useState } from "react";

import { RovoChatProvider } from "@/app/contexts/context-rovo-chat";
import { Gallery } from "@/components/blocks/gallery";
import JiraListPage from "@/components/blocks/jira-list/page";
import { useAutoCycle } from "@/components/projects/asx/hooks/use-auto-cycle";
import { ASX_GALLERY_ITEMS } from "./data/gallery-items";
import { ASX_CARD_KANBAN_STATES } from "./data/card-kanban-data";
import { CardKanbanControls, CardKanbanStage } from "./components/card-kanban-stage";
import { KanbanStage } from "./components/kanban-stage";
import { QueueStage } from "./components/queue-stage";

// ---------------------------------------------------------------------------
// ASX — Agent Sessions Experience
//
// The gallery dock is the base surface: each card is a design pattern for the
// agent sessions experience. Selecting a card reveals its design in the gallery
// stage via `renderSelectedItem`. Card Kanban shows a jira-issue card, while
// Kanban, List, and Queue show their full Jira experiences. The remaining
// patterns fall back to a large title placeholder.
// ---------------------------------------------------------------------------

function ListStage(): React.ReactElement {
	return (
		<div className="relative left-1/2 flex h-full min-h-0 w-screen -translate-x-1/2 flex-col px-8">
			<JiraListPage />
		</div>
	);
}

function renderAsxItem(
	item: (typeof ASX_GALLERY_ITEMS)[number],
	cardKanbanController: ReturnType<typeof useAutoCycle>,
): React.ReactNode {
	if (item.id === "card") return <CardKanbanStage controller={cardKanbanController} />;
	if (item.id === "kanban") return <KanbanStage />;
	if (item.id === "list") return <ListStage />;
	if (item.id === "queue") return <QueueStage />;

	return (
		<h2 className="text-center font-semibold text-4xl tracking-tight text-text sm:text-6xl">
			{item.title}
		</h2>
	);
}

function AsxGallery(): React.ReactElement {
	const [selectedId, setSelectedId] = useState(ASX_GALLERY_ITEMS[0]?.id ?? "");
	const cardKanbanController = useAutoCycle(ASX_CARD_KANBAN_STATES.length);

	return (
		<div className="relative h-dvh w-full overflow-hidden bg-surface">
			<Gallery
				items={ASX_GALLERY_ITEMS}
				selectedId={selectedId}
				onSelectedChange={setSelectedId}
				topBarCenter={
					selectedId === "card" ? (
						<CardKanbanControls controller={cardKanbanController} />
					) : null
				}
				renderSelectedItem={(item) => renderAsxItem(item, cardKanbanController)}
			/>
		</div>
	);
}

export default function AsxPage(): React.ReactElement {
	return (
		// The provider lives here (not only in the /asx route layout) so the demo
		// works on every render path — the standalone route, the catalog
		// (`/components/projects/asx`), and preview (`/preview/projects/asx`).
		// CardKanbanStage and KanbanStage use Rovo chat, which throws without it.
		<RovoChatProvider>
			<AsxGallery />
		</RovoChatProvider>
	);
}
