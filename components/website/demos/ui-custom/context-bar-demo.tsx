"use client";

import BranchIcon from "@atlaskit/icon/core/branch";
import EditIcon from "@atlaskit/icon/core/edit";
import LocationIcon from "@atlaskit/icon/core/location";
import PageIcon from "@atlaskit/icon/core/page";
import PersonIcon from "@atlaskit/icon/core/person";
import PullRequestIcon from "@atlaskit/icon/core/pull-request";
import { useState } from "react";
import {
	AnimatedCollapsibleContextBar,
	CollapsibleContextBar,
	ContextBar,
	ContextBarLead,
	ContextBarPill,
	ContextBarTag,
	ContextBarTagGroup,
	ContextBarTrigger,
} from "@/components/ui-custom/context-bar";
import { token } from "@/lib/tokens";

export default function ContextBarDemo() {
	return <ContextBarDemoCollapsible />;
}

export function ContextBarDemoCollapsible() {
	return (
		<div className="w-full max-w-md p-8">
			<CollapsibleContextBar
				collapsedIcon={
					<EditIcon color={token("color.icon.subtle")} label="" size="small" />
				}
				collapsedLabel="Edit agent"
				dismissLabel="Close edit context"
				lead={<EditIcon color={token("color.icon.subtle")} label="" size="small" />}
				leadLabel="Edit:"
				triggerAriaLabel="Edit agent: Research assistant"
			>
				<ContextBarTag
					color="blue"
					elemBefore={
						<PersonIcon color={token("color.icon.brand")} label="" size="small" />
					}
					title="Research assistant"
				>
					Research assistant
				</ContextBarTag>
			</CollapsibleContextBar>
		</div>
	);
}

export function ContextBarDemoDismissible() {
	const [visible, setVisible] = useState(true);

	return (
		<div className="w-full max-w-md p-8">
			{visible ? (
				<ContextBar dismissLabel="Close context" onDismiss={() => setVisible(false)}>
					<ContextBarLead
						icon={<LocationIcon color={token("color.icon.subtle")} label="" size="small" />}
					>
						Context:
					</ContextBarLead>
					<ContextBarTag
						color="blue"
						elemBefore={<PageIcon color={token("color.icon.brand")} label="" size="small" />}
						title="Q3 launch plan"
					>
						Q3 launch plan
					</ContextBarTag>
				</ContextBar>
			) : (
				<button
					className="text-sm font-medium text-text-subtle underline"
					onClick={() => setVisible(true)}
					type="button"
				>
					Restore context bar
				</button>
			)}
		</div>
	);
}

export function ContextBarDemoTrigger() {
	return (
		<div className="w-full max-w-md p-8">
			<ContextBarTrigger
				aria-label="Edit agent: Research assistant"
				icon={<EditIcon color={token("color.icon.subtle")} label="" size="small" />}
			>
				Edit agent
			</ContextBarTrigger>
		</div>
	);
}

export function ContextBarDemoAnimated() {
	return (
		<div className="w-full max-w-md p-8">
			<AnimatedCollapsibleContextBar
				collapsedIcon={<EditIcon color={token("color.icon.subtle")} label="" size="small" />}
				collapsedLabel="Edit agent"
				defaultOpen={false}
				dismissLabel="Close edit context"
				lead={<EditIcon color={token("color.icon.subtle")} label="" size="small" />}
				leadLabel="Edit:"
				triggerAriaLabel="Edit agent: Research assistant"
			>
				<ContextBarTag
					color="blue"
					elemBefore={<PersonIcon color={token("color.icon.brand")} label="" size="small" />}
					title="Research assistant"
				>
					Research assistant
				</ContextBarTag>
			</AnimatedCollapsibleContextBar>
		</div>
	);
}

/**
 * Width-aware row of action pills. As many pills render inline as fit; the rest
 * collapse behind a trailing "…" overflow button that opens a dropdown menu.
 * Each item carries both a visible `content` (the pill) and a menu-friendly
 * `label` (+ optional `icon`) so the hidden items render as real menu items
 * rather than nested pill buttons inside the overflow surface.
 */
export function ContextBarDemoMultiPill() {
	const pills = [
		{
			id: "review",
			label: "Review +6 -3",
			content: (
				<ContextBarPill>
					Review{" "}
					<span className="font-semibold text-green-500">+6</span>{" "}
					<span className="font-semibold text-red-500">-3</span>
				</ContextBarPill>
			),
		},
		{
			id: "move",
			label: "Move to Local",
			icon: <LocationIcon color={token("color.icon.subtle")} label="" size="small" />,
			content: (
				<ContextBarPill
					icon={<LocationIcon color={token("color.icon.subtle")} label="" size="small" />}
				>
					Move to Local
				</ContextBarPill>
			),
		},
		{
			id: "create-prs",
			label: "Create PRs",
			icon: <PullRequestIcon color={token("color.icon.subtle")} label="" size="small" />,
			content: (
				<ContextBarPill
					icon={<PullRequestIcon color={token("color.icon.subtle")} label="" size="small" />}
				>
					Create PRs
				</ContextBarPill>
			),
		},
		{
			id: "run-tests",
			label: "Run tests",
			content: <ContextBarPill>Run tests</ContextBarPill>,
		},
		{
			id: "new-branch",
			label: "New branch",
			icon: <BranchIcon color={token("color.icon.subtle")} label="" size="small" />,
			content: (
				<ContextBarPill
					icon={<BranchIcon color={token("color.icon.subtle")} label="" size="small" />}
				>
					New branch
				</ContextBarPill>
			),
		},
		{
			id: "share",
			label: "Share link",
			content: <ContextBarPill>Share link</ContextBarPill>,
		},
	];

	return (
		<div className="w-full max-w-md p-8">
			<ContextBarTagGroup items={pills} overflowAriaLabel="Show more actions" />
		</div>
	);
}
