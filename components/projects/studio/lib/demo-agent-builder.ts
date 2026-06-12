/**
 * Deterministic, scripted agent-builder for the `/studio` demo.
 *
 * The studio chat normally streams from a real model, which has no awareness of
 * the fake directory catalogs and so returns prose instead of a structured agent
 * for "add a trigger…" / "give it Jira" style prompts. This module replaces that
 * with a reliable, model-free responder: it classifies the prompt against the
 * existing catalogs and produces either a `Partial<agent-result>` patch (to merge
 * into the open agent) or a fresh `agent-result` (to create one). Every run is
 * identical — ideal for storytelling.
 *
 * Pure (no React/DOM). Reuses the real catalog machinery instead of duplicating
 * it: `resolveCatalogNames` (fuzzy id resolver), `repairGeneratedAgentCatalog`
 * (apps↔tools/knowledge facet reconciliation), and the trigger inference helpers.
 *
 * Two hard-won constraints shape the extraction:
 *  1. The fuzzy resolver false-positives on common words ("every"→Sentry,
 *     "friday"→Workday), so candidates are clause-scoped and intent-gated — never
 *     raw prompt words.
 *  2. In "send a Slack message every Friday 9am", "Slack" is the trigger's action
 *     destination, not a request to add the Slack app. Because a clause that IS a
 *     trigger never runs app extraction, the destination stays inside the trigger.
 */
import { DIRECTORY_APPS } from "@/app/data/directory/apps";
import { repairGeneratedAgentCatalog } from "@/app/data/directory/repair-agent-result";
import { resolveCatalogNames } from "@/app/data/directory/resolve-ids";
import {
	createAgentAutomationRule,
	createAgentTriggerValue,
	getAgentAutomationRuleLabel,
	inferScheduledEventId,
	inferTriggerDefinitions,
	type AgentAutomationRule,
	type AgentTriggerValue,
} from "@/components/blocks/triggers/data/trigger-catalog";
import type { RovoDataParts } from "@/lib/rovo-ui-messages";

type AgentResult = RovoDataParts["agent-result"];
type TriggerProviderId = Parameters<typeof createAgentTriggerValue>[0];

export type AgentBuildIntentKind =
	| "trigger"
	| "app"
	| "skill"
	| "subagent"
	| "starter"
	| "instructions"
	| "name";

interface TriggerSpec {
	providerId: TriggerProviderId;
	eventId: string;
	/** Fake automation instruction shown in the trigger rule builder. */
	prompt: string;
	/** Fake automation name shown in the trigger rule builder. */
	automationName: string;
}

export interface AgentBuildIntent {
	kinds: AgentBuildIntentKind[];
	isBuildIntent: boolean;
	triggerSpecs: TriggerSpec[];
	/** Canonical app names (the tools + knowledge umbrella). */
	appNames: string[];
	skillNames: string[];
	subagentNames: string[];
	/** Number of conversation starters to add (0 = none requested). */
	starterCount: number;
	/** Freeform behaviour/persona directive to append to instructions. */
	instructionText: string | null;
	/** New agent name when a rename was requested. */
	nameHint: string | null;
}

// ---------------------------------------------------------------------------
// Lexicon
// ---------------------------------------------------------------------------

/** A clause is a trigger when it names a trigger, an event, or a cadence. */
const TRIGGER_MARKER_RE =
	/\b(trigger|automation|when|whenever|every|each|daily|weekly|monthly|hourly|quarterly|annually|schedule|scheduled|cadence|remind|on (?:a )?(?:new |updated )?(?:jira|slack|github|gitlab|pull request|pr|push|incident|page|comment|issue))\b/i;

/** Recurring-cadence cue (drives the "scheduled" provider bias). */
const CADENCE_RE =
	/\b(?:every|each|daily|weekly|monthly|hourly|quarterly|annually|nightly)\b|\bat \d{1,2}(?::\d{2})?\s*(?:am|pm)\b|\bon (?:mon|tue|wed|thu|fri|sat|sun)/i;

/** Delivery verbs — "do X on a cadence" reads as a schedule, not an X-event. */
const DELIVERY_VERB_RE =
	/\b(send|post|share|deliver|notify|summari[sz]e|report|recap|remind|generate|compile|email|message|update)\b/i;

