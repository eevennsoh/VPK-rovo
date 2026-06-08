/**
 * Studio agent-creation context builders.
 *
 * These produce the hidden `contextDescription` blocks that ride on top of a
 * `creationMode: "agent"` chat submission (and its clarification continuations).
 * They tell the model to (1) understand the user's brief and any template it
 * started from, (2) run a focused clarification round via the existing
 * `ask_user_questions`/question-card flow before generating, and (3) emit a
 * single `AGENT_RESULT` marker once it has enough to build a high-quality agent
 * whose tools/skills/knowledge/subagents are REAL catalog ids and whose
 * instructions reference those ids inline as `@[category:id]` mention tokens.
 *
 * The catalog projection (see {@link buildCatalogProjection}) gives the model
 * the exact, scoped menu of ids it is allowed to choose from; the output
 * contract forces it to pick from that menu rather than invent free-form names.
 *
 * Extracted from `rovo-app-shell.tsx` so the prompt copy is unit-testable in
 * isolation — the shell module pulls in React/`motion`, but the catalog data
 * layer this now imports is bundled to CJS in tests via the directory test
 * harness, so this module stays requireable under `node --test`.
 */

import {
	DEFAULT_KNOWLEDGE_APPS,
	DEFAULT_SKILLS,
	DEMO_SESSION_TOOLS,
	DEMO_TOOLS,
	DIRECTORY_SUBAGENTS,
	getAgentTemplateConfigById,
} from "@/app/data/directory";
import { REASONING_MODE_VALUES } from "@/app/data/directory/agent-modes";

/**
 * Allowed `reasoningMode` values come from the canonical data-layer source
 * (`@/app/data/directory/agent-modes`), kept in lockstep with the agent editor's
 * `REASONING_MODE_SECTIONS`. The prompt copy enumerates them below.
 */

/** Max items listed per catalog group, keeping the projection prompt-compact. */
const PROJECTION_GROUP_LIMIT = 24;

/** A label-bearing entry. Apps, skills, and capabilities all share this shape. */
interface LabelledEntry {
	label: string;
}

/**
 * Minimal structural shape of a Browse-all template agent we read for
 * provenance. The real `AgentTemplatesAgent` is structurally assignable to this.
 */
interface TemplateAgentLike {
	id?: string;
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
	/**
	 * Real catalog ids this template binds, surfaced as strong defaults so the
	 * model reuses them verbatim. Populated by the agent-templates data layer
	 * (task #3); referenced defensively here so this module compiles before that
	 * lands.
	 */
	toolIds?: readonly string[];
	skillIds?: readonly string[];
	knowledgeIds?: readonly string[];
	subagentIds?: readonly string[];
	/**
	 * The template's instructions already tokenized with `@[category:id]` mention
	 * tokens — the model should adapt this body rather than rewrite from scratch.
	 */
	tokenizedBody?: string;
}

// Shared so the initial-brief and clarification-continuation contexts request
// the exact same agent shape (real catalog ids + tokenized instructions + the
// mode fields the agent editor persists).
const REQUIRED_AGENT_PROFILE_FIELDS: readonly string[] = [
	"- agentId: stable kebab-case slug",
	"- name: short display name",
	'- byline: one-line tagline (e.g. "Generated agent")',
	"- description: 1–2 sentence summary of what the agent does",
	"- instructions: structured Markdown beginning with ## Instructions; use paragraphs, bullet lists with bold labels, and optional ## Knowledge, ## Triggers, and ## Validation sections. Reference every chosen catalog item inline as an `@[category:id]` mention token — category is one of tool|skill|knowledge|subagent ONLY, and id MUST be one that appears in the [Catalog] projection AND in the matching array below.",
	'- tools: array of REAL tool ids drawn from the [Catalog] projection (e.g. ["jira", "confluence"]); use [] when none apply. Never invent ids or use display names.',
	"- skills: array of REAL skill ids drawn from the [Catalog] projection; use [] when none apply.",
	"- knowledge: array of REAL knowledge-app ids drawn from the [Catalog] projection; use [] when none apply.",
	"- subagents: array of REAL subagent ids drawn from the [Catalog] projection; use [] when none apply.",
	"- conversationStarters: 3 starter prompts (strings)",
	"- conversationStarterIcons: optional array (aligned with conversationStarters) of short icon keywords; omit when unsure",
	"- triggers: 0 to 3 short lines describing when the agent should act automatically; use [] when it is purely on-demand",
	'- guardrail: one line describing what the agent must not do (omit when none apply)',
	'- memoryMode: "on" or "off" — whether the agent retains memory across sessions',
	`- reasoningMode: one of ${REASONING_MODE_VALUES.map((value) => `"${value}"`).join(", ")} — match the agent editor's reasoning options`,
	'- knowledgeMode: "all", "custom", or "none" — which knowledge the agent may read',
	"- avatarFallback: { initials: 2-letter shorthand derived from the name }",
	'- action: "create"',
];

