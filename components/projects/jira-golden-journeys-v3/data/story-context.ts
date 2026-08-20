import type { WorkItemData } from "@/app/contexts/context-work-item-modal";
import type { JiraWorkItemState } from "@/components/blocks/jira-work-item/data/session-state";

import type { JiraGoldenJourneysV3StoryChapter } from "./story-model";

export const RAW_STORY_DESCRIPTION = [
	"Checkout-funnel research shows that mandatory account creation is a major source of abandonment for first-time shoppers.",
	"",
	"#### User outcome",
	"As a first-time shopper, I want to complete a purchase without creating an account so that I can place my order quickly.",
	"",
	"#### What we know",
	"- The guest path must work on desktop and mobile web.",
	"- Existing pricing, inventory, payment, and duplicate-order safeguards must remain in place.",
	"- Account creation should be optional after a successful purchase.",
	"",
	"#### Initial acceptance criteria",
	"1. An eligible shopper can choose to continue without signing in.",
	"2. A guest can provide delivery and payment details and place one order.",
	"3. Recoverable checkout errors do not force the shopper to start again.",
].join("\n");

export function createJiraGoldenJourneysV3StoryContextResources(
	chapter: JiraGoldenJourneysV3StoryChapter,
	workItem: WorkItemData,
): JiraWorkItemState["contextResources"] {
	const implementationComplete = chapter !== "terminal";
	return {
		title: workItem.title,
		description: workItem.description ?? "",
		tldr: [
			"Shoppers can complete a purchase without creating an account or signing in.",
			"The server owns pricing, inventory, payment-token validation, and idempotent order creation.",
			"PR #1847 must pass CI and receive approvals from Priya Narayanan and Jordan Lee before merge.",
		],
		nextSteps: [
			{
				id: "story-next-monitor-ci",
				label: "Monitor PR #1847",
				command: "Watch CI and address any actionable failures on PR #1847.",
			},
			{
				id: "story-next-request-review",
				label: "Request teammate approvals",
				command: "Request review from Priya Narayanan and Jordan Lee after CI is green.",
			},
		],
		attachments: [
			{
				id: "story-attachment-product-brief",
				name: "guest-checkout-product-brief",
				displayName: "Guest checkout product brief",
				ext: "pdf",
				date: "5 Aug 2026, 11:04 AM",
				thumbnailKind: "document",
				sourceLabel: "Product brief",
			},
		],
		subtasks: [
			{
				type: "Task",
				key: "SHOP-4822",
				summary: "Build guest checkout and order-creation API",
				priority: "high",
				assignee: "Priya Hansra",
				assigneeAvatarUrl: "/avatar-human/priya-hansra.png",
				status: implementationComplete ? "done" : "inprogress",
			},
			{
				type: "Story",
				key: "SHOP-4823",
				summary: "Build and integrate the storefront checkout flow",
				priority: "high",
				assignee: "Veronica Rodriguez",
				assigneeAvatarUrl: "/avatar-human/veronica-rodriguez.png",
				status: implementationComplete ? "done" : "inprogress",
			},
		],
		linkedItems: [
			{
				id: "story-link-research",
				key: "SHOP-4760",
				summary: "Research checkout abandonment and guest conversion",
				type: "Task",
				relationship: "relates to",
				assignee: "Anthony Chen",
				priority: "medium",
				status: "done",
			},
		],
	};
}
