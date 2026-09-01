"use client";

import LinkBrokenIcon from "@atlaskit/icon/core/link-broken";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function stopSessionGesture(event: { stopPropagation: () => void }) {
	event.stopPropagation();
}

/**
 * Hover/focus-revealed unlink on an attached chin row. Sibling of the drag
 * handle — never nested inside it — so the row stays valid HTML.
 */
export function JiraIssueAgentSessionUnlinkButton({
	onUnlink,
}: Readonly<{
	onUnlink: () => void;
}>) {
	return (
		<div
			className={cn(
				"relative z-10 flex h-6 w-0 shrink-0 overflow-hidden transition-[width] duration-fast ease-out-practical",
				"group-hover/agent-chin-row:w-6 group-has-[:focus-visible]/agent-chin-row:w-6",
				"group-has-[:focus-visible]/agent-chin-row:overflow-visible",
				"motion-reduce:transition-none",
			)}
		>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger
						render={
							<Button
								aria-label="Unlink"
								className={cn(
									"pointer-events-none opacity-0 transition-opacity duration-fast ease-out-practical motion-reduce:transition-none",
									"group-hover/agent-chin-row:pointer-events-auto group-hover/agent-chin-row:opacity-100",
									"group-has-[:focus-visible]/agent-chin-row:pointer-events-auto group-has-[:focus-visible]/agent-chin-row:opacity-100",
								)}
								data-slot="jira-issue-agent-session-unlink"
								onClick={(event) => {
									stopSessionGesture(event);
									onUnlink();
								}}
								onMouseDown={stopSessionGesture}
								onPointerDown={stopSessionGesture}
								size="icon-compact"
								type="button"
								variant="ghost"
							/>
						}
					>
						<Icon className="text-icon-subtle" render={<LinkBrokenIcon label="" size="small" />} />
					</TooltipTrigger>
					<TooltipContent>Unlink</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
	);
}
