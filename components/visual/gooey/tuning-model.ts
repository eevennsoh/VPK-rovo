export interface EvolveOptions {
	massStiffness?: number;
	massDamping?: number;
	sizeStiffness?: number;
	sizeDamping?: number;
	radiusStiffness?: number;
	radiusDamping?: number;
	contentBlur?: number;
	roundness?: number;
	cornerDuration?: number;
	cornerDelay?: number;
	cornerEase?: string;
	anticipation?: number;
	travel?: number;
}

export interface MoveOptions {
	stiffness?: number;
	damping?: number;
	stretch?: number;
	tail?: number;
}

export interface DissolveOptions {
	blur?: number;
	warp?: number;
	pull?: number;
	range?: number;
	zone?: number;
	mix?: number;
	gravity?: number;
	taper?: number;
	warpFreq?: number;
	flowSpeed?: number;
	warpStyle?: "fractalNoise" | "turbulence";
	detail?: number;
	active?: boolean;
	releaseMs?: number;
	fadeMs?: number;
	strength?: number;
	sink?: number;
}

export interface MorphTuning {
	shape?: boolean;
	speed?: number;
	bounce?: number;
	contentBlur?: number;
	advanced?: {
		evolve?: EvolveOptions;
		blobInset?: number;
		bridgeGrow?: number;
	};
}

export interface MoveTuning {
	springiness?: number;
	wobble?: number;
	stretch?: number;
	trail?: number;
	advanced?: MoveOptions;
}

export const EVOLVE_DEFAULTS: Required<EvolveOptions> = {
	massStiffness: 320,
	massDamping: 17,
	sizeStiffness: 170,
	sizeDamping: 11.5,
	radiusStiffness: 900,
	radiusDamping: 60,
	contentBlur: 7,
	roundness: 1,
	cornerDuration: 460,
	cornerDelay: 0,
	cornerEase: "cubic-bezier(0.3, 1.05, 0.4, 1)",
	anticipation: 90,
	travel: 32,
};

export const MOVE_DEFAULTS: Required<MoveOptions> = {
	stiffness: 380,
	damping: 18,
	stretch: 0.18,
	tail: 0.46,
};

export const MORPH_DEFAULTS = {
	shape: false,
	speed: 1,
	bounce: 0.5,
	contentBlur: 7,
} as const satisfies Readonly<MorphTuning>;

export const MOVE_TUNING_DEFAULTS = {
	springiness: 0.5,
	wobble: 0.5,
	stretch: 0.36,
	trail: 0.575,
} as const satisfies Readonly<MoveTuning>;

/**
 * `<Gooey>` root filter defaults retained for the VPK playground and callers
 * that seed controls from the component's public defaults.
 */
export const GOOEY_DEFAULTS = {
	blur: 6,
	contrast: 18,
	fill: "#fff",
	filterPadding: 24,
	waviness: 0,
	wavinessFreq: 0.018,
} as const;

export const DISSOLVE_DEFAULTS = {
	blur: 8,
	warp: 26,
	pull: 4,
	range: 49,
	zone: 18,
	mix: 0.7,
	gravity: 60,
	taper: 1,
	warpFreq: 1.7,
	flowSpeed: 22,
	warpStyle: "fractalNoise",
	detail: 2,
	active: true,
	releaseMs: 110,
	fadeMs: 110,
	strength: 1,
	sink: 0.8,
} as const satisfies Required<DissolveOptions>;

export function resolveDissolveTimings(
	releaseMs: number | undefined,
	fadeMs: number | undefined,
): { lifetimeMs: number; fadeMs: number } {
	const release = Math.max(0, releaseMs ?? 240);
	const fade = Math.max(0, fadeMs ?? release);
	return { lifetimeMs: Math.max(release, fade), fadeMs: fade };
}

function dampingRatio(bounce: number): number {
	return Math.max(0.12, 1 - 1.1 * Math.min(1, Math.max(0, bounce)));
}

export function resolveMorphTuning(tuning: MorphTuning | undefined): EvolveOptions {
	const speed = Math.max(0.25, tuning?.speed ?? MORPH_DEFAULTS.speed);
	const dampingScale = dampingRatio(tuning?.bounce ?? MORPH_DEFAULTS.bounce)
		/ dampingRatio(MORPH_DEFAULTS.bounce);
	return {
		massStiffness: EVOLVE_DEFAULTS.massStiffness * speed * speed,
		massDamping: EVOLVE_DEFAULTS.massDamping * speed * dampingScale,
		sizeStiffness: EVOLVE_DEFAULTS.sizeStiffness * speed * speed,
		sizeDamping: EVOLVE_DEFAULTS.sizeDamping * speed * dampingScale,
		radiusStiffness: EVOLVE_DEFAULTS.radiusStiffness * speed * speed,
		radiusDamping: EVOLVE_DEFAULTS.radiusDamping * speed,
		cornerDuration: EVOLVE_DEFAULTS.cornerDuration / speed,
		contentBlur: tuning?.contentBlur ?? MORPH_DEFAULTS.contentBlur,
	};
}

export function resolveDissolveTuning(dissolve: boolean | number): DissolveOptions {
	const strength = typeof dissolve === "number"
		? Math.min(1, Math.max(0, dissolve))
		: 1;
	return { ...DISSOLVE_DEFAULTS, strength };
}

export function resolveMoveTuning(tuning: MoveTuning | undefined): MoveOptions {
	const springiness = Math.min(1, Math.max(0, tuning?.springiness ?? MOVE_TUNING_DEFAULTS.springiness));
	const stiffness = MOVE_DEFAULTS.stiffness * Math.pow(10, springiness - 0.5);
	const damping = MOVE_DEFAULTS.damping
		* Math.sqrt(stiffness / MOVE_DEFAULTS.stiffness)
		* (dampingRatio(tuning?.wobble ?? MOVE_TUNING_DEFAULTS.wobble)
			/ dampingRatio(MOVE_TUNING_DEFAULTS.wobble));
	return {
		stiffness,
		damping,
		stretch: 0.5 * Math.min(1, Math.max(0, tuning?.stretch ?? MOVE_TUNING_DEFAULTS.stretch)),
		tail: 0.8 * Math.min(1, Math.max(0, tuning?.trail ?? MOVE_TUNING_DEFAULTS.trail)),
		...tuning?.advanced,
	};
}
