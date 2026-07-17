"use client";

import { useCallback, useState } from "react";

import { useRovoChat } from "@/app/contexts";
import { RovoChatProvider } from "@/app/contexts/context-rovo-chat";
import { Gallery, type GalleryItem } from "@/components/blocks/gallery";
import type { JiraForYouItem } from "@/components/blocks/jira-for-you";
import JiraForYouPage from "@/components/blocks/jira-for-you/page";
import JiraListPage from "@/components/blocks/jira-list/page";
import { useAsxAgentChatDemo } from "@/components/projects/asx/hooks/use-asx-agent-chat-demo";
import { useAutoCycle } from "@/components/projects/asx/hooks/use-auto-cycle";
import {
	ASX_CHAT_AGENT_PROFILES,
	buildAsxForYouAgentChatScenario,
} from "./data/agent-chat-data";
import { ASX_GALLERY_ITEMS } from "./data/gallery-items";
import { ASX_CARD_KANBAN_STATES } from "./data/card-kanban-data";
import { AgentSessionStage } from "./components/agent-session-stage";
import { AsxRovoOverlay } from "./components/asx-rovo-overlay";
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
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// ASX — Agent Sessions Experience
//
// The gallery dock is the base surface: each card is a design pattern for the
// agent sessions experience. Selecting a card reveals its design in the gallery
// stage via `renderSelectedItem`. Card Kanban shows a jira-issue card, while
// Kanban, List, and Queue show their full Jira experiences, For you shows the
// personalized jira-for-you feed, Rovo reuses the sidebar-chat project as an
// in-stage chat panel, and Agent session shows the jira-agent-session block. The
// remaining patterns fall back to a large title placeholder.
// ---------------------------------------------------------------------------

function ListStage(): React.ReactElement {
	return (
		<div className="relative left-1/2 flex h-full min-h-0 w-screen -translate-x-1/2 flex-col justify-center px-8 pb-28">
			<JiraListPage />
		</div>
	);
}

// The "For you" feed reads best as a constrained column, but the SCROLL should
// belong to the viewport, not the column — so the stage breaks out to full width
// (`w-screen`, the same trick the List/Queue stages use) and owns the
// `overflow-y-auto`, keeping the scrollbar on the viewport edge. The feed itself
// stays a centered `max-w-3xl` column inside the scroll area.
//
// Bottom clearance is only needed while the pinned dock is showing. Open, the
// dock overlays the bottom ~224px (tallest portrait tile 208px + 16px strip
// padding), so `pb-56` lets the final item scroll clear of it; closed, that pad
// is pure dead space, so we drop to a small `pb-8` breathing gap.
function ForYouStage({ dockOpen }: Readonly<{ dockOpen: boolean }>): React.ReactElement {
	const { chatContextBar, externalThinkingMessageId, openAgentChat } = useAsxAgentChatDemo();
	const handleItemClick = useCallback((item: JiraForYouItem) => {
		openAgentChat(buildAsxForYouAgentChatScenario(item));
	}, [openAgentChat]);

	return (
		<>
			<div className="relative left-1/2 h-full min-h-0 w-screen -translate-x-1/2 overflow-y-auto">
				<div className={cn("mx-auto w-full max-w-3xl px-6", dockOpen ? "pb-56" : "pb-8")}>
					<JiraForYouPage onItemClick={handleItemClick} />
				</div>
			</div>
			<AsxRovoOverlay
				chatContextBar={chatContextBar}
				externalThinkingMessageId={externalThinkingMessageId}
			/>
		</>
	);
}

