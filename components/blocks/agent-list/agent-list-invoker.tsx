"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

import { actorInitials } from "./agent-list-actor";
import type { AgentListInvoker } from "./agent-list-types";

/** 16px invoker face. Shared by the `by` chip and the local-session metadata line. */
export function InvokerAvatar({ invoker }: Readonly<{ invoker: AgentListInvoker }>) {
	return (
		<Avatar className="shrink-0" label={invoker.name} size="xs" title={invoker.name}>
			{invoker.avatarSrc ? (
				<AvatarImage alt="" src={invoker.avatarSrc} />
			) : null}
			<AvatarFallback>{actorInitials(invoker.name)}</AvatarFallback>
		</Avatar>
	);
}

/** Compact `by <face>` metadata after the relative timestamp. */
export function InvokerBy({ invoker }: Readonly<{ invoker: AgentListInvoker }>) {
	return (
		<span className="flex shrink-0 items-center gap-1">
			<span>by</span>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger render={<span className="inline-flex size-4 shrink-0" />}>
						<InvokerAvatar invoker={invoker} />
					</TooltipTrigger>
					<TooltipContent>{invoker.name}</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</span>
	);
}
