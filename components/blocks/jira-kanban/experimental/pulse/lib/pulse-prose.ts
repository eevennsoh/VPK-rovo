/**
 * Deterministic highlighter for Pulse outcome copy.
 *
 * Fixture paragraphs stay plain strings. This walk is the only place that
 * decides what is an issue key versus a type name, so every story — Adapter
 * deleted through Two blockers, plus member-scoped summaries — renders the same way.
 *
 * - Issue keys (`PAY-102`) become lozenges.
 * - Explicit backtick spans become inline code.
 * - PascalCase type names with at least three capitals (`LegacyGatewayAdapter`)
 *   become inline code. Two-hump product names (`LaunchDarkly`) and ordinary
 *   words (`Monday`, `v1`, `v2`) stay prose.
 */

export type PulseProseToken =
	| { type: "text"; value: string }
	| { type: "code"; value: string }
	| { type: "issue-key"; value: string };

const PULSE_PROSE_TOKEN =
	/`([^`]+)`|\b([A-Z][A-Z0-9]+-\d+)\b|\b([A-Z][a-z]+(?:[A-Z][a-zA-Z0-9]+)+)\b/g;

function uppercaseCount(value: string): number {
	let count = 0;
	for (const character of value) {
		if (character >= "A" && character <= "Z") {
			count += 1;
		}
	}
	return count;
}

function isTypeIdentifier(value: string): boolean {
	return uppercaseCount(value) >= 3;
}

export function tokenizePulseProse(text: string): readonly PulseProseToken[] {
	const tokens: PulseProseToken[] = [];
	let lastIndex = 0;

	for (const match of text.matchAll(PULSE_PROSE_TOKEN)) {
		const index = match.index ?? 0;
		if (index > lastIndex) {
			tokens.push({ type: "text", value: text.slice(lastIndex, index) });
		}

		const backtickValue = match[1];
		const issueKey = match[2];
		const typeName = match[3];
		const matched = match[0];

		if (backtickValue !== undefined) {
			tokens.push({ type: "code", value: backtickValue });
		} else if (issueKey !== undefined) {
			tokens.push({ type: "issue-key", value: issueKey });
		} else if (typeName !== undefined && isTypeIdentifier(typeName)) {
			tokens.push({ type: "code", value: typeName });
		} else {
			tokens.push({ type: "text", value: matched });
		}

		lastIndex = index + matched.length;
	}

	if (lastIndex < text.length) {
		tokens.push({ type: "text", value: text.slice(lastIndex) });
	}

	return tokens.length > 0 ? tokens : [{ type: "text", value: text }];
}
