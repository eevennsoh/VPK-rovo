---
description: React and CSS gotchas — state updates, derived state, CSS gap transitions
globs: "**/*.tsx"
alwaysApply: false
---

# React / CSS Gotchas

- Use functional state updates for toggles (`setX(prev => !prev)`).
- Derive render-only values inline; do not sync derived state via effects.
- CSS `gap` doesn't transition away when a flex child collapses to `w-0`. Replace parent `gap-*` with transitioning `mr-*`/`ml-*` on the collapsible element (e.g., `mr-3` → `mr-0` alongside `w-0 opacity-0`).
