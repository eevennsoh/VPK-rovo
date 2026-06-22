import type { ReactNode } from "react";
import { TwgTool, type TwgToolSource } from "@/components/ui-custom/twg-tool";
import type {
	ThinkingNarrationDetailRow,
	ThinkingToolCallSummary,
} from "@/lib/rovo-ui-messages";
import { getThinkingToolByline } from "@/components/projects/shared/lib/thinking-tool-display";

export type ToolStepStatus = "complete" | "active" | "pending";

export interface ResolveAssistantThinkingToolPresentationOptions {
	detailRows: readonly ThinkingNarrationDetailRow[] | undefined;
	narration: string[] | undefined;
	status: ToolStepStatus;
	toolCall: ThinkingToolCallSummary;
}

export interface AssistantThinkingToolTracePresentation {
	forceOpen?: boolean;
	headerRender?: () => ReactNode;
	detailRender?: () => ReactNode;
}

export type AssistantThinkingToolTracePresentationResolver = (
	options: ResolveAssistantThinkingToolPresentationOptions
) => AssistantThinkingToolTracePresentation | null;

interface TwgToolTraceHeaderConfig {
	type: "twg-tool";
	title: string;
	fallbackDescription: string;
	sources: ReadonlyArray<TwgToolSource>;
}

interface NarrationRowsTraceDetailConfig {
	type: "narration-rows";
}

type AssistantThinkingToolTraceHeaderConfig = TwgToolTraceHeaderConfig;
type AssistantThinkingToolTraceDetailConfig = NarrationRowsTraceDetailConfig;

export interface AssistantThinkingToolTracePresentationRegistryEntry {
	forceOpen?: boolean;
	header?: AssistantThinkingToolTraceHeaderConfig;
	detail?: AssistantThinkingToolTraceDetailConfig;
}

export type AssistantThinkingToolTracePresentationRegistry = Readonly<
	Record<string, AssistantThinkingToolTracePresentationRegistryEntry>
>;

const STUDIO_AUTOMATION_TWG_SOURCES = [
	{ id: "twg", label: "Teamwork Graph", provider: "twg" },
	{ id: "loom", label: "Loom", provider: "loom" },
	{ id: "slack", label: "Slack", provider: "twg", name: "slack" },
	{ id: "confluence", label: "Confluence", provider: "confluence" },
	{ id: "jira", label: "Jira", provider: "jira" },
	{ id: "figma", label: "Figma", provider: "twg", name: "figma" },
	{ id: "github", label: "GitHub", provider: "twg", name: "github" },
] satisfies ReadonlyArray<TwgToolSource>;

