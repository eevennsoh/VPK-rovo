"use client";

import AutomationIcon from "@atlaskit/icon/core/automation";
import BranchIcon from "@atlaskit/icon/core/branch";
import CheckMarkIcon from "@atlaskit/icon/core/check-mark";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";

import { SetToRecurRow } from "@/components/blocks/agent-sessions/experimental/components/set-to-recur-popover";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

function AutomationTile({
	className,
	icon: IconComponent,
}: Readonly<{ className: string; icon: React.ComponentType<{ label: string; size?: "small" }> }>) {
	return (
		<span className={`flex size-9 items-center justify-center rounded-md ${className}`}>
			<Icon aria-hidden className="text-text" render={<IconComponent label="" size="small" />} />
		</span>
	);
}

/**
 * The Automation tab: an empty "From Automation" state (trigger → condition →
 * action illustration + copy), Recent rule runs, and Set to recur. Visual/mock —
 * no real automation engine.
 */
export function AutomationTab() {
	return (
		<div className="flex flex-col">
			<div className="flex flex-col items-center gap-3 px-2 py-4 text-center">
				<span className="self-start text-sm font-semibold text-text">From Automation</span>
				<div className="flex flex-col items-center gap-1 py-2" aria-hidden>
					<AutomationTile className="bg-blue-400" icon={AutomationIcon} />
					<span className="h-2 w-px bg-border" />
					<AutomationTile className="bg-bg-neutral" icon={BranchIcon} />
					<span className="h-2 w-px bg-border" />
					<AutomationTile className="bg-lime-400" icon={CheckMarkIcon} />
				</div>
				<p className="text-sm leading-5 text-text-subtle">
					Create an automation to perform tasks with the click of a button. Once created, manually triggered
					automations will appear here.
				</p>
				<Button className="w-full" disabled variant="outline">
					Add manually triggered automation
				</Button>
				<a
					className="text-sm font-medium text-link hover:underline"
					href="#"
					onClick={(event) => event.preventDefault()}
				>
					See templates
				</a>
			</div>

			<div className="border-t border-border">
				<button
					className="flex w-full items-center gap-2 px-1 py-2 text-left text-sm text-text outline-none transition-colors duration-normal ease-out-practical hover:bg-bg-neutral-subtle-hovered focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
					type="button"
				>
					<span className="min-w-0 flex-1 truncate">Recent rule runs</span>
					<Icon aria-hidden className="text-icon-subtle" render={<ChevronRightIcon label="" size="small" />} />
				</button>
			</div>

			<div className="border-t border-border">
				<SetToRecurRow />
			</div>
		</div>
	);
}
