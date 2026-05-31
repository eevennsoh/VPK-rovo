"use client";

import EditIcon from "@atlaskit/icon/core/edit";
import LocationIcon from "@atlaskit/icon/core/location";
import PageIcon from "@atlaskit/icon/core/page";
import PersonIcon from "@atlaskit/icon/core/person";
import { useState } from "react";
import {
	CollapsibleContextBar,
	ContextBar,
	ContextBarLead,
	ContextBarTag,
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
