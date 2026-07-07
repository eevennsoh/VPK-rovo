# Gallery block — bottom-pinned dock carousel

## Context

Recreate the interaction pattern from `~/Desktop/scroll.mp4` (a link-in-bio landing page) as a new VPK block component `Gallery`: a strip of mixed-size cards pinned to the bottom of the viewport, sitting on a **progressive backdrop blur** of the page content behind it, horizontally scrollable, with **cursor-proximity dock magnification** on hover, **click-to-expand** a card to the viewport center, and a **toggle pill** to show/hide the strip. Scaffolding only — no image assets; card faces are gradient placeholder surfaces. Built with Motion for React (**load the `motion` skill via the Skill tool before writing animation code — user explicitly requested `/motion`**).

Interview decisions (locked):
1. **Block owns viewport pinning** — Gallery renders its own `fixed inset-x-0 bottom-0` strip + fullscreen expand overlay; the demo page just mounts it over sample scrollable content.
2. **Click-to-expand = shared-element morph** — Motion `layoutId` + `AnimatePresence`, same card content bigger, over a dimmed scrim; dismiss via scrim click / Esc / close button. This is the repo's **first `layoutId` usage**.
3. **Hover = cursor-proximity dock magnification** (macOS-dock style, continuous), not discrete hover tiers.
4. **Blur = both**: stacked `backdrop-filter` progressive-blur zone behind the strip **and** left/right edge fades on the scroll track.
5. **Toggle = built-in pill** (pinned bottom-right, always visible); hiding slides strip + blur layer down; optional controlled `open`/`onOpenChange`.
6. **Cards = mixed sizes** (`tall`/`square`/`wide`) with tinted gradient placeholders + `title`/`description`.
7. **Scroll = native overflow-x + click-drag-to-pan**, no arrows; dock scaling pauses while dragging; drag must not fire click-to-expand.

## File tree (new)

```
components/blocks/gallery/
  index.ts                    # barrel: Gallery + GalleryItem/GalleryProps types
  page.tsx                    # "use client" demo: sample scrollable page + <Gallery items={DEMO_GALLERY_ITEMS} />
  gallery.test.js             # colocated node --test source-contract test
  components/
    gallery.tsx               # orchestrator: open/expanded state, composes the pieces (<150 lines)
    gallery-track.tsx         # fixed strip: scroll container, edge mask, drag-to-pan, pointer tracking
    gallery-card.tsx          # motion card: layoutId, dock scale, click/keyboard to expand
    gallery-expanded.tsx      # scrim + centered expanded card (inside AnimatePresence)
    gallery-backdrop.tsx      # progressive backdrop-blur layer stack (pointer-events-none)
    gallery-toggle.tsx        # pinned pill button (show/hide strip)
  hooks/
    use-dock-magnification.ts # shared pointerX MotionValue + per-card scale derivation
    use-drag-scroll.ts        # pointer-capture drag-to-pan + wasDragged suppression flag
  data/
    gallery-items.ts          # GalleryItem type + DEMO_GALLERY_ITEMS (8–10 mixed-size items)
```

## Component API

```tsx
export interface GalleryItem {
	id: string;
	title: string;
	description: string;
	size: "tall" | "square" | "wide";
	/** Decorative placeholder face, e.g. "bg-linear-to-br from-purple-200 to-blue-400" (tailwind-theme accents allowed for decorative use). */
	surfaceClassName: string;
}

export interface GalleryProps {
	items: readonly GalleryItem[];
	/** Controlled visibility of the pinned strip; uncontrolled via defaultOpen (default true). */
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	className?: string;
}
```

`Readonly<Props>` everywhere, tabs, `@/` imports, `motion/react` imports only.

## Implementation notes (hard parts)

### Layout skeleton
- `gallery.tsx`: renders `<AnimatePresence>` wrapping (when strip open) a `fixed inset-x-0 bottom-0 z-40` wrapper containing `GalleryBackdrop` + `GalleryTrack`; plus `GalleryToggle` (`fixed right-4 bottom-4 z-40`, offset above strip when open); plus `<AnimatePresence>` for `GalleryExpanded` (`fixed inset-0 z-50`). Expanded state = `expandedId: string | null`.
- Track: `flex items-end gap-3 overflow-x-auto px-6 pb-4` with hidden scrollbar (`[scrollbar-width:none] [&::-webkit-scrollbar]:hidden`), `overflow-y: visible` headroom via top padding (~96px) so magnified cards aren't clipped vertically.
- Card base sizes (bottom-aligned, refine visually): tall `w-36 h-52`, square `w-28 h-28`, wide `w-56 h-32`; `rounded-xl`, `bg-surface-raised` behind the gradient face, `shadow` via `token("elevation.shadow.raised")`, title/description only legible on the wide/expanded variants (small cards show a truncated caption strip like the video).

