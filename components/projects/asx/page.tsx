"use client";

import { useCallback, useState } from "react";

import { useRovoChat } from "@/app/contexts";
import { RovoChatProvider } from "@/app/contexts/context-rovo-chat";
import { Gallery, type GalleryItem } from "@/components/blocks/gallery";
import JiraListPage from "@/components/blocks/jira-list/page";
import { useAutoCycle } from "@/components/projects/asx/hooks/use-auto-cycle";
import { ASX_CHAT_AGENT_PROFILES } from "./data/agent-chat-data";
import { ASX_GALLERY_ITEMS } from "./data/gallery-items";
import { ASX_CARD_KANBAN_STATES } from "./data/card-kanban-data";
import { CardKanbanControls, CardKanbanStage } from "./components/card-kanban-stage";
import { KanbanStage } from "./components/kanban-stage";
import { QueueStage } from "./components/queue-stage";
import { RovoStage } from "./components/rovo-stage";
import { TerminalControls, TerminalStage } from "./components/terminal-stage";
import { useTerminalDemo, type TerminalDemoController } from "./hooks/use-terminal-demo";
import {
	useWorkItemStageController,
	WorkItemControls,
	WorkItemStage,
	type WorkItemStageController,
} from "./components/work-item-stage";

// ---------------------------------------------------------------------------
// ASX — Agent Sessions Experience
//
// The gallery dock is the base surface: each card is a design pattern for the
// agent sessions experience. Selecting a card reveals its design in the gallery
// stage via `renderSelectedItem`. Card Kanban shows a jira-issue card, while
// Kanban, List, and Queue show their full Jira experiences, and Rovo reuses the
// sidebar-chat project as an in-stage chat panel. The remaining patterns fall
// back to a large title placeholder.
// ---------------------------------------------------------------------------

function ListStage(): React.ReactElement {
	return (
		<div className="relative left-1/2 flex h-full min-h-0 w-screen -translate-x-1/2 flex-col justify-center px-8 pb-28">
			<JiraListPage />
		</div>
	);
}

function renderAsxItem(
	item: (typeof ASX_GALLERY_ITEMS)[number],
	cardKanbanController: ReturnType<typeof useAutoCycle>,
	workItemController: WorkItemStageController,
	terminalController: TerminalDemoController,
): React.ReactNode {
	if (item.id === "card") return <CardKanbanStage controller={cardKanbanController} />;
	if (item.id === "kanban") return <KanbanStage />;
	if (item.id === "list") return <ListStage />;
	if (item.id === "queue") return <QueueStage />;
	if (item.id === "work-item") return <WorkItemStage controller={workItemController} />;
	if (item.id === "terminal") return <TerminalStage controller={terminalController} />;
	if (item.id === "rovo") return <RovoStage />;

	return (
		<div className="flex h-full w-full items-center justify-center">
			<h2 className="text-center font-semibold text-4xl tracking-tight text-text sm:text-6xl">
				{item.title}
			</h2>
		</div>
	);
}

function AsxGallery(): React.ReactElement {
	const [selectedId, setSelectedId] = useState(ASX_GALLERY_ITEMS[0]?.id ?? "");
	const { resetChat } = useRovoChat();
	const cardKanbanController = useAutoCycle(ASX_CARD_KANBAN_STATES.length);
	const workItemController = useWorkItemStageController();
	const terminalController = useTerminalDemo(selectedId === "terminal");
	const { restart: restartCardKanban } = cardKanbanController;
	const { restart: restartTerminal } = terminalController;
	const handleSelectedChange = useCallback((nextSelectedId: string) => {
		if (nextSelectedId === "card" && selectedId !== "card") {
			restartCardKanban();
		}
		if (nextSelectedId === "terminal" && selectedId !== "terminal") {
			restartTerminal();
		}
		// Open the sidebar chat at its greeting rather than inheriting whatever
		// conversation the shared ASX provider is holding (e.g. from the Kanban
		// or Card Kanban demos).
		if (nextSelectedId === "rovo" && selectedId !== "rovo") {
			resetChat();
		}
		setSelectedId(nextSelectedId);
	}, [resetChat, restartCardKanban, restartTerminal, selectedId]);
	// The gallery Reset control remounts the selected stage's view, but the
	// terminal demo's state is hoisted here (in `useTerminalDemo`), so a remount
	// alone won't rewind it. Reset it explicitly when the terminal is active. The
	// sidebar chat's state lives in the shared provider (not the remounted view),
	// so reset it here too.
	const handleReset = useCallback((item: GalleryItem) => {
		if (item.id === "terminal") {
			restartTerminal();
		}
		if (item.id === "rovo") {
			resetChat();
		}
	}, [resetChat, restartTerminal]);
	const topBarCenter =
		selectedId === "card" ? (
			<CardKanbanControls controller={cardKanbanController} />
		) : selectedId === "work-item" ? (
			<WorkItemControls controller={workItemController} />
		) : selectedId === "terminal" ? (
			<TerminalControls controller={terminalController} />
		) : null;

	return (
		<div className="relative h-dvh w-full overflow-hidden bg-surface">
			<Gallery
				items={ASX_GALLERY_ITEMS}
				title="Agent Sessions Experience"
				selectedId={selectedId}
				onSelectedChange={handleSelectedChange}
				topBarCenter={topBarCenter}
				showTopBarBorder={selectedId === "queue"}
				onReset={handleReset}
				renderSelectedItem={(item) =>
					renderAsxItem(item, cardKanbanController, workItemController, terminalController)
				}
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
		<RovoChatProvider agentProfiles={ASX_CHAT_AGENT_PROFILES}>
			<AsxGallery />
		</RovoChatProvider>
	);
}
