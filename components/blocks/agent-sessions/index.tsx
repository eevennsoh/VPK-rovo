"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence } from "motion/react";
import { useRovoChat } from "@/app/contexts";
import { Button } from "@/components/ui/button";
import JiraWorkItemModal from "@/components/projects/jira/components/jira-work-item-modal";
import RovoFloatingChat from "@/components/projects/rovo-floating-chat/components/rovo-floating-chat";
import FloatingRovoButton from "@/components/projects/shared/components/floating-rovo-button";
import type { AgentSessionsPreset } from "@/components/blocks/agent-sessions/data/session-state";
import { ExperimentalAgentSessions } from "@/components/blocks/agent-sessions/experimental/experimental-agent-sessions";

export type AgentSessionsVariant = "default" | "experimental";
export type AgentSessionsExperimentalPreset = AgentSessionsPreset;

export interface AgentSessionsProps {
	/** Opens the work item on initial render. Used by docs variant chooser entry points. */
	initialIssueOpen?: boolean;
	/** Called after the work item closes. */
	onIssueClose?: () => void;
	/** Opt-in layout variation. The default variant keeps the current Jira sessions surface. */
	variant?: AgentSessionsVariant;
	/** Deterministic starting state for the experimental variant. */
	initialExperimentalPreset?: AgentSessionsExperimentalPreset;
}

export function AgentSessions({
	initialIssueOpen = false,
	onIssueClose,
	variant = "default",
	initialExperimentalPreset = "filled",
}: Readonly<AgentSessionsProps>) {
	return variant === "experimental" ? (
		<AgentSessionsExperimentalView
			initialIssueOpen={initialIssueOpen}
			onIssueClose={onIssueClose}
			initialExperimentalPreset={initialExperimentalPreset}
		/>
	) : (
		<AgentSessionsDefaultView initialIssueOpen={initialIssueOpen} onIssueClose={onIssueClose} />
	);
}

/** Shared open/close shell: the centered "Open work item" launcher container. */
function AgentSessionsShell({ onOpen, children }: Readonly<{ onOpen: () => void; children: ReactNode }>) {
	return (
		<div className="flex h-full min-h-[400px] items-center justify-center p-4">
			<Button type="button" onClick={onOpen}>
				Open work item
			</Button>
			{children}
		</div>
	);
}

function AgentSessionsDefaultView({
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
		<AgentSessionsShell onOpen={() => setIsIssueOpen(true)}>
			<JiraWorkItemModal isOpen={isIssueOpen} onClose={handleIssueClose} />
			{isIssueOpen && chatSurface === null ? (
				<FloatingRovoButton ariaLabel="Open Rovo chat" product="jira" />
			) : null}
			<AnimatePresence>
				{chatSurface === "floating" ? <RovoFloatingChat key="floating-chat" /> : null}
			</AnimatePresence>
		</AgentSessionsShell>
	);
}

function AgentSessionsExperimentalView({
	initialIssueOpen,
	onIssueClose,
	initialExperimentalPreset,
}: Readonly<{
	initialIssueOpen: boolean;
	onIssueClose?: () => void;
	initialExperimentalPreset: AgentSessionsExperimentalPreset;
}>) {
	const [isIssueOpen, setIsIssueOpen] = useState(initialIssueOpen);

	function handleIssueClose() {
		setIsIssueOpen(false);
		onIssueClose?.();
	}

	return (
		<AgentSessionsShell onOpen={() => setIsIssueOpen(true)}>
			<ExperimentalAgentSessions
				open={isIssueOpen}
				onClose={handleIssueClose}
				initialPreset={initialExperimentalPreset}
			/>
		</AgentSessionsShell>
	);
}

export default AgentSessions;
