"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { RovoChatProvider } from "@/app/contexts/context-rovo-chat";
import { Gallery, type GalleryItem, type GalleryPalette } from "@/components/blocks/gallery";
import { JGP_CHAT_AGENT_PROFILES } from "./data/agent-chat-data";
import { JGP_GALLERY_ITEMS } from "./data/gallery-items";
import {
	GLOBAL_SESSION_SCREENS,
	LOCAL_SESSION_SCREENS,
	type SessionScreen,
} from "./data/session-screens";
import {
	useScreenNavigator,
	type ScreenNavigatorController,
} from "./hooks/use-screen-navigator";
import { SessionScreenControls, SessionStage } from "./components/session-stage";

// ---------------------------------------------------------------------------
// JGP — Jira Golden Paths
//
// The gallery dock has two cards: "Local session" and "Global session". Each is
// a presenter-paced walkthrough of an ordered set of screens, navigated
// left/right from the gallery top bar (see `SessionScreenControls`) or the ←/→
// arrow keys — mirroring the terminal demo's beat stepping. Screens are
// placeholders for now (see `./data/session-screens.ts`); the pattern stages
// from the original clone (KanbanStage, TerminalStage, RovoStage, QueueStage, …)
// are kept under `./components/` as building blocks to wire into these screens
// later.
// ---------------------------------------------------------------------------

const ROVO_PURPLE_PALETTE: GalleryPalette = ["#5E2C9D", "#7A3BB3", "#9850CC", "#AF59E1"];

interface SessionCard {
	screens: readonly SessionScreen[];
	controller: ScreenNavigatorController;
}

// The window-level arrow handler must not steal keys from a focused interactive
// control (the top-bar prev/next buttons, the dock tiles): ←/→ on those must act
// on the control, not step the walkthrough. So bail whenever focus is within any
// editable field or activatable control.
function isInteractiveTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	if (target.isContentEditable) return true;
	return Boolean(
		target.closest(
			'input, textarea, select, button, a[href], [role="button"], [role="link"], [role="menuitem"], [role="tab"], [role="checkbox"], [role="switch"], [role="option"]',
		),
	);
}

export default function JgpPage(): React.ReactElement {
	const [selectedId, setSelectedId] = useState(JGP_GALLERY_ITEMS[0]?.id ?? "");
	// One navigator per card, hoisted here so the top-bar controls and the stage
	// share a single source of truth (each card keeps its own place).
	const localNav = useScreenNavigator(LOCAL_SESSION_SCREENS.length);
	const globalNav = useScreenNavigator(GLOBAL_SESSION_SCREENS.length);

	const cardsById = useMemo<Record<string, SessionCard>>(
		() => ({
			"local-session": { screens: LOCAL_SESSION_SCREENS, controller: localNav },
			"global-session": { screens: GLOBAL_SESSION_SCREENS, controller: globalNav },
		}),
		[localNav, globalNav],
	);
	const activeCard = cardsById[selectedId] ?? cardsById["local-session"];

	const handleSelectedChange = useCallback((nextSelectedId: string) => {
		setSelectedId(nextSelectedId);
	}, []);

	// The gallery Reset control rewinds the active card's walkthrough to screen 1.
	const handleReset = useCallback(
		(item: GalleryItem) => {
			cardsById[item.id]?.controller.reset();
		},
		[cardsById],
	);

	// ←/→ step the active card's screens, mirroring the terminal demo. Depend on
	// the stable per-card callbacks so this re-subscribes only when the active
	// card changes, not on every screen change.
	const { next: activeNext, prev: activePrev } = activeCard.controller;
	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent): void {
			if (event.metaKey || event.ctrlKey || event.altKey) return;
			if (isInteractiveTarget(event.target)) return;
			if (event.key === "ArrowRight") {
				event.preventDefault();
				activeNext();
			} else if (event.key === "ArrowLeft") {
				event.preventDefault();
				activePrev();
			}
		}
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [activeNext, activePrev]);

	// The Terminal section is a full dark-mode experience: the terminal frame is
	// already dark, so we flip the surrounding gallery chrome (top bar, dock,
	// background) to dark too via ADS subtree theming whenever the active screen
	// belongs to the "Terminal" section — mirroring the /asx Terminal pattern.
	// Every semantic token in the subtree resolves to its dark value (no `dark:`
	// utilities or hardcoded colors), and the `position: fixed` dock strip still
	// inherits it as a DOM descendant of this root. Generalizes to future
	// sections by keying off the screen's `section`, not a specific card.
	const activeScreen = activeCard.screens[activeCard.controller.index];
	const isTerminalSection = activeScreen?.section === "Terminal";
	const subtreeThemeProps = isTerminalSection
		? {
				"data-subtree-theme": "",
				"data-color-mode": "dark",
				"data-theme": "dark:dark spacing:spacing typography:typography shape:shape",
			}
		: {};

	// The Kanban and Rovo design screens run on a JGP-wide `RovoChatProvider`
	// (their stages call `useRovoChat` for the agent chat overlay), so the whole
	// gallery tree is wrapped here rather than relying on an ancestor route to
	// supply the context — this keeps the standalone and exported routes working.
	// The JGP agent profiles (rfp-drafter, service-impact-agent, …) are passed in
	// so `selectAgent` resolves those local personas instead of falling back to
	// default Rovo — mirroring the /asx pattern.
	return (
		<RovoChatProvider agentProfiles={JGP_CHAT_AGENT_PROFILES}>
			<div className="relative h-dvh w-full overflow-hidden bg-surface" {...subtreeThemeProps}>
				<Gallery
					items={JGP_GALLERY_ITEMS}
					palette={ROVO_PURPLE_PALETTE}
					title="Jira Golden Paths"
					selectedId={selectedId}
					onSelectedChange={handleSelectedChange}
					topBarCenter={
						<SessionScreenControls
							screens={activeCard.screens}
							controller={activeCard.controller}
						/>
					}
					onReset={handleReset}
					renderSelectedItem={(item) => {
						const card = cardsById[item.id] ?? activeCard;
						return <SessionStage screens={card.screens} controller={card.controller} />;
					}}
				/>
			</div>
		</RovoChatProvider>
	);
}
