import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useReducedMotion } from "motion/react";

import { ChatTimelineNavigator } from "@/components/blocks/chat-timeline";
import { Checkbox } from "@/components/ui/checkbox";
import { CodeList } from "@/components/ui-custom/code-list";
import { cn } from "@/lib/utils";

import type { PullRequestGuidedReview } from "../../lib/pull-request-detail-data";

interface PullRequestGuideProps {
	onChapterReviewedChange: (chapterId: string, reviewed: boolean) => void;
	review: PullRequestGuidedReview;
	reviewedChapterIds: ReadonlySet<string>;
	scrollContainerRef: RefObject<HTMLElement | null>;
}

type MetricBarPolarity = "higherIsBetter" | "lowerIsBetter";

const CHAPTER_SCROLL_GAP_PX = 24;

function buildChapterJumpTarget(
	scrollContainer: HTMLElement,
	chapterElement: HTMLElement,
): number {
	const scrollContainerRect = scrollContainer.getBoundingClientRect();
	const chapterRect = chapterElement.getBoundingClientRect();
	const stickyHeaderBottom = scrollContainer
		.querySelector<HTMLElement>("[data-jira-work-item-pull-request-detail-header]")
		?.getBoundingClientRect().bottom ?? scrollContainerRect.top;
	const targetTop =
		scrollContainer.scrollTop +
		(chapterRect.top - stickyHeaderBottom) -
		CHAPTER_SCROLL_GAP_PX;

	return Math.max(
		0,
		Math.min(targetTop, scrollContainer.scrollHeight - scrollContainer.clientHeight),
	);
}

/**
 * Filled segment color: chart semantic defaults (danger / warning / success).
 * - higherIsBetter (review depth, merge confidence): 1→danger, 2–3→warning, 4–5→success
 * - lowerIsBetter (risk, impact): 1→success, 2–3→warning, 4–5→danger
 */
function metricBarFillClass(filled: number, polarity: MetricBarPolarity): string {
	if (filled <= 0) return "bg-icon";
	if (polarity === "lowerIsBetter") {
		if (filled <= 1) return "bg-chart-success";
		if (filled <= 3) return "bg-chart-warning";
		return "bg-chart-danger";
	}
	if (filled <= 1) return "bg-chart-danger";
	if (filled <= 3) return "bg-chart-warning";
	return "bg-chart-success";
}

