---
description: UI component gotchas — Base UI menus, Popover, Toggle, Sonner
globs: components/**/*.tsx
alwaysApply: false
---

# UI Gotchas

- Only use Base UI menu primitives (`DropdownMenuItem`, `MenuPrimitive.Item`) inside a `Menu.Root`/`DropdownMenu` wrapper. For menu-item styling without menu context, use a plain `<button>` with Tailwind classes.
- Use `onSelect` (not `onClick`) on `DropdownMenuItem` — `onSelect` auto-closes the dropdown.
- For popups anchored to a trigger, use `Popover` from `components/ui/popover.tsx` with controlled `open`/`onOpenChange`. Don't hardcode `position: fixed` pixel offsets or manual backdrop divs.
- For flyouts, popovers, dropdowns, and other overlay surfaces, do not add an outer border when overlay elevation/shadow already defines the surface. Use the overlay background plus elevation alone to avoid a double outline; keep internal row separators only when they clarify grouped content.
- When animated or offscreen UI keeps interactive descendants mounted while visually hidden, pair the hidden state with both `aria-hidden` and `inert` on the wrapper, or unmount the controls. Add a focused closed-state regression test for the accessibility/focus contract.
- Global keyboard shortcuts, presenter controls, demo timers, and other window-level side effects must be gated by the active/open surface. Keyboard handlers must ignore events from focused controls (`input`, `textarea`, `select`, `button`, links, contenteditable, and activating ARIA roles), and timers must pause or remount while the surface is closed so hidden demos cannot advance in the background.
- When an editor exposes multiple choices or destructive controls, keep local draft state and persisted state in the same transition. Save must persist the selected choice, and delete/clear actions must also reset any local selection, draft, and open editor state so the next Save cannot silently recreate cleared data. Add focused regression coverage for save/delete paths where accepted UI input can be discarded.
- Shared project components and cross-surface event handlers must not apply route/demo-specific labels, capabilities, copy, or intercept behavior to every consumer. Derive them from the payload or gate them with an explicit route, agent, or artifact discriminator, then add a focused non-target regression test.
- For composer directory autocomplete during async/debounced auto-tagging, separate visible suggestions from acceptable state. If the list stays visible while a query/range is stale, block Tab/Enter/Cmd-number/ghost acceptance until the state is recomputed, and add a focused regression for stale-range acceptance.
- For flex rows with truncating text, every flexible wrapper that must shrink needs `min-w-0`; fixed metadata, icons, and separators should be `shrink-0` so the intended text segment owns the ellipsis. Include a long-label fixture or regression assertion when adding hover-reveal actions beside truncating copy.
- When animated panels compute a fixed height before applying `overflow-hidden`, derive constants from the actual rendered geometry (slot size + padding + borders + dividers) instead of desired row names. Validate the measured row/panel height with a focused test or browser measurement so sticky footers and bottom gaps do not get clipped.
- For ADS Toggle parity work, lock geometry before token polish: use ADS content-box geometry, keep the regular thumb at 12px, and use `@atlaskit/icon/core/check-mark` + `@atlaskit/icon/core/cross` (`size="small"`) wrapped in VPK `Icon`.
- On pages that render multiple Sonner demos, give each `<Toaster />` a unique `id` and pass matching `toasterId` in `toast.*` calls so a single action does not render through multiple toasters.
