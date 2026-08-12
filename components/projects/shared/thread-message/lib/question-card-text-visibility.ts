interface ShouldSuppressQuestionCardMessageTextOptions {
	shouldShowWidgetSections: boolean;
	widgetType: string | undefined;
	isStreaming: boolean;
	widgetPayload: unknown;
	messageText?: string;
}

interface SanitizeQuestionCardMessageTextOptions {
	widgetPayload: unknown;
	messageText?: string;
}

const TRANSLATION_CLARIFICATION_SESSION_PREFIX = "translation-clarification-";
const TRANSLATION_CLARIFICATION_LEGACY_SESSION_ID = "translation-clarification";
const TRANSLATION_SIGNAL_PATTERN =
	/\b(translate|translation|target language|source language|text to translate|what text should i translate|which language should i translate)\b/i;
const QUESTION_CARD_BOILERPLATE_PATTERNS = [
	/^great idea[!.]?$/i,
	/\blet me ask(?: you)?(?: a few| some)? questions?\b/i,
	/\bi(?:'|’)?ve shared some questions\b/i,
	/\b(?:these questions|they) cover\b/i,
	/\bonce you answer(?: those| these)?\b/i,
	/\bwhat are your preferences\??$/i,
	/\bi(?:'|’)?d love to understand your vision\b/i,
	/\bbefore (?:putting together|building|drafting) (?:a|the) plan\b/i,
	/\bi(?:'|’)?ll put together (?:a|the) detailed implementation plan\b/i,
];

function getQuestionCardSessionId(payload: unknown): string | null {
	if (!payload || typeof payload !== "object") {
		return null;
	}

	const record = payload as { sessionId?: unknown };
	if (typeof record.sessionId !== "string") {
		return null;
	}

	const normalizedSessionId = record.sessionId.trim();
	return normalizedSessionId.length > 0 ? normalizedSessionId : null;
}

function getNonEmptyString(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const trimmedValue = value.trim();
	return trimmedValue.length > 0 ? trimmedValue : null;
}

function collectTranslationSignalsFromPayload(payload: unknown): string[] {
	if (!payload || typeof payload !== "object") {
		return [];
	}

	const record = payload as {
		title?: unknown;
		description?: unknown;
		questions?: unknown;
	};
	const result: string[] = [];
	const title = getNonEmptyString(record.title);
	const description = getNonEmptyString(record.description);

	if (title) {
		result.push(title);
	}
	if (description) {
		result.push(description);
	}

	if (!Array.isArray(record.questions)) {
		return result;
	}

	for (const question of record.questions) {
		if (!question || typeof question !== "object") {
			continue;
		}

		const questionRecord = question as {
			id?: unknown;
			label?: unknown;
			header?: unknown;
			description?: unknown;
		};
		const id = getNonEmptyString(questionRecord.id);
		const label = getNonEmptyString(questionRecord.label);
		const header = getNonEmptyString(questionRecord.header);
		const questionDescription = getNonEmptyString(questionRecord.description);

		if (id) {
			result.push(id);
		}
		if (label) {
			result.push(label);
		}
		if (header) {
			result.push(header);
		}
		if (questionDescription) {
			result.push(questionDescription);
		}
	}

	return result;
}

function includesTranslationSignal(value: string): boolean {
	return TRANSLATION_SIGNAL_PATTERN.test(value);
}

function toDedupeKey(value: string): string {
	return value
		.toLowerCase()
		.replace(/\s+/g, " ")
		.replace(/[^\p{L}\p{N}\s]/gu, "")
		.trim();
}

function isQuestionCardBoilerplateSentence(value: string): boolean {
	const normalized = value
		.replace(/\s+/g, " ")
		.replace(/:(?=[A-Z])/g, ": ")
		.trim();
	if (!normalized) {
		return false;
	}

	return QUESTION_CARD_BOILERPLATE_PATTERNS.some((pattern) =>
		pattern.test(normalized)
	);
}

function sanitizeLineSentences(line: string): string {
	const normalizedLine = line
		.replace(/\s+/g, " ")
		.replace(/:(?=[A-Z])/g, ": ")
		.trim();
	if (!normalizedLine) {
		return "";
	}

	const fragments = normalizedLine.match(/[^.!?]+[.!?]?/g) ?? [normalizedLine];
	const keptFragments = fragments
		.map((fragment) => fragment.trim())
		.filter((fragment) => fragment.length > 0)
		.filter(
			(fragment) => !isQuestionCardBoilerplateSentence(fragment)
		);
	if (keptFragments.length === 0) {
		return "";
	}

	return keptFragments.join(" ").replace(/\s+([,.;!?])/g, "$1").trim();
}

function compactLines(lines: string[]): string[] {
	const compacted: string[] = [];
	for (const line of lines) {
		if (line.length === 0 && compacted[compacted.length - 1]?.length === 0) {
			continue;
		}
		compacted.push(line);
	}

	while (compacted[0]?.length === 0) {
		compacted.shift();
	}
	while (compacted[compacted.length - 1]?.length === 0) {
		compacted.pop();
	}

	return compacted;
}

function getMarkdownFenceMarker(line: string): string | null {
	return line.match(/^[ \t]{0,3}(`{3,}|~{3,})/u)?.[1] ?? null;
}

function closesMarkdownFence(line: string, marker: string): boolean {
	const trimmedLine = line.trim();
	return trimmedLine.length >= marker.length
		&& Array.from(trimmedLine).every((character) => character === marker[0]);
}

export function isTranslationClarificationQuestionCard(
	payload: unknown,
	messageText?: string
): boolean {
	const sessionId = getQuestionCardSessionId(payload);
	if (!sessionId) {
		const normalizedMessageText = getNonEmptyString(messageText);
		if (normalizedMessageText && includesTranslationSignal(normalizedMessageText)) {
			return true;
		}
		return collectTranslationSignalsFromPayload(payload).some(includesTranslationSignal);
	}

	if (
		sessionId === TRANSLATION_CLARIFICATION_LEGACY_SESSION_ID ||
		sessionId.startsWith(TRANSLATION_CLARIFICATION_SESSION_PREFIX)
	) {
		return true;
	}

	const normalizedMessageText = getNonEmptyString(messageText);
	if (normalizedMessageText && includesTranslationSignal(normalizedMessageText)) {
		return true;
	}

	return collectTranslationSignalsFromPayload(payload).some(includesTranslationSignal);
}

export function sanitizeQuestionCardMessageText({
	widgetPayload,
	messageText,
}: Readonly<SanitizeQuestionCardMessageTextOptions>): string {
	const normalizedMessageText = getNonEmptyString(messageText);
	if (!normalizedMessageText) {
		return "";
	}

	if (isTranslationClarificationQuestionCard(widgetPayload, normalizedMessageText)) {
		return normalizedMessageText;
	}

	const lines = normalizedMessageText.split(/\r?\n/);
	const dedupeKeys = new Set<string>();
	const sanitizedLines: string[] = [];
	let activeFenceMarker: string | null = null;
	for (const line of lines) {
		if (activeFenceMarker) {
			sanitizedLines.push(line);
			if (closesMarkdownFence(line, activeFenceMarker)) {
				activeFenceMarker = null;
			}
			continue;
		}

		const fenceMarker = getMarkdownFenceMarker(line);
		if (fenceMarker) {
			activeFenceMarker = fenceMarker;
			sanitizedLines.push(line);
			continue;
		}

		const trimmedLine = line.trim();
		if (!trimmedLine) {
			sanitizedLines.push("");
			continue;
		}

		const sanitizedLine = sanitizeLineSentences(trimmedLine);
		if (!sanitizedLine) {
			continue;
		}

		const dedupeKey = toDedupeKey(sanitizedLine);
		if (!dedupeKey) {
			continue;
		}
		if (dedupeKeys.has(dedupeKey)) {
			continue;
		}
		dedupeKeys.add(dedupeKey);
		sanitizedLines.push(sanitizedLine);
	}

	return compactLines(sanitizedLines).join("\n").trim();
}

export function shouldSuppressQuestionCardMessageText({
	shouldShowWidgetSections,
	widgetType,
	isStreaming,
	widgetPayload,
	messageText,
}: Readonly<ShouldSuppressQuestionCardMessageTextOptions>): boolean {
	if (!shouldShowWidgetSections || widgetType !== "question-card" || isStreaming) {
		return false;
	}

	return (
		sanitizeQuestionCardMessageText({
			widgetPayload,
			messageText,
		}).length === 0
	);
}
