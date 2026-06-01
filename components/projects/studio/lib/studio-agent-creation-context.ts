/**
 * Studio agent-creation context builders.
 *
 * These produce the hidden `contextDescription` blocks that ride on top of a
 * `creationMode: "agent"` chat submission (and its clarification continuations).
 * They tell the model to (1) understand the user's brief and any template it
 * started from, (2) run a focused clarification round via the existing
 * `ask_user_questions`/question-card flow before generating, and (3) emit a
 * single `AGENT_RESULT` marker once it has enough to build a high-quality agent.
 *
 * Extracted from `rovo-app-shell.tsx` so the prompt copy is unit-testable in
 * isolation — the shell module pulls in React/`motion` and cannot be required
 * from a `node:test` file, but this module has no runtime dependencies.
 */

/** A label-bearing entry. Apps, skills, and capabilities all share this shape. */
interface LabelledEntry {
	label: string;
}

/**
 * Minimal structural shape of a Browse-all template agent we read for
 * provenance. The real `AgentTemplatesAgent` is structurally assignable to this.
 */
interface TemplateAgentLike {
	name: string;
	description?: string;
	categoryId?: string;
	sources?: ReadonlyArray<LabelledEntry>;
	skills?: ReadonlyArray<LabelledEntry>;
	capabilities?: ReadonlyArray<LabelledEntry>;
}

/**
 * Minimal structural shape of a home-bento starter we read for provenance. The
 * real `HomeStarterTemplate` is structurally assignable to this.
 */
interface StarterTemplateLike {
	title: string;
	description?: string;
	hero?: {
		sources?: ReadonlyArray<LabelledEntry>;
		skills?: ReadonlyArray<LabelledEntry>;
	};
}

/**
 * Distilled, transport-friendly snapshot of the template a user started from.
 * Carries just the provenance the model needs to ask template-aware questions
 * and pre-fill sensible defaults — not the full UI agent object.
 */
export interface StudioCreationTemplateContext {
	name: string;
	category?: string;
	description?: string;
	apps?: string[];
	skills?: string[];
	capabilities?: string[];
}

// Shared so the initial-brief and clarification-continuation contexts request
// the exact same agent shape (now including tools/trigger/guardrail).
const REQUIRED_AGENT_PROFILE_FIELDS: readonly string[] = [
	"- agentId: stable kebab-case slug",
	"- name: short display name",
	'- byline: one-line tagline (e.g. "Generated agent")',
	"- description: 1–2 sentence summary of what the agent does",
	"- instructions: structured Markdown beginning with ## Instructions; use paragraphs, bullet lists with bold labels, and optional ## Knowledge, ## Triggers, and ## Validation sections",
	"- conversationStarters: 3 starter prompts (strings)",
	'- tools: array of tool/integration names the agent relies on (e.g. ["Jira", "Confluence"]); use [] when none apply',
	"- trigger: one line describing when the agent should act (omit when it is purely on-demand)",
	"- guardrail: one line describing what the agent must not do (omit when none apply)",
	"- avatarFallback: { initials: 2-letter shorthand derived from the name }",
	'- action: "create"',
];

const CLARIFICATION_DIMENSIONS =
	"Dimensions to cover (ask about whichever the brief and template context leave unclear): purpose & scope; target users; knowledge/data sources; tone & persona; key tasks & workflows; triggers (when the agent should act); tools/integrations (which apps it connects to); guardrails (what it must not do).";

const FENCE_RULE =
	"Do not wrap the marker, its JSON, or the surrounding response inside ``` fences (no ```markdown, ```json, or other fences around the result). Keep assistant prose brief.";

function dedupeLabels(entries: ReadonlyArray<LabelledEntry> | undefined): string[] | undefined {
	if (!entries || entries.length === 0) {
		return undefined;
	}

	const seen = new Set<string>();
	const labels: string[] = [];
	for (const entry of entries) {
		const label = entry.label?.trim();
		if (label && !seen.has(label)) {
			seen.add(label);
			labels.push(label);
		}
	}

	return labels.length > 0 ? labels : undefined;
}

