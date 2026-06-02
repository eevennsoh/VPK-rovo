import type {
	RichTextMentionItem,
	RichTextMentionSources,
} from "@/components/ui-custom/rich-text-editor";

const SKILL_METADATA: readonly Pick<RichTextMentionItem, "label" | "description">[] = [
	{ label: "Summarize thread", description: "Condense the active conversation into decisions and next steps." },
	{ label: "Draft release notes", description: "Turn shipped changes into customer-facing release notes." },
	{ label: "Generate test plan", description: "Create focused validation steps for the current change." },
	{ label: "Review pull request", description: "Inspect a PR for risks, regressions, and missing coverage." },
	{ label: "Triage incident", description: "Organize incident facts, owners, impact, and follow-up work." },
	{ label: "Write status update", description: "Draft a concise project update with progress and blockers." },
	{ label: "Plan sprint", description: "Break goals into scoped sprint work and sequencing." },
	{ label: "Create runbook", description: "Document repeatable operational steps for a workflow." },
	{ label: "Analyze metrics", description: "Interpret trends and call out meaningful changes in data." },
	{ label: "Translate copy", description: "Adapt product copy for another language or locale." },
	{ label: "Refactor module", description: "Plan a safer cleanup path for a focused code area." },
	{ label: "Explain code", description: "Describe how a file or flow works in plain language." },
	{ label: "Generate diagram", description: "Create a diagram from architecture or process notes." },
	{ label: "Search docs", description: "Find relevant documentation for the current task." },
	{ label: "Schedule reminder", description: "Prepare a reminder with timing and follow-up context." },
	{ label: "Compose email", description: "Draft an email from notes, goals, and audience context." },
	{ label: "Estimate effort", description: "Size work by scope, uncertainty, and likely implementation steps." },
	{ label: "Audit dependencies", description: "Review package versions, risk, and update opportunities." },
	{ label: "Format data", description: "Clean and reshape structured data for reuse." },
	{ label: "Extract action items", description: "Pull owners, tasks, and dates from a source document." },
	{ label: "Build changelog", description: "Summarize notable changes into a chronological changelog." },
	{ label: "Draft PRD", description: "Turn a product idea into requirements and acceptance criteria." },
	{ label: "Label issues", description: "Suggest useful labels based on issue content." },
	{ label: "Summarize meeting", description: "Capture meeting outcomes, open questions, and follow-ups." },
];

function toSkillId(label: string): string {
	return `skill:${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

const SKILL_ITEMS: readonly RichTextMentionItem[] = SKILL_METADATA.map(({ description, label }) => ({
	category: "skill",
	description,
	id: toSkillId(label),
	label,
}));

/**
 * Skill catalog that drives the live editor's "/" Skills submenu and the
 * showcase's "Skills nested" card. The "@" mention targets and the other "/"
 * categories (tools/knowledge) come from the shared rich-text-editor
 * primitive's built-in defaults.
 */
export const EDITOR_PALETTE_MENTION_SOURCES: RichTextMentionSources = {
	skill: SKILL_ITEMS,
};
