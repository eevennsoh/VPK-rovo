"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { parseColor } from "@/components/ui-custom/lib/shimmer-colors";

import {
	resolveLinkingEffectFrame,
	type LinkingEffectFrame,
	type LinkingEffectMember,
} from "./field";
import {
	advanceLinkingEffectVelocity,
	lerpLinkingEffectTarget,
	resolveLinkingEffectFuseNearness,
	resolveLinkingEffectFuseProgress,
	type LinkingEffectTarget,
	type LinkingEffectVector,
} from "./lifecycle";

/**
 * Both blobs are the *link material* — one substance the two subjects are
 * becoming — rather than the source's own surface colour. The field's whole job
 * is to show them merging, and it can only do that in a colour that reads
 * against the surface it necks across: tinting the source blob the same white as
 * the card underneath made the goo invisible on exactly the surface it matters
 * on. Resolved from a theme variable so dark mode gets its own grey.
 */
export const LINKING_EFFECT_DEFAULT_SURFACE_VARIABLE = "--color-bg-accent-gray-subtlest";

/** Light-theme `--ds-background-accent-gray-subtlest`; only reached when a variable cannot be parsed. */
const FALLBACK_SURFACE_TINT: readonly [number, number, number] = [
	0xf0 / 255,
	0xf1 / 255,
	0xf2 / 255,
];

function resolveSurfaceTint(variable: string): readonly [number, number, number] {
	if (typeof document === "undefined") {
		return FALLBACK_SURFACE_TINT;
	}

	const raw = getComputedStyle(document.documentElement).getPropertyValue(variable);
	const parsed = parseColor(raw.trim());
	if (!parsed) {
		return FALLBACK_SURFACE_TINT;
	}

	return [parsed.r / 255, parsed.g / 255, parsed.b / 255];
}

interface LinkingEffectSourceRect {
	height: number;
	left: number;
	top: number;
	width: number;
}

export interface LinkingEffectRenderState {
	frame: LinkingEffectFrame | null;
	/** Echoed alongside the frame so the shader can aim its chromatic split. */
	velocity: LinkingEffectVector;
}

/**
 * Snapshot handed over at release.
 *
 * Captured rather than read live because the travelling source usually unmounts
 * in the same commit as the drop: the fuse has to keep animating from geometry
 * that no longer has a DOM node behind it.
 */
export interface LinkingEffectRelease {
	/** Monotonic, so a second drop on the same target restarts the fuse. */
	id: number;
	target: LinkingEffectTarget | null;
	/**
	 * Shape the fuse starts from, when the landing shape differs from the one the
	 * approach grew into.
	 *
	 * A host can grow the field into a whole card on approach but land the
	 * subject in one row of it. Snapshotting the approach shape here lets the two
	 * be interpolated instead of swapped, which would pop on the release frame.
	 */
	fromTarget?: LinkingEffectTarget | null;
}

export interface LinkingEffectFrameSource {
	members: readonly LinkingEffectMember[];
	nearness: number;
	onFuseSettled?: () => void;
	release: LinkingEffectRelease | null;
	/** Measured every frame; the source element may move, resize, or vanish. */
	sourceSelector: string;
	surfaceVariable?: string;
	target: LinkingEffectTarget | null;
}

const IDLE_RENDER_STATE: LinkingEffectRenderState = {
	frame: null,
	velocity: { x: 0, y: 0 },
};

function measureSourceRect(selector: string): LinkingEffectSourceRect | null {
	const node = document.querySelector<HTMLElement>(selector);
	if (!node) {
		return null;
	}

	const rect = node.getBoundingClientRect();
	if (rect.width <= 0 || rect.height <= 0) {
		return null;
	}

	return { height: rect.height, left: rect.left, top: rect.top, width: rect.width };
}

