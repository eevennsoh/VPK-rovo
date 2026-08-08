"use client";

import { createContext, use, useMemo, useState, type ReactNode } from "react";

import type { ActivityRailChrome } from "@/components/blocks/jira-work-item/experimental-v2/components/activity-panel";
import {
	DEFAULT_PULL_REQUEST_SORT_MODE,
	type PullRequestSortMode,
} from "@/components/blocks/jira-work-item/experimental-v2/lib/pull-request-phases";

export type MetadataRailView = "details" | "activity" | "pull-requests";

export function isMetadataRailView(value: string | undefined): value is MetadataRailView {
	return value === "details" || value === "activity" || value === "pull-requests";
}

interface MetadataRailContextValue {
	/** Requested panel tab (may be coerced when pull requests are unavailable). */
	panelView: MetadataRailView;
	/** Panel tab after pull-request availability is applied. */
	activePanelView: MetadataRailView;
	setPanelView: (view: MetadataRailView) => void;
	activityChrome: ActivityRailChrome | null;
	setActivityChrome: (chrome: ActivityRailChrome | null) => void;
	pullRequestCount: number;
	pullRequestSortMode: PullRequestSortMode;
	setPullRequestSortMode: (mode: PullRequestSortMode) => void;
}

const MetadataRailContext = createContext<MetadataRailContextValue | null>(null);

interface MetadataRailProviderProps {
	children: ReactNode;
	pullRequestCount?: number;
}

/**
 * View-state owner for the metadata rail's Details / Activity / Pull requests
 * tabs and the Activity/PR chrome published onto the ContextResources toggle row.
 *
 * Shared between `ContextResources` (toggle UI) and `MetadataRail` (panel body)
 * so the sticky header can live in the resource row above the rail column.
 */
export function MetadataRailProvider({
	children,
	pullRequestCount = 0,
}: Readonly<MetadataRailProviderProps>) {
	const [panelView, setPanelView] = useState<MetadataRailView>("details");
	const [activityChrome, setActivityChrome] = useState<ActivityRailChrome | null>(null);
	const [pullRequestSortMode, setPullRequestSortMode] =
		useState<PullRequestSortMode>(DEFAULT_PULL_REQUEST_SORT_MODE);
	const activePanelView =
		panelView === "pull-requests" && pullRequestCount === 0 ? "details" : panelView;
	const value = useMemo<MetadataRailContextValue>(
		() => ({
			activePanelView,
			activityChrome,
			panelView,
			pullRequestCount,
			pullRequestSortMode,
			setActivityChrome,
			setPanelView,
			setPullRequestSortMode,
		}),
		[
			activePanelView,
			activityChrome,
			panelView,
			pullRequestCount,
			pullRequestSortMode,
		],
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
