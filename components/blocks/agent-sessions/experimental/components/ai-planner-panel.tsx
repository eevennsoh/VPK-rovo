"use client";

import { useState, type ReactNode } from "react";

import {
	AGENT_PLANNER_SEARCH_PHASES,
	countPendingPlannerFields,
	type AgentPlannerSource,
} from "@/components/blocks/agent-sessions/data/planner-state";
import {
	useAgentSessionsActions,
	useAgentSessionsState,
} from "@/components/blocks/agent-sessions/experimental/context-agent-sessions";
import { Button } from "@/components/ui/button";
import {
	PromptInput,
	PromptInputFooter,
	PromptInputSubmit,
	PromptInputTextarea,
} from "@/components/ui-custom/prompt-input";
import { TwgTool, type TwgToolSource } from "@/components/ui-custom/twg-tool";
import { cn } from "@/lib/utils";

const PLANNER_SOURCES = {
	twg: { id: "twg", label: "Teamwork Graph", provider: "twg" },
	jira: { id: "jira", label: "Jira", provider: "jira" },
	confluence: { id: "confluence", label: "Confluence", provider: "confluence" },
	"google-drive": { id: "google-drive", label: "Google Drive", provider: "google-drive" },
} as const satisfies Record<AgentPlannerSource, TwgToolSource>;

const ALL_PLANNER_SOURCES = [
	PLANNER_SOURCES.twg,
	PLANNER_SOURCES.jira,
	PLANNER_SOURCES.confluence,
	PLANNER_SOURCES["google-drive"],
] as const;

/** Compact search/provenance banner; review controls live with the fields they affect. */
export function AiPlannerPanel() {
	const { planner } = useAgentSessionsState();

	if (planner.status === "inactive") return null;

	if (planner.status === "searching") {
		const phase = AGENT_PLANNER_SEARCH_PHASES[planner.phaseIndex] ?? AGENT_PLANNER_SEARCH_PHASES[0];
		return (
			<div aria-busy="true" aria-live="polite" data-ai-planner-state="searching">
				<TwgTool
					description={phase.description}
					showChevron={false}
					sources={phase.sources.map((source) => PLANNER_SOURCES[source])}
					status="active"
					title="AI Planner"
				/>
			</div>
		);
	}

	const isRefining = planner.status === "refining";
	const isApplied = planner.status === "applied";
	const suggestionCount = isApplied ? planner.appliedCount : countPendingPlannerFields(planner);
	const description = isRefining
		? `Updating the plan based on “${planner.lastPrompt ?? "your direction"}”`
		: isApplied
			? `${suggestionCount} suggestions applied from 4 sources`
			: `${suggestionCount} suggestions from 4 sources`;

	return (
		<div aria-busy={isRefining || undefined} aria-live="polite" data-ai-planner-state={planner.status}>
			<TwgTool
				description={description}
				showChevron={false}
				showLoader={isRefining}
				sources={ALL_PLANNER_SOURCES}
				status={isRefining ? "active" : "complete"}
				title={isApplied ? "Planned by Rovo" : "AI Planner"}
			/>
		</div>
	);
}

function AiPlannerActionBar() {
	const { planner } = useAgentSessionsState();
	const actions = useAgentSessionsActions();
	const [prompt, setPrompt] = useState("");
	const isRefining = planner.status === "refining";

	return (
		<div className="sticky bottom-3 z-10 mt-3 px-2 pb-1">
			<PromptInput
				aria-label="AI Planner controls"
				className="bg-surface-overlay p-2"
				onSubmit={(message, event) => {
					const nextPrompt = message.text.trim();
					if (!nextPrompt || isRefining) return;
					actions.refinePlannerProposal(nextPrompt);
					setPrompt("");
					event.currentTarget.reset();
				}}
				variant="floating"
			>
				<PromptInputTextarea
					aria-label="Tell Rovo what to change"
					className="min-h-8! max-h-20! py-1!"
					disabled={isRefining}
					enableDirectoryAutocomplete={false}
					onChange={(event) => setPrompt(event.currentTarget.value)}
					placeholder="Tell Rovo what to change…"
					value={prompt}
				/>
				<PromptInputFooter className="p-0 pt-1">
					<div className="flex min-w-0 items-center gap-1">
						<Button
							disabled={isRefining}
							onClick={() => actions.rejectPlannerProposal()}
							size="compact"
							type="button"
							variant="ghost"
						>
							Reject all
						</Button>
						<Button
							disabled={isRefining}
							onClick={() => actions.applyPlannerProposal()}
							size="compact"
							type="button"
						>
							Confirm all
						</Button>
					</div>
					<PromptInputSubmit
						aria-label="Refine plan"
						disabled={!prompt.trim() || isRefining}
						status={isRefining ? "submitted" : undefined}
					/>
				</PromptInputFooter>
			</PromptInput>
		</div>
	);
}

/** Discovery border and floating controls scoped to the fields Rovo populated. */
export function AiPlannerScope({ children }: Readonly<{ children: ReactNode }>) {
	const { planner } = useAgentSessionsState();
	const isReviewing = planner.status === "ready" || planner.status === "refining";

	return (
		<div
			className={cn(
				"flex flex-col gap-3",
				isReviewing ? "rounded-xl border border-border-discovery-subtle p-3" : null,
			)}
			data-ai-planner-scope={isReviewing ? "active" : undefined}
		>
			{children}
			{isReviewing ? <AiPlannerActionBar /> : null}
		</div>
	);
}
