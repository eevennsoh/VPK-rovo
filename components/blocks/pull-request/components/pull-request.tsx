"use client";

import ArrowRightIcon from "@atlaskit/icon/core/arrow-right";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
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
			return "success";
		case "Merged":
			return "discovery";
		default: {
			const _exhaustive: never = status;
			return _exhaustive;
		}
	}
}

/** First path segment stays subtle (`rovo/…`); the remainder uses body text. */
function BranchName({ name }: Readonly<{ name: string }>) {
	const slashIndex = name.indexOf("/");
	if (slashIndex === -1) {
		return <span className="min-w-0 truncate text-text">{name}</span>;
	}

	return (
		<span className="min-w-0 truncate">
			<span className="text-text-subtlest">{name.slice(0, slashIndex + 1)}</span>
			<span className="text-text">{name.slice(slashIndex + 1)}</span>
		</span>
	);
}

function PullRequestAuthorAvatar({
	author,
}: Readonly<{ author: PullRequestAuthor }>) {
	return (
		<Avatar label={author.name} size="sm" shape="circle">
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
			className="inline-flex shrink-0 items-center gap-1 text-xs font-medium tabular-nums leading-4"
			role="group"
		>
			<span className="text-text-success">+{additions}</span>
			<span className="text-text-danger">-{deletions}</span>
		</span>
	);
}

function PullRequestBranchPath({
	branch,
	targetBranch,
}: Readonly<{ branch?: string; targetBranch?: string }>) {
	if (!branch && !targetBranch) return null;

	return (
		<span
			aria-label={
				branch && targetBranch
					? `${branch} into ${targetBranch}`
					: (branch ?? targetBranch)
			}
			className="inline-flex min-w-0 shrink items-center gap-1 overflow-hidden text-xs leading-5"
		>
			{/* Source truncates; target/base stays full (`main`, not `m…`). */}
			{branch ? <BranchName name={branch} /> : null}
			{branch && targetBranch ? (
				<span className="inline-flex size-3 shrink-0 items-center justify-center text-icon-subtle">
					<Icon aria-hidden render={<ArrowRightIcon label="" size="small" />} />
				</span>
			) : null}
			{targetBranch ? (
				<span className="shrink-0 text-text">{targetBranch}</span>
			) : null}
		</span>
	);
}

function PullRequestCardBody({
	number,
	title,
	status,
	author,
	repository,
	branch,
	targetBranch,
	additions,
	deletions,
}: Readonly<
	Pick<
		PullRequestProps,
		| "number"
		| "title"
		| "status"
		| "author"
		| "repository"
		| "branch"
		| "targetBranch"
		| "additions"
		| "deletions"
	>
>) {
	return (
		<>
			{author ? <PullRequestAuthorAvatar author={author} /> : null}
			<div className="flex min-w-0 flex-1 flex-col">
				<div className="flex min-w-0 items-center gap-2">
					<span className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden text-sm font-medium leading-5">
						<span className="shrink-0 text-text-subtlest">#{number}</span>
						<span className="min-w-0 truncate text-text">{title}</span>
					</span>
					<PullRequestDiffStats additions={additions} deletions={deletions} />
				</div>
				<div className="flex min-w-0 flex-nowrap items-center gap-1 overflow-hidden">
					<Lozenge size="compact" variant={statusLozengeVariant(status)}>
						{status}
					</Lozenge>
					{repository ? (
						<Tag
							color="gray"
							elemBefore={
								<BrandLogoMark
									className="dark:invert [[data-color-mode=dark]_&]:invert"
									frame="chip"
									label="GitHub"
									name="github"
								/>
							}
							maxWidth="9rem"
						>
							{repository}
						</Tag>
					) : null}
					<PullRequestBranchPath branch={branch} targetBranch={targetBranch} />
				</div>
			</div>
		</>
	);
}

/**
 * Compact pull-request summary card: author avatar, split `#N` + title, diff
 * stats, status lozenge, repo pill, and `source → target` branch path.
 */
export function PullRequest({
	number,
	title,
	status,
	author,
	repository,
	branch,
	targetBranch,
	additions,
	deletions,
	selected = false,
	onActivate,
	className,
}: Readonly<PullRequestProps>) {
	// Apply selected chrome whenever `selected` is set (e.g. interactive list
	// cards with onActivate). Dropdown options should omit `selected` and keep
	// an idle surface — SelectItem owns activation; the trigger shows state.
	const activeSelected = selected;
	const body = (
		<PullRequestCardBody
			additions={additions}
			author={author}
			branch={branch}
			deletions={deletions}
			number={number}
			repository={repository}
			status={status}
			targetBranch={targetBranch}
			title={title}
		/>
	);

	const surfaceClassName = cn(
		"flex w-full min-w-0 items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-text",
		onActivate
			? "cursor-pointer text-left outline-none transition-[background-color,border-color] duration-normal ease-out-practical hover:bg-surface-hovered focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
			: null,
		activeSelected
			? "border-border-selected bg-bg-selected text-text-selected"
			: null,
		onActivate && activeSelected
			? "hover:bg-bg-selected-hovered"
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
			aria-current={selected ? "true" : undefined}
			aria-label={`Pull request #${number}: ${title}`}
			className={surfaceClassName}
			data-pull-request={number}
			data-selected={selected ? "true" : undefined}
			role="group"
		>
			{body}
		</div>
	);
}
