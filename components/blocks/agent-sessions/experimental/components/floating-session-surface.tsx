"use client";

import { AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useAgentSessionsMeta } from "@/components/blocks/agent-sessions/experimental/context-agent-sessions";
import { FloatingSessionLauncher } from "@/components/blocks/agent-sessions/experimental/components/floating-session-launcher";
import { FloatingSessionPanel } from "@/components/blocks/agent-sessions/experimental/components/floating-session-panel";

/**
 * Composition root of the unified floating chat/session experience. An agent
 * session and a chat session are the SAME work-item-scoped entity: when no
 * session is open, the launcher is shown; when one is active, the panel takes
 * over (and the launcher is hidden). The panel is wrapped in AnimatePresence so
 * its exit transition plays on close.
 *
 * This is the single node the composition layer mounts inside the dialog subtree.
 */
export function FloatingSessionSurface({
	portalToViewport = false,
}: Readonly<{ portalToViewport?: boolean }>) {
	const { activeSession } = useAgentSessionsMeta();
	const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

	useEffect(() => {
		setPortalRoot(portalToViewport ? document.body : null);
	}, [portalToViewport]);

	const surface = (
		<>
			{activeSession ? null : <FloatingSessionLauncher />}
			<AnimatePresence>
				{activeSession ? <FloatingSessionPanel key="floating-session-panel" /> : null}
			</AnimatePresence>
		</>
	);

	if (!portalToViewport) return surface;
	if (!portalRoot) return null;
	return createPortal(surface, portalRoot);
}