const APP_INTENT_RE =
	/\b(tool|tools|app|apps|integration|integrate|connect|connector|knowledge|source|sources|access|enable|hook up|give it|grant|provide|use|read from|pull from)\b/i;

const SKILL_MARKER_RE = /\bskills?\b/i;
const SUBAGENT_MARKER_RE = /\b(sub-?agents?|delegates?|helper agents?|child agents?)\b/i;
const STARTER_MARKER_RE =
	/\b(conversation starters?|starter prompts?|suggested prompts?|example questions?|starters?)\b/i;
const INSTRUCTION_MARKER_RE =
	/\b(instructions?|system prompt|persona|guidelines?|behave|act as|always|never|make sure|ensure)\b/i;

/**
 * Provider keywords that wouldn't match an app by its `name`/`id` alone:
 * abbreviations and alternate spellings. Each maps to a seed the fuzzy resolver
 * canonicalizes to the real app name. The bulk of the keyword table is derived
 * from {@link DIRECTORY_APPS} below — this is only for the gaps.
 */
const APP_KEYWORD_ALIASES: ReadonlyArray<readonly [RegExp, string]> = [
	[/\bgdrive\b/i, "google drive"],
	[/\bgoogle docs\b/i, "google drive"],
	[/\bms teams\b/i, "microsoft teams"],
	[/\bms office\b/i, "microsoft teams"],
	[/\bsharepoint\b/i, "microsoft sharepoint"],
	[/\bonedrive\b/i, "microsoft onedrive"],
	[/\bo365\b|\boffice 365\b/i, "microsoft outlook"],
	[/\bado\b/i, "azure devops"],
	[/\bso\b/i, "stack overflow"],
];

/**
 * Common English / ambiguous words that happen to equal (or fuzzy-match) a short
 * app name. Deriving keywords blindly from the catalog would make "box", "focus",
 * "guard", "goals", … trigger app additions inside ordinary sentences, so these
 * names are excluded from the derived table. (They can still be added explicitly
 * through the connector phrases or an alias.)
 */
const AMBIGUOUS_APP_NAMES = new Set([
	"atlassian", "atlassian home", "atlassian teams", "box", "focus", "guard",
	"goals", "projects", "analytics", "assets", "talent", "compass", "loom",
	"mural", "lucid", "aha", "dx", "monday.com", "outreach", "canva", "webex",
	"zoom",
]);

/** Shortest catalog name length allowed into the derived keyword table. */
const MIN_DERIVED_KEYWORD_LENGTH = 3;

/** Escapes a literal string for safe inclusion in a RegExp source. */
function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Word-boundary, case-insensitive keyword regexes derived from the live app
 * catalog, paired with the canonical app name (the seed the resolver echoes back).
 * Built once from {@link DIRECTORY_APPS} so apps added/renamed in the directory
 * are picked up automatically instead of silently drifting from a hardcoded list.
 * Ambiguous/short names are skipped to avoid false positives in plain prose.
 */
const DERIVED_APP_KEYWORDS: ReadonlyArray<readonly [RegExp, string]> = (() => {
	const out: Array<readonly [RegExp, string]> = [];
	const seenPhrases = new Set<string>();
	for (const app of DIRECTORY_APPS) {
		const phrases = [app.name, app.id.replace(/-+/g, " ")];
		for (const rawPhrase of phrases) {
			const phrase = rawPhrase.trim().toLowerCase();
			if (
				phrase.length < MIN_DERIVED_KEYWORD_LENGTH ||
				AMBIGUOUS_APP_NAMES.has(phrase) ||
				seenPhrases.has(phrase)
			) {
				continue;
			}
			seenPhrases.add(phrase);
			out.push([new RegExp(`\\b${escapeRegExp(phrase)}\\b`, "i"), app.name]);
		}
	}
	return out;
})();

/**
 * Curated + derived provider keywords → a seed the fuzzy resolver canonicalizes
 * to a real app name. Only consulted when a clause already shows app intent, so a
 * bare provider mention inside a trigger clause never leaks in.
 */
const KNOWN_APP_KEYWORDS: ReadonlyArray<readonly [RegExp, string]> = [
	...APP_KEYWORD_ALIASES,
	...DERIVED_APP_KEYWORDS,
];

