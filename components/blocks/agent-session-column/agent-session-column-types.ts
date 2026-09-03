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
	/** Additional classes applied to the column surface. */
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
	/**
	 * Whether the column starts collapsed into its notch rail. The column owns
	 * the state from there — the hover-revealed shrink/grow control toggles it.
	 *
	 * Ignored once {@link AgentSessionColumnProps.collapsed} is supplied.
	 */
	defaultCollapsed?: boolean;
	/**
	 * Controlled collapse. Supply it when the host renders its own collapse
	 * affordance — a docked surface with a minimise control, say — and needs the
	 * two to agree. The column then never writes the state itself; it still
	 * reports every toggle through `onCollapsedChange`, so a host that forgets
	 * to echo the value back simply sees no change.
	 *
	 * Leave it `undefined` for the default uncontrolled behaviour, where the
	 * column starts at `defaultCollapsed` and owns the state from there.
	 */
	collapsed?: boolean;
	/** Called after the column collapses or expands, controlled or not. */
	onCollapsedChange?: (collapsed: boolean) => void;
	/**
	 * How much chrome the column draws around the sessions.
	 *
	 * `"default"` keeps the expanded header row — title, count, overflow menu
	 * and collapse control — so the column reads as one of the board's columns.
	 *
	 * `"none"` drops that row only, for a host surface that already draws a
	 * title bar and wants to own those actions rather than stack a second
	 * header under its own. It is deliberately narrow: the collapsed rail keeps
	 * its compact header in both modes, because at 32px that header *is* the
	 * chrome and it carries the only control that can expand the column again.
	 * The `<section>` keeps its `aria-label` too — with the visible title gone
	 * it becomes the list's only accessible name.
	 */
	chrome?: "default" | "none";
}
