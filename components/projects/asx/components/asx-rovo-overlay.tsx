"use client";

import { AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useRovoChat } from "@/app/contexts";
import RovoFloatingChat from "@/components/projects/rovo-floating-chat/components/rovo-floating-chat";
import FloatingRovoButton from "@/components/projects/shared/components/floating-rovo-button";

/** Keeps ASX Rovo surfaces in the viewport stacking context above the Gallery dock. */
export function AsxRovoOverlay(): React.ReactNode {
	const { chatSurface } = useRovoChat();
	const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

	useEffect(() => {
		setPortalRoot(document.body);
	}, []);

	if (!portalRoot) return null;

	return createPortal(
		<>
			{chatSurface === null ? (
				<FloatingRovoButton ariaLabel="Open Rovo chat" forceVisible product="home" />
			) : null}
			<AnimatePresence>
				{chatSurface === "floating" ? <RovoFloatingChat key="floating-chat" /> : null}
			</AnimatePresence>
		</>,
		portalRoot,
	);
}
