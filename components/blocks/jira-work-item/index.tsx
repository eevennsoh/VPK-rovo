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

export type JiraWorkItemVariant = "default" | "experimental";
export type JiraWorkItemExperimentalPreset = JiraWorkItemPreset;

export interface JiraWorkItemProps {
	/** Opens the work item on initial render. Used by docs variant chooser entry points. */
	initialIssueOpen?: boolean;
	/** Called after the work item closes. */
	onIssueClose?: () => void;
	/** Opt-in layout variation. The default variant keeps the current Jira sessions surface. */
	variant?: JiraWorkItemVariant;
	/** Deterministic starting state for the experimental variant. */
	initialExperimentalPreset?: JiraWorkItemExperimentalPreset;
}

export function JiraWorkItem({
	initialIssueOpen = false,
	onIssueClose,
	variant = "default",
	initialExperimentalPreset = "filled",
}: Readonly<JiraWorkItemProps>) {
	return variant === "experimental" ? (
		<JiraWorkItemExperimentalView
			initialIssueOpen={initialIssueOpen}
			onIssueClose={onIssueClose}
			initialExperimentalPreset={initialExperimentalPreset}
		/>
	) : (
		<JiraWorkItemDefaultView initialIssueOpen={initialIssueOpen} onIssueClose={onIssueClose} />
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
}: Readonly<{
	initialIssueOpen: boolean;
	onIssueClose?: () => void;
	initialExperimentalPreset: JiraWorkItemExperimentalPreset;
}>) {
	const [isIssueOpen, setIsIssueOpen] = useState(initialIssueOpen);

	function handleIssueClose() {
		setIsIssueOpen(false);
		onIssueClose?.();
	}

	return (
		<JiraWorkItemShell onOpen={() => setIsIssueOpen(true)}>
			<ExperimentalJiraWorkItem
				open={isIssueOpen}
				onClose={handleIssueClose}
				initialPreset={initialExperimentalPreset}
			/>
		</JiraWorkItemShell>
	);
}

export default JiraWorkItem;
