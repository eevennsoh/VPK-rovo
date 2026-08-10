"use client";

import { useCallback, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import CommentIcon from "@atlaskit/icon/core/comment";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { BrandLogoMark } from "@/components/ui/logo-mark";
import { Lozenge, type LozengeProps } from "@/components/ui/lozenge";
import { Tag } from "@/components/ui/tag";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

import type {
	PullRequestHeaderMergeState,
	PullRequestHeaderProps,
	PullRequestHeaderStatus,
	PullRequestHeaderVariant,
} from "@/components/blocks/pull-request-header/components/pull-request-header-types";

export type {
	PullRequestHeaderMergeState,
	PullRequestHeaderProps,
	PullRequestHeaderStatus,
	PullRequestHeaderVariant,
} from "@/components/blocks/pull-request-header/components/pull-request-header-types";

const DEFAULT_COLLAPSE_OFFSET = 16;
const DEFAULT_MERGE_STATE: PullRequestHeaderMergeState = "ready";
const DEFAULT_AUTO_MERGE = true;
const META_ENTER_TRANSITION = {
	duration: 0.2,
	ease: [0, 0.4, 0, 1],
} as const; // duration-medium + ease-out
const META_EXIT_TRANSITION = {
	duration: 0.1,
	ease: [0.6, 0, 0.8, 0.6],
} as const; // duration-fast + ease-in
const LAYOUT_TRANSITION = {
	duration: 0.2,
	ease: [0.4, 0, 0, 1],
} as const; // duration-medium + ease-in-out
const INSTANT_TRANSITION = { duration: 0 } as const;
const TITLE_SIZE_TRANSITION =
	"transition-[font-size] duration-medium ease-in-out motion-reduce:transition-none";

function statusLozengeVariant(
	status: PullRequestHeaderStatus,
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

function mergeStateLabel(mergeState: PullRequestHeaderMergeState): string {
	switch (mergeState) {
		case "checks-running":
			return "Checks running";
		case "merge-conflicts":
			return "Merge conflicts";
		case "ready":
			return "Merge";
		default: {
			const _exhaustive: never = mergeState;
			return _exhaustive;
		}
	}
}

/** Renders `folder/leaf` with parent path segments in subtlest text. */
function BranchName({ name }: Readonly<{ name: string }>) {
	const separatorIndex = name.lastIndexOf("/");
	if (separatorIndex === -1) {
		return <span className="text-text">{name}</span>;
	}

	const parentPath = name.slice(0, separatorIndex + 1);
	const leaf = name.slice(separatorIndex + 1);

	return (
		<span className="text-text">
			<span className="text-text-subtlest">{parentPath}</span>
			{leaf}
		</span>
	);
}

export function resolveVariant({
	variant,
	scrollContainerRef,
	collapseOffset = DEFAULT_COLLAPSE_OFFSET,
}: Pick<
	PullRequestHeaderProps,
	"variant" | "scrollContainerRef" | "collapseOffset"
>): PullRequestHeaderVariant {
	if (variant) {
		return variant;
	}

	return (scrollContainerRef?.current?.scrollTop ?? 0) >= collapseOffset
		? "compact"
		: "expanded";
}

/**
 * Full-width pull-request detail header: `#N` + title with Chat / Auto merge /
 * Merge / More actions group, plus a collapsible meta row for status,
 * repository, and branch direction.
 */
export function PullRequestHeader({
	variant,
	scrollContainerRef,
	collapseOffset = DEFAULT_COLLAPSE_OFFSET,
	number,
	title,
	status,
	baseBranch,
	headBranch,
	repository,
	mergeState = DEFAULT_MERGE_STATE,
	autoMerge,
	defaultAutoMerge = DEFAULT_AUTO_MERGE,
	onAutoMergeChange,
	onChatClick,
	onMergeClick,
	onMoreActionsClick,
	className,
	...props
}: Readonly<PullRequestHeaderProps>) {
	const shouldReduceMotion = useReducedMotion() ?? false;
	const subscribeToScroll = useCallback(
		(onStoreChange: () => void) => {
			const scrollContainer = scrollContainerRef?.current;
			if (variant || !scrollContainer) {
				return () => undefined;
			}

			scrollContainer.addEventListener("scroll", onStoreChange, {
				passive: true,
			});
			return () =>
				scrollContainer.removeEventListener("scroll", onStoreChange);
		},
		[scrollContainerRef, variant],
	);
	const getScrollTop = useCallback(
		() => scrollContainerRef?.current?.scrollTop ?? 0,
		[scrollContainerRef],
	);
	useSyncExternalStore(subscribeToScroll, getScrollTop, () => 0);

	const resolvedVariant = resolveVariant({
		variant,
		scrollContainerRef,
		collapseOffset,
	});
	const enterTransition = shouldReduceMotion
		? INSTANT_TRANSITION
		: META_ENTER_TRANSITION;
	const exitTransition = shouldReduceMotion
		? INSTANT_TRANSITION
		: META_EXIT_TRANSITION;
	const branchPair =
		baseBranch && headBranch
			? { baseBranch, headBranch }
			: null;
	const titleSizeClass =
		resolvedVariant === "compact" ? "text-sm" : "text-base";
	const autoMergeToggleProps =
		autoMerge !== undefined
			? {
					pressed: autoMerge,
					onPressedChange: onAutoMergeChange,
				}
			: {
					defaultPressed: defaultAutoMerge,
					...(onAutoMergeChange
						? { onPressedChange: onAutoMergeChange }
						: {}),
				};

	return (
		<header
			className={cn("border-b border-border pb-4", className)}
			{...props}
		>
			<motion.div
				layout
				transition={
					shouldReduceMotion
						? { layout: INSTANT_TRANSITION }
						: { layout: LAYOUT_TRANSITION }
				}
			>
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
						<span
							className={cn(
								"shrink-0 font-normal text-text-subtlest",
								TITLE_SIZE_TRANSITION,
								titleSizeClass,
							)}
						>
							#{number}
						</span>
						<h1
							className={cn(
								"min-w-0 font-medium text-text",
								TITLE_SIZE_TRANSITION,
								titleSizeClass,
							)}
						>
							{title}
						</h1>
					</div>
					<ButtonGroup
						aria-label="Pull request actions"
						className="w-full sm:w-auto"
						variant="separated"
					>
						<ButtonGroup>
							<Button
								aria-label="Chat"
								onClick={onChatClick}
								size="icon"
								variant="outline"
							>
								<CommentIcon label="" />
							</Button>
						</ButtonGroup>
						<ButtonGroup>
							<Toggle
								aria-label="Auto merge"
								variant="outline"
								{...autoMergeToggleProps}
							>
								Auto merge
							</Toggle>
						</ButtonGroup>
						<ButtonGroup>
							<Button onClick={onMergeClick} variant="outline">
								{mergeStateLabel(mergeState)}
							</Button>
						</ButtonGroup>
						<ButtonGroup>
							<Button
								aria-label="More actions"
								onClick={onMoreActionsClick}
								size="icon"
								variant="outline"
							>
								<ShowMoreHorizontalIcon label="" />
							</Button>
						</ButtonGroup>
					</ButtonGroup>
				</div>
				<AnimatePresence initial={false}>
					{resolvedVariant === "expanded" ? (
						<motion.div
							animate={{ height: "auto", opacity: 1 }}
							className="overflow-hidden"
							exit={{
								height: 0,
								opacity: 0,
								transition: exitTransition,
							}}
							initial={{ height: 0, opacity: 0 }}
							key="pull-request-header-meta"
							transition={enterTransition}
						>
							<div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs text-text-subtle">
								<Lozenge variant={statusLozengeVariant(status)}>
									{status}
								</Lozenge>
								<Tag
									color="gray"
									elemBefore={
										<BrandLogoMark frame="chip" label="GitHub" name="github" />
									}
									maxWidth="14rem"
								>
									{repository}
								</Tag>
								{branchPair ? (
									<span className="min-w-0 truncate">
										<BranchName name={branchPair.headBranch} />
										<span aria-hidden className="px-1 text-text-subtle">
											→
										</span>
										<BranchName name={branchPair.baseBranch} />
									</span>
								) : null}
							</div>
						</motion.div>
					) : null}
				</AnimatePresence>
			</motion.div>
		</header>
	);
}
