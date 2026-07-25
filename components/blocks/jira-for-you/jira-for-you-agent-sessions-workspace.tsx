"use client";

import ArrowLeftIcon from "@atlaskit/icon/core/arrow-left";
import { useEffect, useRef } from "react";

import type { WorkItemData } from "@/app/contexts/context-work-item-modal";
import { ExperimentalAgentSessions } from "@/components/blocks/agent-sessions/experimental/experimental-agent-sessions";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

interface JiraForYouAgentSessionsWorkspaceProps {
	onBack: () => void;
	workItem: WorkItemData;
}

export function JiraForYouAgentSessionsWorkspace({
	onBack,
	workItem,
}: Readonly<JiraForYouAgentSessionsWorkspaceProps>) {
	const backButtonRef = useRef<HTMLButtonElement | null>(null);

	useEffect(() => {
		const frameId = window.requestAnimationFrame(() => {
			backButtonRef.current?.focus();
		});
		return () => window.cancelAnimationFrame(frameId);
	}, []);

	return (
		<section
			aria-label={`Agent Sessions for ${workItem.code}`}
			className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background"
			data-testid="jira-for-you-agent-sessions-workspace"
		>
			<div className="flex h-14 shrink-0 items-center border-b border-border px-3">
				<Button
					aria-label="Back to For you feed"
					onClick={onBack}
					ref={backButtonRef}
					size="icon"
					type="button"
					variant="ghost"
				>
					<Icon aria-hidden render={<ArrowLeftIcon label="" />} />
				</Button>
			</div>
			<div className="flex min-h-0 flex-1 overflow-hidden">
				<ExperimentalAgentSessions
					defaultMetadataCollapsed
					initialPreset="blank"
					inlineSurface="fill"
					presentation="inline"
					workItem={workItem}
				/>
			</div>
		</section>
	);
}
