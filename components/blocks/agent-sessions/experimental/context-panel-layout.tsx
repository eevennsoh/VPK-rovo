"use client";

import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Transition } from "motion/react";

const METADATA_CONTENT_COLLAPSE_DURATION_MS = 200;
const METADATA_CONTENT_EXPAND_DURATION_MS = 250;

export const METADATA_CONTENT_COLLAPSE_TRANSITION: Transition = {
	duration: METADATA_CONTENT_COLLAPSE_DURATION_MS / 1000,
	ease: [0.6, 0, 0.8, 0.6], // duration-medium + ease-in
};
export const METADATA_CONTENT_EXPAND_TRANSITION: Transition = {
	duration: METADATA_CONTENT_EXPAND_DURATION_MS / 1000,
	ease: [0.4, 0, 0, 1], // duration-slow + ease-in-out
};
export const METADATA_CONTENT_REDUCED_MOTION_TRANSITION: Transition = { duration: 0 };

// Peek overlay: a fast, low-commitment sneak-peek of the metadata rail while the
// panel is collapsed. Enter is quick + responsive (ease-out-practical); exit is
// even quicker (ease-in) so dismissing on pointer-leave feels immediate.
export const METADATA_PEEK_ENTER_TRANSITION: Transition = {
	duration: 0.12, // duration-fast
	ease: [0.4, 1, 0.6, 1], // ease-out-practical
};
export const METADATA_PEEK_EXIT_TRANSITION: Transition = {
	duration: 0.1, // duration-fast
	ease: [0.6, 0, 0.8, 0.6], // ease-in
};
export const METADATA_PEEK_REDUCED_MOTION_TRANSITION: Transition = { duration: 0 };

interface PanelLayoutContextValue {
	/** Whether the right-hand metadata column is collapsed (hidden). */
	metadataCollapsed: boolean;
	/** Whether the left-column geometry is moving between expanded and collapsed layouts. */
	metadataLayoutAnimating: boolean;
	/** Whether the title actions are exiting before the layout state changes. */
	metadataTogglePending: boolean;
	/**
	 * Whether the collapsed metadata rail is being peeked as a floating overlay
	 * (hover/focus of the toggle). Only meaningful while `metadataCollapsed`.
	 */
	metadataPeeking: boolean;
	/** Request or dismiss the collapsed-rail peek overlay. */
	setMetadataPeek: (peeking: boolean) => void;
	/** Request a metadata-column toggle after the title actions finish exiting. */
	toggleMetadata: () => void;
	/** Apply the requested layout state once the title-action exit completes. */
	completeMetadataToggle: () => void;
}

const PanelLayoutContext = createContext<PanelLayoutContextValue | null>(null);

/**
 * View-state owner for the experimental work item dialog's panel layout.
 *
 * Holds transient UI-only state (currently the metadata column collapse toggle)
 * shared between the breadcrumb-row toggle button in the `ModalHeader` and the
 * `ExperimentalWorkItemLayout` body. Kept separate from the session-data
 * controller so session state and view state stay in their own owners.
 */
export function PanelLayoutProvider({ children }: Readonly<{ children: ReactNode }>) {
	const [metadataCollapsed, setMetadataCollapsed] = useState(false);
	const [metadataLayoutAnimating, setMetadataLayoutAnimating] = useState(false);
	const [metadataTogglePending, setMetadataTogglePending] = useState(false);
	const [metadataPeeking, setMetadataPeeking] = useState(false);
	// Peek is a collapsed-only affordance; dismiss it whenever a toggle is
	// requested so the overlay never lingers over the docking animation.
	const setMetadataPeek = useCallback((peeking: boolean) => setMetadataPeeking(peeking), []);
	const toggleMetadata = useCallback(() => {
		setMetadataPeeking(false);
		setMetadataTogglePending(true);
	}, []);
	const completeMetadataToggle = useCallback(() => {
		if (!metadataTogglePending) return;

		setMetadataLayoutAnimating(true);
		setMetadataCollapsed((collapsed) => !collapsed);
		setMetadataTogglePending(false);
	}, [metadataTogglePending]);

	// A peek only exists over a collapsed rail; clear it if the rail docks.
	useEffect(() => {
		if (!metadataCollapsed) setMetadataPeeking(false);
	}, [metadataCollapsed]);

	useEffect(() => {
		if (!metadataLayoutAnimating) return;

		const timeout = window.setTimeout(
			() => setMetadataLayoutAnimating(false),
			metadataCollapsed ? METADATA_CONTENT_COLLAPSE_DURATION_MS : METADATA_CONTENT_EXPAND_DURATION_MS,
		);
		return () => window.clearTimeout(timeout);
	}, [metadataCollapsed, metadataLayoutAnimating]);
	const value = useMemo<PanelLayoutContextValue>(
		() => ({
			completeMetadataToggle,
			metadataCollapsed,
			metadataLayoutAnimating,
			metadataPeeking,
			metadataTogglePending,
			setMetadataPeek,
			toggleMetadata,
		}),
		[
			completeMetadataToggle,
			metadataCollapsed,
			metadataLayoutAnimating,
			metadataPeeking,
			metadataTogglePending,
			setMetadataPeek,
			toggleMetadata,
		],
	);

	return <PanelLayoutContext value={value}>{children}</PanelLayoutContext>;
}

export function usePanelLayout(): PanelLayoutContextValue {
	const context = use(PanelLayoutContext);
	if (context === null) {
		throw new Error("usePanelLayout must be used within a PanelLayoutProvider");
	}
	return context;
}
