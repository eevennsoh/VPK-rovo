# Common Upstream → VPK Mappings

Pre-built mapping tables for frequently mapped ADS and shadcn/Base UI components. Use these as starting points — always verify against the actual VPK source.

---

## Canonical Prop Naming (Use For All Components)

This is the **single source of truth** for upstream-to-VPK prop naming. Apply this table even when there is no direct shadcn equivalent. For custom VPK components, normalize API names to shadcn conventions.

| ADS Prop/Concept | shadcn/VPK Prop Name | Notes |
|---|---|---|
| `appearance` | `variant` | Example: Tag must use `variant`, not `appearance` |
| `spacing` | `size` | Keep shadcn-style size naming |
| `isDisabled` | `disabled` | Native HTML attribute |
| `isInvalid` | `aria-invalid` | Form-state attribute |
| `isRequired` | `required` | Native HTML attribute |
| `isChecked` | `checked` | Controlled checked state |
| `defaultChecked` | `defaultChecked` | Uncontrolled checked default |
| `onChange` | `onValueChange` / `onCheckedChange` / `onOpenChange` | Use primitive-specific handler names |
| `isOpen` | `open` | Controlled open state |
| `defaultOpen` | `defaultOpen` | Uncontrolled open default |
| `isSelected` | `pressed` or state attrs (`aria-pressed`/`data-checked`) | Match primitive behavior |

Add new recurring aliases here whenever discovered so naming stays consistent across all mappings.

---

## Button ✅ (Enriched — Gold Standard)

**ADS:** `@atlaskit/button` → **VPK:** `@/components/ui/button`

### Variant Mapping

| ADS `appearance` | VPK `variant` | Match |
|---|---|---|
| `primary` | `default` | Exact |
| `default` | `outline` | Exact |
| `subtle` | `ghost` | Exact |
| `link` | `link` | Exact |
| `subtle-link` | `link` | Approximate |
| `danger` | `destructive` | Exact |
| `warning` | `warning` | Exact |
| `discovery` | `discovery` | Exact |
| — | `secondary` | VPK-only variant |

### Props Mapping

| ADS Prop | VPK Prop | Notes |
|---|---|---|
| `appearance` | `variant` | Values differ — see variant table |
| `spacing` | `size` | `compact` → `sm`, `default` → `default` |
| `isDisabled` | `disabled` | Native HTML attribute |
| `isSelected` | `aria-pressed` | Built-in — styled via `aria-pressed:` classes |
| `iconBefore` | children | `<Icon data-icon="inline-start" />` as child |
| `iconAfter` | children | `<Icon data-icon="inline-end" />` as child |
| `isLoading` | `isLoading` | Built-in — renders `<Spinner />`, adds `aria-busy` |
| `shouldFitContainer` | `className="w-full"` | Utility class |
| `href` | `render={<a href="..." />}` | Base UI render prop |

### Enrichment Details

All 8 variants have full state coverage: `hover:`, `active:`, `aria-pressed:`, `aria-expanded:`, `disabled:`, focus ring, and loading. Bold variants use `disabled:bg-bg-disabled disabled:text-text-disabled`. Subtle variants use `disabled:opacity-(--opacity-disabled)`. Props exported as `ButtonProps`.

### Verified Computed Values (from `atlassian.design`)

| Property | ADS Value | Tailwind Class |
|---|---|---|
| `border-radius` | 6px | `rounded-md` |
| `height` | 32px | `h-8` |
| `font-size` | 14px | `text-sm` |
| `font-weight` | 500 | `font-medium` |

---

## ButtonGroup ✅ (Enriched)

**ADS:** `@atlaskit/button` (ButtonGroup export) → **VPK:** `@/components/ui/button-group`

### Architecture Difference

ADS ButtonGroup renders buttons as **separated** items with `gap: 4px` and no border merging. VPK ButtonGroup supports both patterns via a `variant` prop: `"connected"` (default — toolbar-style with merged borders) and `"separated"` (ADS-style with gap).

### Variant Mapping

| ADS Behavior | VPK `variant` |
|---|---|
| Default (separated with gap) | `separated` |
| — | `connected` (VPK default — toolbar-style) |

