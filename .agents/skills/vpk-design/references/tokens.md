# Token Translation Reference

This codebase uses **Tailwind classes** that map to ADS CSS variables. The translation flow:

```
Figma Design (ADS tokens)
        ↓
@atlaskit/tokens (--ds-… CSS variables)
        ↓
app/tailwind-theme.css + app/shadcn-theme.css
        ↓
Tailwind classes (p-4, rounded-lg, bg-surface-raised, text-text-subtle, etc.)
```

## Token Priority Rule

1. **shadcn-theme semantic classes** — Use for all standard colors, surfaces, borders, text (`bg-surface-raised`, `text-text-subtle`, `border-border-bold`)
2. **tailwind-theme accent colors** — Use for decorative hue-based colors (`bg-blue-400`, `text-purple-500`)
3. **`token()` / raw `var(--ds-…)`** — Only for dynamic values or edge cases without any Tailwind mapping

## Naming Convention (Tailwind v4)

CSS variables defined in `shadcn-theme.css` as `--color-*` become Tailwind classes via the utility prefix:

| CSS Variable | Text class | Background class | Border class |
|---|---|---|---|
| `--color-text-subtle` | `text-text-subtle` | — | — |
| `--color-icon-danger` | `text-icon-danger` | — | — |
| `--color-bg-danger` | — | `bg-bg-danger` | — |
| `--color-surface-raised` | — | `bg-surface-raised` | — |
| `--color-border-bold` | — | — | `border-border-bold` |

The double-prefix pattern (e.g., `bg-bg-danger`, `text-text-subtle`) is correct — the first part is the Tailwind utility, the second is the token name.

---

## Spacing (Figma px → Tailwind → ADS)

| Figma | Tailwind | ADS Token | CSS Variable |
|---|---|---|---|
| 0px | p-0, m-0, gap-0 | space.0 | var(--ds-space-0) |
| 2px | — (use style) | space.025 | var(--ds-space-025) |
| 4px | p-1, m-1, gap-1 | space.050 | var(--ds-space-050) |
| 6px | — (use style) | space.075 | var(--ds-space-075) |
| 8px | p-2, m-2, gap-2 | space.100 | var(--ds-space-100) |
| 12px | p-3, m-3, gap-3 | space.150 | var(--ds-space-150) |
| 16px | p-4, m-4, gap-4 | space.200 | var(--ds-space-200) |
| 20px | p-5, m-5, gap-5 | space.250 | var(--ds-space-250) |
| 24px | p-6, m-6, gap-6 | space.300 | var(--ds-space-300) |
| 32px | p-8, m-8, gap-8 | space.400 | var(--ds-space-400) |
| 40px | p-10, m-10, gap-10 | space.500 | var(--ds-space-500) |
| 48px | p-12, m-12, gap-12 | space.600 | var(--ds-space-600) |

**Note:** Tailwind uses `--ds-space-050` (4px) as the base unit. Multiplier: `p-1` = 4px, `p-2` = 8px, etc.

## Border Radius (Figma px → Tailwind → ADS)

| Figma | Tailwind | ADS Token | CSS Variable |
|---|---|---|---|
| 2px | rounded-xs | radius.xsmall | var(--ds-radius-xsmall) |
| 4px | rounded-sm | radius.small | var(--ds-radius-small) |
| 6px | rounded-md | radius.medium | var(--ds-radius-medium) |
| 8px | rounded-lg | radius.large | var(--ds-radius-large) |
| 12px | rounded-xl | radius.xlarge | var(--ds-radius-xlarge) |
| 16px | rounded-2xl | radius.xxlarge | var(--ds-radius-xxlarge) |
| 9999px | rounded-full | radius.full | — |

## Shadows (Figma → Tailwind → ADS)

| Figma Description | Tailwind | ADS Token | CSS Variable |
|---|---|---|---|
| Small/subtle shadow | shadow-md | elevation.shadow.raised | var(--ds-shadow-raised) |
| Medium shadow | shadow-lg | elevation.shadow.overflow | var(--ds-shadow-overflow) |
| Large/overlay shadow | shadow-xl | elevation.shadow.overlay | var(--ds-shadow-overlay) |

---

## Text Colors

