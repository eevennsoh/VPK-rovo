"use client";

import type { ReactNode } from "react";

import {
	DEFAULT_PULL_REQUEST_FIX_AGENT_ID,
	PULL_REQUEST_FIX_AGENTS,
} from "@/components/blocks/pull-request-fix/data/pull-request-fix-agents";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";
import { RovoColorIcon, type LogoSize } from "@/components/ui/logo";
import { LogoThirdParty } from "@/components/ui/logo-third-party";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import type { PullRequestFixAgentId } from "./pull-request-fix-types";

type CodingAgent = Readonly<{
	id: PullRequestFixAgentId;
	label: string;
	logo: ReactNode;
}>;

function thirdPartyAgentLogo(name: ThirdPartyLogoName, size: LogoSize = "small"): ReactNode {
	// No dark-mode class here: LogoThirdParty inverts near-black glyphs itself,
	// and CSS filters on nested elements compose — a second invert would return
	// the glyph to near-black.
	return <LogoThirdParty name={name} size={size} borderless />;
}

/**
 * Brand glyphs for the fix composer agent picker. Mirrors the work-item
 * coding-agent menu marks (Rovo is 1P; the rest use `LogoThirdParty` at the
 * default `small` / 24px tile size — same as ContextTitleActions).
 */
const AGENT_LOGOS: Readonly<Record<PullRequestFixAgentId, ReactNode>> = {
	"claude-code": thirdPartyAgentLogo("claude"),
	codex: thirdPartyAgentLogo("openai-codex"),
	cursor: thirdPartyAgentLogo("cursor"),
	gemini: thirdPartyAgentLogo("google-gemini"),
	"github-copilot": thirdPartyAgentLogo("github-copilot"),
	"rovo-cli": <RovoColorIcon size="small" />,
};

const CODING_AGENTS: readonly CodingAgent[] = PULL_REQUEST_FIX_AGENTS.map(
	(agent) => ({
		...agent,
		logo: AGENT_LOGOS[agent.id],
	}),
);

/**
 * Match DropdownMenuItem `elemBefore` (24px slot). Natural `small` logos fill
 * the slot — same size as the ContextTitleActions coding agent menu.
 */
const AGENT_LOGO_SLOT_CLASS_NAME =
	"inline-flex size-6 shrink-0 items-center justify-center self-center leading-none";

function AgentLogoSlot({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<span aria-hidden className={AGENT_LOGO_SLOT_CLASS_NAME}>
			{children}
		</span>
	);
}

/**
 * Simple agent dropdown for the CI-fix composer. One outline Select trigger
 * (logo + agent name + built-in chevron) opens the full agent list. Submit
 * stays a separate control beside this picker.
 */
export function PullRequestFixAgentPicker({
	className,
	disabled = false,
	onValueChange,
	value = DEFAULT_PULL_REQUEST_FIX_AGENT_ID,
}: Readonly<{
	className?: string;
	disabled?: boolean;
	onValueChange: (agentId: PullRequestFixAgentId) => void;
	value?: PullRequestFixAgentId;
}>) {
	const selectedAgent =
		CODING_AGENTS.find((agent) => agent.id === value) ?? CODING_AGENTS[0];

	return (
		<Select
			disabled={disabled}
			onValueChange={(nextValue) => {
				if (typeof nextValue !== "string") {
					return;
				}
				const nextAgent = CODING_AGENTS.find((agent) => agent.id === nextValue);
				if (nextAgent) {
					onValueChange(nextAgent.id);
				}
			}}
			value={selectedAgent.id}
		>
			<SelectTrigger
				aria-label="Coding agent"
				className={cn("shrink-0 font-medium text-text", className)}
			>
				<AgentLogoSlot>{selectedAgent.logo}</AgentLogoSlot>
				<SelectValue>{selectedAgent.label}</SelectValue>
			</SelectTrigger>
			<SelectContent
				align="end"
				alignItemWithTrigger={false}
				aria-label="Coding agents"
			>
				<SelectGroup>
					{CODING_AGENTS.map((agent) => (
						<SelectItem key={agent.id} value={agent.id}>
							<AgentLogoSlot>{agent.logo}</AgentLogoSlot>
							{agent.label}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}
