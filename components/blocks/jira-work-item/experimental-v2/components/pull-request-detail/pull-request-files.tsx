import { CodeReviewFileBrowser } from "@/components/blocks/code-review";

import type { PullRequestGuidedReview } from "../../lib/pull-request-detail-data";

export function PullRequestFiles({ review }: Readonly<{ review: PullRequestGuidedReview }>) {
	return (
		<section aria-label="Changed files">
			<CodeReviewFileBrowser
				className="h-96"
				defaultSelectedFileId={review.files[0]?.id}
				files={review.files}
				rootLabel="Guest checkout"
			/>
		</section>
	);
}
