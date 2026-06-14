import type { ReactElement } from "react";

import { renderAgentTriggerProviderTileIcon, type AgentTriggerValue } from "@/components/blocks/triggers/page";
import { IconTile } from "@/components/ui/icon-tile";
import AutomationIcon from "@atlaskit/icon/core/automation";
import GenerativeIndicatorIcon from "@atlaskit/icon-lab/core/generative-indicator";

interface AgentAutomationFlowCoverProps {
	"aria-label"?: string;
	"aria-hidden"?: boolean;
	rootElement?: "div" | "span";
	triggers: readonly AgentTriggerValue[];
}

export function AgentAutomationFlowCover({
	"aria-label": ariaLabel,
	"aria-hidden": ariaHidden = true,
	rootElement = "div",
	triggers,
}: Readonly<AgentAutomationFlowCoverProps>): ReactElement {
	const Root = rootElement;
	const visibleTriggers = triggers.slice(0, 5);
	const overflowCount = Math.max(0, triggers.length - visibleTriggers.length);

	return (
		<Root
			aria-hidden={ariaHidden || undefined}
			aria-label={ariaHidden ? undefined : ariaLabel}
			className="flex items-center gap-2"
		>
			<span className="flex min-w-0 items-center gap-1">
				{visibleTriggers.length > 0 ? (
					visibleTriggers.map((trigger) => (
						<span key={trigger.id} className="rich-text-command-menu-avatar inline-flex size-8 shrink-0 items-center justify-center">
							{renderAgentTriggerProviderTileIcon(trigger) ?? <AutomationIcon label="" size="small" />}
						</span>
					))
				) : (
					<IconTile
						aria-hidden={true}
						icon={<AutomationIcon label="" size="small" />}
						label="Trigger"
						size="medium"
						variant="blue"
					/>
				)}
				{overflowCount > 0 ? (
					<span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-border bg-bg-input px-1.5 text-xs font-medium leading-4 text-text-subtle">
						+{overflowCount}
					</span>
				) : null}
			</span>
			<span className="h-px w-6 shrink-0 bg-border" />
			<IconTile
				aria-hidden={true}
				icon={<GenerativeIndicatorIcon label="" size="small" />}
				label="Agent instructions"
				size="small"
				variant="gray"
			/>
		</Root>
	);
}
