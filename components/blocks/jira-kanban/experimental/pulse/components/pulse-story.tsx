"use client";

import { useId, type ReactNode, type RefCallback } from "react";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronUpIcon from "@atlaskit/icon/core/chevron-up";

import {
	PulseAttention,
	PulseNextActions,
	PulseSectionLabel,
} from "@/components/blocks/jira-kanban/experimental/pulse/components/pulse-signals";
import {
	PULSE_EYEBROW,
	PULSE_ITEM_BODY,
	PULSE_ROW_META,
} from "@/components/blocks/jira-kanban/experimental/pulse/components/pulse-type";
import {
	toAdjacentInsightIndex,
	toPulseAnchorId,
	toPulseSections,
	type PulseScrollOptions,
} from "@/components/blocks/jira-kanban/experimental/pulse/lib/pulse-outline";
import { isPulseSectionDimmed } from "@/components/blocks/jira-kanban/experimental/pulse/lib/pulse-marks";
import type {
	PulseAction,
	PulseContribution,
	PulseMember,
	PulseStat,
	PulseStoryProps,
} from "@/components/blocks/jira-kanban/experimental/pulse/types";
import { ArtifactList, type ArtifactListItem } from "@/components/ui-custom/artifact-list";
import { TWGAppstack, type TwgToolSource } from "@/components/ui-custom/twg-appstack";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * Pulse story — the body of one insight inside the continuous article.
 *
 * One eyebrow, a display headline, the faces that produced it, the window's
 * numbers, the narrative, the artifacts it produced, then the signals and the
 * actions that follow from it. Nothing here swaps: every insight is mounted at
 * once and the reader scrolls. The header chevrons jump to the previous or next
 * insight via the ruler's own scroll — they do not unmount or step a carousel.
 * What it also owns is anchors: the insight head and each non-empty section
 * carry the id the outline generated for them, so every mark on the ruler is a
 * real place in the document.
 *
 * While a member filter is on the column visibly becomes that member's: the
 * eyebrow carries their name, the display slot carries them rather than the
 * team, and the team's headline drops to a subdued line underneath. A member
 * who was quiet still gets a page — what the window was, and two ways out —
 * instead of one grey sentence and eight hundred pixels of white.
 */

/**
 * 576px — the prose measure. Held in `rem`, not `px`, so it tracks the root
 * type size: at the 16px body below it that is ~74 characters a line, inside
 * the range a reader can return-sweep without losing the line. It is not set
 * in `em` because the same class also caps the 43px display headline, where
 * `em` would resolve against the headline's own size and blow the column open.
 *
 * Exported because the stream rules one insight off from the next, and that
 * hairline has to stop where the reading column stops.
 */
export const MEASURE = "max-w-[36rem]";

const SECTION_FOCUS_TRANSITION = "min-w-0 transition-opacity duration-normal ease-out-practical motion-reduce:transition-none";
const SECTION_FOCUSED = "opacity-100";
const SECTION_DIMMED = "opacity-(--opacity-disabled)";

/** The fourteen connected sources the Pulse synthesis reads across. */
const PULSE_SOURCES = [
	{ id: "jira", label: "Jira", provider: "jira" },
	{ id: "confluence", label: "Confluence", provider: "confluence" },
	{ id: "github", label: "GitHub", provider: "twg", name: "github" },
	{ id: "slack", label: "Slack", provider: "twg", name: "slack" },
	{ id: "sentry", label: "Sentry", provider: "twg", name: "sentry" },
	{ id: "launchdarkly", label: "LaunchDarkly", provider: "twg", name: "launchdarkly" },
	{ id: "loom", label: "Loom", provider: "loom" },
	{ id: "figma", label: "Figma", provider: "twg", name: "figma" },
	{ id: "google-docs", label: "Google Docs", provider: "twg", name: "google-docs" },
	{ id: "google-drive", label: "Google Drive", provider: "google-drive" },
	{ id: "bitbucket", label: "Bitbucket", provider: "bitbucket" },
	{ id: "rovo", label: "Rovo", provider: "rovo" },
	{ id: "opsgenie", label: "Opsgenie", provider: "opsgenie" },
	{ id: "statuspage", label: "Statuspage", provider: "statuspage" },
] as const satisfies readonly TwgToolSource[];