### Verified Computed Values (from `atlassian.design`)

| Property | ADS Value | Tailwind Class |
|---|---|---|
| Container `gap` | 4px | `gap-1` |
| Container `display` | inline-flex | `inline-flex` |
| Child `border-radius` | 6px | `rounded-md` |
| Child `height` | 32px | `h-8` |

### Sub-components

| VPK Sub-component | Purpose |
|---|---|
| `ButtonGroup` | Container with variant/orientation |
| `ButtonGroupSeparator` | Visual separator between items |
| `ButtonGroupText` | Non-interactive text element |

---

## Dialog / Modal

**ADS:** `@atlaskit/modal-dialog` → **VPK:** `@/components/ui/dialog`

### Sub-component Mapping

| ADS | VPK |
|---|---|
| `ModalDialog` | `Dialog` (root) |
| `ModalTransition` | — (built into DialogContent) |
| `ModalHeader` | `DialogHeader` |
| `ModalTitle` | `DialogTitle` |
| `ModalBody` | children of `DialogContent` |
| `ModalFooter` | `DialogFooter` |

### Props Mapping

| ADS Prop | VPK Prop | Notes |
|---|---|---|
| `width` | `className` | Use Tailwind `max-w-*` classes |
| `height` | `className` | Use Tailwind `h-*` or `max-h-*` |
| `onClose` | — | Use `Dialog`'s `onOpenChange` |
| `shouldScrollInViewport` | — | Default behavior in VPK |
| `isBlanketHidden` | — | Gap — override backdrop styles |

---

## Tabs

**ADS:** `@atlaskit/tabs` → **VPK:** `@/components/ui/tabs`

### Sub-component Mapping

| ADS | VPK |
|---|---|
| `Tabs` | `Tabs` |
| `TabList` | `TabsList` |
| `Tab` | `TabsTrigger` |
| `TabPanel` | `TabsContent` |

### Props Mapping

| ADS Prop | VPK Prop | Notes |
|---|---|---|
| `id` | `value` | Tab identifier |
| `selected` | `defaultValue` | On `Tabs` root |
| `onChange` | `onValueChange` | On `Tabs` root |

---

## Select

**ADS:** `@atlaskit/select` → **VPK:** `@/components/ui/select` or `@/components/ui/combobox`

### Sub-component Mapping

| ADS | VPK |
|---|---|
| `Select` | `Select` (root) |
| `Option` (via `options` prop) | `SelectItem` |
| `Select` with `isSearchable` | Use `Combobox` instead |

### Props Mapping

| ADS Prop | VPK Prop | Notes |
|---|---|---|
| `options` | children | VPK uses `SelectItem` children |
| `defaultValue` | `defaultValue` | Exact |
| `value` | `value` | Exact |
| `onChange` | `onValueChange` | Exact |
| `placeholder` | `placeholder` | On `SelectTrigger` |
| `isDisabled` | `disabled` | Native HTML |
| `isSearchable` | — | Use `Combobox` component instead |
| `isMulti` | — | Gap — no built-in multi-select |
| `isCreatable` | — | Gap — custom implementation needed |

---

## Checkbox

**ADS:** `@atlaskit/checkbox` → **VPK:** `@/components/ui/checkbox`

### Props Mapping

| ADS Prop | VPK Prop | Notes |
|---|---|---|
| `isChecked` | `checked` | Exact |
| `defaultChecked` | `defaultChecked` | Exact |
| `isDisabled` | `disabled` | Native HTML |
| `isRequired` | `required` | Native HTML |
| `isInvalid` | `aria-invalid` | Exact |
| `isIndeterminate` | — | Gap — not built-in |
| `onChange` | `onCheckedChange` | Different signature |
| `label` | children / `<label>` | VPK uses separate `<label>` element |

---

## Radio ✅ (Enriched)

**ADS:** `@atlaskit/radio` → **VPK:** `@/components/ui/radio-group`

### Props Mapping