| Purpose | Tailwind | ADS Token |
|---|---|---|
| Default text | `text-text` | color.text |
| Subtle text | `text-text-subtle` | color.text.subtle |
| Subtlest text | `text-text-subtlest` | color.text.subtlest |
| Disabled text | `text-text-disabled` | color.text.disabled |
| Inverse text (on bold bg) | `text-text-inverse` | color.text.inverse |
| Selected text | `text-text-selected` | color.text.selected |
| Brand text | `text-text-brand` | color.text.brand |
| Danger text | `text-text-danger` | color.text.danger |
|   ↳ bolder | `text-text-danger-bolder` | color.text.danger.bolder |
| Warning text | `text-text-warning` | color.text.warning |
|   ↳ bolder | `text-text-warning-bolder` | color.text.warning.bolder |
|   ↳ inverse | `text-text-warning-inverse` | color.text.warning.inverse |
| Success text | `text-text-success` | color.text.success |
|   ↳ bolder | `text-text-success-bolder` | color.text.success.bolder |
| Discovery text | `text-text-discovery` | color.text.discovery |
|   ↳ bolder | `text-text-discovery-bolder` | color.text.discovery.bolder |
| Information text | `text-text-information` | color.text.information |
|   ↳ bolder | `text-text-information-bolder` | color.text.information.bolder |

## Icon Colors

| Purpose | Tailwind | ADS Token |
|---|---|---|
| Default icon | `text-icon` | color.icon |
| Subtle icon | `text-icon-subtle` | color.icon.subtle |
| Subtlest icon | `text-icon-subtlest` | color.icon.subtlest |
| Disabled icon | `text-icon-disabled` | color.icon.disabled |
| Inverse icon | `text-icon-inverse` | color.icon.inverse |
| Selected icon | `text-icon-selected` | color.icon.selected |
| Brand icon | `text-icon-brand` | color.icon.brand |
| Danger icon | `text-icon-danger` | color.icon.danger |
| Warning icon | `text-icon-warning` | color.icon.warning |
|   ↳ inverse | `text-icon-warning-inverse` | color.icon.warning.inverse |
| Success icon | `text-icon-success` | color.icon.success |
| Discovery icon | `text-icon-discovery` | color.icon.discovery |
| Information icon | `text-icon-information` | color.icon.information |

## Link Colors

| Purpose | Tailwind | ADS Token |
|---|---|---|
| Default link | `text-link` | color.link |
| Pressed link | `text-link-pressed` | color.link.pressed |
| Visited link | `text-link-visited` | color.link.visited |
| Visited pressed | `text-link-visited-pressed` | color.link.visited.pressed |

## Border Colors

| Purpose | Tailwind | ADS Token |
|---|---|---|
| Default border | `border-border` | color.border |
| Bold border | `border-border-bold` | color.border.bold |
| Disabled border | `border-border-disabled` | color.border.disabled |
| Inverse border | `border-border-inverse` | color.border.inverse |
| Selected border | `border-border-selected` | color.border.selected |
| Brand border | `border-border-brand` | color.border.brand |
| Danger border | `border-border-danger` | color.border.danger |
| Warning border | `border-border-warning` | color.border.warning |
| Success border | `border-border-success` | color.border.success |
| Discovery border | `border-border-discovery` | color.border.discovery |
| Information border | `border-border-information` | color.border.information |
| Focus ring | `ring-ring` | color.border.focused |

---

## Background — Shadcn Aliases

These are shadcn-convention aliases. Both the alias and the ADS semantic name are valid; prefer ADS names in custom VPK components.

| Purpose | Tailwind | ADS Token |
|---|---|---|
| Page background | `bg-background` | elevation.surface |
| Card background | `bg-card` | elevation.surface.raised |
| Popover background | `bg-popover` | elevation.surface.overlay |
| Primary action (bold) | `bg-primary` | color.background.brand.bold |
|   ↳ hovered | `bg-primary-hovered` | color.background.brand.bold.hovered |
|   ↳ pressed | `bg-primary-pressed` | color.background.brand.bold.pressed |
| Muted background | `bg-muted` | color.background.accent.gray.subtlest |
| Neutral background | `bg-accent` | color.background.neutral |
| Destructive (bold) | `bg-destructive` | color.background.danger.bold |
|   ↳ hovered | `bg-destructive-hovered` | color.background.danger.bold.hovered |
|   ↳ pressed | `bg-destructive-pressed` | color.background.danger.bold.pressed |
| Success (bold) | `bg-success` | color.background.success.bold |
|   ↳ hovered | `bg-success-hovered` | color.background.success.bold.hovered |
|   ↳ pressed | `bg-success-pressed` | color.background.success.bold.pressed |
| Warning (bold) | `bg-warning` | color.background.warning.bold |
|   ↳ hovered | `bg-warning-hovered` | color.background.warning.bold.hovered |
|   ↳ pressed | `bg-warning-pressed` | color.background.warning.bold.pressed |
| Info (bold) | `bg-info` | color.background.information.bold |
|   ↳ hovered | `bg-info-hovered` | color.background.information.bold.hovered |
|   ↳ pressed | `bg-info-pressed` | color.background.information.bold.pressed |
| Discovery (bold) | `bg-discovery` | color.background.discovery.bold |
|   ↳ hovered | `bg-discovery-hovered` | color.background.discovery.bold.hovered |
|   ↳ pressed | `bg-discovery-pressed` | color.background.discovery.bold.pressed |
| Foreground text | `text-foreground` | color.text |
| Card foreground | `text-card-foreground` | color.text |
| Popover foreground | `text-popover-foreground` | color.text |
| Primary foreground | `text-primary-foreground` | color.text.inverse |
| Muted foreground | `text-muted-foreground` | color.text.subtlest |
| Accent foreground | `text-accent-foreground` | color.text.subtle |
| Destructive foreground | `text-destructive-foreground` | color.text.inverse |
| Secondary foreground | `text-secondary-foreground` | color.text.subtle |

