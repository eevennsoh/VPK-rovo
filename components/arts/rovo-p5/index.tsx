"use client";

import { useCallback, useState } from "react";

import ChevronUpIcon from "@atlaskit/icon/core/chevron-up";
import dynamic from "next/dynamic";
import { useReducedMotion } from "motion/react";

import RovoP5Controls from "@/components/arts/rovo-p5/rovo-p5-controls";
import RovoP5Transport from "@/components/arts/rovo-p5/rovo-p5-transport";
import { resolveRovoP5Backdrop } from "@/components/arts/rovo-p5/data/rovo-p5-backdrop";
import type { RovoP5Direction } from "@/components/arts/rovo-p5/lib/rovo-p5-timeline";
import { useRovoP5Params } from "@/components/arts/rovo-p5/hooks/use-rovo-p5-params";
import { useSystemThemePreference } from "@/components/arts/rovo-p5/hooks/use-system-theme-preference";
import { RovoColorIcon } from "@/components/ui/logo";
import { useTheme } from "@/components/utils/theme-wrapper";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

// p5 touches `window` at import time, so the canvas never renders on the
// server. This guard is what keeps the static export build (`build:export`)
// working alongside the direct import in `app/arts/rovo-p5/page.tsx`.
const RovoP5Canvas = dynamic(() => import("@/components/arts/rovo-p5/rovo-p5-canvas"), {
	ssr: false,
});

