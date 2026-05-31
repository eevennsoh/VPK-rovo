"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import ChevronLeftIcon from "@atlaskit/icon/core/chevron-left";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import CrossIcon from "@atlaskit/icon/core/cross";

import {
	type AgentBrowserAgent,
	type AgentBrowserSidebarGroup,
} from "@/components/blocks/agent-browser";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import {
	CardDirectoryAgentExpanded,
	type CardDirectoryTemplateSkill,
} from "@/components/ui-custom/card-directory";
import { type TwgToolSource } from "@/components/ui-custom/twg-tool";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

/**
 * Carousel agents extend the shared `AgentBrowserAgent` identity with the richer
 * directory-card detail (`CardDirectoryAgentExpanded`) renders. Every detail field
 * is optional so plain `AgentBrowserAgent` data still satisfies the type — the card
 * derives a publisher from `byline` and falls back gracefully when detail is absent.
 */
export interface AgentTemplatesAgent extends AgentBrowserAgent {
	categoryId?: AgentTemplatesCategoryId;
	publisher?: string;
	verified?: boolean;
	capabilities?: readonly string[];
	sources?: ReadonlyArray<TwgToolSource>;
	skills?: ReadonlyArray<CardDirectoryTemplateSkill>;
	stats?: ReadonlyArray<{ value: string; label: string }>;
	collaborators?: ReadonlyArray<{ src: string; name: string }>;
	collaboratorOverflow?: number;
}
export type AgentTemplatesSidebarGroup = AgentBrowserSidebarGroup;

export interface AgentTemplatesDialogProps {
	agents: readonly AgentTemplatesAgent[];
	initialCategoryId?: AgentTemplatesCategoryId;
	onSelectAgent?: (agent: AgentTemplatesAgent) => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	sessionAgents?: readonly AgentTemplatesAgent[];
	sidebarGroups?: readonly AgentTemplatesSidebarGroup[];
	title?: string;
}

const EMPTY_AGENT_TEMPLATES_AGENTS: readonly AgentTemplatesAgent[] = [];
const AGENT_TEMPLATES_CARD_SCROLL_OFFSET = 376;
const AGENT_TEMPLATES_MAX_VISIBLE_AGENTS = 8;
const AGENT_TEMPLATES_SCROLL_EDGE_THRESHOLD = 2;
const AGENT_TEMPLATES_CAROUSEL_CONTROL_TRANSITION = {
	type: "spring",
	bounce: 0,
	visualDuration: 0.2,
} as const;
const AGENT_TEMPLATES_TAB_COPY_TRANSITION = {
	type: "spring",
	bounce: 0,
	visualDuration: 0.26,
} as const;
const AGENT_TEMPLATES_TAB_CARDS_TRANSITION = {
	type: "spring",
	bounce: 0,
	visualDuration: 0.3,
} as const;
const AGENT_TEMPLATES_TAB_COPY_INITIAL_OPACITY = 0.68;
const AGENT_TEMPLATES_TAB_CARDS_INITIAL_OPACITY = 0.9;
const AGENT_TEMPLATES_TAB_CARD_INITIAL_OPACITY = 0.82;
const AGENT_TEMPLATES_MODAL_CARD_ENTER_OFFSET = 32;
const AGENT_TEMPLATES_TAB_COPY_SWAP_OFFSET = 8;
const AGENT_TEMPLATES_TAB_CARDS_SWAP_OFFSET = 24;
const NOOP_TEMPLATE_MORE_ACTIONS = () => undefined;

export type AgentTemplatesCategoryId = "brainstorm" | "analyze" | "review" | "summarize" | "create";
type AgentTemplatesTabMotionDirection = 1 | -1;
type AgentTemplatesTabMotionCustom = {
	direction: AgentTemplatesTabMotionDirection;
	shouldReduceMotion: boolean;
};

type AgentTemplatesCategory = {
	id: AgentTemplatesCategoryId;
	label: string;
	iconClassName?: string;
	iconSrc: string;
	titleLines: readonly [string, string];
};

