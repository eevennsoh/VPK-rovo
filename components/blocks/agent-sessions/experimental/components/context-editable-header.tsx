"use client";

import { useReducedMotion } from "motion/react";

import { InlineEdit } from "@/components/ui/inline-edit";
import { RichTextEditor } from "@/components/ui-custom/rich-text-editor";
import "@/components/ui-custom/rich-text-editor/rich-text-editor.css";
import {
	useAgentSessionsActions,
	useAgentSessionsState,
} from "@/components/blocks/agent-sessions/experimental/context-agent-sessions";
import {
	CONTEXT_INLINE_EDIT_BACKDROP_CLASS_NAME,
	CONTEXT_INLINE_EDIT_BACKDROP_MOTION_PROPS,
	CONTEXT_INLINE_EDIT_MOTION_PROPS,
	CONTEXT_TITLE_INPUT_CLASS_NAME,
	CONTEXT_TITLE_READ_VIEW_CLASS_NAME,
} from "@/components/blocks/agent-sessions/experimental/components/inline-edit-treatment";

/**
 * Click-to-edit work item title. Rendered separately from the description so the
 * generated summary (TL;DR + next steps) can sit between them, per spec.
 */
export function ContextEditableTitle() {
	const { contextResources } = useAgentSessionsState();
	const actions = useAgentSessionsActions();
	const shouldReduceMotion = useReducedMotion();
	return (
		<InlineEdit
			value={contextResources.title}
			placeholder="Add a title"
			editButtonLabel="Edit work item title"
			readViewClassName={CONTEXT_TITLE_READ_VIEW_CLASS_NAME}
			readViewMotionProps={shouldReduceMotion ? undefined : CONTEXT_INLINE_EDIT_MOTION_PROPS}
			readViewBackdropClassName={shouldReduceMotion ? undefined : CONTEXT_INLINE_EDIT_BACKDROP_CLASS_NAME}
			readViewBackdropMotionProps={shouldReduceMotion ? undefined : CONTEXT_INLINE_EDIT_BACKDROP_MOTION_PROPS}
			inputProps={{ className: CONTEXT_TITLE_INPUT_CLASS_NAME }}
			onConfirm={(value) => actions.editContextText("title", value)}
		/>
	);
}

/**
 * Live work item description editor.
 *
 * Unlike the click-to-edit title, the description is a live TipTap editor (like
 * Studio's instructions/description): edits commit on every keystroke via
 * `editContextText`, with no confirm/cancel inline-edit step. Chrome-free — no
 * toolbar or bubble/floating menus — so it reads as the plain description field.
 */
export function ContextEditableDescription() {
	const { contextResources } = useAgentSessionsState();
	const actions = useAgentSessionsActions();
	return (
		<RichTextEditor
			aria-label="Work item description"
			className="min-w-0 space-y-0"
			editorClassName="-ml-1.5 rounded-md px-1.5 text-text transition-colors hover:bg-bg-neutral-subtle-hovered focus-within:bg-transparent focus-within:hover:bg-transparent"
			placeholder="Add a description"
			showToolbar={false}
			showBubbleMenu={false}
			showFloatingMenu={false}
			value={contextResources.description}
			onMarkdownChange={(value) => actions.editContextText("description", value)}
		/>
	);
}
