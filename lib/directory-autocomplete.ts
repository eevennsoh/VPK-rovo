import type {
	RichTextMentionItem,
	RichTextMentionSources,
} from "@/components/ui-custom/rich-text-editor";

export const DIRECTORY_AUTOCOMPLETE_MIN_QUERY_LENGTH = 2;
export const DIRECTORY_AUTOCOMPLETE_LIMIT = 9;

export interface DirectoryAutocompleteMatch {
	mention: RichTextMentionItem;
	score: number;
	sourceIndex: number;
}

export interface DirectoryAutocompleteState {
	activeIndex: number;
	ghostText: string;
	matches: readonly DirectoryAutocompleteMatch[];
	query: string;
	queryFrom: number;
	queryTo: number;
}

export interface DirectoryAutocompleteInput {
	activeIndex?: number;
	cursorPosition: number;
	minQueryLength?: number;
	sources: RichTextMentionSources | undefined;
	textBeforeCursor: string;
}

export type DirectoryAutocompleteTraceTrigger = "plain" | "slash" | "mention";

export interface DirectoryAutocompleteExactLabelMatch {
	from: number;
	label: string;
	mention: RichTextMentionItem;
	sourceIndex: number;
	to: number;
	traceFrom: number;
	traceTo: number;
	trigger: DirectoryAutocompleteTraceTrigger;
}

export interface DirectoryAutocompleteExactLabelMatchInput {
	minLabelLength?: number;
	sources: RichTextMentionSources | undefined;
	suppressTrailingPrefixMatches?: boolean;
	text: string;
}

const PHRASE_BOUNDARY_PATTERN = /[\n.!?]/u;
const EXACT_LABEL_MIN_LENGTH = 3;
const BOUNDARY_PUNCTUATION = new Set([
	".",
	",",
	"!",
	"?",
	";",
	":",
	"(",
	")",
	"[",
	"]",
	"{",
	"}",
	'"',
	"'",
	"`",
	"“",
	"”",
	"‘",
	"’",
	"<",
	">",
	"-",
	"–",
	"—",
]);

function normalize(value: string): string {
	return value.trim().toLowerCase();
}

function getDirectoryCandidates(
	sources: RichTextMentionSources | undefined,
): readonly RichTextMentionItem[] {
	return [
		...(sources?.skill ?? []),
		...(sources?.tool ?? []),
	];
}

function getExactLabelCandidates(
	sources: RichTextMentionSources | undefined,
	trigger: DirectoryAutocompleteTraceTrigger,
): readonly RichTextMentionItem[] {
	switch (trigger) {
		case "slash":
			return [
				...(sources?.skill ?? []),
				...(sources?.app ?? []),
			];
		case "mention":
			return [
				...(sources?.human ?? []),
				...(sources?.team ?? []),
				...(sources?.subagent ?? []),
			];
		case "plain":
			return [
				...(sources?.skill ?? []),
				...(sources?.tool ?? []),
				...(sources?.app ?? []),
			];
	}
}

function getTriggerPrefix(trigger: DirectoryAutocompleteTraceTrigger): "" | "/" | "@" {
	switch (trigger) {
		case "slash":
			return "/";
		case "mention":
			return "@";
		case "plain":
			return "";
	}
}

function isBoundaryCharacter(character: string | undefined): boolean {
	return character === undefined ||
		/\s/u.test(character) ||
		BOUNDARY_PUNCTUATION.has(character) ||
		!(/[\p{L}\p{N}_]/u.test(character));
}

function isExactLabelBoundary(
	text: string,
	from: number,
	to: number,
	trigger: DirectoryAutocompleteTraceTrigger,
): boolean {
	const previousCharacter = text[from - 1];
	if (trigger === "plain" && (previousCharacter === "/" || previousCharacter === "@")) {
		return false;
	}

	return isBoundaryCharacter(previousCharacter) && isBoundaryCharacter(text[to]);
}

function getCandidateKey(mention: RichTextMentionItem, trigger: DirectoryAutocompleteTraceTrigger): string {
	return `${trigger}:${mention.category}:${mention.id}:${normalize(mention.label)}`;
}

