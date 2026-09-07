/**
 * Linking effect — a WebGL2 metaball field that fuses a travelling element into
 * the thing it is being linked to.
 *
 * Three beats: the field fades in as `nearness` rises, the two silhouettes neck
 * together through a signed-distance smooth union, and on release they collapse
 * into the target with velocity-driven chromatic dispersion. Subject colours
 * blend in OKLab across the neck, so differently-coloured subjects marble
 * together instead of averaging to grey.
 *
 * The host owns the gesture: this component only draws. It never intercepts a
 * pointer, and it unmounts entirely under `prefers-reduced-motion`.
 */

export { LinkingEffect, type LinkingEffectProps } from "./linking-effect";
export {
	LINKING_EFFECT_DEFAULT_RANGE_PX,
	LINKING_EFFECT_FUSE_DURATION_MS,
	LINKING_EFFECT_VELOCITY_SMOOTHING,
	advanceLinkingEffectVelocity,
	isLinkingEffectActive,
	lerpLinkingEffectTarget,
	resolveLinkingEffectFuseNearness,
	resolveLinkingEffectFuseProgress,
	resolveLinkingEffectNearness,
	type LinkingEffectGate,
	type LinkingEffectTarget,
	type LinkingEffectVector,
} from "./lifecycle";
export {
	useLinkingEffectAtlas,
	type LinkingEffectAtlas,
	type LinkingEffectIdentity,
} from "./use-linking-effect-atlas";
export {
	LINKING_EFFECT_DEFAULT_SURFACE_VARIABLE,
	useLinkingEffectFrame,
	type LinkingEffectFrameSource,
	type LinkingEffectRelease,
	type LinkingEffectRenderState,
} from "./use-linking-effect-frame";
export {
	LINKING_EFFECT_MAX_BALLS,
	LINKING_EFFECT_MAX_TINT_SUBJECTS,
	LINKING_EFFECT_REGION_PADDING_PX,
	resolveLinkingEffectFrame,
	type LinkingEffectBall,
	type LinkingEffectBallShape,
	type LinkingEffectFrame,
	type LinkingEffectFrameInput,
	type LinkingEffectMember,
	type LinkingEffectRegion,
} from "./field";
