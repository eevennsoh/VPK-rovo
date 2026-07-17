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
import Heading from "@/components/ui/heading";
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
import { Separator } from "@/components/ui/separator";
import type { AsxQueueSession, AsxQueueSessionStatus } from "../data/queue-sessions";
import { QueueDetailArtifacts } from "./queue-detail-artifacts";

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

interface QueueDetailPanelProps {
	agent: RovoAgentProfile;
	onClose: () => void;
	session: AsxQueueSession;
}

function QueueDetailStatusIcon({ status }: Readonly<{ status: AsxQueueSessionStatus }>) {
	switch (status) {
		case "awaiting-input":
			return <StatusInformationIcon label="" size="small" />;
		case "pr-open":
			return <PullRequestIcon label="" size="small" />;
		case "merged":
			return <MergeSuccessIcon label="" size="small" />;
		case "running":
			return <ChangesIcon label="" size="small" />;
		case "stopped":
			return <VideoStopIcon label="" size="small" />;
	}
}

function QueueDetailRow({
	icon,
	label,
	value,
}: Readonly<{
	icon: ReactElement;
	label: string;
	value: ReactNode;
}>) {
	return (
		<Item className="flex-nowrap items-start gap-2 rounded-md border-0 px-0 py-0">
			<ItemMedia className="h-5 items-center text-icon-subtlest [&_span]:size-3 [&_svg]:size-3" variant="icon">
				<Icon aria-hidden render={icon} />
			</ItemMedia>
			<ItemContent className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)] gap-x-2">
				<span className="text-xs leading-5 text-text-subtlest">{label}</span>
				<span className="min-w-0 break-words text-xs leading-5 text-text-subtle">{value}</span>
			</ItemContent>
		</Item>
	);
}

function QueueDetailSection({
	children,
	id,
	title,
}: Readonly<{
	children: ReactNode;
	id: string;
	title: string;
}>) {
	return (
		<section aria-labelledby={id} className="space-y-2 px-4 py-6">
			<Heading as="h3" id={id} size="xxsmall">
				{title}
			</Heading>
			{children}
		</section>
	);
}

export function QueueDetailPanel({ agent, onClose, session }: Readonly<QueueDetailPanelProps>) {
	const shouldReduceMotion = useReducedMotion();
	const issueDescription = `${session.issueKey}: ${session.issueSummary}`;
	const hasDevelopmentDetails = Boolean(session.repository || session.branch || session.worktreePath);
	const hasDeliveryDetails = Boolean(
		session.pullRequestNumber
		|| session.commit
		|| session.checks
		|| session.fileChanges,
	);

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
				aria-label="Details"
				className="h-full border-l border-border bg-surface"
				id="asx-queue-detail-panel"
			>
				<PanelHeader className="h-14 px-4 py-3">
					<PanelTitle>Details</PanelTitle>
					<PanelActionGroup>
						<PanelActionMore />
						<PanelActionClose label="Close detail panel" onClick={onClose} />
					</PanelActionGroup>
				</PanelHeader>

				<PanelContent>
					<PanelBody className="pb-5" spacing="none">
						<section aria-label="Session" className="space-y-2 px-4 pb-6">
							<ItemGroup className="gap-2">
								<QueueDetailRow
									icon={<QueueDetailStatusIcon status={session.status} />}
									label="Status"
									value={STATUS_LABELS[session.status]}
								/>
								<QueueDetailRow
									icon={session.host === "cloud" ? <CloudArrowUpIcon label="" size="small" /> : <FolderClosedIcon label="" size="small" />}
									label="Host"
									value={session.host === "cloud" ? "Cloud" : "Local"}
								/>
								<QueueDetailRow icon={<AiAgentIcon label="" size="small" />} label="Agent" value={agent.name} />
								<QueueDetailRow icon={<TaskIcon label="" size="small" />} label="Jira" value={issueDescription} />
							</ItemGroup>
						</section>

						{hasDevelopmentDetails ? (
							<>
								<Separator className="mx-4 data-horizontal:w-auto" />
								<QueueDetailSection id="asx-queue-development-heading" title="Development">
									<ItemGroup className="gap-2">
										{session.repository ? <QueueDetailRow icon={<FolderClosedIcon label="" size="small" />} label="Repository" value={session.repository} /> : null}
										{session.branch ? <QueueDetailRow icon={<BranchIcon label="" size="small" />} label="Branch" value={session.branch} /> : null}
										{session.worktreePath ? <QueueDetailRow icon={<FolderClosedIcon label="" size="small" />} label="Worktree" value={session.worktreePath} /> : null}
									</ItemGroup>
								</QueueDetailSection>
							</>
						) : null}

						{hasDeliveryDetails ? (
							<>
								<Separator className="mx-4 data-horizontal:w-auto" />
								<QueueDetailSection id="asx-queue-delivery-heading" title="Delivery">
									<ItemGroup className="gap-2">
										{session.pullRequestNumber ? <QueueDetailRow icon={<PullRequestIcon label="" size="small" />} label="Pull request" value={`#${session.pullRequestNumber}`} /> : null}
										{session.commit ? <QueueDetailRow icon={<CommitIcon label="" size="small" />} label="Commit" value={session.commit} /> : null}
										{session.checks ? <QueueDetailRow icon={<CheckCircleIcon label="" size="small" />} label="Checks" value={session.checks} /> : null}
										{session.fileChanges ? (
											<QueueDetailRow
												icon={<ChangesIcon label="" size="small" />}
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
								</QueueDetailSection>
							</>
						) : null}

						<QueueDetailArtifacts session={session} />
					</PanelBody>
				</PanelContent>
			</PanelContainer>
		</motion.div>
	);
}