/** 40px → 54px display size, tracked tight the way the reference sets it. */
const HEADLINE_STYLE = {
	fontSize: "clamp(2.5rem, 0.575rem + 2.8vw, 3.375rem)",
	fontWeight: 400,
	letterSpacing: "-0.045em",
	lineHeight: 1.03,
} as const;

/** One window the filtered member was active in, offered as a way out. */
export interface PulseStoryJump {
	index: number;
	label: string;
}

/**
 * The frozen `PulseStoryProps` describes the data for one snapshot. The
 * continuous article drops its `onNext`/`onPrevious` stepper half — there is
 * nothing to unmount any more — and needs a little more than the rest: where
 * this insight sits in the article, where else the member was active, what
 * the unscoped window holds, and the anchor registrar the ruler scrolls
 * against. That extra is declared here rather than in `types.ts`, which is a
 * read-only contract.
 */
export interface PulseStoryViewProps
	extends Omit<PulseStoryProps, "index" | "onNext" | "onPrevious" | "total"> {
	/** Position in the article, for the header's previous/next jump. */
	insightIndex: number;
	insightCount: number;
	/** Why a window came up empty, e.g. "The window ran … and closed overnight." */
	quietNote?: string;
	nextActive?: PulseStoryJump | null;
	previousActive?: PulseStoryJump | null;
	/** Jump the article to another insight, optionally at a gesture-specific line. */
	onGoToIndex: (index: number, options?: PulseScrollOptions) => void;
	/** Everyone — human and agent — whose work is in this window. */
	contributors: readonly PulseMember[];
	/** Clicking a contributor scopes the whole view to them; `null` clears it. */
	onSelectMember: (memberId: string | null) => void;
	/** The window's headline numbers, read under the title and faces. */
	stats: readonly PulseStat[];
	/**
	 * Requested actions, owned above the article. A request is a commitment the
	 * reader made; owning it here meant toggling Pulse off and back on recreated
	 * the set empty and silently un-requested everything.
	 */
	requestedActionIds: ReadonlySet<string>;
	onRequestAction: (action: PulseAction) => void;
	/** What the window holds before scoping, so an emptied section can say so. */
	unscopedCounts: {
		artifacts: number;
		attention: number;
		nextActions: number;
	};
	/**
	 * From `usePulseReading`. Anchor ids come from `toPulseAnchorId(snapshot.id)`
	 * and `toPulseAnchorId(snapshot.id, section)`, so the article and the ruler
	 * are addressing the same elements by construction.
	 */
	anchorRef: (id: string) => RefCallback<HTMLElement>;
	/** Outline entry currently previewed from ruler hover or focus. */
	previewEntryId: string | null;
}

/**
 * A part of the article the ruler can jump to.
 *
 * Anchored parts are the ones `toPulseSections` lists, which is exactly the set
 * the outline made marks for — an unanchored part renders identically, it just
 * has no mark pointing at it, so the ruler can never offer a jump that lands
 * nowhere.
 */
function PulseStoryAnchor({
	anchorRef,
	anchored,
	children,
	id,
	isDimmed,
}: Readonly<{
	anchorRef: (id: string) => RefCallback<HTMLElement>;
	anchored: boolean;
	children: ReactNode;
	id: string;
	isDimmed: boolean;
}>) {
	if (!anchored) {
		return children;
	}
	return (
		<div
			className={cn(
				SECTION_FOCUS_TRANSITION,
				isDimmed ? SECTION_DIMMED : SECTION_FOCUSED,
			)}
			id={id}
			ref={anchorRef(id)}
		>
			{children}
		</div>
	);
}

