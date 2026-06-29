"use client";

import { motion, useReducedMotion } from "motion/react";
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useCallback, useRef, useState } from "react";
import Image from "next/image";

import { AgentTemplatesDialog } from "@/components/blocks/agent-templates";
import { DEMO_AGENT_TEMPLATES } from "@/components/blocks/agent-templates/data/demo-template-agents";
import { BENTO_CAROUSEL_TILE_CLASS, BentoCarousel } from "@/components/ui-custom/bento-carousel";
import { useBentoDescriptionClamp } from "@/components/ui-custom/hooks/use-bento-description-clamp";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import {
	AGENT_BENTO_OPERATIONS_TEMPLATES,
} from "../data/operations-templates";

const DEFAULT_ACCENT_COLOR = "#1868DB";

const AVATAR_GROUP_ACCENTS: Readonly<Record<string, string>> = {
	"dev-agents": "#82B536",
	"product-agents": "#BF63F3",
	"service-agents": "#FFC716",
	"strategy-agents": "#FCA700",
	"teamwork-agents": DEFAULT_ACCENT_COLOR,
};

type BentoCardGlowCSSProperties = CSSProperties & Record<`--card-glow-${string}`, string | number>;

const CARD_GLOW_EFFECT_STYLE: BentoCardGlowCSSProperties = {
	"--card-glow-border-core": 36,
	"--card-glow-border-spread": 120,
	"--card-glow-border-width": 1,
	"--card-glow-icon-blur": 28,
	"--card-glow-icon-brightness": 1.3,
	"--card-glow-icon-contrast": 1.4,
	"--card-glow-icon-opacity": 0.25,
	"--card-glow-icon-saturate": 5,
	"--card-glow-icon-scale": 3.4,
};

const CARD_GLOW_LAYER_STYLE: CSSProperties = {
	filter: [
		"blur(calc(var(--card-glow-icon-blur) * 1px))",
		"saturate(var(--card-glow-icon-saturate))",
		"brightness(var(--card-glow-icon-brightness))",
		"contrast(var(--card-glow-icon-contrast))",
	].join(" "),
	scale: "var(--card-glow-icon-scale)",
	translate: "calc(var(--card-glow-pointer-x, -10) * 50cqi) calc(var(--card-glow-pointer-y, -10) * 50cqh)",
	willChange: "translate, scale, filter, opacity",
};

const CARD_BORDER_FADE_STYLE: CSSProperties = {
	maskImage: "linear-gradient(to bottom, #000 calc(100% - 64px), transparent 100%)",
	WebkitMaskImage: "linear-gradient(to bottom, #000 calc(100% - 64px), transparent 100%)",
};

const CARD_BASE_BORDER_STYLE: CSSProperties = {
	boxShadow: `inset 0 0 0 calc(var(--card-glow-border-width) * 1px) ${token("color.border")}`,
};

const CARD_BORDER_GLOW_STYLE: CSSProperties = {
	background: [
		"radial-gradient(",
		"circle at ",
		"calc((var(--card-glow-pointer-x, -10) + 1) * 50%) ",
		"calc((var(--card-glow-pointer-y, -10) + 1) * 50%), ",
		"var(--card-glow-tile-accent) 0 calc(var(--card-glow-border-core) * 1px), ",
		"transparent calc(var(--card-glow-border-spread) * 1px)",
		") border-box",
	].join(""),
	borderColor: "transparent",
	borderWidth: "calc(var(--card-glow-border-width) * 1px)",
	mask: "linear-gradient(#fff 0 100%) border-box, linear-gradient(#fff 0 100%) padding-box",
	maskComposite: "exclude",
	WebkitMask: "linear-gradient(#fff 0 100%) border-box, linear-gradient(#fff 0 100%) padding-box",
	WebkitMaskComposite: "xor",
};

