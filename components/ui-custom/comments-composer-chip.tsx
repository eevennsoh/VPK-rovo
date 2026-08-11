"use client";

import CommentIcon from "@atlaskit/icon/core/comment";
import CrossIcon from "@atlaskit/icon/core/cross";

import { Button } from "@/components/ui/button";
import { dropdownStyles } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface CommentsComposerChipItem {
	id: string;
	/** Primary line in the popover (file path, author, etc.). */
	title: string;
	/** Optional secondary line (line number, timestamp, etc.). */
	subtitle?: string;
	body: string;
}

interface CommentsComposerChipProps {
	comments: readonly CommentsComposerChipItem[];
	onRemoveAll: () => void;
	/** Accessible label for the dismiss control. */
	removeAllLabel?: string;
	/** Test id for the chip root. Defaults to `comments-composer-chip`. */
	testId?: string;
}

/**
 * One-turn composer context pill for attached comments. Shared by Code Review
 * inline comments and Activity "Add to chat" (sticky activity composer) so both
 * surfaces render the same count chip + popover + dismiss control.
 */
export function CommentsComposerChip({
	comments,
	onRemoveAll,
	removeAllLabel = "Remove all comments",
	testId = "comments-composer-chip",
}: Readonly<CommentsComposerChipProps>) {
	const countLabel = `${comments.length} ${comments.length === 1 ? "comment" : "comments"}`;

	return (
		<div
			className="inline-flex min-w-0 max-w-full items-center rounded-md border border-border bg-bg-neutral-subtle"
			data-testid={testId}
		>
			<Popover>
				<PopoverTrigger
					render={
						<Button
							aria-label={`Review ${countLabel}`}
							className="min-w-0 rounded-r-none border-0 bg-transparent px-2 text-text hover:bg-bg-neutral-subtle-hovered"
							size="compact"
							variant="ghost"
						/>
					}
				>
					<CommentIcon label="" size="small" />
					<span className="truncate">{countLabel}</span>
				</PopoverTrigger>
				<PopoverContent
					align="start"
					className="max-h-72 w-[min(22rem,calc(100vw-2rem))] gap-0 overflow-y-auto p-1"
					positionerClassName="z-[600]"
					side="top"
					sideOffset={8}
				>
					<ul>
						{comments.map((comment, index) => (
							<li className="min-w-0" key={comment.id}>
								{index > 0 ? (
									<hr className={dropdownStyles.separator} />
								) : null}
								<div className="px-3 py-2">
									<div className="truncate text-xs font-semibold text-text" title={comment.title}>
										{comment.title}
									</div>
									{comment.subtitle ? (
										<div className="mt-0.5 text-xs text-text-subtle">
											{comment.subtitle}
										</div>
									) : null}
									<p className="mt-1 whitespace-pre-wrap break-words text-sm text-text">{comment.body}</p>
								</div>
							</li>
						))}
					</ul>
				</PopoverContent>
			</Popover>
			<Button
				aria-label={removeAllLabel}
				className="rounded-l-none border-0 border-l border-border bg-transparent"
				onClick={onRemoveAll}
				size="icon-compact"
				variant="ghost"
			>
				<CrossIcon label="" size="small" />
			</Button>
		</div>
	);
}
