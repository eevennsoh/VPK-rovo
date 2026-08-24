# Jira Golden Journeys v3

Jira Golden Journeys v3 lets a user tell the Terminal-to-release story while navigating Description, Activity, Insights, and pull-request detail inside one scroll-owned work-item surface.

## Sub-features

- `jira-v3-chapters` selects Terminal, Build, Review, Fix, Approve, and Release through desktop or compact chapter controls.
- `jira-v3-sections` activates Description and Activity links and verifies the visible nearest scroll owner settles on the requested section.
- `jira-v3-insights-pr` opens Insights and the in-app PR #1847 detail, then returns to Activity.
- `jira-v3-focus-narrow-theme-a11y` covers popup focus restoration, a 390×844 reduced-motion viewport, terminal-local theme, and route-scoped accessibility.

## How to get to it (user POV)

- Open `/jira-golden-journeys-v3` directly.
- Choose Build from `Open a software delivery story chapter` (or `Jump to chapter` on narrow screens).
- Use the Work item sections navigation for Description, Activity, Insights, and Pull requests.

## Driving it with control-vpk

Preconditions:

- `control-vpk doctor` reports `"ok": true` for this worktree and `ORIGIN` came from `control-vpk url`.
- Set `EVIDENCE="$(control-vpk evidence-dir)/jira-golden-journeys-v3"` and create it before capture.

- **Open and identify.** Start the scoped browser with `control-vpk browser open --headed "$ORIGIN/"`, run `control-vpk browser goto "$ORIGIN/jira-golden-journeys-v3"`, and wait for text `Jira Golden Journeys v3` before taking an interactive snapshot. The chapter control is visible and Terminal is selected.
- **Prove local theme through the UI.** Use the nearest-`[data-color-mode]` IIFE from the v0 recipe to record the gallery theme control name, route-local mode, and resolved ADS tokens. Click that exact accessible name, rerun the IIFE, and require its local mode and name to change. Restore the original name through the same UI control in at most two clicks; do not inspect or write global storage as substitute proof.
- **Open Build and navigate sections.** Choose Build. Focus link `Activity`, press Enter, and wait for its `aria-current` state; the nearest scroll owner moves while the document does not gain horizontal overflow. Activate `Description`, then Activity again.
- **Prove Insights.** Activate link `Insights`, take a fresh interactive snapshot, and confirm region `Decision timeline` plus region `Sources`. Return to Activity through its link; do not reload the route or rely on a text wait as substitute proof.
- **Prove PR detail and focus restoration.** Activate link `#1847: Implement guest checkout without account creation`; the in-app pull-request detail is visible. Return to the Work item, focus combobox `Pull requests. 1`, press Enter, then Escape. The listbox closes and focus returns to the combobox.
- **Cover narrow reduced motion.** Run `control-vpk browser set viewport 390 844` and `control-vpk browser set media light reduced-motion`, then reopen Build through `Jump to chapter` if needed. Description, Activity, Insights, and Pull requests remain keyboard operable without horizontal page overflow.
- **Proof and accessibility.** Run `control-vpk browser snapshot -i --compact --depth 9 > "$EVIDENCE/build-narrow.aria.txt"`, `control-vpk browser screenshot "$EVIDENCE/build-narrow.png"`, and `control-vpk browser a11y --selector body > "$EVIDENCE/a11y.txt"`.
- **Reset and cleanup.** Run `control-vpk browser find role button click --name Reset`; Terminal and the PR context reset. Run `control-vpk cleanup`; retained files are the only accepted proof from this run.

## Gotchas

- V3 section navigation is scroll-linked. Assert `aria-current` after scroll settlement; a successful click alone is insufficient.
- Insights replaces the body until Description or Activity is selected. Do not confuse its timeline with Activity.
- Pull requests is a combobox that can open on hover. Pressing Escape must close its listbox and restore focus before another keyboard assertion.
- Terminal theme is local to the story surface; global storage alone does not prove ADS token mode.
