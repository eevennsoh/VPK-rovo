"use client";

import { useCallback, useState } from "react";
import { AnimatePresence } from "motion/react";

import { RovoChatProvider, useRovoChat } from "@/app/contexts";
import RovoFloatingChat from "@/components/projects/rovo-floating-chat/components/rovo-floating-chat";
import FloatingRovoButton from "@/components/projects/shared/components/floating-rovo-button";

import {
	AGENT_LIST_ITEMS,
	AGENT_LIST_UNCAPTURED_ITEMS,
	AgentList,
	type AgentListFlyout,
	type AgentListItem,
	type AgentListVariant,
} from "./index";

function AgentListDemo({
	flyout,
	variant,
}: Readonly<{ flyout: AgentListFlyout; variant: AgentListVariant }>) {
	const { chatSurface, openChat } = useRovoChat();
	const [items, setItems] = useState<readonly AgentListItem[]>(AGENT_LIST_ITEMS);

	// View/Resume drops the user into the Rovo floating chat for that session,
	// matching the Jira Issue "View" action behavior.
	const handleView = useCallback(() => {
		openChat("floating");
	}, [openChat]);
	const handleArchive = useCallback((item: AgentListItem) => {
		setItems((current) => current.filter((candidate) => candidate.id !== item.id));
	}, []);

	return (
		<div className="relative flex h-full min-h-[420px] w-full flex-col bg-surface p-6">
			<div className="mx-auto flex w-full max-w-xl flex-1 items-center">
				<AgentList
					className="w-full"
					composerChatSurface="floating"
					flyout={flyout}
					items={items}
					onArchive={handleArchive}
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

function AgentListUncapturedDemo() {
	const [items, setItems] = useState<readonly AgentListItem[]>(AGENT_LIST_UNCAPTURED_ITEMS);
	const [capturedIds, setCapturedIds] = useState<ReadonlySet<string>>(() => new Set());

	const handleCapture = useCallback((item: AgentListItem) => {
		setCapturedIds((current) => new Set(current).add(item.id));
	}, []);
	const handleDismiss = useCallback((item: AgentListItem) => {
		setItems((current) => current.filter((candidate) => candidate.id !== item.id));
	}, []);

	return (
		<div
			className="flex h-full min-h-[360px] w-full flex-col items-center justify-center gap-2 bg-surface p-6"
			id="uncaptured"
		>
			<AgentList
				capturedItemIds={capturedIds}
				className="w-[320px]"
				flyout="none"
				items={items}
				onCreateWorkItem={handleCapture}
				onDismiss={handleDismiss}
				onLinkWorkItem={handleCapture}
				variant="uncaptured"
			/>
		</div>
	);
}

export default function AgentListPage({
	flyout = "session",
	variant = "default",
}: Readonly<{ flyout?: AgentListFlyout; variant?: AgentListVariant }>) {
	if (variant === "uncaptured") {
		return <AgentListUncapturedDemo />;
	}

	return (
		<RovoChatProvider>
			<AgentListDemo flyout={flyout} variant={variant} />
		</RovoChatProvider>
	);
}
