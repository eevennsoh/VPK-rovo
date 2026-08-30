import type { AgentSessionProps } from "@/components/blocks/agent-session";

/**
 * Column chrome around the Agent Session cards.
 *
 * Every card-level concern is delegated: this extends `AgentSessionProps` so a
 * host wires `onLinkWorkItem`, `onCreateWorkItem`, `capturedItemIds` and friends
 * exactly as it would on the bare block. Only `className` is reclaimed, because
 * on a column it reads as the column surface rather than the inner list.
 */
export interface AgentSessionColumnProps extends Omit<AgentSessionProps, "className"> {
	/** Additional classes applied to the sunken column surface. */
	className?: string;
	/** Classes applied to the inner session list. */
	listClassName?: string;
	/** Header label. */
	title?: string;
	/**
	 * Header count. Defaults to the number of rendered sessions; override when
	 * the column shows a filtered slice of a larger backlog.
	 */
	count?: number;
	/** Copy shown in place of the list when there are no sessions. */
	emptyLabel?: string;
}
