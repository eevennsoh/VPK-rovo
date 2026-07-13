"use client";

import ArrowRightIcon from "@atlaskit/icon/core/arrow-right";
import AiGenerativeTextSummaryIcon from "@atlaskit/icon/core/ai-generative-text-summary";
import RefreshIcon from "@atlaskit/icon/core/refresh";

import { Button } from "@/components/ui/button";
import {
	useAgentSessionsActions,
	useAgentSessionsState,
} from "@/components/blocks/agent-sessions/experimental/context-agent-sessions";

/**
 * Read-only generated summary that sits ABOVE the description (per spec): a
 * bulleted TL;DR plus clickable "next steps". Selecting a next step prefills the
 * floating session composer with its command and opens/creates a general
 * session — it never mutates the context text. Renders nothing until Rovo has
 * generated a summary (empty preset).
 */
export function ContextSummary() {
	const { contextResources } = useAgentSessionsState();
	const actions = useAgentSessionsActions();
	const { tldr, nextSteps } = contextResources;

	if (tldr.length === 0 && nextSteps.length === 0) {
		return null;
	}

	const handleNextStep = (command: string) => {
		actions.setComposerPrefill(command);
		// Open/create a live general (non-completed) session so the prefilled command
		// lands in an actionable chat — never reopen a completed latest session.
		actions.openGeneralSession();
	};

	return (
		<section
			aria-label="Summary from Rovo"
			className="flex flex-col gap-2 rounded-lg border border-border bg-surface-sunken p-3"
		>
			<div className="flex items-center justify-between gap-2">
				<div className="flex min-w-0 items-center gap-1.5 text-text-subtle">
					<AiGenerativeTextSummaryIcon label="" size="small" color="currentColor" />
					<span className="truncate text-xs font-semibold leading-4">Summary from Rovo</span>
				</div>
				<Button
					aria-label="Regenerate summary"
					onClick={() => actions.refreshGeneratedContext()}
					size="icon-compact"
					variant="ghost"
				>
					<RefreshIcon label="" size="small" />
				</Button>
			</div>

			{tldr.length > 0 ? (
				<ul className="flex flex-col gap-1.5">
					{tldr.map((point, index) => (
						<li key={`tldr-${index}`} className="flex gap-2 text-sm leading-5 text-text">
							<span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-text-subtle" />
							<span className="min-w-0">{point}</span>
						</li>
					))}
				</ul>
			) : null}

			{nextSteps.length > 0 ? (
				<div className="flex flex-col gap-1">
					<span className="text-xs font-semibold leading-4 text-text-subtlest">Suggested next steps</span>
					<div className="flex flex-col gap-0.5">
						{nextSteps.map((step) => (
							<button
								key={step.id}
								type="button"
								onClick={() => handleNextStep(step.command)}
								className="group/next-step -mx-1 flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-left text-sm leading-5 text-text transition-colors hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
							>
								<span className="min-w-0 flex-1">{step.label}</span>
								<span className="shrink-0 text-icon-subtle transition-opacity group-hover/next-step:text-icon-brand motion-reduce:transition-none">
									<ArrowRightIcon label="" size="small" color="currentColor" />
								</span>
							</button>
						))}
					</div>
				</div>
			) : null}
		</section>
	);
}
