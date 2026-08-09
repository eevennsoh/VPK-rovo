"use client";

import { createContext, use, useMemo, useState, type ReactNode } from "react";

import type { ActivityRailChrome } from "@/components/blocks/jira-work-item/experimental-v2/components/activity-panel";
import type { MetadataRailView } from "@/components/blocks/jira-work-item/experimental-v2/lib/metadata-rail-view";

interface MetadataRailContextValue {
	panelView: MetadataRailView;
	activePanelView: MetadataRailView;
	setPanelView: (view: MetadataRailView) => void;
	activityChrome: ActivityRailChrome | null;
	setActivityChrome: (chrome: ActivityRailChrome | null) => void;
}

const MetadataRailContext = createContext<MetadataRailContextValue | null>(null);

interface MetadataRailProviderProps {
	children: ReactNode;
}

/**
 * View-state owner for the metadata rail's Details / Activity tabs and the
 * Activity chrome published onto the MetadataRailToggle row.
 *
 * Shared between `MetadataRailToggle` (toggle UI) and `MetadataRail` (panel
 * body). Pull requests live in the ContextResources dropdown, not this rail.
 */
export function MetadataRailProvider({
	children,
}: Readonly<MetadataRailProviderProps>) {
	const [panelView, setPanelView] = useState<MetadataRailView>("details");
	const [activityChrome, setActivityChrome] = useState<ActivityRailChrome | null>(null);
	const value = useMemo<MetadataRailContextValue>(
		() => ({
			activePanelView: panelView,
			activityChrome,
			panelView,
			setActivityChrome,
			setPanelView,
		}),
		[activityChrome, panelView],
	);

	return <MetadataRailContext value={value}>{children}</MetadataRailContext>;
}

export function useMetadataRail(): MetadataRailContextValue {
	const context = use(MetadataRailContext);
	if (context === null) {
		throw new Error("useMetadataRail must be used within a MetadataRailProvider");
	}
	return context;
}
