"use client";

import { useReducedMotion } from "motion/react";

import { InlineEdit } from "@/components/ui/inline-edit";
import {
	useAgentSessionsActions,
	useAgentSessionsState,
} from "@/components/blocks/agent-sessions/experimental/context-agent-sessions";
import {
	CONTEXT_DESCRIPTION_READ_VIEW_CLASS_NAME,
	CONTEXT_DESCRIPTION_TEXTAREA_CLASS_NAME,
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

/** Click-to-edit work item description (multiline). */
export function ContextEditableDescription() {
	const { contextResources } = useAgentSessionsState();
	const actions = useAgentSessionsActions();
	const shouldReduceMotion = useReducedMotion();
	return (
		<InlineEdit
			value={contextResources.description}
			placeholder="Add a description"
			editButtonLabel="Edit work item description"
			multiline
			readViewClassName={CONTEXT_DESCRIPTION_READ_VIEW_CLASS_NAME}
			readViewMotionProps={shouldReduceMotion ? undefined : CONTEXT_INLINE_EDIT_MOTION_PROPS}
			readViewBackdropClassName={shouldReduceMotion ? undefined : CONTEXT_INLINE_EDIT_BACKDROP_CLASS_NAME}
			readViewBackdropMotionProps={shouldReduceMotion ? undefined : CONTEXT_INLINE_EDIT_BACKDROP_MOTION_PROPS}
			textareaProps={{ rows: 3, className: CONTEXT_DESCRIPTION_TEXTAREA_CLASS_NAME }}
			onConfirm={(value) => actions.editContextText("description", value)}
		/>
	);
}
