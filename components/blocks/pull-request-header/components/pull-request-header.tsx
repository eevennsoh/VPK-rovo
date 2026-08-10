"use client";

import { useCallback, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GithubLogo } from "@/components/ui/logo-third-party";
import { Lozenge, type LozengeProps } from "@/components/ui/lozenge";
import { ExternalLinkIcon } from "@/components/ui/vpk-icons";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import type {
	PullRequestHeaderProps,
	PullRequestHeaderStatus,
	PullRequestHeaderVariant,
} from "@/components/blocks/pull-request-header/components/pull-request-header-types";

export type {
	PullRequestHeaderProps,
	PullRequestHeaderStatus,
	PullRequestHeaderVariant,
} from "@/components/blocks/pull-request-header/components/pull-request-header-types";

const DEFAULT_COLLAPSE_OFFSET = 16;
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
 * Full-width pull-request detail header: `#N` + title + status, Open in GitHub
 * CTA, author + branch pills, and repository / diff / updated meta.
 */
export function PullRequestHeader({
	variant,
	scrollContainerRef,
	collapseOffset = DEFAULT_COLLAPSE_OFFSET,
	number,
	title,
	status,
	authorName,
	authorAvatarSrc,
	baseBranch,
	headBranch,
	repository,
	additions,
	deletions,
	updatedTime,
	url,
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
				<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
					<div className="min-w-0">
						<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
							<span className="shrink-0 text-text-subtle">#{number}</span>
							<h1
								className="min-w-0 text-text"
								style={{ font: token("font.heading.medium") }}
							>
								{title}
							</h1>
							<Lozenge variant={statusLozengeVariant(status)}>
								{status}
							</Lozenge>
						</div>
					</div>
					<Button
						className="w-full sm:w-auto"
						nativeButton={false}
						render={
							<a
								href={url}
								rel="noreferrer noopener"
								target="_blank"
							/>
						}
						variant="outline"
					>
						Open in GitHub
						<ExternalLinkIcon aria-hidden data-icon="inline-end" size="small" />
					</Button>
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
							<div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 text-xs text-text-subtle">
								<Avatar label={authorName} size="xs">
									{authorAvatarSrc ? (
										<AvatarImage alt="" src={authorAvatarSrc} />
									) : null}
									<AvatarFallback>
										{authorName.slice(0, 1).toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<span className="font-medium text-text">{authorName}</span>
								{baseBranch && headBranch ? (
									<>
										<code className="rounded-sm bg-bg-neutral px-1.5 py-0.5 text-text">
											{baseBranch}
										</code>
										<span aria-hidden className="text-text">
											←
										</span>
										<code className="max-w-full truncate rounded-sm bg-bg-neutral px-1.5 py-0.5 text-text">
											{headBranch}
										</code>
									</>
								) : null}
							</div>
							<div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-text-subtle">
								<span className="inline-flex min-w-0 items-center gap-1.5">
									<GithubLogo aria-hidden borderless label="" size="xxsmall" />
									<span className="truncate">{repository}</span>
								</span>
								<span className="flex shrink-0 items-center gap-2">
									<span className="text-text-success">+{additions}</span>
									<span className="text-text-danger">-{deletions}</span>
									<span aria-hidden>·</span>
									<span>Updated {updatedTime}</span>
								</span>
							</div>
						</motion.div>
					) : null}
				</AnimatePresence>
			</motion.div>
		</header>
	);
}