function getCardGlowAccent(iconSrc: string): string {
	const group = iconSrc.match(/\/avatar-agent\/([^/]+)\//)?.[1];
	return (group && AVATAR_GROUP_ACCENTS[group]) || DEFAULT_ACCENT_COLOR;
}

function getCardStyle(accentColor: string): BentoCardGlowCSSProperties {
	return {
		"--card-glow-tile-accent": accentColor,
		containerType: "size",
		willChange: "transform, opacity",
	};
}

function resetCardPointer(tile: HTMLElement) {
	tile.style.setProperty("--card-glow-pointer-x", "-10");
	tile.style.setProperty("--card-glow-pointer-y", "-10");
}

function CardGlowLayers({ iconSrc }: Readonly<{ iconSrc: string }>) {
	return (
		<>
			<span
				aria-hidden
				className="pointer-events-none absolute inset-0 z-0 grid place-items-center transform-gpu"
				style={CARD_GLOW_LAYER_STYLE}
			>
				<Image
					alt=""
					aria-hidden
					className="size-12 object-contain opacity-[var(--card-glow-icon-opacity)]"
					height={48}
					src={iconSrc}
					width={48}
				/>
			</span>
			<span
				aria-hidden
				className="pointer-events-none absolute inset-0 z-[1] rounded-[inherit]"
				data-agent-compact-bento-card-border-fade
				style={CARD_BORDER_FADE_STYLE}
			>
				<span
					aria-hidden
					className="pointer-events-none absolute inset-0 rounded-[inherit]"
					data-agent-compact-bento-card-base-border
					style={CARD_BASE_BORDER_STYLE}
				/>
				<span
					aria-hidden
					className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] border border-transparent"
					data-agent-compact-bento-card-glow-border
					style={CARD_BORDER_GLOW_STYLE}
				/>
			</span>
		</>
	);
}

function SectionLabel({ children }: Readonly<{ children: ReactNode }>) {
	return <span className="text-xs font-medium leading-4 text-text-subtle">{children}</span>;
}

function TemplatesHint({
	onBrowseAll,
	onDismiss,
}: Readonly<{
	onBrowseAll?: () => void;
	onDismiss?: () => void;
}>) {
	return (
		<div className="relative z-[3] mb-3 flex items-center justify-between gap-3">
			<SectionLabel>
				<span>Start with these agent templates</span>
				<span aria-hidden="true" className="mx-1">
					·
				</span>
				<button
					type="button"
					onClick={onBrowseAll}
					className="font-medium text-link underline-offset-2 hover:underline active:text-link-pressed focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
				>
					Browse all
				</button>
			</SectionLabel>
			<button
				type="button"
				onClick={onDismiss}
				className="shrink-0 text-xs font-medium text-link underline-offset-2 hover:underline active:text-link-pressed focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
			>
				Not now
			</button>
		</div>
	);
}

export interface AgentCompactOperationsBentoProps {
	onDismiss?: () => void;
	// When provided (e.g. the Studio shell), browsing or selecting a template
	// defers to the host — which opens the Agents Directory and actually applies
	// the chosen prompt to the agent — instead of the bento's built-in demo
	// `AgentTemplatesDialog` (whose select handler only closes the dialog). Mirrors
	// the "start with a template" link wiring in `AgentInstructionsComposer`.
	onStartWithTemplate?: () => void;
}

/**
 * The minimal "Start with these agent templates" bento, copied from the
 * agent-config compact view (`AgentCompactOperationsBento`). Five prompt-starter
 * tiles in a `grid-cols-5` desktop grid that collapses to a horizontal carousel
 * below `lg`. Tiles open the full agent-templates dialog.
 */