const RICH_ICON_ROOT = "/illustration/rich-icon";

const AGENT_TEMPLATES_CATEGORIES: readonly AgentTemplatesCategory[] = [
	{
		id: "brainstorm",
		label: "Planning",
		iconSrc: `${RICH_ICON_ROOT}/lightbulb/standard.svg`,
		iconClassName: "-translate-y-px scale-[1.08]",
		titleLines: ["Turn rough ideas into plans,", "and choose the next step."],
	},
	{
		id: "analyze",
		label: "Insights",
		iconSrc: `${RICH_ICON_ROOT}/marketing/standard.svg`,
		iconClassName: "scale-[1.08]",
		titleLines: ["Pull signal from context,", "and turn scattered data into decisions."],
	},
	{
		id: "review",
		label: "Operations",
		iconSrc: `${RICH_ICON_ROOT}/product-management/standard.svg`,
		iconClassName: "translate-x-0.5 -translate-y-0.5 scale-[1.14]",
		titleLines: ["Keep routines moving,", "and make follow-through easier to trust."],
	},
	{
		id: "summarize",
		label: "Writing",
		iconSrc: `${RICH_ICON_ROOT}/illustrations/standard.svg`,
		iconClassName: "-translate-y-px scale-[0.88]",
		titleLines: ["Draft, refine, and adapt writing,", "without losing the point."],
	},
	{
		id: "create",
		label: "Work management",
		iconSrc: `${RICH_ICON_ROOT}/project-management/standard.svg`,
		iconClassName: "scale-[1.08]",
		titleLines: ["Track the work that matters,", "and keep momentum visible."],
	},
] as const;

const EMPTY_CAPABILITIES: readonly string[] = [];
const AGENT_TEMPLATES_TAB_COPY_VARIANTS = {
	enter: ({ direction, shouldReduceMotion }: AgentTemplatesTabMotionCustom) => ({
		opacity: shouldReduceMotion ? 1 : AGENT_TEMPLATES_TAB_COPY_INITIAL_OPACITY,
		transform: shouldReduceMotion ? "translateX(0px)" : `translateX(${AGENT_TEMPLATES_TAB_COPY_SWAP_OFFSET * direction}px)`,
	}),
	center: {
		opacity: 1,
		transform: "translateX(0px)",
	},
} as const;
const AGENT_TEMPLATES_TAB_CARDS_VARIANTS = {
	enter: ({ direction, shouldReduceMotion }: AgentTemplatesTabMotionCustom) => ({
		opacity: shouldReduceMotion ? 1 : AGENT_TEMPLATES_TAB_CARDS_INITIAL_OPACITY,
		transform: shouldReduceMotion ? "translateX(0px)" : `translateX(${AGENT_TEMPLATES_TAB_CARDS_SWAP_OFFSET * direction}px)`,
	}),
	center: {
		opacity: 1,
		transform: "translateX(0px)",
	},
} as const;

/** Pull the publisher from a byline like "Customer feedback insights by Atlassian" → "Atlassian". */
function deriveAgentPublisher(byline: string): string {
	return byline.match(/\bby\s+(.+)$/iu)?.[1].trim() ?? byline;
}

function getAgentTemplatesCategoryIndex(categoryId: AgentTemplatesCategoryId): number {
	const categoryIndex = AGENT_TEMPLATES_CATEGORIES.findIndex((category) => category.id === categoryId);
	return categoryIndex >= 0 ? categoryIndex : 0;
}

