import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CodeList } from "@/components/ui-custom/code-list";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

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
	const [currentStep, setCurrentStep] = useState(0);
	const [visitedChapterIds, setVisitedChapterIds] = useState<ReadonlySet<string>>(
		() => new Set(review.chapters[0] ? [review.chapters[0].id] : []),
	);
	const chapter = review.chapters[currentStep] ?? review.chapters[0];
	if (!chapter) return null;

	const chapterFiles = review.files.filter((file) => chapter.fileIds.includes(file.id));
	const chapterDiffs = chapterFiles.map((file) => ({ ...file, language: "diff" as const }));
	const isFirst = currentStep === 0;
	const isLast = currentStep === review.chapters.length - 1;
	const approvalEnabled = approvalState !== undefined;
	const approved = approvalState === "approved";
	const allChaptersVisited = review.chapters.every((item) => visitedChapterIds.has(item.id));
	const selectChapter = (index: number) => {
		const nextChapter = review.chapters[index];
		if (!nextChapter) return;
		setVisitedChapterIds((visited) => new Set(visited).add(nextChapter.id));
		setCurrentStep(index);
	};

	return (
		<div
			className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]"
			data-jira-work-item-pull-request-guide
			data-jira-work-item-pull-request-guide-current-step={currentStep + 1}
		>
			<nav aria-label="Guided review chapters">
				<ol className="space-y-1">
					{review.chapters.map((item, index) => (
						<li key={item.id}>
							<Button
								aria-current={index === currentStep ? "step" : undefined}
								className={cn(
									"h-auto w-full justify-start rounded-md px-3 py-2 text-left text-sm",
									index === currentStep
										? "bg-bg-selected text-text-selected"
										: "text-text-subtle hover:bg-bg-neutral-subtle-hovered",
								)}
								onClick={() => selectChapter(index)}
								type="button"
								variant="ghost"
							>
								<span className="min-w-0">
									<span className="block text-xs">Chapter {index + 1}</span>
									<span className="mt-0.5 block font-medium">{item.title}</span>
								</span>
							</Button>
						</li>
					))}
				</ol>
			</nav>
			<section aria-labelledby={`pull-request-guide-${chapter.id}`} className="min-w-0">
				<p className="text-xs font-semibold text-text-subtlest">
					{String(currentStep + 1).padStart(2, "0")} / {String(review.chapters.length).padStart(2, "0")}
				</p>
				<h2
					className="mt-1 text-text"
					id={`pull-request-guide-${chapter.id}`}
					style={{ font: token("font.heading.medium") }}
				>
					{chapter.title}
				</h2>
				<p className="mt-2 text-sm leading-6 text-text-subtle">{chapter.description}</p>
				<CodeList
					className="mt-5"
					defaultExpandedIds={[chapterFiles[0]?.id ?? ""]}
					items={chapterDiffs}
					summaryVerb="Review"
				/>
				<div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
					<Button
						disabled={isFirst}
						onClick={() => selectChapter(Math.max(0, currentStep - 1))}
						type="button"
						variant="ghost"
					>
						Back
					</Button>
					{isLast ? null : (
						<Button
							onClick={() => selectChapter(Math.min(review.chapters.length - 1, currentStep + 1))}
							type="button"
						>
							Next
						</Button>
					)}
					{approvalEnabled ? (
						<Button
							disabled={approved || !allChaptersVisited || !onApprove}
							onClick={onApprove}
							type="button"
						>
							{approved ? "Approved" : "Approve pull request"}
						</Button>
					) : isLast ? (
						<Button onClick={onFinish} type="button">
							Finish
						</Button>
					) : null}
				</div>
			</section>
		</div>
	);
}