/**
 * Who produced this window, as faces, directly under the headline.
 *
 * The roster list used to live in the rail. Attribution belongs next to the
 * claim it supports, so the faces sit on the insight itself — and because each
 * face is the filter control, "who said this" and "show me only them" are the
 * same gesture.
 */
function PulseStoryContributors({
	contributors,
	onSelectMember,
	selectedMemberId,
}: Readonly<{
	contributors: readonly PulseMember[];
	onSelectMember: (memberId: string | null) => void;
	selectedMemberId: string | null;
}>) {
	return (
		<div className="flex min-w-0 items-center gap-1">
			{contributors.length === 0 ? null : (
				<>
					{/* Visible "By" is decorative; the group name already says who these faces are. */}
					<span aria-hidden className={cn("shrink-0", PULSE_ROW_META)}>By</span>
					<AvatarGroup
						label="By contributors in this window"
						size="xs"
						// Leftmost-on-top, matching the board header's facepile: DOM order is
						// tab order, so the stacking is done with z-index. The shared group
						// also gives hexagon avatars their shape-aware separator. Overlap
						// comes from AvatarGroup's xs `-space-x-1`.
						className="isolate -mx-0.5 min-w-0 items-center px-0.5 [&>*]:relative [&>*:nth-child(1)]:z-[8] [&>*:nth-child(2)]:z-[7] [&>*:nth-child(3)]:z-[6] [&>*:nth-child(4)]:z-[5] [&>*:nth-child(5)]:z-[4] [&>*:nth-child(6)]:z-[3] [&>*:nth-child(7)]:z-[2] [&>*:nth-child(8)]:z-[1]"
					>
						{contributors.map((member) => {
							const isSelected = member.id === selectedMemberId;
							return (
								<button
									aria-label={isSelected
										? `Clear filter: ${member.name}`
										: `Show only ${member.name}, ${member.role}`}
									aria-pressed={isSelected}
									className="focus-visible:ring-ring/50 flex size-4 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-3"
									key={member.id}
									onClick={() => onSelectMember(isSelected ? null : member.id)}
									title={`${member.name} · ${member.role}`}
									type="button"
								>
									<Avatar
										className={cn(
											"duration-normal ease-out-practical transition-opacity motion-reduce:transition-none",
											member.kind === "human" ? "ring-2 ring-surface" : null,
											member.kind === "human" && isSelected ? "ring-border-selected!" : null,
											member.kind === "agent" && isSelected ? "[&>svg]:text-border-selected!" : null,
											selectedMemberId !== null && !isSelected ? "opacity-(--opacity-disabled)" : null,
										)}
										label={member.name}
										shape={member.kind === "agent" ? "hexagon" : "circle"}
										size="xs"
									>
										<AvatarImage alt="" src={member.avatarSrc} />
										<AvatarFallback>{getMemberInitials(member.name)}</AvatarFallback>
									</Avatar>
								</button>
							);
						})}
					</AvatarGroup>
					<span aria-hidden className={cn("shrink-0", PULSE_ROW_META)}>·</span>
				</>
			)}
			<span className={cn("shrink-0", PULSE_ROW_META)}>
				{PULSE_SOURCES.length}<span className="sr-only"> sources from Jira, Confluence, GitHub, Slack, and 10 more</span>
			</span>
			<TWGAppstack
				animated={false}
				aria-hidden
				className="justify-start"
				iconSize="xxsmall"
				maxVisible={4}
				sources={PULSE_SOURCES}
			/>
		</div>
	);
}

/**
 * The window's numbers, as a ruled label/value list under the faces.
 *
 * These moved out of the rail because they describe the story, not the work
 * queue beside it — read after the title and faces they answer "how big was
 * this" before the prose explains what happened.
 */
