"use client";

import { useMemo } from "react";

import CrossCircleIcon from "@atlaskit/icon/core/cross-circle";
import MergeSuccessIcon from "@atlaskit/icon/core/merge-success";
import PullRequestIcon from "@atlaskit/icon/core/pull-request";
import StatusInformationIcon from "@atlaskit/icon/core/status-information";
import StatusSuccessIcon from "@atlaskit/icon/core/status-success";

import { ArtifactPane, type ArtifactPaneSectionItem } from "@/components/blocks/artifact-pane";
import type { JiraActivityEventEntry } from "@/components/blocks/jira-activity";
import { JIRA_WORK_ITEM_CURRENT_USER } from "@/components/blocks/jira-work-item/experimental-v2/lib/jira-activity-adapter";
import {
	DEFAULT_PULL_REQUEST_SORT_MODE,
	defaultOpenPullRequestPhases,
	groupPullRequestsByPhase,
	type PullRequestPhaseId,
	type PullRequestSortMode,
} from "@/components/blocks/jira-work-item/experimental-v2/lib/pull-request-phases";
import {
	SmartLink,
	toPullRequestSmartLink,
	type SmartLinkAvatar,
	type SmartLinkItem,
} from "@/components/blocks/smart-link";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type PhaseIconComponent = typeof PullRequestIcon;

const PHASE_ICON: Record<
	PullRequestPhaseId,
	{ Icon: PhaseIconComponent; className: string }
> = {
	approved: { Icon: StatusSuccessIcon, className: "text-icon-success" },
	"needs-review": { Icon: StatusInformationIcon, className: "text-icon-warning" },
	open: { Icon: PullRequestIcon, className: "text-icon-success" },
	draft: { Icon: PullRequestIcon, className: "text-icon-subtle" },
	"merged-30d": { Icon: MergeSuccessIcon, className: "text-icon-accent-purple" },
	"closed-30d": { Icon: CrossCircleIcon, className: "text-icon-danger" },
};

/**
 * Phase heading for ArtifactPane: leading status glyph + label. Matches Details
 * section title composition (ReactNode title) while keeping phase semantics.
 */
function PhaseSectionTitle({
	phaseId,
	label,
}: Readonly<{
	phaseId: PullRequestPhaseId;
	label: string;
}>) {
	const { Icon: PhaseIcon, className: iconClassName } = PHASE_ICON[phaseId];
	return (
		<>
			<span aria-hidden className={cn("grid size-4 shrink-0 place-items-center", iconClassName)}>
				<Icon render={<PhaseIcon color="currentColor" label="" size="small" />} />
			</span>
			{label}
		</>
	);
}

function resolvePullRequestAuthor(entry: JiraActivityEventEntry): SmartLinkAvatar | undefined {
	const pullRequest = entry.pullRequest;
	if (!pullRequest) return undefined;

	const name =
		pullRequest.authorName ??
		(entry.actor.kind === "person" ? entry.actor.name : undefined);
	if (!name) return undefined;

	if (name === JIRA_WORK_ITEM_CURRENT_USER.name) {
		return { name, src: JIRA_WORK_ITEM_CURRENT_USER.avatarSrc };
	}

	if (entry.actor.kind === "person" && entry.actor.name === name) {
		return { name, src: entry.actor.avatarSrc };
	}

	return { name };
}

function toPanelPullRequestSmartLink(entry: JiraActivityEventEntry): SmartLinkItem | null {
	const pullRequest = entry.pullRequest;
	if (!pullRequest) return null;

	return toPullRequestSmartLink({
		id: entry.id,
		number: pullRequest.number,
		title: pullRequest.title,
		status: pullRequest.status,
		additions: pullRequest.additions,
		deletions: pullRequest.deletions,
		repository: pullRequest.repository,
		href: pullRequest.url,
		author: resolvePullRequestAuthor(entry),
	});
}

function PullRequestCard({ entry }: Readonly<{ entry: JiraActivityEventEntry }>) {
	const item = toPanelPullRequestSmartLink(entry);
	if (!item) return null;

	const number = entry.pullRequest?.number;
	if (number == null) return null;

	return (
		<li className="min-w-0 px-2 py-1" data-jira-work-item-pull-request-card={number}>
			<SmartLink
				align="center"
				alignOffset={0}
				className="min-w-0 max-w-full"
				item={item}
				positionerClassName="z-[600]"
				showStatus
				side="left"
			/>
		</li>
	);
}

function PhaseSectionBody({
	entries,
}: Readonly<{
	entries: readonly JiraActivityEventEntry[];
}>) {
	if (entries.length === 0) {
		return (
			<p className="px-2 py-3 text-center text-xs text-text-subtlest" data-jira-work-item-pull-request-empty>
				No pull requests
			</p>
		);
	}

	return (
		<ul className="flex min-w-0 flex-col gap-0.5">
			{entries.map((entry) => (
				<PullRequestCard entry={entry} key={entry.id} />
			))}
		</ul>
	);
}

/**
 * Phase-sectioned pull-request list for the metadata rail. Buckets unique PR
 * activity events into Approved / Needs review / Open / Draft / Merged / Closed
 * sections using the same ArtifactPane disclosure chrome as Details (heading
 * font, `· N` count when collapsed, no list dividers). Each PR renders as a
 * Smart Link (`pull-request` variant) with hover-card details.
 * Sort mode is owned by MetadataRail; "By me" uses the signed-in viewer name.
 */
export function PullRequestsPanel({
	borderless = false,
	currentUserName = JIRA_WORK_ITEM_CURRENT_USER.name,
	entries,
	sortMode = DEFAULT_PULL_REQUEST_SORT_MODE,
}: Readonly<{
	borderless?: boolean;
	/** Display name of the signed-in viewer for the "By me" sort. */
	currentUserName?: string;
	entries: readonly JiraActivityEventEntry[];
	sortMode?: PullRequestSortMode;
}>) {
	const sections = useMemo(
		() => groupPullRequestsByPhase(entries, sortMode, currentUserName),
		[currentUserName, entries, sortMode],
	);
	const defaultOpen = useMemo(() => defaultOpenPullRequestPhases(sections), [sections]);
	const artifactSections = useMemo((): ArtifactPaneSectionItem[] => {
		const openIds = new Set(defaultOpen);
		return sections.map((section) => {
			const count = section.entries.length;
			return {
				content: (
					<div data-jira-work-item-pull-request-phase={section.id}>
						<PhaseSectionBody entries={section.entries} />
					</div>
				),
				count: count > 0 ? count : undefined,
				defaultOpen: openIds.has(section.id),
				id: section.id,
				title: <PhaseSectionTitle label={section.label} phaseId={section.id} />,
			};
		});
	}, [defaultOpen, sections]);

	return (
		<ArtifactPane
			aria-label="Pull requests"
			borderless={borderless}
			data-jira-work-item-pull-requests
			key={defaultOpen.join("|")}
			sections={artifactSections}
			showSeparators={false}
		/>
	);
}
