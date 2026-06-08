/**
 * Repairs the catalog references on a generated agent before it becomes a
 * session entry. Pure + serializable (no React/editor deps) so it is unit
 * testable and shared by the single generation-ingest chokepoint.
 *
 * For each of tools/skills/knowledge/subagents it fuzzy-repairs the ids against
 * the real catalog (dropping no-matches), repairs the `@[category:id]` tokens in
 * the instructions body, and UNIONs the body-referenced ids into the matching
 * array — so a lozenge in the instructions always implies the item is on the
 * agent. Idempotent; an absent array stays absent (from-scratch agents untouched).
 */
import {
	type CatalogCategory,
	catalogNameForId,
	repairInstructionTokens,
	resolveCatalogNames,
} from "./resolve-ids";
import { isKnowledgeMode, isMemoryMode, isReasoningMode } from "./agent-modes";

const FIELD_BY_CATEGORY: Record<
	CatalogCategory,
	"tools" | "skills" | "knowledge" | "subagents"
> = {
	tool: "tools",
	skill: "skills",
	knowledge: "knowledge",
	subagent: "subagents",
};

// Upper bound per config array, matching the backend normalizer's caps
// (backend/lib/studio-agent-result.js): the body↔config union must not push an
// array past what the backend already enforced.
const MAX_ITEMS_BY_CATEGORY: Record<CatalogCategory, number> = {
	tool: 12,
	skill: 24,
	knowledge: 24,
	subagent: 24,
};

export interface AgentCatalogFields {
	tools?: readonly string[];
	skills?: readonly string[];
	knowledge?: readonly string[];
	subagents?: readonly string[];
	instructions?: string;
	memoryMode?: string;
	reasoningMode?: string;
	knowledgeMode?: string;
}

export interface RepairedAgentCatalog {
	tools?: string[];
	skills?: string[];
	knowledge?: string[];
	subagents?: string[];
	instructions?: string;
	memoryMode?: string;
	reasoningMode?: string;
	knowledgeMode?: string;
}

export function repairGeneratedAgentCatalog(
	fields: AgentCatalogFields,
): RepairedAgentCatalog {
	const instructions = typeof fields.instructions === "string" ? fields.instructions : "";
	const { markdown, resolved } = repairInstructionTokens(instructions);

	const out: RepairedAgentCatalog = {};

	for (const category of Object.keys(FIELD_BY_CATEGORY) as CatalogCategory[]) {
		const field = FIELD_BY_CATEGORY[category];
		const raw = fields[field];
		const hadField = Array.isArray(raw);
		const current = hadField ? [...(raw as readonly string[])] : [];
		// Config arrays store display NAMES (the form the directory dialogs write and
		// the chip resolver looks up); body @[category:id] tokens stay id-based. So
		// resolve the array to names, and map each body-referenced id to its name
		// before unioning — a body lozenge implies the item is on the agent.
		const arrayNames = resolveCatalogNames(current, category);
		const bodyNames = (resolved[category] ?? []).map(
			(id) => catalogNameForId(category, id) ?? id,
		);

		const union: string[] = [];
		const seen = new Set<string>();
		for (const name of [...arrayNames, ...bodyNames]) {
			if (!seen.has(name)) {
				seen.add(name);
				union.push(name);
			}
		}

		// Don't introduce an empty array on a field the result never carried, and
		// cap to the backend's per-category maximum so the union can't exceed it.
		if (union.length > 0 || hadField) {
			out[field] = union.slice(0, MAX_ITEMS_BY_CATEGORY[category]);
		}
	}

	if (typeof fields.instructions === "string") {
		out.instructions = markdown;
	}

	// Mode selectors: when present, keep a value only if it is in the allowed set,
	// otherwise emit `undefined` so the spread in the caller CLEARS the invalid
	// value (a plain omit would let the original invalid value survive the merge),
	// and the editor falls back to its default.
	if (fields.memoryMode !== undefined) {
		out.memoryMode = isMemoryMode(fields.memoryMode) ? fields.memoryMode : undefined;
	}
	if (fields.reasoningMode !== undefined) {
		out.reasoningMode = isReasoningMode(fields.reasoningMode) ? fields.reasoningMode : undefined;
	}
	if (fields.knowledgeMode !== undefined) {
		out.knowledgeMode = isKnowledgeMode(fields.knowledgeMode) ? fields.knowledgeMode : undefined;
	}

	return out;
}
