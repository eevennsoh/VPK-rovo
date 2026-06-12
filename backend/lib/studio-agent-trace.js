/**
 * Scripted chain-of-thought trace for Studio agent creation on the
 * AI Gateway code path.
 *
 * The AI Gateway turn has no real tool-call harness — the model just returns
 * a JSON envelope describing the agent. Without a backend trace the
 * `<AssistantThinkingTrace>` collapsible has nothing to render and the body
 * stays empty (see `thinking-status-state.ts`: the trigger appears, but
 * `isThinkingStatusActive` only returns true when at least one
 * `data-thinking-event` part has arrived). This module builds a *contextual*
 * step list derived from the user's prompt and prior Q&A so the UI shows
 * a believable, brief-specific trace during the gateway's buffering window.
 *
 * The output shape matches what `writeThinkingTraceSteps` (in
 * `backend/lib/thinking-trace-writer.js`) consumes: each step needs
 * `toolName`, `toolCallId`, `label`, optional `content`, optional `input`,
 * and optional `output` / `outputPreview`.
 */

const TOOL_KEYWORD_GROUPS = [
	{ key: "jira", label: "Jira", patterns: [/\bjira\b/i, /\bissue tracker\b/i] },
	{ key: "confluence", label: "Confluence", patterns: [/\bconfluence\b/i, /\bwiki\b/i] },
	{ key: "slack", label: "Slack", patterns: [/\bslack\b/i] },
	{ key: "github", label: "GitHub", patterns: [/\bgithub\b/i, /\bpull request\b/i, /\bpr review\b/i] },
	{ key: "email", label: "Email", patterns: [/\bemail\b/i, /\binbox\b/i, /\bgmail\b/i] },
	{ key: "calendar", label: "Calendar", patterns: [/\bcalendar\b/i, /\bmeeting\b/i, /\bschedul(?:e|ing)\b/i] },
	{ key: "search", label: "Web search", patterns: [/\bweb search\b/i, /\bgoogle it\b/i, /\bsearch the web\b/i] },
	{ key: "browse", label: "Web browsing", patterns: [/\bbrows(?:e|ing)\b/i, /\bvisit (?:a )?(?:the )?(?:url|site|page)\b/i] },
	{ key: "code", label: "Code", patterns: [/\bcode\b/i, /\brepo\b/i, /\brepository\b/i, /\bcodebase\b/i] },
	{ key: "file", label: "Files", patterns: [/\bfile(s)?\b/i, /\battachment(s)?\b/i, /\bdocument(s)?\b/i] },
];

const MAX_PROMPT_PREVIEW_CHARS = 180;
const MAX_QA_PREVIEW_CHARS = 220;