export const STUDIO_AUTOMATION_THINKING_TOOL_TRACE_PRESENTATION_REGISTRY = {
	"twg.search_work_patterns": {
		forceOpen: true,
		header: {
			type: "twg-tool",
			title: "Correlating through Teamwork Graph",
			fallbackDescription: "Correlating source signals, collaborators, projects, and candidate workflows.",
			sources: STUDIO_AUTOMATION_TWG_SOURCES,
		},
		detail: {
			type: "narration-rows",
		},
	},
	"parallel.source_scan": {
		forceOpen: true,
		header: {
			type: "twg-tool",
			title: "Cycling through source apps",
			fallbackDescription: "Checking Slack, Jira, Confluence, Loom, Figma, GitHub, Calendar, and TWG for repeatable work signals.",
			sources: STUDIO_AUTOMATION_TWG_SOURCES,
		},
		detail: {
			type: "narration-rows",
		},
	},
	"loom.scan_recent_videos": {
		forceOpen: true,
		header: {
			type: "twg-tool",
			title: "Cycling Loom distribution signals",
			fallbackDescription: "Following each new Loom into Slack, stakeholder messages, and Atlas update drafts.",
			sources: [
				{ id: "loom", label: "Loom", provider: "loom" },
				{ id: "slack", label: "Slack", provider: "twg", name: "slack" },
				{ id: "confluence", label: "Confluence", provider: "confluence" },
				{ id: "atlas", label: "Atlas", provider: "home" },
				{ id: "twg", label: "Teamwork Graph", provider: "twg" },
			],
		},
		detail: {
			type: "narration-rows",
		},
	},
	"jira.search_agent_reaper": {
		forceOpen: true,
		header: {
			type: "twg-tool",
			title: "Cycling lifecycle triage signals",
			fallbackDescription: "Comparing agent-reaper-bot tickets with project, inventory, and review signals.",
			sources: [
				{ id: "jira", label: "Jira", provider: "jira" },
				{ id: "studio", label: "Studio inventory", provider: "twg" },
				{ id: "slack", label: "Slack", provider: "twg", name: "slack" },
				{ id: "twg", label: "Teamwork Graph", provider: "twg" },
			],
		},
		detail: {
			type: "narration-rows",
		},
	},
	"confluence.atlas_update_scan": {
		forceOpen: true,
		header: {
			type: "twg-tool",
			title: "Cycling weekly update evidence",
			fallbackDescription: "Checking Confluence, Atlas, Loom, Slack, and calendar rhythms for repeated synthesis work.",
			sources: [
				{ id: "confluence", label: "Confluence", provider: "confluence" },
				{ id: "atlas", label: "Atlas", provider: "home" },
				{ id: "loom", label: "Loom", provider: "loom" },
				{ id: "slack", label: "Slack", provider: "twg", name: "slack" },
				{ id: "calendar", label: "Calendar", provider: "twg" },
			],
		},
		detail: {
			type: "narration-rows",
		},
	},
	"studio.rank_automation_candidates": {
		forceOpen: true,
		header: {
			type: "twg-tool",
			title: "Cycling create, skip, and evidence buckets",
			fallbackDescription: "Ranking candidates by recurrence, trigger clarity, and approval safety before asking for draft boundaries.",
			sources: [
				{ id: "twg", label: "Teamwork Graph", provider: "twg" },
				{ id: "loom", label: "Loom", provider: "loom" },
				{ id: "jira", label: "Jira", provider: "jira" },
				{ id: "confluence", label: "Confluence", provider: "confluence" },
				{ id: "slack", label: "Slack", provider: "twg", name: "slack" },
			],
		},
		detail: {
			type: "narration-rows",
		},
	},
	"studio.resolve_creation_boundaries": {
		forceOpen: true,
		header: {
			type: "twg-tool",
			title: "Cycling final draft boundaries",
			fallbackDescription: "Applying create, skip, and needs-evidence choices before Studio creates the drafts.",
			sources: [
				{ id: "create", label: "Create", provider: "twg" },
				{ id: "skip", label: "Skip", provider: "twg" },
				{ id: "evidence", label: "Needs evidence", provider: "twg" },
				{ id: "studio", label: "Studio", provider: "studio" },
			],
		},
		detail: {
			type: "narration-rows",
		},
	},
	"studio.create_agent_drafts": {
		forceOpen: true,
		header: {
			type: "twg-tool",
			title: "Cycling through three Studio drafts",
			fallbackDescription: "Creating the Loom distribution, lifecycle triage, and weekly digest agents.",
			sources: [
				{ id: "loom-agent", label: "Loom Distribution Agent", provider: "twg", iconSrc: "/avatar-agent/product-agents/feedback-analyzer.svg" },
				{ id: "triage-agent", label: "Inactive Agent Triage Agent", provider: "twg", iconSrc: "/avatar-agent/service-agents/service-triage.svg" },
				{ id: "digest-agent", label: "Weekly Sprint/Atlas Digest Agent", provider: "twg", iconSrc: "/avatar-agent/strategy-agents/strategic-insight.svg" },
			],
		},
		detail: {
			type: "narration-rows",
		},
	},
} satisfies AssistantThinkingToolTracePresentationRegistry;

export const DEFAULT_ASSISTANT_THINKING_TOOL_TRACE_PRESENTATION_REGISTRY =
	STUDIO_AUTOMATION_THINKING_TOOL_TRACE_PRESENTATION_REGISTRY;

