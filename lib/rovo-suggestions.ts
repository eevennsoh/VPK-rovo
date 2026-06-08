/**
 * Rovo Chat Suggestions
 *
 * Static catalog of skill/prompt suggestions for the Rovo chat sidebar.
 */

import type { ComponentType } from "react";
import type { GenerativeContentType } from "@/components/projects/shared/lib/generative-widget";
import type { ResolvedCardIdentity } from "@/components/projects/shared/lib/visual-identity";
import { resolveGenerativeCardIdentity } from "@/components/projects/shared/lib/visual-identity";

// Icon imports - these will be used by consuming components
import TimelineIcon from "@atlaskit/icon/core/timeline";
import PageIcon from "@atlaskit/icon/core/page";
import TranslateIcon from "@atlaskit/icon/core/translate";

export interface RovoSuggestion {
	id: string;
	label: string;
	/**
	 * Short byline revealed on hover/selection beneath the label, matching the
	 * editor palette's command-menu rows. Omit for a label-only row.
	 */
	description?: string;
	/** Prompt text sent to the AI — defaults to `label` if omitted */
	prompt?: string;
	/** Local icon component for skills - uses any to accommodate icon props */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon?: ComponentType<any>;
	/** Image path for prompts with rich illustrations */
	imageSrc?: string;
	/** Shared visual identity for generated/contextual suggestions. */
	visualIdentity?: ResolvedCardIdentity;
	/** Hidden context attached when this suggestion is submitted */
	contextDescription?: string;
	/** Indicates if this is a "skill" (icon) or "prompt" (rich illustration) */
	type: "skill" | "prompt";
}

interface ConversationStarterVisualIdentityInput {
	agentId: string;
	agentName: string;
	byline: string;
	description?: string | null;
	label: string;
}

function resolveConversationStarterIdentityHint(label: string): {
	contentType: GenerativeContentType;
	iconHint?: string;
} {
	const normalizedLabel = label.toLowerCase();

	if (/\b(json|code|script|automation-ready|markdown|yaml|sql)\b/u.test(normalizedLabel)) {
		return { contentType: "code", iconHint: "code" };
	}

	if (/\b(jira|jsm|request|ticket|issue|incident|priority|sla|routing|triage|escalat)/u.test(normalizedLabel)) {
		return { contentType: "work-item", iconHint: "ticket" };
	}

	if (/\b(confluence|page|doc|document|wiki|rfp)\b/u.test(normalizedLabel)) {
		return { contentType: "page", iconHint: "document" };
	}

	if (/\b(calendar|meeting|event|schedule|timeline|deadline|date)\b/u.test(normalizedLabel)) {
		return { contentType: "calendar", iconHint: "calendar" };
	}

	if (/\b(chart|trend|metric|report|dashboard|analy[sz]e|insight|summary)\b/u.test(normalizedLabel)) {
		return { contentType: "chart", iconHint: "chart" };
	}

	if (/\b(slack|message|reply|comment|chat|email)\b/u.test(normalizedLabel)) {
		return { contentType: "message", iconHint: "chat" };
	}

	if (/\b(table|spreadsheet|dataset|batch|list)\b/u.test(normalizedLabel)) {
		return { contentType: "table", iconHint: "table" };
	}

	if (/\b(translate|translation|language|locali[sz]e)\b/u.test(normalizedLabel)) {
		return { contentType: "translation", iconHint: "translate" };
	}

	if (/\b(image|mockup|design|figma|visual)\b/u.test(normalizedLabel)) {
		return { contentType: "image", iconHint: "image" };
	}

	if (/\b(skill|tool|integration|access)\b/u.test(normalizedLabel)) {
		return { contentType: "skill", iconHint: "skill" };
	}

	return { contentType: "text", iconHint: "summary" };
}