/** Connector phrases whose captured object is an app/tool/knowledge name. */
const APP_CONNECTOR_RES: readonly RegExp[] = [
	/\b(?:give (?:it|the agent)|grant|provide)\s+(?:access to\s+)?(?:the\s+)?([a-z0-9][a-z0-9 ]*?)\s+(?:tool|app|integration|connector|access|knowledge|capabilit)/i,
	/\b(?:connect|integrate|integrate with|connect to|add|enable|hook up)\s+(?:the\s+)?([a-z0-9][a-z0-9 ]*?)\s+(?:tool|app|integration|connector|knowledge|source)/i,
	/\b(?:connect|integrate with|connect to)\s+(?:the\s+)?([a-z0-9][a-z0-9 ]+)$/i,
	/\b(?:use|access|read from|pull from|knowledge from|docs from|source from)\s+(?:the\s+)?([a-z0-9][a-z0-9 ]+)$/i,
];

const STOP_WORDS = new Set([
	"a", "an", "the", "to", "of", "for", "and", "or", "with", "about", "that",
	"this", "it", "its", "agent", "please", "can", "you", "me", "my", "our",
	"add", "set", "up", "give", "make", "create", "new", "some", "every",
	"trigger", "automation", "schedule", "scheduled",
]);

const NUMBER_WORDS: Readonly<Record<string, number>> = {
	one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
};

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function unique(values: readonly string[]): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const value of values) {
		const trimmed = value.trim();
		if (trimmed && !seen.has(trimmed)) {
			seen.add(trimmed);
			out.push(trimmed);
		}
	}
	return out;
}

function splitClauses(prompt: string): string[] {
	return prompt
		.split(/\band\b|\bthen\b|[,.;\n]/i)
		.map((clause) => clause.trim())
		.filter(Boolean);
}

function titleCase(value: string): string {
	return value
		.split(/\s+/)
		.filter(Boolean)
		.map((word) =>
			/^[a-z]/.test(word) ? word[0].toUpperCase() + word.slice(1) : word,
		)
		.join(" ");
}

function capitalizeSentence(value: string): string {
	const trimmed = value.trim().replace(/\s+/g, " ");
	if (!trimmed) {
		return "";
	}
	const sentence = trimmed[0].toUpperCase() + trimmed.slice(1);
	return /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
}

function significantWords(value: string, limit: number): string[] {
	return value
		.replace(/[^a-zA-Z0-9 ]/g, " ")
		.split(/\s+/)
		.filter((word) => word.length > 1 && !STOP_WORDS.has(word.toLowerCase()))
		.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Trigger derivation
// ---------------------------------------------------------------------------

/** Strips trigger scaffolding + trailing cadence to leave a believable instruction. */
function deriveTriggerInstruction(clause: string): string {
	let text = clause
		.replace(
			/^(?:add|create|set up|setup|configure|make|build)\s+(?:a|an)?\s*(?:scheduled\s+|recurring\s+|new\s+)?(?:trigger|automation|schedule)\s+(?:to|that|which|for|so it)?\s*/i,
			"",
		)
		.replace(/^(?:trigger|automation)\s*:?\s*/i, "")
		.replace(/^(?:when|whenever|every time)\s+/i, "")
		.replace(
			/\s*(?:,\s*)?(?:every|each)\b[\s\w]*?(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)?|morning|week|day|month|hour|quarter|friday|monday|tuesday|wednesday|thursday|saturday|sunday)\.?$/i,
			"",
		)
		.replace(/\s*(?:,\s*)?at \d{1,2}(?::\d{2})?\s*(?:am|pm)\.?$/i, "")
		.trim();
	if (!text) {
		text = clause.trim();
	}
	return capitalizeSentence(text);
}

function deriveAutomationName(instruction: string): string {
	const words = significantWords(instruction, 4);
	return words.length > 0 ? titleCase(words.join(" ")) : "Scheduled automation";
}

