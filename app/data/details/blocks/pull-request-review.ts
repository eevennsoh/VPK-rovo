import type { ComponentDetail } from "@/app/data/component-detail-types";

export const PULL_REQUEST_REVIEW_DETAIL: ComponentDetail = {
	description:
		'Pull request review composer with a compact and an expanded presentation. Compact is the single-row prompt bar (`[ + ] [ editor ] [ send ]`); expanded grows it into a review card with a "Review" heading, an "N/M Reviewed" badge, a dismiss control, and a Comment / Approve / Request changes verdict segmented control beside Send. Both presentations render the same composer subtree, so expanding preserves the caret and draft. Uncontrolled blocks expand when the composer takes focus; pass `variant` to drive it from a host.',
	importStatement: `import { PullRequestReview } from "@/components/blocks/pull-request-review";
import type { PullRequestReviewProps } from "@/components/blocks/pull-request-review";`,
	usage: `import { PullRequestReview } from "@/components/blocks/pull-request-review";

// Uncontrolled — compact at rest, expands on composer focus
<PullRequestReview
  reviewedCount={3}
  reviewedTotal={3}
  onSubmit={({ body, verdict }) => submitReview(verdict, body)}
/>

// Controlled presentation
<PullRequestReview
  variant={isReviewing ? "expanded" : "compact"}
  onVariantChange={setVariantFromBlock}
  onClose={() => setIsReviewing(false)}
  verdict={verdict}
  onVerdictChange={setVerdict}
  value={draft}
  onValueChange={setDraft}
/>`,
	demoLayout: {
		previewContentWidth: "full",
		examplesContentWidth: "full",
	},
	props: [
		{
			name: "variant",
			type: '"compact" | "expanded"',
			description:
				"Controlled presentation. Takes precedence over `expandOnFocus`, so a host that owns open/closed state can drive both directions.",
		},
		{
			name: "defaultVariant",
			type: '"compact" | "expanded"',
			default: '"compact"',
			description: "Initial presentation for an uncontrolled block.",
		},
		{
			name: "onVariantChange",
			type: '(variant: "compact" | "expanded") => void',
			description:
				"Called when the block changes presentation — focus expansion or the dismiss control.",
		},
		{
			name: "expandOnFocus",
			type: "boolean",
			default: "true",
			description:
				"Expand into the review card when the composer takes focus. Ignored while `variant` is controlled.",
		},
		{
			name: "title",
			type: "string",
			default: '"Review"',
			description: "Heading shown in the expanded card.",
		},
		{
			name: "reviewedCount",
			type: "number",
			description:
				'Files marked reviewed. Rendered with `reviewedTotal` as an "N/M Reviewed" badge; the badge is omitted when either is undefined.',
		},
		{
			name: "reviewedTotal",
			type: "number",
			description: "Total changed files in the review pass.",
		},
		{
			name: "placeholder",
			type: "string",
			default: '"Leave a comment..."',
			description: "Composer placeholder, also used as its accessible name.",
		},
		{
			name: "value",
			type: "string",
			description: "Controlled draft body. Prefer with `onValueChange`.",
		},
		{
			name: "defaultValue",
			type: "string",
			default: '""',
			description: "Initial draft for an uncontrolled composer.",
		},
		{
			name: "onValueChange",
			type: "(value: string) => void",
			description: "Called on every composer keystroke.",
		},
		{
			name: "verdict",
			type: '"comment" | "approve" | "request-changes"',
			description:
				"Controlled verdict selection in the segmented control. Prefer with `onVerdictChange`. Applies only while expanded — see `onSubmit`.",
		},
		{
			name: "defaultVerdict",
			type: '"comment" | "approve" | "request-changes"',
			default: '"comment"',
			description: "Uncontrolled verdict default.",
		},
		{
			name: "onVerdictChange",
			type: '(verdict: "comment" | "approve" | "request-changes") => void',
			description: "Called when a verdict is selected.",
		},
		{
			name: "onSubmit",
			type: "(submission: { body: string; verdict: PullRequestReviewVerdict }) => void",
			description:
				"Called with the trimmed body and the active verdict. Send stays disabled while the body is empty for every verdict. The verdict applies only while expanded — a compact composer shows no verdict control, so it always submits `comment` rather than a selection the reviewer can no longer see.",
		},
		{
			name: "onClose",
			type: "() => void",
			description:
				"Called when the expanded card's dismiss control is activated. The block also collapses to compact.",
		},
		{
			name: "onAddClick",
			type: "() => void",
			description: 'Called when the leading "+" control is activated.',
		},
		{
			name: "inputContext",
			type: "ReactNode",
			description:
				"One-turn context pills (e.g. a selected diff range) rendered above the editor, below the heading row.",
		},
	],
};
