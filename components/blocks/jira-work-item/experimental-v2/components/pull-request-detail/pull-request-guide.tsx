import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

import { ChatTimelineNavigator } from "@/components/blocks/chat-timeline";
import { Button } from "@/components/ui/button";
import { CodeList } from "@/components/ui-custom/code-list";
import { token } from "@/lib/tokens";

import type { PullRequestGuidedReview } from "../../lib/pull-request-detail-data";

interface PullRequestGuideProps {
	approvalState?: "available" | "approved";
	onApprove?: () => void;
	review: PullRequestGuidedReview;
	onFinish: () => void;
}

export function PullRequestGuide({
	approvalState,
	onApprove,
	review,
	onFinish,
}: Readonly<PullRequestGuideProps>) {
	const shouldReduceMotion = Boolean(useReducedMotion());
	const [activeChapterId, setActiveChapterId] = useState<string | null>(review.chapters[0]?.id ?? null);
	const [visitedChapterIds, setVisitedChapterIds] = useState<ReadonlySet<string>>(
		() => new Set(review.chapters[0] ? [review.chapters[0].id] : []),
	);
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
				setVisitedChapterIds((visited) => new Set(visited).add(chapterId));
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
	}, [review.chapters]);

	const chapter = review.chapters.find((item) => item.id === activeChapterId) ?? review.chapters[0];
	if (!chapter) return null;

	const activeStep = Math.max(0, review.chapters.findIndex((item) => item.id === chapter.id));
	const activeTimelineId = activeChapterId ?? chapter.id;
	const approvalEnabled = approvalState !== undefined;
	const approved = approvalState === "approved";
	const allChaptersVisited = review.chapters.every((item) => visitedChapterIds.has(item.id));

	const selectChapter = (chapterId: string) => {
		const chapterElement = chapterRefs.current[chapterId];
		setActiveChapterId(chapterId);
		setVisitedChapterIds((visited) => new Set(visited).add(chapterId));
		chapterElement?.scrollIntoView({
			behavior: shouldReduceMotion ? "auto" : "smooth",
			block: "start",
		});
	};

	return (
		<div
			className="flex min-w-0 flex-col gap-6"
			data-jira-work-item-pull-request-guide
			data-jira-work-item-pull-request-guide-current-step={activeStep + 1}
		>
			<section
				aria-label="Guided review summary"
				className="rounded-xl border border-border bg-bg-neutral-subtle p-4"
				data-jira-work-item-pull-request-guide-summary
			>
				<h2 className="text-base font-semibold text-text">Summary</h2>
				<p className="mt-2 text-sm leading-6 text-text-subtle">{review.summary.join(" ")}</p>
				<ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
					{[
						{ id: "risk", title: "Risk", ...review.metrics.risk },
						{ id: "impact", title: "Impact", ...review.metrics.impact },
						{ id: "reviewDepth", title: "Review depth", ...review.metrics.reviewDepth },
						{ id: "mergeConfidence", title: "Merge confidence", ...review.metrics.mergeConfidence },
					].map((metric) => (
						<li className="rounded-lg border border-border bg-surface p-3" key={metric.id}>
							<p className="text-xs font-medium text-text-subtle">{metric.title}</p>
							<p className="mt-1 text-sm font-semibold text-text">{metric.label}</p>
							<div className="mt-2 flex items-center gap-1" role="presentation">
								{Array.from({ length: 5 }, (_, index) => (
									<span
										aria-hidden
										className={index < metric.filled ? "h-1.5 w-6 rounded-full bg-icon" : "h-1.5 w-6 rounded-full bg-icon-disabled"}
										key={`${metric.id}-${index}`}
									/>
								))}
							</div>
						</li>
					))}
				</ul>
			</section>
			<div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
				<div className="hidden lg:sticky lg:top-4 lg:block lg:self-start">
					<ChatTimelineNavigator
						activeItemId={activeTimelineId}
						appearance="surface"
						items={timelineItems}
						onSelectItem={selectChapter}
					/>
				</div>
				<section aria-label="Guided review chapters" className="min-w-0 space-y-6">
					{review.chapters.map((item, index) => {
						const chapterFiles = review.files.filter((file) => item.fileIds.includes(file.id));
						const chapterDiffs = chapterFiles.map((file) => ({ ...file, language: "diff" as const }));
						const isActive = item.id === activeTimelineId;
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
								<div className={isActive ? "rounded-xl border border-border bg-bg-neutral-subtle p-4" : "rounded-xl border border-border bg-surface p-4"}>
									<p className="text-xs font-semibold text-text-subtlest">
										{String(index + 1).padStart(2, "0")} / {String(review.chapters.length).padStart(2, "0")}
									</p>
									<h3 className="mt-1 text-text" style={{ font: token("font.heading.medium") }}>
										{item.title}
									</h3>
									<p className="mt-2 text-sm leading-6 text-text-subtle">{item.description}</p>
									<CodeList
										className="mt-5"
										defaultExpandedIds={[chapterFiles[0]?.id ?? ""]}
										items={chapterDiffs}
										summaryVerb="Review"
									/>
								</div>
							</section>
						);
					})}
					<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						{approvalEnabled ? (
							<Button
								disabled={approved || !allChaptersVisited || !onApprove}
								onClick={onApprove}
								type="button"
							>
								{approved ? "Approved" : "Approve pull request"}
							</Button>
						) : (
							<Button onClick={onFinish} type="button">
								Finish
							</Button>
						)}
					</div>
				</section>
			</div>
		</div>
	);
}
