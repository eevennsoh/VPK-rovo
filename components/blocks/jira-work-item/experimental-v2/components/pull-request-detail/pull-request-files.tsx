import { CodeReview } from "@/components/blocks/code-review";
import type { CodeReviewCommit } from "@/components/blocks/code-review/data/types";
import type { InlineReviewComment } from "@/components/blocks/code-review/lib/inline-comments";

import type { PullRequestGuidedReview } from "../../lib/pull-request-detail-data";

export function PullRequestFiles({
	commits,
	onInlineCommentsChange,
	review,
}: Readonly<{
	commits?: readonly CodeReviewCommit[];
	onInlineCommentsChange?: (comments: readonly InlineReviewComment[]) => void;
	review: PullRequestGuidedReview;
}>) {
	return (
		<section aria-label="Changed files">
			<CodeReview
				commits={commits}
				defaultSelectedFileId={review.files[0]?.id}
				embedded
				expandContent
				explorerRootLabel="Guest checkout"
				files={review.files}
				onInlineCommentsChange={onInlineCommentsChange}
			/>
		</section>
	);
}
