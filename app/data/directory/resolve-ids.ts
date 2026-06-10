/**
 * Pure, deterministic ingest utilities shared by template-driven and free-text
 * agent generation. Two jobs:
 *
 *   1. Sanitize/repair catalog ids that an LLM (or a stale template) returns —
 *      keep exact hits, fuzzy-repair near-misses to the nearest real catalog id,
 *      drop anything with no plausible match. See {@link resolveCatalogIds}.
 *   2. Extract / repair `@[category:id]` mention tokens embedded in an
 *      instructions markdown string. See {@link extractInstructionTokens} and
 *      {@link repairInstructionTokens}.
 *
 * No React, no editor deps — this module is safe to `require()` under
 * `node --test` (via the esbuild harness) and to import from any layer.
 */

import {
	DEFAULT_KNOWLEDGE_APPS,
	DEFAULT_SKILLS,
	DEMO_SESSION_TOOLS,
	DEMO_TOOLS,
	DIRECTORY_APPS,
	ROVO_AGENT_PROFILES,
} from "@/app/data/directory";

/**
 * The mention categories the ingest layer understands. `app` is the umbrella
 * over tools + knowledge (single-id, e.g. `@[app:jira]`); `tool`/`knowledge`
 * remain so legacy tokens and the underlying facet arrays still resolve.
 */
export type CatalogCategory = "tool" | "skill" | "knowledge" | "subagent" | "app";

/** A parsed mention token, e.g. `@[tool:jira]` → `{ category: "tool", id: "jira" }`. */
export interface InstructionToken {
	category: CatalogCategory;
	id: string;
}

/** Result of repairing every mention token in an instructions string. */
export interface RepairedInstructions {
	/** The markdown with each token rewritten to its resolved id (or to plain text when dropped). */
	markdown: string;
	/** Resolved catalog ids accumulated per category, de-duped, first-seen order. */
	resolved: Record<CatalogCategory, string[]>;
}

/** A single catalog entry reduced to the fields the resolver indexes. */
interface CatalogEntry {
	id: string;
	name: string;
}

// --- Normalization ---------------------------------------------------------

/**
 * Folds a label/id to a comparable form: lowercase, with every run of
 * non-alphanumeric characters (spaces, hyphens, underscores, dots, etc.)
 * removed. So `"Jira Service Management"`, `"jira-service-management"`, and
 * `"jira_service_management"` all normalize to `jiraservicemanagement`, and
 * `"servicenowITSM"` → `servicenowitsm`.
 */
