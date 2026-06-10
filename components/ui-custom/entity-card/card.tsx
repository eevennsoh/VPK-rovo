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
	className,
	children,
}: Readonly<EntityCardShellProps>) {
	const { interactive, hoverAnimation, tapAnimation, handleSelect } =
		useCardInteraction(onSelect);

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
			"group/card relative flex h-full w-full flex-col gap-3 rounded-md bg-surface p-4 text-left outline-none after:pointer-events-none after:absolute after:inset-0 after:z-20 after:rounded-md after:border after:border-border after:transition-colors after:duration-fast after:ease-out hover:after:border-transparent has-[[data-slot=card-directory-select]:focus-visible]:after:border-transparent has-[[data-slot=card-directory-select]:focus-visible]:ring-3 has-[[data-slot=card-directory-select]:focus-visible]:ring-ring/50",
			active && "after:border-transparent",
			interactive && "cursor-pointer",
			className,
		),
		style: { willChange: "transform" },
		animate: active ? hoverAnimation : { boxShadow: "none" },
		transition: CARD_HOVER_TRANSITION,
		whileHover: hoverAnimation,
		whileTap: interactive ? tapAnimation : undefined,
	};

	if (interactive) {
		return (
			<motion.article data-slot="card-directory" {...cardMotionProps}>
				{/* Whole-card selection affordance. A real <button> gives native keyboard
				    (Enter/Space) operation and focus management; it sits beneath the card
				    content (z-0) so nested controls layered above (z-10) remain clickable
				    and are announced as siblings, not children, of this button. */}
				<button
					aria-label={selectLabel}
					className="absolute inset-0 z-0 rounded-md outline-none"
					data-slot="card-directory-select"
					onClick={handleSelect}
					type="button"
				/>
				{/* Content sits above the select button (z-10) so genuinely interactive
				    nested controls (menus, checkboxes) stay clickable. Inert content is
				    made pointer-events-none so clicks on text/logo fall through to the
				    select button below; pointer events are re-enabled only on actual
				    interactive descendants. Without this, clicks landing on the card's
				    text/logo never reach the select button, making selection feel
				    unreliable (requiring repeated clicks). */}
				<div className="contents [&>*]:pointer-events-none [&>*]:relative [&>*]:z-10 [&_[role=button]]:pointer-events-auto [&_[role=menuitem]]:pointer-events-auto [&_a]:pointer-events-auto [&_button]:pointer-events-auto [&_input]:pointer-events-auto [&_select]:pointer-events-auto [&_textarea]:pointer-events-auto">
					{children}
				</div>
			</motion.article>
		);
	}

	return (
		<motion.article data-slot="card-directory" {...cardMotionProps}>
			{children}
		</motion.article>
	);
}