| ADS Prop | VPK Prop | Notes |
|---|---|---|
| `isChecked` | `checked` / `value` on `RadioGroup` | Selection via group `value`/`defaultValue` |
| `isDisabled` | `disabled` | Native HTML attribute |
| `isRequired` | `required` | Native HTML attribute |
| `isInvalid` | `aria-invalid` / `data-invalid` | Both selectors supported |
| `value` | `value` | On `RadioGroupItem` |
| `label` | children / `<Label>` | VPK uses separate `<Label>` element |
| `onChange` | `onValueChange` | On `RadioGroup` root |
| `options` (RadioGroup) | children | VPK uses `RadioGroupItem` children |

### Sub-component Mapping

| ADS | VPK |
|---|---|
| `RadioGroup` | `RadioGroup` |
| `Radio` | `RadioGroupItem` |

### Enrichment Details

Single-appearance component. Full state coverage: `hover:`, `active:`, `data-checked:`, `disabled:`, `data-invalid:`, `aria-invalid:`, focus ring. Uses `border-2` (2px border width matching ADS). Inner dot indicator is a pure CSS circle (`<span className="size-1.5 rounded-full bg-current" />`), not an SVG icon. Checked state applies `bg-primary` + `border-primary` with full hover/active token triplets on both background and border.

### Visual Parity Notes

| Property | ADS Value | VPK Implementation |
|---|---|---|
| Border width | 2px | `border-2` |
| Shape | Circle | `rounded-full` |
| Inner dot (checked) | ~6px filled circle | `size-1.5 rounded-full bg-current` |
| Unchecked bg | `color.background.input` | `bg-bg-input` |
| Checked bg | `color.background.brand.bold` | `bg-primary` (alias) |
| Checked border | `color.background.brand.bold` | `border-primary` (alias) |

---

## Toggle / Switch

**ADS:** `@atlaskit/toggle` → **VPK:** `@/components/ui/switch`

### Props Mapping

| ADS Prop | VPK Prop | Notes |
|---|---|---|
| `isChecked` | `checked` | Exact |
| `defaultChecked` | `defaultChecked` | Exact |
| `isDisabled` | `disabled` | Native HTML |
| `onChange` | `onCheckedChange` | Different signature |
| `size` | `size` | ADS `regular` → VPK `default`, ADS `large` → VPK `lg`; VPK `sm` is an extension |
| `label` | children / `<label>` | VPK uses separate `<label>` element |

### Visual Parity Locks (ADS Toggle)

| Part | ADS Regular / Default | ADS Large | Implementation Note |
|---|---|---|---|
| Track content area | 32x16 | 40x20 | Keep root as content-box with explicit border + inner padding |
| Thumb | 12x12 | 16x16 | Avoid oversized default thumb (20px) which collides with icons |
| Icon container | 16x16, inset 3px | 20x20, inset 3px | Preserve left/right icon inset from track edge |
| Checked icon | `check-mark`, `size="small"` | `check-mark`, `size="small"` | Wrap with VPK `<Icon>` |
| Unchecked icon | `cross`, `size="small"` | `cross`, `size="small"` | Wrap with VPK `<Icon>` |

---

## Icon

**ADS:** `@atlaskit/icon` → **VPK:** `@/components/ui/icon`

### Architecture Difference

ADS icons (`@atlaskit/icon/core/*`) are standalone components — each icon accepts `size`, `color`, `spacing`, and `label` props directly on the icon itself. VPK's `Icon` component is an **accessibility wrapper** (`<span role="img">`) that wraps any icon element.

### Props Mapping

| ADS Prop | VPK Equivalent | Notes |
|---|---|---|
| `label` | `label` (on `<Icon>` wrapper) | Accessibility text; empty string = presentation-only |
| `color` | `className="text-text-*"` | Use Tailwind semantic color classes on the wrapper |
| `size` | `size` prop on the icon itself | Pass directly: `<SearchIcon size="small" />` — **not** via wrapper className |
| `spacing` | — | Not needed — VPK parent components handle spacing via Tailwind |
| `testId` | — | Use standard `data-testid` prop on wrapper |

### Icon Sizing (Critical)

Atlaskit new core icons (`@atlaskit/icon/core/*`, `@atlaskit/icon-lab/core/*`) render their own SVG with fixed internal dimensions controlled by the `size` prop:

- `size="medium"` — 16px (default)
- `size="small"` — 12px