export function AgentCompactOperationsBento({ onDismiss, onStartWithTemplate }: Readonly<AgentCompactOperationsBentoProps>) {
	const shouldReduceMotion = useReducedMotion();
	const [browseOpen, setBrowseOpen] = useState(false);
	// Tiles and "Browse all" defer to the host template flow when one is provided
	// (Studio applies the selected prompt); otherwise they open the bento's own
	// templates dialog (standalone doc-demo behavior).
	const handleBrowseTemplates = useCallback(() => {
		if (onStartWithTemplate) {
			onStartWithTemplate();
			return;
		}
		setBrowseOpen(true);
	}, [onStartWithTemplate]);
	const tileRefs = useRef<Array<HTMLButtonElement | null>>([]);
	const handleBentoPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
		for (const tile of tileRefs.current) {
			if (!tile) {
				continue;
			}

			const rect = tile.getBoundingClientRect();
			const centerX = rect.left + rect.width / 2;
			const centerY = rect.top + rect.height / 2;
			const relativeX = event.clientX - centerX;
			const relativeY = event.clientY - centerY;
			const normalizedX = relativeX / (rect.width / 2);
			const normalizedY = relativeY / (rect.height / 2);

			tile.style.setProperty("--card-glow-pointer-x", normalizedX.toFixed(3));
			tile.style.setProperty("--card-glow-pointer-y", normalizedY.toFixed(3));
		}
	}, []);
	const resetBentoPointer = useCallback(() => {
		for (const tile of tileRefs.current) {
			if (tile) {
				resetCardPointer(tile);
			}
		}
	}, []);

	// Truncate each card description to the whole number of lines that fit its box;
	// shared with the landing bento (`HomeStarterBento`) so both stay identical.
	const registerDescBox = useBentoDescriptionClamp();

	return (
		<motion.section
			aria-label="Operations prompt starters"
			data-slot="agent-compact-operations-bento"
			className="@container/bento relative flex min-h-0 flex-1 flex-col lg:min-h-[11.5rem]"
			onPointerLeave={resetBentoPointer}
			onPointerMove={handleBentoPointerMove}
			style={{ ...CARD_GLOW_EFFECT_STYLE, willChange: "transform, opacity" }}
			initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
			transition={{ duration: 0.24, ease: [0, 0.4, 0, 1] }}
		>
			<TemplatesHint onBrowseAll={handleBrowseTemplates} onDismiss={onDismiss} />
			{/*
				`-mt-2 pt-2` gives the masked content top headroom that nets to zero
				visual shift: the bottom-fade mask clips its children to the box, so
				tiles flush with the top edge would have their focus ring and glow
				border sliced off. The padding keeps those effects inside the opaque
				region; the negative margin pulls the box back so spacing is unchanged.
			*/}
			<div className="relative -mt-2 min-h-0 pt-2 lg:flex-1 lg:overflow-hidden lg:bento-fade-bottom">
				<BentoCarousel
					gridClassName="lg:grid-cols-5"
					arrowLabels={{ next: "Show next agent templates", previous: "Show previous agent templates" }}
				>
					{AGENT_BENTO_OPERATIONS_TEMPLATES.map((template, index) => {
						const accentColor = getCardGlowAccent(template.iconSrc);

						return (
							<motion.button
								key={template.title}
								type="button"
								aria-label={`Use prompt starter: ${template.title}`}
								className={cn(
									"group group/agent-compact-bento-card relative isolate flex min-h-0 flex-col items-start gap-3 overflow-hidden rounded-lg bg-background p-4 text-left outline-none transition-[background-color,box-shadow] duration-fast ease-out hover:bg-bg-neutral-subtle focus-visible:ring-3 focus-visible:ring-ring/50",
									BENTO_CAROUSEL_TILE_CLASS
								)}
								ref={(node) => {
									tileRefs.current[index] = node;
								}}
								style={getCardStyle(accentColor)}
								transition={{ duration: 0.2, ease: [0, 0.4, 0, 1] }}
								whileTap={shouldReduceMotion ? undefined : { scale: 0.98, transition: { duration: 0.05 } }}
								onClick={handleBrowseTemplates}
							>
								<CardGlowLayers iconSrc={template.iconSrc} />
								<span className="relative z-[3] inline-flex size-8 shrink-0 items-center justify-center transition-opacity duration-fast ease-out group-hover/agent-compact-bento-card:opacity-90">
									<Avatar shape="hexagon" size="default">
										<AvatarImage src={template.iconSrc} alt="" />
										<AvatarFallback>{template.title.slice(0, 2).toUpperCase()}</AvatarFallback>
									</Avatar>
								</span>
								<span className="relative z-[3] flex min-w-0 flex-1 flex-col gap-1">
									<span className="block w-full min-w-0 text-sm font-semibold leading-5 text-text">
										{template.title}
									</span>
									<span
										ref={registerDescBox}
										className="block w-full min-w-0 flex-1 min-h-0 overflow-hidden"
									>
										<span className="text-sm leading-5 text-text-subtle line-clamp-2">
											{template.description}
										</span>
									</span>
								</span>
							</motion.button>
						);
					})}
				</BentoCarousel>
			</div>
			<AgentTemplatesDialog
				agents={DEMO_AGENT_TEMPLATES}
				open={browseOpen}
				onOpenChange={setBrowseOpen}
				onSelectAgent={() => setBrowseOpen(false)}
			/>
		</motion.section>
	);
}
