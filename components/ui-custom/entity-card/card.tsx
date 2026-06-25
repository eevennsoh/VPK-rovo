"use client";

import { type ReactNode } from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

import { CARD_HOVER_TRANSITION, useCardInteraction } from "./use-card-interaction";

export interface EntityCardShellProps {
	/** Invoked on click / Enter / Space. Presence renders a whole-card select button. */
	onSelect?: () => void;
	/** Accessible label for the whole-card select button when interactive. */
	selectLabel?: string;
	/** Keeps the hover visual treatment active while a child popup/menu is open. */
	active?: boolean;
	/**
	 * Marks the card as selected — paints a persistent blue (`border-selected`)
	 * border that stays put through hover/focus instead of fading like the
	 * resting border. Pair with the leading checkbox swap on the card content.
	 */
	selected?: boolean;
	className?: string;
	children: ReactNode;
}

/**
 * Base entity-card shell — a bordered surface with hover elevation and an
 * optional keyboard-operable button contract. Compose content with
 * `EntityCardHeader`, `EntityCardDescription`, `EntityCardFooter`, etc.,
 * or use a ready-made variant (`EntityCard.Agent`, `EntityCard.Skill`,
 * `EntityCard.App`, `EntityCard.Tool`, `EntityCard.Knowledge`).
 */
export function EntityCardShell({
	onSelect,
	selectLabel = "Select item",
	active = false,
	selected = false,
	className,
	children,
}: Readonly<EntityCardShellProps>) {
	const { interactive, hoverAnimation, handleSelect } = useCardInteraction(onSelect);
	const cardVariants = {
		rest: { boxShadow: "none" },
		hover: hoverAnimation,
	} as const;

	const cardMotionProps = {
		className: cn(
			// The card shell is a non-interactive container. Selection is provided by a
			// dedicated overlay <button> (below) so nested controls (checkboxes, menus)
			// stay valid sibling controls instead of focusable descendants of a button —
			// an element with the button role must not contain other interactive elements.
			// `after:z-20` keeps the border stroke above card content: the interactive
			// branch lifts every child to `z-10` (so nested controls stay clickable),
			// which would otherwise let a full-bleed child (e.g. the expanded card's
			// colored banner) paint over the top border edge.
			"group/card relative flex h-full w-full flex-col gap-3 rounded-md bg-surface-overlay p-4 text-left outline-none after:pointer-events-none after:absolute after:inset-0 after:z-20 after:rounded-md after:border after:transition-colors after:duration-fast after:ease-out has-[[data-slot=card-directory-select]:focus-visible]:ring-3 has-[[data-slot=card-directory-select]:focus-visible]:ring-ring/50",
			// A selected card keeps a persistent blue border through hover/focus; the
			// resting border instead fades to transparent on hover/focus so the
			// elevation shadow reads as the only edge treatment.
			selected
				? "after:border-border-selected"
				: "after:border-border hover:after:border-transparent has-[[data-slot=card-directory-select]:focus-visible]:after:border-transparent",
			active && !selected && "after:border-transparent",
			interactive && "cursor-pointer",
			className,
		),
		style: { willChange: "transform" },
		animate: active ? "hover" : "rest",
		initial: "rest",
		transition: CARD_HOVER_TRANSITION,
		variants: cardVariants,
		whileHover: "hover",
	};

	if (interactive) {
		return (
			<motion.article data-active={active || undefined} data-slot="card-directory" {...cardMotionProps}>
				{/* Whole-card selection affordance. A real <button> gives native keyboard
				    (Enter/Space) operation and focus management; it sits beneath the card
				    content (z-0) so nested controls layered above (z-10) remain clickable
				    and are announced as siblings, not children, of this button. */}
				<button
					aria-label={selectLabel}
					className="absolute inset-0 z-0 cursor-pointer rounded-md outline-none"
					data-slot="card-directory-select"
					onClick={handleSelect}
					type="button"
				/>
				{/* Content sits above the select button so genuinely interactive nested
				    controls (menus, checkboxes) stay clickable. Inert content is made
				    pointer-events-none so clicks on text/logo fall through to the select
				    button below; pointer events are re-enabled only on actual interactive
				    descendants. Those descendants ALSO get `relative z-10`: the card
				    variants root their content in a `display:contents` wrapper, which has
				    no box, so the `[&>*]:z-10` lift never reaches the real controls — and
				    a positioned `z-0` element (the select button) paints above static
				    content, swallowing clicks on the "…" menu. Elevating each interactive
				    descendant directly puts it back on top of the select overlay. */}
				<div className="contents [&>*]:pointer-events-none [&>*]:relative [&>*]:z-10 [&_[role=button]]:pointer-events-auto [&_[role=button]]:relative [&_[role=button]]:z-10 [&_[role=menuitem]]:pointer-events-auto [&_a]:pointer-events-auto [&_a]:relative [&_a]:z-10 [&_button]:pointer-events-auto [&_button]:relative [&_button]:z-10 [&_input]:pointer-events-auto [&_input]:relative [&_input]:z-10 [&_select]:pointer-events-auto [&_select]:relative [&_select]:z-10 [&_textarea]:pointer-events-auto [&_textarea]:relative [&_textarea]:z-10">
					{children}
				</div>
			</motion.article>
		);
	}

	return (
		<motion.article data-active={active || undefined} data-slot="card-directory" {...cardMotionProps}>
			{children}
		</motion.article>
	);
}
