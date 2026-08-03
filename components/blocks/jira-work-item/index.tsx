"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence } from "motion/react";
import { useRovoChat } from "@/app/contexts";
import { Button } from "@/components/ui/button";
import JiraWorkItemModal from "@/components/projects/jira/components/jira-work-item-modal";
import RovoFloatingChat from "@/components/projects/rovo-floating-chat/components/rovo-floating-chat";
import FloatingRovoButton from "@/components/projects/shared/components/floating-rovo-button";
import type { JiraWorkItemPreset } from "@/components/blocks/jira-work-item/data/session-state";
import { ExperimentalJiraWorkItem } from "@/components/blocks/jira-work-item/experimental/experimental-jira-work-item";
import { ExperimentalV2JiraWorkItem } from "@/components/blocks/jira-work-item/experimental-v2/experimental-v2-jira-work-item";

export type JiraWorkItemVariant = "default" | "experimental" | "experimental-v2";
export type JiraWorkItemExperimentalPreset = JiraWorkItemPreset;

/**
 * Experimental surfaces keyed by variant. `experimental-v2` is a full fork of
 * the v1 tree (`experimental-v2/`) so the two can diverge independently; both
 * share the session/planner model under `data/`.
 */
const EXPERIMENTAL_SURFACES = {
	experimental: ExperimentalJiraWorkItem,
	"experimental-v2": ExperimentalV2JiraWorkItem,
} as const;

type ExperimentalVariant = keyof typeof EXPERIMENTAL_SURFACES;

export interface JiraWorkItemProps {
	/** Opens the work item on initial render. Used by docs variant chooser entry points. */
	initialIssueOpen?: boolean;
	/** Called after the work item closes. */
	onIssueClose?: () => void;
	/** Opt-in layout variation. The default variant keeps the current Jira sessions surface. */
	variant?: JiraWorkItemVariant;
	/** Deterministic starting state for the experimental variants. */
	initialExperimentalPreset?: JiraWorkItemExperimentalPreset;
}

export function JiraWorkItem({
	initialIssueOpen = false,
	onIssueClose,
	variant = "default",
	initialExperimentalPreset = "filled",
}: Readonly<JiraWorkItemProps>) {
	return variant === "default" ? (
		<JiraWorkItemDefaultView initialIssueOpen={initialIssueOpen} onIssueClose={onIssueClose} />
	) : (
		<JiraWorkItemExperimentalView
			initialIssueOpen={initialIssueOpen}
			onIssueClose={onIssueClose}
			initialExperimentalPreset={initialExperimentalPreset}
			surface={variant}
		/>
	);
}

/** Shared open/close shell: the centered "Open work item" launcher container. */
function JiraWorkItemShell({ onOpen, children }: Readonly<{ onOpen: () => void; children: ReactNode }>) {
	return (
		<div className="flex h-full min-h-[400px] items-center justify-center p-4">
			<Button type="button" onClick={onOpen}>
				Open work item
			</Button>
			{children}
		</div>
	);
}

function JiraWorkItemDefaultView({
	initialIssueOpen,
	onIssueClose,
}: Readonly<{
	initialIssueOpen: boolean;
	onIssueClose?: () => void;
}>) {
	const [isIssueOpen, setIsIssueOpen] = useState(initialIssueOpen);
	const { chatSurface } = useRovoChat();

	function handleIssueClose() {
		setIsIssueOpen(false);
		onIssueClose?.();
	}

	return (
		<JiraWorkItemShell onOpen={() => setIsIssueOpen(true)}>
			<JiraWorkItemModal isOpen={isIssueOpen} onClose={handleIssueClose} />
			{isIssueOpen && chatSurface === null ? (
				<FloatingRovoButton ariaLabel="Open Rovo chat" product="jira" />
			) : null}
			<AnimatePresence>
				{chatSurface === "floating" ? <RovoFloatingChat key="floating-chat" /> : null}
			</AnimatePresence>
		</JiraWorkItemShell>
	);
}

function JiraWorkItemExperimentalView({
	initialIssueOpen,
	onIssueClose,
	initialExperimentalPreset,
	surface,
}: Readonly<{
	initialIssueOpen: boolean;
	onIssueClose?: () => void;
	initialExperimentalPreset: JiraWorkItemExperimentalPreset;
	surface: ExperimentalVariant;
}>) {
	const [isIssueOpen, setIsIssueOpen] = useState(initialIssueOpen);
	const ExperimentalSurface = EXPERIMENTAL_SURFACES[surface];

	function handleIssueClose() {
		setIsIssueOpen(false);
		onIssueClose?.();
	}

	return (
		<JiraWorkItemShell onOpen={() => setIsIssueOpen(true)}>
			<ExperimentalSurface
				open={isIssueOpen}
				onClose={handleIssueClose}
				initialPreset={initialExperimentalPreset}
			/>
		</JiraWorkItemShell>
	);
}

export default JiraWorkItem;