### Dock magnification (`use-dock-magnification.ts`)
- One shared `useMotionValue(Infinity)` for pointer `clientX`, set on track `onPointerMove`, reset to `Infinity` on `onPointerLeave` **and while dragging**.
- Per card: cache the card's viewport center-x in a ref, recomputed on track `scroll`, `ResizeObserver`, and window `resize` (do **not** call `getBoundingClientRect` inside per-frame transforms — repo perf rule). Then:
  - `distance = useTransform(pointerX, (x) => x - centerRef.current)`
  - `scale = useTransform(distance, [-160, 0, 160], [1, 1.25, 1])` → `useSpring(scale, { mass: 0.1, stiffness: 170, damping: 14 })` (spring smoothing of a continuous pointer-driven value — the correct Motion idiom here, distinct from discrete-transition recipes).
- Apply via `style={{ scale }}` with `transformOrigin: "bottom center"` (cards grow upward like the video) and `willChange: "transform"`.
- `useReducedMotion()` → skip entirely (scale stays 1).

### Drag-to-pan (`use-drag-scroll.ts`)
- `onPointerDown` (primary button): record `startX`/`startScrollLeft`, `setPointerCapture`; `onPointerMove`: `scrollLeft = startScrollLeft - (clientX - startX)`; movement > 5px sets a `wasDragged` ref and flips a `dragging` state (pauses dock, `cursor-grabbing`).
- Card `onClick` checks `wasDragged` and bails; reset on next pointerdown. Native wheel/trackpad scrolling untouched.

### Edge fades
- Reuse `useHasHorizontalOverflow` ([components/hooks/use-has-horizontal-overflow.ts](components/hooks/use-has-horizontal-overflow.ts)) + `buildHorizontalEdgeMask`/`getBentoEdgeMaskStyle` from [bento-carousel.tsx](components/ui-custom/bento-carousel.tsx). Gallery needs the horizontal layer only, **without** the bento's constant bottom fade — if reusing as-is would drag the bottom fade in, add a small local `buildGalleryEdgeMask(canScrollLeft, canScrollRight)` (single `linear-gradient(to right, …)`, no `mask-composite` needed) rather than forking bento behavior.

