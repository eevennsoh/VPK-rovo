"use client";

import { useState } from "react";

import { PullRequestReview } from "@/components/blocks/pull-request-review/components/pull-request-review";
import type {
	PullRequestReviewSubmission,
	PullRequestReviewVariant,
} from "@/components/blocks/pull-request-review/components/pull-request-review-types";
import { DEMO_PULL_REQUEST_REVIEW } from "@/components/blocks/pull-request-review/data/demo-pull-request-review";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { token } from "@/lib/tokens";

export default function PullRequestReviewPage() {
	const [variant, setVariant] = useState<PullRequestReviewVariant>("expanded");
	const [lastSubmission, setLastSubmission] =
		useState<PullRequestReviewSubmission | null>(null);

	return (
		<div className="h-full min-h-[360px] w-full overflow-y-auto bg-surface p-6 text-text">
			<div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
				<section className="flex flex-col gap-3">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<h2 style={{ font: token("font.heading.small") }}>Review</h2>
						<ToggleGroup
							aria-label="Pull request review variant"
							onValueChange={(values) => {
								const nextVariant = values[0] as
									| PullRequestReviewVariant
									| undefined;
								if (nextVariant) {
									setVariant(nextVariant);
								}
							}}
							value={[variant]}
							variant="outline"
						>
							<ToggleGroupItem value="expanded">Expanded</ToggleGroupItem>
							<ToggleGroupItem value="compact">Compact</ToggleGroupItem>
						</ToggleGroup>
					</div>
					<PullRequestReview
						{...DEMO_PULL_REQUEST_REVIEW}
						onClose={() => setVariant("compact")}
						onSubmit={setLastSubmission}
						onVariantChange={setVariant}
						variant={variant}
					/>
					<p aria-live="polite" className="text-sm text-text-subtle">
						{lastSubmission
							? `Submitted “${lastSubmission.verdict}”${lastSubmission.body ? `: ${lastSubmission.body}` : " with no comment"}`
							: "No review submitted yet."}
					</p>
				</section>

				<section className="flex flex-col gap-3">
					<h2 style={{ font: token("font.heading.small") }}>
						Transform on focus
					</h2>
					<p className="text-sm text-text-subtle">
						Uncontrolled. Starts as the compact prompt bar and grows into the
						review card when the composer takes focus; the dismiss control
						collapses it again.
					</p>
					<PullRequestReview {...DEMO_PULL_REQUEST_REVIEW} />
				</section>

				<section className="flex flex-col gap-3">
					<h2 style={{ font: token("font.heading.small") }}>
						Without reviewed progress
					</h2>
					<p className="text-sm text-text-subtle">
						Omit <code>reviewedCount</code> / <code>reviewedTotal</code> and the
						lozenge drops out of the heading row.
					</p>
					<PullRequestReview
						defaultVariant="expanded"
						placeholder="Leave a comment..."
					/>
				</section>

				<section className="flex flex-col gap-3">
					<h2 style={{ font: token("font.heading.small") }}>
						Compact, no auto-expand
					</h2>
					<p className="text-sm text-text-subtle">
						<code>expandOnFocus=&#123;false&#125;</code> keeps the bar compact so
						a host surface can own the transform.
					</p>
					<PullRequestReview
						{...DEMO_PULL_REQUEST_REVIEW}
						expandOnFocus={false}
					/>
				</section>
			</div>
		</div>
	);
}

export { PullRequestReview } from "@/components/blocks/pull-request-review/components/pull-request-review";
export type {
	PullRequestReviewProps,
	PullRequestReviewSubmission,
	PullRequestReviewVariant,
	PullRequestReviewVerdict,
} from "@/components/blocks/pull-request-review/components/pull-request-review-types";
