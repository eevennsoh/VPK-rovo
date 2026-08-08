"use client";

import { EDITOR_PALETTE_MENTION_SOURCES } from "@/components/blocks/editor-palette/data/mention-sources";
import type { EditorToolbarViewMode } from "@/components/blocks/editor-toolbar";
import { RichTextEditor } from "@/components/ui-custom/rich-text-editor";
import "@/components/ui-custom/rich-text-editor/rich-text-editor.css";
import { isPlannerProcessing } from "@/components/blocks/jira-work-item/data/planner-state";
import {
	useJiraWorkItemActions,
	useJiraWorkItemState,
} from "@/components/blocks/jira-work-item/experimental-v2/context-jira-work-item";
import {
	CONTEXT_TITLE_FONT_STYLE,
	CONTEXT_TITLE_READ_VIEW_CLASS_NAME,
} from "@/components/blocks/jira-work-item/experimental-v2/components/inline-edit-treatment";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Live work item title field.
 *
 * Matches the description editor’s direct-edit UX: click/focus the text and
 * type — no InlineEdit read-view button, confirm/cancel, or hover-to-reveal
 * chrome. Commits on every keystroke via `editContextText`.
 */
export function ContextEditableTitle() {
	const { contextResources } = useJiraWorkItemState();
	const actions = useJiraWorkItemActions();
	return (
		<Input
			aria-label="Work item title"
			className={cn(
				CONTEXT_TITLE_READ_VIEW_CLASS_NAME,
				"w-full min-w-0 rounded-none text-text focus-visible:ring-0",
			)}
			data-jira-work-item-title
			placeholder="Add a title"
			style={CONTEXT_TITLE_FONT_STYLE}
			value={contextResources.title}
			variant="none"
			onChange={(event) => actions.editContextText("title", event.currentTarget.value)}
		/>
	);
}

/**
 * Live work item description editor.
 *
 * Unlike the former click-to-edit title, the description is a live TipTap
 * editor (like Studio's instructions/description): edits commit on every
 * keystroke via `editContextText`, with no confirm/cancel inline-edit step.
 * The rendered and Markdown views are controlled from the resource row above,
 * while the directory-backed slash menu keeps the same agent/skill sources.
 */
export function ContextEditableDescription({
	viewMode,
	onViewModeChange,
}: Readonly<{
	viewMode: EditorToolbarViewMode;
	onViewModeChange: (mode: EditorToolbarViewMode) => void;
}>) {
	const { contextResources, planner } = useJiraWorkItemState();
	const actions = useJiraWorkItemActions();
	// While the Teamwork Graph planner is running, drop the editor's min-height so
	// the description hugs its content instead of reserving empty space.
	const isProcessing = isPlannerProcessing(planner);
	return (
		<RichTextEditor
			aria-label="Work item description"
			className="min-w-0 space-y-0"
			editorClassName={cn(
				"agent-instructions-tiptap-editor context-description-tiptap-editor text-text",
				isProcessing && "context-description-tiptap-editor-hug",
			)}
			enableDirectoryAutocomplete
			mentionSources={EDITOR_PALETTE_MENTION_SOURCES}
			placeholder="Press / to help improve the work item"
			placeholderSlot={(
				<p className="tiptap-editor text-sm leading-[1.55] text-text-subtlest">
					Press <code>/</code> to help improve the work item
				</p>
			)}
			showToolbar={false}
			suggestionVariant="nested"
			value={contextResources.description}
			viewMode={viewMode}
			onMarkdownChange={(value) => actions.editContextText("description", value)}
			onViewModeChange={onViewModeChange}
		/>
	);
}
