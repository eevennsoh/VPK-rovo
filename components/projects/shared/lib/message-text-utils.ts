const MERMAID_BLOCK_REGEX = /```mermaid\b[\s\S]*?```/gi;
const MERMAID_EDGE_REGEX =
	/\b[A-Za-z0-9_-]+\s*(?:-->|==>|-.->)\s*(?:\|[^|\n]+\|\s*)?[A-Za-z0-9_-]+\b/;
const TOOL_TRACE_SUPPRESSION_TEXT =
	"Tool results were moved to the Thinking section. Open Tools for details.";

function createMermaidBlockRegex(): RegExp {
	return new RegExp(MERMAID_BLOCK_REGEX.source, MERMAID_BLOCK_REGEX.flags);
}

function extractMermaidBlocksFromText(value: string): string[] {
	if (!value.trim()) {
		return [];
	}

	return Array.from(value.matchAll(createMermaidBlockRegex()), (match) =>
		match[0].trim()
	);
}

function stripMermaidBlocksFromText(value: string): string {
	if (!value.trim()) {
		return "";
	}

	return value.replace(createMermaidBlockRegex(), "").trim();
}

function hasDependencyEdgesInMermaidBlock(value: string): boolean {
	return MERMAID_EDGE_REGEX.test(value);
}

/**
 * Text normalization helpers for AI-generated message content.
 *
 * These functions clean artifacts produced by streaming LLM responses
 * (e.g. stray trailing single characters or leading fragments).
 */

/**
 * Remove a trailing line that consists of a single alphabetic character.
 *
 * During streaming, partial token emission can leave an isolated letter at
 * the end of the message (e.g. "a", "b"). This trims it so the message
 * reads naturally until the next chunk arrives.
 */
export function removeTrailingSingleCharacterLine(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) {
		return "";
	}

	const lines = trimmed.split(/\r?\n/);
	if (lines.length < 2) {
		return trimmed;
	}

	const trailingLine = lines[lines.length - 1]?.trim() ?? "";
	if (!/^[A-Za-z]$/.test(trailingLine)) {
		return trimmed;
	}

	lines.pop();
	while (lines.length > 0 && lines[lines.length - 1].trim().length === 0) {
		lines.pop();
	}

	return lines.join("\n").trim();
}

/**
 * Remove a leading single-character fragment that precedes a first-person pronoun.
 *
 * Some streaming outputs produce artifacts like "b I'll " where a lone letter
 * is prepended to the actual message content.
 */
