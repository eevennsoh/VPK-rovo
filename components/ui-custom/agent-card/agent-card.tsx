"use client";

import { type ReactNode } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

import { SkillTag, SkillTagGroup, type SkillTagColor } from "@/components/ui-custom/skill-tag";
import { TWGAppstack, type TwgToolSource } from "@/components/ui-custom/twg-appstack";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

const OVERLAY_SHADOW = token("elevation.shadow.overlay");
const CARD_HOVER_TRANSITION = {
	type: "spring",
	bounce: 0.16,
	visualDuration: 0.22,
} as const;

export interface AgentCardSkill {
	label: string;
	color?: SkillTagColor;
	icon?: ReactNode;
}

export interface AgentCardProps {
	name: string;
	iconSrc: string;
	description?: string;
	sources?: ReadonlyArray<TwgToolSource>;
	skills?: ReadonlyArray<AgentCardSkill>;
	/** Invoked on click / Enter / Space. Presence renders a whole-card select button. */
	onSelect?: () => void;
	className?: string;
}

/**
 * Agent card — a rich-icon header, "Works with" sources, and "Skills" tags on a
 * bordered, hover-elevating surface with an optional whole-card select button.
 * A flat take on the studio bento tile; standalone from `entity-card`.
 */
export function AgentCard({
	name,
	iconSrc,
	description,
	sources = [],
	skills = [],
	onSelect,
	className,
}: Readonly<AgentCardProps>) {
	const interactive = Boolean(onSelect);
	const shouldReduceMotion = useReducedMotion();
	const hoverAnimation = { boxShadow: OVERLAY_SHADOW } as const;
	const tapAnimation = shouldReduceMotion ? undefined : ({ scale: 0.998 } as const);

	const body = (
		<>
			<div className="flex items-center gap-2" data-slot="agent-card-header">
				<span className="inline-flex shrink-0 items-center leading-none">
					<Image alt="" aria-hidden className="size-8 object-contain" height={32} src={iconSrc} width={32} />
				</span>
				<h3 className="min-w-0 flex-1 truncate text-text" style={{ font: token("font.heading.xsmall") }}>
					{name}
				</h3>
			</div>

			<p className="line-clamp-2 min-h-10 text-sm leading-5 text-text" data-slot="agent-card-description">
				{description ?? `Learn how ${name} can help your team work faster.`}
			</p>

			{sources.length > 0 ? (
				<div className="flex flex-col gap-1" data-slot="agent-card-section">
					<span className="text-xs font-semibold leading-4 text-text-subtlest">Works with</span>
					<TWGAppstack animated={false} className="justify-start" iconSize="md" maxVisible={6} sources={sources} />
				</div>
			) : null}

			{skills.length > 0 ? (
				<div className="flex flex-col gap-1" data-slot="agent-card-section">
					<span className="text-xs font-semibold leading-4 text-text-subtlest">Skills</span>
					<SkillTagGroup maxRows={2}>
						{skills.map((skill) => (
							<SkillTag color={skill.color ?? "default"} icon={skill.icon} key={skill.label}>
								{skill.label}
							</SkillTag>
						))}
					</SkillTagGroup>
				</div>
			) : null}
		</>
	);

	const cardMotionProps = {
		className: cn(
			"group/card relative flex h-full w-full flex-col gap-3 rounded-md bg-surface p-4 text-left outline-none after:pointer-events-none after:absolute after:inset-0 after:z-20 after:rounded-md after:border after:border-border after:transition-colors after:duration-fast after:ease-out hover:after:border-transparent has-[[data-slot=agent-card-select]:focus-visible]:after:border-transparent has-[[data-slot=agent-card-select]:focus-visible]:ring-3 has-[[data-slot=agent-card-select]:focus-visible]:ring-ring/50",
			interactive && "cursor-pointer",
			className,
		),
		style: { willChange: "transform" },
		animate: { boxShadow: "none" } as const,
		transition: CARD_HOVER_TRANSITION,
		whileHover: hoverAnimation,
		whileTap: interactive ? tapAnimation : undefined,
	};

	if (interactive) {
		return (
			<motion.article data-slot="agent-card" {...cardMotionProps}>
				<button
					aria-label={`Select ${name}`}
					className="absolute inset-0 z-0 rounded-md outline-none"
					data-slot="agent-card-select"
					onClick={onSelect}
					type="button"
				/>
				<div className="contents [&>*]:pointer-events-none [&>*]:relative [&>*]:z-10 [&_[role=button]]:pointer-events-auto [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
					{body}
				</div>
			</motion.article>
		);
	}

	return (
		<motion.article data-slot="agent-card" {...cardMotionProps}>
			{body}
		</motion.article>
	);
}
