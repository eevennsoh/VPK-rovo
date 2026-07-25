"use client";

import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
	METADATA_CONTENT_COLLAPSE_DURATION_MS,
	METADATA_CONTENT_EXPAND_DURATION_MS,
} from "./context-panel-layout-motion";

interface PanelLayoutContextValue {
	/** Whether the right-hand metadata column is collapsed (hidden). */
	metadataCollapsed: boolean;
	/** Whether the left-column geometry is moving between expanded and collapsed layouts. */
	metadataLayoutAnimating: boolean;
	/** Whether the title actions are exiting before the layout state changes. */
	metadataTogglePending: boolean;
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
interface PanelLayoutProviderProps {
	children: ReactNode;
	defaultMetadataCollapsed?: boolean;
}

export function PanelLayoutProvider({
	children,
	defaultMetadataCollapsed = false,
}: Readonly<PanelLayoutProviderProps>) {
	const [metadataCollapsed, setMetadataCollapsed] = useState(defaultMetadataCollapsed);
	const [metadataLayoutAnimating, setMetadataLayoutAnimating] = useState(false);
	const [metadataTogglePending, setMetadataTogglePending] = useState(false);
	const toggleMetadata = useCallback(() => {
		setMetadataTogglePending(true);
	}, []);
	const completeMetadataToggle = useCallback(() => {
		if (!metadataTogglePending) return;

		setMetadataLayoutAnimating(true);
		setMetadataCollapsed((collapsed) => !collapsed);
		setMetadataTogglePending(false);
	}, [metadataTogglePending]);

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
			metadataTogglePending,
			toggleMetadata,
		}),
		[
			completeMetadataToggle,
			metadataCollapsed,
			metadataLayoutAnimating,
			metadataTogglePending,
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
