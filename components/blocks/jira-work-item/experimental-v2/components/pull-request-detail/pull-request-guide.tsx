import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

import { ChatTimelineNavigator } from "@/components/blocks/chat-timeline";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CodeList } from "@/components/ui-custom/code-list";
import { token } from "@/lib/tokens";

import type { PullRequestGuidedReview } from "../../lib/pull-request-detail-data";

interface PullRequestGuideProps {
	onChapterReviewedChange: (chapterId: string, reviewed: boolean) => void;
	onFinish: () => void;
	review: PullRequestGuidedReview;
	reviewedChapterIds: ReadonlySet<string>;
	showFinishAction: boolean;
}

export function PullRequestGuide({
	onChapterReviewedChange,
	onFinish,
	review,
	reviewedChapterIds,
	showFinishAction,
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
		const observer = new IntersectionObserver(
			(entries) => {
				const visibleEntry = entries
					.filter((entry) => entry.isIntersecting)
					.sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
				if (!visibleEntry) return;
				const chapterId = visibleEntry.target.getAttribute("data-chapter-id");
				if (!chapterId) return;
				setActiveChapterId(chapterId);
				onChapterReviewedChange(chapterId, true);
			},
			{
				root: null,
				rootMargin: "-20% 0px -55%",
				threshold: [0.25, 0.4, 0.6],
			},
		);

		for (const section of Object.values(chapterRefs.current)) {
			if (section) observer.observe(section);
		}

		return () => observer.disconnect();
	}, [onChapterReviewedChange, review.chapters]);

	const chapter = review.chapters.find((item) => item.id === activeChapterId) ?? review.chapters[0];
	if (!chapter) return null;

	const activeStep = Math.max(0, review.chapters.findIndex((item) => item.id === chapter.id));
	const activeTimelineId = activeChapterId ?? chapter.id;
	const selectChapter = (chapterId: string) => {
		const chapterElement = chapterRefs.current[chapterId];
		setActiveChapterId(chapterId);
		onChapterReviewedChange(chapterId, true);
		chapterElement?.scrollIntoView({
			behavior: shouldReduceMotion ? "auto" : "smooth",
			block: "start",
		});
	};

	return (
		<div
			className="flex min-w-0 flex-col gap-6 px-2"
			data-jira-work-item-pull-request-guide
			data-jira-work-item-pull-request-guide-current-step={activeStep + 1}
		>
			<section
				aria-label="Guided review summary"
				data-jira-work-item-pull-request-guide-summary
			>
				<h2 className="text-base font-semibold text-text-subtlest">Summary</h2>
				<p
					className="mt-6 text-text"
					style={{
						font: token("font.heading.xlarge"),
						fontWeight: token("font.weight.regular"),
					}}
				>
					{review.summary.join(" ")}
				</p>
				<ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
					{[
						{ id: "risk", title: "Risk", ...review.metrics.risk },
						{ id: "impact", title: "Impact", ...review.metrics.impact },
						{ id: "reviewDepth", title: "Review depth", ...review.metrics.reviewDepth },
						{ id: "mergeConfidence", title: "Merge confidence", ...review.metrics.mergeConfidence },
					].map((metric) => (
						<li className="flex min-h-28 flex-col justify-between rounded-lg bg-surface-sunken p-3" key={metric.id}>
							<div>
								<p className="text-xs font-medium text-text-subtlest">{metric.title}</p>
								<p className="font-mono text-[2rem] leading-8 font-normal text-text">{metric.label}</p>
							</div>
							<div className="flex items-center gap-1 pt-2" role="presentation">
								{Array.from({ length: 5 }, (_, index) => (
									<span
										aria-hidden
										className={index < metric.filled ? "h-1.5 min-w-px flex-1 bg-icon" : "h-1.5 min-w-px flex-1 bg-icon-disabled"}
										key={`${metric.id}-${index}`}
									/>
								))}
							</div>
						</li>
					))}
				</ul>
			</section>
			<section aria-label="Guided review chapters" className="relative min-w-0 space-y-6">
				<div className="absolute -left-6 top-0 z-10">
					<ChatTimelineNavigator
						activeItemId={activeTimelineId}
						appearance="surface"
						items={timelineItems}
						onSelectItem={selectChapter}
					/>
				</div>
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
							<p className="text-xs font-semibold text-text-subtlest">
								{String(index + 1).padStart(2, "0")} / {String(review.chapters.length).padStart(2, "0")}
							</p>
							<div className="mt-1 flex items-start justify-between gap-4">
								<h3 className="min-w-0 text-text" style={{ font: token("font.heading.medium") }}>
									{item.title}
								</h3>
								<div className="flex shrink-0 items-center gap-2">
									<Checkbox
										checked={reviewed}
										id={checkboxId}
										onCheckedChange={(checked) => onChapterReviewedChange(item.id, checked === true)}
									/>
									<label className="cursor-pointer text-sm text-text-subtle" htmlFor={checkboxId}>
										Reviewed
									</label>
								</div>
							</div>
							<p className="mt-2 text-sm leading-6 text-text-subtle">{item.description}</p>
							<CodeList
								className="mt-5"
								defaultExpandedIds={[chapterFiles[0]?.id ?? ""]}
								items={chapterDiffs}
								summaryVerb="Review"
							/>
						</section>
					);
				})}
				{showFinishAction ? (
					<div className="flex justify-end">
						<Button onClick={onFinish} type="button">
							Finish
						</Button>
					</div>
				) : null}
			</section>
		</div>
	);
}
