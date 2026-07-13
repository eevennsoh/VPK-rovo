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