const CATALOG_SELECTION_RULE =
	"Catalog rule: tools, skills, knowledge, and subagents MUST be selected from the [Catalog] projection below using its exact ids. Do not invent ids, rename them, or use display names. Every `@[category:id]` token in the instructions must reuse an id you placed in the matching array. Leave an array empty rather than guessing.";

const CLARIFICATION_DIMENSIONS =
	"Dimensions to cover (ask about whichever the brief and template context leave unclear): purpose & scope; target users; knowledge/data sources; tone & persona; key tasks & workflows; triggers (when the agent should act); tools/integrations (which catalog tools, skills, knowledge, and subagents it connects to); guardrails (what it must not do).";

const FENCE_RULE =
	"Do not wrap the marker, its JSON, or the surrounding response inside ``` fences (no ```markdown, ```json, or other fences around the result). Keep assistant prose brief.";

/** One catalog item flattened to the fields the projection lists. */
interface ProjectionItem {
	id: string;
	name: string;
	descriptor: string;
	/** Present for tools/skills; absent (domain-neutral) for knowledge/subagents. */
	categoryId?: string;
}

/** Trim a free-form descriptor to at most `maxWords` words, single-spaced. */
function clampDescriptor(text: string | undefined, fallback: string, maxWords = 8): string {
	const source = text?.replace(/\s+/g, " ").trim();
	const words = (source && source.length > 0 ? source : fallback).split(" ");
	return words.length <= maxWords ? words.join(" ") : `${words.slice(0, maxWords).join(" ")}…`;
}

/**
 * Format one config group into stable `- <id>: <name> — <descriptor>` lines.
 * Items are filtered by `categoryIds` when provided (items without a
 * `categoryId` are treated as domain-neutral and always kept), de-duplicated by
 * id, sorted by id for deterministic output, and capped at
 * {@link PROJECTION_GROUP_LIMIT}.
 */
function formatProjectionGroup(
	heading: string,
	items: readonly ProjectionItem[],
	categoryIds: ReadonlySet<string> | undefined,
): string[] {
	const seen = new Set<string>();
	const kept: ProjectionItem[] = [];
	for (const item of items) {
		const id = item.id?.trim();
		if (!id || seen.has(id)) {
			continue;
		}
		if (categoryIds && item.categoryId && !categoryIds.has(item.categoryId)) {
			continue;
		}
		seen.add(id);
		kept.push(item);
	}

	kept.sort((a, b) => a.id.localeCompare(b.id));
	const bounded = kept.slice(0, PROJECTION_GROUP_LIMIT);

	const lines = [`${heading} (${bounded.length}${kept.length > bounded.length ? ` of ${kept.length}` : ""}):`];
	if (bounded.length === 0) {
		lines.push("- (none available)");
		return lines;
	}
	for (const item of bounded) {
		lines.push(`- ${item.id}: ${item.name} — ${item.descriptor}`);
	}
	return lines;
}

/**
 * The exact, deterministic menu of REAL catalog ids the model may choose from,
 * grouped by the four config categories (tools, skills, knowledge, subagents).
 *
 * When `categoryIds` is provided, tools and skills are scoped to those category
 * ids; knowledge apps and subagents carry no category in the data layer and are
 * treated as domain-neutral (always included). Output is stable (sorted by id)
 * and bounded per group, so it stays prompt-compact and diff-friendly.
 */
