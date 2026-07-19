"use client";

import { createContext, use, useCallback, useMemo, useState, type ReactNode } from "react";

interface PanelLayoutContextValue {
	/** Whether the right-hand metadata column is collapsed (hidden). */
	metadataCollapsed: boolean;
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
export function PanelLayoutProvider({ children }: Readonly<{ children: ReactNode }>) {
	const [metadataCollapsed, setMetadataCollapsed] = useState(false);
	const [metadataTogglePending, setMetadataTogglePending] = useState(false);
	const toggleMetadata = useCallback(() => setMetadataTogglePending(true), []);
	const completeMetadataToggle = useCallback(() => {
		if (!metadataTogglePending) return;

		setMetadataCollapsed((collapsed) => !collapsed);
		setMetadataTogglePending(false);
	}, [metadataTogglePending]);
	const value = useMemo<PanelLayoutContextValue>(
		() => ({
			completeMetadataToggle,
			metadataCollapsed,
			metadataTogglePending,
			toggleMetadata,
		}),
		[completeMetadataToggle, metadataCollapsed, metadataTogglePending, toggleMetadata],
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