### Progressive backdrop blur (`gallery-backdrop.tsx`)
- `absolute inset-x-0 bottom-0` zone ~`h-56`, `pointer-events-none`, behind the track (`-z-10` within the strip wrapper). 4 stacked layers, each `absolute inset-0` with increasing `backdropFilter: blur(Npx)` (2 / 4 / 8 / 16) and a `mask-image: linear-gradient(to bottom, …)` band so blur ramps downward (each layer's mask starts where the previous fades in). Include `WebkitBackdropFilter` + `WebkitMaskImage` inline for Safari. Top out with a subtle `bg-surface/…` tint gradient for legibility. Pure inline `style` for the gradients (dynamic values — allowed).

### Click-to-expand morph (`gallery-card.tsx` + `gallery-expanded.tsx`)
- Namespace `layoutId` with `useId()` from the orchestrator: `` `${instanceId}-card-${item.id}` `` (safe if two Galleries mount).
- Strip card: `motion.button` with `layoutId`; render it **only when not expanded** (ternary; when `expandedId === item.id` render an invisible same-size placeholder `div` to keep track layout stable).
- `gallery-expanded.tsx`: scrim `motion.div` (`fixed inset-0 bg-neutral-900/60` equivalent via ADS blanket token class if one exists, else `bg-[color]` semantic) fading per **blanket recipe** (enter `0.25s` `[0, 0.4, 0, 1]`, exit `0.2s` `[0.6, 0, 0.8, 0.6]`); centered `motion.div` with the matching `layoutId`, max-w ~`min(90vw, 640px)`, shows the gradient face large + `title`/`description` block. Layout transition = **modal recipe adapted**: `layout` transition `{ duration: 0.25, ease: [0.4, 0, 0, 1] }` (duration-slow + ease-in-out), exit at `{ duration: 0.2, ease: [0.6, 0, 0.8, 0.6] }` **declared on the exit variant itself** (asymmetric-exit gotcha in `motion-decisions.md`). Hoist all bezier consts with token-name comments.
- Dismiss: scrim click, Esc (keydown listener while open), visible close button. Focus management: focus close button on open, restore focus to the originating card on close (`ref` map by id). `role="dialog"` `aria-modal="true"` `aria-labelledby` the title.
- No portal needed — overlay is a sibling of the strip inside the block, both `fixed`. Morph target renders in the overlay so the track's mask/overflow can't clip the animation.
- Reduced motion: replace morph with plain fade (no `layout` animation).

### Toggle (`gallery-toggle.tsx`)
- `Button` (`components/ui/button`, `size="icon"` pill) with `@atlaskit/icon/core` chevron-up/chevron-down, `aria-expanded`, label "Show gallery"/"Hide gallery"; stays mounted always.
- Strip wrapper enter/exit: fade + `y: "100%"` slide; enter `0.25s` `[0, 0.4, 0, 1]` (duration-slow + ease-out bold — prominent surface), exit `0.2s` `[0.6, 0, 0.8, 0.6]` on the exit variant. Reduced motion → fade only.
- Controlled/uncontrolled: `open ?? internalOpen`, `onOpenChange` always called; functional state updates.

## Registration (6 touchpoints — pattern: spotlight)

1. `app/data/component-manifest.ts` (~line 380): add `blockComponent("gallery", "Gallery")` alphabetically.
2. `app/data/components.ts` (~line 388): same line (both files carry the list; existing block tests assert both).
3. `components/website/registry/blocks.ts`: `gallery: dynamic(() => import("../demos/blocks/gallery-demo"), { ssr: false })`.
4. New `components/website/demos/blocks/gallery-demo.tsx`: thin wrapper re-exporting `components/blocks/gallery/page`.
5. New `app/data/details/blocks/gallery.ts`: `GALLERY_DETAIL: ComponentDetail` (shape: `app/data/component-detail-types.ts`; copy structure from `app/data/details/blocks/spotlight.ts`, including a `demoLayout` suited to a full-viewport demo).
6. `app/data/details/blocks.ts`: import + `gallery: GALLERY_DETAIL` map entry.

## Demo page (`page.tsx`)

Sample scrollable page content behind the gallery so the backdrop blur reads: 2–3 sections of headings (`style={{ font: token("font.heading.large") }}`) + placeholder paragraph cards using semantic tokens (`bg-surface-raised`, `text-text-subtle`) inside a tall scroll region; `<Gallery items={DEMO_GALLERY_ITEMS} />` mounted last. Demo data: 8–10 items cycling tall/square/wide with varied decorative gradients (tailwind-theme accent classes).

## Test (`gallery.test.js`)

Match the repo's source-contract style ([agent-templates.test.js](components/blocks/agent-templates/agent-templates.test.js)): `node --test` + regex asserts using `readDetailCategorySource("blocks")` / `readWebsiteRegistrySource()` helpers:
- registered in `components.ts`, `component-manifest.ts`, details map, demo registry;
- `useReducedMotion` guard present in track/card/expanded sources;
- `layoutId` present in both `gallery-card.tsx` and `gallery-expanded.tsx`;
- drag suppression (`wasDragged`) referenced in card click path;
- backdrop uses `WebkitBackdropFilter` (Safari) and `pointer-events-none`.

## Verification

1. `pnpm run lint` + `pnpm run typecheck`.
2. `node --test components/blocks/gallery/gallery.test.js`.
3. `pnpm run dev:tmux:start`, open `<portless-url>/preview/blocks/gallery` with agent-browser: screenshot resting state (strip pinned, blur visible over scrolled content); hover mid-card → neighbors swell (screenshot); drag strip left/right; click card → centered morph, Esc closes, focus returns; toggle pill hides/shows strip. Check dark mode (`setGlobalTheme`-driven tokens) and reduced-motion (emulate via devtools).
4. Confirm docs page `/components/blocks/gallery` renders the detail.

## Gotchas

- Motion can't read `var()` → hoisted bezier-array consts annotated with token names (map in `.agents/rules/motion-decisions.md`).
- Never read a MotionValue in render; no `getBoundingClientRect` in per-frame transforms (cache centers on scroll/resize).
- Asymmetric exit timing goes on the `exit` variant's own `transition`, not the shared prop.
- Safari: `-webkit-backdrop-filter` + `-webkit-mask-image` needed on blur layers.
- Track needs top headroom (padding) or magnified cards clip against the strip wrapper.
- The return morph (close) animates back into a masked scroll container — the overlay element carries the animation so mid-flight clipping is avoided; slight end-of-animation clipping at track edges is acceptable.
- Demo is `ssr: false`; keep all window/pointer access inside effects/handlers anyway.
- Every animation gets an explicit reduced-motion guard (repo mandate — tokens don't auto-collapse).