function normalize(value: string): string {
	return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/**
 * Splits a label/id into lowercase alphanumeric tokens, also breaking on
 * camelCase / digit boundaries. `"servicenowITSM"` → `["servicenow", "itsm"]`;
 * `"jira-cloud"` → `["jira", "cloud"]`; `"Jira Service Management"` →
 * `["jira", "service", "management"]`.
 */
function tokenize(value: string): string[] {
	return value
		// insert a break between a lowercase/digit and an uppercase run (camelCase)
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		// and between an uppercase run and a following Capitalized word (ITSMfoo)
		.replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
		.toLowerCase()
		.split(/[^a-z0-9]+/)
		.filter(Boolean);
}

// --- Scoring ---------------------------------------------------------------

/**
 * Deterministic similarity score in [0, 1] between an input string and a
 * candidate catalog entry's id+name. Higher is closer. The score is the max of
 * three complementary signals so different kinds of near-miss all surface:
 *
 *   - **Normalized containment** — after folding away case/separators, one
 *     string is a prefix or substring of the other. Covers `"jira-cloud"`
 *     (norm `jiracloud`) vs `"jira"` and `"servicenowITSM"` vs `"servicenow"`.
 *     Scaled by the length ratio of the shorter to the longer so a tiny query
 *     can't perfectly match a much longer id.
 *   - **Token overlap (Jaccard)** — shared whole tokens / union of tokens.
 *     Covers reordering and partial token matches.
 *   - **Levenshtein ratio** — `1 - dist/maxLen` on the normalized forms; catches
 *     typos and pluralization the other two miss.
 */
function similarity(inputNorm: string, inputTokens: string[], candidate: CatalogEntry): number {
	let best = 0;
	for (const field of [candidate.id, candidate.name]) {
		const candNorm = normalize(field);
		if (!candNorm || !inputNorm) {
			continue;
		}

		// 1. Normalized containment, length-ratio weighted.
		let containment = 0;
		if (inputNorm === candNorm) {
			containment = 1;
		} else if (candNorm.startsWith(inputNorm) || inputNorm.startsWith(candNorm)) {
			const shorter = Math.min(inputNorm.length, candNorm.length);
			const longer = Math.max(inputNorm.length, candNorm.length);
			// Prefix match: weight by how much of the longer string is shared.
			containment = shorter / longer;
		} else if (candNorm.includes(inputNorm) || inputNorm.includes(candNorm)) {
			const shorter = Math.min(inputNorm.length, candNorm.length);
			const longer = Math.max(inputNorm.length, candNorm.length);
			// Interior substring is weaker than a shared prefix.
			containment = (shorter / longer) * 0.85;
		}

		// 2. Token overlap (Jaccard) over whole tokens.
		const candTokens = tokenize(field);
		const overlap = jaccard(inputTokens, candTokens);

		// 3. Levenshtein ratio on the normalized strings.
		const lev = levenshteinRatio(inputNorm, candNorm);

		best = Math.max(best, containment, overlap, lev);
	}
	return best;
}

/** Jaccard index (intersection / union) over two token lists, treated as sets. */
function jaccard(a: readonly string[], b: readonly string[]): number {
	if (a.length === 0 || b.length === 0) {
		return 0;
	}
	const setA = new Set(a);
	const setB = new Set(b);
	let intersection = 0;
	for (const token of setA) {
		if (setB.has(token)) {
			intersection += 1;
		}
	}
	const union = setA.size + setB.size - intersection;
	return union === 0 ? 0 : intersection / union;
}

/** `1 - editDistance/maxLen`, clamped to [0, 1]. */
function levenshteinRatio(a: string, b: string): number {
	const maxLen = Math.max(a.length, b.length);
	if (maxLen === 0) {
		return 1;
	}
	return 1 - levenshtein(a, b) / maxLen;
}

/** Classic two-row Levenshtein edit distance. */
function levenshtein(a: string, b: string): number {
	if (a === b) {
		return 0;
	}
	if (a.length === 0) {
		return b.length;
	}
	if (b.length === 0) {
		return a.length;
	}

	let prev = new Array<number>(b.length + 1);
	let curr = new Array<number>(b.length + 1);
	for (let j = 0; j <= b.length; j += 1) {
		prev[j] = j;
	}

	for (let i = 1; i <= a.length; i += 1) {
		curr[0] = i;
		for (let j = 1; j <= b.length; j += 1) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			curr[j] = Math.min(
				prev[j] + 1, // deletion
				curr[j - 1] + 1, // insertion
				prev[j - 1] + cost, // substitution
			);
		}
		[prev, curr] = [curr, prev];
	}
	return prev[b.length];
}

/**
 * Minimum similarity an input must reach against the nearest catalog entry to be
 * repaired rather than dropped. Tuned against real catalog data: it admits
 * `"jira-cloud"`→`"jira"` (containment 0.44 but token overlap 0.5) and
 * `"servicenowITSM"`→`"servicenow"` (containment 0.71), while rejecting unrelated
 * junk like `"totallymadeup"` (best signal well under 0.4).
 */
const MATCH_THRESHOLD = 0.5;

// --- Catalog indices -------------------------------------------------------

/** Lazily-built id+name index per category, so each is constructed at most once. */
const categoryIndexCache = new Map<CatalogCategory, readonly CatalogEntry[]>();

function buildIndex(category: CatalogCategory): readonly CatalogEntry[] {
	const cached = categoryIndexCache.get(category);
	if (cached) {
		return cached;
	}

	let source: readonly CatalogEntry[];
	switch (category) {
		case "tool":
			source = [...DEMO_TOOLS, ...DEMO_SESSION_TOOLS].map((t) => ({ id: t.id, name: t.name }));
			break;
		case "skill":
			source = DEFAULT_SKILLS.map((s) => ({ id: s.id, name: s.name }));
			break;
		case "knowledge": {
			// Knowledge mentions are addressed two-segment as `<appId>:<contentId>`
			// (matching the editor palette's `knowledge:<app>:<content>` ids), with a
			// synthetic `:all` entry per app. Names mirror what the knowledge dialog
			// writes into the config array ("<App> - all content" / the content name)
			// so resolved knowledge round-trips with user-added entries.
			const entries: CatalogEntry[] = [];
			for (const app of DEFAULT_KNOWLEDGE_APPS) {
				entries.push({ id: `${app.id}:all`, name: `${app.name} - all content` });
				for (const content of app.contents ?? []) {
					entries.push({ id: `${app.id}:${content.id}`, name: content.name });
				}
			}
			source = entries;
			break;
		}
		case "subagent":
			source = ROVO_AGENT_PROFILES.map((a) => ({ id: a.id, name: a.name }));
			break;
		case "app":
			// The unified apps catalog (tools ∪ knowledge-only), single-id like tools.
			source = DIRECTORY_APPS.map((a) => ({ id: a.id, name: a.name }));
			break;
	}

	categoryIndexCache.set(category, source);
	return source;
}