function getExactLabelCandidateEntries(
	sources: RichTextMentionSources | undefined,
	minLabelLength: number,
): Array<{
	fullText: string;
	label: string;
	mention: RichTextMentionItem;
	sourceIndex: number;
	traceOffset: number;
	trigger: DirectoryAutocompleteTraceTrigger;
}> {
	const seen = new Set<string>();
	const entries: Array<{
		fullText: string;
		label: string;
		mention: RichTextMentionItem;
		sourceIndex: number;
		traceOffset: number;
		trigger: DirectoryAutocompleteTraceTrigger;
	}> = [];

	for (const trigger of ["plain", "slash", "mention"] as const) {
		const prefix = getTriggerPrefix(trigger);
		for (const mention of getExactLabelCandidates(sources, trigger)) {
			const label = mention.label.trim();
			if (label.length < minLabelLength) {
				continue;
			}

			const key = getCandidateKey(mention, trigger);
			if (seen.has(key)) {
				continue;
			}
			seen.add(key);

			const canonicalMention = label === mention.label ? mention : { ...mention, label };

			entries.push({
				fullText: `${prefix}${label}`,
				label,
				mention: canonicalMention,
				sourceIndex: entries.length,
				traceOffset: prefix.length,
				trigger,
			});
		}
	}

	return entries;
}

function isTrailingLongerCandidatePrefix(
	text: string,
	matchFrom: number,
	candidate: {
		fullText: string;
		trigger: DirectoryAutocompleteTraceTrigger;
	},
	candidates: readonly {
		fullText: string;
		trigger: DirectoryAutocompleteTraceTrigger;
	}[],
): boolean {
	if (candidate.trigger !== "plain") {
		return false;
	}

	const matchedText = candidate.fullText.toLowerCase();
	const trailingText = text.slice(matchFrom).toLowerCase();

	return candidates.some((otherCandidate) => {
		if (
			otherCandidate.trigger !== candidate.trigger ||
			otherCandidate.fullText.length <= candidate.fullText.length
		) {
			return false;
		}

		const longerText = otherCandidate.fullText.toLowerCase();
		return longerText.startsWith(`${matchedText} `) &&
			longerText.startsWith(trailingText) &&
			trailingText.length <= longerText.length;
	});
}

export function getDirectoryAutocompleteExactLabelMatches({
	minLabelLength = EXACT_LABEL_MIN_LENGTH,
	sources,
	suppressTrailingPrefixMatches = false,
	text,
}: DirectoryAutocompleteExactLabelMatchInput): readonly DirectoryAutocompleteExactLabelMatch[] {
	if (!text || !sources) {
		return [];
	}

	const lowerText = text.toLowerCase();
	const candidates = getExactLabelCandidateEntries(sources, minLabelLength);
	const rawMatches: DirectoryAutocompleteExactLabelMatch[] = [];

	for (const candidate of candidates) {
		const needle = candidate.fullText.toLowerCase();
		let from = lowerText.indexOf(needle);
		while (from !== -1) {
			const to = from + candidate.fullText.length;
			if (
				isExactLabelBoundary(text, from, to, candidate.trigger) &&
				!(
					suppressTrailingPrefixMatches &&
					isTrailingLongerCandidatePrefix(text, from, candidate, candidates)
				)
			) {
				rawMatches.push({
					from,
					label: candidate.label,
					mention: candidate.mention,
					sourceIndex: candidate.sourceIndex,
					to,
					traceFrom: from + candidate.traceOffset,
					traceTo: to,
					trigger: candidate.trigger,
				});
			}
			from = lowerText.indexOf(needle, from + 1);
		}
	}

	const selected: DirectoryAutocompleteExactLabelMatch[] = [];
	for (const match of rawMatches.sort((a, b) =>
		(b.to - b.from) - (a.to - a.from) ||
		a.sourceIndex - b.sourceIndex ||
		a.from - b.from
	)) {
		if (selected.some((existing) => match.from < existing.to && match.to > existing.from)) {
			continue;
		}
		selected.push(match);
	}

	return selected.sort((a, b) => a.from - b.from || a.to - b.to || a.sourceIndex - b.sourceIndex);
}

function hasExplicitCommandPrefix(query: string): boolean {
	const trimmed = query.trimStart();
	return trimmed.startsWith("/") || trimmed.startsWith("@");
}

function getMatchScore(item: RichTextMentionItem, normalizedQuery: string): number | null {
	const label = item.label.toLowerCase();
	const description = item.description?.toLowerCase() ?? "";

	if (label.startsWith(normalizedQuery)) {
		return 0;
	}

	const wordBoundaryIndex = label.indexOf(normalizedQuery);
	if (
		wordBoundaryIndex > 0 &&
		/\s/u.test(label[wordBoundaryIndex - 1] ?? "")
	) {
		return 1;
	}

	const haystack = `${label} ${description}`;
	return haystack.includes(normalizedQuery) ? 2 : null;
}

