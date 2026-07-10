"use client";

import { useClicky } from "@/components/projects/rovo-core/hooks/use-clicky";
import { useRealtimeVoice } from "@/components/projects/studio/hooks/use-realtime-voice";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";
import { cn } from "@/lib/utils";
import { AnimatePresence, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { detectAgentTeamIntent } from "./agent-team-intent";
import { pickAgentTeamLine } from "./agent-team-lines";
import { CURSOR_AGENTS } from "./cursor-agents";
import type { CursorFanOutBurst } from "./cursor-fan-math";
import { CursorLaunchTooltips } from "./cursor-launch-tooltips";
import { CursorOrbitSatellitesDom, TRACE_CYCLE_MS } from "./cursor-orbit-satellites-dom";
import { CursorSpeechBubble } from "./cursor-speech-bubble";
import { CursorVoiceControl } from "./cursor-voice-control";
import { detectLaunchIntent } from "./launch-intent";
import { CursorScene } from "./three/cursor-scene";

interface CursorsProps {
	className?: string;
}

// Stable empty thread context — this art has no chat surface to summarize.
const NO_CHAT_MESSAGES: RovoUIMessage[] = [];
// Total time for the staggered launch send-off before the team is cleared.
const LAUNCH_SEQUENCE_MS = 2500;
// How long Rovo's reply lingers (in the cursor-following bubble) after the last
// streamed delta before it clears.
const SPEECH_LINGER_MS = 3000;
// How long the team caption ("The Rovo gang's all here.") holds before it
// scales back out — the team cursors stay, only the caption dismisses (mirrors
// the cursor's "Yo, let's cook" welcome, which auto-dismisses while the cursor
// persists).
const TEAM_CAPTION_HOLD_MS = 2600;
// The 3D follower's welcome line, shown once on the off → idle activation
// transition (this art no longer renders the shared `ClickyOverlay`, which
// used to own this message).
const WELCOME_MESSAGE = "Yo, let's cook";
const WELCOME_HOLD_MS = 2400;

function resolveDeltaText(payload: { text?: string; transcript?: string } | string): string | undefined {
	if (typeof payload === "string") {
		return payload;
	}
	return payload.text ?? payload.transcript;
}

/**
 * Cursors — the live-voice + Rovo cursor control (no text composer).
 *
 * Every cursor in this art is a 3D WebGL mesh rendered by the single
 * full-viewport `CursorScene` canvas: the pointer-following iridescent
 * cursor (driven by `useClicky()`'s `state`, replacing the shared
 * `ClickyOverlay`), the 4 agent-colored fan-out cursors ("create me a team
 * of agents"), and — once the team launches — 4 mini cursors orbiting the
 * liquid-metal voice button ("team at work"). `CursorScene` mounts once (on
 * first activation) and stays mounted for the session to avoid WebGL context
 * churn; each child mesh group self-gates its own visibility. DOM companions
 * (`CursorLaunchTooltips`, `CursorOrbitSatellitesDom`) supply the send-off
 * chips and accessible hover/focus proxies for the 3D content. Hovering a
 * satellite proxy pauses the orbit and surfaces that agent's trace as the
 * caption.
 */
export default function Cursors({ className }: Readonly<CursorsProps>) {
	const clicky = useClicky();
	const reducedMotion = useReducedMotion();
	const [burst, setBurst] = useState<CursorFanOutBurst | null>(null);
	const [launching, setLaunching] = useState(false);
	// Whether the dispatched team is now "working" (orbits the voice button).
	const [working, setWorking] = useState(false);
	// Rovo's streamed reply, shown in a cursor-following bubble (null = silent).
	const [speech, setSpeech] = useState<string | null>(null);
	// The team caption, shown briefly then auto-dismissed (team cursors persist).
	const [teamCaption, setTeamCaption] = useState<string | null>(null);
	// The one-time welcome line on activation (replaces ClickyOverlay's).
	const [welcome, setWelcome] = useState<string | null>(null);
	// Which orbiting agent (if any) is currently hovered/focused via the DOM proxies.
	const [hoveredAgent, setHoveredAgent] = useState<number | null>(null);
	// Cycles the hovered-agent caption trace on the same cadence as the DOM
	// proxies' own tooltips (a separate concern — see TRACE_CYCLE_MS).
	const [traceTick, setTraceTick] = useState(0);
	// Whether the R3F scene has ever been needed — once true it stays mounted
	// for the session (never torn down/rebuilt per toggle: WebGL context churn).
	const [sceneMounted, setSceneMounted] = useState(false);
	// Measured voice-button center: a plain ref for the R3F orbit (no
	// re-render) plus mirrored state for the DOM satellite proxies.
	const voiceButtonElRef = useRef<HTMLButtonElement>(null);
	const voiceCenterRef = useRef<{ x: number; y: number } | null>(null);
	const [voiceCenter, setVoiceCenter] = useState<{ x: number; y: number } | null>(null);

	const burstIdRef = useRef(0);
	const pointerRef = useRef<{ x: number; y: number } | null>(null);
	const clickyActiveRef = useRef(false);
	clickyActiveRef.current = clicky.isActive;
	// The last line shown (avoid immediate repeats), whether a team is up (so the
	// model's real answer doesn't overwrite the funny caption), and whether the
	// team is mid-launch (so a second "let's go" doesn't restart it).
	const lastLineRef = useRef<string | null>(null);
	const burstActiveRef = useRef(false);
	const launchingRef = useRef(false);
	launchingRef.current = launching;
	const launchTimerRef = useRef<number | null>(null);
	const speechTimerRef = useRef<number | null>(null);
	const captionTimerRef = useRef<number | null>(null);
	const welcomeTimerRef = useRef<number | null>(null);
	const prevClickyStateRef = useRef(clicky.state);

	// Mount the R3F scene once activity begins, then never unmount it.
	useEffect(() => {
		if (!sceneMounted && (clicky.isActive || burst !== null || working)) {
			setSceneMounted(true);
		}
	}, [sceneMounted, clicky.isActive, burst, working]);

	// Measure the voice button's viewport rect center for the 3D orbit + its
	// DOM accessibility proxies. Re-measures on resize and whenever `working`
	// flips (the rail's content can shift the button's box).
	useEffect(() => {
		const measure = () => {
			const el = voiceButtonElRef.current;
			if (!el) {
				return;
			}
			const rect = el.getBoundingClientRect();
			const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
			voiceCenterRef.current = center;
			setVoiceCenter(center);
		};
		measure();
		window.addEventListener("resize", measure);
		return () => window.removeEventListener("resize", measure);
	}, [working]);

	// One-time welcome line on the off → idle activation transition.
	useEffect(() => {
		const previous = prevClickyStateRef.current;
		prevClickyStateRef.current = clicky.state;
		if (previous !== "off" || clicky.state !== "idle") {
			return;
		}
		setWelcome(WELCOME_MESSAGE);
		if (welcomeTimerRef.current !== null) {
			window.clearTimeout(welcomeTimerRef.current);
		}
		welcomeTimerRef.current = window.setTimeout(() => {
			welcomeTimerRef.current = null;
			setWelcome(null);
		}, WELCOME_HOLD_MS);
	}, [clicky.state]);

	// Cycle the hovered-agent caption trace while the team is working.
	useEffect(() => {
		if (!working || reducedMotion) {
			return;
		}
		const id = window.setInterval(() => {
			setTraceTick((prev) => prev + 1);
		}, TRACE_CYCLE_MS);
		return () => window.clearInterval(id);
	}, [working, reducedMotion]);

	// Track the pointer so the fan-out can originate where the Rovo cursor is.
	useEffect(() => {
		pointerRef.current = { x: window.innerWidth / 2, y: window.innerHeight * 0.55 };
		const handlePointerMove = (event: PointerEvent) => {
			pointerRef.current = { x: event.clientX, y: event.clientY };
		};
		window.addEventListener("pointermove", handlePointerMove, { passive: true });
		return () => window.removeEventListener("pointermove", handlePointerMove);
	}, []);

	useEffect(
		() => () => {
			if (launchTimerRef.current !== null) {
				window.clearTimeout(launchTimerRef.current);
			}
			if (speechTimerRef.current !== null) {
				window.clearTimeout(speechTimerRef.current);
			}
			if (captionTimerRef.current !== null) {
				window.clearTimeout(captionTimerRef.current);
			}
			if (welcomeTimerRef.current !== null) {
				window.clearTimeout(welcomeTimerRef.current);
			}
		},
		[],
	);

	const triggerFanOut = useCallback(() => {
		const origin = pointerRef.current ?? {
			x: window.innerWidth / 2,
			y: window.innerHeight * 0.55,
		};
		const line = pickAgentTeamLine(lastLineRef.current);
		lastLineRef.current = line;
		// Re-summoning from a working state starts fresh.
		setWorking(false);
		burstActiveRef.current = true;
		burstIdRef.current += 1;
		setBurst({ id: burstIdRef.current, x: origin.x, y: origin.y, line });
		// Show the caption, then let it scale back out on its own — the team
		// cursors stay up, only the caption dismisses (like the welcome bubble).
		setTeamCaption(line);
		if (captionTimerRef.current !== null) {
			window.clearTimeout(captionTimerRef.current);
		}
		captionTimerRef.current = window.setTimeout(() => {
			captionTimerRef.current = null;
			setTeamCaption(null);
		}, TEAM_CAPTION_HOLD_MS);
	}, []);

	const clearTeam = useCallback(() => {
		if (launchTimerRef.current !== null) {
			window.clearTimeout(launchTimerRef.current);
			launchTimerRef.current = null;
		}
		if (speechTimerRef.current !== null) {
			window.clearTimeout(speechTimerRef.current);
			speechTimerRef.current = null;
		}
		if (captionTimerRef.current !== null) {
			window.clearTimeout(captionTimerRef.current);
			captionTimerRef.current = null;
		}
		burstActiveRef.current = false;
		setBurst(null);
		setLaunching(false);
		setWorking(false);
		setSpeech(null);
		setTeamCaption(null);
		setHoveredAgent(null);
	}, []);

	// The team has been dispatched — drop the launch visuals and enter the
	// "working" state (the team now orbits the voice button). burstActiveRef
	// is cleared so Rovo replies flow back into the cursor-following bubble.
	const enterWorking = useCallback(() => {
		if (launchTimerRef.current !== null) {
			window.clearTimeout(launchTimerRef.current);
			launchTimerRef.current = null;
		}
		burstActiveRef.current = false;
		setBurst(null);
		setLaunching(false);
		setWorking(true);
	}, []);

	// Stagger the team off-screen, then enter the working state once the last
	// cursor has flown.
	const startLaunch = useCallback(() => {
		// Drop any lingering team caption before the send-off begins.
		if (captionTimerRef.current !== null) {
			window.clearTimeout(captionTimerRef.current);
			captionTimerRef.current = null;
		}
		setTeamCaption(null);
		setLaunching(true);
		if (launchTimerRef.current !== null) {
			window.clearTimeout(launchTimerRef.current);
		}
		launchTimerRef.current = window.setTimeout(enterWorking, LAUNCH_SEQUENCE_MS);
	}, [enterWorking]);

	const realtime = useRealtimeVoice({
		// No Rovo chat surface in the art — keep the session conversational only.
		onDelegateToRovo: () => {},
		chatMessages: NO_CHAT_MESSAGES,
		// Drive the on-screen cursor from the live conversation, like Studio.
		onSpeechStarted: () => clicky.startListening(),
		onAssistantTextDelta: (payload) => {
			// While the team is up, the team caption stands in for Rovo's reply.
			if (burstActiveRef.current) {
				return;
			}
			// The reply bubble is cursor UI — if cursor mode is off (voice-only,
			// after toggling the cursor off while voice keeps running), don't
			// render a floating cursor-following bubble with no cursor.
			if (!clickyActiveRef.current) {
				return;
			}
			const text = resolveDeltaText(payload);
			if (!text) {
				return;
			}
			// Show Rovo's reply in a cursor-following bubble. The empty startSpeaking
			// keeps the cursor's speaking glyph without the overlay's fixed bubble.
			clicky.startSpeaking("");
			setSpeech(text);
			if (speechTimerRef.current !== null) {
				window.clearTimeout(speechTimerRef.current);
			}
			speechTimerRef.current = window.setTimeout(() => {
				speechTimerRef.current = null;
				setSpeech(null);
				clicky.returnToIdle();
			}, SPEECH_LINGER_MS);
		},
		onSpeechTranscriptCompleted: (payload) => {
			const text = resolveDeltaText(payload);
			if (!text) {
				return;
			}
			// With a team up, "let's go" sends them off; otherwise asking for a
			// team of agents fans a new one out.
			if (burstActiveRef.current) {
				if (!launchingRef.current && detectLaunchIntent(text)) {
					startLaunch();
				}
				return;
			}
			if (clickyActiveRef.current && detectAgentTeamIntent(text)) {
				triggerFanOut();
			}
		},
	});

	// Cursor mode + live voice come up together, mirroring the Studio composer.
	const startRealtimeVoice = useCallback(() => {
		clicky.activate();
		realtime.connect();
	}, [clicky, realtime]);

	const handleToggleRealtimeVoice = useCallback(() => {
		if (realtime.voiceState === "idle") {
			startRealtimeVoice();
			return;
		}

		realtime.disconnect();
		clicky.deactivate();
		clearTeam();
	}, [clearTeam, clicky, realtime, startRealtimeVoice]);

	// Activating the cursor starts voice; deactivating it leaves voice running
	// (only the waveform/stop control disconnects) — same contract as Studio.
	const handleToggleClicky = useCallback(() => {
		if (clicky.isActive) {
			clicky.deactivate();
			clearTeam();
			return;
		}

		startRealtimeVoice();
	}, [clearTeam, clicky, startRealtimeVoice]);

	// The trace currently shown for a hovered/focused orbiting agent, if any —
	// takes priority over every other caption source.
	const hoveredAgentData = hoveredAgent !== null ? CURSOR_AGENTS[hoveredAgent] : undefined;
	const hoveredTrace = hoveredAgentData
		? hoveredAgentData.traces[(reducedMotion ? 0 : traceTick) % hoveredAgentData.traces.length]
		: null;

	// Rovo's line: hovering an orbiting agent wins, then the auto-dismissing
	// team caption while a team is up, then the one-time welcome, then the
	// streamed reply. Shown in a bubble that trails the cursor.
	const captionText = hoveredTrace ?? teamCaption ?? welcome ?? speech;

	return (
		<div className={cn("flex items-center justify-center bg-surface px-6 py-16", className)}>
			{/* Always-visible cursor + voice rail. Voice stays idle (calm static
			    waveform) until the human clicks — nothing auto-connects. */}
			<CursorVoiceControl
				clickyActive={clicky.isActive}
				voiceActive={realtime.voiceState !== "idle"}
				listening={realtime.voiceState === "listening"}
				micStream={realtime.micStream}
				working={working}
				onToggleCursor={handleToggleClicky}
				onToggleVoice={handleToggleRealtimeVoice}
				voiceButtonRef={voiceButtonElRef}
			/>

			{sceneMounted ? (
				<CursorScene
					followerState={clicky.state}
					burst={burst}
					launching={launching}
					working={working}
					orbitPaused={hoveredAgent !== null}
					orbitCenterRef={voiceCenterRef}
				/>
			) : null}

			<CursorLaunchTooltips burst={burst} launching={launching} />

			<CursorOrbitSatellitesDom working={working} center={voiceCenter} onHoverAgent={setHoveredAgent} />

			<AnimatePresence>
				{captionText ? <CursorSpeechBubble key="rovo-speech" text={captionText} /> : null}
			</AnimatePresence>
		</div>
	);
}