export function resolveConversationStarterVisualIdentity(
	input: Readonly<ConversationStarterVisualIdentityInput>,
): ResolvedCardIdentity {
	const hint = resolveConversationStarterIdentityHint(input.label);

	return resolveGenerativeCardIdentity({
		contentType: hint.contentType,
		description: input.description ?? undefined,
		hintText: input.label,
		iconHint: hint.iconHint,
		identitySeed: `${input.agentId}:${input.label}`,
		sourceName: `${input.agentName} ${input.byline}`,
		title: input.label,
	});
}

const rovoSiteUrl =
	process.env.NEXT_PUBLIC_ROVO_SITE_URL || "https://hello.atlassian.net";

const LAST_7_DAYS_SITE_SCOPE_CONTEXT = [
	"[Work Summary Scope]",
	"For this request, gather the user's last-7-days work activity across both Atlassian sites.",
	'- Jira site_url: "https://product-fabric.atlassian.net"',
	`- Confluence site_url: "${rovoSiteUrl}"`,
	"Choose the tools needed to fetch Jira and Confluence activity for these sites. Do not assume a fixed tool path.",
	"If one site has no results or errors, continue with the other site and clearly report coverage and gaps.",
	"Merge and deduplicate activity before responding.",
	"[End Work Summary Scope]",
].join("\n");

/**
 * The actual prompt sent to the AI when the "Last 7 days of work" suggestion is clicked.
 * Includes "from Jira and Confluence" so Rovo naturally selects the right tools.
 * The user-visible label remains short ("Last 7 days of work").
 */
const LAST_7_DAYS_PROMPT =
	"Search for all work I have done in the last 7 days from Jira and Confluence";

const GOOGLE_CALENDAR_LIST_EVENTS_PROMPT =
	"List Google Calendar events for today";

const GOOGLE_CALENDAR_LIST_EVENTS_CONTEXT = [
	"[Tool Requirement]",
	"For this request, use the Google Calendar MCP tool to list events.",
	"Always include required parameters: `calendarId`, `timeMin`, and `timeMax`.",
	"If the user does not specify a calendar, use `calendarId: \"primary\"`.",
	"`timeMin` and `timeMax` must be strict UTC ISO 8601 timestamps.",
	"[End Tool Requirement]",
].join("\n");

/**
 * Default suggestions shown in the chat greeting
 * Showcases Rovo's tool coverage across Atlassian and external apps
 */
export const defaultSuggestions: RovoSuggestion[] = [
	{
		id: "work-last-7-days",
		label: "Last 7 days of work",
		description: "Summarize your recent Jira and Confluence activity",
		prompt: LAST_7_DAYS_PROMPT,
		icon: TimelineIcon,
		contextDescription: LAST_7_DAYS_SITE_SCOPE_CONTEXT,
		type: "skill",
	},
	{
		id: "draft-confluence-page",
		label: "Find related RFPs",
		description: "Surface relevant RFP pages from Confluence",
		icon: PageIcon,
		type: "skill",
	},
	{
		id: "translate-text",
		label: "Translate this text",
		description: "Translate content into another language",
		icon: TranslateIcon,
		type: "skill",
	},
	{
		id: "figma-design-context",
		label: "Get Figma design context",
		description: "Pull frames and specs from a Figma file",
		imageSrc: "/3p/figma/16.svg",
		type: "prompt",
	},
	{
		id: "send-slack-message",
		label: "Send Slack message",
		description: "Draft and post a message to a Slack channel",
		imageSrc: "/3p/slack/16-borderless.svg",
		type: "prompt",
	},
	{
		id: "list-google-calendar-events",
		label: "List Google Calendar events",
		description: "Show today's events from Google Calendar",
		prompt: GOOGLE_CALENDAR_LIST_EVENTS_PROMPT,
		contextDescription: GOOGLE_CALENDAR_LIST_EVENTS_CONTEXT,
		imageSrc: "/3p/google-calendar/16-borderless.svg",
		type: "prompt",
	},
];
