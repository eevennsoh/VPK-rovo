"use client";

import { useCallback } from "react";
import { AnimatePresence } from "motion/react";

import { RovoChatProvider, useRovoChat } from "@/app/contexts";
import RovoFloatingChat from "@/components/projects/rovo-floating-chat/components/rovo-floating-chat";
import FloatingRovoButton from "@/components/projects/shared/components/floating-rovo-button";

import { AgentList, type AgentListFlyout, type AgentListVariant } from "./index";

function AgentListDemo({
	flyout,
	variant,
}: Readonly<{ flyout: AgentListFlyout; variant: AgentListVariant }>) {
	const { chatSurface, openChat } = useRovoChat();

	// View drops the user into the Rovo floating chat for that session,
	// matching the Jira Issue "View" action behavior.
	const handleView = useCallback(() => {
		openChat("floating");
	}, [openChat]);

	return (
		<div className="relative flex h-full min-h-[420px] w-full flex-col bg-surface p-6">
			<div className="mx-auto flex w-full max-w-xl flex-1 items-center">
				<AgentList
					className="w-full"
					composerChatSurface="floating"
					flyout={flyout}
					onView={handleView}
					variant={variant}
				/>
			</div>
			{chatSurface === null ? (
				<FloatingRovoButton
					ariaLabel="Open Rovo chat"
					forceVisible
					placement={{ right: "24px", bottom: "24px" }}
					positioning="container"
					product="jira"
				/>
			) : null}
			<AnimatePresence>
				{chatSurface === "floating" ? <RovoFloatingChat key="floating-chat" /> : null}
			</AnimatePresence>
		</div>
	);
}

export default function AgentListPage({
	flyout = "session",
	variant = "default",
}: Readonly<{ flyout?: AgentListFlyout; variant?: AgentListVariant }>) {
	return (
		<RovoChatProvider>
			<AgentListDemo flyout={flyout} variant={variant} />
		</RovoChatProvider>
	);
}
