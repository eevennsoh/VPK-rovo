"use client";

import { useMemo } from "react";

import { AGENT_SESSION_ITEMS, AgentSession } from "@/components/blocks/agent-session";
import { useHasVerticalOverflow } from "@/components/hooks/use-has-vertical-overflow";
import { buildScrollMaskStyle } from "@/components/visual/scroll-mask/lib";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import type { AgentSessionColumnProps } from "./agent-session-column-types";

/**
 * A kanban column of agent sessions that never became work items.
 *
 * The board's status columns are unfilled — they read as regions of the board
 * surface. This one is filled with `surface-sunken` because its contents are
 * *not* on the board yet: the sunken plane is what says "outside the workflow"
 * without needing a label to explain it. Everything below the header is the
 * Agent Session block verbatim, so a card's chin, captured state, and resume
 * gating behave identically here and in the standalone block.
 *
 * The column is a scrollport, so it reserves the 4px focus-ring gutter VPK's
 * widest ring needs (`-m-1 p-1`) rather than clipping a focused card's ring.
 */
export function AgentSessionColumn({
	className,
	count,
	emptyLabel = "No untracked sessions",
	items = AGENT_SESSION_ITEMS,
	listClassName,
	title = "Untracked work",
	...sessionProps
}: Readonly<AgentSessionColumnProps>) {
	const {
		ref: listRef,
		showBottomScrollMask,
		showTopScrollMask,
	} = useHasVerticalOverflow<HTMLDivElement>();
	const listStyle = useMemo(
		() => buildScrollMaskStyle({
			fadeBottom: showBottomScrollMask,
			fadeSize: "3rem",
			fadeTop: showTopScrollMask,
		}),
		[showBottomScrollMask, showTopScrollMask],
	);
	const sessionCount = count ?? items.length;

	return (
		<section
			aria-label={`${title}, ${sessionCount} sessions`}
			className={cn(
				"flex min-h-0 w-[280px] shrink-0 flex-col bg-surface-sunken",
				className,
			)}
			data-agent-session-column={title}
			style={{ borderRadius: token("radius.xlarge"), padding: token("space.100") }}
		>
			<div
				className="flex min-w-0 items-center gap-1.5"
				style={{ paddingBottom: token("space.100") }}
			>
				<span className="truncate text-xs font-medium leading-4 text-text-subtle">
					{title}
				</span>
				<span className="shrink-0 text-xs font-normal text-text-subtlest">
					{sessionCount}
				</span>
			</div>

			<div
				ref={listRef}
				className="-m-1 min-h-0 min-w-0 flex-1 overflow-y-auto p-1"
				style={listStyle}
			>
				{items.length === 0 ? (
					<p className="text-xs text-text-subtlest">{emptyLabel}</p>
				) : (
					<AgentSession className={listClassName} items={items} {...sessionProps} />
				)}
			</div>
		</section>
	);
}

export type { AgentSessionColumnProps } from "./agent-session-column-types";
