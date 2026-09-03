"use client";

import { useSidebarResize } from "@/components/projects/rovo-core/hooks/use-sidebar-resize";

/**
 * Expanded docked-rail default width in px. The in-flow board column stays
 * 280; this surface is the one the user sized.
 */
export const AGENT_SESSION_PANEL_WIDTH_PX = 360;

/** Narrowest expanded rail — the in-flow board column width. */
export const AGENT_SESSION_PANEL_MIN_WIDTH_PX = 280;

/** Widest expanded rail so the board still has a usable scrollport. */
export const AGENT_SESSION_PANEL_MAX_WIDTH_PX = 560;

/**
 * Same resize model as the right-docked Ask Rovo chat: handle on the leading
 * edge, drag left to grow.
 */
export function useAgentSessionPanelResize() {
	return useSidebarResize({
		defaultWidth: AGENT_SESSION_PANEL_WIDTH_PX,
		direction: "rtl",
		maxWidth: AGENT_SESSION_PANEL_MAX_WIDTH_PX,
		minWidth: AGENT_SESSION_PANEL_MIN_WIDTH_PX,
	});
}
