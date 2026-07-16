"use client";

import type { KeyboardEvent } from "react";
import { useReducedMotion } from "motion/react";
import RefreshIcon from "@atlaskit/icon/core/refresh";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { TerminalDemoController } from "../hooks/use-terminal-demo";
import { TmuxStatusBar } from "./terminal-stage-chrome";
import { TerminalStageClaudePane } from "./terminal-stage-claude-pane";
import { TerminalStageJiraPane } from "./terminal-stage-jira-pane";

// ---------------------------------------------------------------------------
// The "Terminal" design pattern for the Agent Sessions Experience gallery.
//
// A single tmux-style window telling the story "monitor your Jira work and
// code at the same time": a Claude Code session (right) and an invented
// "Jira CLI" sessions dashboard (left) that live-updates as Claude works.
// Presenter-paced: click the frame to split, then →/Space/click advances
// each beat (see `useTerminalDemo`). Advance affordance lives inside the
// frame (status-bar hint + keyboard) — the top bar only shows progress + a
// restart escape hatch, matching `WorkItemControls`.
// ---------------------------------------------------------------------------

export function TerminalControls({
	controller,
}: Readonly<{ controller: TerminalDemoController }>): React.ReactElement {
	const currentBeat = Math.min(controller.state.beatIndex + 1, controller.beatCount);
	return (
		<div className="flex items-center gap-2">
			<span className="text-xs text-text-subtle">
				Beat {currentBeat} / {controller.beatCount}
			</span>
			<Button type="button" variant="outline" size="compact" onClick={controller.restart}>
				<RefreshIcon label="" size="small" />
				Restart
			</Button>
		</div>
	);
}

export function TerminalStage({
	controller,
}: Readonly<{ controller: TerminalDemoController }>): React.ReactElement {
	const shouldReduceMotion = useReducedMotion();
	const { state, awaitingClick, statusHint, activeStep, revealCount, selectedKey, handleFrameClick } = controller;

	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
		if (!awaitingClick) return;
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			handleFrameClick();
		}
	};

	return (
		<div className="relative left-1/2 flex h-full min-h-0 w-screen -translate-x-1/2 items-center justify-center px-8 pb-56">
			<div
				role={awaitingClick ? "button" : undefined}
				tabIndex={awaitingClick ? 0 : undefined}
				aria-label={awaitingClick ? "Split the terminal to open Jira" : undefined}
				onClick={handleFrameClick}
				onKeyDown={handleKeyDown}
				className={cn(
					"flex h-full max-h-[70vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 font-mono text-[13px] text-zinc-100 shadow-2xl",
					awaitingClick ? "cursor-pointer" : "cursor-default",
				)}
			>
				<div
					className="grid min-h-0 flex-1"
					style={{
						gridTemplateColumns: state.split ? "minmax(0,1fr) 1px minmax(0,1fr)" : "0fr 0px 1fr",
						transition: shouldReduceMotion
							? "none"
							: "grid-template-columns var(--duration-slower) var(--ease-in-out)",
					}}
				>
					<div className="min-w-0 overflow-hidden">
						<TerminalStageJiraPane
							pane={state.left}
							items={state.items}
							dashboardVisible={state.dashboardVisible}
							activeStep={activeStep}
							revealCount={revealCount}
							selectedKey={selectedKey}
						/>
					</div>
					<div className="w-px bg-zinc-800" />
					<div className="min-w-0 overflow-hidden">
						<TerminalStageClaudePane pane={state.right} activeStep={activeStep} revealCount={revealCount} />
					</div>
				</div>
				<TmuxStatusBar split={state.split} statusHint={statusHint} />
			</div>
		</div>
	);
}
