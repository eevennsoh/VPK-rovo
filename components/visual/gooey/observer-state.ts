import {
	type EvolveOptions,
	type MoveOptions,
} from "./tuning-model";

export { EVOLVE_DEFAULTS, MOVE_DEFAULTS } from "./tuning-model";
export type { EvolveOptions, MoveOptions } from "./tuning-model";

export interface BlendConfig {
  /** SVG group in the melt-overlay layer; the engine builds the warped-image
   *  structure inside it (pattern-filled rounded rects run through a
   *  turbulence → displacement → blur → saturation filter chain). Filters on
   *  SVG content render correctly in every browser — CSS url() filters on
   *  HTML are what WebKit breaks. */
  host: SVGGElement
  /** Melt blur radius in px. */
  blur: number
  /** Displacement strength of the liquid warp (feDisplacementMap scale). */
  warp: number
  /** Max px the melted imagery is pulled toward the contact. */
  pull: number
  /** Distance (px) at which melting starts; defaults from the group's goo blur. */
  range?: number
  /** Base radius (px) of the melt zone around the contact point. Defaults
   *  from the group's goo blur — the mixing zone matches the bridge width
   *  instead of swallowing the whole element. */
  zone?: number
  /** 0..1 — two-liquid mixing: the melted image is eroded into noise-shaped
   *  tendrils so the neighbour's liquid (already behind it) shows through the
   *  gaps. Never paints a shape — a painted disc reads as a visible circle. */
  mix?: number
  /** Px the melted material is drawn toward the NEIGHBOUR's centre at full
   *  contact — the dissolve streams into the other body instead of
   *  scattering symmetrically. Default 25. */
  gravity?: number
  /** 0..1 — how POINTY the gravity flow is. Each layer's mask is pushed
   *  further along the flow and shrunk, so their union tapers to a tip
   *  instead of stretching as an even blob. Default 0.65. */
  taper?: number
  /** Noise octaves — higher = finer, more detailed swirls. Default 2. */
  detail?: number
  /** Multiplier on the noise frequency: <1 = broad lazy swirls, >1 = fine
   *  busy veins. Default 1. */
  warpFreq?: number
  /** Px/s the noise field drifts, so the liquid visibly churns while held
   *  instead of sitting frozen. 0 = static. Default 26. */
  flowSpeed?: number
  /** 'fractalNoise' = soft billows (default), 'turbulence' = veinier,
   *  more marbled liquid. */
  warpStyle?: 'fractalNoise' | 'turbulence'
  /** While false, the melt fades out over `releaseMs` regardless of
   *  proximity — e.g. the moment a drag is released. Default true. */
  active?: boolean
  /** Structural release time when `active` goes false, ms. Default 240. */
  releaseMs?: number
  /** Ms the melt takes to EVAPORATE — its opacity fades to zero over this,
   *  independently of `releaseMs`, so the dissolve can leave gradually
   *  instead of blinking out. May exceed `releaseMs` (the melt then lives
   *  until the fade finishes). Defaults to `releaseMs`. */
  fadeMs?: number
  /** 0..1 — overall dissolve intensity, independent of proximity: a master
   *  ceiling on how far the melt can develop even at full contact. Scales
   *  warp/blur/gravity/mix AND the hole depth together, so a weak strength
   *  reads as a shallower liquid rather than an erased edge with no melt to
   *  justify it. 1 = full strength (default). */
  strength?: number
  /** How deep this piece may sink into its neighbour before the melt is fully
   *  gone, as a fraction of the smaller body (1 = completely engulfed).
   *  Melting is a SURFACE event: it belongs to the moment two skins meet, and
   *  once a piece is well inside the other there is no seam left to mix at —
   *  it has simply joined. Without this the proximity gap pins to zero on
   *  first overlap and the melt stays at full while the piece buries itself,
   *  which reads as a smear that should have resolved. Default 0.8; raise
   *  toward (or past) 1 to keep melting while deeply overlapped. */
  sink?: number
}

