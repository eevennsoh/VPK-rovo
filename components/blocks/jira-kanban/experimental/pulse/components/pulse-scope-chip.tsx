"use client";

import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react";

import type { PulseScope } from "@/components/blocks/jira-kanban/experimental/pulse/types";
import { Tag } from "@/components/ui/tag";

/**
 * The scope chip — the standing statement that the article is narrowed.
 *
 * It sits beside Filter rather than inside it, because a scope that is only
 * legible after opening a popover is a scope the reader forgets they set, and
 * the brief at the top of the article is a large thing to have appear with no
 * visible cause.
 *
 * Clearing goes back through the board filter's own actions rather than through
 * a second piece of state. The chip reflects a selection it does not own; if it
 * owned one, the popover and the chip could disagree about what the page is
 * showing, which is exactly the bug the chip exists to prevent.
 *
 * `Tag`'s inline remove is deliberate over the overlay one: this is a standing
 * statement about the page, so the way out of it stays in the tab order instead
 * of waiting for a pointer.
 */

/** duration-normal + ease-out-practical — a small, frequent control settling. */
const CHIP_ENTER: Transition = { duration: 0.15, ease: [0.4, 1, 0.6, 1] };
/** duration-fast + ease-in — the reader triggered it; clear out of the way. */
const CHIP_EXIT: Transition = { duration: 0.1, ease: [0.6, 0, 0.8, 0.6] };
/** VPK's duration tokens do not honour the OS setting, so the guard is explicit. */
const CHIP_STILL: Transition = { duration: 0 };

export function PulseScopeChip({
	scope,
	onClear,
}: Readonly<{ scope: PulseScope | null; onClear: () => void }>) {
	const shouldReduceMotion = useReducedMotion();
	const enter = shouldReduceMotion ? CHIP_STILL : CHIP_ENTER;
	const exit = shouldReduceMotion ? CHIP_STILL : CHIP_EXIT;
	const offset = shouldReduceMotion ? 0 : -8;

	return (
		<AnimatePresence initial={false}>
			{scope === null ? null : (
				<motion.div
					animate={{ opacity: 1, x: 0 }}
					className="flex items-center"
					// The exit timing lives in the exit variant: a lone `transition` prop
					// would quietly run the exit at the entrance's pace.
					exit={{ opacity: 0, transition: exit, x: offset }}
					initial={{ opacity: 0, x: offset }}
					key={`${scope.kind}:${scope.id}`}
					style={{ willChange: "opacity, transform" }}
					transition={enter}
				>
					<Tag
						className="self-center"
						maxWidth="17rem"
						onRemove={onClear}
						removeButtonLabel={`Clear ${scope.kind} scope: ${scope.key}`}
					>
						<span className="tabular-nums">{scope.key}</span>
						<span className="text-text-subtlest">{" · "}</span>
						{scope.name}
					</Tag>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
