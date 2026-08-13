import { measureRadius } from "./geometry";
import { resolveDissolveTimings } from "./tuning-model";
import {
	MELT_LAYERS,
	pillRadius,
	q,
	smoothstep,
	svg,
	type Frame,
	type Item,
	type MeltEntry,
} from "./observer-state";

let meltCounter = 0;

export abstract class DissolveEngine {
	gooBlur = 6;
	protected items = new Set<Item>();
	protected frameEma = 17;

  protected syncMelt(item: Item): void {
    if (!item.blend) return
    const melt = item.melt
    const t = item.target
    const imgs =
      t instanceof HTMLImageElement
        ? [t]
        : (Array.from(t.querySelectorAll('img')) as HTMLImageElement[])
    const same =
      !!melt &&
      melt.entries.length === imgs.length &&
      melt.entries.every((e, i) => e.el === imgs[i])
    if (!same) {
      this.refreshMelt(item)
      return
    }
    for (const entry of melt.entries) {
      entry.radiusPx = measureRadius(entry.el, entry.el.offsetWidth, entry.el.offsetHeight)[0]
      // Geometry is re-derived from the new radius on the next write.
      entry.lastGeom = null
    }
  }

  protected refreshMelt(item: Item): void {
    const blend = item.blend
    if (!blend) return
    const host = blend.host
    while (host.firstChild) host.removeChild(host.firstChild)
    const t = item.target
    const imgs =
      t instanceof HTMLImageElement
        ? [t]
        : (Array.from(t.querySelectorAll('img')) as HTMLImageElement[])
    const uid = `gooey-melt-${++meltCounter}`
    const seed = String((meltCounter * 7) % 100)
    const zone = blend.zone ?? this.gooBlur * 2.2 + 4
    const freqK = Math.max(0.2, blend.warpFreq ?? 1)
    const bf = Math.min(0.3, Math.max(0.01, freqK / (zone * 1.1))).toFixed(4)
    const octaves = String(Math.max(1, Math.round(blend.detail ?? 2)))
    const noiseType = blend.warpStyle ?? 'fractalNoise'

    const defs = svg('defs', {})
    const gradient = svg('radialGradient', { id: `${uid}-g` })
    gradient.append(
      // Long, smooth falloff: the melt reads as a gradient from intact rim
      // to fully mixed core, not as a disc with a soft edge.
      svg('stop', { offset: '0%', 'stop-color': '#fff' }),
      svg('stop', { offset: '35%', 'stop-color': '#fff', 'stop-opacity': '0.95' }),
      svg('stop', { offset: '60%', 'stop-color': '#fff', 'stop-opacity': '0.6' }),
      svg('stop', { offset: '82%', 'stop-color': '#fff', 'stop-opacity': '0.25' }),
      svg('stop', { offset: '100%', 'stop-color': '#fff', 'stop-opacity': '0' }),
    )
    defs.append(gradient)

    const mkLayer = (suffix: string) => {
      // Region in USER SPACE, resized per frame to the melt zone (see the
      // write pass). As a %-of-bbox region it covered the whole group — and
      // feTurbulence is generated on the CPU across the entire region, so the
      // cost scaled with the group, not with the small area the mask actually
      // reveals. That was the ~110ms main-thread stall at the start of a
      // flight: the content kept moving on the compositor while this loop —
      // which writes the silhouette — was blocked, so the liquid visibly fell
      // behind the UI.
      const filter = svg('filter', {
        id: `${uid}-f${suffix}`,
        filterUnits: 'userSpaceOnUse',
        x: '0',
        y: '0',
        width: '0',
        height: '0',
        'color-interpolation-filters': 'sRGB',
      })
      const turb = svg('feTurbulence', {
        type: noiseType,
        baseFrequency: bf,
        numOctaves: octaves,
        seed,
        result: 'noise0',
      })
      filter.append(turb)
      // Scrolling the noise field (rather than re-seeding, which jumps) makes
      // the liquid churn continuously while the surfaces are held together.
      const noiseOffset = svg('feOffset', { in: 'noise0', dx: '0', dy: '0', result: 'noise' })
      const disp = svg('feDisplacementMap', {
        in: 'SourceGraphic',
        in2: 'noise',
        scale: '0',
        xChannelSelector: 'R',
        yChannelSelector: 'G',
        result: 'disp',
      })
      filter.append(noiseOffset)
      const blurEl = svg('feGaussianBlur', { in: 'disp', stdDeviation: '0', result: 'soft' })
      // Melted material reads as concentrated pigment, not fog.
      const sat = svg('feColorMatrix', {
        in: 'soft',
        type: 'saturate',
        values: '1.2',
        result: 'col',
      })
      // Two-liquid mixing WITHOUT painting anything: threshold the same noise
      // into an alpha map and clip the melted copy with it, so the image
      // breaks into tendrils and the liquid already behind shows through the
      // gaps. Identity by default (alpha = 1 everywhere).
      const erode = svg('feColorMatrix', {
        in: 'noise',
        type: 'matrix',
        values: '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0 1',
        result: 'erode',
      })
      const clip = svg('feComposite', { in: 'col', in2: 'erode', operator: 'in' })
      filter.append(disp, blurEl, sat, erode, clip)
      const mask = svg('mask', {
        id: `${uid}-m${suffix}`,
        maskUnits: 'userSpaceOnUse',
        x: '-10000',
        y: '-10000',
        width: '20000',
        height: '20000',
      })
      const circle = svg('circle', { cx: '0', cy: '0', r: '0', fill: `url(#${uid}-g)` })
      mask.append(circle)
      defs.append(filter, mask)
      // `filter` and `mask` MUST live on separate elements. SVG orders them
      // filter → mask, so masking a filtered layer should clip the blur to
      // the contact zone; with both on ONE <g>, WebKit effectively masks
      // first and then blurs, so the melt's blurred copy bleeds far outside
      // its zone and paints a washed-out blob over whatever is next to it —
      // the neighbouring avatar "disappearing" in Safari while Chromium (which
      // orders them per spec) renders the identical values correctly.
      // Outer <g> owns the mask + opacity, inner <g> owns the filter, so the
      // order is unambiguous in every engine.
      const gl = svg('g', {})
      gl.setAttribute('mask', `url(#${uid}-m${suffix})`)
      gl.setAttribute('opacity', '0')
      const filtered = svg('g', {})
      filtered.setAttribute('filter', `url(#${uid}-f${suffix})`)
      const shift = svg('g', {})
      filtered.append(shift)
      gl.append(filtered)
      return { filter, disp, blurEl, erode, turb, noiseOffset, circle, gl, shift }
    }
    // Outermost first so inner (stronger) layers paint on top.
    const layers = Array.from({ length: MELT_LAYERS }, (_, i) => mkLayer(`l${i}`))
    host.append(defs, ...layers.map(l => l.gl))

    const entries: MeltEntry[] = imgs.map((el, i) => {
      const pattern = svg('pattern', {
        id: `${uid}-p${i}`,
        patternUnits: 'userSpaceOnUse',
        x: '0',
        y: '0',
        width: '1',
        height: '1',
      })
      const image = svg('image', { width: '1', height: '1', preserveAspectRatio: 'xMidYMid slice' })
      image.setAttribute('href', el.currentSrc || el.src)
      pattern.append(image)
      defs.append(pattern)
      const rects = layers.map(l => {
        const rect = svg('rect', { x: '0', y: '0', width: '0', height: '0', fill: `url(#${uid}-p${i})` })
        l.shift.append(rect)
        return rect
      })
      const radiusPx = measureRadius(el, el.offsetWidth, el.offsetHeight)[0]
      return { el, rects, pattern, image, radiusPx, measured: null, lastGeom: null, lastHole: null }
    })

    host.setAttribute('opacity', '0')
    item.melt = { layers, entries }
  }

