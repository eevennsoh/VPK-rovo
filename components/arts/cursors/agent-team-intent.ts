// Detects when a spoken phrase asks Rovo to spin up a *team* of agents — the
// trigger for the cursor fan-out in the Cursors art. Plural/team intent only:
// "create an agent" (singular) should not fan out into many cursors.

const TEAM_OF = /\bteam of (agents|bots|rovos?|assistants)\b/;
const CREATE_VERBS = /\b(create|build|make|spin ?up|assemble|set ?up|generate|add|give me|need|want|gather|summon)\b/;
const PLURAL_AGENTS = /\bagents\b/;

export function detectAgentTeamIntent(text: string | null | undefined): boolean {
	if (!text) {
		return false;
	}

	const normalized = text.toLowerCase();

	// "a team of agents" / "team of bots" — explicit team language.
	if (TEAM_OF.test(normalized)) {
		return true;
	}

	// A creation verb paired with plural "agents" — e.g. "make a few agents".
	return PLURAL_AGENTS.test(normalized) && CREATE_VERBS.test(normalized);
}
