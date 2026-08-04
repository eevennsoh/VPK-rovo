"use client";

import { useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion, type Transition } from "motion/react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RovoColorIcon, type LogoSize } from "@/components/ui/logo";
import { LogoThirdParty } from "@/components/ui/logo-third-party";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";
import { CodeIcon } from "@/components/ui/vpk-icons";
import { useJiraWorkItemMeta } from "@/components/blocks/jira-work-item/experimental-v2/context-jira-work-item";
import { usePanelLayout } from "@/components/blocks/jira-work-item/experimental-v2/context-panel-layout";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import CopyIcon from "@atlaskit/icon/core/copy";

const ACTIONS_ENTER_TRANSITION: Transition = {
	duration: 0.1,
	ease: [0.4, 1, 0.6, 1], // duration-fast + ease-out-practical
};
const EXPANDED_ACTIONS_ENTER_TRANSITION: Transition = {
	duration: 0.05,
	ease: [0.4, 1, 0.6, 1], // duration-xxshort + ease-out-practical
};
const ACTIONS_EXIT_TRANSITION: Transition = {
	duration: 0.05,
	ease: [0.6, 0, 0.8, 0.6], // duration-xxshort + ease-in
};

export type CodingAgentId =
	| "claude-code"
	| "codex"
	| "rovo-cli"
	| "cursor"
	| "vs-code"
	| "github-copilot"
	| "gemini";

/**
 * Keeps the resource-row actions inert while the metadata column changes the
 * available content width. The actions exit before the toggle is applied, then
 * re-enter once the shared layout owner reports that its geometry has settled.
 */
export function AnimatedContextTitleActions({
	primaryAgentId,
}: Readonly<{ primaryAgentId?: CodingAgentId }>) {
	const {
		completeMetadataToggle,
		metadataCollapsed,
		metadataLayoutAnimating,
		metadataTogglePending,
	} = usePanelLayout();
	const shouldReduceMotion = useReducedMotion() ?? false;
	const didCompleteToggleExit = useRef(false);
	const [isAnimating, setIsAnimating] = useState(false);
	const hideForToggle = metadataTogglePending || metadataLayoutAnimating;
	const isInteractive = !hideForToggle && !isAnimating;
	const enterTransition = metadataCollapsed
		? ACTIONS_ENTER_TRANSITION
		: EXPANDED_ACTIONS_ENTER_TRANSITION;

	return (
		<motion.div
			className="flex shrink-0 items-center gap-1"
			animate={
				hideForToggle
					? {
							opacity: 0,
							scale: 0.96,
							transition: shouldReduceMotion ? { duration: 0 } : ACTIONS_EXIT_TRANSITION,
						}
					: { opacity: 1, scale: 1, transition: enterTransition }
			}
			aria-hidden={isInteractive ? undefined : true}
			inert={isInteractive ? undefined : true}
			initial={false}
			onAnimationComplete={() => {
				setIsAnimating(false);
				if (metadataTogglePending && !didCompleteToggleExit.current) {
					didCompleteToggleExit.current = true;
					completeMetadataToggle();
				}
				if (!hideForToggle) {
					didCompleteToggleExit.current = false;
				}
			}}
			onAnimationStart={() => setIsAnimating(true)}
			style={{
				transformOrigin: "left center",
				willChange: isAnimating ? "transform, opacity" : undefined,
			}}
		>
			<ContextTitleActions primaryAgentId={primaryAgentId} />
		</motion.div>
	);
}

type CodingAgent = Readonly<{
	/** Stable id used for React keys. */
	id: CodingAgentId;
	/** Human-readable label shown in the button/menu. */
	label: string;
	/** Contextual action revealed when the menu row is highlighted. */
	byline: string;
	/** Compact brand glyph shown in the primary split-button action. */
	buttonLogo: ReactNode;
	/** Brand glyph. Rovo is a 1P mark; the rest render via `LogoThirdParty`. */
	logo: ReactNode;
}>;

function thirdPartyAgentLogo(name: ThirdPartyLogoName, size: LogoSize = "small"): ReactNode {
	const darkModeClassName =
		name === "cursor" || name === "github-copilot"
			? "dark:brightness-0 dark:invert"
			: undefined;

	return <LogoThirdParty name={name} size={size} borderless className={darkModeClassName} />;
}

/**
 * Coding editors and agents available from the primary local-action split
 * button. Most map to a registered `LogoThirdParty` brand
 * (Codex/Cursor/Copilot ship with the upstream package or a local `public/3p`
 * fallback); Rovo uses the 1P `RovoColorIcon`.
 */
