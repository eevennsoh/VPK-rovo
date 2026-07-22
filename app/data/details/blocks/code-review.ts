import type { ComponentDetail } from "@/app/data/component-detail-types";

export const CODE_REVIEW_DETAIL: ComponentDetail = {
	description:
		"A full-screen Rovo Canvas code-review surface with an editor artifact, split or stacked diffs powered by @pierre/diffs, and the shared Code Reviewer chat rail.",
	demoLayout: { previewHeight: "fixed", previewContentWidth: "full" },
	importStatement: `import {
  CodeReview,
  type CodeReviewProps,
} from "@/components/blocks/code-review";`,
	usage: `<CodeReview />

// Supply review-specific fixtures.
<CodeReview
  workItem={workItem}
  files={files}
  chatScript={chatScript}
/>`,
	props: [
		{
			name: "workItem",
			type: "CodeReviewWorkItem",
			default: "CODE_REVIEW_WORK_ITEM",
			description: "Work-item key, title, environment, repository, and branch metadata.",
		},
		{
			name: "files",
			type: "readonly ChangedFile[]",
			default: "CHANGED_FILES",
			description: "Changed files rendered in the editor diff surface.",
		},
		{
			name: "className",
			type: "string",
			description: "Extra classes merged onto the full-height block root.",
		},
	],
};
