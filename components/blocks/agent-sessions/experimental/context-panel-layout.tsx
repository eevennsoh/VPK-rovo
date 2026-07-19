"use client";

import { createContext, use, useMemo, useState, type ReactNode } from "react";

interface PanelLayoutContextValue {
	/** Whether the right-hand metadata column is collapsed (hidden). */
	metadataCollapsed: boolean;
	/** Toggle the metadata column between collapsed and expanded. */
	toggleMetadata: () => void;
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
	const value = useMemo<PanelLayoutContextValue>(
		() => ({
			metadataCollapsed,
			toggleMetadata: () => setMetadataCollapsed((collapsed) => !collapsed),
		}),
		[metadataCollapsed],
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
