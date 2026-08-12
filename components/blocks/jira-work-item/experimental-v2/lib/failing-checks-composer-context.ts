/**
 * Short demo-scale prompt context for failing CI checks staged in the activity
 * composer. Keep this concise — storytelling, not a real PR-fix template.
 */
export function serializeFailingChecksContext(
	checks: readonly Readonly<{ name: string; details: string }>[],
): string {
	if (checks.length === 0) {
		return "";
	}

	const lines = checks.map((check) => `- ${check.name}: ${check.details}`);
	return ["Failing PR checks:", ...lines].join("\n");
}

export const FAILING_CHECKS_COMPOSER_PROMPT = "Fix the failing CI check(s) on this PR.";
