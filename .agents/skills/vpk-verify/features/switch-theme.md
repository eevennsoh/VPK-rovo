# Switch theme

Switch theme lets a user cycle the header control through light, dark, and system, and see the document color mode change.

## Sub-features

- `theme-read` reports the current header button name and `data-color-mode`.
- `theme-cycle` moves light → dark → system → light.
- `theme-restore` writes the previous `localStorage` `ui-theme` value back.

## How to get to it (user POV)

- Choose the theme icon button at the right of the catalog header. Its accessible name is `Light theme`, `Dark theme`, or `System theme`.

## Driving it with control-vpk

Preconditions:

- `control-vpk doctor` reports `"ok": true` for this worktree.
- The catalog header is visible (`$ORIGIN/` or `$ORIGIN/ui`).
- Evidence directory `output/agent-browser/vpk-verify/switch-theme/` exists.

- **Read current.** Note the button name. Run `control-vpk browser snapshot -i --compact --depth 5` and keep the `Light theme` / `Dark theme` / `System theme` name. Run `control-vpk browser eval --stdin` with `document.documentElement.getAttribute("data-color-mode")`. Light theme corresponds to `light`; Dark theme to `dark`; System theme to whichever of `light` or `dark` the OS prefers.
- **Cycle once.** Choose the theme button. Run `control-vpk browser find role button click --name "Light theme"` (or `Dark theme` / `System theme` as currently shown). The button name becomes the next value in the cycle light → dark → system → light, and `data-color-mode` matches the new actual mode.
- **Proof.** Capture both modes you actually reached. Run `control-vpk browser screenshot output/agent-browser/vpk-verify/switch-theme/after-click.png` and write `data-color-mode` plus the button name to `output/agent-browser/vpk-verify/switch-theme/mode.txt`. The screenshot shows a visibly different surface (header/sidebar) and the VPK chrome.
- **Restore.** Put back the stored preference from before the recipe. Run `control-vpk browser eval --stdin` with `localStorage.setItem("ui-theme", "<previous>")` then reload if needed so the header name matches the restored value.

## Gotchas

- Toggling only a `dark` class is not how VPK theming works. Assert `data-color-mode` on `<html>`.
- `System theme` does not guarantee `data-color-mode=dark`. Compare against `window.matchMedia("(prefers-color-scheme: dark)").matches`.
- Theme is stored in `localStorage` key `ui-theme` and is shared with any other browser on this origin. Restore it. Do not leave a teammate's session on dark because a verify run clicked once.
- The button name is the *current* theme, not the theme you will switch to.