function deriveTriggerSpec(clause: string): TriggerSpec | null {
	const instruction = deriveTriggerInstruction(clause);
	const automationName = deriveAutomationName(instruction);

	const isScheduled =
		CADENCE_RE.test(clause) &&
		(DELIVERY_VERB_RE.test(clause) || /\b(schedule|scheduled|cadence|every|daily|weekly|monthly|hourly)\b/.test(clause));

	if (isScheduled) {
		const eventId = inferScheduledEventId(clause) ?? "custom-schedule";
		return { providerId: "scheduled", eventId, prompt: instruction, automationName };
	}

	const inferred = inferTriggerDefinitions([clause]);
	const first = inferred?.[0];
	if (!first) {
		return null;
	}
	return {
		providerId: first.providerId,
		eventId: first.eventId,
		prompt: instruction,
		automationName,
	};
}

// ---------------------------------------------------------------------------
// Component extraction (clause-scoped, intent-gated)
// ---------------------------------------------------------------------------

function extractAppNames(clause: string): string[] {
	if (!APP_INTENT_RE.test(clause)) {
		return [];
	}
	const seeds: string[] = [];
	for (const re of APP_CONNECTOR_RES) {
		const match = clause.match(re);
		if (match?.[1]) {
			seeds.push(match[1].trim());
		}
	}
	for (const [re, seed] of KNOWN_APP_KEYWORDS) {
		if (re.test(clause)) {
			seeds.push(seed);
		}
	}
	return seeds.length > 0 ? resolveCatalogNames(seeds, "app") : [];
}

/** Resolves a captured phrase to a catalog name, else keeps a title-cased literal. */
function resolveOrLiteral(phrases: readonly string[], category: "skill" | "subagent"): string[] {
	const out: string[] = [];
	for (const phrase of phrases) {
		const resolved = resolveCatalogNames([phrase], category);
		if (resolved.length > 0) {
			out.push(...resolved);
		} else {
			const literal = titleCase(phrase.trim());
			if (literal) {
				out.push(literal);
			}
		}
	}
	return out;
}

/**
 * Shared "<noun> before / after a marker" phrase extractor for skills and
 * subagents. Both categories follow the identical shape — a marker word with a
 * candidate phrase on either side — and differ only by their regexes and the
 * resolver category, so they share one implementation.
 */
function extractCatalogPhrases(
	clause: string,
	markerRe: RegExp,
	beforeRe: RegExp,
	afterRe: RegExp,
	category: "skill" | "subagent",
): string[] {
	if (!markerRe.test(clause)) {
		return [];
	}
	const phrases: string[] = [];
	const before = clause.match(beforeRe);
	if (before?.[1]) {
		phrases.push(before[1].trim());
	}
	const after = clause.match(afterRe);
	if (after?.[1]) {
		phrases.push(after[1].trim());
	}
	return phrases.length > 0 ? resolveOrLiteral(phrases, category) : [];
}

function extractSkillNames(clause: string): string[] {
	return extractCatalogPhrases(
		clause,
		SKILL_MARKER_RE,
		/(?:the\s+)?([a-z0-9][a-z0-9 ]*?)\s+skills?\b/i,
		/\bskills?\s+(?:to|for|called|named|that|like)?\s*([a-z0-9][a-z0-9 ]+)/i,
		"skill",
	);
}

function extractSubagentNames(clause: string): string[] {
	return extractCatalogPhrases(
		clause,
		SUBAGENT_MARKER_RE,
		/(?:the\s+)?([a-z0-9][a-z0-9 ]*?)\s+(?:sub-?agent|delegate|helper agent|child agent)/i,
		/(?:sub-?agent|delegate)\s+(?:to|for|called|named|that)?\s*([a-z0-9][a-z0-9 ]+)/i,
		"subagent",
	);
}

function extractStarterCount(clause: string): number {
	if (!STARTER_MARKER_RE.test(clause)) {
		return 0;
	}
	const digits = clause.match(/\b(\d+)\b/);
	if (digits) {
		return Math.min(6, Math.max(1, Number(digits[1])));
	}
	for (const [word, value] of Object.entries(NUMBER_WORDS)) {
		if (new RegExp(`\\b${word}\\b`, "i").test(clause)) {
			return value;
		}
	}
	return 3;
}