**Sidebar aliases** (used by sidebar component):

| Purpose | Tailwind | ADS Token |
|---|---|---|
| Sidebar background | `bg-sidebar` | elevation.surface |
| Sidebar foreground | `text-sidebar-foreground` | color.text |
| Sidebar primary | `bg-sidebar-primary` | color.background.brand.bold |
| Sidebar primary foreground | `text-sidebar-primary-foreground` | color.text.inverse |
| Sidebar accent | `bg-sidebar-accent` | color.background.neutral.subtle.hovered |
| Sidebar accent foreground | `text-sidebar-accent-foreground` | color.text |
| Sidebar border | `border-sidebar-border` | color.border |
| Sidebar ring | `ring-sidebar-ring` | color.border.focused |

## Background — Status (subtle/subtler)

| Purpose | Tailwind | ADS Token |
|---|---|---|
| Danger subtle | `bg-bg-danger` | color.background.danger |
|   ↳ hovered | `bg-bg-danger-hovered` | color.background.danger.hovered |
|   ↳ pressed | `bg-bg-danger-pressed` | color.background.danger.pressed |
|   ↳ subtler | `bg-bg-danger-subtler` | color.background.danger.subtler |
|   ↳ subtler hovered | `bg-bg-danger-subtler-hovered` | color.background.danger.subtler.hovered |
|   ↳ subtler pressed | `bg-bg-danger-subtler-pressed` | color.background.danger.subtler.pressed |
| Warning subtle | `bg-bg-warning` | color.background.warning |
|   ↳ hovered | `bg-bg-warning-hovered` | color.background.warning.hovered |
|   ↳ pressed | `bg-bg-warning-pressed` | color.background.warning.pressed |
|   ↳ subtler | `bg-bg-warning-subtler` | color.background.warning.subtler |
|   ↳ subtler hovered | `bg-bg-warning-subtler-hovered` | color.background.warning.subtler.hovered |
|   ↳ subtler pressed | `bg-bg-warning-subtler-pressed` | color.background.warning.subtler.pressed |
| Success subtle | `bg-bg-success` | color.background.success |
|   ↳ hovered | `bg-bg-success-hovered` | color.background.success.hovered |
|   ↳ pressed | `bg-bg-success-pressed` | color.background.success.pressed |
|   ↳ subtler | `bg-bg-success-subtler` | color.background.success.subtler |
|   ↳ subtler hovered | `bg-bg-success-subtler-hovered` | color.background.success.subtler.hovered |
|   ↳ subtler pressed | `bg-bg-success-subtler-pressed` | color.background.success.subtler.pressed |
| Discovery subtle | `bg-bg-discovery` | color.background.discovery |
|   ↳ hovered | `bg-bg-discovery-hovered` | color.background.discovery.hovered |
|   ↳ pressed | `bg-bg-discovery-pressed` | color.background.discovery.pressed |
|   ↳ subtler | `bg-bg-discovery-subtler` | color.background.discovery.subtler |
|   ↳ subtler hovered | `bg-bg-discovery-subtler-hovered` | color.background.discovery.subtler.hovered |
|   ↳ subtler pressed | `bg-bg-discovery-subtler-pressed` | color.background.discovery.subtler.pressed |
| Information subtle | `bg-bg-information` | color.background.information |
|   ↳ hovered | `bg-bg-information-hovered` | color.background.information.hovered |
|   ↳ pressed | `bg-bg-information-pressed` | color.background.information.pressed |
|   ↳ subtler | `bg-bg-information-subtler` | color.background.information.subtler |
|   ↳ subtler hovered | `bg-bg-information-subtler-hovered` | color.background.information.subtler.hovered |
|   ↳ subtler pressed | `bg-bg-information-subtler-pressed` | color.background.information.subtler.pressed |

