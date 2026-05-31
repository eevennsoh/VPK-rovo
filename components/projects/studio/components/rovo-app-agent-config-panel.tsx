"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import CrossIcon from "@atlaskit/icon/core/cross";

import {
	Agent,
	AgentConfigFields,
	AgentHeader,
	type AgentConfigListFieldName,
	type AgentConfigTextFieldName,
} from "@/components/ui-custom/agent";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Lozenge } from "@/components/ui/lozenge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type {
	StudioAgentPublishStatus,
	StudioSessionAgentEntry,
} from "@/app/contexts/context-rovo-chat";
import type { RovoDataParts } from "@/lib/rovo-ui-messages";
import { cn } from "@/lib/utils";

type AgentResult = RovoDataParts["agent-result"];

interface RovoAppAgentConfigPanelProps {
	entry: StudioSessionAgentEntry;
	onClose?: () => void;
	onCommitPublishReady: (profileId: string) => void;
	onPublish: (profileId: string) => void;
	onTest: (profileId: string) => void;
	onUpdateDraft: (
		profileId: string,
		patch: Partial<AgentResult>,
	) => void;
	className?: string;
}

function stringifyForComparison(value: unknown): string {
	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}

function isDraftEmpty(result: AgentResult): boolean {
	const hasName = Boolean(result.name && result.name.trim().length > 0);
	const hasDescription = Boolean(result.description || result.summary);
	const hasInstructions = Boolean(result.instructions && result.instructions.trim().length > 0);
	const hasStarters = Array.isArray(result.conversationStarters) && result.conversationStarters.length > 0;
	const hasTools = Array.isArray(result.tools) && result.tools.length > 0;
	return !hasName && !hasDescription && !hasInstructions && !hasStarters && !hasTools;
}

function getMissingFieldWarnings(result: AgentResult): readonly string[] {
	const missing: string[] = [];
	if (!result.name || result.name.trim().length === 0) {
		missing.push("name");
	}
	if (!result.description && !result.summary) {
		missing.push("description");
	}
	if (!result.instructions || result.instructions.trim().length === 0) {
		missing.push("instructions");
	}
	if (!Array.isArray(result.conversationStarters) || result.conversationStarters.length === 0) {
		missing.push("conversation starters");
	}
	return missing;
}

function getPublishLabel(status: StudioAgentPublishStatus): string {
	return status === "published" ? "Published" : "Draft";
}

type AgentConfigActionButtonProps = ButtonProps & {
	children: ReactNode;
	disabledTooltip?: string;
};

function AgentConfigActionButton({
	children,
	disabled,
	disabledTooltip,
	...props
}: Readonly<AgentConfigActionButtonProps>) {
	const button = (
		<Button disabled={disabled} {...props}>
			{children}
		</Button>
	);

	if (!disabled || !disabledTooltip) {
		return button;
	}

	return (
		<Tooltip>
			<TooltipTrigger render={<span className="inline-flex" />}>
				{button}
			</TooltipTrigger>
			<TooltipContent side="bottom">
				<p>{disabledTooltip}</p>
			</TooltipContent>
		</Tooltip>
	);
}

