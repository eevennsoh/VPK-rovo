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
import { DIRECTORY_APPS, type DirectoryApp } from "./apps";
import { isKnowledgeMode, isMemoryMode, isReasoningMode } from "./agent-modes";

const FIELD_BY_CATEGORY: Record<
	CatalogCategory,
	"tools" | "skills" | "knowledge" | "subagents" | "apps"
> = {
	tool: "tools",
	skill: "skills",
	knowledge: "knowledge",
	subagent: "subagents",
	app: "apps",
};

// Upper bound per config array, matching the backend normalizer's caps
// (backend/lib/studio-agent-result.js): the body↔config union must not push an
// array past what the backend already enforced.
const MAX_ITEMS_BY_CATEGORY: Record<CatalogCategory, number> = {
	tool: 12,
	skill: 24,
	knowledge: 24,
	subagent: 24,
	app: 24,
};

export interface AgentCatalogFields {
	tools?: readonly string[];
	skills?: readonly string[];
	knowledge?: readonly string[];
	subagents?: readonly string[];
	apps?: readonly string[];
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
	apps?: string[];
	instructions?: string;
	memoryMode?: string;
	reasoningMode?: string;
	knowledgeMode?: string;
}

/**
 * Lazily-built name indices over the unified apps catalog, used to reconcile the
 * canonical `apps[]` membership with the underlying `tools[]`/`knowledge[]` facet
 * arrays. Config arrays store display NAMES, so these are keyed by name.
 */
interface AppNameIndices {
	appByName: Map<string, DirectoryApp>;
	appIdByToolName: Map<string, string>;
	appIdByKnowledgeName: Map<string, string>;
}

let appNameIndicesCache: AppNameIndices | undefined;

function appNameIndices(): AppNameIndices {
	if (appNameIndicesCache) {
		return appNameIndicesCache;
	}

	const appByName = new Map<string, DirectoryApp>();
	const appIdByToolName = new Map<string, string>();
	const appIdByKnowledgeName = new Map<string, string>();

	for (const app of DIRECTORY_APPS) {
		appByName.set(app.name, app);
		if (app.hasToolFacet) {
			appIdByToolName.set(app.name, app.id);
		}
		if (app.hasKnowledgeFacet && app.knowledgeApp) {
			appIdByKnowledgeName.set(`${app.knowledgeApp.name} - all content`, app.id);
			for (const content of app.knowledgeApp.contents ?? []) {
				appIdByKnowledgeName.set(content.name, app.id);
			}
		}
	}

	appNameIndicesCache = { appByName, appIdByToolName, appIdByKnowledgeName };
	return appNameIndicesCache;
}

/**
 * Reconciles the canonical `apps[]` membership with the `tools[]`/`knowledge[]`
 * facet arrays (W4 of the apps-unification plan):
 *
 *   1. Expand EXPLICIT apps to facets — an app referenced as `@[app:id]` or in
 *      `apps[]` implies BOTH its facets, with knowledge defaulting to "all
 *      content" (unless that app already has a knowledge entry, so an existing
 *      custom selection is never clobbered). Apps merely DERIVED from a lone
 *      tool/knowledge facet are NOT expanded — the model's single-facet choice is
 *      respected (a `@[tool:jira]` stays tool-only).
 *   2. Derive apps membership from every facet entry (no further expansion).
 *
 * Mutates `out` in place, respecting the per-category caps. Leaves a from-scratch
 * agent (no facet/app content) untouched.
 */
function reconcileApps(out: RepairedAgentCatalog): void {
	const { appByName, appIdByToolName, appIdByKnowledgeName } = appNameIndices();

	const tools = new Set(out.tools ?? []);
	const knowledge = new Set(out.knowledge ?? []);
	// `out.apps` here is the EXPLICIT set: from fields.apps + @[app:id] body tokens.
	const apps = new Set(out.apps ?? []);

	const knowledgeAppIds = new Set<string>();
	for (const name of knowledge) {
		const id = appIdByKnowledgeName.get(name);
		if (id) {
			knowledgeAppIds.add(id);
		}
	}

	// 1. Expand only the explicit apps to facets (app = both; knowledge = all).
	for (const appName of [...apps]) {
		const app = appByName.get(appName);
		if (!app) {
			continue;
		}
		if (app.hasToolFacet) {
			tools.add(app.name);
		}
		if (app.hasKnowledgeFacet && app.knowledgeApp && !knowledgeAppIds.has(app.id)) {
			knowledge.add(`${app.knowledgeApp.name} - all content`);
			knowledgeAppIds.add(app.id);
		}
	}

	// 2. Derive apps membership from the facet arrays (no further expansion).
	for (const name of [...tools, ...knowledge]) {
		const id = appIdByToolName.get(name) ?? appIdByKnowledgeName.get(name);
		const app = id ? DIRECTORY_APPS.find((candidate) => candidate.id === id) : undefined;
		if (app) {
			apps.add(app.name);
		}
	}

	const cappedApps = [...apps].slice(0, MAX_ITEMS_BY_CATEGORY.app);
	if (cappedApps.length > 0) {
		out.apps = cappedApps;
	}
	const cappedTools = [...tools].slice(0, MAX_ITEMS_BY_CATEGORY.tool);
	if (cappedTools.length > 0) {
		out.tools = cappedTools;
	}
	const cappedKnowledge = [...knowledge].slice(0, MAX_ITEMS_BY_CATEGORY.knowledge);
	if (cappedKnowledge.length > 0) {
		out.knowledge = cappedKnowledge;
	}
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

	// Keep canonical apps[] in sync with the tools[]/knowledge[] facet arrays.
	reconcileApps(out);

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