// The app shell already renders a `<main id="main-content">`, so this surface
// is a `<section>`: a nested second `main` trips three axe landmark rules.
export default function RovoP5({
	className,
	...props
}: Readonly<React.ComponentProps<"section">>) {
	const controller = useRovoP5Params();
	const [resetToken, setResetToken] = useState(0);
	const reducedMotion = Boolean(useReducedMotion());

	// The cycle plays itself; the transport is here for pausing on a stage and
	// for scrubbing back to one. Reduced motion holds it on a single frame.
	const [playing, setPlaying] = useState(true);
	const [elapsed, setElapsed] = useState(0);
	const [stageLabel, setStageLabel] = useState("");
	const [seekRequest, setSeekRequest] = useState<{ seconds: number } | null>(null);

	// Tucked away for screen capture. The bar translates off the bottom rather
	// than unmounting, so the cycle keeps playing behind it.
	const [transportOpen, setTransportOpen] = useState(true);

	useSystemThemePreference();
	const { actualTheme } = useTheme();
	const backdrop = resolveRovoP5Backdrop(actualTheme);

	// Called every frame, so it must not re-render unless something visible in
	// the transport actually changed — the scrubber only reads to a tenth.
	const handleProgress = useCallback((seconds: number, direction: RovoP5Direction) => {
		setElapsed((previous) => (Math.abs(previous - seconds) < 0.1 ? previous : seconds));
		setStageLabel((previous) => (previous === direction.label ? previous : direction.label));
	}, []);

	// A new object every time, so scrubbing back to the same position still
	// seeks rather than being deduplicated away by React.
	const handleSeek = useCallback((seconds: number) => {
		setSeekRequest({ seconds });
		setElapsed(seconds);
	}, []);

	const handleRestart = useCallback(() => {
		setSeekRequest({ seconds: 0 });
		setElapsed(0);
		setPlaying(true);
	}, []);

	const handleReset = useCallback(() => {
		controller.reset();
		setResetToken((previous) => previous + 1);
		setElapsed(0);
		setPlaying(true);
	}, [controller]);

	return (
		<section
			aria-label="Rovo p5"
			// `w-full` is load-bearing: the canvas and the control panel are both
			// absolutely positioned, so the only in-flow content is the small
			// header. As a flex item in the gallery preview (a centred flex row)
			// this would otherwise collapse to the header's intrinsic width.
			className={cn("relative min-h-svh w-full overflow-hidden", className)}
			style={{ backgroundColor: backdrop.shell }}
			{...props}
		>
			<RovoP5Canvas
				backdrop={backdrop}
				className="absolute inset-0"
				onProgress={handleProgress}
				params={controller.params}
				playing={playing && !reducedMotion}
				resetToken={resetToken}
				seekRequest={seekRequest}
			/>

			<header className="pointer-events-none relative flex items-center gap-3 px-4 py-5 sm:px-8">
				<RovoColorIcon size="small" />
				<div className="min-w-0">
					{/* Fixed literals per scheme rather than a token: `text-white` is
					    remapped to `--ds-text-inverse` here and would invert, and the
					    canvas backdrop is deeper than any ADS surface. */}
					<h1 className="truncate text-sm font-semibold" style={{ color: backdrop.text }}>
						Rovo p5
					</h1>
					<p
						className="truncate font-mono text-[11px] uppercase tracking-wider opacity-45"
						style={{ color: backdrop.text }}
					>
						{reducedMotion
							? "Static frame — motion reduced"
							: controller.params.timeline
								? stageLabel || "Graph to mark"
								: "Manual · drag to orbit"}
					</p>
				</div>
			</header>

			{/* Raised clear of the site's floating toolbar, which sits bottom-centre. */}
			<div
				aria-hidden={!transportOpen}
				// `inert` as well as `aria-hidden`: the bar is translated out of view
				// rather than unmounted, so without it the buttons and the scrubber
				// stay in the tab order and Tab lands focus off-screen.
				inert={!transportOpen}
				className={cn(
					"pointer-events-none absolute inset-x-0 bottom-20 flex justify-center px-4 transition-[transform,opacity] duration-medium ease-in-out motion-reduce:transition-none sm:px-8",
					transportOpen ? "translate-y-0 opacity-100" : "translate-y-[calc(100%+6rem)] opacity-0",
				)}
			>
				<div
					className="pointer-events-auto w-full max-w-xl rounded-lg bg-surface-overlay px-4 py-2"
					style={{ boxShadow: token("elevation.shadow.overlay") }}
				>
					<RovoP5Transport
						disabled={reducedMotion || !controller.params.timeline}
						elapsed={elapsed}
						onMinimize={() => setTransportOpen(false)}
						onRestart={handleRestart}
						onSeek={handleSeek}
						onTogglePlay={() => setPlaying((previous) => !previous)}
						playing={playing}
						stageLabel={stageLabel}
					/>
				</div>
			</div>

			{/* Anchored flush to the very bottom edge as a half-tab, rather than
			    floating where the bar used to sit — a handle left at the bar's own
			    height still reads as chrome over the canvas. Visible at rest:
			    hover-to-reveal made the bar look like it had gone for good. */}
			<div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
				<button
					aria-expanded={transportOpen}
					aria-label="Show the playback controls"
					className={cn(
						"flex h-5 w-12 items-end justify-center rounded-t-md bg-surface-overlay pb-0.5 text-icon-subtle transition-opacity duration-medium ease-out-practical outline-none motion-reduce:transition-none",
						"focus-visible:ring-2 focus-visible:ring-ring",
						transportOpen
							? "pointer-events-none opacity-0"
							: "pointer-events-auto opacity-60 hover:opacity-100 focus-visible:opacity-100",
					)}
					onClick={() => setTransportOpen(true)}
					style={{ boxShadow: token("elevation.shadow.overlay") }}
					type="button"
				>
					<ChevronUpIcon label="" size="small" />
				</button>
			</div>

			<div className="pointer-events-none absolute inset-x-0 bottom-40 flex justify-end p-4 sm:inset-y-0 sm:bottom-auto sm:left-auto sm:items-center sm:p-6">
				<div
					className="pointer-events-auto w-full max-w-xs rounded-lg bg-surface-overlay p-4"
					style={{ boxShadow: token("elevation.shadow.overlay") }}
				>
					<RovoP5Controls
						controller={controller}
						onReset={handleReset}
						reducedMotion={reducedMotion}
					/>
				</div>
			</div>
		</section>
	);
}