function extractNameHint(clause: string): string | null {
	const match = clause.match(
		/(?:rename(?: it)?(?: to)?|call it|name it|named|title it)\s+["']?([a-z0-9][a-z0-9 ]*?)["']?$/i,
	);
	return match?.[1] ? titleCase(match[1].trim()) : null;
}

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

export function classifyAgentBuildIntent(prompt: string): AgentBuildIntent {
	const triggerSpecs: TriggerSpec[] = [];
	const appNames: string[] = [];
	const skillNames: string[] = [];
	const subagentNames: string[] = [];
	let starterCount = 0;
	let instructionText: string | null = null;
	let nameHint: string | null = null;

	for (const clause of splitClauses(prompt)) {
		// A trigger clause owns its whole sentence — its action destination (e.g.
		// "Slack") must NOT also be extracted as an app.
		if (TRIGGER_MARKER_RE.test(clause)) {
			const spec = deriveTriggerSpec(clause);
			if (spec) {
				triggerSpecs.push(spec);
				continue;
			}
		}

		appNames.push(...extractAppNames(clause));
		skillNames.push(...extractSkillNames(clause));
		subagentNames.push(...extractSubagentNames(clause));

		const clauseStarters = extractStarterCount(clause);
		if (clauseStarters > 0) {
			starterCount += clauseStarters;
		}

		if (!nameHint) {
			nameHint = extractNameHint(clause);
		}

		if (!instructionText && INSTRUCTION_MARKER_RE.test(clause)) {
			instructionText = capitalizeSentence(clause);
		}
	}

	const dedupedApps = unique(appNames);
	const dedupedSkills = unique(skillNames);
	const dedupedSubagents = unique(subagentNames);

	const kinds: AgentBuildIntentKind[] = [];
	if (triggerSpecs.length > 0) kinds.push("trigger");
	if (dedupedApps.length > 0) kinds.push("app");
	if (dedupedSkills.length > 0) kinds.push("skill");
	if (dedupedSubagents.length > 0) kinds.push("subagent");
	if (starterCount > 0) kinds.push("starter");
	if (instructionText) kinds.push("instructions");
	if (nameHint) kinds.push("name");

	return {
		kinds,
		isBuildIntent: kinds.length > 0,
		triggerSpecs,
		appNames: dedupedApps,
		skillNames: dedupedSkills,
		subagentNames: dedupedSubagents,
		starterCount,
		instructionText,
		nameHint,
	};
}

// ---------------------------------------------------------------------------
// Patch + result builders
// ---------------------------------------------------------------------------

function generateStarters(prompt: string, count: number): string[] {
	const topic = significantWords(prompt, 3).map(titleCase).join(" ").trim();
	const pool = [
		topic ? `Help me with ${topic.toLowerCase()}` : "What can you help me with?",
		"Summarize the latest updates",
		"Draft an update for my team",
		"What should I focus on today?",
		"Show me what changed this week",
		"Create a quick report",
	];
	return pool.slice(0, Math.min(pool.length, Math.max(1, count)));
}

/**
 * Starting index for a new trigger of `providerId`+`eventId`: one past the
 * highest numeric suffix already used by existing triggers of that same
 * provider+event. createAgentTriggerValue stamps ids as
 * `${providerId}-${eventId}-${index}`, so deriving from the live max (rather than
 * `length + i`) keeps ids unique even after a middle trigger was removed.
 */
function nextTriggerIndex(
	existing: readonly AgentTriggerValue[],
	providerId: string,
	eventId: string,
): number {
	const prefix = `${providerId}-${eventId}-`;
	let maxIndex = 0;
	for (const def of existing) {
		if (typeof def.id === "string" && def.id.startsWith(prefix)) {
			const suffix = Number(def.id.slice(prefix.length));
			if (Number.isInteger(suffix) && suffix > maxIndex) {
				maxIndex = suffix;
			}
		}
	}
	return maxIndex + 1;
}

function nextAutomationRuleIndex(existing: readonly AgentAutomationRule[]): number {
	let maxIndex = 0;
	for (const rule of existing) {
		const match = /^automation-(\d+)$/u.exec(rule.id);
		const suffix = match ? Number(match[1]) : 0;
		if (Number.isInteger(suffix) && suffix > maxIndex) {
			maxIndex = suffix;
		}
	}
	return maxIndex + 1;
}

function serializeAutomationRuleLabels(rules: readonly AgentAutomationRule[]): string[] {
	return rules
		.map((rule, index) => getAgentAutomationRuleLabel(rule, index).trim())
		.filter(Boolean);
}

/**
 * Builds a `Partial<agent-result>` that MERGES the requested changes into the
 * open agent. Arrays are pre-unioned here because `updateSessionAgentDraft`
 * shallow-merges (it would otherwise replace them). Only keys for intents that
 * actually fired are included, so unrelated fields stay untouched.
 *
 * Pass a precomputed `intent` to reuse a single classification (the shared plan
 * path does this); when omitted it classifies the prompt itself so direct callers
 * and tests keep working unchanged.
 */
export function buildAgentUpdatePatch(
	prompt: string,
	currentDraft: Partial<AgentResult>,
	intent: AgentBuildIntent = classifyAgentBuildIntent(prompt),
): Partial<AgentResult> {
	const patch: Partial<AgentResult> = {};

	if (intent.triggerSpecs.length > 0) {
		const existingRules = currentDraft.automationRules ?? [];
		const existingTriggers = existingRules.flatMap((rule) => rule.triggers);
		// Ids must stay unique across the merged set even after middle triggers
		// were removed, so seed the counter past the highest existing suffix for
		// each provider+event and bump again on any residual collision.
		const usedIds = new Set(existingTriggers.map((def) => def.id));
		const addedRules: AgentAutomationRule[] = [];
		let automationRuleIndex = nextAutomationRuleIndex(existingRules);
		for (const spec of intent.triggerSpecs) {
			let index = nextTriggerIndex(existingTriggers, spec.providerId, spec.eventId);
			let value = createAgentTriggerValue(spec.providerId, spec.eventId, index);
			// createAgentTriggerValue can return null; skip those (preserves prior behavior).
			while (value && usedIds.has(value.id)) {
				index += 1;
				value = createAgentTriggerValue(spec.providerId, spec.eventId, index);
			}
			if (value) {
				usedIds.add(value.id);
				addedRules.push(
					createAgentAutomationRule({
						id: `automation-${automationRuleIndex}`,
						name: spec.automationName,
						prompt: spec.prompt,
						triggers: [value],
					}),
				);
				automationRuleIndex += 1;
			}
		}
		const merged = [...existingRules, ...addedRules];
		const labels = serializeAutomationRuleLabels(merged);
		patch.automationRules = merged;
		patch.triggers = labels;
		patch.trigger = labels[0] ?? "";
	}

	if (intent.appNames.length > 0) {
		const mergedApps = unique([...(currentDraft.apps ?? []), ...intent.appNames]);
		// reconcileApps rebuilds the tool + knowledge facets from app membership.
		const facets = repairGeneratedAgentCatalog({
			apps: mergedApps,
			tools: currentDraft.tools,
			knowledge: currentDraft.knowledge,
		});
		if (facets.apps) patch.apps = facets.apps;
		if (facets.tools) patch.tools = facets.tools;
		if (facets.knowledge) patch.knowledge = facets.knowledge;
	}

	if (intent.skillNames.length > 0) {
		patch.skills = unique([...(currentDraft.skills ?? []), ...intent.skillNames]);
	}

	if (intent.subagentNames.length > 0) {
		patch.subagents = unique([...(currentDraft.subagents ?? []), ...intent.subagentNames]);
	}

	if (intent.starterCount > 0) {
		patch.conversationStarters = unique([
			...(currentDraft.conversationStarters ?? []),
			...generateStarters(prompt, intent.starterCount),
		]);
	}

	if (intent.instructionText) {
		patch.instructions = [currentDraft.instructions, intent.instructionText]
			.map((part) => (part ?? "").trim())
			.filter(Boolean)
			.join("\n");
	}

	if (intent.nameHint) {
		patch.name = intent.nameHint;
	}

	return patch;
}

function deriveAgentName(prompt: string): string {
	const words = significantWords(prompt, 3).map(titleCase);
	return words.length > 0 ? `${words.join(" ")} agent` : "Untitled agent";
}

/**
 * Builds a believable fresh agent (`action: "create"`) from the prompt, including
 * any components it named. The shell's existing create path repairs/hydrates and
 * opens the config panel.
 *
 * Pass a precomputed `intent` to reuse a single classification; when omitted it
 * classifies the prompt itself (back-compat for direct callers and tests).
 */
export function buildAgentCreateResult(
	prompt: string,
	intent: AgentBuildIntent = classifyAgentBuildIntent(prompt),
): AgentResult {
	const name = intent.nameHint ?? deriveAgentName(prompt);
	const summary = capitalizeSentence(prompt) || `${name} for your team.`;

	const base: AgentResult = {
		action: "create",
		agentId: `demo-agent-${Date.now()}`,
		name,
		summary,
		description: summary,
		instructions:
			intent.instructionText ??
			capitalizeSentence(`You are ${name}. ${prompt}`),
		conversationStarters: generateStarters(prompt, 3),
	};

	// Reuse the merge logic over an empty draft so a create populates the same
	// components an update would (triggers, apps, skills, …). Reuse the same intent
	// so the catalogs are only classified once for the whole create.
	const patch = buildAgentUpdatePatch(prompt, base, intent);
	const conversationStarters =
		patch.conversationStarters && patch.conversationStarters.length >= 3
			? patch.conversationStarters
			: base.conversationStarters;

	return { ...base, ...patch, conversationStarters, action: "create" };
}

// ---------------------------------------------------------------------------
// Shared decision helper
// ---------------------------------------------------------------------------

export interface DeterministicAgentBuildOutcome {
	/** True when the prompt is a build intent the deterministic responder owns. */
	handled: boolean;
	mode: "update" | "none";
	/** Present when mode === "update": merge into the open agent's draft. */
	patch?: Partial<AgentResult>;
	/** Believable transcript reply (absent when not handled). */
	assistantReply?: string;
}

/**
 * Single decision point shared by every agent-edit interception seam. Classifies
 * the prompt once and returns what to do: update the open agent or fall through
 * to the model. New-agent creation must stay on the model-backed Studio flow so
 * the first turn can ask clarification questions before emitting an agent.
 */
export function planDeterministicAgentBuild(
	prompt: string,
	currentAgent: Partial<AgentResult> | null,
): DeterministicAgentBuildOutcome {
	const intent = classifyAgentBuildIntent(prompt);
	if (!intent.isBuildIntent || !currentAgent) {
		return { handled: false, mode: "none" };
	}

	const assistantReply = buildAssistantReplyText(intent, Boolean(currentAgent));
	return {
		handled: true,
		mode: "update",
		patch: buildAgentUpdatePatch(prompt, currentAgent, intent),
		assistantReply,
	};
}

const KIND_PHRASES: Record<AgentBuildIntentKind, string> = {
	trigger: "a trigger",
	app: "the connected apps",
	skill: "a skill",
	subagent: "a subagent",
	starter: "conversation starters",
	instructions: "the instructions",
	name: "the name",
};

/** Believable assistant reply for the transcript after applying a build intent. */
export function buildAssistantReplyText(intent: AgentBuildIntent, agentIsOpen: boolean): string {
	const parts: string[] = [];

	if (intent.triggerSpecs.length > 0) {
		const names = intent.triggerSpecs.map((spec) => spec.automationName);
		parts.push(`a "${names[0]}" trigger`);
	}
	if (intent.appNames.length > 0) {
		parts.push(`${intent.appNames.join(", ")} (tools + knowledge)`);
	}
	if (intent.skillNames.length > 0) {
		parts.push(`the ${intent.skillNames.join(", ")} skill${intent.skillNames.length > 1 ? "s" : ""}`);
	}
	if (intent.subagentNames.length > 0) {
		parts.push(`the ${intent.subagentNames.join(", ")} subagent${intent.subagentNames.length > 1 ? "s" : ""}`);
	}
	if (intent.starterCount > 0) {
		parts.push("new conversation starters");
	}
	if (intent.instructionText) {
		parts.push("updated instructions");
	}
	if (intent.nameHint) {
		parts.push(`renamed it to ${intent.nameHint}`);
	}

	const summary =
		parts.length > 0
			? parts.length === 1
				? parts[0]
				: `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`
			: intent.kinds.map((kind) => KIND_PHRASES[kind]).join(", ");

	return agentIsOpen
		? `Done — I added ${summary} to your agent. Review the changes in the config panel on the right, then publish when it looks right.`
		: `I've created a new agent with ${summary}. Open the config panel on the right to fine-tune and test it before publishing.`;
}