export function removeLeadingSingleCharacterFragment(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) {
		return "";
	}

	return trimmed
		.split(/\r?\n/)
		.map((line) =>
			line.replace(/^\s*[b-hj-z]\s+(?=I(?:['\u2019]|\b))/, "")
		)
		.join("\n")
		.trim();
}

export function sanitizeMarkdownArtifactMarkers(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) {
		return "";
	}

	return trimmed
		.replace(/\s*\(markdown:[^)]+\)/giu, "")
		.replace(/[ \t]+\n/g, "\n")
		.trim();
}

function countMatches(value: string, regex: RegExp): number {
	const matches = value.match(regex);
	return Array.isArray(matches) ? matches.length : 0;
}

function getLikelyJsonDumpStartIndex(value: string): number {
	const objectIndex = value.search(/\{\s*(?:\r?\n\s*)?"[^"\n]{1,80}"\s*:/);
	const arrayIndex = value.search(/\[\s*\{\s*(?:\r?\n\s*)?"[^"\n]{1,80}"\s*:/);

	if (objectIndex === -1) {
		return arrayIndex;
	}

	if (arrayIndex === -1) {
		return objectIndex;
	}

	return Math.min(objectIndex, arrayIndex);
}

function isInsideCodeFence(value: string, index: number): boolean {
	const prefix = value.slice(0, Math.max(0, index));
	const fenceCount = countMatches(prefix, /```/g);
	return fenceCount % 2 === 1;
}

function isLikelyToolJsonDump(value: string): boolean {
	const keyPairCount = countMatches(value, /"[^"\n]{1,80}"\s*:/g);
	const braceCount = countMatches(value, /[{}\[\]]/g);
	const newlineCount = countMatches(value, /\r?\n/g);

	return (
		keyPairCount >= 6 &&
		(value.length >= 240 || newlineCount >= 4 || braceCount >= 18)
	);
}

function findJsonContainerEndIndex(value: string, startIndex: number): number {
	if (startIndex < 0 || startIndex >= value.length) {
		return -1;
	}

	const firstCharacter = value[startIndex];
	if (firstCharacter !== "{" && firstCharacter !== "[") {
		return -1;
	}

	let depth = 0;
	let inString = false;
	let isEscaped = false;

	for (let index = startIndex; index < value.length; index += 1) {
		const character = value[index];

		if (inString) {
			if (isEscaped) {
				isEscaped = false;
				continue;
			}

			if (character === "\\") {
				isEscaped = true;
				continue;
			}

			if (character === "\"") {
				inString = false;
			}
			continue;
		}

		if (character === "\"") {
			inString = true;
			continue;
		}

		if (character === "{" || character === "[") {
			depth += 1;
			continue;
		}

		if (character === "}" || character === "]") {
			depth -= 1;
			if (depth === 0) {
				return index;
			}
		}
	}

	return -1;
}

function cleanSuppressedJsonSuffix(value: string): string {
	return value.replace(/^[\s,;:"]+/, "").trim();
}

interface SuppressToolJsonTraceOptions {
	replacement?: string;
}

export function suppressToolJsonTrace(
	value: string,
	options: SuppressToolJsonTraceOptions = {}
): { text: string; replaced: boolean } {
	const replacement = options.replacement ?? TOOL_TRACE_SUPPRESSION_TEXT;
	const trimmed = value.trim();
	if (!trimmed) {
		return { text: "", replaced: false };
	}

	if (trimmed.includes(replacement)) {
		return { text: trimmed, replaced: false };
	}

	const jsonStartIndex = getLikelyJsonDumpStartIndex(trimmed);
	if (jsonStartIndex === -1 || isInsideCodeFence(trimmed, jsonStartIndex)) {
		return { text: trimmed, replaced: false };
	}

	const jsonEndIndex = findJsonContainerEndIndex(trimmed, jsonStartIndex);
	if (jsonEndIndex === -1) {
		return { text: trimmed, replaced: false };
	}

	const jsonSegment = trimmed.slice(jsonStartIndex, jsonEndIndex + 1);
	if (!isLikelyToolJsonDump(jsonSegment)) {
		return { text: trimmed, replaced: false };
	}

	const prefix = trimmed.slice(0, jsonStartIndex).trimEnd();
	const rawSuffix = trimmed.slice(jsonEndIndex + 1);
	const suffix = cleanSuppressedJsonSuffix(rawSuffix);
	const nextText = [prefix, suffix || replacement]
		.filter(Boolean)
		.join("\n\n")
		.trim();

	return {
		text: nextText.length > 0 ? nextText : replacement,
		replaced: true,
	};
}

function isLikelySectionHeading(line: string): boolean {
	const trimmed = line.trim();
	if (!trimmed) {
		return false;
	}

	if (/^#{1,6}\s+\S/.test(trimmed)) {
		return true;
	}

	if (/^\*\*[^*]+\*\*:?$/.test(trimmed)) {
		return true;
	}

	return (
		/^[A-Z][A-Za-z0-9\s-]{1,60}:?$/.test(trimmed) &&
		!/[.!?]$/.test(trimmed)
	);
}

function isActionItemsHeading(line: string): boolean {
	const normalizedHeading = line
		.trim()
		.replace(/^#{1,6}\s*/, "")
		.replace(/:$/, "")
		.replace(/^\*\*(.+)\*\*$/, "$1")
		.trim()
		.toLowerCase();

	return /^action\s*items?\b/.test(normalizedHeading);
}

function isActionListItemLine(line: string): boolean {
	return (
		/^\s*(?:[-*+\u2022]\s+|\d+[.)]\s+)(?:\[(?:\s|x|X)\]\s*)?(?:\u2610\s*)?\S/.test(
			line
		) || /^\s*(?:\[(?:\s|x|X)\]\s*|\u2610\s+)\S/.test(line)
	);
}

function isContinuationLine(line: string): boolean {
	return /^\s{2,}\S/.test(line) || /^\t\S/.test(line);
}

function isPlanNarrativeNoiseLine(line: string): boolean {
	const trimmedLine = line.trim();
	if (!trimmedLine) {
		return false;
	}

	if (
		/^(?:used|invoking|completed|running|calling)\s+[A-Za-z0-9_.:-]+/i.test(
			trimmedLine
		)
	) {
		return true;
	}

	if (/^(?:great idea!?|here(?:['\u2019]?)s the plan:?)/i.test(trimmedLine)) {
		return true;
	}

	if (
		/^(?:perfect|awesome|great|thanks)[!.,\s]/i.test(trimmedLine) &&
		/(?:\blet me\b|\bi(?:['\u2019]?)ll\b)/i.test(trimmedLine)
	) {
		return true;
	}

	if (/^let me\s+/i.test(trimmedLine) || /^now i\b/i.test(trimmedLine)) {
		return true;
	}

	if (
		/^tool results were (?:large and are omitted for performance|moved to the thinking section)\.?\s*open tools for details\.?$/i.test(
			trimmedLine
		)
	) {
		return true;
	}

	return /^#{1,6}\s*plan\b/i.test(trimmedLine) || /^plan:?$/i.test(trimmedLine);
}

function isPlanHeadingLine(line: string): boolean {
	const trimmedLine = line.trim();
	if (!trimmedLine) {
		return false;
	}

	const headingValue = trimmedLine
		.replace(/^#{1,6}\s*/, "")
		.replace(/^\*\*(.+)\*\*:?\s*$/, "$1")
		.replace(/:$/, "")
		.trim();
	if (!headingValue) {
		return false;
	}

	return /\bplan\b/i.test(headingValue) && headingValue.length <= 80;
}

function findPlanNarrativeStartIndex(lines: string[]): number {
	for (let index = 0; index < lines.length; index += 1) {
		if (isPlanHeadingLine(lines[index])) {
			return index + 1;
		}
	}

	return 0;
}

function stripToolResultsSuppressionText(line: string): string {
	return line
		.replace(
			/\bTool results were (?:large and are omitted for performance|moved to the Thinking section)\.?\s*Open Tools for details\.?/gi,
			""
		)
		.trim();
}

function extractPlanSummaryTail(value: string, maxSummaryLines: number): string {
	const lines = value
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length > 0)
		.filter((line) => !isActionListItemLine(line))
		.filter((line) => !isLikelySectionHeading(line))
		.filter((line) => !isPlanNarrativeNoiseLine(line))
		.filter((line) => !/^```/.test(line));
	if (lines.length === 0) {
		return "";
	}

	return lines
		.slice(-maxSummaryLines)
		.map((line) =>
			stripToolResultsSuppressionText(line).replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1")
		)
		.filter((line) => line.length > 0)
		.join("\n")
		.trim();
}

function extractPlanSummaryBody(value: string): string {
	const lines = value.split(/\r?\n/);
	const summaryLines: string[] = [];
	let previousLineWasBlank = false;

	for (const line of lines.slice(findPlanNarrativeStartIndex(lines))) {
		const trimmedLine = line.trim();
		if (!trimmedLine) {
			if (summaryLines.length > 0 && !previousLineWasBlank) {
				summaryLines.push("");
				previousLineWasBlank = true;
			}
			continue;
		}

		if (
			isPlanNarrativeNoiseLine(trimmedLine) ||
			isPlanHeadingLine(trimmedLine) ||
			/^```/.test(trimmedLine)
		) {
			continue;
		}

		const cleanedLine = stripToolResultsSuppressionText(trimmedLine);
		if (!cleanedLine) {
			continue;
		}

		summaryLines.push(cleanedLine);
		previousLineWasBlank = false;
	}

	while (summaryLines[summaryLines.length - 1] === "") {
		summaryLines.pop();
	}

	return summaryLines.join("\n").trim();
}

export interface PlanRenderableText {
	text: string;
	mermaid: string;
	summary: string;
}

interface ExtractPlanRenderableTextOptions {
	maxSummaryLines?: number;
	summaryMode?: "tail" | "full";
}

/**
 * Remove the "Action items" section from a planning response when tasks are
 * already rendered in a dedicated plan card widget.
 */
export function removeActionItemsSection(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) {
		return "";
	}

	const lines = trimmed.split(/\r?\n/);
	const headingIndex = lines.findIndex((line) => isActionItemsHeading(line));
	if (headingIndex === -1) {
		return trimmed;
	}

	let hasSeenListItem = false;
	let hasActiveListItem = false;
	let sectionEndIndex = headingIndex + 1;

	for (let index = headingIndex + 1; index < lines.length; index += 1) {
		const line = lines[index];
		const trimmedLine = line.trim();

		if (isActionListItemLine(line)) {
			hasSeenListItem = true;
			hasActiveListItem = true;
			sectionEndIndex = index + 1;
			continue;
		}

		if (!trimmedLine) {
			hasActiveListItem = false;
			sectionEndIndex = index + 1;
			continue;
		}

		if (!hasSeenListItem) {
			sectionEndIndex = index + 1;
			if (isLikelySectionHeading(trimmedLine) && index > headingIndex + 1) {
				break;
			}
			continue;
		}

		if (hasActiveListItem && isContinuationLine(line)) {
			sectionEndIndex = index + 1;
			continue;
		}

		if (isLikelySectionHeading(trimmedLine)) {
			break;
		}

		break;
	}

	if (!hasSeenListItem) {
		return trimmed;
	}

	const remainingLines = [
		...lines.slice(0, headingIndex),
		...lines.slice(sectionEndIndex),
	];
	const compactedLines: string[] = [];
	for (const line of remainingLines) {
		if (
			line.trim().length === 0 &&
			compactedLines[compactedLines.length - 1]?.trim().length === 0
		) {
			continue;
		}

		compactedLines.push(line);
	}

	while (compactedLines[0]?.trim().length === 0) {
		compactedLines.shift();
	}
	while (compactedLines[compactedLines.length - 1]?.trim().length === 0) {
		compactedLines.pop();
	}

	return compactedLines.join("\n").trim();
}

export function extractPlanRenderableText(
	value: string,
	options: ExtractPlanRenderableTextOptions = {}
): PlanRenderableText {
	const summaryMode = options.summaryMode === "full" ? "full" : "tail";
	const maxSummaryLines =
		typeof options.maxSummaryLines === "number" && options.maxSummaryLines > 0
			? Math.floor(options.maxSummaryLines)
			: 2;

	const normalizedText = removeActionItemsSection(
		removeLeadingSingleCharacterFragment(value)
	);
	if (!normalizedText) {
		return {
			text: "",
			mermaid: "",
			summary: "",
		};
	}

	const mermaidBlocks = extractMermaidBlocksFromText(normalizedText).filter((block) =>
		hasDependencyEdgesInMermaidBlock(block)
	);
	const mermaidText = mermaidBlocks.join("\n\n").trim();
	const narrativeText = stripMermaidBlocksFromText(normalizedText);
	const summary =
		summaryMode === "full"
			? extractPlanSummaryBody(narrativeText)
			: extractPlanSummaryTail(narrativeText, maxSummaryLines);
	const combinedText = [mermaidText, summary].filter(Boolean).join("\n\n").trim();

	return {
		text: combinedText,
		mermaid: mermaidText,
		summary,
	};
}
