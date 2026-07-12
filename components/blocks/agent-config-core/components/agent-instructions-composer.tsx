"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

import type { EditorToolbarViewMode } from "@/components/blocks/editor-toolbar";
import { AgentSectionLabel } from "@/components/blocks/agent-config-core/components/agent-summary-row";
import { useAgentInstructionsMentions } from "@/components/blocks/agent-config-core/hooks/use-agent-instructions-mentions";
import type {
	AgentConfigFormValue,
	AgentConfigReferenceListFieldName,
	AgentDirectoryKind,
} from "@/components/blocks/agent-config-core/lib/agent-config-model";
import { AGENT_KNOWLEDGE_UPLOAD_TARGET } from "@/components/blocks/agent-config-core/lib/agent-reference-mapping";
import {
	type RichTextMentionRemovalRequest,
	RichTextEditor,
} from "@/components/ui-custom/rich-text-editor";
import "@/components/ui-custom/rich-text-editor/rich-text-editor.css";
import { cn } from "@/lib/utils";

export { AGENT_KNOWLEDGE_UPLOAD_TARGET };

const AGENT_INSTRUCTIONS_SUGGESTION_VARIANT = "nested" as const;

export interface AgentInstructionsComposerProps {
	beforeEditorSlot?: ReactNode;
	bottomSlot?: ReactNode;
	bottomSlotClassName?: string;
	className?: string;
	config: AgentConfigFormValue;
	contentClassName?: string;
	editorClassName?: string;
	editorRootClassName?: string;
	frontmatter?: { enabled?: boolean };
	instructions?: string;
	mentionInventoryResetKey?: number;
	mentionRemovalRequest?: RichTextMentionRemovalRequest | null;
	onAddListValues?: (field: AgentConfigReferenceListFieldName, values: readonly string[]) => void;
	onMentionRemovalRequestHandled?: (key: string) => void;
	onInstructionsChange?: (value: string) => void;
	onOpenDirectory?: (directory: AgentDirectoryKind, selectedItem?: string) => void;
	onRemoveReferenceValue?: (field: AgentConfigReferenceListFieldName, value: string) => void;
	onViewModeChange?: (mode: EditorToolbarViewMode) => void;
	padStuckToolbar?: boolean;
	placeholder: string;
	placeholderSlot: ReactNode;
	screenAssistantTargetId?: string;
	showEditor?: boolean;
	showSectionLabel?: boolean;
	toolbarBelowSlot?: ReactNode;
	toolbarClassName?: string;
}

export function AgentInstructionsComposer({
	beforeEditorSlot,
	bottomSlot,
	bottomSlotClassName,
	className,
	config,
	contentClassName,
	editorClassName,
	editorRootClassName = "space-y-0",
	frontmatter,
	instructions,
	mentionInventoryResetKey,
	mentionRemovalRequest,
	onAddListValues,
	onMentionRemovalRequestHandled,
	onInstructionsChange,
	onOpenDirectory,
	onRemoveReferenceValue,
	onViewModeChange,
	padStuckToolbar = false,
	placeholder,
	placeholderSlot,
	screenAssistantTargetId,
	showEditor = true,
	showSectionLabel = true,
	toolbarBelowSlot,
	toolbarClassName,
}: Readonly<AgentInstructionsComposerProps>) {
	const {
		clearMentionInventory,
		handleInsertReferenceOption,
		handleMentionInventoryChange,
		handleOpenDirectory,
		mentionSources,
	} = useAgentInstructionsMentions({
		config,
		onAddListValues,
		onOpenDirectory,
		onRemoveReferenceValue,
	});
	const lastResetKeyRef = useRef(mentionInventoryResetKey);

	useEffect(() => {
		if (mentionInventoryResetKey === undefined || lastResetKeyRef.current === mentionInventoryResetKey) {
			return;
		}
		lastResetKeyRef.current = mentionInventoryResetKey;
		clearMentionInventory();
	}, [clearMentionInventory, mentionInventoryResetKey]);

	return (
		<section
			className={cn("space-y-0", className)}
			data-agent-field="instructions"
			data-screen-assistant-target={screenAssistantTargetId}
		>
			{showSectionLabel ? (
				<AgentSectionLabel>Instructions</AgentSectionLabel>
			) : null}
			{beforeEditorSlot}
			{showEditor ? (
				<RichTextEditor
					aria-label="Agent instructions"
					className={editorRootClassName}
					contentClassName={cn("pt-2", contentClassName)}
					editorClassName={cn("agent-instructions-tiptap-editor text-text", editorClassName)}
					enableDirectoryAutocomplete
					frontmatter={frontmatter}
					placeholder={placeholder}
					placeholderSlot={placeholderSlot}
					onInsertReferenceOption={handleInsertReferenceOption}
					onOpenDirectory={handleOpenDirectory}
					onViewModeChange={onViewModeChange}
					suggestionVariant={AGENT_INSTRUCTIONS_SUGGESTION_VARIANT}
					toolbarBelowSlot={toolbarBelowSlot}
					toolbarClassName={toolbarClassName}
					toolbarReveal="hover"
					padStuckToolbar={padStuckToolbar}
					value={instructions}
					mentionSources={mentionSources}
					mentionRemovalRequest={mentionRemovalRequest}
					onMarkdownChange={onInstructionsChange}
					onMentionInventoryChange={handleMentionInventoryChange}
					onMentionRemovalRequestHandled={onMentionRemovalRequestHandled}
				/>
			) : null}
			{bottomSlot ? (
				<div className={bottomSlotClassName}>
					{bottomSlot}
				</div>
			) : null}
		</section>
	);
}