export function getDirectoryAutocompleteMatches(
	query: string,
	sources: RichTextMentionSources | undefined,
	limit = DIRECTORY_AUTOCOMPLETE_LIMIT,
): readonly DirectoryAutocompleteMatch[] {
	const normalizedQuery = normalize(query);
	if (normalizedQuery.length < DIRECTORY_AUTOCOMPLETE_MIN_QUERY_LENGTH || hasExplicitCommandPrefix(query)) {
		return [];
	}

	return getDirectoryCandidates(sources)
		.map((mention, sourceIndex): DirectoryAutocompleteMatch | null => {
			const score = getMatchScore(mention, normalizedQuery);
			return score === null ? null : { mention, score, sourceIndex };
		})
		.filter((match): match is DirectoryAutocompleteMatch => match !== null)
		.sort((a, b) => a.score - b.score || a.sourceIndex - b.sourceIndex)
		.slice(0, limit);
}

function getCurrentSegment(textBeforeCursor: string): {
	segment: string;
	segmentStartOffset: number;
} {
	for (let index = textBeforeCursor.length - 1; index >= 0; index -= 1) {
		if (PHRASE_BOUNDARY_PATTERN.test(textBeforeCursor[index] ?? "")) {
			return {
				segment: textBeforeCursor.slice(index + 1),
				segmentStartOffset: index + 1,
			};
		}
	}

	return {
		segment: textBeforeCursor,
		segmentStartOffset: 0,
	};
}

function getWordBoundarySuffixes(segment: string): readonly {
	query: string;
	startOffset: number;
}[] {
	const suffixes: Array<{ query: string; startOffset: number }> = [];

	for (let index = 0; index < segment.length; index += 1) {
		const character = segment[index];
		if (!character || /\s/u.test(character)) {
			continue;
		}
		if (index > 0 && !/\s/u.test(segment[index - 1] ?? "")) {
			continue;
		}

		const query = segment.slice(index).trim();
		if (query) {
			suffixes.push({ query, startOffset: index });
		}
	}

	return suffixes;
}

function getFallbackQuery(segment: string): { query: string; startOffset: number } | null {
	const match = /(?:^|\s)(\S+)$/u.exec(segment);
	if (!match?.[1]) {
		return null;
	}

	return {
		query: match[1],
		startOffset: segment.length - match[1].length,
	};
}

function getGhostText(
	query: string,
	matches: readonly DirectoryAutocompleteMatch[],
): string {
	const normalizedQuery = normalize(query);
	const prefixMatch = matches.find((match) =>
		match.mention.label.toLowerCase().startsWith(normalizedQuery),
	);

	return prefixMatch
		? prefixMatch.mention.label.slice(query.trimStart().length)
		: "";
}

export function getDirectoryAutocompleteState({
	activeIndex = 0,
	cursorPosition,
	minQueryLength = DIRECTORY_AUTOCOMPLETE_MIN_QUERY_LENGTH,
	sources,
	textBeforeCursor,
}: DirectoryAutocompleteInput): DirectoryAutocompleteState | null {
	const { segment } = getCurrentSegment(textBeforeCursor);
	const suffixes = getWordBoundarySuffixes(segment);
	let selectedSuffix: { query: string; startOffset: number } | null = null;
	let matches: readonly DirectoryAutocompleteMatch[] = [];

	for (const suffix of suffixes) {
		if (suffix.query.trim().length < minQueryLength || hasExplicitCommandPrefix(suffix.query)) {
			continue;
		}

		const suffixMatches = getDirectoryAutocompleteMatches(suffix.query, sources);
		if (suffixMatches.length > 0) {
			selectedSuffix = suffix;
			matches = suffixMatches;
			break;
		}
	}

	if (!selectedSuffix) {
		const fallback = getFallbackQuery(segment);
		if (!fallback || fallback.query.trim().length < minQueryLength || hasExplicitCommandPrefix(fallback.query)) {
			return null;
		}
		selectedSuffix = fallback;
		matches = getDirectoryAutocompleteMatches(fallback.query, sources);
	}

	const boundedActiveIndex = matches.length > 0
		? Math.min(Math.max(activeIndex, 0), matches.length - 1)
		: 0;
	const queryFrom = cursorPosition - (segment.length - selectedSuffix.startOffset);

	return {
		activeIndex: boundedActiveIndex,
		ghostText: getGhostText(selectedSuffix.query, matches),
		matches,
		query: selectedSuffix.query,
		queryFrom,
		queryTo: cursorPosition,
	};
}
