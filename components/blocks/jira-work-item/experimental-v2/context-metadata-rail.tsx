"use client";

import { createContext, use, useCallback, useMemo, useState, type ReactNode } from "react";

import type { ActivityRailChrome } from "@/components/blocks/jira-work-item/experimental-v2/components/activity-panel";
import type { MetadataRailView } from "@/components/blocks/jira-work-item/experimental-v2/lib/metadata-rail-view";

/** One-shot request to expand a PR artifact-pane section (e.g. CI checks). */
export interface PullRequestSectionExpandRequest {
	nonce: number;
	pullRequestIdentity: string;
	sectionId: string;
}

interface MetadataRailContextValue {
	panelView: MetadataRailView;
	activePanelView: MetadataRailView;
	setPanelView: (view: MetadataRailView) => void;
	activityChrome: ActivityRailChrome | null;
	setActivityChrome: (chrome: ActivityRailChrome | null) => void;
	/** Latest request to expand a pull-request details-rail section. */
	pullRequestSectionExpandRequest: PullRequestSectionExpandRequest | null;
	/** Ask one PR details rail to open a collapsible section. */
	requestExpandPullRequestSection: (pullRequestIdentity: string, sectionId: string) => void;
	/** Acknowledge a handled request without clearing a newer request. */
	consumePullRequestSectionExpandRequest: (nonce: number) => void;
}

const MetadataRailContext = createContext<MetadataRailContextValue | null>(null);

interface MetadataRailProviderProps {
	children: ReactNode;
}

/**
 * View-state owner for the metadata rail's Details / Activity tabs and the
 * Activity chrome published onto the MetadataRailToggle row.
 *
 * Shared between `MetadataRailToggle` (toggle UI), `MetadataRail` (panel body),
 * and pull-request detail surfaces that need to expand rail sections (e.g. CI
 * checks from the header "Checks running" primary).
 */
export function MetadataRailProvider({
	children,
}: Readonly<MetadataRailProviderProps>) {
	const [panelView, setPanelView] = useState<MetadataRailView>("details");
	const [activityChrome, setActivityChrome] = useState<ActivityRailChrome | null>(null);
	const [pullRequestSectionExpandRequest, setPullRequestSectionExpandRequest] =
		useState<PullRequestSectionExpandRequest | null>(null);
	const requestExpandPullRequestSection = useCallback((pullRequestIdentity: string, sectionId: string) => {
		setPullRequestSectionExpandRequest((current) => ({
			nonce: (current?.nonce ?? 0) + 1,
			pullRequestIdentity,
			sectionId,
		}));
	}, []);
	const consumePullRequestSectionExpandRequest = useCallback((nonce: number) => {
		setPullRequestSectionExpandRequest((current) => current?.nonce === nonce ? null : current);
	}, []);
	const value = useMemo<MetadataRailContextValue>(
		() => ({
			activePanelView: panelView,
			activityChrome,
			consumePullRequestSectionExpandRequest,
			panelView,
			pullRequestSectionExpandRequest,
			requestExpandPullRequestSection,
			setActivityChrome,
			setPanelView,
		}),
		[
			activityChrome,
			consumePullRequestSectionExpandRequest,
			panelView,
			pullRequestSectionExpandRequest,
			requestExpandPullRequestSection,
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
