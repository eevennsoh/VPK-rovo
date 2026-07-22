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
	drafts: readonly InlineCommentDraft[];
	comments: readonly InlineReviewComment[];
	onAddDraft: (anchor: InlineCommentAnchor) => void;
	onCancelDraft: (draftId: string) => void;
	onCommitDraft: (draftId: string) => void;
	onDeleteComment: (commentId: string) => void;
	onLayoutChange: (layout: DiffLayout) => void;
	onUpdateDraft: (draftId: string, body: string) => void;
}

export function EditorDiff({
	file,
	layout,
	drafts,
	comments,
	onAddDraft,
	onCancelDraft,
	onCommitDraft,
	onDeleteComment,
	onLayoutChange,
	onUpdateDraft,
}: Readonly<EditorDiffProps>) {
	return (
		<section className="flex min-h-0 min-w-0 flex-col bg-surface">
			<div className="flex h-9 shrink-0 items-stretch border-b border-border bg-surface-sunken">
				<div className="flex items-center gap-1 border-r border-border bg-surface px-3 text-xs text-text">
					<Icon aria-hidden className="text-icon-accent-orange" render={<CurlyBracketsIcon label="" size="small" />} />
					<span>{file.path}</span>
					<Button aria-label={`Close ${file.path}`} size="icon-compact" variant="ghost">
						<CrossIcon label="" size="small" />
					</Button>
				</div>
				<ButtonGroup
					aria-label="Editor diff layout"
					className="my-auto ml-auto mr-2"
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
			<div className="flex h-7 shrink-0 items-center border-b border-border bg-surface-sunken px-3 font-mono text-xs text-text-subtle">
				{file.hunkHeader ?? "Diff"}
			</div>
			<ScrollArea className="min-h-0 flex-1">
				<DiffFileView
					comments={comments}
					drafts={drafts}
					file={file}
					layout={layout}
					onAddDraft={onAddDraft}
					onCancelDraft={onCancelDraft}
					onCommitDraft={onCommitDraft}
					onDeleteComment={onDeleteComment}
					onUpdateDraft={onUpdateDraft}
				/>
			</ScrollArea>
		</section>
	);
}
