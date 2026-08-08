"use client";

import CrossIcon from "@atlaskit/icon/core/cross";
import CurlyBracketsIcon from "@atlaskit/icon/core/curly-brackets";
import LayoutOneColumnIcon from "@atlaskit/icon/core/layout-one-column";
import LayoutTwoColumnsIcon from "@atlaskit/icon/core/layout-two-columns";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Icon } from "@/components/ui/icon";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { ChangedFile, DiffLayout } from "../../data/types";
import type {
	InlineCommentAnchor,
	InlineCommentDraft,
	InlineReviewComment,
} from "../../lib/inline-comments";
import { DiffFileView } from "../diff-file-view";

interface EditorDiffProps {
	file: ChangedFile;
	layout: DiffLayout;
	readOnly?: boolean;
	drafts: readonly InlineCommentDraft[];
	comments: readonly InlineReviewComment[];
	onAddDraft: (anchor: InlineCommentAnchor) => void;
	onCancelDraft: (draftId: string) => void;
	onCommitDraft: (draftId: string) => void;
	onDeleteComment: (commentId: string) => void;
	onUpdateComment: (commentId: string, body: string) => void;
	onLayoutChange: (layout: DiffLayout) => void;
	onUpdateDraft: (draftId: string, body: string) => void;
}

export function EditorDiff({
	file,
	layout,
	readOnly = false,
	drafts,
	comments,
	onAddDraft,
	onCancelDraft,
	onCommitDraft,
	onDeleteComment,
	onUpdateComment,
	onLayoutChange,
	onUpdateDraft,
}: Readonly<EditorDiffProps>) {
	return (
		<section className="flex min-h-0 min-w-0 flex-col bg-surface">
			<div className="flex h-9 shrink-0 items-stretch border-b border-border bg-surface-sunken">
				<div className="flex min-w-0 items-center gap-1 border-r border-border bg-surface px-3 text-xs text-text">
					<Icon aria-hidden className="text-icon-accent-orange" render={<CurlyBracketsIcon label="" size="small" />} />
					<span className="truncate" title={file.path}>{file.path}</span>
					{readOnly ? null : (
						<Button aria-label={`Close ${file.path}`} size="icon-compact" variant="ghost">
							<CrossIcon label="" size="small" />
						</Button>
					)}
				</div>
				{file.additions > 0 || file.deletions > 0 ? (
					<span
						aria-label={`${file.additions} additions, ${file.deletions} deletions`}
						className="ml-auto flex shrink-0 items-center gap-1 text-xs leading-4"
					>
						<span className="text-text-success">+{file.additions}</span>
						<span className="text-text-danger">-{file.deletions}</span>
					</span>
				) : null}
				<ButtonGroup
					aria-label="Editor diff layout"
					className="my-auto ml-2 mr-2"
					variant="connected"
				>
					<Button
						aria-label="Unified diff layout"
						aria-pressed={layout === "unified"}
						onClick={() => onLayoutChange("unified")}
						size="icon-compact"
						variant="outline"
					>
						<LayoutOneColumnIcon label="" size="small" />
					</Button>
					<Button
						aria-label="Split diff layout"
						aria-pressed={layout === "split"}
						onClick={() => onLayoutChange("split")}
						size="icon-compact"
						variant="outline"
					>
						<LayoutTwoColumnsIcon label="" size="small" />
					</Button>
				</ButtonGroup>
			</div>
			{file.hunkHeader ? (
				<div className="flex h-7 shrink-0 items-center border-b border-border bg-surface-sunken px-3 font-mono text-xs text-text-subtle">
					{file.hunkHeader}
				</div>
			) : null}
			<ScrollArea className="min-h-0 flex-1 [&_[data-slot=scroll-area-scrollbar]]:opacity-0 [&_[data-slot=scroll-area-scrollbar]]:transition-opacity hover:[&_[data-slot=scroll-area-scrollbar]]:opacity-100 focus-within:[&_[data-slot=scroll-area-scrollbar]]:opacity-100">
				<DiffFileView
					comments={comments}
					drafts={drafts}
					file={file}
					layout={layout}
					readOnly={readOnly}
					onAddDraft={onAddDraft}
					onCancelDraft={onCancelDraft}
					onCommitDraft={onCommitDraft}
					onDeleteComment={onDeleteComment}
					onUpdateComment={onUpdateComment}
					onUpdateDraft={onUpdateDraft}
				/>
			</ScrollArea>
		</section>
	);
}