const easeCache = new Map<string, (t: number) => number>()

/** Evaluate a CSS timing function ('cubic-bezier(...)', 'ease-in-out',
 *  'linear') at progress t — lets the engine's corner timeline match the
 *  element's CSS transition exactly. */
export function easingFn(spec: string): (t: number) => number {
  let fn = easeCache.get(spec)
  if (fn) return fn
  const m = /cubic-bezier\(([^)]+)\)/.exec(spec)
  if (m) {
    const [x1, y1, x2, y2] = m[1].split(',').map(Number)
    fn = (t: number) => {
      if (t <= 0) return 0
      if (t >= 1) return 1
      let lo = 0
      let hi = 1
      for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2
        const x = 3 * mid * (1 - mid) * (1 - mid) * x1 + 3 * mid * mid * (1 - mid) * x2 + mid ** 3
        if (x < t) lo = mid
        else hi = mid
      }
      const u = (lo + hi) / 2
      return 3 * u * (1 - u) * (1 - u) * y1 + 3 * u * u * (1 - u) * y2 + u ** 3
    }
  } else if (spec === 'ease-in-out') {
    fn = easingFn('cubic-bezier(0.42, 0, 0.58, 1)')
  } else {
    fn = (t: number) => Math.min(1, Math.max(0, t))
  }
  easeCache.set(spec, fn)
  return fn
}

export interface ItemDynamics {
  /** Liquid surface springs behind size/shape changes and settles like jelly. */
  evolve: boolean
  /** Surface lags the moving element and stretches with velocity — liquid rubber. */
  move: boolean
  /** Resolved evolve tuning; falls back to EVOLVE_DEFAULTS. */
  evolveOpts?: Required<EvolveOptions>
  /** Resolved move tuning; falls back to MOVE_DEFAULTS. */
  moveOpts?: Required<MoveOptions>
}

export interface ObservedTarget {
  target: HTMLElement
  blob: SVGRectElement
  radius?: number
  /** Px to shrink the blob on every side relative to the element — lets an
   *  opaque element (e.g. a round photo) fully cover its own liquid so white
   *  only appears as the merge bridge. */
  blobInset?: number
  /** Px the blob swells back OUT (beyond blobInset) as the item nears a
   *  neighbour — an opaque element visibly grows a liquid coat that necks
   *  into the other surface, instead of merging invisibly behind itself. */
  bridgeGrow?: number
  blend?: BlendConfig
  dynamics?: ItemDynamics
}

export interface Frame {
  x: number
  y: number
  w: number
  h: number
}

export interface MeltEntry {
  el: HTMLImageElement
  /** One rect per melt layer, all fed by the same image pattern. */
  rects: SVGRectElement[]
  pattern: SVGPatternElement
  image: SVGImageElement
  radiusPx: number
  /** Geometry sampled during the frame's READ pass (group coordinates).
   *  Measuring lazily inside the write pass meant every item's mask write
   *  invalidated layout for the next item's read — one forced synchronous
   *  layout per item per frame. */
  measured: { x: number; y: number; w: number; h: number; ow: number; oh: number } | null
  /** Last geometry + mask written, so unchanged frames stay DOM-silent. */
  lastGeom: string | null
  lastHole: string | null
}

export interface MeltLayer {
  /** Compact fingerprint of the last values written to this layer's filter
   *  primitives — a matching frame skips every write, so WebKit does not
   *  re-rasterize the layer at all. */
  last?: string
  /** The layer's <filter>; its region is resized per frame to the melt zone. */
  filter: SVGElement
  disp: SVGElement
  blurEl: SVGElement
  erode: SVGElement
  /** The noise source — baseFrequency is re-aimed per frame so the field is
   *  elongated ALONG the flow (melting drips), not isotropic swirl. */
  turb: SVGElement
  /** Scrolls the shared noise field so the liquid churns over time. */
  noiseOffset: SVGElement
  circle: SVGCircleElement
  gl: SVGGElement
  shift: SVGGElement
}

