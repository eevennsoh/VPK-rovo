import AddIcon from "@atlaskit/icon/core/add";
import BranchIcon from "@atlaskit/icon/core/branch";
import ChangesIcon from "@atlaskit/icon/core/changes";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import CommentIcon from "@atlaskit/icon/core/comment";
import CommitIcon from "@atlaskit/icon/core/commit";
import FileIcon from "@atlaskit/icon/core/file";
import PullRequestIcon from "@atlaskit/icon/core/pull-request";
import { motion, useReducedMotion, type Variants } from "motion/react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemGroup,
	ItemMedia,
	ItemTitle,
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
import { PlayIcon } from "@/components/ui/vpk-icons";

const ENVIRONMENT_ACTIONS = [
	{ id: "changes", icon: ChangesIcon, label: "Changes" },
	{ id: "worktree", icon: BranchIcon, label: "Worktree" },
	{ id: "branch", icon: BranchIcon, label: "Create branch" },
	{ id: "commit", icon: CommitIcon, label: "Commit or push" },
	{ id: "pull-request", icon: PullRequestIcon, label: "Create pull request" },
] as const;

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
	onClose: () => void;
}

export function QueueEnvironmentPanel({ onClose }: Readonly<QueueEnvironmentPanelProps>) {
	const shouldReduceMotion = useReducedMotion();

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
					<PanelBody className="space-y-5 px-4 pb-5">
						<ItemGroup className="gap-0">
							{ENVIRONMENT_ACTIONS.map((action) => {
								const ActionIcon = action.icon;
								return (
									<Item className="min-h-9 rounded-md border-0 px-2 py-1.5" key={action.id}>
										<ItemMedia variant="icon">
											<Icon aria-hidden render={<ActionIcon label="" />} />
										</ItemMedia>
										<ItemContent>
											<ItemTitle className="font-normal">{action.label}</ItemTitle>
										</ItemContent>
										{action.id === "changes" ? (
											<ItemActions className="gap-1 text-sm font-medium">
												<span className="text-text-success">+76</span>
												<span className="text-text-danger">-37</span>
											</ItemActions>
										) : null}
										{action.id === "worktree" ? (
											<ItemActions>
												<Icon aria-hidden className="text-icon-subtle" render={<ChevronDownIcon label="" />} />
											</ItemActions>
										) : null}
									</Item>
								);
							})}
						</ItemGroup>

						<Separator />

						<section aria-labelledby="asx-side-tasks-heading" className="space-y-2">
							<h3 className="text-base font-medium text-text-subtle" id="asx-side-tasks-heading">
								Side tasks
							</h3>
							<Item className="min-h-9 rounded-md border-0 px-2 py-1.5">
								<ItemMedia variant="icon">
									<Icon aria-hidden render={<CommentIcon label="" />} />
								</ItemMedia>
								<ItemContent>
									<ItemTitle className="font-normal">Side task</ItemTitle>
								</ItemContent>
							</Item>
						</section>

						<Separator />

						<section aria-labelledby="asx-sources-heading" className="space-y-2">
							<div className="flex items-center justify-between gap-2">
								<h3 className="text-base font-medium text-text-subtle" id="asx-sources-heading">
									Sources
								</h3>
								<Button aria-label="Add source" size="icon-compact" type="button" variant="ghost">
									<Icon aria-hidden render={<AddIcon label="" />} />
								</Button>
							</div>
							<Item className="min-h-9 rounded-md border-0 px-2 py-1.5">
								<ItemMedia variant="icon">
									<Icon aria-hidden render={<FileIcon label="" />} />
								</ItemMedia>
								<ItemContent className="min-w-0">
									<ItemTitle className="max-w-full font-normal text-text-subtle">
										<span className="truncate">codex-clipboard-b1551afa.png</span>
									</ItemTitle>
								</ItemContent>
							</Item>
						</section>
					</PanelBody>
				</PanelContent>
			</PanelContainer>
		</motion.div>
	);
}