const CODING_AGENTS: readonly CodingAgent[] = [
	{ id: "claude-code", label: "Claude", byline: "Copy CLI command", buttonLogo: thirdPartyAgentLogo("claude", "xxsmall"), logo: thirdPartyAgentLogo("claude") },
	{ id: "codex", label: "Codex", byline: "Open in IDE", buttonLogo: thirdPartyAgentLogo("openai-codex", "xxsmall"), logo: thirdPartyAgentLogo("openai-codex") },
	{ id: "rovo-cli", label: "Rovo", byline: "Copy CLI command", buttonLogo: <RovoColorIcon size="small" />, logo: <RovoColorIcon size="small" /> },
	{ id: "cursor", label: "Cursor", byline: "Open in IDE", buttonLogo: thirdPartyAgentLogo("cursor", "xxsmall"), logo: thirdPartyAgentLogo("cursor") },
	{ id: "vs-code", label: "VS Code", byline: "Open in IDE", buttonLogo: thirdPartyAgentLogo("vs-code", "xxsmall"), logo: thirdPartyAgentLogo("vs-code") },
	{ id: "github-copilot", label: "GitHub Copilot", byline: "Open in IDE", buttonLogo: thirdPartyAgentLogo("github-copilot", "xxsmall"), logo: thirdPartyAgentLogo("github-copilot") },
	{ id: "gemini", label: "Gemini", byline: "Open in IDE", buttonLogo: thirdPartyAgentLogo("google-gemini", "xxsmall"), logo: thirdPartyAgentLogo("google-gemini") },
];

/**
 * Resource-row split button for opening the work item with the primary coding
 * agent locally or choosing another agent directly. Lock, watch, and share live
 * in the modal header.
 */
export function ContextTitleActions({
	primaryAgentId,
}: Readonly<{ primaryAgentId?: CodingAgentId }>) {
	const { initialPreset } = useJiraWorkItemMeta();
	const [selectedAgentId, setSelectedAgentId] = useState<CodingAgentId | null>(
		primaryAgentId ?? (initialPreset === "blank" ? null : "claude-code"),
	);
	const primaryCodingAgent = selectedAgentId
		? CODING_AGENTS.find((agent) => agent.id === selectedAgentId)
		: undefined;
	const codingAgents = primaryCodingAgent
		? CODING_AGENTS.filter((agent) => agent.id !== primaryCodingAgent.id)
		: CODING_AGENTS;

	return (
		<ButtonGroup variant="split">
			<Button
				aria-label={primaryCodingAgent ? `Open in ${primaryCodingAgent.label}` : "Open in"}
				className="has-data-[icon=inline-start]:pl-2 [&_[aria-hidden][data-agent-logo=rovo]_img]:size-3! [&_[aria-hidden][data-agent-logo=rovo]_svg]:size-3! [&_[aria-hidden][data-agent-logo=third-party]_img]:size-4! [&_[aria-hidden][data-agent-logo=third-party]_svg]:size-4!"
				size="compact"
				variant="outline"
			>
				<span
					aria-hidden
					className="inline-flex size-4 shrink-0 items-center justify-center [&_span]:flex! [&_span]:items-center! [&_span]:justify-center!"
					data-agent-logo={primaryCodingAgent?.id === "rovo-cli" ? "rovo" : primaryCodingAgent ? "third-party" : undefined}
					data-icon={primaryCodingAgent ? "inline-start" : undefined}
				>
					{primaryCodingAgent ? primaryCodingAgent.buttonLogo : <CodeIcon aria-hidden size="small" />}
				</span>
				{primaryCodingAgent ? `Open in ${primaryCodingAgent.label}` : "Open in"}
			</Button>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button aria-label="More open options" size="icon-compact" variant="outline">
							<ChevronDownIcon label="" size="small" />
						</Button>
					}
				/>
				<DropdownMenuContent
					align="end"
					className="max-h-[var(--available-height)] p-0"
					positionerClassName="z-[502]"
				>
					<div className="p-1">
						<DropdownMenuGroup>
							{codingAgents.map((agent) => (
								<DropdownMenuItem
									className="h-11 py-0"
									elemBefore={<span aria-hidden className="inline-flex items-center justify-center leading-none">{agent.logo}</span>}
									key={agent.id}
									onSelect={() => setSelectedAgentId(agent.id)}
								>
									<span className="flex h-[34px] min-w-0 flex-col justify-start overflow-hidden">
										<span className="menu-row-title translate-y-2 transition-transform duration-normal ease-out-practical group-data-[highlighted]/dropdown-menu-item:translate-y-0 motion-reduce:transition-none">
											{agent.label}
										</span>
										<span className="menu-row-byline translate-y-1 opacity-0 transition-[transform,opacity] duration-normal ease-out-practical group-data-[highlighted]/dropdown-menu-item:translate-y-0 group-data-[highlighted]/dropdown-menu-item:opacity-100 motion-reduce:transition-none">
											{agent.byline}
										</span>
									</span>
								</DropdownMenuItem>
							))}
						</DropdownMenuGroup>
					</div>
					<div className="sticky bottom-0 border-t border-border bg-surface-overlay p-1">
						<DropdownMenuItem
							className="gap-0.5"
							elemBefore={<CopyIcon label="" size="small" />}
						>
							Copy prompt
						</DropdownMenuItem>
					</div>
				</DropdownMenuContent>
			</DropdownMenu>
		</ButtonGroup>
	);
}
