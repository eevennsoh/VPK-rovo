import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import BranchIcon from "@atlaskit/icon/core/branch";
import CheckCircleIcon from "@atlaskit/icon/core/check-circle";
import ChangesIcon from "@atlaskit/icon/core/changes";
import CloudArrowUpIcon from "@atlaskit/icon/core/cloud-arrow-up";
import CommitIcon from "@atlaskit/icon/core/commit";
import FolderClosedIcon from "@atlaskit/icon/core/folder-closed";
import MergeSuccessIcon from "@atlaskit/icon/core/merge-success";
import PullRequestIcon from "@atlaskit/icon/core/pull-request";
import StatusInformationIcon from "@atlaskit/icon/core/status-information";
import TaskIcon from "@atlaskit/icon/core/task";
import VideoStopIcon from "@atlaskit/icon/core/video-stop";
import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactElement, ReactNode } from "react";

import type { RovoAgentProfile } from "@/app/data/directory/agents";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
	Item,
	ItemContent,
	ItemGroup,
	ItemMedia,
} from "@/components/ui/item";
import {
	PanelActionClose,
	PanelActionGroup,
	PanelActionMore,
	PanelBody,
	PanelContainer,
	PanelContent,
	PanelHeader,
	PanelTitle,
} from "@/components/ui/panel";
import { PlayIcon } from "@/components/ui/vpk-icons";
import type { AsxQueueSession, AsxQueueSessionStatus } from "../data/queue-sessions";

const STATUS_LABELS: Record<AsxQueueSessionStatus, string> = {
	"awaiting-input": "Awaiting user response",
	merged: "Pull request merged",
	"pr-open": "Pull request open",
	running: "Running",
	stopped: "Stopped",
};

const PANEL_VARIANTS: Variants = {
	closed: {
		transform: "translateX(100%)",
		transition: { duration: 0.2, ease: [0.6, 0, 0.8, 0.6] }, // duration-medium + ease-in
	},
	open: {
		transform: "translateX(0%)",
		transition: { duration: 0.25, ease: [0, 0.4, 0, 1] }, // duration-slow + ease-out
	},
};

const REDUCED_MOTION_PANEL_VARIANTS: Variants = {
	closed: { transform: "translateX(0%)", transition: { duration: 0 } },
	open: { transform: "translateX(0%)", transition: { duration: 0 } },
};

interface QueueEnvironmentPanelProps {
	agent: RovoAgentProfile;
	onClose: () => void;
	session: AsxQueueSession;
}

function QueueEnvironmentStatusIcon({ status }: Readonly<{ status: AsxQueueSessionStatus }>) {
	switch (status) {
		case "awaiting-input":
			return <StatusInformationIcon label="" />;
		case "pr-open":
			return <PullRequestIcon label="" />;
		case "merged":
			return <MergeSuccessIcon label="" />;
		case "running":
			return <ChangesIcon label="" />;
		case "stopped":
			return <VideoStopIcon label="" />;
	}
}

function QueueEnvironmentDetailRow({
	icon,
	label,
	value,
}: Readonly<{
	icon: ReactElement;
	label: string;
	value: ReactNode;
}>) {
	return (
		<Item className="min-h-9 flex-nowrap items-start rounded-md border-0 px-2 py-1.5">
			<ItemMedia className="mt-0.5 text-icon-subtle" variant="icon">
				<Icon aria-hidden render={icon} />
			</ItemMedia>
			<ItemContent className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)] gap-x-2">
				<span className="text-sm leading-5 text-text-subtlest">{label}</span>
				<span className="min-w-0 break-words text-sm leading-5 text-text-subtle">{value}</span>
			</ItemContent>
		</Item>
	);
}

export function QueueEnvironmentPanel({ agent, onClose, session }: Readonly<QueueEnvironmentPanelProps>) {
	const shouldReduceMotion = useReducedMotion();
	const issueDescription = `${session.issueKey}: ${session.issueSummary}`;

	return (
		<motion.div
			animate="open"
			className="absolute inset-y-0 right-0 z-20 h-full w-80 max-w-full shadow-overlay"
			exit="closed"
			initial="closed"
			style={shouldReduceMotion ? undefined : { willChange: "transform" }}
			variants={shouldReduceMotion ? REDUCED_MOTION_PANEL_VARIANTS : PANEL_VARIANTS}
		>
			<PanelContainer
				aria-label="Environment"
				className="h-full border-l border-border bg-surface"
				id="asx-queue-environment-panel"
			>
				<PanelHeader className="h-14 px-4 py-3">
					<PanelTitle>Environment</PanelTitle>
					<PanelActionGroup>
						<PanelActionMore />
						<Button aria-label="Run" size="icon" type="button" variant="ghost">
							<PlayIcon aria-hidden />
						</Button>
						<PanelActionClose label="Close environment panel" onClick={onClose} />
					</PanelActionGroup>
				</PanelHeader>

				<PanelContent>
					<PanelBody className="space-y-4 px-4 pb-5">
						<div className="min-w-0 px-2">
							<p className="truncate text-sm font-semibold leading-5 text-text" title={session.title}>
								{session.title}
							</p>
							<p className="text-xs leading-4 text-text-subtlest">
								{session.host === "cloud" ? "Cloud session" : "Local session"}
							</p>
						</div>
						<ItemGroup className="gap-0">
							<QueueEnvironmentDetailRow
								icon={<QueueEnvironmentStatusIcon status={session.status} />}
								label="Status"
								value={STATUS_LABELS[session.status]}
							/>
							<QueueEnvironmentDetailRow
								icon={session.host === "cloud" ? <CloudArrowUpIcon label="" /> : <FolderClosedIcon label="" />}
								label="Host"
								value={session.host === "cloud" ? "Cloud" : "Local"}
							/>
							<QueueEnvironmentDetailRow icon={<AiAgentIcon label="" />} label="Agent" value={agent.name} />
							<QueueEnvironmentDetailRow icon={<TaskIcon label="" />} label="Jira" value={issueDescription} />
							{session.repository ? <QueueEnvironmentDetailRow icon={<FolderClosedIcon label="" />} label="Repository" value={session.repository} /> : null}
							{session.branch ? <QueueEnvironmentDetailRow icon={<BranchIcon label="" />} label="Branch" value={session.branch} /> : null}
							{session.worktreePath ? <QueueEnvironmentDetailRow icon={<FolderClosedIcon label="" />} label="Worktree" value={session.worktreePath} /> : null}
							{session.pullRequestNumber ? <QueueEnvironmentDetailRow icon={<PullRequestIcon label="" />} label="Pull request" value={`#${session.pullRequestNumber}`} /> : null}
							{session.commit ? <QueueEnvironmentDetailRow icon={<CommitIcon label="" />} label="Commit" value={session.commit} /> : null}
							{session.checks ? <QueueEnvironmentDetailRow icon={<CheckCircleIcon label="" />} label="Checks" value={session.checks} /> : null}
							{session.fileChanges ? (
								<QueueEnvironmentDetailRow
									icon={<ChangesIcon label="" />}
									label="Changes"
									value={(
										<span className="inline-flex flex-wrap gap-1 font-medium">
											<span>{session.fileChanges.files.length} files</span>
											<span className="text-text-success">+{session.fileChanges.additions}</span>
											<span className="text-text-danger">-{session.fileChanges.deletions}</span>
										</span>
									)}
								/>
							) : null}
						</ItemGroup>
					</PanelBody>
				</PanelContent>
			</PanelContainer>
		</motion.div>
	);
}
