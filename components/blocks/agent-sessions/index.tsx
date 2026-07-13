"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { useRovoChat } from "@/app/contexts";
import { Button } from "@/components/ui/button";
import JiraWorkItemModal from "@/components/projects/jira/components/jira-work-item-modal";
import RovoFloatingChat from "@/components/projects/rovo-floating-chat/components/rovo-floating-chat";
import FloatingRovoButton from "@/components/projects/shared/components/floating-rovo-button";

export type AgentSessionsVariant = "default" | "experimental";

export interface AgentSessionsProps {
	/** Opens the Jira work item modal on initial render. Used by docs variant chooser entry points. */
	initialIssueOpen?: boolean;
	/** Called after the Jira work item modal closes. */
	onIssueClose?: () => void;
	/** Opt-in layout variation. The default variant keeps the current Jira sessions surface. */
	variant?: AgentSessionsVariant;
}

export function AgentSessions({
	initialIssueOpen = false,
	onIssueClose,
	variant = "default",
}: Readonly<AgentSessionsProps>) {
	return variant === "experimental" ? (
		<AgentSessionsExperimentalView initialIssueOpen={initialIssueOpen} onIssueClose={onIssueClose} />
	) : (
		<AgentSessionsDefaultView initialIssueOpen={initialIssueOpen} onIssueClose={onIssueClose} />
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
		<div className="flex h-full min-h-[400px] items-center justify-center p-4">
			<Button type="button" onClick={() => setIsIssueOpen(true)}>
				Open work item
			</Button>
			<JiraWorkItemModal isOpen={isIssueOpen} onClose={handleIssueClose} />
			{isIssueOpen && chatSurface === null ? (
				<FloatingRovoButton
					ariaLabel="Open Rovo chat"
					product="jira"
				/>
			) : null}
			<AnimatePresence>
				{chatSurface === "floating" ? (
					<RovoFloatingChat key="floating-chat" />
				) : null}
			</AnimatePresence>
		</div>
	);
}

function AgentSessionsExperimentalView({
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
		<div className="flex h-full min-h-[400px] items-center justify-center p-4">
			<Button type="button" onClick={() => setIsIssueOpen(true)}>
				Open work item
			</Button>
			<JiraWorkItemModal isOpen={isIssueOpen} onClose={handleIssueClose} />
			{isIssueOpen && chatSurface === null ? (
				<FloatingRovoButton
					ariaLabel="Open Rovo chat"
					product="jira"
				/>
			) : null}
			<AnimatePresence>
				{chatSurface === "floating" ? (
					<RovoFloatingChat key="floating-chat" />
				) : null}
			</AnimatePresence>
		</div>
	);
}

export default AgentSessions;