/** Two graded warp layers sharing one noise field: a wide, gentle ripple and
 *  a tight, strong core — the melt reads as one continuous liquid that gets
 *  progressively deeper toward the contact point. */
/** Melt layers ordered outermost → innermost. Blur, warp and erosion ramp
 *  smoothly across them and each is masked to a progressively tighter radius,
 *  so the stack reads as a continuous gradient rather than discrete bands. */
export interface MeltRefs {
  layers: MeltLayer[]
  entries: MeltEntry[]
}

/** How many stacked layers approximate the gradient. */
export const MELT_LAYERS = 3

/** Total length of the corner timeline (delay + duration). */
export function cornerTotalOf(eo: Required<EvolveOptions>): number {
  return Math.max(0, eo.cornerDelay) + Math.max(1, eo.cornerDuration)
}

/** Clamp a CSS corner radius for use as an SVG rect `rx`.
 *
 *  SVG clamps `rx` to w/2 and `ry` (defaulted from rx) to h/2 INDEPENDENTLY,
 *  so a large radius on a wide short box — the `border-radius: 999px` pill
 *  idiom — degenerates into an ellipse. Clamping to min(w,h)/2 keeps it a
 *  true pill, matching how CSS renders the same value. */
export function pillRadius(r: number, w: number, h: number): number {
  return Math.max(0, Math.min(r, Math.min(w, h) / 2))
}

/** Centre-based liquid body: the mass's centre leads, size follows, corner
 *  radius adapts last — the order real liquid reads as. */
export interface Sim {
  cx: number
  cy: number
  w: number
  h: number
  r: number
  vcx: number
  vcy: number
  vw: number
  vh: number
  vr: number
}

export interface Item extends ObservedTarget {
  baseW: number
  baseH: number
  radiusPx: number
  last: Frame | null
  frame: Frame | null
  lastBlend: { cx: number; cy: number; s: number; d: number } | null
  melt: MeltRefs | null
  sim: Sim | null
  /** Peak-hold envelope of morph motion: rises instantly, decays smoothly —
   *  keeps roundness/blur monotone through the springs' settle oscillations. */
  motionEnv: number
  /** Previous target centre + smoothed target velocity, for anticipation. */
  tPrev: { cx: number; cy: number } | null
  tvx: number
  tvy: number
  /** Ramp-in envelope for the travel lead, 0..1, timed by `anticipation`. */
  lead01: number
  /** Corner timeline: morph start time + target-size change tracking. */
  cornerT0: number
  lastTargetMoveT: number
  lastTargetSize: { w: number; h: number } | null
  /** Latch: a morph is in progress, so the corner timeline can't restart. */
  morphActive: boolean
  /** Rate-limited droplet-roundness value — glides, never steps. */
  round01: number
  /** Trailing droplet for move items: a laggier satellite the goo filter
   *  strings into a teardrop tail while the element is in motion. */
  tailEl: SVGCircleElement | null
  tailX: number
  tailY: number
  tailVx: number
  tailVy: number
  tailR: number
  /** True while an evolve morph has a motion blur written onto the target. */
  contentBlurred: boolean
  /** Last values painted to the blob by the dynamics branch. Writes are
   *  skipped when unchanged: the 300ms asleep-check calls writeBlob too, and
   *  an unconditional setAttribute — even with an identical value — dirties
   *  the SVG filter, which Safari answers by re-rasterizing the whole filter
   *  region. A settled sim must be DOM-silent. */
  lastPaint: { t: string; w: string; h: string; rx: string } | null
  /** Last tail-circle write ('hidden' when parked at r=0), same reason. */
  lastTail: string | null
  /** Last effective blob inset written (bridgeGrow makes it proximity-driven). */
  lastBi: number
  /** Time-smoothed bridgeGrow inset; null until the first frame seeds it. */
  biSmooth: number | null
  /** Smoothed melt strength: fast attack, gradual release-time decay. */
  meltFade: number
  /** In-flight release: start strength + elapsed ms, so the fade completes in
   *  exactly `releaseMs` instead of chasing zero forever. */
  meltRel: { from: number; t: number } | null
  /** Smoothed overlay opacity — carries the progressive release fade, and
   *  keeps a re-approach mid-fade from popping back to full. */
  meltOp: number
  /** Accumulated noise-drift phase — makes the liquid churn. */
  meltPhase: number
  /** Previous frame position, to gate the churn on actual movement. */
  meltPrev: { x: number; y: number } | null
  /** Last contact geometry, so the fading tail keeps its position. */
  meltGeom: { o: Frame } | null
  /** performance.now() of the last melt layer/entry write pass — writes back
   *  off to ~28fps when the frame clock degrades (see frameEma), because each
   *  one re-rasterizes turbulence filters, which WebKit runs on the CPU. */
  meltWroteAt: number
  /** Dominant flow axis of the anisotropic noise ('x' = features elongated
   *  horizontally), held with hysteresis — re-aiming exactly at |gux|==|guy|
   *  flipped the whole texture 90° on every crossing of the diagonal while
   *  dragging around the contact, a hard visible flicker. */
  meltAxis: 'x' | 'y' | null
  /** Last host opacity/transform written. */
  meltHostLast: string | null
  ro: ResizeObserver
}