/** Distil a Browse-all template agent into its creation-context provenance. */
export function buildCreationTemplateContextFromAgent(agent: TemplateAgentLike): StudioCreationTemplateContext {
	const description = agent.description?.trim();
	const apps = dedupeLabels(agent.sources);
	const skills = dedupeLabels(agent.skills);
	const capabilities = dedupeLabels(agent.capabilities);

	return {
		name: agent.name,
		...(agent.categoryId ? { category: agent.categoryId } : {}),
		...(description ? { description } : {}),
		...(apps ? { apps } : {}),
		...(skills ? { skills } : {}),
		...(capabilities ? { capabilities } : {}),
	};
}

/** Distil a home-bento starter into its creation-context provenance. */
export function buildCreationTemplateContextFromStarter(template: StarterTemplateLike): StudioCreationTemplateContext {
	const description = template.description?.trim();
	const apps = dedupeLabels(template.hero?.sources);
	const skills = dedupeLabels(template.hero?.skills);

	return {
		name: template.title,
		...(description ? { description } : {}),
		...(apps ? { apps } : {}),
		...(skills ? { skills } : {}),
	};
}

function formatTemplateContextBlock(template: StudioCreationTemplateContext): string[] {
	const lines = [
		"[Template context]",
		`This brief came from the "${template.name}" template. Treat its connected apps, skills, and capabilities as strong defaults — ask questions that confirm or adjust them rather than re-asking from scratch.`,
		`- Template: ${template.name}`,
	];

	if (template.category) {
		lines.push(`- Category: ${template.category}`);
	}
	if (template.description) {
		lines.push(`- Summary: ${template.description}`);
	}
	if (template.apps && template.apps.length > 0) {
		lines.push(`- Connected apps: ${template.apps.join(", ")}`);
	}
	if (template.skills && template.skills.length > 0) {
		lines.push(`- Skills: ${template.skills.join(", ")}`);
	}
	if (template.capabilities && template.capabilities.length > 0) {
		lines.push(`- Capabilities: ${template.capabilities.join(", ")}`);
	}

	lines.push("[End template context]");
	return lines;
}

export function buildStudioAgentCreationContext(
	originalBrief: string,
	template?: StudioCreationTemplateContext,
): string {
	return [
		"[Studio Agent Creation Request]",
		"Source: /studio prompt input.",
		"Surface: Studio home composer.",
		"Trigger: User submitted a free-form brief describing the agent they want to build.",
		"Original user brief:",
		originalBrief.trim(),
		...(template ? formatTemplateContextBlock(template) : []),
		"Clarification rule: Run ONE focused clarification round FIRST using the existing ask_user_questions/question-card flow — 2 to 4 targeted questions, each offering a few recommended options. Tailor every question to this specific brief and template context; never use a generic questionnaire. Skip the round only if the brief plus template context already specify every dimension below. You MAY run ONE additional adaptive round if essential details are still missing; never exceed 2 rounds, and do not invent a separate Q&A format.",
		CLARIFICATION_DIMENSIONS,
		"Required agent profile fields (infer from the brief, template context, and clarification answers):",
		...REQUIRED_AGENT_PROFILE_FIELDS,
		`Expected output: once you have enough to build a strong agent, create the agent profile and emit exactly one structured AGENT_RESULT marker on its own line OUTSIDE any code fence. ${FENCE_RULE}`,
		"[End Studio Agent Creation Request]",
	].join("\n");
}

export function buildStudioAgentCreationContinuationContext(template?: StudioCreationTemplateContext): string {
	return [
		"[Studio Agent Creation Request]",
		"Source: /studio prompt input clarification answer.",
		"Surface: Studio home composer.",
		"Trigger: The user has answered the clarification questions for the agent they want to build.",
		...(template ? formatTemplateContextBlock(template) : []),
		"Required agent profile fields (fill from the brief, template context, and clarification answers):",
		...REQUIRED_AGENT_PROFILE_FIELDS,
		"Clarification rule: If essential profile details are still missing, you may ask ONE more concise question-card round using the existing ask_user_questions flow (never exceed 2 rounds total). Otherwise, do not ask again.",
		`Expected output: otherwise, create the reusable custom agent now and emit exactly one structured AGENT_RESULT marker on its own line OUTSIDE any code fence. ${FENCE_RULE}`,
		"[End Studio Agent Creation Request]",
	].join("\n");
}