## Background — Neutral / Selected / Brand

| Purpose | Tailwind | ADS Token |
|---|---|---|
| Neutral | `bg-bg-neutral` | color.background.neutral |
|   ↳ hovered | `bg-bg-neutral-hovered` | color.background.neutral.hovered |
|   ↳ pressed | `bg-bg-neutral-pressed` | color.background.neutral.pressed |
| Neutral subtle | `bg-bg-neutral-subtle` | color.background.neutral.subtle |
|   ↳ hovered | `bg-bg-neutral-subtle-hovered` | color.background.neutral.subtle.hovered |
|   ↳ pressed | `bg-bg-neutral-subtle-pressed` | color.background.neutral.subtle.pressed |
| Neutral bold | `bg-bg-neutral-bold` | color.background.neutral.bold |
|   ↳ hovered | `bg-bg-neutral-bold-hovered` | color.background.neutral.bold.hovered |
|   ↳ pressed | `bg-bg-neutral-bold-pressed` | color.background.neutral.bold.pressed |
| Selected | `bg-bg-selected` | color.background.selected |
|   ↳ hovered | `bg-bg-selected-hovered` | color.background.selected.hovered |
|   ↳ pressed | `bg-bg-selected-pressed` | color.background.selected.pressed |
| Selected bold | `bg-bg-selected-bold` | color.background.selected.bold |
|   ↳ hovered | `bg-bg-selected-bold-hovered` | color.background.selected.bold.hovered |
|   ↳ pressed | `bg-bg-selected-bold-pressed` | color.background.selected.bold.pressed |
| Brand subtlest | `bg-bg-brand-subtlest` | color.background.brand.subtlest |
|   ↳ hovered | `bg-bg-brand-subtlest-hovered` | color.background.brand.subtlest.hovered |
|   ↳ pressed | `bg-bg-brand-subtlest-pressed` | color.background.brand.subtlest.pressed |
| Brand boldest | `bg-bg-brand-boldest` | color.background.brand.boldest |
|   ↳ hovered | `bg-bg-brand-boldest-hovered` | color.background.brand.boldest.hovered |
|   ↳ pressed | `bg-bg-brand-boldest-pressed` | color.background.brand.boldest.pressed |

## Background — Utility

| Purpose | Tailwind | ADS Token |
|---|---|---|
| Disabled | `bg-bg-disabled` | color.background.disabled |
| Input | `bg-bg-input` | color.background.input |
|   ↳ hovered | `bg-bg-input-hovered` | color.background.input.hovered |
|   ↳ pressed | `bg-bg-input-pressed` | color.background.input.pressed |
| Inverse subtle | `bg-bg-inverse-subtle` | color.background.inverse.subtle |
|   ↳ hovered | `bg-bg-inverse-subtle-hovered` | color.background.inverse.subtle.hovered |
|   ↳ pressed | `bg-bg-inverse-subtle-pressed` | color.background.inverse.subtle.pressed |

## Elevation Surfaces

| Purpose | Tailwind | ADS Token |
|---|---|---|
| Default surface | `bg-surface` | elevation.surface |
|   ↳ hovered | `bg-surface-hovered` | elevation.surface.hovered |
|   ↳ pressed | `bg-surface-pressed` | elevation.surface.pressed |
| Raised surface | `bg-surface-raised` | elevation.surface.raised |
|   ↳ hovered | `bg-surface-raised-hovered` | elevation.surface.raised.hovered |
|   ↳ pressed | `bg-surface-raised-pressed` | elevation.surface.raised.pressed |
| Overlay surface | `bg-surface-overlay` | elevation.surface.overlay |
|   ↳ hovered | `bg-surface-overlay-hovered` | elevation.surface.overlay.hovered |
|   ↳ pressed | `bg-surface-overlay-pressed` | elevation.surface.overlay.pressed |
| Sunken surface | `bg-surface-sunken` | elevation.surface.sunken |

## Blanket / Interaction / Skeleton / Opacity