  /** Remove all melt traces: hide the warped overlay, restore image masks. */
  protected clearBlend(item: Item): void {
    item.blend?.host.setAttribute('opacity', '0')
    // The DOM no longer matches the caches — drop them all, or the next melt
    // would skip the writes that re-apply the state.
    item.meltHostLast = null
    item.meltWroteAt = 0
    item.meltAxis = null
    for (const layer of item.melt?.layers ?? []) layer.last = undefined
    for (const entry of item.melt?.entries ?? []) {
      entry.el.style.removeProperty('mask-image')
      entry.el.style.removeProperty('-webkit-mask-image')
      entry.lastHole = null
      entry.lastGeom = null
    }
	}
  protected writeBlend(item: Item, dt: number): boolean {
    const f = item.frame!
    const blend = item.blend!
    const melt = item.melt
    if (!melt) return false
    // Melt range tracks where the goo bridge actually forms (~2.5x the goo
    // blur) — melting before surfaces visually neck reads as a bug.
    const range = blend.range ?? Math.max(10, this.gooBlur * 2.5)
    let bestGap = Infinity
    let bestOther: Frame | null = null
    for (const other of this.items) {
      if (other === item || !other.frame) continue
      const o = other.frame
      const dx = Math.max(o.x - (f.x + f.w), f.x - (o.x + o.w), 0)
      const dy = Math.max(o.y - (f.y + f.h), f.y - (o.y + o.h), 0)
      const gap = Math.hypot(dx, dy)
      if (gap < bestGap) {
        bestGap = gap
        bestOther = o
      }
    }
    // How far INSIDE the neighbour this piece has travelled. `bestGap` is an
    // outside distance and clamps to 0 the instant the boxes touch, so on its
    // own it cannot tell "just met" from "buried" — everything past first
    // contact looks identical to it. Overlap depth is the missing half of the
    // measurement: the shallower of the two axis overlaps, which is how deep
    // the piece has actually sunk rather than how much area happens to
    // intersect. Normalized by the SMALLER body, since that is the most
    // overlap the pair can ever produce, so 1 means fully engulfed and the
    // two items agree on the number from either side.
    let embed = 0
    if (bestOther && bestGap === 0) {
      const o = bestOther
      const ox = Math.min(f.x + f.w, o.x + o.w) - Math.max(f.x, o.x)
      const oy = Math.min(f.y + f.h, o.y + o.h) - Math.max(f.y, o.y)
      const span = Math.max(1, Math.min(f.w, f.h, o.w, o.h))
      embed = Math.max(0, Math.min(ox, oy)) / span
    }
    // Target strength from proximity and activity; squared smoothstep biases
    // the ramp late — barely anything at first neck.
    let sTarget = 0
    if (bestOther && bestGap < range && blend.active !== false) {
      // Mild bias only: with `range` tuned to the real necking distance, the
      // dissolve must track the BRIDGE onset — a squared curve left a sharp
      // avatar edge visible inside an already-formed neck.
      const sRaw = smoothstep(1 - bestGap / range)
      // Strength is a CEILING, not a linear scale: even at full contact the
      // melt cannot exceed it, but it still ramps the same way on approach —
      // scaling sRaw itself would also slow the ramp, reading as "farther
      // away" rather than "weaker".
      const strength = Math.max(0, Math.min(1, blend.strength ?? 1))
      // Sink-out: the melt belongs to the seam, so it recedes as the seam is
      // swallowed. The ramp begins as soon as the piece is properly overlapping
      // rather than merely touching, and is finished by `sink` — well before
      // the piece is buried, since by then it reads as joined, not melting.
      // Smoothstep at both ends so neither the onset nor the finish shows an
      // edge as the piece is dragged in and out.
      const sink = Math.max(0.01, blend.sink ?? 0.45)
      const sunk = smoothstep(
        Math.max(0, Math.min(1, (embed - sink * 0.2) / Math.max(0.01, sink * 0.8))),
      )
      sTarget = Math.pow(sRaw, 1.25) * strength * (1 - sunk)
    }
    // Asymmetric smoothing: quick attack; the release is a TIMED fade that
    // reaches the target in exactly `releaseMs`. An exponential chase here
    // needs ~4.4 time constants to clear its threshold, so a 110ms release
    // still had the image masked ~490ms later — and whenever the consumer
    // removed the element mid-tail (an avatar landing in its slot), the
    // residual dissolve hole popped off in a single frame.
    if (sTarget >= item.meltFade) {
      item.meltFade += (sTarget - item.meltFade) * Math.min(1, dt * 16)
      item.meltRel = null
    } else if (sTarget > 0.02) {
      // In-range fluctuation (pointer jitter, slow retreat): a gentle chase
      // down, NOT the evaporation pipeline. Engaging the timed release here
      // started the opacity fade mid-hover — the dissolve visibly vanished
      // while still necking, then popped back on re-approach.
      item.meltFade += (sTarget - item.meltFade) * Math.min(1, dt * 6)
      item.meltRel = null
    } else {
      // The melt lives until BOTH the structural release and the opacity
      // fade are done, so `fadeMs` can outlast `releaseMs` and give a long,
      // clearly readable evaporation.
      const { lifetimeMs } = resolveDissolveTimings(blend.releaseMs, blend.fadeMs)
      if (!item.meltRel) item.meltRel = { from: item.meltFade, t: 0 }
      const rel = item.meltRel
      rel.t += dt * 1000
      const k = lifetimeMs === 0 ? 1 : Math.min(1, rel.t / lifetimeMs)
      // (1-k)^2: fast start, gentle tail — the exponential's look, but it
      // lands on an exact zero instead of an asymptote.
      item.meltFade = sTarget + (rel.from - sTarget) * (1 - k) * (1 - k)
    }
    if (sTarget === 0 && item.meltFade < 0.001) item.meltFade = 0
    const s = item.meltFade
    if (s <= 0.001) {
      if (item.lastBlend && item.lastBlend.s !== 0) {
        this.clearBlend(item)
        item.lastBlend = { cx: 0, cy: 0, s: 0, d: 0 }
        return true
      }
      return false
    }
    // Geometry: fresh while in contact; while the tail fades out of range,
    // keep melting around the LAST contact point.
    let o = bestOther
    if ((!o || bestGap >= range) && item.meltGeom) o = item.meltGeom.o
    if (!o) return false
    const cx =
      f.x + f.w < o.x
        ? (f.x + f.w + o.x) / 2
        : o.x + o.w < f.x
          ? (o.x + o.w + f.x) / 2
          : (Math.max(f.x, o.x) + Math.min(f.x + f.w, o.x + o.w)) / 2
    const cy =
      f.y + f.h < o.y
        ? (f.y + f.h + o.y) / 2
        : o.y + o.h < f.y
          ? (o.y + o.h + f.y) / 2
          : (Math.max(f.y, o.y) + Math.min(f.y + f.h, o.y + o.h)) / 2
    item.meltGeom = { o: { ...o } }
    // Progressive release: OPACITY leads, STRUCTURE lags. Scaling warp and
    // blur down with the strength made the copy un-warp while still opaque —
    // the image visibly "snapped back to normal" before disappearing.
    // Instead the melt keeps most of its liquid character (structure relaxes
    // only ~45%) and EVAPORATES: the overlay's opacity rides the timed
    // release curve to zero, while the original image restores in sync with
    // the true strength `s`.
    const rel = item.meltRel
    // Opacity runs on its OWN clock (`fadeMs`), not on the strength ratio —
    // that tied the fade to `releaseMs`, so at the tuned 110ms release it was
    // over before it could be read as a fade at all.
    const { fadeMs } = resolveDissolveTimings(blend.releaseMs, blend.fadeMs)
    const fadeK = rel ? fadeMs === 0 ? 1 : Math.min(1, rel.t / fadeMs) : 0
    // Eased so it leaves gently instead of stepping off at a constant rate.
    const relFade = rel ? (1 - fadeK) * (1 - fadeK) : 1
    const sStruct = rel ? Math.min(1, rel.from * (0.55 + 0.45 * (1 - fadeK))) : s
    const eStruct = sStruct * sStruct * (3 - 2 * sStruct)
    // Falling follows the timed curve EXACTLY — it is already smooth, and a
    // lagging chase here left the overlay at ~0.4 opacity when the fade hit
    // zero and clearBlend cut it off: a visible pop at the very end. Only a
    // re-approach mid-fade ramps, so opacity can't jump back to full.
    item.meltOp =
      relFade < item.meltOp
        ? relFade
        : item.meltOp + (relFade - item.meltOp) * Math.min(1, dt * 16)
    // Melt zone sized like the goo bridge (from the group's blur), growing a
    // little as contact deepens, and never swallowing the whole element —
    // only the part around the contact mixes; the rest stays intact.
    const zone = blend.zone ?? this.gooBlur * 2.2 + 4
    const d = Math.min(Math.min(f.w, f.h) * 0.9, zone * (0.7 + 0.6 * sStruct))
    // Churn phase, gated on ACTUAL movement: liquid only flows while the
    // element is being dragged — a held drag freezes, and churn scales with
    // drag speed.
    const flowSpeed = Math.max(0, blend.flowSpeed ?? 26)
    const prevPos = item.meltPrev
    const moveSpeed = prevPos
      ? Math.hypot(f.x - prevPos.x, f.y - prevPos.y) / Math.max(1e-3, dt)
      : 0
    item.meltPrev = { x: f.x, y: f.y }
    // Phase advance capped per frame: dt is wall-clock, and after a slow
    // frame a full-dt advance would visibly teleport the noise field.
    const phaseAdv = Math.min(dt, 1 / 24) * flowSpeed * 0.12 * Math.min(1, moveSpeed / 40)
    item.meltPhase += phaseAdv
    const lb = item.lastBlend
    if (
      phaseAdv < 1e-4 &&
      lb &&
      Math.abs(lb.cx - cx) < 0.05 &&
      Math.abs(lb.cy - cy) < 0.05 &&
      Math.abs(lb.s - s) < 0.005 &&
      Math.abs(lb.d - d) < 0.05
    ) {
      return false
    }
    // Write cadence, ADAPTIVE on frame health. Every write below dirties a
    // turbulence/displacement filter, and WebKit re-rasterizes those on the
    // CPU — at full frame rate on a struggling device the paint loop drowns
    // (measured: ~1 paint per 2s in the iOS simulator). But a fixed 35ms
    // throttle on a healthy 60Hz clock quantizes to every THIRD frame: the
    // warped copy held still while the dragged photo glided, then hopped
    // 3-5px to catch up — a 20Hz strobe that reads as the dissolve
    // flickering during any in-contact move. So: while the frame clock is
    // healthy the overlay is written every frame and tracks the photo
    // exactly; when frames drop (the CPU-raster case the throttle protects)
    // the 35ms backoff re-engages by itself. The simulation state above is
    // already advanced either way; only the DOM flush waits. The active flag
    // stays true so the loop keeps ticking.
    const nowMs = performance.now()
    if (this.frameEma > 20 && nowMs - item.meltWroteAt < 35) return true
    item.meltWroteAt = nowMs
    const round = (v: number) => Math.round(v * 10) / 10
    const host = blend.host

    const n = melt.layers.length

    // Gravity direction: toward the NEIGHBOUR's centre.
    const ncx = o.x + o.w / 2
    const ncy = o.y + o.h / 2
    const gdx = ncx - cx
    const gdy = ncy - cy
    const gdl = Math.hypot(gdx, gdy) || 1
    const gux = gdx / gdl
    const guy = gdy / gdl
    const gAmt = Math.max(0, blend.gravity ?? 25) * eStruct
    const gDeg = round((Math.atan2(guy, gux) * 180) / Math.PI)
    const r3 = (v: number) => Math.round(v * 1000) / 1000
    const taper = Math.max(0, Math.min(1, blend.taper ?? 0.65))

    // MELTING is anisotropic: real melt drips ALONG the flow. Elongate the
    // noise features along the dominant gravity axis (low frequency along,
    // high across) so the displacement forms streaks/drips instead of an
    // isotropic swirl. Re-aimed only when the dominant axis flips.
    const freqK = Math.max(0.2, blend.warpFreq ?? 1)
    const zoneBase = blend.zone ?? this.gooBlur * 2.2 + 4
    const bfBase = Math.min(0.3, Math.max(0.01, freqK / (zoneBase * 1.1)))
    const alongF = (bfBase * 0.35).toFixed(4)
    const acrossF = (bfBase * 1.6).toFixed(4)
    // Dominant axis held with HYSTERESIS: re-aiming exactly at |gux|==|guy|
    // rotated the whole noise field 90° on every crossing of the diagonal —
    // dragging around the contact wobbles the gravity vector across it
    // repeatedly, and each flip re-generates the turbulence: a hard texture
    // flicker. The axis only flips once the other component clearly wins.
    const ax = Math.abs(gux)
    const ay = Math.abs(guy)
    const axis: 'x' | 'y' =
      item.meltAxis === 'x'
        ? ay > ax * 1.25 ? 'y' : 'x'
        : item.meltAxis === 'y'
          ? ax > ay * 1.25 ? 'x' : 'y'
          : ax >= ay ? 'x' : 'y'
    item.meltAxis = axis
    const bfStr = axis === 'x' ? `${alongF} ${acrossF}` : `${acrossF} ${alongF}`

    // Progressive melt: every layer shares one noise field (so they stay in
    // phase and read as a single liquid) but blur, warp and erosion ramp
    // smoothly from the zone's rim to its core, each masked to a tighter
    // radius. Stacked, that approximates a continuous gradient — a two-step
    // version banded visibly once blur got large.
    //
    // All masks are CONCENTRIC and centred AT the seam (tiny bias toward the
    // neighbour): the warped imagery must cover the white liquid bridge, and
    // with two melting items their copies overlap and interleave in the neck
    // — colour mixes with colour. Centred into the item instead, the copies
    // hugged their own edge and the neck showed as bare white fog between
    // them. Pointiness comes from the content's gravity stretch — a
    // per-layer pushed disc separates from the body and shows a detached
    // circular fragment.
    const bx = cx + gux * d * 0.05
    const by = cy + guy * d * 0.05
    // Every value below is QUANTIZED before writing, and each layer keeps a
    // fingerprint of its last-written values: a frame that lands on the same
    // quantized values skips the layer's writes entirely, so its turbulence
    // filter is not re-rasterized. The steps are chosen below what the soft
    // noise can visually resolve.
    const layerVals: string[][] = melt.layers.map((_, i) => {
      const t = n > 1 ? i / (n - 1) : 1 // 0 = outermost rim, 1 = tip
      const blurK = 0.06 + 0.94 * Math.pow(t, 1.7)
      const warpK = 0.2 + 0.8 * t
      const pr = 0.7 + 0.45 * t
      const oa = 6 * Math.sin(item.meltPhase * pr)
      const ob = 2 * Math.sin(item.meltPhase * pr * 1.31 + 1.7)
      return [
        String(q(blend.warp * warpK * eStruct, 0.25)),
        String(q(blend.blur * blurK * eStruct, 0.25)),
        String(q(gux * oa - guy * ob, 0.5)),
        String(q(guy * oa + gux * ob, 0.5)),
        String(q(bx, 0.5)),
        String(q(by, 0.5)),
        String(q(d * (1.15 - 0.75 * t), 0.5)),
        String(q(Math.min(1, eStruct * (0.75 + 0.25 * t)), 0.02)),
      ]
    })
    // (The single fingerprint-guarded write pass for the layers sits below,
    // once the shift transform and erosion row are computable too — they
    // dirty the same filters, so they must share the fingerprint.)
    // Anchored stretch, NOT translation: scaling from the trailing edge of
    // the melt zone keeps the warped copy aligned with the original at the
    // back (a translated copy shows its silhouette as an offset ghost ring),
    // while its leading side streams toward the pill by up to `gravity` px.
    const anchorX = cx - gux * d
    const anchorY = cy - guy * d
    // Taper now shapes the STRETCH (how sharply content is drawn out toward
    // the pill) rather than mask geometry.
    const kFlow = Math.min(0.6, gAmt / Math.max(8, 2 * d)) * (0.5 + taper)
    const flow = (k: number) => {
      const sx = r3(1 + kFlow * k)
      const sy = r3(1 / (1 + kFlow * 0.35 * k))
      return (
        `translate(${round(anchorX)}, ${round(anchorY)}) rotate(${gDeg}) ` +
        `scale(${sx}, ${sy}) ` +
        `rotate(${-gDeg}) translate(${round(-anchorX)}, ${round(-anchorY)})`
      )
    }
    // Two-liquid mixing by EROSION, not by painting: threshold the same noise
    // into an alpha map (alpha = k·R + c) and clip the melted copy with it.
    // The image breaks into tendrils and the liquid already behind shows
    // through the gaps — no shape is drawn, so no disc can appear. The core
    // erodes harder than the outer ripple, so mixing deepens toward the seam.
    const mixAmt = Math.max(0, Math.min(1, blend.mix ?? 0)) * eStruct
    const erodeRow = (amt: number) => {
      if (amt < 0.002) return '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0 1'
      // fractalNoise R sits around 0.5; a SOFT slope keeps tendril edges
      // feathered — a steep one cut the image into hard patchy fragments.
      const k = r3(1 + 4 * amt)
      const c = r3(1 - k * (0.38 + 0.12 * amt))
      return `0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${k} 0 0 0 ${c}`
    }
    // ONE fingerprint-guarded write pass per layer, because a single
    // primitive write re-rasterizes the layer's turbulence filter, so all of a
    // layer's values must be compared — and skipped — together.
    // Filter region: the mask only reveals a disc around the contact, so the
    // region only has to cover that disc plus however far blur/warp/gravity
    // can carry pixels into it. Quantized to 8px so small movements don't
    // re-trigger a raster.
    const spread = blend.blur * 2.5 + blend.warp + gAmt * 0.5 + 8
    const rr = q(d * 1.15 + spread, 8)
    const regionX = String(q(bx - rr, 8))
    const regionY = String(q(by - rr, 8))
    const regionW = String(q(rr * 2, 8))

    melt.layers.forEach((layer, i) => {
      const t = n > 1 ? i / (n - 1) : 1
      const v = layerVals[i]
      const shiftT = flow(0.4 + 0.6 * t)
      const erodeV = erodeRow(q(mixAmt * (0.15 + 0.85 * t), 0.01))
      const fp =
        v.join(',') + '|' + bfStr + '|' + shiftT + '|' + erodeV +
        '|' + regionX + ',' + regionY + ',' + regionW
      if (layer.last === fp) return
      layer.last = fp
      layer.filter.setAttribute('x', regionX)
      layer.filter.setAttribute('y', regionY)
      layer.filter.setAttribute('width', regionW)
      layer.filter.setAttribute('height', regionW)
      layer.disp.setAttribute('scale', v[0])
      layer.blurEl.setAttribute('stdDeviation', v[1])
      if (layer.turb.getAttribute('baseFrequency') !== bfStr) {
        layer.turb.setAttribute('baseFrequency', bfStr)
      }
      layer.noiseOffset.setAttribute('dx', v[2])
      layer.noiseOffset.setAttribute('dy', v[3])
      layer.circle.setAttribute('cx', v[4])
      layer.circle.setAttribute('cy', v[5])
      layer.circle.setAttribute('r', v[6])
      layer.gl.setAttribute('opacity', v[7])
      layer.shift.setAttribute('transform', shiftT)
      layer.erode.setAttribute('values', erodeV)
    })
    // Gentle magnetic pull of the melted body toward the contact.
    const icx = f.x + f.w / 2
    const icy = f.y + f.h / 2
    const ang = Math.atan2(cy - icy, cx - icx)
    // Pull holds with the structure during the fade — the overlay must not
    // glide back while it evaporates.
    const pull = blend.pull * sStruct
    const hostStr =
      r3(item.meltOp).toString() +
      '|' +
      `translate(${round(Math.cos(ang) * pull)}px, ${round(Math.sin(ang) * pull)}px)`
    if (hostStr !== item.meltHostLast) {
      item.meltHostLast = hostStr
      const parts = hostStr.split('|')
      host.setAttribute('opacity', parts[0])
      host.style.transform = parts[1]
    }

    // Depth 2.2x-biased: the original's edge is FULLY erased from s ≈ 0.45 —
    // a partially faded high-contrast edge still reads as an edge, and the
    // edge must be gone as soon as the goo neck reaches it. But ONLY then:
    // the hole strength is gated on the actual bridging distance, not the
    // melt's `range` — a large range starts the warp far out (anticipation),
    // and opening the hole that early revealed the item's own white blob
    // through the erased edge as a hard pale wedge, with no neck to justify
    // it.
    const bridgeRange = Math.max(10, this.gooBlur * 2.5)
    const sBridge = bestOther
      ? bestGap < bridgeRange
        ? smoothstep(1 - bestGap / bridgeRange)
        : 0
      : s
    // Quantized alongside the geometry below, for the same reason: a new
    // alpha means a new mask string means a re-raster of every photo.
    const holeAlpha = q(Math.max(0, 1 - Math.min(s, sBridge) * 2.2), 0.05).toFixed(2)
    const holeMid = (Math.round(((1 + 2 * Number(holeAlpha)) / 3) * 20) / 20).toFixed(2)
    for (const entry of melt.entries) {
      const ir = entry.measured
      if (!ir || ir.w < 1 || ir.h < 1) continue
      const ix = ir.x
      const iy = ir.y
      // Warped copy geometry (group coordinates), written to every layer.
      const kx = (ir.ow || ir.w) / ir.w
      const geom = `${round(ix)},${round(iy)},${round(ir.w)},${round(ir.h)},${round(pillRadius(entry.radiusPx / (kx || 1), ir.w, ir.h))}`
      if (geom !== entry.lastGeom) {
        entry.lastGeom = geom
        for (const rect of entry.rects) {
          rect.setAttribute('x', String(round(ix)))
          rect.setAttribute('y', String(round(iy)))
          rect.setAttribute('width', String(round(ir.w)))
          rect.setAttribute('height', String(round(ir.h)))
          rect.setAttribute(
            'rx',
            String(round(pillRadius(entry.radiusPx / (kx || 1), ir.w, ir.h))),
          )
        }
        entry.pattern.setAttribute('x', String(round(ix)))
        entry.pattern.setAttribute('y', String(round(iy)))
        entry.pattern.setAttribute('width', String(round(ir.w)))
        entry.pattern.setAttribute('height', String(round(ir.h)))
        entry.image.setAttribute('width', String(round(ir.w)))
        entry.image.setAttribute('height', String(round(ir.h)))
      }
      // Edge dissolve on the original image, imagery only — labels around it
      // stay sharp. Coordinates in the image's untransformed layout space.
      const ky = (ir.oh || ir.h) / ir.h
      // Only images the neck actually REACHES may dissolve. Relying on the
      // hole landing off-canvas is not enough: once the two items overlap
      // (a chip dragged onto the pill) the contact point sits INSIDE the
      // group, so every image in it got a live hole — including ones the
      // neck is nowhere near.
      const gapToImg = Math.hypot(
        Math.max(ix - cx, cx - (ix + ir.w), 0),
        Math.max(iy - cy, cy - (iy + ir.h), 0),
      )
      if (gapToImg > d) {
        if (entry.lastHole !== null) {
          entry.lastHole = null
          entry.el.style.removeProperty('mask-image')
          entry.el.style.removeProperty('-webkit-mask-image')
        }
        continue
      }
      // The hole must always eat an EDGE, never the middle. `cx,cy` is the
      // centre of the contact SPAN, so as soon as the boxes overlap deeply it
      // lands inside a photo — a hole centred on a 32px avatar with the neck's
      // radius erases the whole face, which is the "avatars disappear while
      // dragging" report. Push the centre out to the image's own rim along the
      // contact direction, and cap the radius to that rim, so the far side of
      // every image always survives.
      const ow = ir.ow || ir.w
      const oh = ir.oh || ir.h
      const rim = Math.min(ow, oh) / 2
      let lx = (cx - ix) * kx
      let ly = (cy - iy) * ky
      let vx = lx - ow / 2
      let vy = ly - oh / 2
      const vlen = Math.hypot(vx, vy)
      if (vlen < rim) {
        if (vlen < 1e-3) {
          vx = gux
          vy = guy
        } else {
          vx /= vlen
          vy /= vlen
        }
        lx = ow / 2 + vx * rim
        ly = oh / 2 + vy * rim
      }
      // Quantized to whole pixels. Every distinct mask string makes WebKit
      // re-rasterise that <img>, and with a photo per group member this ran on
      // every frame of a drag — the dominant cost behind the main-thread
      // stalls that desynced the silhouette. The hole is a soft gradient, so
      // 1px steps are invisible, and most frames now reuse the cached string
      // and write nothing.
      const hx = Math.round(lx)
      const hy = Math.round(ly)
      const hd = q(Math.min(d * Math.min(kx, ky), rim), 1)
      // White stops (opaque under both alpha- and luminance-mode masking), and
      // a final keep-stop that reaches the image's farthest corner. The hole's
      // own stops only span the neck, so on any image bigger than the neck
      // every pixel past them is outside the gradient's stop range: Chromium
      // extends the last colour (opaque, image intact) but WebKit paints
      // nothing there and erases the image.
      //
      // The stop is sized to the element, NOT some huge constant: WebKit sizes
      // the gradient's raster by its declared extent, so a `9999px` stop asked
      // it to rasterise an enormous buffer and cost ~130ms of main thread on
      // the frame the mask changed.
      const far =
        round(
          Math.max(
            Math.hypot(hx, hy),
            Math.hypot(hx - ow, hy),
            Math.hypot(hx, hy - oh),
            Math.hypot(hx - ow, hy - oh),
          ),
        ) + 2
      const hole = `radial-gradient(circle at ${hx}px ${hy}px, rgba(255,255,255,${holeAlpha}) ${round(hd * 0.32)}px, rgba(255,255,255,${holeMid}) ${round(hd * 0.55)}px, #fff ${round(hd * 0.8)}px, #fff ${far}px)`
      if (hole !== entry.lastHole) {
        entry.lastHole = hole
        entry.el.style.setProperty('mask-image', hole)
        entry.el.style.setProperty('-webkit-mask-image', hole)
      }
    }
    item.lastBlend = { cx, cy, s, d }
    return true
  }

}