/** Semi-implicit Euler spring step; returns [position, velocity]. */
function springStep(
  cur: number,
  vel: number,
  target: number,
  k: number,
  c: number,
  dt: number,
): [number, number] {
  const a = k * (target - cur) - c * vel
  const v = vel + a * dt
  return [cur + v * dt, v]
}

/** Spring advance over a WALL-CLOCK dt, substepped at ≤1/60s so the
 *  integration stays stable no matter how long the frame gap was.
 *
 *  The loop used to clamp dt to 1/24 per FRAME instead: at Safari's worst
 *  (~1 paint per 2s under filter load) the simulation then advanced 42ms per
 *  2000ms of wall time — everything ran in ~50x slow motion, so timed melt
 *  releases visibly never finished (avatars stayed erased) and silhouettes
 *  trailed their elements by seconds. Time must follow the wall clock; only
 *  the integration STEP is capped. */
export function springSteps(
  cur: number,
  vel: number,
  target: number,
  k: number,
  c: number,
  dt: number,
): [number, number] {
  let n = Math.max(1, Math.ceil(dt * 60))
  const h = dt / n
  let p = cur
  let v = vel
  while (n-- > 0) {
    const step = springStep(p, v, target, k, c, h)
    p = step[0]
    v = step[1]
  }
  return [p, v]
}

/** Quantize a value so near-identical frames produce IDENTICAL strings and
 *  the dirty-checks can skip the DOM write — WebKit re-rasterizes a filter's
 *  whole region on any primitive-attribute write, identical value or not. */
export function q(v: number, step: number): number {
  return Math.round(v / step) * step
}

const SVG_NS = 'http://www.w3.org/2000/svg'

export function smoothstep(t: number): number {
  const c = Math.min(1, Math.max(0, t))
  return c * c * (3 - 2 * c)
}

export function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string>,
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag)
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
  return el
}

/** Shared per-group measurement loop for observe-mode items: mirrors externally
 *  animated elements onto their blobs each frame, then sleeps entirely once
 *  nothing has moved for ~half a second. MutationObserver + transition /
 *  animation events + a slow safety tick wake it, so idle cost is zero.
 *
 *  Items opted into contact blur additionally get a liquid melt at the point
 *  where they touch a neighbour: their images are re-rendered as SVG shapes
 *  warped by a turbulence displacement field — edges bend and smear like two
 *  materials merging — while the originals' edges dissolve under them. */