**The size must be passed to the icon component, not the wrapper:**

```tsx
// ✅ Correct — size on the icon itself
<Icon render={<SearchIcon label="" size="small" />} label="Search" />

// ❌ Wrong — className on the wrapper does not resize the SVG
<Icon render={<SearchIcon label="" />} label="Search" className="size-3" />
```

### Color Styling

Color is applied via Tailwind classes on the VPK `<Icon>` wrapper. The atlaskit icon inherits `currentColor` by default:

```tsx
<Icon render={<CheckCircleIcon label="" />} label="Success" className="text-text-success" />
<Icon render={<SearchIcon label="" />} label="Info" className="text-text-information" />
```

---

## Avatar ✅ (Enriched)

**ADS:** `@atlaskit/avatar` → **VPK:** `@/components/ui/avatar`

### Shape Mapping

| ADS `shape` | VPK `shape` | Usage |
|---|---|---|
| — (default circle) | `circle` | Users / people |
| — (entity square) | `square` | Teams / projects / spaces |
| — (agent hexagon) | `hexagon` | AI agents |

### Size Mapping

| ADS `size` | VPK `size` | Dimensions |
|---|---|---|
| `xsmall` | `xs` | 16px (`size-4`) |
| `small` | `sm` | 24px (`size-6`) |
| `medium` | `default` | 32px (`size-8`) |
| `large` | `lg` | 40px (`size-10`) |
| `xlarge` | `xl` | 48px (`size-12`) |
| `xxlarge` | `2xl` | 96px (`size-24`) |

### Props Mapping

| ADS Prop | VPK Prop | Notes |
|---|---|---|
| `size` | `size` | Values differ — see size table |
| — | `shape` | `"circle" \| "square" \| "hexagon"` — Avatar owns all shape rendering |
| `isDisabled` | `disabled` | `opacity-(--opacity-disabled) pointer-events-none grayscale` |
| `presence` | `<AvatarPresenceIndicator presence="..." />` | Sub-component, not prop |
| `status` | `<AvatarStatusIndicator status="..." />` | Sub-component — `approved` / `declined` / `locked` |
| `label` | `label` | Mapped to `aria-label` |
| `name` (fallback) | `<AvatarFallback>` | Sub-component children (initials) |
| `src` | `<AvatarImage src="..." />` | Sub-component, not prop |

### Sub-component Mapping

| ADS | VPK |
|---|---|
| `Avatar` | `Avatar` (root) |
| `AvatarGroup` | `AvatarGroup` |
| `Presence` (via `presence` prop) | `AvatarPresenceIndicator` (child component) |
| `Status` (via `status` prop) | `AvatarStatusIndicator` (child component) |
| — | `AvatarBadge` (VPK-only — generic badge overlay) |
| — | `AvatarGroupCount` (VPK-only — count indicator) |

### Architecture Notes

- **Shape rendering ownership:** Avatar owns all shape rendering via CVA `shape` variant — hexagon clip-path, square border-radius, circle border-radius. Other components (Tag, etc.) must NOT duplicate shape classes on their Avatar wrappers; they should delegate to Avatar's `shape` prop.
- **CVA variant separation:** Shape-specific `after:` pseudo-element styles (border overlay) live only in the `shape` variant, not `size`. Duplicating `after:rounded-*` in both `size` and `shape` causes conflicts for non-circle shapes.
- **Group data selectors:** Sub-components (Image, Fallback, indicators) use `group-data-[shape=*]/avatar:` and `group-data-[size=*]/avatar:` selectors to respond to the root's shape and size.
- **Hexagon clip-path:** Uses the ADS rounded pointy-top hexagon (vertex at top/bottom, flat edges left/right) with 42-point polygon for smooth rounded corners. Applied to root, `after:` pseudo-element, Image, and Fallback. The previous simple 6-point flat-top polygon (`polygon(25% 6.7%, 75% 6.7%, ...)`) was incorrect — ADS uses a **pointy-top orientation** rotated 30° from flat-top.
- **Indicator visibility:** Status and badge icons are hidden at `xs`/`sm` sizes via `[&>svg]:hidden` — the indicator dot still shows but the icon inside doesn't render.
