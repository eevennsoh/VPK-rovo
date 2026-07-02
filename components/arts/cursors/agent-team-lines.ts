// Funny, casual one-liners Rovo "says" when the cursor fans out into a team.
// A mix of squad energy, the Spider-Man pointing meme, and Rovo-maxxing /
// world-domination hype. Kept short so they fit the single-line speech bubble.
export const AGENT_TEAM_LINES = [
	"The Rovo gang's all here.",
	"One Rovo? Nah, we roll deep.",
	"You. You. And you. Let's go.",
	"You get an agent, you get an agent…",
	"Rovo-maxxing. Time to conquer. 🌍",
	"Maximum Rovo. World domination loading…",
	"Why have one Rovo when you can have five?",
	"It's giving… whole team.",
] as const;

/**
 * Pick a random line, avoiding an immediate repeat of `previous` so back-to-back
 * fan-outs feel fresh.
 */
export function pickAgentTeamLine(previous?: string | null): string {
	const candidates = previous
		? AGENT_TEAM_LINES.filter((line) => line !== previous)
		: AGENT_TEAM_LINES;
	const pool = candidates.length > 0 ? candidates : AGENT_TEAM_LINES;
	const index = Math.floor(Math.random() * pool.length);
	return pool[index];
}