| Purpose | Tailwind | ADS Token |
|---|---|---|
| Blanket overlay | `bg-blanket` | color.blanket |
| Blanket selected | `bg-blanket-selected` | color.blanket.selected |
| Blanket danger | `bg-blanket-danger` | color.blanket.danger |
| Interaction hovered | `bg-interaction-hovered` | color.interaction.hovered |
| Interaction pressed | `bg-interaction-pressed` | color.interaction.pressed |
| Skeleton | `bg-skeleton` | color.skeleton |
| Skeleton subtle | `bg-skeleton-subtle` | color.skeleton.subtle |
| Disabled opacity | `opacity-disabled` | opacity.disabled |
| Loading opacity | `opacity-loading` | opacity.loading |

## Chart Colors

| Purpose | Tailwind | ADS Token |
|---|---|---|
| Categorical 1 | `bg-chart-1`, `text-chart-1` | chart.categorical.1 |
| Categorical 2 | `bg-chart-2`, `text-chart-2` | chart.categorical.2 |
| Categorical 3 | `bg-chart-3`, `text-chart-3` | chart.categorical.3 |
| Categorical 4 | `bg-chart-4`, `text-chart-4` | chart.categorical.4 |
| Categorical 5 | `bg-chart-5`, `text-chart-5` | chart.categorical.5 |
| Categorical 6 | `bg-chart-6`, `text-chart-6` | chart.categorical.6 |
| Categorical 7 | `bg-chart-7`, `text-chart-7` | chart.categorical.7 |
| Categorical 8 | `bg-chart-8`, `text-chart-8` | chart.categorical.8 |
| Brand | `bg-chart-brand` | chart.brand |
| Neutral | `bg-chart-neutral` | chart.neutral |
| Danger | `bg-chart-danger` | chart.danger |
| Danger bold | `bg-chart-danger-bold` | chart.danger.bold |
| Warning | `bg-chart-warning` | chart.warning |
| Warning bold | `bg-chart-warning-bold` | chart.warning.bold |
| Success | `bg-chart-success` | chart.success |
| Success bold | `bg-chart-success-bold` | chart.success.bold |
| Discovery | `bg-chart-discovery` | chart.discovery |
| Discovery bold | `bg-chart-discovery-bold` | chart.discovery.bold |
| Information | `bg-chart-information` | chart.information |
| Information bold | `bg-chart-information-bold` | chart.information.bold |

## Border Width

| Purpose | Tailwind | ADS Token |
|---|---|---|
| Default | `border` | border.width |
| Selected | `border-[length:var(--border-width-selected)]` | border.width.selected |
| Focused | `border-[length:var(--border-width-focused)]` | border.width.focused |

---

## Accent Colors (from tailwind-theme — fallback)

Use these only for decorative accent hues when no semantic token applies.

| Color | ADS Token (background) | Tailwind | CSS Variable |
|---|---|---|---|
| Blue subtlest | background.accent.blue.subtlest | bg-blue-50 | var(--ds-background-accent-blue-subtlest) |
| Blue subtle | background.accent.blue.subtle | bg-blue-200 | var(--ds-background-accent-blue-subtle) |
| Blue bold | chart.blue.bold | bg-blue-400 | var(--ds-chart-blue-bold) |
| Red subtlest | background.accent.red.subtlest | bg-red-50 | var(--ds-background-accent-red-subtlest) |
| Green subtlest | background.accent.green.subtlest | bg-green-50 | var(--ds-background-accent-green-subtlest) |
| Yellow subtlest | background.accent.yellow.subtlest | bg-yellow-50 | var(--ds-background-accent-yellow-subtlest) |
| Purple subtlest | background.accent.purple.subtlest | bg-purple-50 | var(--ds-background-accent-purple-subtlest) |
| Gray/neutral | background.accent.gray.subtlest | bg-neutral-50 | var(--ds-background-accent-gray-subtlest) |

## Typography

| Purpose | ADS Token | Tailwind | Notes |
|---|---|---|---|
| Body small (12px) | font.body.small | text-xs | 12px, line-height 16px |
| Body (14px) | font.body | text-sm | 14px, line-height 20px |
| Body large (16px) | font.body.large | text-base | 16px, line-height 24px |
| Heading medium (20px) | font.heading.medium | text-xl | 20px |
| Heading large (24px) | font.heading.large | text-2xl | 24px |
| Font weight regular | font.weight.regular | font-normal | 400 |
| Font weight medium | font.weight.medium | font-medium | 500 |
| Font weight semibold | font.weight.semibold | font-semibold | 600 |
| Font weight bold | font.weight.bold | font-bold | 700 |