export function RovoAppAgentConfigPanel({
	entry,
	onClose,
	onCommitPublishReady,
	onPublish,
	onTest,
	onUpdateDraft,
	className,
}: Readonly<RovoAppAgentConfigPanelProps>) {
	const draft = entry.draftResult;
	const shouldReduceMotion = useReducedMotion();
	const profileId = entry.profile.id;

	const updateDraft = useCallback(
		(patch: Partial<AgentResult>) => {
			onUpdateDraft(profileId, patch);
		},
		[onUpdateDraft, profileId],
	);

	const handleConfigTextChange = useCallback(
		(field: AgentConfigTextFieldName, value: string) => {
			if (field === "description") {
				updateDraft({ description: value, summary: value });
				return;
			}
			updateDraft({ [field]: value } as Partial<AgentResult>);
		},
		[updateDraft],
	);

	const tools = useMemo<readonly string[]>(() => {
		return Array.isArray(draft.tools) ? draft.tools : [];
	}, [draft.tools]);

	const conversationStarters = useMemo<readonly string[]>(() => {
		return Array.isArray(draft.conversationStarters)
			? draft.conversationStarters
			: [];
	}, [draft.conversationStarters]);

	const updateListItem = useCallback(
		(field: AgentConfigListFieldName, index: number, value: string) => {
			const current = field === "tools" ? tools : conversationStarters;
			const next = [...current];
			next[index] = value;
			updateDraft({ [field]: next } as Partial<AgentResult>);
		},
		[conversationStarters, tools, updateDraft],
	);

	const removeListItem = useCallback(
		(field: AgentConfigListFieldName, index: number) => {
			const current = field === "tools" ? tools : conversationStarters;
			const next = current.filter((_, itemIndex) => itemIndex !== index);
			updateDraft({ [field]: next } as Partial<AgentResult>);
		},
		[conversationStarters, tools, updateDraft],
	);

	const appendListItem = useCallback(
		(field: AgentConfigListFieldName) => {
			const current = field === "tools" ? tools : conversationStarters;
			updateDraft({ [field]: [...current, ""] } as Partial<AgentResult>);
		},
		[conversationStarters, tools, updateDraft],
	);

	const hasUpdateChanges = useMemo(() => {
		return (
			stringifyForComparison(entry.draftResult) !==
			stringifyForComparison(entry.publishReadyResult)
		);
	}, [entry.draftResult, entry.publishReadyResult]);

	const hasPublishChanges = useMemo(() => {
		if (!entry.publishedResult) {
			return true;
		}
		return (
			stringifyForComparison(entry.publishReadyResult) !==
			stringifyForComparison(entry.publishedResult)
		);
	}, [entry.publishReadyResult, entry.publishedResult]);

	// Only warn about a partial generation once the agent has some content. A
	// brand-new "start from scratch" agent has every field empty, and surfacing
	// "Generation looks partial" there is noise — nothing was generated yet.
	const missingFields = useMemo(
		() => (isDraftEmpty(draft) ? [] : getMissingFieldWarnings(draft)),
		[draft],
	);

	const [justUpdatedAt, setJustUpdatedAt] = useState<number | null>(null);
	const justUpdatedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (justUpdatedTimerRef.current) {
				clearTimeout(justUpdatedTimerRef.current);
			}
		};
	}, []);

	const handleUpdate = useCallback(() => {
		onCommitPublishReady(profileId);
		setJustUpdatedAt(Date.now());
		if (justUpdatedTimerRef.current) {
			clearTimeout(justUpdatedTimerRef.current);
		}
		justUpdatedTimerRef.current = setTimeout(() => {
			setJustUpdatedAt(null);
		}, 1500);
	}, [onCommitPublishReady, profileId]);

	const handlePublish = useCallback(() => {
		// Ensure publish-ready snapshot reflects current draft before publishing.
		if (hasUpdateChanges) {
			onCommitPublishReady(profileId);
		}
		onPublish(profileId);
	}, [hasUpdateChanges, onCommitPublishReady, onPublish, profileId]);

	const hasAgentInstructions = Boolean(draft.instructions?.trim());
	const handleTest = useCallback(() => {
		if (!hasAgentInstructions) {
			return;
		}
		if (hasUpdateChanges) {
			onCommitPublishReady(profileId);
		}
		onTest(profileId);
	}, [hasAgentInstructions, hasUpdateChanges, onCommitPublishReady, onTest, profileId]);

	const publishStatusLabel = getPublishLabel(entry.publishStatus);
	const agentName = draft.name?.trim() || entry.profile.name || "Untitled agent";
	// Mirror the avatar the sidebar nav renders for this agent (entry.profile.avatarSrc)
	// so the header + profile cover match instead of falling back to the static default.
	const agentAvatarSrc = entry.profile.avatarSrc;

	return (
		<motion.div
			className={cn("flex h-full w-full flex-col overflow-hidden bg-surface", className)}
			data-screen-assistant-target="studio-agent-config-panel"
			initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.24, ease: [0, 0.4, 0, 1] }}
		>
			<Agent className="flex min-h-0 flex-1 flex-col">
				<AgentHeader
					avatarSrc={agentAvatarSrc}
					name={agentName}
					badge={
						<Lozenge
							data-testid="agent-config-status-lozenge"
							variant={entry.publishStatus === "published" ? "success" : undefined}
						>
							{publishStatusLabel}
						</Lozenge>
					}
					actions={
						<>
							<AgentConfigActionButton
								type="button"
								size="default"
								variant="ghost"
								onClick={handleUpdate}
								disabled={!hasUpdateChanges}
								disabledTooltip="Make a change to the agent before updating the testing version."
								data-testid="agent-config-update"
								data-screen-assistant-target="studio-agent-config-update"
							>
								{justUpdatedAt ? "Updated" : "Update"}
							</AgentConfigActionButton>
							<AgentConfigActionButton
								type="button"
								size="default"
								variant="outline"
								onClick={handleTest}
								disabled={!hasAgentInstructions}
								disabledTooltip="Add agent instructions before testing this agent."
								data-testid="agent-config-test"
								data-screen-assistant-target="studio-agent-config-test"
							>
								Test
							</AgentConfigActionButton>
							<Button
								type="button"
								size="default"
								variant="default"
								onClick={handlePublish}
								disabled={!hasPublishChanges}
								data-testid="agent-config-publish"
								data-screen-assistant-target="studio-agent-config-publish"
							>
								Publish
							</Button>
							{onClose ? (
								<Button
									type="button"
									size="icon"
									variant="ghost"
									onClick={onClose}
									aria-label="Close agent config"
								>
									<CrossIcon label="" spacing="none" />
								</Button>
							) : null}
						</>
					}
				/>
				<div className="min-h-0 flex-1 overflow-y-auto">
					<div className="w-full px-6 py-5">
						<AnimatePresence>
							{missingFields.length > 0 ? (
								<motion.div
									className="mb-4 rounded-md border border-border-warning bg-bg-warning-subtler px-3 py-2 text-text-warning-bolder text-xs"
									initial={shouldReduceMotion ? false : { opacity: 0, y: -4 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -4 }}
								>
									Generation looks partial — fill in {missingFields.join(", ")} before publishing.
								</motion.div>
							) : null}
						</AnimatePresence>
						<AgentConfigFields
							config={draft}
							avatarSrc={agentAvatarSrc}
							idPrefix={`agent-${profileId}`}
							onTextChange={handleConfigTextChange}
							onListItemChange={updateListItem}
							onRemoveListItem={removeListItem}
							onAppendListItem={appendListItem}
							screenAssistantTargetPrefix="studio-agent-config"
						/>
					</div>
				</div>
			</Agent>
		</motion.div>
	);
}
