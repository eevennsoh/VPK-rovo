# Presentation Mode

vpk-html decks keep the print/PDF layer and the screen presentation layer
separate.

## Deck contract

- A deck is any HTML file with at least two `section.slide` elements.
- Print geometry stays fixed at the template's `@page` size (`slides.html` uses
  `280mm x 158mm`).
- Screen mode is added by `scripts/presentation.mjs` and injected by
  `scripts/retrofit.mjs`, `scripts/port-kami.mjs`, and the demo porters.
- Speaker notes live as the last child of a slide:
  `<aside class="speaker-notes" aria-hidden="true">...</aside>`.
- `.speaker-notes` is hidden in the main window and in print. The presenter
  window reads the note text without exposing it to screen recordings of the
  main deck window.

## Controls

| Key | Action |
|---|---|
| Left / Right | Previous / next whole slide |
| Home / End | First / last slide |
| `p` | Open presenter window |

Decks support `#slide-N` deep links. The runtime updates the URL hash as the
speaker navigates.

## Presenter Window

Press `p` in the main deck window to open a second window. It shows:

- current slide number and title
- speaker notes for the current slide
- next-slide preview
- elapsed timer

The presenter window syncs by `BroadcastChannel("vpk-deck")`. If the channel is
not available, it listens for `window.opener` messages; if that is unavailable,
it can navigate independently.

## Documents

Non-deck documents can opt into section navigation with
`data-vpk-docnav="true"` on `<body>`. ArrowUp and ArrowDown jump between section
headings; PageUp, PageDown, wheel, and space keep native browser behavior.

## Validation

`scripts/check-html.mjs` fails decks that are missing the shared runtime, note
hiding CSS, or print motion neutralizer. `scripts/build.mjs --check-templates`
also asserts the motion tokens and reduced-motion overrides are present.

## Video

The presentation runtime is for live browser presentation and PDF export. MP4
export is a separate Hyperframes conversion track; see `references/video-export.md`.