export function AgentTemplatesDialog({
	agents,
	initialCategoryId = AGENT_TEMPLATES_CATEGORIES[0].id,
	onSelectAgent,
	open,
	onOpenChange,
	sessionAgents = EMPTY_AGENT_TEMPLATES_AGENTS,
	sidebarGroups,
	title,
}: Readonly<AgentTemplatesDialogProps>) {
	void sidebarGroups;

	const scrollRef = useRef<HTMLDivElement>(null);
	const previousOpenRef = useRef(false);
	const shouldReduceMotion = useReducedMotion();
	const [activeCategory, setActiveCategory] = useState(initialCategoryId);
	const [tabMotionDirection, setTabMotionDirection] = useState<AgentTemplatesTabMotionDirection>(1);
	const [scrollControls, setScrollControls] = useState({ canScrollLeft: false, canScrollRight: false });
	const shouldAnimateCardsFromLaunch = open && !previousOpenRef.current && !shouldReduceMotion;
	const activeCategoryOption = AGENT_TEMPLATES_CATEGORIES.find((category) => category.id === activeCategory) ?? AGENT_TEMPLATES_CATEGORIES[0];
	const tabMotionCustom = {
		direction: tabMotionDirection,
		shouldReduceMotion,
	};
	const allTemplateAgents = useMemo(
		() => [...agents, ...sessionAgents],
		[agents, sessionAgents],
	);
	const templateAgents = useMemo(() => {
		const categoryAgents = allTemplateAgents.filter((agent) => agent.categoryId === activeCategory);
		const visibleAgents = categoryAgents.length > 0 ? categoryAgents : allTemplateAgents;
		return visibleAgents.slice(0, AGENT_TEMPLATES_MAX_VISIBLE_AGENTS);
	}, [activeCategory, allTemplateAgents]);

	const updateScrollControls = useCallback(() => {
		const scrollElement = scrollRef.current;
		if (!scrollElement) {
			setScrollControls((currentControls) => (
				currentControls.canScrollLeft || currentControls.canScrollRight
					? { canScrollLeft: false, canScrollRight: false }
					: currentControls
			));
			return;
		}

		const maxScrollLeft = scrollElement.scrollWidth - scrollElement.clientWidth;
		const canScrollLeft = scrollElement.scrollLeft > AGENT_TEMPLATES_SCROLL_EDGE_THRESHOLD;
		const canScrollRight = scrollElement.scrollLeft < maxScrollLeft - AGENT_TEMPLATES_SCROLL_EDGE_THRESHOLD;

		setScrollControls((currentControls) => (
			currentControls.canScrollLeft === canScrollLeft && currentControls.canScrollRight === canScrollRight
				? currentControls
				: { canScrollLeft, canScrollRight }
		));
	}, []);

	const setCarouselRef = useCallback((scrollElement: HTMLDivElement | null) => {
		scrollRef.current = scrollElement;
		if (scrollElement) {
			window.requestAnimationFrame(updateScrollControls);
		}
	}, [updateScrollControls]);

	useEffect(() => {
		if (open) {
			setActiveCategory(initialCategoryId);
		}
	}, [initialCategoryId, open]);

	useEffect(() => {
		previousOpenRef.current = open;
	}, [open]);

	useEffect(() => {
		if (!open) {
			setScrollControls((currentControls) => (
				currentControls.canScrollLeft || currentControls.canScrollRight
					? { canScrollLeft: false, canScrollRight: false }
					: currentControls
			));
			return;
		}

		const scrollElement = scrollRef.current;
		if (!scrollElement) return;

		const animationFrameId = window.requestAnimationFrame(updateScrollControls);
		const resizeObserver = new ResizeObserver(updateScrollControls);
		resizeObserver.observe(scrollElement);

		return () => {
			window.cancelAnimationFrame(animationFrameId);
			resizeObserver.disconnect();
		};
	}, [open, templateAgents.length, updateScrollControls]);

	useEffect(() => {
		const scrollElement = scrollRef.current;
		if (!scrollElement) return;

		scrollElement.scrollTo({ left: 0 });
		window.requestAnimationFrame(updateScrollControls);
	}, [activeCategory, templateAgents.length, updateScrollControls]);

	const handleScrollBy = (direction: -1 | 1) => {
		const scrollElement = scrollRef.current;
		if (!scrollElement) return;

		const previousScrollLeft = scrollElement.scrollLeft;
		scrollElement.scrollBy({
			left: AGENT_TEMPLATES_CARD_SCROLL_OFFSET * direction,
			behavior: "smooth",
		});
		window.setTimeout(() => {
			if (scrollElement.scrollLeft !== previousScrollLeft) return;
			scrollElement.scrollBy({
				left: AGENT_TEMPLATES_CARD_SCROLL_OFFSET * direction,
			});
			updateScrollControls();
		}, 150);
	};

	const handleCategorySelect = (categoryId: AgentTemplatesCategoryId) => {
		if (categoryId === activeCategory) return;

		setTabMotionDirection(getAgentTemplatesCategoryIndex(categoryId) > getAgentTemplatesCategoryIndex(activeCategory) ? 1 : -1);
		setActiveCategory(categoryId);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="grid h-[min(725px,calc(100svh-2rem))] max-h-[calc(100svh-2rem)] w-[min(1248px,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-xl border border-border bg-surface p-0 shadow-xl sm:max-w-[1248px]"
				showCloseButton={false}
			>
				<header className="relative px-6 py-6">
					<div
						aria-label="Template categories"
						className="flex flex-wrap justify-start gap-2"
						role="group"
					>
						{AGENT_TEMPLATES_CATEGORIES.map((category) => (
							<AgentTemplatesCategoryButton
								active={activeCategory === category.id}
								category={category}
								key={category.id}
								onClick={() => handleCategorySelect(category.id)}
							/>
						))}
					</div>
					<DialogClose render={<Button aria-label="Close agent templates" className="absolute top-6 right-6 size-8 shrink-0" size="icon" variant="ghost" />}>
						<CrossIcon label="" />
					</DialogClose>
					<DialogTitle
						className="mt-6 text-text"
						style={{ font: token("font.heading.xlarge") }}
					>
						<motion.span
							animate="center"
							className="block"
							custom={tabMotionCustom}
							initial="enter"
							key={title ?? activeCategory}
							transition={AGENT_TEMPLATES_TAB_COPY_TRANSITION}
							variants={AGENT_TEMPLATES_TAB_COPY_VARIANTS}
						>
							{title ? (
								title
							) : (
								<>
									<span className="block">{activeCategoryOption.titleLines[0]}</span>
									<span className="block">{activeCategoryOption.titleLines[1]}</span>
								</>
							)}
						</motion.span>
					</DialogTitle>
				</header>

				<div className="relative min-h-0 overflow-hidden">
					<div
						aria-label="Agent templates"
						className="h-full overflow-x-auto overflow-y-hidden px-6 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
						data-agent-templates-carousel
						onScroll={updateScrollControls}
						ref={setCarouselRef}
					>
						<motion.div
							animate="center"
							className="flex h-full gap-4"
							custom={tabMotionCustom}
							initial="enter"
							key={activeCategory}
							transition={AGENT_TEMPLATES_TAB_CARDS_TRANSITION}
							variants={AGENT_TEMPLATES_TAB_CARDS_VARIANTS}
						>
							{templateAgents.map((agent) => (
								<motion.div
									animate={{ opacity: 1, transform: "translateX(0px)" }}
									className="h-full w-90 shrink-0"
									initial={{
										opacity: shouldReduceMotion ? 1 : AGENT_TEMPLATES_TAB_CARD_INITIAL_OPACITY,
										transform: shouldAnimateCardsFromLaunch ? `translateX(${AGENT_TEMPLATES_MODAL_CARD_ENTER_OFFSET}px)` : "translateX(0px)",
									}}
									key={agent.id}
									transition={AGENT_TEMPLATES_TAB_CARDS_TRANSITION}
								>
									<AgentTemplateCard
										agent={agent}
										onSelectAgent={onSelectAgent}
									/>
								</motion.div>
							))}
						</motion.div>
					</div>
					<AnimatePresence initial={false}>
						{scrollControls.canScrollLeft ? (
							<AgentTemplatesCarouselControl
								direction="previous"
								key="previous"
								onClick={() => handleScrollBy(-1)}
							/>
						) : null}
						{scrollControls.canScrollRight ? (
							<AgentTemplatesCarouselControl
								direction="next"
								key="next"
								onClick={() => handleScrollBy(1)}
							/>
						) : null}
					</AnimatePresence>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function AgentTemplatesCarouselControl({
	direction,
	onClick,
}: Readonly<{
	direction: "previous" | "next";
	onClick: () => void;
}>) {
	const isPrevious = direction === "previous";
	const hiddenTransform = `translateY(-50%) translateX(${isPrevious ? "-8px" : "8px"}) scale(0.96)`;

	return (
		<motion.div
			animate={{ opacity: 1, transform: "translateY(-50%) translateX(0px) scale(1)" }}
			className={cn(
				"absolute top-1/2 z-10",
				isPrevious ? "left-3" : "right-3",
			)}
			exit={{ opacity: 0, transform: hiddenTransform }}
			initial={{ opacity: 0, transform: hiddenTransform }}
			transition={AGENT_TEMPLATES_CAROUSEL_CONTROL_TRANSITION}
		>
			<Button
				aria-label={isPrevious ? "Show previous agent templates" : "Show next agent templates"}
				className="border-0 bg-surface-overlay text-icon-subtle opacity-100 hover:bg-surface-overlay-hovered active:bg-surface-overlay-pressed focus-visible:border-0"
				onClick={onClick}
				size="icon"
				style={{ boxShadow: token("elevation.shadow.overlay") }}
				type="button"
				variant="ghost"
			>
				<Icon
					className="pointer-events-none [&_*]:pointer-events-none"
					render={isPrevious ? <ChevronLeftIcon label="" color="currentColor" /> : <ChevronRightIcon label="" color="currentColor" />}
				/>
			</Button>
		</motion.div>
	);
}

function AgentTemplatesCategoryButton({
	active,
	category,
	onClick,
}: Readonly<{
	active: boolean;
	category: AgentTemplatesCategory;
	onClick: () => void;
}>) {
	return (
		<button
			aria-pressed={active}
			className={cn(
				"relative isolate inline-flex h-8 shrink-0 items-center overflow-hidden rounded-md border px-3 text-sm font-medium leading-5 outline-none transition-[border-color,color,box-shadow] duration-fast ease-out focus-visible:ring-3 focus-visible:ring-ring/50",
				active
					? "border-border-selected bg-bg-selected text-text-selected"
					: "border-border bg-background text-text-subtle hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed",
			)}
			onClick={onClick}
			type="button"
		>
			<span className="relative z-[2] inline-flex items-center gap-1.5">
				<span aria-hidden className="inline-flex size-6 shrink-0 items-center justify-center">
					<Image
						alt=""
						className={cn("size-6 object-contain", category.iconClassName)}
						height={24}
						src={category.iconSrc}
						width={24}
					/>
				</span>
				<span>{category.label}</span>
			</span>
		</button>
	);
}

function AgentTemplateCard({
	agent,
	onSelectAgent,
}: Readonly<{
	agent: AgentTemplatesAgent;
	onSelectAgent?: (agent: AgentTemplatesAgent) => void;
}>) {
	// The motion wrapper owns the fixed carousel width; the card fills that frame.
	return (
		<CardDirectoryAgentExpanded
			avatarSrc={agent.avatarSrc}
			capabilities={agent.capabilities ?? EMPTY_CAPABILITIES}
			className="h-full w-full"
			collaboratorOverflow={agent.collaboratorOverflow}
			collaborators={agent.collaborators}
			description={agent.description}
			name={agent.name}
			onMoreActions={NOOP_TEMPLATE_MORE_ACTIONS}
			onSelect={onSelectAgent ? () => onSelectAgent(agent) : undefined}
			publisher={agent.publisher ?? deriveAgentPublisher(agent.byline)}
			skills={agent.skills}
			sources={agent.sources}
			stats={agent.stats}
			verified={agent.verified}
		/>
	);
}