export function PullRequestGuide({
	onChapterReviewedChange,
	review,
	reviewedChapterIds,
	scrollContainerRef,
}: Readonly<PullRequestGuideProps>) {
	const shouldReduceMotion = Boolean(useReducedMotion());
	const [activeChapterId, setActiveChapterId] = useState<string | null>(review.chapters[0]?.id ?? null);
	const chapterRefs = useRef<Record<string, HTMLElement | null>>({});
	const timelineItems = useMemo(
		() => review.chapters.map((item, index) => ({
			id: item.id,
			label: `Chapter ${index + 1}`,
			text: item.title,
		})),
		[review.chapters],
	);

	useEffect(() => {
		const scrollContainer = scrollContainerRef.current;
		const stickyHeaderHeight = scrollContainer
			?.querySelector<HTMLElement>("[data-jira-work-item-pull-request-detail-header]")
			?.getBoundingClientRect().height ?? 0;
		// Scroll spy only updates the active chapter highlight — never reviewed state.
		const observer = new IntersectionObserver(
			(entries) => {
				const visibleEntry = entries
					.filter((entry) => entry.isIntersecting)
					.sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
				if (!visibleEntry) return;
				const chapterId = visibleEntry.target.getAttribute("data-chapter-id");
				if (!chapterId) return;
				setActiveChapterId(chapterId);
			},
			{
				root: scrollContainer,
				rootMargin: `-${stickyHeaderHeight + CHAPTER_SCROLL_GAP_PX}px 0px -20%`,
				threshold: [0.25, 0.4, 0.6],
			},
		);

		for (const section of Object.values(chapterRefs.current)) {
			if (section) observer.observe(section);
		}

		return () => observer.disconnect();
	}, [review.chapters, scrollContainerRef]);

	const chapter = review.chapters.find((item) => item.id === activeChapterId) ?? review.chapters[0];
	if (!chapter) return null;

	const activeStep = Math.max(0, review.chapters.findIndex((item) => item.id === chapter.id));
	const activeTimelineId = activeChapterId ?? chapter.id;
	const selectChapter = (chapterId: string) => {
		const chapterElement = chapterRefs.current[chapterId];
		const scrollContainer = scrollContainerRef.current;
		setActiveChapterId(chapterId);
		if (!chapterElement || !scrollContainer) return;
		scrollContainer.scrollTo({
			top: buildChapterJumpTarget(scrollContainer, chapterElement),
			behavior: shouldReduceMotion ? "auto" : "smooth",
		});
	};

	return (
		<div
			className="group/review-guide relative flex min-w-0 flex-col gap-12 px-2"
			data-jira-work-item-pull-request-guide
			data-jira-work-item-pull-request-guide-current-step={activeStep + 1}
		>
			{/* Full-column rail: available while either summary or chapters are in view. */}
			<div className="absolute inset-y-0 -left-8 z-10 flex w-8 justify-center overflow-visible">
				<ChatTimelineNavigator
					activeItemId={activeTimelineId}
					appearance="surface"
					className="pointer-events-none sticky top-1/2 h-fit -translate-y-1/2 self-start opacity-0 transition-opacity duration-normal ease-out motion-reduce:transition-none group-hover/review-guide:pointer-events-auto group-hover/review-guide:opacity-100 group-focus-within/review-guide:pointer-events-auto group-focus-within/review-guide:opacity-100"
					expandedOffsetClassName="pl-4"
					flyoutSide="right"
					itemOrder="chronological"
					items={timelineItems}
					onSelectItem={selectChapter}
				/>
			</div>
			<section
				aria-label="Guided review summary"
				data-jira-work-item-pull-request-guide-summary
			>
				<h2 className="p-0 text-xs font-semibold leading-4 text-text-subtlest">Summary</h2>
				<p className="mt-2 text-pretty text-sm leading-6 text-text">
					{review.summary.join(" ")}
				</p>
				<ul className="mt-6 grid grid-cols-4 gap-4">
					{[
						{ id: "risk", title: "Risk", polarity: "lowerIsBetter" as const, ...review.metrics.risk },
						{ id: "impact", title: "Impact", polarity: "lowerIsBetter" as const, ...review.metrics.impact },
						{ id: "reviewDepth", title: "Review depth", polarity: "higherIsBetter" as const, ...review.metrics.reviewDepth },
						{ id: "mergeConfidence", title: "Merge confidence", polarity: "higherIsBetter" as const, ...review.metrics.mergeConfidence },
					].map((metric) => (
						<li
							aria-label={`${metric.title}: ${metric.label}. ${metric.description}`}
							className="group/metric flex min-w-0 cursor-pointer flex-col rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focused"
							key={metric.id}
							tabIndex={0}
						>
							<p className="text-xs font-medium text-text-subtlest">{metric.title}</p>
							{/*
							 * Stack both states in one grid cell so the longest state reserves
							 * its full height before hover/focus. Visibility swaps do not reflow.
							 */}
							<div className="mt-3 grid">
								<div className="col-start-1 row-start-1 group-hover/metric:invisible group-focus-within/metric:invisible">
									<p
										aria-hidden
										className="font-mono text-xl leading-6 font-normal text-text"
									>
										{metric.label}
									</p>
									<div className="mt-3 flex w-full max-w-[120px] items-center gap-1" role="presentation">
										{Array.from({ length: 5 }, (_, index) => (
											<span
												aria-hidden
												className={cn(
													"h-1 min-w-px flex-1",
													index < metric.filled ? metricBarFillClass(metric.filled, metric.polarity) : "bg-bg-accent-gray-subtler",
												)}
												key={`${metric.id}-${index}`}
											/>
										))}
									</div>
								</div>
								<p
									aria-hidden
									className="invisible col-start-1 row-start-1 text-xs leading-4 font-normal text-text-subtle group-hover/metric:visible group-focus-within/metric:visible"
								>
									{metric.description}
								</p>
							</div>
						</li>
					))}
				</ul>
			</section>
			<section
				aria-label="Guided review chapters"
				className="relative min-w-0 space-y-12"
			>
				{review.chapters.map((item, index) => {
					const chapterFiles = review.files.filter((file) => item.fileIds.includes(file.id));
					const chapterDiffs = chapterFiles.map((file) => ({ ...file, language: "diff" as const }));
					const reviewed = reviewedChapterIds.has(item.id);
					const checkboxId = `pull-request-guide-${item.id}-reviewed`;
					return (
						<section
							className="scroll-mt-6"
							data-chapter-id={item.id}
							id={`pull-request-guide-${item.id}`}
							key={item.id}
							ref={(node) => {
								chapterRefs.current[item.id] = node;
							}}
						>
							{/*
							 * Order: step → · → Reviewed → checkbox (right). Parent gap-1.5
							 * owns the 6px gaps; label stays associated via htmlFor.
							 */}
							<div className="flex items-center gap-1.5">
								<span className="text-xs font-semibold leading-4 text-text-subtlest">
									{index + 1} / {review.chapters.length}
								</span>
								<span aria-hidden className="text-xs font-semibold leading-4 text-text-subtlest">
									·
								</span>
								<label
									className="cursor-pointer text-xs font-semibold leading-4 text-text-subtlest"
									htmlFor={checkboxId}
								>
									Reviewed
								</label>
								<Checkbox
									checked={reviewed}
									id={checkboxId}
									onCheckedChange={(checked) => onChapterReviewedChange(item.id, checked === true)}
								/>
							</div>
							<p className="mt-2 min-w-0 text-base font-medium text-text">
								{item.title}
							</p>
							<p className="mt-1 text-sm leading-6 text-text-subtle">{item.description}</p>
							<CodeList
								className="mt-5"
								hideSummary
								items={chapterDiffs}
							/>
						</section>
					);
				})}
			</section>
		</div>
	);
}
