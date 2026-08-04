"use client";

import { useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion, type Transition } from "motion/react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RovoColorIcon } from "@/components/ui/logo";
import { LogoThirdParty } from "@/components/ui/logo-third-party";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";
import { CodeIcon } from "@/components/ui/vpk-icons";
import { usePanelLayout } from "@/components/blocks/jira-work-item/experimental-v2/context-panel-layout";
import AddIcon from "@atlaskit/icon/core/add";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import CopyIcon from "@atlaskit/icon/core/copy";
import EyeOpenIcon from "@atlaskit/icon/core/eye-open";
import LockUnlockedIcon from "@atlaskit/icon/core/lock-unlocked";
import ScreenIcon from "@atlaskit/icon/core/screen";
import ShareIcon from "@atlaskit/icon/core/share";
import CloudIcon from "@atlaskit/icon-lab/core/cloud";

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

/** Lock, watch, and share controls rendered in the modal header action row. */
export function ContextHeaderActions() {
	return (
		<>
			<Button aria-label="No restrictions" size="icon" variant="ghost">
				<LockUnlockedIcon label="" />
			</Button>
			<Button className="gap-2" variant="ghost">
				<EyeOpenIcon label="" />
				1
			</Button>
			<Button aria-label="Share" size="icon" variant="ghost">
				<ShareIcon label="" />
			</Button>
		</>
	);
}

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
			className="flex shrink-0 items-center gap-2"
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
	/** Brand glyph. Rovo is a 1P mark; the rest render via `LogoThirdParty`. */
	logo: ReactNode;
}>;

function thirdPartyAgentLogo(name: ThirdPartyLogoName): ReactNode {
	const darkModeClassName =
		name === "cursor" || name === "github-copilot"
			? "dark:brightness-0 dark:invert"
			: undefined;

	return <LogoThirdParty name={name} size="small" borderless className={darkModeClassName} />;
}

/**
 * Coding editors and agents shown in the Open in dropdown. Most map to a
 * registered `LogoThirdParty` brand (Codex/Cursor/Copilot ship with the upstream
 * package or a local `public/3p` fallback); Rovo uses the 1P `RovoColorIcon`.
 */
const CODING_AGENTS: readonly CodingAgent[] = [
	{ id: "claude-code", label: "Claude", logo: thirdPartyAgentLogo("claude") },
	{ id: "codex", label: "Codex", logo: thirdPartyAgentLogo("openai-codex") },
	{ id: "rovo-cli", label: "Rovo", logo: <RovoColorIcon size="small" /> },
	{ id: "cursor", label: "Cursor", logo: thirdPartyAgentLogo("cursor") },
	{ id: "vs-code", label: "VS Code", logo: thirdPartyAgentLogo("vs-code") },
	{ id: "github-copilot", label: "GitHub Copilot", logo: thirdPartyAgentLogo("github-copilot") },
	{ id: "gemini", label: "Gemini", logo: thirdPartyAgentLogo("google-gemini") },
];

/**
 * Resource-row action cluster for the experimental Jira Work Item. Lock,
 * watch, and share live in the modal header. The Open in dropdown lists every
 * available coding agent, each with Local and Cloud destinations.
 */
export function ContextTitleActions({
	primaryAgentId = "claude-code",
}: Readonly<{ primaryAgentId?: CodingAgentId }>) {
	const primaryCodingAgent = CODING_AGENTS.find((agent) => agent.id === primaryAgentId) ?? CODING_AGENTS[0];
	const codingAgents = [
		primaryCodingAgent,
		...CODING_AGENTS.filter((agent) => agent.id !== primaryCodingAgent.id),
	];

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button aria-label="Open in" className="gap-2" variant="outline">
							<CodeIcon aria-hidden size="small" />
							Open in
							<ChevronDownIcon label="" size="small" />
						</Button>
					}
				/>
				<DropdownMenuContent align="end" positionerClassName="z-[502]" className="p-0">
					<div className="max-h-72 overflow-y-auto p-1">
						<DropdownMenuGroup>
							{codingAgents.map((agent) => (
								<DropdownMenuSub key={agent.id}>
									<DropdownMenuSubTrigger className="gap-0.5 [&>:last-child]:opacity-0 hover:[&>:last-child]:opacity-100 data-[highlighted]:[&>:last-child]:opacity-100 data-popup-open:[&>:last-child]:opacity-100">
										<span aria-hidden className="inline-flex size-6 shrink-0 items-center justify-center">
											{agent.logo}
										</span>
										{agent.label}
									</DropdownMenuSubTrigger>
									<DropdownMenuSubContent positionerClassName="z-[503]">
										<DropdownMenuItem elemBefore={<ScreenIcon label="" size="small" />}>
											Local
										</DropdownMenuItem>
										<DropdownMenuItem elemBefore={<CloudIcon label="" size="small" />}>
											Cloud
										</DropdownMenuItem>
									</DropdownMenuSubContent>
								</DropdownMenuSub>
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
			<Button aria-label="Add" size="icon" variant="outline">
				<AddIcon label="" size="small" />
			</Button>
		</>
	);
}
