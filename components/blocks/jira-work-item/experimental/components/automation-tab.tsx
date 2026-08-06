"use client";

import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";

import { SetToRecurRow } from "@/components/blocks/jira-work-item/experimental/components/set-to-recur-popover";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

/**
 * The Automation tab: empty-state copy, Recent rule runs, and Set to recur.
 * Visual/mock —
 * no real automation engine.
 */
export function AutomationTab() {
	return (
		<div className="flex flex-col">
			<div className="flex flex-col items-center gap-3 px-2 py-4 text-center">
				<p className="text-sm leading-5 text-text-subtle">
					Create an automation to perform tasks with the click of a button. Once created, manually triggered
					automations will appear here.
				</p>
				<Button variant="outline">
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

			<div className="flex flex-col">
				<button
					className="-mx-2 flex items-center gap-2 rounded-md px-2 py-2 text-left outline-none transition-colors duration-normal ease-out-practical hover:bg-bg-neutral-subtle-hovered focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
					type="button"
				>
					<span className="flex min-w-0 flex-1 flex-col">
						<span className="truncate text-sm font-medium text-text">Recent rule runs</span>
						<span className="truncate text-xs text-text-subtlest">View automation history</span>
					</span>
					<Icon aria-hidden className="text-icon-subtle" render={<ChevronRightIcon label="" size="small" />} />
				</button>
				<SetToRecurRow />
			</div>
		</div>
	);
}