// --- Public API ------------------------------------------------------------

/**
 * Sanitizes a list of catalog ids for one category:
 *   - an id that is an exact catalog id is kept verbatim;
 *   - otherwise the nearest catalog entry by {@link similarity} is found, and if
 *     it clears {@link MATCH_THRESHOLD} the input is repaired to that entry's id;
 *   - inputs with no match above the threshold are dropped.
 *
 * The output is de-duplicated, preserving first-seen order of the *resolved*
 * ids (so an exact `"jira"` followed by a repaired `"jira-cloud"`→`"jira"`
 * yields a single `"jira"`).
 */
export function resolveCatalogIds(
	ids: readonly string[],
	category: CatalogCategory,
): string[] {
	const index = buildIndex(category);
	const exactIds = new Set(index.map((entry) => entry.id));

	const out: string[] = [];
	const seen = new Set<string>();

	for (const raw of ids) {
		if (typeof raw !== "string" || raw.length === 0) {
			continue;
		}

		let resolvedId: string | undefined;
		if (exactIds.has(raw)) {
			resolvedId = raw;
		} else {
			resolvedId = nearestId(raw, index);
		}

		if (resolvedId !== undefined && !seen.has(resolvedId)) {
			seen.add(resolvedId);
			out.push(resolvedId);
		}
	}

	return out;
}

/** Lazily-built id→name map per category, so the lookup is constructed at most once. */
const categoryNameCache = new Map<CatalogCategory, Map<string, string>>();

function nameIndex(category: CatalogCategory): Map<string, string> {
	let map = categoryNameCache.get(category);
	if (!map) {
		map = new Map(buildIndex(category).map((entry) => [entry.id, entry.name]));
		categoryNameCache.set(category, map);
	}
	return map;
}

/** The catalog display name for a resolved id, or `undefined` for an unknown id. */
export function catalogNameForId(category: CatalogCategory, id: string): string | undefined {
	return nameIndex(category).get(id);
}

/**
 * Like {@link resolveCatalogIds}, but returns each resolved entry's display NAME
 * instead of its id. The config field arrays (tools/skills/knowledge/subagents)
 * store display names — the same form the directory dialogs write and the chip
 * resolver looks up — whereas the instruction-body `@[category:id]` tokens stay
 * id-based. De-duplicated, first-seen order of the resolved names.
 */
export function resolveCatalogNames(
	values: readonly string[],
	category: CatalogCategory,
): string[] {
	const names = nameIndex(category);
	const out: string[] = [];
	const seen = new Set<string>();
	for (const id of resolveCatalogIds(values, category)) {
		const name = names.get(id) ?? id;
		if (!seen.has(name)) {
			seen.add(name);
			out.push(name);
		}
	}
	return out;
}

/** Finds the highest-scoring catalog id for `raw`, or `undefined` below threshold. */
function nearestId(raw: string, index: readonly CatalogEntry[]): string | undefined {
	const inputNorm = normalize(raw);
	const inputTokens = tokenize(raw);
	if (!inputNorm) {
		return undefined;
	}

	let bestId: string | undefined;
	let bestScore = 0;
	for (const entry of index) {
		const score = similarity(inputNorm, inputTokens, entry);
		// Strict `>` keeps the first (catalog-order) winner on ties — deterministic.
		if (score > bestScore) {
			bestScore = score;
			bestId = entry.id;
		}
	}

	return bestScore >= MATCH_THRESHOLD ? bestId : undefined;
}

/** The categories that may appear inside an `@[category:id]` token. */
const TOKEN_CATEGORIES: readonly CatalogCategory[] = ["tool", "skill", "knowledge", "subagent", "app"];

