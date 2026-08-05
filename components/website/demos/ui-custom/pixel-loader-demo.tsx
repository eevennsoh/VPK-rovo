"use client";

import { PixelLoader } from "@/components/ui-custom/pixel-loader";

/** The full loading experience: grid + shimmering label + live elapsed timer. */
export default function PixelLoaderDemo() {
	return <PixelLoader pattern="chevron" label="Churning" showElapsed />;
}

export function PixelLoaderDemoShapes() {
	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center gap-8">
				<span className="w-16 text-xs text-text-subtlest">Square</span>
				<PixelLoader shape="square" size="small" pattern="wave-left-to-right" />
				<PixelLoader shape="square" size="medium" pattern="wave-left-to-right" />
				<PixelLoader shape="square" size="large" pattern="wave-left-to-right" />
				<PixelLoader shape="square" size="xlarge" pattern="wave-left-to-right" />
			</div>
			<div className="flex items-center gap-8">
				<span className="w-16 text-xs text-text-subtlest">Dots</span>
				<PixelLoader shape="dot" size="small" pattern="wave-left-to-right" />
				<PixelLoader shape="dot" size="medium" pattern="wave-left-to-right" />
				<PixelLoader shape="dot" size="large" pattern="wave-left-to-right" />
				<PixelLoader shape="dot" size="xlarge" pattern="wave-left-to-right" />
			</div>
		</div>
	);
}

/**
 * The two colour modes side by side on opposite surfaces.
 *
 * `default` has no colour of its own, so it inherits and stays legible on
 * either surface. `rovo` paints raw brand hex, identical in both — that is the
 * whole point of the mode.
 */
export function PixelLoaderDemoRovo() {
	return (
		<div className="grid gap-4 sm:grid-cols-2">
			<div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6">
				<span className="text-xs text-text-subtlest">Light surface</span>
				<PixelLoader size="xlarge" pattern="diagonal-top-left" label="Default" />
				<PixelLoader size="xlarge" pattern="diagonal-top-left" color="rovo" label="Rovo spot" />
			</div>
			{/* Fixed hex rather than a nested `dark` class: ADS tokens only switch
			    via setGlobalTheme(), so a local class would leave them light. */}
			<div className="flex flex-col gap-4 rounded-lg bg-[#1D2125] p-6 text-[#E4E6EA]">
				<span className="text-xs opacity-60">Dark surface</span>
				<PixelLoader size="xlarge" pattern="diagonal-top-left" label="Default" />
				<PixelLoader size="xlarge" pattern="diagonal-top-left" color="rovo" label="Rovo spot" />
			</div>
		</div>
	);
}

const DIRECTIONS = [
	{ pattern: "wave-left-to-right", caption: "Left to right" },
	{ pattern: "wave-right-to-left", caption: "Right to left" },
	{ pattern: "wave-top-to-bottom", caption: "Top to bottom" },
	{ pattern: "wave-bottom-to-top", caption: "Bottom to top" },
	{ pattern: "diagonal-top-left", caption: "Diagonal, from top left" },
	{ pattern: "diagonal-top-right", caption: "Diagonal, from top right" },
	{ pattern: "diagonal-bottom-left", caption: "Diagonal, from bottom left" },
	{ pattern: "diagonal-bottom-right", caption: "Diagonal, from bottom right" },
] as const;

/** The eight directional sweeps — the grid growing at different angles. */
export function PixelLoaderDemoDirections() {
	return (
		<div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
			{DIRECTIONS.map(({ pattern, caption }) => (
				<div key={pattern} className="flex flex-col items-center gap-3">
					<PixelLoader pattern={pattern} size="xlarge" />
					<span className="text-center text-xs text-text-subtlest">{caption}</span>
				</div>
			))}
		</div>
	);
}

/** Inline with copy — the size the loader is actually used at most often. */
export function PixelLoaderDemoInline() {
	return (
		<div className="flex flex-col gap-3 text-sm text-text">
			<p className="flex items-center gap-2">
				<PixelLoader size="small" pattern="waterfall" />
				<span>Indexing 1,284 work items</span>
			</p>
			<PixelLoader pattern="chevron" label="Churning" showElapsed />
			<PixelLoader shape="dot" pattern="frame" label="Reticulating splines" showElapsed />
		</div>
	);
}
