"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { useRovoChat } from "@/app/contexts";
import { Button } from "@/components/ui/button";
import JiraWorkItemModal from "@/components/projects/jira/components/jira-work-item-modal";
import RovoFloatingChat from "@/components/projects/rovo-floating-chat/components/rovo-floating-chat";
import FloatingRovoButton from "@/components/projects/shared/components/floating-rovo-button";

export function AgentSessions() {
	const [isIssueOpen, setIsIssueOpen] = useState(false);
	const { chatSurface } = useRovoChat();

	return (
		<div className="flex h-full min-h-[400px] items-center justify-center p-4">
			<Button type="button" onClick={() => setIsIssueOpen(true)}>
				Open work item
			</Button>
			<JiraWorkItemModal isOpen={isIssueOpen} onClose={() => setIsIssueOpen(false)} />
			{chatSurface === null ? (
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
