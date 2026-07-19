"use client";

import FloatingRovoButton from "@/components/projects/shared/components/floating-rovo-button";

import { useAgentSessionsActions } from "@/components/blocks/agent-sessions/experimental/context-agent-sessions";

/**
 * Local launcher for the unified work-item chat/session experience. Wraps the
 * shared FloatingRovoButton, but `onButtonClick` bypasses the global Rovo chat
 * (`openChat`) entirely — the launcher only drives the block-local controller.
 *
 * `forceVisible` decouples the launcher from the global `isOpen` flag (which this
 * surface never sets); the parent `FloatingSessionSurface` is responsible for
 * hiding it whenever the local panel is open.
 *
 * The button uses the shared default placement — anchored to the viewport
 * bottom-right at a 24px inset, exactly like the standard `/jira` work-item view.
 * The button's home is the viewport corner, not the modal edge, so no
 * modal-relative offset is applied.
 */
export function FloatingSessionLauncher() {
	const actions = useAgentSessionsActions();

	return (
		<FloatingRovoButton
			product="jira"
			forceVisible
			ariaLabel="Open work item chat"
			onButtonClick={actions.openLatestOrCreateGeneralSession}
		/>
	);
}