/**
 * Drive one field frame per animation frame.
 *
 * The loop owns three things the pure model cannot: measuring the travelling
 * source, differentiating that measurement into a velocity, and running the
 * post-release fuse clock. It never lists the gesture props as effect
 * dependencies — they change on every pointer move and the loop must not be torn
 * down and rebuilt each frame.
 */
export function useLinkingEffectFrame(
	source: Readonly<LinkingEffectFrameSource>,
): LinkingEffectRenderState {
	const [render, setRender] = useState<LinkingEffectRenderState>(IDLE_RENDER_STATE);
	const liveRef = useRef(source);

	useLayoutEffect(() => {
		liveRef.current = source;
	});

	useEffect(() => {
		let handle = 0;
		let cancelled = false;
		let sourceRect: LinkingEffectSourceRect | null = null;
		let previousCenter: LinkingEffectVector | null = null;
		let velocity: LinkingEffectVector = { x: 0, y: 0 };
		let lastNearness = 0;
		let fuseStartedAt = 0;
		let fusingReleaseId: number | null = null;
		let settledReleaseId: number | null = null;
		// Resolved once per mount, which is once per gesture.
		const surfaceTint = resolveSurfaceTint(
			liveRef.current.surfaceVariable ?? LINKING_EFFECT_DEFAULT_SURFACE_VARIABLE,
		);

		const tick = (now: number) => {
			if (cancelled) return;
			const live = liveRef.current;
			// The source unmounts in the same commit as the drop, so an armed fuse
			// keeps animating from the last geometry the approach measured. The
			// approach itself gets no such licence: a source that legitimately
			// disappears mid-gesture would otherwise strand the field behind it.
			sourceRect = measureSourceRect(live.sourceSelector)
				?? (live.release ? sourceRect : null);

			const center = sourceRect
				? {
					x: sourceRect.left + sourceRect.width / 2,
					y: sourceRect.top + sourceRect.height / 2,
				}
				: null;
			velocity = advanceLinkingEffectVelocity(
				velocity,
				center && previousCenter
					? { x: center.x - previousCenter.x, y: center.y - previousCenter.y }
					: { x: 0, y: 0 },
			);
			previousCenter = center;

			const releaseId = live.release?.id ?? null;
			if (releaseId === null) {
				fusingReleaseId = null;
				lastNearness = live.nearness;
			} else if (fusingReleaseId !== releaseId) {
				fusingReleaseId = releaseId;
				fuseStartedAt = now;
			}
			const fuseProgress = releaseId === null
				? 0
				: resolveLinkingEffectFuseProgress(now - fuseStartedAt);
			// The release snapshot wins once it exists: by then the approach's own
			// target has already been cleared by the host. When that snapshot names
			// a different shape to start from, the fuse morphs between the two
			// rather than swapping them on its first frame.
			const target = live.release
				? lerpLinkingEffectTarget(
					live.release.fromTarget,
					live.release.target,
					fuseProgress,
				)
				: live.target;

			setRender({
				frame: resolveLinkingEffectFrame({
					sourceRect: sourceRect,
					sourceTint: surfaceTint,
					targetAnchor: target?.anchor ?? null,
					targetHeight: target?.height,
					targetRadius: target?.radius,
					targetTint: surfaceTint,
					targetWidth: target?.width ?? 0,
					fuseProgress,
					members: live.members,
					nearness: releaseId === null
						? lastNearness
						: resolveLinkingEffectFuseNearness(lastNearness, fuseProgress),
					pointer: center ?? { x: 0, y: 0 },
					velocity,
				}),
				velocity,
			});

			if (releaseId !== null && fuseProgress >= 1 && settledReleaseId !== releaseId) {
				settledReleaseId = releaseId;
				live.onFuseSettled?.();
			}

			handle = requestAnimationFrame(tick);
		};

		handle = requestAnimationFrame(tick);
		return () => {
			cancelled = true;
			cancelAnimationFrame(handle);
		};
	}, []);

	return render;
}