export function buildCatalogProjection(categoryIds?: readonly string[]): string {
	const scope =
		categoryIds && categoryIds.length > 0
			? new Set(categoryIds.map((id) => id.trim()).filter(Boolean))
			: undefined;

	const tools: ProjectionItem[] = [...DEMO_TOOLS, ...DEMO_SESSION_TOOLS].map((tool) => ({
		id: tool.id,
		name: tool.name,
		descriptor: clampDescriptor(tool.description ?? tool.byline, tool.name),
		categoryId: tool.categoryId,
	}));
	const skills: ProjectionItem[] = DEFAULT_SKILLS.map((skill) => ({
		id: skill.id,
		name: skill.name,
		descriptor: clampDescriptor(skill.description, skill.name),
		categoryId: skill.categoryId,
	}));
	const knowledge: ProjectionItem[] = DEFAULT_KNOWLEDGE_APPS.map((app) => ({
		// Knowledge is addressed two-segment (`<appId>:all`) to match the editor's
		// knowledge mention ids, so generated @[knowledge:<app>:all] tokens resolve
		// to lozenges and the unioned config entry round-trips with user-added ones.
		id: `${app.id}:all`,
		name: `${app.name} - all content`,
		descriptor: clampDescriptor(app.description, app.name),
	}));
	const subagents: ProjectionItem[] = DIRECTORY_SUBAGENTS.map((agent) => ({
		id: agent.id,
		name: agent.name,
		descriptor: clampDescriptor(agent.description ?? agent.byline, agent.name),
	}));

	return [
		"[Catalog]",
		scope
			? `Scoped to categories: ${[...scope].sort().join(", ")}. Choose ids ONLY from the lists below.`
			: "Full catalog. Choose ids ONLY from the lists below.",
		...formatProjectionGroup("tools", tools, scope),
		...formatProjectionGroup("skills", skills, scope),
		...formatProjectionGroup("knowledge", knowledge, scope),
		...formatProjectionGroup("subagents", subagents, scope),
		"[End Catalog]",
	].join("\n");
}

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
	// Pull the real catalog bindings + tokenized body from the centralized
	// template catalog (demo records preserve the config id 1:1). These are the
	// strongest defaults: they drive deriveTemplateCategoryIds (catalog scope) and
	// the bound-ids / tokenized-instructions block in formatTemplateContextBlock.
	const config = agent.id ? getAgentTemplateConfigById(agent.id) : undefined;
	const tokenizedBody = config?.instructionsBody?.trim();

	return {
		name: agent.name,
		...(agent.categoryId ? { category: agent.categoryId } : {}),
		...(description ? { description } : {}),
		...(apps ? { apps } : {}),
		...(skills ? { skills } : {}),
		...(capabilities ? { capabilities } : {}),
		...(config?.toolIds && config.toolIds.length > 0 ? { toolIds: config.toolIds } : {}),
		...(config?.skillIds && config.skillIds.length > 0 ? { skillIds: config.skillIds } : {}),
		...(config?.knowledgeIds && config.knowledgeIds.length > 0 ? { knowledgeIds: config.knowledgeIds } : {}),
		...(config?.subagentIds && config.subagentIds.length > 0 ? { subagentIds: config.subagentIds } : {}),
		...(tokenizedBody ? { tokenizedBody } : {}),
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

	// Bound catalog ids + tokenized body are added by the agent-templates data
	// layer (task #3). Reference them defensively so this compiles before that
	// lands; when present they are the strongest defaults — reuse these exact ids.
	const boundIds: string[] = [];
	if (template.toolIds && template.toolIds.length > 0) {
		boundIds.push(`tools=[${template.toolIds.join(", ")}]`);
	}
	if (template.skillIds && template.skillIds.length > 0) {
		boundIds.push(`skills=[${template.skillIds.join(", ")}]`);
	}
	if (template.knowledgeIds && template.knowledgeIds.length > 0) {
		boundIds.push(`knowledge=[${template.knowledgeIds.join(", ")}]`);
	}
	if (template.subagentIds && template.subagentIds.length > 0) {
		boundIds.push(`subagents=[${template.subagentIds.join(", ")}]`);
	}
	if (boundIds.length > 0) {
		lines.push(
			`- Bound catalog ids (reuse these exact ids in the matching arrays and as @[category:id] tokens): ${boundIds.join("; ")}`,
		);
	}
	if (template.tokenizedBody && template.tokenizedBody.trim().length > 0) {
		lines.push(
			"- Template instructions (already tokenized with @[category:id] mentions — adapt this rather than rewriting from scratch):",
			template.tokenizedBody.trim(),
		);
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
		// Full projection on the initial turn — no domain scope has been chosen yet.
		buildCatalogProjection(),
		"Clarification rule: ALWAYS run ONE focused clarification round FIRST using the existing ask_user_questions/question-card flow — 2 to 4 targeted questions, each offering a few recommended options. Tailor every question to this specific brief and template context; never use a generic questionnaire. Do not skip this round and do not build the agent yet on this turn.",
		CLARIFICATION_DIMENSIONS,
		"Required agent profile fields (gather via the clarification answers; do not finalize them yet):",
		...REQUIRED_AGENT_PROFILE_FIELDS,
		CATALOG_SELECTION_RULE,
		`Expected output for THIS turn: emit only the ask_user_questions question card. Do NOT emit an AGENT_RESULT marker before the user has answered — that happens on the next turn. ${FENCE_RULE}`,
		"[End Studio Agent Creation Request]",
	].join("\n");
}

export function buildStudioAgentCreationContinuationContext(
	template?: StudioCreationTemplateContext,
	opts?: { categoryIds?: readonly string[] },
): string {
	return [
		"[Studio Agent Creation Request]",
		"Source: /studio prompt input clarification answer.",
		"Surface: Studio home composer.",
		"Trigger: The user has answered the clarification questions for the agent they want to build.",
		...(template ? formatTemplateContextBlock(template) : []),
		// Scope the catalog to the categories surfaced by the clarification round
		// (when provided); otherwise fall back to the full catalog.
		buildCatalogProjection(opts?.categoryIds),
		"Required agent profile fields (fill from the brief, template context, and clarification answers):",
		...REQUIRED_AGENT_PROFILE_FIELDS,
		CATALOG_SELECTION_RULE,
		"Clarification rule: If essential profile details are still missing, you may ask ONE more concise question-card round using the existing ask_user_questions flow (never exceed 2 rounds total). Otherwise, do not ask again.",
		`Expected output: otherwise, create the reusable custom agent now and emit exactly one structured AGENT_RESULT marker on its own line OUTSIDE any code fence. ${FENCE_RULE}`,
		"[End Studio Agent Creation Request]",
	].join("\n");
}