function PulseStoryStats({ stats }: Readonly<{ stats: readonly PulseStat[] }>) {
	if (stats.length === 0) {
		return null;
	}
	return (
		<dl className={cn("mt-6 min-w-0", MEASURE)}>
			{stats.map((stat) => (
				<div
					className="flex min-w-0 items-baseline justify-between gap-6 border-b border-border py-2.5 last:border-b-0"
					key={stat.id}
				>
					<dt className={cn("min-w-0 truncate", PULSE_ITEM_BODY)}>{stat.label}</dt>
					<dd className="shrink-0 text-[18px] leading-6 font-medium tracking-[-0.01em] text-text tabular-nums">
						{stat.value}
					</dd>
				</div>
			))}
		</dl>
	);
}

function getMemberInitials(name: string) {
	return name
		.split(" ")
		.map((part) => part.charAt(0))
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

function getFirstName(name: string) {
	return name.split(" ")[0] ?? name;
}

function toEmptyNote(firstName: string, count: number, noun: string, plural: string) {
	if (count === 0) {
		return `Nothing here for ${firstName}, and nothing for the team either.`;
	}
	return `Nothing for ${firstName} here — ${count} ${count === 1 ? noun : plural} across the team.`;
}

function openArtifact(item: ArtifactListItem) {
	if (!item.href) return;
	window.open(item.href, "_blank", "noopener,noreferrer");
}

function PulseStoryProse({ paragraphs }: Readonly<{ paragraphs: readonly string[] }>) {
	return (
		<div className={cn("mt-7 flex flex-col gap-6", MEASURE)}>
			{paragraphs.map((paragraph) => (
				<p className="text-base/6 tracking-[-0.011em] text-pretty text-text" key={paragraph}>
					{paragraph}
				</p>
			))}
		</div>
	);
}

/** The scoped body: who this is, what they did, and the way back to the team. */
function PulseStoryMemberBody({
	contribution,
	member,
	nextActive,
	onGoToIndex,
	onSelectMember,
	previousActive,
	quietNote,
	teamHeadline,
}: Readonly<{
	contribution: PulseContribution | null;
	member: PulseMember;
	nextActive?: PulseStoryJump | null;
	onGoToIndex: (index: number, options?: PulseScrollOptions) => void;
	onSelectMember: (memberId: string | null) => void;
	previousActive?: PulseStoryJump | null;
	quietNote?: string;
	teamHeadline: string;
}>) {
	const firstName = getFirstName(member.name);

	return (
		<div className={cn("mt-5", MEASURE)}>
			<div className="flex min-w-0 items-center gap-2.5">
				<Avatar shape={member.kind === "agent" ? "hexagon" : "circle"} size="sm">
					<AvatarImage alt="" src={member.avatarSrc} />
					<AvatarFallback>{getMemberInitials(member.name)}</AvatarFallback>
				</Avatar>
				<p className="min-w-0 truncate text-sm leading-5 text-text-subtle">
					{member.role}
					{member.timezone === undefined ? null : (
						<>
							<span aria-hidden className="text-text-subtlest"> · </span>
							{member.timezone}
						</>
					)}
				</p>
			</div>

			{contribution === null ? (
				<div className="mt-6">
					<p className="text-base/6 tracking-[-0.011em] text-pretty text-text">
						{`No activity from ${firstName} in this window.`}
					</p>
					{quietNote === undefined ? null : (
						<p className={cn("mt-1", PULSE_ITEM_BODY)}>{quietNote}</p>
					)}
					<div className="mt-5 flex flex-wrap items-center gap-2">
						{previousActive === null || previousActive === undefined ? null : (
							<Button onClick={() => onGoToIndex(previousActive.index)} size="compact" type="button" variant="outline">
								{`Last active ${previousActive.label}`}
							</Button>
						)}
						{nextActive === null || nextActive === undefined ? null : (
							<Button onClick={() => onGoToIndex(nextActive.index)} size="compact" type="button" variant="outline">
								{`Next active ${nextActive.label}`}
							</Button>
						)}
					</div>
					<Button className="mt-2 px-0" onClick={() => onSelectMember(null)} size="compact" type="button" variant="link">
						See what the team did in this window
					</Button>
				</div>
			) : (
				<p className="mt-6 text-base/6 tracking-[-0.011em] text-pretty text-text">{contribution.summary}</p>
			)}

			<p className={cn("mt-7 border-t border-border pt-4", PULSE_ITEM_BODY)}>
				<span className="text-text-subtlest">Team in this window · </span>
				{teamHeadline}
			</p>
		</div>
	);
}

function PulseStoryInsightNav({
	insightCount,
	insightIndex,
	label,
	onGoToIndex,
}: Readonly<{
	insightCount: number;
	insightIndex: number;
	label: string;
	onGoToIndex: (index: number, options?: PulseScrollOptions) => void;
}>) {
	const previousIndex = toAdjacentInsightIndex(insightIndex, insightCount, "previous");
	const nextIndex = toAdjacentInsightIndex(insightIndex, insightCount, "next");
	const isFirst = previousIndex === null;
	const isLast = nextIndex === null;

	return (
		<nav aria-label={`${label} insight navigation`} className="ml-auto flex shrink-0 items-center">
			<Button
				aria-disabled={isFirst}
				aria-label="Previous insight"
				className={cn(isFirst ? "pointer-events-none opacity-(--opacity-disabled)" : null)}
				onClick={() => {
					if (previousIndex === null) return;
					onGoToIndex(previousIndex, { align: "start" });
				}}
				size="icon-compact"
				type="button"
				variant="ghost"
			>
				<Icon aria-hidden render={<ChevronUpIcon label="" size="small" />} />
			</Button>
			<Button
				aria-disabled={isLast}
				aria-label="Next insight"
				className={cn(isLast ? "pointer-events-none opacity-(--opacity-disabled)" : null)}
				onClick={() => {
					if (nextIndex === null) return;
					onGoToIndex(nextIndex, { align: "start" });
				}}
				size="icon-compact"
				type="button"
				variant="ghost"
			>
				<Icon aria-hidden render={<ChevronDownIcon label="" size="small" />} />
			</Button>
		</nav>
	);
}

function PulseStoryArtifacts({
	artifacts,
	emptyNote,
}: Readonly<{ artifacts: readonly ArtifactListItem[]; emptyNote?: string }>) {
	const labelId = `${useId()}-pulse-artifacts`;

	if (artifacts.length === 0 && emptyNote === undefined) return null;

	return (
		<section aria-labelledby={labelId} className={cn("mt-8 min-w-0", MEASURE)}>
			<PulseSectionLabel id={labelId}>Artifacts</PulseSectionLabel>
			{artifacts.length === 0 ? (
				<p className={cn("mt-3", PULSE_ITEM_BODY)}>{emptyNote}</p>
			) : (
				<ArtifactList className="mt-3" items={artifacts} onOpen={openArtifact} variant="compact" />
			)}
		</section>
	);
}

export function PulseStory({
	snapshot,
	member,
	contribution,
	artifacts,
	attention,
	nextActions,
	quietNote,
	nextActive,
	previousActive,
	insightCount,
	insightIndex,
	onGoToIndex,
	contributors,
	onSelectMember,
	stats,
	onRequestAction,
	requestedActionIds,
	unscopedCounts,
	anchorRef,
	previewEntryId,
}: Readonly<PulseStoryViewProps>) {
	const headingId = `${useId()}-pulse-story-title`;
	// The outline decides which parts earn a mark; the article reads the same
	// helper so the two can never disagree about what exists.
	const anchoredSections = new Set(toPulseSections(snapshot));
	const firstName = member === null ? "" : getFirstName(member.name);
	const insightId = toPulseAnchorId(snapshot.id);
	const artifactsId = toPulseAnchorId(snapshot.id, "artifacts");
	const attentionId = toPulseAnchorId(snapshot.id, "attention");
	const actionsId = toPulseAnchorId(snapshot.id, "actions");
	const eyebrow = member === null
		? `${snapshot.chapterLabel} · ${snapshot.rangeLabel}`
		: `${member.name} · ${snapshot.chapterLabel} · ${snapshot.rangeLabel}`;
	const headline = member === null ? snapshot.title : member.name;

	return (
		<section aria-labelledby={headingId} className="flex min-w-0 flex-col">
			{/* The insight intro — head plus prose — is one ruler block. A jump
			    lands on its naming line while preview keeps the whole intro together. */}
			<div
				className={cn(
					SECTION_FOCUS_TRANSITION,
					isPulseSectionDimmed(previewEntryId, insightId) ? SECTION_DIMMED : SECTION_FOCUSED,
				)}
				id={insightId}
				ref={anchorRef(insightId)}
			>
				<div className={cn("flex min-h-6 min-w-0 items-center", MEASURE)}>
					<p className={cn("min-w-0 truncate", PULSE_EYEBROW)}>{eyebrow}</p>
					<PulseStoryInsightNav
						insightCount={insightCount}
						insightIndex={insightIndex}
						label={snapshot.chapterLabel}
						onGoToIndex={onGoToIndex}
					/>
				</div>

				<h2 className={cn("mt-7 text-pretty text-text", MEASURE)} id={headingId} style={HEADLINE_STYLE}>
					{headline}
				</h2>

				<div className="mt-3 min-w-0">
					<PulseStoryContributors
						contributors={contributors}
						onSelectMember={onSelectMember}
						selectedMemberId={member?.id ?? null}
					/>
				</div>

				<PulseStoryStats stats={stats} />

				{member === null ? (
					<PulseStoryProse paragraphs={snapshot.paragraphs} />
				) : (
					<PulseStoryMemberBody
						contribution={contribution}
						member={member}
						nextActive={nextActive}
						onGoToIndex={onGoToIndex}
						onSelectMember={onSelectMember}
						previousActive={previousActive}
						quietNote={quietNote}
						teamHeadline={snapshot.title}
					/>
				)}
			</div>

			<PulseStoryAnchor
				anchorRef={anchorRef}
				anchored={anchoredSections.has("artifacts")}
				id={artifactsId}
				isDimmed={isPulseSectionDimmed(previewEntryId, artifactsId)}
			>
				<PulseStoryArtifacts
					artifacts={artifacts}
					emptyNote={member === null
						? undefined
						: toEmptyNote(firstName, unscopedCounts.artifacts, "artifact", "artifacts")}
				/>
			</PulseStoryAnchor>

			<PulseStoryAnchor
				anchorRef={anchorRef}
				anchored={anchoredSections.has("attention")}
				id={attentionId}
				isDimmed={isPulseSectionDimmed(previewEntryId, attentionId)}
			>
				<PulseAttention
					className={cn("mt-8", MEASURE)}
					emptyNote={member === null
						? undefined
						: toEmptyNote(firstName, unscopedCounts.attention, "item needs attention", "items need attention")}
					members={contributors}
					signals={attention}
				/>
			</PulseStoryAnchor>

			<PulseStoryAnchor
				anchorRef={anchorRef}
				anchored={anchoredSections.has("actions")}
				id={actionsId}
				isDimmed={isPulseSectionDimmed(previewEntryId, actionsId)}
			>
				<PulseNextActions
					actions={nextActions}
					className={cn("mt-8", MEASURE)}
					emptyNote={member === null
						? undefined
						: toEmptyNote(firstName, unscopedCounts.nextActions, "action", "actions")}
					onRequestAction={onRequestAction}
					requestedActionIds={requestedActionIds}
				/>
			</PulseStoryAnchor>
		</section>
	);
}