function getLatestThinkingDetailRowContent(
	detailRows: readonly ThinkingNarrationDetailRow[] | undefined,
): string | null {
	const rows = detailRows ?? [];
	for (let index = rows.length - 1; index >= 0; index -= 1) {
		const content = rows[index]?.content.trim();
		if (content) {
			return content;
		}
	}
	return null;
}

function getToolTracePresentationByline({
	detailRows,
	fallback,
	narration,
	toolCall,
}: Readonly<{
	detailRows: readonly ThinkingNarrationDetailRow[] | undefined;
	fallback: string;
	narration: string[] | undefined;
	toolCall: ThinkingToolCallSummary;
}>): string {
	const latestDetail = getLatestThinkingDetailRowContent(detailRows);
	if (toolCall.state === "completed") {
		return toolCall.outputPreview ?? latestDetail ?? fallback;
	}
	return latestDetail ?? getThinkingToolByline(toolCall, narration) ?? fallback;
}

function TraceNarrationRowsDetail({
	detailRows,
}: Readonly<{
	detailRows: readonly ThinkingNarrationDetailRow[] | undefined;
}>): ReactNode {
	const rows = (detailRows ?? []).filter((row) => row.content.trim().length > 0);

	return (
		<div className="space-y-1 text-xs leading-5 text-text-subtle">
			{rows.map((row, index) => (
				<p key={`${index}-${row.content}`}>
					{row.content}
					{row.output !== undefined ? (
						<span className="block text-text-subtlest">
							{typeof row.output === "string" ? row.output : JSON.stringify(row.output)}
						</span>
					) : null}
				</p>
			))}
		</div>
	);
}

function buildToolTraceHeader({
	detailRows,
	header,
	narration,
	status,
	toolCall,
}: ResolveAssistantThinkingToolPresentationOptions & {
	header: AssistantThinkingToolTraceHeaderConfig;
}): () => ReactNode {
	switch (header.type) {
		case "twg-tool": {
			const description = getToolTracePresentationByline({
				detailRows,
				fallback: header.fallbackDescription,
				narration,
				toolCall,
			});

			return function ToolTraceHeaderRender() {
				return (
					<TwgTool
						description={description}
						showChevron={false}
						sources={header.sources}
						status={status}
						title={header.title}
					/>
				);
			};
		}
	}
}

function buildToolTraceDetail({
	detail,
	detailRows,
}: Readonly<{
	detail: AssistantThinkingToolTraceDetailConfig;
	detailRows: readonly ThinkingNarrationDetailRow[] | undefined;
}>): () => ReactNode {
	switch (detail.type) {
		case "narration-rows":
			return function ToolTraceDetailRender() {
				return <TraceNarrationRowsDetail detailRows={detailRows} />;
			};
	}
}

export function createAssistantThinkingToolTracePresentationResolver(
	registry: AssistantThinkingToolTracePresentationRegistry = {},
): AssistantThinkingToolTracePresentationResolver {
	return function resolveRegisteredAssistantThinkingToolTracePresentation(options) {
		const entry = registry[options.toolCall.toolName];
		if (!entry) {
			return null;
		}

		return {
			forceOpen: entry.forceOpen,
			headerRender: entry.header
				? buildToolTraceHeader({
					...options,
					header: entry.header,
				})
				: undefined,
			detailRender: entry.detail
				? buildToolTraceDetail({
					detail: entry.detail,
					detailRows: options.detailRows,
				})
				: undefined,
		};
	};
}

export const defaultAssistantThinkingToolTracePresentationResolver =
	createAssistantThinkingToolTracePresentationResolver(
		DEFAULT_ASSISTANT_THINKING_TOOL_TRACE_PRESENTATION_REGISTRY,
	);

export function resolveAssistantThinkingToolTracePresentation(
	options: ResolveAssistantThinkingToolPresentationOptions,
): AssistantThinkingToolTracePresentation | null {
	return defaultAssistantThinkingToolTracePresentationResolver(options);
}
