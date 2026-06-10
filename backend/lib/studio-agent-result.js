const AGENT_RESULT_STREAM_PREFIX = "AGENT_RESULT:";
const DEFAULT_GENERATED_AGENT_BYLINE = "Custom agent by You";
const MAX_GENERATED_AGENT_CONVERSATION_STARTERS = 3;
const MISSING_STUDIO_AGENT_RESULT_ERROR_CODE = "missing-agent-result";
const STUDIO_AGENT_RESULT_WIDGET_TYPE = "agent-result";

function getNonEmptyString(value) {
	if (typeof value !== "string") {
		return null;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function isPlainObject(value) {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function slugify(value) {
	const normalized = getNonEmptyString(value);
	if (!normalized) {
		return null;
	}

	const slug = normalized
		.toLowerCase()
		.replace(/['"]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

	return slug || null;
}

function getInitials(name) {
	const normalizedName = getNonEmptyString(name);
	if (!normalizedName) {
		return null;
	}

	const words = normalizedName
		.split(/\s+/u)
		.map((word) => word.replace(/[^a-z0-9]/giu, ""))
		.filter(Boolean);
	if (words.length === 0) {
		return null;
	}

	const initials = words.length === 1
		? words[0].slice(0, 2)
		: `${words[0][0]}${words[words.length - 1][0]}`;

	return initials.toUpperCase();
}

function normalizeStringList(value, { maxItems = 6 } = {}) {
	if (!Array.isArray(value)) {
		return [];
	}

	const normalized = [];
	const seen = new Set();
	for (const item of value) {
		const text =
			getNonEmptyString(item) ||
			(isPlainObject(item)
				? getNonEmptyString(item.prompt) ||
					getNonEmptyString(item.label) ||
					getNonEmptyString(item.text) ||
					getNonEmptyString(item.title)
				: null);
		if (!text) {
			continue;
		}

		const key = text.toLowerCase();
		if (seen.has(key)) {
			continue;
		}

		seen.add(key);
		normalized.push(text);
		if (normalized.length >= maxItems) {
			break;
		}
	}

	return normalized;
}

function unwrapAgentDefinition(value) {
	if (!isPlainObject(value)) {
		return null;
	}

	if (value.type === "data-agent-result" && isPlainObject(value.data)) {
		return value.data;
	}

	for (const key of ["agentResult", "agent_result", "agent", "profile", "definition"]) {
		if (isPlainObject(value[key])) {
			return value[key];
		}
	}

	return value;
}

function normalizeAvatarFallback(value, name) {
	const avatar = isPlainObject(value?.avatar) ? value.avatar : null;
	const fallback = isPlainObject(value?.avatarFallback)
		? value.avatarFallback
		: isPlainObject(value?.avatar_fallback)
			? value.avatar_fallback
			: null;
	const initials =
		getNonEmptyString(fallback?.initials) ||
		getNonEmptyString(avatar?.initials) ||
		getInitials(name);
	const backgroundColor =
		getNonEmptyString(fallback?.backgroundColor) ||
		getNonEmptyString(fallback?.background_color) ||
		getNonEmptyString(fallback?.color) ||
		getNonEmptyString(avatar?.backgroundColor) ||
		getNonEmptyString(avatar?.background_color) ||
		getNonEmptyString(avatar?.color);
	const iconName =
		getNonEmptyString(fallback?.iconName) ||
		getNonEmptyString(fallback?.icon_name) ||
		getNonEmptyString(avatar?.iconName) ||
		getNonEmptyString(avatar?.icon_name);
	const label =
		getNonEmptyString(fallback?.label) ||
		getNonEmptyString(avatar?.label);

	if (!initials && !backgroundColor && !iconName && !label) {
		return null;
	}

	return {
		...(initials ? { initials } : {}),
		...(backgroundColor ? { backgroundColor } : {}),
		...(iconName ? { iconName } : {}),
		...(label ? { label } : {}),
	};
}

function normalizeStudioAgentResult(value) {
	const definition = unwrapAgentDefinition(value);
	if (!definition) {
		return null;
	}

	const name = getNonEmptyString(definition.name) || getNonEmptyString(definition.displayName);
	const description =
		getNonEmptyString(definition.description) ||
		getNonEmptyString(definition.summary);
	const instructions =
		getNonEmptyString(definition.instructions) ||
		getNonEmptyString(definition.contextDescription) ||
		getNonEmptyString(definition.context_description) ||
		getNonEmptyString(definition.context) ||
		getNonEmptyString(definition.systemPrompt) ||
		getNonEmptyString(definition.system_prompt);
	const conversationStarters = normalizeStringList(
		definition.conversationStarters ||
			definition.conversation_starters ||
			definition.starters ||
			definition.suggestedQuestions ||
			definition.suggested_questions,
		{ maxItems: MAX_GENERATED_AGENT_CONVERSATION_STARTERS },
	);

	if (!name || !description || !instructions || conversationStarters.length === 0) {
		return null;
	}

	const explicitAgentId =
		getNonEmptyString(definition.agentId) ||
		getNonEmptyString(definition.agent_id) ||
		getNonEmptyString(definition.id);
	const agentId = explicitAgentId || `studio-agent-${slugify(name) || "generated"}`;
	const byline =
		getNonEmptyString(definition.byline) ||
		getNonEmptyString(definition.sourceLabel) ||
		getNonEmptyString(definition.source_label) ||
		getNonEmptyString(definition.source) ||
		DEFAULT_GENERATED_AGENT_BYLINE;
	const avatarSrc =
		getNonEmptyString(definition.avatarSrc) ||
		getNonEmptyString(definition.avatar_src) ||
		getNonEmptyString(definition.avatar?.src) ||
		getNonEmptyString(definition.avatar?.url);
	const avatarFallback = normalizeAvatarFallback(definition, name);
	const tools = normalizeStringList(definition.tools, { maxItems: 12 });
	const apps = normalizeStringList(definition.apps, { maxItems: 24 });
	const skills = normalizeStringList(definition.skills, { maxItems: 24 });
	const knowledge = normalizeStringList(definition.knowledge, { maxItems: 24 });
	const subagents = normalizeStringList(definition.subagents, { maxItems: 24 });
	const triggers = normalizeStringList(definition.triggers, { maxItems: 12 });
	const conversationStarterIcons = normalizeStringList(
		definition.conversationStarterIcons || definition.conversation_starter_icons,
		{ maxItems: MAX_GENERATED_AGENT_CONVERSATION_STARTERS },
	);
	const memoryMode =
		getNonEmptyString(definition.memoryMode) || getNonEmptyString(definition.memory_mode);
	const reasoningMode =
		getNonEmptyString(definition.reasoningMode) || getNonEmptyString(definition.reasoning_mode);
	const knowledgeMode =
		getNonEmptyString(definition.knowledgeMode) || getNonEmptyString(definition.knowledge_mode);
	const trigger = getNonEmptyString(definition.trigger);
	const guardrail =
		getNonEmptyString(definition.guardrail) ||
		getNonEmptyString(definition.guardrails);
	const assignedColumn =
		getNonEmptyString(definition.assignedColumn) ||
		getNonEmptyString(definition.assigned_column);

	return {
		agentId,
		name,
		byline,
		sourceLabel: byline,
		description,
		summary: getNonEmptyString(definition.summary) || description,
		instructions,
		contextDescription:
			getNonEmptyString(definition.contextDescription) ||
			getNonEmptyString(definition.context_description) ||
			instructions,
		conversationStarters,
		...(avatarSrc ? { avatarSrc } : {}),
		...(avatarFallback ? { avatarFallback } : {}),
		...(assignedColumn ? { assignedColumn } : {}),
		...(trigger ? { trigger } : {}),
		...(triggers.length > 0 ? { triggers } : {}),
		...(tools.length > 0 ? { tools } : {}),
		...(apps.length > 0 ? { apps } : {}),
		...(skills.length > 0 ? { skills } : {}),
		...(knowledge.length > 0 ? { knowledge } : {}),
		...(subagents.length > 0 ? { subagents } : {}),
		...(conversationStarterIcons.length > 0 ? { conversationStarterIcons } : {}),
		...(memoryMode ? { memoryMode } : {}),
		...(reasoningMode ? { reasoningMode } : {}),
		...(knowledgeMode ? { knowledgeMode } : {}),
		...(guardrail ? { guardrail } : {}),
		action: "create",
	};
}

const TOLERANT_PARSE_BACKTRACK = Symbol("studio-agent-result/backtrack");
const TOLERANT_PARSE_BUDGET_EXCEEDED = Symbol("studio-agent-result/budget");
const TOLERANT_PARSE_MAX_STEPS = 200000;

function decodeJsonEscape(src, backslashIndex) {
	const escaped = src[backslashIndex + 1];
	switch (escaped) {
		case "\"":
			return { text: "\"", advance: 2 };
		case "\\":
			return { text: "\\", advance: 2 };
		case "/":
			return { text: "/", advance: 2 };
		case "b":
			return { text: "\b", advance: 2 };
		case "f":
			return { text: "\f", advance: 2 };
		case "n":
			return { text: "\n", advance: 2 };
		case "r":
			return { text: "\r", advance: 2 };
		case "t":
			return { text: "\t", advance: 2 };
		case "u": {
			const hex = src.slice(backslashIndex + 2, backslashIndex + 6);
			if (/^[0-9a-fA-F]{4}$/u.test(hex)) {
				return { text: String.fromCharCode(parseInt(hex, 16)), advance: 6 };
			}
			return { text: "u", advance: 2 };
		}
		default:
			return { text: escaped === undefined ? "" : escaped, advance: 2 };
	}
}

/**
 * Best-effort, backtracking JSON-object parser used only as a fallback when
 * strict `JSON.parse` fails. It recovers from the dominant LLM structured-output
 * defect — unescaped double quotes (and raw control characters) inside long
 * free-text string values such as `instructions`.
 *
 * Each string value tries its earliest closing quote first; if the rest of the
 * object cannot then be parsed, that quote is absorbed as interior text and the
 * next candidate is tried (continuation-passing backtracking). Object keys are
 * constrained to identifier-like text, which rejects the degenerate "too-early
 * close" parses that would otherwise complete a structurally-valid but wrong
 * object. Bounded by a step budget so pathological input degrades to `null`
 * rather than hanging.
 *
 * Returns `{ value, endIndex }` (endIndex points at the closing brace) or null.
 */
function tolerantParseJsonObjectAt(src, startIndex) {
	if (typeof src !== "string" || src[startIndex] !== "{") {
		return null;
	}

	const length = src.length;
	let steps = 0;

	function bumpBudget() {
		steps += 1;
		if (steps > TOLERANT_PARSE_MAX_STEPS) {
			throw TOLERANT_PARSE_BUDGET_EXCEEDED;
		}
	}

	function skipWhitespace(index) {
		let cursor = index;
		while (cursor < length) {
			const character = src[cursor];
			if (character === " " || character === "\t" || character === "\n" || character === "\r") {
				cursor += 1;
			} else {
				break;
			}
		}
		return cursor;
	}

	function isPlausibleKey(key) {
		// Real object keys here are identifiers. A key that absorbed an interior
		// quote or control character is the signature of a degenerate (too-early)
		// string close, so reject it to steer backtracking toward the real parse.
		return key.length > 0 && key.length <= 120 && !/["\n\r\t]/u.test(key);
	}

	function parseValue(index, continueWith) {
		bumpBudget();
		const cursor = skipWhitespace(index);
		if (cursor >= length) {
			throw TOLERANT_PARSE_BACKTRACK;
		}

		const character = src[cursor];
		if (character === "{") {
			return parseObject(cursor, continueWith);
		}
		if (character === "[") {
			return parseArray(cursor, continueWith);
		}
		if (character === "\"") {
			return parseString(cursor, continueWith);
		}
		return parsePrimitive(cursor, continueWith);
	}

	function parseString(index, continueWith) {
		let cursor = index + 1;
		let buffer = "";
		while (cursor < length) {
			bumpBudget();
			const character = src[cursor];
			if (character === "\\") {
				const { text, advance } = decodeJsonEscape(src, cursor);
				buffer += text;
				cursor += advance;
				continue;
			}
			if (character === "\"") {
				try {
					return continueWith(buffer, cursor + 1);
				} catch (error) {
					if (error !== TOLERANT_PARSE_BACKTRACK) {
						throw error;
					}
					buffer += "\"";
					cursor += 1;
					continue;
				}
			}
			buffer += character;
			cursor += 1;
		}
		throw TOLERANT_PARSE_BACKTRACK;
	}

	function parsePrimitive(index, continueWith) {
		const rest = src.slice(index);
		if (rest.startsWith("true")) {
			return continueWith(true, index + 4);
		}
		if (rest.startsWith("false")) {
			return continueWith(false, index + 5);
		}
		if (rest.startsWith("null")) {
			return continueWith(null, index + 4);
		}
		const numberMatch = /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/u.exec(rest);
		if (numberMatch) {
			return continueWith(Number(numberMatch[0]), index + numberMatch[0].length);
		}
		throw TOLERANT_PARSE_BACKTRACK;
	}

	function parseArray(index, continueWith) {
		const start = skipWhitespace(index + 1);
		if (src[start] === "]") {
			return continueWith([], start + 1);
		}

		const items = [];
		function parseElement(elementIndex) {
			return parseValue(elementIndex, (value, afterValue) => {
				items.push(value);
				const next = skipWhitespace(afterValue);
				if (src[next] === ",") {
					return parseElement(next + 1);
				}
				if (src[next] === "]") {
					return continueWith(items, next + 1);
				}
				throw TOLERANT_PARSE_BACKTRACK;
			});
		}

		return parseElement(start);
	}

	function parseObject(index, continueWith) {
		const start = skipWhitespace(index + 1);
		const result = {};
		if (src[start] === "}") {
			return continueWith(result, start + 1);
		}

		function parsePair(pairIndex) {
			const keyStart = skipWhitespace(pairIndex);
			if (src[keyStart] !== "\"") {
				throw TOLERANT_PARSE_BACKTRACK;
			}

			return parseString(keyStart, (key, afterKey) => {
				if (!isPlausibleKey(key)) {
					throw TOLERANT_PARSE_BACKTRACK;
				}
				const colon = skipWhitespace(afterKey);
				if (src[colon] !== ":") {
					throw TOLERANT_PARSE_BACKTRACK;
				}
				return parseValue(colon + 1, (value, afterValue) => {
					result[key] = value;
					const next = skipWhitespace(afterValue);
					if (src[next] === ",") {
						return parsePair(next + 1);
					}
					if (src[next] === "}") {
						return continueWith(result, next + 1);
					}
					throw TOLERANT_PARSE_BACKTRACK;
				});
			});
		}

		return parsePair(start);
	}

	try {
		return parseObject(startIndex, (value, next) => ({ value, endIndex: next - 1 }));
	} catch (error) {
		if (error === TOLERANT_PARSE_BACKTRACK || error === TOLERANT_PARSE_BUDGET_EXCEEDED) {
			return null;
		}
		throw error;
	}
}

function findJsonObjectEndIndex(value, startIndex) {
	let depth = 0;
	let inString = false;
	let isEscaped = false;

	for (let index = startIndex; index < value.length; index += 1) {
		const character = value[index];

		if (inString) {
			if (isEscaped) {
				isEscaped = false;
			} else if (character === "\\") {
				isEscaped = true;
			} else if (character === "\"") {
				inString = false;
			}
			continue;
		}

		if (character === "\"") {
			inString = true;
		} else if (character === "{") {
			depth += 1;
		} else if (character === "}") {
			depth -= 1;
			if (depth === 0) {
				return index;
			}
		}
	}

	return -1;
}

function parseJsonObjectAt(value, startIndex) {
	if (typeof value !== "string" || value[startIndex] !== "{") {
		return null;
	}

	const endIndex = findJsonObjectEndIndex(value, startIndex);
	if (endIndex !== -1) {
		try {
			return {
				value: JSON.parse(value.slice(startIndex, endIndex + 1)),
				endIndex,
			};
		} catch {
			// Strict parse failed (commonly unescaped quotes in a free-text
			// field). Fall through to the backtracking tolerant parser.
		}
	}

	return tolerantParseJsonObjectAt(value, startIndex);
}

function cleanExtractedText(text) {
	return text
		.replace(/[ \t]+\n/gu, "\n")
		.replace(/\n{3,}/gu, "\n\n")
		.trim();
}

function joinTextAroundExtraction(before, after) {
	const left = before.replace(/[ \t]+$/u, "").replace(/\n+$/u, "\n");
	const right = after.replace(/^[\r\n\t ]+/u, "");
	if (!left) {
		return right;
	}
	if (!right) {
		return left;
	}

	return `${left}${left.endsWith("\n") ? "" : "\n"}${right}`;
}

function extractAgentResultFromMarker(text) {
	const markerIndex = text.indexOf(AGENT_RESULT_STREAM_PREFIX);
	if (markerIndex === -1) {
		return null;
	}

	let jsonStartIndex = markerIndex + AGENT_RESULT_STREAM_PREFIX.length;
	while (jsonStartIndex < text.length && /\s/u.test(text[jsonStartIndex])) {
		jsonStartIndex += 1;
	}

	const parsed = parseJsonObjectAt(text, jsonStartIndex);
	if (!parsed) {
		return null;
	}

	const payload = normalizeStudioAgentResult(parsed.value);
	if (!payload) {
		return null;
	}

	return {
		payload,
		cleanedText: cleanExtractedText(
			joinTextAroundExtraction(
				text.slice(0, markerIndex),
				text.slice(parsed.endIndex + 1),
			),
		),
		source: "marker",
	};
}

function tryParseJsonObject(value) {
	const text = getNonEmptyString(value);
	if (!text || text[0] !== "{") {
		return null;
	}

	try {
		const parsed = JSON.parse(text);
		return isPlainObject(parsed) ? parsed : null;
	} catch {
		const tolerant = tolerantParseJsonObjectAt(text, 0);
		return tolerant && isPlainObject(tolerant.value) ? tolerant.value : null;
	}
}

function extractAgentResultFromFencedJson(text) {
	const fencePattern = /```(?:json|agent-result|agent)?\s*\n([\s\S]*?)```/giu;
	let match = fencePattern.exec(text);
	while (match) {
		const parsed = tryParseJsonObject(match[1]);
		const payload = normalizeStudioAgentResult(parsed);
		if (payload) {
			return {
				payload,
				cleanedText: cleanExtractedText(
					joinTextAroundExtraction(
						text.slice(0, match.index),
						text.slice(match.index + match[0].length),
					),
				),
				source: "json-fence",
			};
		}

		match = fencePattern.exec(text);
	}

	return null;
}

function extractAgentResultFromBareJson(text) {
	const parsed = tryParseJsonObject(text);
	const payload = normalizeStudioAgentResult(parsed);
	if (!payload) {
		return null;
	}

	return {
		payload,
		cleanedText: "",
		source: "bare-json",
	};
}

function extractStudioAgentResultFromText(text) {
	const normalizedText = getNonEmptyString(text);
	if (!normalizedText) {
		return null;
	}

	return (
		extractAgentResultFromMarker(normalizedText) ||
		extractAgentResultFromFencedJson(normalizedText) ||
		extractAgentResultFromBareJson(normalizedText)
	);
}

function stripStudioAgentResultMarkersFromText(text) {
	const normalizedText = getNonEmptyString(text);
	if (!normalizedText) {
		return "";
	}

	const markerIndex = normalizedText.indexOf(AGENT_RESULT_STREAM_PREFIX);
	if (markerIndex === -1) {
		return normalizedText;
	}

	return normalizedText
		.slice(0, markerIndex)
		.replace(/\n{3,}/gu, "\n\n")
		.trim();
}

const CLARIFICATION_ANSWERS_PATTERN = /^\s*here are my clarification answers\b/i;
const AGENT_NAME_STOP_WORD_PATTERN =
	/\b(?:that|who|which|to|for|from|with|when|where|and)\b/iu;

function extractMessageText(message) {
	if (!message || typeof message !== "object") {
		return "";
	}

	if (typeof message.content === "string") {
		return message.content.trim();
	}

	if (typeof message.text === "string") {
		return message.text.trim();
	}

	if (Array.isArray(message.parts)) {
		return message.parts
			.map((part) => {
				if (typeof part === "string") {
					return part;
				}
				if (!part || typeof part !== "object") {
					return "";
				}
				if (part.type === "text" && typeof part.text === "string") {
					return part.text;
				}
				if (part.type === "text-delta" && typeof part.delta === "string") {
					return part.delta;
				}
				return "";
			})
			.join("")
			.trim();
	}

	return "";
}

function isClarificationAnswerText(value) {
	return CLARIFICATION_ANSWERS_PATTERN.test(value || "");
}

function isClarificationSubmitMessage(message) {
	return getNonEmptyString(message?.metadata?.source) === "clarification-submit";
}

function findOriginalAgentBrief({ prompt, messages } = {}) {
	const candidates = [];
	if (Array.isArray(messages)) {
		for (const message of messages) {
			const role = message?.role || message?.type;
			if (role !== "user") {
				continue;
			}
			const text = extractMessageText(message);
			if (!text || isClarificationSubmitMessage(message) || isClarificationAnswerText(text)) {
				continue;
			}
			candidates.push({
				text,
				isAgentCreation:
					getNonEmptyString(message?.metadata?.creationMode) === "agent",
			});
		}
	}

	const agentCreationCandidate = candidates.find((candidate) => (
		candidate.isAgentCreation
	));
	if (agentCreationCandidate) {
		return agentCreationCandidate.text;
	}

	const firstMessageCandidate = candidates.find((candidate) => candidate.text);
	if (firstMessageCandidate) {
		return firstMessageCandidate.text;
	}

	const fallbackPrompt = typeof prompt === "string" ? prompt.trim() : "";
	return fallbackPrompt && !isClarificationAnswerText(fallbackPrompt)
		? fallbackPrompt
		: "";
}

function normalizeWhitespace(value) {
	return getNonEmptyString(value)?.replace(/\s+/gu, " ") || "";
}

function sentenceCase(value) {
	const normalized = normalizeWhitespace(value);
	if (!normalized) {
		return "";
	}

	return `${normalized[0].toUpperCase()}${normalized.slice(1)}`;
}

function titleCase(value) {
	return normalizeWhitespace(value)
		.toLowerCase()
		.split(/\s+/u)
		.map((word) => {
			if (["and", "or", "for", "to", "of", "the", "a", "an"].includes(word)) {
				return word;
			}
			return `${word[0]?.toUpperCase() || ""}${word.slice(1)}`;
		})
		.join(" ")
		.replace(/^\w/u, (match) => match.toUpperCase());
}

function deriveObjectiveFromBrief(brief) {
	const normalizedBrief = normalizeWhitespace(brief)
		.replace(
			/^build\s+(?:an?\s+)?(?:(?:studio|rovo)\s+)?agent\s+(?:named|called)\s+.+?\s+(?:that|to|for)\s+/iu,
			"",
		)
		.replace(
			/^create\s+(?:an?\s+)?(?:(?:studio|rovo)\s+)?agent\s+(?:named|called)\s+.+?\s+(?:that|to|for)\s+/iu,
			"",
		)
		.replace(
			/^make\s+(?:an?\s+)?(?:(?:studio|rovo)\s+)?agent\s+(?:named|called)\s+.+?\s+(?:that|to|for)\s+/iu,
			"",
		)
		.replace(/^create\s+(?:an?\s+)?(?:(?:studio|rovo)\s+)?agent\s+(?:that|to|for)\s+/iu, "")
		.replace(/^build\s+(?:an?\s+)?(?:(?:studio|rovo)\s+)?agent\s+(?:that|to|for)\s+/iu, "")
		.replace(/^make\s+(?:an?\s+)?(?:(?:studio|rovo)\s+)?agent\s+(?:that|to|for)\s+/iu, "")
		.replace(/^use\s+the\s+.+?\s+template\s+to\s+create\s+(?:an?\s+)?(?:(?:studio|rovo)\s+)?agent\.?\s*/iu, "")
		.replace(/\.$/u, "");

	return normalizedBrief || "help with the requested Studio workflow";
}

function normalizeExplicitAgentName(value) {
	const normalized = normalizeWhitespace(value)
		.replace(/^["'“”]+|["'“”]+$/gu, "")
		.replace(/\s+(?:agent|assistant)$/iu, "")
		.trim();
	if (!normalized || normalized.length > 80) {
		return "";
	}

	return /[A-Z]/u.test(normalized) ? normalized : titleCase(normalized);
}

function deriveExplicitAgentName(brief) {
	const normalizedBrief = normalizeWhitespace(brief);
	const templateNameMatch = normalizedBrief.match(
		/^use\s+the\s+(.+?)\s+template\s+to\s+create\s+(?:an?\s+)?(?:(?:studio|rovo)\s+)?agent\b/iu,
	);
	if (templateNameMatch) {
		const templateName = normalizeExplicitAgentName(templateNameMatch[1]);
		if (templateName) {
			return templateName;
		}
	}

	const explicitNameMatch = normalizedBrief.match(
		/\b(?:named|called)\s+["'“”]?([^"'“”.,:;!?]+?)(?=\s+\b(?:that|who|which|to|for|from|with|when|where|and)\b|[.,:;!?]|$)/iu,
	);
	if (!explicitNameMatch) {
		return "";
	}

	const [firstSegment] = explicitNameMatch[1].split(AGENT_NAME_STOP_WORD_PATTERN);
	return normalizeExplicitAgentName(firstSegment);
}

function deriveFallbackAgentName(brief) {
	const normalizedBrief = normalizeWhitespace(brief);
	const explicitName = deriveExplicitAgentName(normalizedBrief);
	if (explicitName) {
		return explicitName;
	}

	if (/\bsupport\b/iu.test(normalizedBrief) && /\btriag(?:e|es|ing)\b/iu.test(normalizedBrief)) {
		return "Support Request Triage Agent";
	}
	if (/\brfp\b/iu.test(normalizedBrief) && /\bdraft(?:er|ing)?\b/iu.test(normalizedBrief)) {
		return "RFP Drafter";
	}
	if (/\bincident\b/iu.test(normalizedBrief) && /\btriag(?:e|es|ing)\b/iu.test(normalizedBrief)) {
		return "Incident Triage Agent";
	}

	// "Make me a chief of staff agent", "Create a policy checker agent" → use the
	// role named between the article and "agent" as the agent name.
	const roleMatch = /\b(?:an?)\s+([a-z][a-z\s-]{2,40}?)\s+agent\b/iu.exec(normalizedBrief);
	if (roleMatch) {
		const role = titleCase(roleMatch[1].trim().replace(/\s+/gu, " "));
		if (role) {
			return /\bagent$/iu.test(role) ? role : role;
		}
	}

	const objective = deriveObjectiveFromBrief(normalizedBrief)
		.split(/\b(?:,| and | then | while )\b/iu)[0]
		.replace(/\b(?:incoming|requested|clear|best)\b/giu, "")
		.trim();
	const words = objective
		.split(/\s+/u)
		.filter((word) => /^[a-z0-9-]+$/iu.test(word))
		.slice(0, 4);
	if (words.length > 0) {
		const title = titleCase(words.join(" "));
		return /\bagent$/iu.test(title) ? title : `${title} Agent`;
	}

	return "Custom Studio Agent";
}

function normalizeAnswerText(value) {
	if (Array.isArray(value)) {
		return value.map(normalizeAnswerText).filter(Boolean).join(", ");
	}
	if (isPlainObject(value)) {
		return (
			getNonEmptyString(value.label) ||
			getNonEmptyString(value.text) ||
			getNonEmptyString(value.value) ||
			""
		);
	}
	return getNonEmptyString(value) || "";
}

function normalizeClarificationAnswerEntries(clarificationAnswers) {
	if (!isPlainObject(clarificationAnswers)) {
		return [];
	}

	return Object.entries(clarificationAnswers)
		.map(([question, answer]) => ({
			question: normalizeWhitespace(question),
			answer: normalizeAnswerText(answer),
		}))
		.filter((entry) => entry.question && entry.answer);
}

function detectToolsFromText(text) {
	const tools = [];
	const addTool = (label, pattern) => {
		if (pattern.test(text) && !tools.includes(label)) {
			tools.push(label);
		}
	};

	addTool("Jira Service Management", /\bjira service management\b|\bjsm\b/iu);
	addTool("Jira", /\bjira\b/iu);
	addTool("Confluence", /\bconfluence\b|\bwiki\b/iu);
	addTool("Slack", /\bslack\b/iu);
	addTool("GitHub", /\bgithub\b|\bpull request\b|\bpr\b/iu);
	addTool("Email", /\bemail\b|\binbox\b|\bgmail\b/iu);

	return tools.filter((tool, index) => (
		tool !== "Jira" || !tools.slice(0, index).includes("Jira Service Management")
	));
}

// App catalog ids the deterministic fallback can recognize from a brief, so the
// generated agent wires the apps the user named even when the AI Gateway is
// unavailable (rate-limited). Emitted as `@[app:<id>]` mention chips in the
// instructions; the frontend ingest (repairGeneratedAgentCatalog) then derives
// the canonical apps[] membership and expands each to its tool/knowledge facets.
const FALLBACK_APP_PATTERNS = [
	{ id: "jira-service-management", name: "Jira Service Management", pattern: /\bjira service management\b|\bjsm\b/iu },
	{ id: "jira", name: "Jira", pattern: /\bjira\b/iu },
	{ id: "confluence", name: "Confluence", pattern: /\bconfluence\b|\bwiki\b/iu },
	{ id: "slack", name: "Slack", pattern: /\bslack\b/iu },
	{ id: "gmail", name: "Gmail", pattern: /\bgmail\b/iu },
	{ id: "google-calendar", name: "Google Calendar", pattern: /\bgoogle calendar\b|\bcalendar\b/iu },
	{ id: "salesforce", name: "Salesforce", pattern: /\bsalesforce\b/iu },
	{ id: "github", name: "GitHub", pattern: /\bgithub\b/iu },
	{ id: "outlook", name: "Microsoft Outlook", pattern: /\boutlook\b/iu },
	{ id: "notion", name: "Notion", pattern: /\bnotion\b/iu },
	{ id: "projects", name: "Projects", pattern: /\batlassian projects\b|\bprojects\b/iu },
];

function detectAppsFromText(text) {
	const apps = [];
	const seen = new Set();
	for (const { id, name, pattern } of FALLBACK_APP_PATTERNS) {
		if (pattern.test(text) && !seen.has(id)) {
			seen.add(id);
			apps.push({ id, name });
		}
	}
	// Prefer the more specific Jira Service Management over plain Jira.
	if (seen.has("jira-service-management")) {
		return apps.filter((app) => app.id !== "jira");
	}
	return apps;
}

// Maps a brief's recurring-schedule language to a trigger label that the
// frontend `inferScheduledTriggerDefinitions` hydrates into a structured
// scheduled trigger (e.g. the daily-at-7am preset). Returns null when the brief
// describes no recurring cadence.
function detectScheduleTrigger(text) {
	if (/\b(7|seven)(:\.?0{0,2})?\s*(am|a\.m\.)\b|\b7\s*o'?clock\b/iu.test(text)) {
		return "Every day at 7:00 AM.";
	}
	if (/\b(hourly|every hour|each hour)\b/iu.test(text)) {
		return "Every hour.";
	}
	if (/\b(weekday morning|every morning|each morning|start of the workday|every weekday)\b/iu.test(text)) {
		return "Every weekday morning.";
	}
	return null;
}

function buildClarificationSummary(entries) {
	if (!Array.isArray(entries) || entries.length === 0) {
		return "";
	}

	return entries
		.map((entry) => `- **${entry.question}** ${entry.answer}`)
		.join("\n");
}

function buildFallbackConversationStarters({ brief, name }) {
	const normalizedBrief = normalizeWhitespace(brief);
	if (/\bsupport\b/iu.test(normalizedBrief)) {
		return [
			"Triage this incoming support request.",
			"Ask for any missing priority and reproduction details.",
			"Draft the next action for the support team.",
		];
	}

	const base = name.replace(/\s+Agent$/u, "");
	return [
		`Help me with a new ${base.toLowerCase()} request.`,
		"Review this context and identify what is missing.",
		"Draft the next recommended action.",
	];
}

function buildFallbackStudioAgentResult({
	prompt,
	messages,
	clarificationAnswers,
} = {}) {
	const brief = findOriginalAgentBrief({ prompt, messages });
	const objective = deriveObjectiveFromBrief(brief);
	const name = deriveFallbackAgentName(brief);
	const entries = normalizeClarificationAnswerEntries(clarificationAnswers);
	const answerText = entries.map((entry) => `${entry.question} ${entry.answer}`).join("\n");
	const combinedText = [brief, answerText].filter(Boolean).join("\n");
	const tools = detectToolsFromText(combinedText);
	const apps = detectAppsFromText(combinedText);
	const scheduleTrigger = detectScheduleTrigger(combinedText);
	const description = sentenceCase(objective).replace(/\.$/u, ".");
	const clarificationSummary = buildClarificationSummary(entries);
	const instructions = [
		"## Instructions",
		"",
		`You are ${name}. Your job is to ${objective}.`,
		"",
		"- **Intake** Read the user's request, identify the desired outcome, and note any missing context before acting.",
		"- **Workflow** Classify the request, gather missing details, and draft a clear next action that the team can use immediately.",
		"- **Communication** Keep responses professional, concise, and explicit about assumptions.",
		"- **Guardrails** Do not invent facts, priorities, owners, or system state. Ask for confirmation before recommending irreversible or high-impact action.",
		...(clarificationSummary
			? [
					"",
					"## Confirmed Details",
					"",
					clarificationSummary,
				]
			: []),
		...(apps.length > 0
			? [
					"",
					"## Apps",
					"",
					`Connect ${apps.map((app) => `@[app:${app.id}]`).join(", ")} and use them for the context this agent needs.`,
				]
			: []),
		...(tools.length > 0
			? [
					"",
					"## Tools",
					"",
					`Use ${tools.join(", ")} when the request requires context from those systems.`,
				]
			: []),
		...(scheduleTrigger
			? [
					"",
					"## Triggers",
					"",
					`- ${scheduleTrigger} Deliver the readout automatically on this schedule.`,
				]
			: []),
		"",
		"## Validation",
		"",
		"- Before finalizing, confirm the response includes the classification, missing details, and next action.",
	].join("\n");

	return normalizeStudioAgentResult({
		agentId: slugify(name),
		name,
		byline: DEFAULT_GENERATED_AGENT_BYLINE,
		description,
		instructions,
		contextDescription: instructions,
		conversationStarters: buildFallbackConversationStarters({ brief, name }),
		tools,
		...(apps.length > 0 ? { apps: apps.map((app) => app.name) } : {}),
		triggers: scheduleTrigger ? [scheduleTrigger] : [],
		trigger: scheduleTrigger || "When a user asks for help with this workflow.",
		guardrail:
			"Ask for missing context before making priority, ownership, or escalation recommendations.",
		avatarFallback: { initials: getInitials(name) },
		action: "create",
	});
}

function buildCreationModeContextPrefix(creationMode) {
	if (creationMode === "agent") {
		return `[AGENT CREATION MODE]
You are in agent creation mode. Help the user create a session-local agent profile for Studio.
This is a local agent definition - not a Confluence page, Jira ticket, or any Atlassian product content.
Before building, understand the user's brief and any template context provided, then run ONE focused clarification round FIRST using the ask_user_questions tool — 2 to 4 targeted questions, each offering a few recommended options. Cover whichever of these the brief leaves unclear: purpose & scope, target users, knowledge/data sources, tone & persona, key tasks/workflows, triggers, tools/integrations, and guardrails. Skip the round only when those are already specified; you may run ONE more adaptive round if essentials are still missing, but never exceed 2 rounds.
Do not call POST /api/plan/agents or any persistence endpoint; durable agent persistence is out of scope for this v1.
Write instructions as structured Markdown matching repo-local agent definitions: start with ## Instructions, use clear paragraphs, bullet lists with bold labels, and include optional ## Knowledge, ## Triggers, and ## Validation sections only when relevant.
When ready, emit exactly one structured result marker outside code fences:
AGENT_RESULT: {"agentId":"stable-slug","name":"Display name","byline":"Custom agent by You","description":"Short profile summary","instructions":"## Instructions\\n\\nYou are Display name. Describe the role, scope, and operating style.\\n\\n- **Summary** Explain the agent's main responsibility.\\n- **Workflow** Describe how it should handle requests.\\n\\n## Validation\\n\\n- Confirm the output is ready for the user's next step.","conversationStarters":["Starter prompt 1","Starter prompt 2","Starter prompt 3"],"tools":["Jira","Confluence"],"trigger":"When a user asks about X","guardrail":"Never modify data without explicit confirmation","avatarFallback":{"initials":"DA"},"action":"create"}
Populate tools with the integrations the agent relies on (use [] when none apply); include trigger and guardrail when they apply, otherwise omit them.
Do not include edit, delete, approval, publishing, or real tool-binding controls in the result.
[END AGENT CREATION MODE]`;
	}

	if (creationMode === "skill") {
		return `[SKILL CREATION MODE]
You are in skill creation mode. Help the user create a new skill definition file.
This is a local skill definition - not a Confluence page, Jira ticket, or any Atlassian product content.
Ask clarifying questions when required fields are missing.
Return a complete, production-ready definition that can be persisted directly.
Once ready, call POST /api/plan/skills to persist it.
[END SKILL CREATION MODE]`;
	}

	return null;
}

function shouldSurfaceMissingStudioAgentResultFailure({
	creationMode,
	hasAgentResult,
	hasDeferredToolRequest,
	hasPlanWidget,
	hasQuestionCard,
}) {
	return (
		creationMode === "agent" &&
		!hasAgentResult &&
		!hasQuestionCard &&
		!hasPlanWidget &&
		!hasDeferredToolRequest
	);
}

// Whether the AI Gateway call for a Studio agent-creation turn must be wrapped
// in the bounded fallback timeout. This MUST be true for every agent-creation
// turn, not just post-clarification turns: if the gateway call hangs without
// resolving or rejecting, the stream's execute() awaits forever, the SSE
// response never closes, and the Studio UI latches in the "generating" state
// with no agent result and no error (the recurring /studio stuck-generation
// bug). Bounding the call guarantees execute() resolves so a deterministic
// fallback result (or retryable failure) is always emitted and the stream
// closes.
function shouldBoundStudioAgentGatewayCall({ creationMode } = {}) {
	return creationMode === "agent";
}

function buildMissingStudioAgentResultFailureParts({
	id = `studio-agent-result-failure-${Date.now()}`,
} = {}) {
	const message =
		"I couldn't create a selectable agent profile from that response. Please retry the agent creation request.";

	return [
		{ type: "text-start", id },
		{
			type: "text-delta",
			id,
			delta: message,
		},
		{ type: "text-end", id },
		{
			type: "data-widget-error",
			id: `${id}-widget`,
			data: {
				type: STUDIO_AGENT_RESULT_WIDGET_TYPE,
				code: MISSING_STUDIO_AGENT_RESULT_ERROR_CODE,
				message,
				details:
					"Agent creation mode requires a structured data-agent-result with name, description, instructions/context, and conversation starters.",
				canRetry: true,
			},
		},
	];
}

module.exports = {
	AGENT_RESULT_STREAM_PREFIX,
	MISSING_STUDIO_AGENT_RESULT_ERROR_CODE,
	STUDIO_AGENT_RESULT_WIDGET_TYPE,
	buildCreationModeContextPrefix,
	buildFallbackStudioAgentResult,
	buildMissingStudioAgentResultFailureParts,
	extractStudioAgentResultFromText,
	findOriginalAgentBrief,
	findJsonObjectEndIndex,
	normalizeStudioAgentResult,
	parseJsonObjectAt,
	shouldBoundStudioAgentGatewayCall,
	shouldSurfaceMissingStudioAgentResultFailure,
	stripStudioAgentResultMarkersFromText,
	tolerantParseJsonObjectAt,
};