function truncate(text, maxChars) {
	if (typeof text !== "string") {
		return "";
	}
	const trimmed = text.trim().replace(/\s+/g, " ");
	if (trimmed.length <= maxChars) {
		return trimmed;
	}
	return `${trimmed.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

function getMessageRole(message) {
	if (!message || typeof message !== "object") {
		return null;
	}
	if (typeof message.role === "string") {
		return message.role;
	}
	if (typeof message.type === "string") {
		return message.type === "assistant" ? "assistant" : "user";
	}
	return null;
}

function getMessageText(message) {
	if (!message || typeof message !== "object") {
		return "";
	}
	if (typeof message.content === "string") {
		return message.content;
	}
	if (Array.isArray(message.content)) {
		return message.content
			.map((part) => {
				if (!part) return "";
				if (typeof part === "string") return part;
				if (typeof part.text === "string") return part.text;
				return "";
			})
			.filter(Boolean)
			.join("\n");
	}
	if (typeof message.text === "string") {
		return message.text;
	}
	return "";
}

function detectMentionedTools(text) {
	if (typeof text !== "string" || text.length === 0) {
		return [];
	}
	const matched = [];
	for (const group of TOOL_KEYWORD_GROUPS) {
		if (group.patterns.some((pattern) => pattern.test(text))) {
			matched.push(group.label);
		}
	}
	return matched;
}

/**
 * Parses the template's resolved setup (exact display names + trigger phrases +
 * mode behaviors) out of the hidden `contextDescription`. The studio creation
 * context emits two stable-prefixed lines for exactly this purpose
 * (`Setup for narration (display names):` and `Trigger events for narration:`),
 * so the trace can name the real configuration verbatim — no backend→catalog
 * coupling, no de-kebab guessing. Returns `null` for from-scratch agents (no
 * template context), so the caller falls back to prompt-keyword narration.
 */
function parseTemplateSetupFromContext(contextDescription) {
	if (typeof contextDescription !== "string" || contextDescription.length === 0) {
		return null;
	}
	const setup = { tools: [], skills: [], knowledge: [], subagents: [], modes: [], triggers: [] };

	const setupLine = contextDescription.match(/Setup for narration \(display names\):\s*(.+)/);
	if (setupLine) {
		for (const segment of setupLine[1].split(";")) {
			const m = segment.match(/\s*(tools|skills|knowledge|subagents|modes)=\[([^\]]*)\]/);
			if (m) {
				setup[m[1]] = m[2].split(",").map((s) => s.trim()).filter(Boolean);
			}
		}
	}
	const triggerLine = contextDescription.match(/Trigger events for narration:\s*(.+)/);
	if (triggerLine) {
		setup.triggers = triggerLine[1].split("|").map((s) => s.trim()).filter(Boolean);
	}

	const hasAny =
		setup.tools.length > 0 ||
		setup.skills.length > 0 ||
		setup.knowledge.length > 0 ||
		setup.subagents.length > 0 ||
		setup.triggers.length > 0;
	return hasAny ? setup : null;
}

// Providers that require a connection — the ones a connect step narrates.
const CONNECTABLE_PROVIDERS = [
	{ label: "Slack", pattern: /\bslack\b|#|\bchannel\b/i },
	{ label: "GitHub", pattern: /\bgithub\b|\bgitlab\b|\bpull request\b|\bcommit\b|\bbranch\b|release is cut/i },
	{ label: "Microsoft Teams", pattern: /\bteams\b/i },
	{ label: "Sentry", pattern: /\bsentry\b|\berror\b|\bexception\b|\bcrash\b|spike/i },
	{ label: "PagerDuty", pattern: /\bpagerduty\b|on-?call|\bincident\b|\balert\b|\bpages?\b/i },
	{ label: "Linear", pattern: /\blinear\b/i },
];

/** Connectable provider labels referenced by the template's trigger phrases. */
function connectableProvidersFromTriggers(triggers) {
	const found = [];
	for (const provider of CONNECTABLE_PROVIDERS) {
		if (triggers.some((t) => provider.pattern.test(t)) && !found.includes(provider.label)) {
			found.push(provider.label);
		}
	}
	return found;
}

/** Joins a list into "a, b, and c" prose for trace narration. */
function joinNames(items) {
	const list = items.filter(Boolean);
	if (list.length === 0) return "";
	if (list.length === 1) return list[0];
	if (list.length === 2) return `${list[0]} and ${list[1]}`;
	return `${list.slice(0, -1).join(", ")}, and ${list[list.length - 1]}`;
}

function findPriorAssistantQuestion(messages) {
	if (!Array.isArray(messages)) {
		return null;
	}
	for (let i = messages.length - 1; i >= 0; i--) {
		const message = messages[i];
		if (getMessageRole(message) !== "assistant") {
			continue;
		}
		const text = getMessageText(message);
		if (text && /\?/.test(text)) {
			return text;
		}
	}
	return null;
}

function summarizeQAExchange(messages, userAnswer) {
	const question = findPriorAssistantQuestion(messages);
	if (!question && !userAnswer) {
		return null;
	}
	const parts = [];
	if (question) {
		parts.push(`Q: ${truncate(question, 110)}`);
	}
	if (userAnswer) {
		parts.push(`A: ${truncate(userAnswer, 110)}`);
	}
	return truncate(parts.join(" — "), MAX_QA_PREVIEW_CHARS);
}

function deriveAgentNameHint(userPrompt) {
	if (typeof userPrompt !== "string") {
		return "an agent";
	}
	const match = userPrompt.match(
		/\b(?:an?|the)\s+([a-z][a-z0-9-]*(?:\s+[a-z][a-z0-9-]*){0,3})\s+agent\b/i,
	);
	if (match?.[1]) {
		return `${match[1].trim()} agent`;
	}
	const verbMatch = userPrompt.match(/\b(helps?|assists?|reviews?|summari[sz]es?|tracks?|monitors?|drafts?)\s+([^.!?\n]{3,60})/i);
	if (verbMatch) {
		return `agent that ${verbMatch[1].toLowerCase()} ${truncate(verbMatch[2], 50)}`;
	}
	return "an agent";
}

// Follow-up turns arrive as a structured clarification-answers payload rather
// than a fresh brief (e.g. `Here are my clarification answers for "…": …`).
// That text is not a usable agent focus, so it must never be spliced into the
// trace subtitles verbatim.
const CLARIFICATION_ANSWERS_PATTERN = /^\s*here are my clarification answers\b/i;

// Keep the focus short enough to read as a single-line subtitle once a prefix
// like "Writing role, scope, and guardrails for " is prepended.
const MAX_FOCUS_CHARS = 48;

// Generic focus used whenever the prompt doesn't yield a clean, short agent
// descriptor. Splicing raw prompt text into subtitles risks leaking long or
// structured payloads (clarification answers, pasted briefs), so we fall back
// to this instead of truncating arbitrary prose mid-sentence.
const GENERIC_AGENT_FOCUS = "the agent";

// Only reuse the raw prompt as a focus when it reads like a short, single-clause
// brief. Anything longer or multi-sentence/structured falls back to the generic
// focus so trace subtitles never show a truncated dump.
function isUsableRawFocus(text) {
	if (text.length === 0 || text.length > MAX_FOCUS_CHARS) {
		return false;
	}
	// Reject multi-sentence or list-like payloads (newlines, bullet markers,
	// or multiple sentence terminators) — these are never a clean focus.
	if (/[\n\r]/.test(text) || /[•\-*]\s/.test(text)) {
		return false;
	}
	const sentenceTerminators = text.match(/[.!?](?:\s|$)/g);
	return !sentenceTerminators || sentenceTerminators.length <= 1;
}

function deriveAgentBriefFocus(userPrompt) {
	if (typeof userPrompt !== "string" || userPrompt.trim().length === 0) {
		return GENERIC_AGENT_FOCUS;
	}

	if (CLARIFICATION_ANSWERS_PATTERN.test(userPrompt)) {
		return GENERIC_AGENT_FOCUS;
	}

	const explicitAgent = deriveAgentNameHint(userPrompt);
	if (explicitAgent !== "an agent" && !explicitAgent.startsWith("agent that ")) {
		return truncate(explicitAgent, MAX_FOCUS_CHARS);
	}

	const normalized = userPrompt.trim().replace(/\s+/g, " ");
	return isUsableRawFocus(normalized) ? normalized : GENERIC_AGENT_FOCUS;
}

// Each trace step shows a randomized 1–4 stacked narration rows so the demo
// reads as believable, dynamic progression rather than a single static line.
const MIN_PROGRESSION_ROWS = 1;
const MAX_PROGRESSION_ROWS = 4;

function randomInt(min, max, random) {
	const source = typeof random === "function" ? random() : Math.random();
	const clamped = Math.min(1, Math.max(0, Number.isFinite(source) ? source : Math.random()));
	// Clamp the result so a source of exactly 1.0 doesn't overshoot `max`.
	return Math.min(max, min + Math.floor(clamped * (max - min + 1)));
}

/**
 * Build the stacked narration rows for a step. Each row is its own collapsible
 * sub-step: `{ content, input, outputPreview }`. The first row (`primary`)
 * always leads; then a randomized number of the supplied `detail` rows (in
 * order) are appended so the total is between 1 and 4 rows. Detail rows without
 * usable `content` are skipped so the count never silently collapses.
 *
 * @param {{content:string,input?:unknown,outputPreview?:string}} primary
 * @param {Array<{content:string,input?:unknown,outputPreview?:string}>} [detail]
 * @param {() => number} [random]        — random source (injectable for tests)
 * @returns {Array<{content:string,input?:unknown,outputPreview?:string}>} 1–4 rows
 */
function buildProgressionRows(primary, detail = [], random) {
	const rows = [primary];
	const usableDetail = detail.filter(
		(row) => row && typeof row.content === "string" && row.content.trim().length > 0,
	);
	if (usableDetail.length === 0) {
		return rows;
	}

	const maxExtra = Math.min(usableDetail.length, MAX_PROGRESSION_ROWS - MIN_PROGRESSION_ROWS);
	const extraCount = randomInt(0, maxExtra, random);
	rows.push(...usableDetail.slice(0, extraCount));
	return rows;
}

/**
 * Build an ordered list of thinking-trace steps for a Studio agent-creation
 * turn on the AI Gateway path.
 *
 * The trace is split across two turns, keyed off whether a prior assistant
 * turn exists in `messages`:
 * - Turn 1 (no prior assistant turn): `read_brief` + an "open" `ask_user_questions`
 *   step (no result event) so the turn ends in the awaiting-user-response state.
 * - Turn 2 (user has answered): `read_brief` + `review_answers` + the full build
 *   sequence (`select_tools` → `draft_instructions` → `name_agent` → `save_profile`).
 *
 * @param {object} params
 * @param {string} [params.userPrompt]          — the latest user message text
 * @param {Array}  [params.messages]            — conversation history (role + content)
 * @param {string} [params.contextDescription]  — optional hidden context (unused for output but kept for future heuristics)
 * @returns {Array<object>} step descriptors consumable by `writeThinkingTraceSteps`
 */
function buildStudioAgentCreationTrace({ userPrompt, messages, contextDescription, random, isFollowUpTurn } = {}) {
	const promptText = typeof userPrompt === "string" ? userPrompt : "";
	const traceIdPrefix = `studio-agent-trace-${Date.now()}`;
	// When the turn carries a template context, narrate the real resolved setup
	// (exact display names) instead of prompt-keyword guesses. Null for from-scratch.
	const setup = parseTemplateSetupFromContext(contextDescription);
	const steps = [];

	// Attaches randomized 1–4 stacked narration rows to a step. Each row is its
	// own collapsible sub-step with its own Parameters/Result. `content` mirrors
	// the lead row for single-string consumers; `contentRows` carries the full
	// stack the trace writer streams progressively, and the step's top-level
	// `input`/`outputPreview` mirror the lead row so the step's own detail block
	// matches the first sub-step.
	const withProgression = (step, primary, detail) => {
		const contentRows = buildProgressionRows(primary, detail, random);
		const leadRow = contentRows[0];
		return {
			...step,
			content: leadRow.content,
			input: leadRow.input,
			outputPreview: leadRow.outputPreview,
			contentRows,
		};
	};

	const briefPreview = truncate(promptText, MAX_PROMPT_PREVIEW_CHARS) || "User did not supply a brief.";
	const agentFocus = deriveAgentBriefFocus(promptText);
	steps.push(
		withProgression(
			{
				toolName: "studio.read_brief",
				toolCallId: `${traceIdPrefix}-read-brief`,
				label: "Reading agent brief",
			},
			{
				content: `Identifying the job, audience, and expected outcome for ${agentFocus}.`,
				input: { prompt: briefPreview },
				outputPreview: `Agent brief captured: ${briefPreview}`,
			},
			[
				{
					content: "Parsing the brief for the core task and success criteria.",
					input: { step: "parse_task" },
					outputPreview: "Core task and success criteria extracted.",
				},
				{
					content: "Noting the intended audience and tone.",
					input: { step: "audience_tone" },
					outputPreview: "Audience and tone recorded.",
				},
				{
					content: "Flagging any constraints to respect while drafting.",
					input: { step: "constraints" },
					outputPreview: "Constraints flagged for the draft.",
				},
			],
		),
	);

	const qaSummary = summarizeQAExchange(messages, promptText);
	// `isFollowUpTurn` (when supplied by the caller) is the authoritative turn
	// signal so the scripted trace stays in lockstep with the server's turn
	// gating; fall back to inferring from message history for standalone callers
	// (e.g. unit tests).
	const hadPriorAssistantTurn = typeof isFollowUpTurn === "boolean"
		? isFollowUpTurn
		: Array.isArray(messages)
			&& messages.some((m) => getMessageRole(m) === "assistant" && getMessageText(m).trim().length > 0);
	if (hadPriorAssistantTurn && qaSummary) {
		steps.push(
			withProgression(
				{
					toolName: "studio.review_answers",
					toolCallId: `${traceIdPrefix}-review-answers`,
					label: "Reviewing agent details",
				},
				{
					content: "Merging your latest answers into the agent profile draft.",
					input: { exchange: qaSummary },
					outputPreview: `Clarifications applied: ${qaSummary}`,
				},
				[
					{
						content: "Reconciling new answers with the original brief.",
						input: { step: "reconcile" },
						outputPreview: "Answers reconciled with the brief.",
					},
					{
						content: "Resolving any conflicting preferences.",
						input: { step: "resolve_conflicts" },
						outputPreview: "Conflicting preferences resolved.",
					},
					{
						content: "Locking in the confirmed direction.",
						input: { step: "lock_direction" },
						outputPreview: "Direction confirmed.",
					},
				],
			),
		);
	}

	// On the first turn (no prior assistant turn) the creation flow always
	// opens with a clarification round, mirroring the `/agents` RFP demo's
	// `ask_user_questions` step. Surfacing it here means the chain-of-thought
	// reflects that questions are being asked instead of jumping straight to
	// drafting. `ask_user_questions` already maps to QuestionCircleIcon in the
	// trace renderer, so no frontend change is needed.
	if (!hadPriorAssistantTurn) {
		// Turn 1 ends by handing off to the user. The ask step is left "open":
		// with no step-level output the trace writer never emits a `result`
		// event (thinking-trace-writer.js gates on `output`/`outputPreview`), so
		// the tool call stays running and `getThinkingToolCallSummaries` promotes
		// it to `awaiting-input` on turn-complete — driving the "Awaiting user
		// response" header + question card. Narration rows still stream so the
		// step shows believable progression while it waits.
		const askStep = withProgression(
			{
				toolName: "ask_user_questions",
				toolCallId: `${traceIdPrefix}-ask-questions`,
				label: "Preparing clarification questions",
			},
			{
				content: `Asking a few targeted questions to shape ${agentFocus} before drafting the profile.`,
				input: { round: 1 },
				outputPreview: "Clarification questions ready for your input.",
			},
			[
				{
					content: "Spotting the gaps that would change the design.",
					input: { step: "find_gaps" },
					outputPreview: "Key gaps identified.",
				},
				{
					content: "Phrasing each question to be quick to answer.",
					input: { step: "phrase_questions" },
					outputPreview: "Questions phrased concisely.",
				},
				{
					content: "Ordering questions from most to least impactful.",
					input: { step: "order_questions" },
					outputPreview: "Questions ordered by impact.",
				},
			],
		);
		askStep.output = undefined;
		askStep.outputPreview = undefined;
		steps.push(askStep);

		// Stop here on the first turn: the user must answer the clarification
		// questions before anything is built. The full build sequence
		// (select tools → draft → name → save) runs on the next turn, once a
		// prior assistant turn exists. This is what makes the two turns'
		// thinking traces distinct instead of duplicating the build steps.
		return steps;
	}

	const mentionedTools = detectMentionedTools(promptText);
	// Prefer the template's resolved setup (exact names) over prompt keywords.
	const setupTools = setup ? [...setup.tools, ...setup.skills] : [];
	const toolSelectionPreview = setupTools.length > 0
		? `Agent capabilities wired up: ${setupTools.join(", ")}`
		: mentionedTools.length > 0
			? `Agent tools matched: ${mentionedTools.join(", ")}`
			: "No named integrations in the brief; keeping the agent profile tool-neutral.";
	const subagentRow = setup && setup.subagents.length > 0
		? [{
			content: `Setting up delegation to ${joinNames(setup.subagents)}.`,
			input: { step: "wire_subagents" },
			outputPreview: `Subagents wired: ${setup.subagents.join(", ")}.`,
		}]
		: [];
	steps.push(
		withProgression(
			{
				toolName: "studio.select_tools",
				toolCallId: `${traceIdPrefix}-select-tools`,
				label: "Selecting agent tools",
			},
			{
				content: setupTools.length > 0
					? `Wiring up ${joinNames(setupTools)} for this agent.`
					: "Matching the requested workflow to relevant tools and skills.",
				input: { selected: setupTools.length > 0 ? setupTools : mentionedTools },
				outputPreview: toolSelectionPreview,
			},
			[
				{
					content: setup && setup.tools.length > 0
						? `Connecting apps: ${joinNames(setup.tools)}.`
						: "Scanning the brief for named integrations.",
					input: { step: "scan_integrations" },
					outputPreview: setup && setup.tools.length > 0
						? `Apps connected: ${setup.tools.join(", ")}.`
						: `Integrations found: ${mentionedTools.length > 0 ? mentionedTools.join(", ") : "none"}.`,
				},
				{
					content: setup && setup.skills.length > 0
						? `Adding skills: ${joinNames(setup.skills)}.`
						: "Mapping each task to a capable tool or skill.",
					input: { step: "map_tasks" },
					outputPreview: "Tasks mapped to tools and skills.",
				},
				...subagentRow,
			],
		),
	);

	// Connect integrations — narrate the (fake) provider connections the agent's
	// triggers depend on, when the template's triggers name connectable providers.
	const connectProviders = setup ? connectableProvidersFromTriggers(setup.triggers) : [];
	if (connectProviders.length > 0) {
		steps.push(
			withProgression(
				{
					toolName: "studio.connect_integrations",
					toolCallId: `${traceIdPrefix}-connect-integrations`,
					label: "Connecting integrations",
				},
				{
					content: `Connecting ${joinNames(connectProviders)} so the agent's triggers can fire.`,
					input: { providers: connectProviders },
					outputPreview: `Connected: ${connectProviders.join(", ")}.`,
				},
				connectProviders.map((provider) => ({
					content: `Authorizing ${provider}.`,
					input: { step: "authorize", provider },
					outputPreview: `${provider} connected.`,
				})),
			),
		);
	}

	const knowledgeRow = setup && setup.knowledge.length > 0
		? [{
			content: `Grounding the agent in ${joinNames(setup.knowledge)}.`,
			input: { step: "ground_knowledge" },
			outputPreview: `Knowledge sources: ${setup.knowledge.join(", ")}.`,
		}]
		: [];
	const modesRow = setup && setup.modes.length > 0
		? [{
			content: `Setting behavior: ${joinNames(setup.modes)}.`,
			input: { step: "set_behavior" },
			outputPreview: `Behavior configured: ${setup.modes.join(", ")}.`,
		}]
		: [];
	steps.push(
		withProgression(
			{
				toolName: "studio.draft_instructions",
				toolCallId: `${traceIdPrefix}-draft-instructions`,
				label: "Drafting agent instructions",
			},
			{
				content: `Writing role, scope, and guardrails for ${agentFocus}.`,
				input: {
					focus: agentFocus,
					hasContext: typeof contextDescription === "string" && contextDescription.length > 0,
				},
				outputPreview: "Instruction draft covers role, boundaries, tools, and tone.",
			},
			[
				...knowledgeRow,
				{
					content: "Defining what the agent should and shouldn't do.",
					input: { step: "define_scope" },
					outputPreview: "Scope boundaries defined.",
				},
				...modesRow,
				{
					content: "Setting the tone and response style.",
					input: { step: "set_tone" },
					outputPreview: "Tone and style set.",
				},
				{
					content: "Adding guardrails for edge cases.",
					input: { step: "add_guardrails" },
					outputPreview: "Guardrails added.",
				},
			],
		),
	);

	// Configure triggers — name the agent's trigger events when the template
	// supplied them, so the chain-of-thought reflects the automation setup.
	if (setup && setup.triggers.length > 0) {
		steps.push(
			withProgression(
				{
					toolName: "studio.configure_triggers",
					toolCallId: `${traceIdPrefix}-configure-triggers`,
					label: "Configuring triggers",
				},
				{
					content: `Setting up when the agent runs: ${joinNames(setup.triggers)}.`,
					input: { triggers: setup.triggers },
					outputPreview: `Triggers configured: ${setup.triggers.length}.`,
				},
				setup.triggers.map((trigger) => ({
					content: `Adding trigger — ${trigger}.`,
					input: { step: "add_trigger" },
					outputPreview: "Trigger added.",
				})),
			),
		);
	}

	const nameHint = deriveAgentNameHint(promptText);
	steps.push(
		withProgression(
			{
				toolName: "studio.name_agent",
				toolCallId: `${traceIdPrefix}-name-agent`,
				label: "Naming agent profile",
			},
			{
				content: "Choosing a name, byline, and profile-card summary that match the brief.",
				input: { hint: nameHint },
				outputPreview: `Profile naming cue: ${nameHint}`,
			},
			[
				{
					content: "Brainstorming names that signal the agent's purpose.",
					input: { step: "brainstorm_names" },
					outputPreview: "Candidate names generated.",
				},
				{
					content: "Writing a one-line byline.",
					input: { step: "write_byline" },
					outputPreview: "Byline drafted.",
				},
				{
					content: "Summarizing the agent for its profile card.",
					input: { step: "summarize_card" },
					outputPreview: "Profile-card summary written.",
				},
			],
		),
	);

	steps.push(
		withProgression(
			{
				toolName: "studio.save_profile",
				toolCallId: `${traceIdPrefix}-save-profile`,
				label: "Saving agent profile",
			},
			{
				content: "Persisting the agent so it shows up in your Studio library.",
				outputPreview: "Agent profile ready for Studio.",
			},
			[
				{
					content: "Validating the profile before saving.",
					input: { step: "validate" },
					outputPreview: "Profile validated.",
				},
				{
					content: "Writing the agent to your Studio library.",
					input: { step: "persist" },
					outputPreview: "Agent saved to the library.",
				},
				{
					content: "Confirming it's ready to use.",
					input: { step: "confirm" },
					outputPreview: "Agent ready to use.",
				},
			],
		),
	);

	return steps;
}

module.exports = {
	buildStudioAgentCreationTrace,
	// Exported for tests:
	__internals: {
		detectMentionedTools,
		parseTemplateSetupFromContext,
		connectableProvidersFromTriggers,
		joinNames,
		summarizeQAExchange,
		deriveAgentNameHint,
		deriveAgentBriefFocus,
		buildProgressionRows,
		MIN_PROGRESSION_ROWS,
		MAX_PROGRESSION_ROWS,
		truncate,
	},
};