/**
 * Matches `@[category:id]` tokens. The category is constrained to the known set;
 * the id captures any run of non-`]` characters (catalog ids are kebab/alnum, but
 * we accept whatever is inside so a malformed id can still be repaired or
 * stripped rather than left dangling).
 */
const TOKEN_PATTERN = /@\[(tool|skill|knowledge|subagent|app):([^\]]+)\]/g;

/**
 * Matches markdown code regions whose contents must be treated as literal text,
 * not scanned for tokens: fenced blocks (``` / ~~~) and inline code spans. A
 * `@[tool:jira]` written inside a code example documents the syntax; it must not
 * be repaired or unioned into the agent's capabilities.
 */
const CODE_REGION_PATTERN = /```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`/g;

/**
 * Applies `transform` to every NON-code segment of `markdown`, leaving code
 * regions (fenced + inline) verbatim, and concatenates the result. Used so token
 * extraction/repair ignores tokens that live inside code.
 */
function mapOutsideCode(markdown: string, transform: (segment: string) => string): string {
	let result = "";
	let lastIndex = 0;
	for (const match of markdown.matchAll(CODE_REGION_PATTERN)) {
		const index = match.index ?? 0;
		result += transform(markdown.slice(lastIndex, index));
		result += match[0];
		lastIndex = index + match[0].length;
	}
	result += transform(markdown.slice(lastIndex));
	return result;
}

/**
 * Extracts every `@[category:id]` mention token from `markdown`, in document
 * order, ignoring tokens inside code regions. Does NOT resolve ids — callers that
 * want repair use {@link repairInstructionTokens}.
 */
export function extractInstructionTokens(markdown: string): InstructionToken[] {
	const tokens: InstructionToken[] = [];
	if (!markdown) {
		return tokens;
	}

	mapOutsideCode(markdown, (segment) => {
		for (const match of segment.matchAll(TOKEN_PATTERN)) {
			tokens.push({ category: match[1] as CatalogCategory, id: match[2] });
		}
		return segment;
	});

	return tokens;
}

/**
 * Repairs every mention token in `markdown`:
 *   - a token whose id fuzzy-resolves is rewritten to `@[category:<resolvedId>]`;
 *   - a token that resolves to nothing is replaced with plain label-ish text —
 *     the id's last `:`/`-`/`_`-delimited segment, de-kebabed and capitalized —
 *     so no broken token survives in the prose.
 *
 * Resolved ids are accumulated per category (de-duped, first-seen order) for the
 * ingest layer's body↔config union.
 */
export function repairInstructionTokens(markdown: string): RepairedInstructions {
	const resolved: Record<CatalogCategory, string[]> = {
		tool: [],
		skill: [],
		knowledge: [],
		subagent: [],
		app: [],
	};
	const seenPerCategory: Record<CatalogCategory, Set<string>> = {
		tool: new Set(),
		skill: new Set(),
		knowledge: new Set(),
		subagent: new Set(),
		app: new Set(),
	};

	if (!markdown) {
		return { markdown: "", resolved };
	}

	const repaired = mapOutsideCode(markdown, (segment) =>
		segment.replace(TOKEN_PATTERN, (_full, rawCategory: string, rawId: string) => {
			const category = rawCategory as CatalogCategory;
			// resolveCatalogIds applies the same exact-keep / fuzzy-repair / drop logic.
			const [resolvedId] = resolveCatalogIds([rawId], category);

			if (resolvedId === undefined) {
				// Dropped — leave readable plain text behind instead of a dead token.
				return dekebabLabel(rawId);
			}

			if (!seenPerCategory[category].has(resolvedId)) {
				seenPerCategory[category].add(resolvedId);
				resolved[category].push(resolvedId);
			}

			return `@[${category}:${resolvedId}]`;
		}),
	);

	return { markdown: repaired, resolved };
}

/**
 * Turns an id into human-ish plain text for the dropped-token fallback: takes the
 * last segment after any `:`, splits on `-`/`_`/whitespace, and Title-Cases it.
 * `"tool:jira-cloud"`-style ids never reach here (the category is stripped by the
 * pattern), but a bare `"made-up-thing"` → `"Made Up Thing"`.
 */
function dekebabLabel(id: string): string {
	const lastSegment = id.split(":").pop() ?? id;
	const words = lastSegment.split(/[-_\s]+/).filter(Boolean);
	if (words.length === 0) {
		return lastSegment;
	}
	return words
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

export { TOKEN_CATEGORIES };
