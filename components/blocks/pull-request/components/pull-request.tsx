"use client";

import BranchIcon from "@atlaskit/icon/core/branch";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RelativeTime } from "@/components/ui/elapsed-time";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { BrandLogoMark } from "@/components/ui/logo-mark";
import { Lozenge, type LozengeProps } from "@/components/ui/lozenge";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";

import type {
	PullRequestAuthor,
	PullRequestProps,
	PullRequestStatus,
} from "@/components/blocks/pull-request/components/pull-request-types";

export type {
	PullRequestAuthor,
	PullRequestProps,
	PullRequestStatus,
} from "@/components/blocks/pull-request/components/pull-request-types";

function getInitials(name: string): string {
	return name
		.split(/\s+/u)
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

function statusLozengeVariant(
	status: PullRequestStatus,
): NonNullable<LozengeProps["variant"]> {
	switch (status) {
		case "Open":
			return "information";
		case "Merged":
			return "discovery";
		default: {
			const _exhaustive: never = status;
			return _exhaustive;
		}
	}
}

function PullRequestAuthorAvatar({
	author,
}: Readonly<{ author: PullRequestAuthor }>) {
	return (
		<Avatar label={author.name} size="default" shape="circle">
			{author.avatarUrl ? (
				<AvatarImage alt={author.name} src={author.avatarUrl} />
			) : null}
			<AvatarFallback>{getInitials(author.name)}</AvatarFallback>
		</Avatar>
	);
}

function PullRequestDiffStats({
	additions,
	deletions,
}: Readonly<{ additions: number; deletions: number }>) {
	return (
		<span
			aria-label={`${additions} additions, ${deletions} deletions`}
			className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium tabular-nums leading-4"
			role="group"
		>
			<span className="text-text-success">+{additions}</span>
			<span className="text-text-danger">-{deletions}</span>
		</span>
	);
}

function PullRequestMetaTime({
	relativeTime,
	selected,
	timestampMs,
}: Readonly<{ relativeTime?: string; selected: boolean; timestampMs?: number }>) {
	const hasTimestamp = typeof timestampMs === "number" && Number.isFinite(timestampMs);
	if (!hasTimestamp && !relativeTime) return null;

	return (
		<RelativeTime
			className={cn(
				"shrink-0 text-xs leading-4",
				selected ? "text-text-selected" : "text-text-subtlest",
			)}
			fallback={relativeTime}
			timestampMs={hasTimestamp ? timestampMs : undefined}
		/>
	);
}

function PullRequestCardBody({
	number,
	title,
	status,
	author,
	repository,
	branch,
	additions,
	deletions,
	relativeTime,
	selected,
	timestampMs,
}: Readonly<
	Pick<
		PullRequestProps,
		| "number"
		| "title"
		| "status"
		| "author"
		| "repository"
		| "branch"
		| "additions"
		| "deletions"
		| "relativeTime"
		| "selected"
		| "timestampMs"
	>
>) {
	const titleLabel = `#${number} ${title}`;

	return (
		<>
			{author ? <PullRequestAuthorAvatar author={author} /> : null}
			<div className="flex min-w-0 flex-1 flex-col gap-1.5">
				<div className="flex min-w-0 items-start gap-2">
					<span className="min-w-0 flex-1 truncate text-left text-sm font-semibold leading-5 text-text">
						{titleLabel}
					</span>
					<PullRequestDiffStats additions={additions} deletions={deletions} />
				</div>
				<div className="flex min-w-0 flex-nowrap items-center gap-1.5 overflow-hidden">
					<PullRequestMetaTime
						relativeTime={relativeTime}
						selected={selected ?? false}
						timestampMs={timestampMs}
					/>
					{repository ? (
						<Tag
							color="gray"
							elemBefore={<BrandLogoMark frame="chip" label="GitHub" name="github" />}
							maxWidth="9rem"
						>
							{repository}
						</Tag>
					) : null}
					<Lozenge size="compact" variant={statusLozengeVariant(status)}>
						{status}
					</Lozenge>
					{branch ? (
						<Tag
							color="gray"
							elemBefore={
								<IconTile
									aria-hidden
									icon={<Icon aria-hidden render={<BranchIcon label="" size="small" />} />}
									label=""
									size="xxsmall"
									variant="transparent"
								/>
							}
							maxWidth="7.5rem"
						>
							{branch}
						</Tag>
					) : null}
				</div>
			</div>
		</>
	);
}

/**
 * Compact pull-request summary card: author avatar, `#N title`, diff stats,
 * relative time, and repo / status / branch pills.
 */
export function PullRequest({
	number,
	title,
	status,
	author,
	repository,
	branch,
	additions,
	deletions,
	relativeTime,
	timestampMs,
	selected = false,
	onActivate,
	className,
}: Readonly<PullRequestProps>) {
	const activeSelected = Boolean(onActivate && selected);
	const body = (
		<PullRequestCardBody
			additions={additions}
			author={author}
			branch={branch}
			deletions={deletions}
			number={number}
			relativeTime={relativeTime}
			repository={repository}
			selected={activeSelected}
			status={status}
			timestampMs={timestampMs}
			title={title}
		/>
	);

	const surfaceClassName = cn(
		"flex w-full min-w-0 items-start gap-3 rounded-lg border border-border bg-surface p-3 text-text",
		onActivate
			? "cursor-pointer text-left outline-none transition-[background-color,border-color] duration-normal ease-out-practical hover:bg-surface-hovered focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
			: null,
		activeSelected
			? "border-border-selected bg-bg-selected text-text-selected hover:bg-bg-selected-hovered"
			: null,
		className,
	);

	if (onActivate) {
		return (
			<button
				aria-label={`Pull request #${number}: ${title}`}
				aria-pressed={selected}
				className={surfaceClassName}
				data-pull-request={number}
				data-selected={selected ? "true" : undefined}
				onClick={onActivate}
				type="button"
			>
				{body}
			</button>
		);
	}

	return (
		<div
			aria-label={`Pull request #${number}: ${title}`}
			className={surfaceClassName}
			data-pull-request={number}
			role="group"
		>
			{body}
		</div>
	);
}