---

## Alias Cross-Reference

Shadcn aliases and their ADS semantic equivalents. Both are valid; prefer ADS semantic names in custom VPK components.

| Shadcn Alias | ADS Semantic Equivalent | Notes |
|---|---|---|
| `bg-background` | `bg-surface` | Page background |
| `bg-card` | `bg-surface-raised` | Card/raised surface |
| `bg-popover` | `bg-surface-overlay` | Popover/dropdown |
| `text-foreground` | `text-text` | Default text |
| `text-muted-foreground` | `text-text-subtlest` | Hint/secondary text |
| `text-accent-foreground` | `text-text-subtle` | Subtle text |
| `text-primary-foreground` | `text-text-inverse` | Text on bold bg |
| `bg-accent` | `bg-bg-neutral` | Neutral interactive bg |
| `bg-muted` | — | No direct equivalent (gray accent subtlest) |
| `bg-destructive` | — | Bold danger (use for buttons, not subtle backgrounds) |
| `border-border` | `border-border` | Same in both systems |
| `ring-ring` | — | Focus ring (unique to shadcn) |

---

## Edge Cases

When Tailwind doesn't have a direct mapping:

```tsx
// For 6px gap (space.075)
<div style={{ gap: token("space.075") }}>

// For custom colors not in theme
<div style={{ backgroundColor: token("color.background.accent.blue.subtler") }}>
```

## Common Mistakes

| Wrong | Correct | Why |
|---|---|---|
| `bg-[var(--ds-background-neutral)]` | `bg-bg-neutral` | Semantic class exists |
| `text-[var(--ds-text-danger)]` | `text-text-danger` | Semantic class exists |
| `bg-[var(--ds-surface-raised)]` | `bg-surface-raised` | Semantic class exists |
| `border-[var(--ds-border-bold)]` | `border-border-bold` | Semantic class exists |
| `bg-white` / `bg-black` | `bg-surface` / `bg-bg-neutral-bold` | Raw colors break dark mode |

## Motion Tokens

Duration and easing tokens are defined in `app/tailwind-theme.css`. Prefer semantic Tailwind utilities in class names and `var()` references inside custom CSS or inline transition strings.

### Duration

| CSS Variable | Value | Tailwind | Use for |
|---|---|---|---|
| `--duration-instant` | 0ms | `duration-instant` | Immediate state changes |
| `--duration-xxshort` | 50ms | `duration-xxshort` | Active press |
| `--duration-fast` | 100ms | `duration-fast` | Hover elevation |
| `--duration-normal` | 150ms | `duration-normal` | Small state changes |
| `--duration-medium` | 200ms | `duration-medium` | Sidebar, modals, panels |
| `--duration-slow` | 250ms | `duration-slow` | Complex transitions |
| `--duration-slower` | 400ms | `duration-slower` | Page transitions |
| `--duration-slowest` | 600ms | `duration-slowest` | Scroll reveals |

### Easing

| CSS Variable | Value | Tailwind | Use for |
|---|---|---|---|
| `--ease-linear` | `cubic-bezier(0, 0, 1, 1)` | `ease-linear` | Progress bars, continuous |
| `--ease-in` | `cubic-bezier(0.6, 0, 0.8, 0.6)` | `ease-in` | Exit animations |
| `--ease-out` | `cubic-bezier(0, 0.4, 0, 1)` | `ease-out` | Enter animations, hover |
| `--ease-out-practical` | `cubic-bezier(0.4, 1, 0.6, 1)` | `ease-out-practical` | Compact fade/slide entrances |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0, 1)` | `ease-in-out` | Sidebar, modals, position swaps |
| `--ease-spring` | `linear(...)` | `ease-spring` | Small tactile branded motion only |

### Usage

```tsx
// Tailwind class — preferred when a matching utility exists
className="transition-[width] duration-medium ease-in-out"

// Inline style — use var() references for property-specific transitions
style={{ transition: "left var(--duration-medium) var(--ease-in-out)" }}
```

| Wrong | Correct | Why |
|---|---|---|
| `duration-200` | `duration-medium` | Use semantic duration utilities |
| `0.15s cubic-bezier(0.4, 0, 0.2, 1)` | `var(--duration-medium) var(--ease-in-out)` | Use theme tokens |
| `ease-linear` on sidebar slide | `ease-in-out` | Linear feels mechanical |
| Mismatched easing on synced elements | Same `var(--ease-*)` + `var(--duration-*)` on all | Elements moving together must match |
