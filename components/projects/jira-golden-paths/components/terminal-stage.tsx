"use client";

import type { CSSProperties, KeyboardEvent } from "react";
import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";
import type { TerminalDemoController } from "../hooks/use-terminal-demo";
import { TmuxStatusBar } from "./terminal-stage-chrome";
import { TerminalStageClaudePane } from "./terminal-stage-claude-pane";
import { TerminalStageJiraPane } from "./terminal-stage-jira-pane";

// ---------------------------------------------------------------------------
// The "Terminal" design pattern for the Jira Golden Paths gallery.
//
// A single tmux-style window telling the story "monitor your Jira work and
// code at the same time": a Claude Code session (right) and an invented
// "Jira CLI" sessions dashboard (left) that live-updates as Claude works.
// Presenter-paced: click the frame to split, then →/Space/click advances
// each beat (see `useTerminalDemo`). Advance affordance lives inside the
// frame (status-bar hint + keyboard); the top bar only shows beat progress.
// Reset is owned by the gallery's Reset control (wired to `restart` in
// `page.tsx`), so there's no dedicated restart button here — `r`/`R` still
// restarts from the keyboard.
// ---------------------------------------------------------------------------

// The terminal uses Tailwind `zinc-*` and accent color utilities. In this repo
// those utilities compile straight to ADS `--ds-*` tokens (e.g. `bg-zinc-950` →
// `background-color: var(--ds-text-accent-gray-bolder)`; see the aliases in
// `app/tailwind-theme.css`), and those tokens FLIP with the app color mode — so
// the frame would invert to light whenever the OS/app is in dark mode. To keep
// the frame a real, always-dark terminal — dark chrome around it, but never
// inverting — we pin the exact `--ds-*` tokens it references to fixed hex values
// on the frame wrapper. These are the light-mode resolutions (the intended
// terminal look), so the frame renders identically in every theme.
const TERMINAL_FRAME_ZINC_VARS = {
	// zinc-950 / zinc-900 (frame bg, deepest text)
	"--ds-text-accent-gray-bolder": "#1E1F21",
	// zinc-800 (borders, dividers, selected row bg)
	"--ds-background-accent-gray-bolder-pressed": "#3B3D42",
	// zinc-500 (dim text)
	"--ds-chart-gray-bolder": "#7D818A",
	// zinc-400
	"--ds-chart-gray-bold": "#8C8F97",
	// zinc-300 (body text)
	"--ds-background-accent-gray-subtle": "#8C8F97",
	// zinc-100 (bright text)
	"--ds-background-accent-gray-subtler": "#DDDEE1",
	// accent tones (syntax + status glyphs)
	"--ds-background-accent-blue-subtle": "#669DF1", // blue-300
	"--ds-chart-blue-bold": "#4688EC", // blue-400
	"--ds-chart-green-bold": "#22A06B", // green-400
	"--ds-background-accent-yellow-subtle-hovered": "#DDB30E", // yellow-300
	"--ds-chart-red-bold": "#F15B50", // red-400
	"--ds-background-accent-purple-subtle": "#C97CF4", // purple-300
} as CSSProperties;

export function TerminalControls({
	controller,
}: Readonly<{ controller: TerminalDemoController }>): React.ReactElement {
	const currentBeat = Math.min(controller.state.beatIndex + 1, controller.beatCount);
	return (
		<div className="flex items-center gap-3 text-sm text-text">
			<Kbd>left</Kbd>
			<span>
				Beat {currentBeat} — {controller.beatCount}
			</span>
			<Kbd>right</Kbd>
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
		// The terminal frame must always render dark, independent of the app's
		// color mode. In this repo every Tailwind `zinc-*` utility is aliased to an
		// ADS `--ds-*` token (see `app/tailwind-theme.css`), so `bg-zinc-950` etc.
		// FLIP with the theme — dark in light mode, light in dark mode. That made
		// the frame invert whenever the OS/app was in dark mode. Instead of relying
		// on those theme-relative tokens, we pin the `zinc` scale to fixed hex
		// values on this wrapper, so the frame is dark in every theme while the
		// surrounding gallery chrome still follows dark mode (see `page.tsx`).
		<div
			style={TERMINAL_FRAME_ZINC_VARS}
			className="relative left-1/2 flex h-full min-h-0 w-screen -translate-x-1/2 items-center justify-center px-8"
		>
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
