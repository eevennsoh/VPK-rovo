# Video Export

vpk-html's browser presentation mode does not render MP4. Video export is a
conversion contract: re-author the deck into a Hyperframes general-video
composition.

## Contract

| vpk-html deck | Hyperframes composition |
|---|---|
| `section.slide` | scene `<div data-composition-id data-start data-duration>` |
| slide content groups | `.clip` children with entrance timing |
| `.speaker-notes` | narration script |
| `--font-*` / color tokens | copied into composition CSS |
| slide order | one continuous timeline |

Do not use slideshow mode for MP4; it is for browser playback, not rendered
video.

## Timing

1. Extract each slide's speaker notes.
2. Generate narration with the best available TTS provider; use local Kokoro as
   the fallback.
3. Set slide dwell to narration duration plus padding.
4. Use a minimum dwell for slides without notes.
5. Accumulate `data-start` values across one continuous timeline.

## Animation

Mirror vpk-html's motion semantics:

- entrance clips use the same order as the deck's visual reading path
- use the vpk entrance duration/easing unless the scene needs slower narration
  alignment
- build paused GSAP timelines on `window.__timelines` so Hyperframes can seek
  deterministically

## Audio

Use narration as the primary track. Add subtle background music only when it
does not compete with speech. Duck BGM under narration.

## Render

Load the Hyperframes skills for the selected environment, then render only after
the user approves a video export:

```bash
npx hyperframes render --quality high
```

The rendered MP4 is derived output; the source of truth remains the vpk-html
deck and the generated Hyperframes composition.