function renderAsxItem(
	item: (typeof ASX_GALLERY_ITEMS)[number],
	cardKanbanController: ReturnType<typeof useAutoCycle>,
	workItemController: WorkItemStageController,
	terminalController: TerminalDemoController,
	dockOpen: boolean,
): React.ReactNode {
	if (item.id === "card") return <CardKanbanStage controller={cardKanbanController} />;
	if (item.id === "kanban") return <KanbanStage />;
	if (item.id === "list") return <ListStage />;
	if (item.id === "queue") return <QueueStage />;
	if (item.id === "work-item") return <WorkItemStage controller={workItemController} />;
	if (item.id === "terminal") return <TerminalStage controller={terminalController} />;
	if (item.id === "rovo") return <RovoStage />;
	if (item.id === "for-you") return <ForYouStage dockOpen={dockOpen} />;
	if (item.id === "agent-session") return <AgentSessionStage />;

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
	// The dock's open state is controlled here so stages can react to it — the
	// "For you" feed drops its dock clearance padding when the dock is hidden.
	const [dockOpen, setDockOpen] = useState(true);
	const { resetChat, resetAgentToRovo } = useRovoChat();
	const cardKanbanController = useAutoCycle(ASX_CARD_KANBAN_STATES.length);
	const workItemController = useWorkItemStageController();
	const terminalController = useTerminalDemo(selectedId === "terminal");
	const { restart: restartCardKanban } = cardKanbanController;
	const { restart: restartTerminal } = terminalController;
	// Show the default Rovo sidebar-chat experience when entering/resetting the
	// Rovo card, regardless of what the shared ASX provider is currently holding.
	// The Kanban/Card Kanban demos select an ASX scenario agent (e.g. RFP
	// Drafter) on this same provider; `resetChat()` alone only clears the
	// transcript, leaving that stale agent selected so the greeting shows the
	// wrong (often starter-less) agent. `resetAgentToRovo()` restores the default
	// Rovo agent (it early-returns when already on Rovo, so it can't clear the
	// chat on its own), and `resetChat()` always rewinds to the greeting.
	const resetRovoSurface = useCallback(() => {
		resetAgentToRovo();
		resetChat();
	}, [resetAgentToRovo, resetChat]);
	const handleSelectedChange = useCallback((nextSelectedId: string) => {
		if (nextSelectedId === "card" && selectedId !== "card") {
			restartCardKanban();
		}
		if (nextSelectedId === "terminal" && selectedId !== "terminal") {
			restartTerminal();
		}
		if (nextSelectedId === "rovo" && selectedId !== "rovo") {
			resetRovoSurface();
		}
		setSelectedId(nextSelectedId);
	}, [resetRovoSurface, restartCardKanban, restartTerminal, selectedId]);
	// The gallery Reset control remounts the selected stage's view, but the
	// terminal demo's state is hoisted here (in `useTerminalDemo`), so a remount
	// alone won't rewind it. Reset it explicitly when the terminal is active. The
	// sidebar chat's agent + transcript live in the shared provider (not the
	// remounted view), so reset those here too.
	const handleReset = useCallback((item: GalleryItem) => {
		if (item.id === "terminal") {
			restartTerminal();
		}
		if (item.id === "rovo") {
			resetRovoSurface();
		}
	}, [resetRovoSurface, restartTerminal]);
	const topBarCenter =
		selectedId === "card" ? (
			<CardKanbanControls controller={cardKanbanController} />
		) : selectedId === "work-item" ? (
			<WorkItemControls controller={workItemController} />
		) : selectedId === "terminal" ? (
			<TerminalControls controller={terminalController} />
		) : null;

	// The Terminal pattern is a full dark-mode experience: the terminal frame is
	// already dark (hardcoded zinc), so we flip the surrounding gallery chrome
	// (top bar, dock, background) to dark too via ADS subtree theming. Every
	// semantic token in the subtree resolves to its dark value — no `dark:`
	// utilities or hardcoded colors. The dock strip is `position: fixed` but
	// still a DOM descendant of this root, so the theme cascades to it.
	const isTerminal = selectedId === "terminal";
	const subtreeThemeProps = isTerminal
		? {
				"data-subtree-theme": "",
				"data-color-mode": "dark",
				"data-theme": "dark:dark spacing:spacing typography:typography shape:shape",
			}
		: {};

	return (
		<div className="relative h-dvh w-full overflow-hidden bg-surface" {...subtreeThemeProps}>
			<Gallery
				items={ASX_GALLERY_ITEMS}
				title="Agent Sessions Experience"
				selectedId={selectedId}
				onSelectedChange={handleSelectedChange}
				open={dockOpen}
				onOpenChange={setDockOpen}
				topBarCenter={topBarCenter}
				showTopBarBorder={selectedId === "queue"}
				onReset={handleReset}
				renderSelectedItem={(item) =>
					renderAsxItem(item, cardKanbanController, workItemController, terminalController, dockOpen)
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
