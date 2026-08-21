# VPK verification map

This directory is the maintained source for verifying the user-facing behavior of VPK. Read the index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- Launch from this worktree with `.agents/skills/vpk-verify/scripts/control-vpk launch`.
- Set `ORIGIN` from `.agents/skills/vpk-verify/scripts/control-vpk url` (Portless `https://…localhost` when present).
- Run `.agents/skills/vpk-verify/scripts/control-vpk doctor` and require `"ok": true` for this worktree path.
- Drive only through `.agents/skills/vpk-verify/scripts/control-vpk browser`.
- Never open another worktree's Portless URL from `pnpm ports`.
- Never drive an instance whose frontend port is not this checkout's `.dev-frontend-port`.

## Driving conventions

- Start every recipe from the home origin unless its preconditions say otherwise.
- Prefer `#home-category-tab-*`, `href`, and ARIA names listed in the skill. Do not click a tab by the substring `UI`.
- Treat every command as literal. Keep quoted names and flags unchanged.
- Restore theme (`localStorage` key `ui-theme`) after a theme recipe.
- Restore sidebar search (clear the searchbox) after a search recipe.
- Do not remove proof artifacts during cleanup.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof includes an ARIA snapshot and a screenshot with VPK identity visible (sidebar `VPK` and the page heading or doc `h1`).
- Record the feature ID and entry point used with every artifact under `output/agent-browser/vpk-verify/<feature-id>/`.
- Report an unreachable path with the attempted command and the unmet precondition.
- Do not report a skipped entry point as verified through a different path.
- Studio chat send is not covered here. A loaded composer is not proof that Rovo answered.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It then uses exactly four H2 sections in this order.

1. `Sub-features` lists short IDs with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with control-vpk` starts with `Preconditions:` and uses labeled bullets that pair each user action with an exact command and observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

Keep implementation details out of the map. Name only user paths, stable handles, required state, commands, and observable proof.

## Features

- [Browse the catalog](./browse-catalog.md) covers home projects, category tabs, and returning via the VPK logo.
- [Open a component doc](./open-component-doc.md) covers opening Accordion docs from the UI catalog and the breadcrumb.
- [Switch theme](./switch-theme.md) covers cycling light, dark, and system from the header.
- [Search the sidebar](./sidebar-search.md) covers filtering the component browser and clearing the query.
- [Open Studio](./studio-shell.md) covers loading the Studio shell without sending a chat message.
