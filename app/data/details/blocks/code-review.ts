import type { ComponentDetail } from "@/app/data/component-detail-types";

export const CODE_REVIEW_DETAIL: ComponentDetail = {
	description:
		"A full-screen agent code-review surface with summary and editor views, split or stacked diffs powered by @pierre/diffs, and a scripted Jira Coding Agent chat.",
	demoLayout: { previewHeight: "fixed", previewContentWidth: "full" },
	importStatement: `import {
  CodeReview,
  type CodeReviewProps,
} from "@/components/blocks/code-review";`,
	usage: `<CodeReview />

// Open directly in the code editor.
<CodeReview defaultScreen="editor" />

// Supply review-specific fixtures.
<CodeReview
  workItem={workItem}
  files={files}
  changeSets={changeSets}
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
			description: "Changed files rendered in the summary and editor diff surfaces.",
		},
		{
			name: "changeSets",
			type: "readonly ChangeSet[]",
			default: "CHANGE_SETS",
			description: "Named change groups used to filter the summary file list.",
		},
		{
			name: "chatScript",
			type: "ChatScript",
			default: "CHAT_SCRIPT",
			description: "Static agent copy for the intro, reasoning steps, summary, composer, and footer.",
		},
		{
			name: "defaultScreen",
			type: '"summary" | "editor"',
			default: '"summary"',
			description: "Initial screen shown when the block mounts.",
		},
		{
			name: "className",
			type: "string",
			description: "Extra classes merged onto the full-height block root.",
		},
	],
};
