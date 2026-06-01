import type {
	RichTextMentionItem,
	RichTextMentionSources,
} from "@/components/ui-custom/rich-text-editor";

const SKILL_LABELS: readonly string[] = [
	"Summarize thread",
	"Draft release notes",
	"Generate test plan",
	"Review pull request",
	"Triage incident",
	"Write status update",
	"Plan sprint",
	"Create runbook",
	"Analyze metrics",
	"Translate copy",
	"Refactor module",
	"Explain code",
	"Generate diagram",
	"Search docs",
	"Schedule reminder",
	"Compose email",
	"Estimate effort",
	"Audit dependencies",
	"Format data",
	"Extract action items",
	"Build changelog",
	"Draft PRD",
	"Label issues",
	"Summarize meeting",
];

function toSkillId(label: string): string {
	return `skill:${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

const SKILL_ITEMS: readonly RichTextMentionItem[] = SKILL_LABELS.map((label) => ({
	category: "skill",
	id: toSkillId(label),
	label,
}));

export const EDITOR_PALETTE_MENTION_SOURCES: RichTextMentionSources = {
	skill: SKILL_ITEMS,
};
