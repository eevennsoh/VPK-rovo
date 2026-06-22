const BARE_APP_MENTION_PATTERN = /(^|[\s(>"'])[@/](?!\[)([A-Za-z][A-Za-z0-9.+_-]*)/giu;
const CODE_REGION_PATTERN = /```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`/g;

function slugifyAppMentionId(value) {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createAppMentionMatchers(aliases) {
	return [...aliases]
		.map(({ id, name }) => ({ id, name: (name ?? "").trim() }))
		.filter((entry) => entry.name.length > 0)
		.sort((a, b) => b.name.length - a.name.length)
		.map(({ id, name }) => ({
			id,
			pattern: new RegExp(
				`(^|[\\s(>"'])[@/](?!\\[)(?:${escapeRegExp(name).replace(/\s+/g, "\\s+")})(?=$|[\\s.,;:!?)\\]"'])`,
				"giu",
			),
		}));
}

function rewriteSegment(segment, matchers) {
	let next = segment;
	for (const { id, pattern } of matchers) {
		next = next.replace(pattern, (_full, lead) => `${lead}@[app:${id}]`);
	}
	next = next.replace(BARE_APP_MENTION_PATTERN, (full, lead, word) => {
		const mentionText = word.replace(/[.,;:!?]+$/gu, "");
		const trailing = word.slice(mentionText.length);
		const slug = slugifyAppMentionId(mentionText);
		return slug ? `${lead}@[app:${slug}]${trailing}` : full;
	});
	return next;
}

function convertBareAppMentionsToTokens(text, aliases) {
	if (typeof text !== "string" || text.length === 0) {
		return text;
	}

	const matchers = createAppMentionMatchers(aliases);
	let result = "";
	let lastIndex = 0;
	for (const match of text.matchAll(CODE_REGION_PATTERN)) {
		const index = match.index ?? 0;
		result += rewriteSegment(text.slice(lastIndex, index), matchers);
		result += match[0];
		lastIndex = index + match[0].length;
	}
	result += rewriteSegment(text.slice(lastIndex), matchers);
	return result;
}

function createBareAppMentionConverter(aliases) {
	let matchers = null;
	return (text) => {
		if (typeof text !== "string" || text.length === 0) {
			return text;
		}
		matchers ??= createAppMentionMatchers(aliases);

		let result = "";
		let lastIndex = 0;
		for (const match of text.matchAll(CODE_REGION_PATTERN)) {
			const index = match.index ?? 0;
			result += rewriteSegment(text.slice(lastIndex, index), matchers);
			result += match[0];
			lastIndex = index + match[0].length;
		}
		result += rewriteSegment(text.slice(lastIndex), matchers);
		return result;
	};
}

module.exports = {
	convertBareAppMentionsToTokens,
	createBareAppMentionConverter,
};
