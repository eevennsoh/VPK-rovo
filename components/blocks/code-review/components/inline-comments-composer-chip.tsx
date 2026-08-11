"use client";

import CommentIcon from "@atlaskit/icon/core/comment";
import CrossIcon from "@atlaskit/icon/core/cross";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import type { InlineReviewComment } from "../lib/inline-comments";
import { formatInlineCommentLineLabel } from "../lib/inline-comments";

interface InlineCommentsComposerChipProps {
	comments: readonly InlineReviewComment[];
	onRemoveAll: () => void;
}

export function InlineCommentsComposerChip({
	comments,
	onRemoveAll,
}: Readonly<InlineCommentsComposerChipProps>) {
	const countLabel = `${comments.length} ${comments.length === 1 ? "comment" : "comments"}`;

	return (
		<div
			className="inline-flex min-w-0 max-w-full items-center rounded-md border border-border bg-bg-neutral-subtle"
			data-testid="inline-comments-chip"
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
					className="max-h-72 w-[min(22rem,calc(100vw-2rem))] gap-0 overflow-y-auto p-0"
					positionerClassName="z-[600]"
					side="top"
					sideOffset={8}
				>
					<ul className="divide-y divide-border">
						{comments.map((comment) => (
							<li className="min-w-0 px-3 py-2" key={comment.id}>
								<div className="truncate text-xs font-semibold text-text" title={comment.filePath}>
									{comment.filePath}
								</div>
								<div className="mt-0.5 text-xs text-text-subtle">
									{formatInlineCommentLineLabel(comment)}
								</div>
								<p className="mt-1 whitespace-pre-wrap break-words text-sm text-text">{comment.body}</p>
							</li>
						))}
					</ul>
				</PopoverContent>
			</Popover>
			<Button
				aria-label="Remove all inline comments"
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
