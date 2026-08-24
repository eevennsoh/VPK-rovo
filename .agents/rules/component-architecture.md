---
description: Component architecture patterns — Context State/Actions/Meta, compound components, CVA variants
globs: components/**/*.tsx, app/contexts/**/*.tsx
alwaysApply: false
---

# Component Architecture

Reference details: `.agents/skills/vpk-tidy/SKILL.md`

Quick rules:

- Keep components under 150 lines where practical
- Move logic into hooks
- Move static data into `data/` files
- Use `Readonly<Props>` interfaces
- Shared `components/ui/**`, `components/ui-custom/**`, and
  `components/projects/shared/**` owners must not import an experimental
  variant. Move reusable behavior behind a shared model or require an explicit
  capability at the feature boundary.

Context pattern (`State/Actions/Meta`) lives in:

- `app/contexts/context-[name].tsx`
- Reference implementation: `app/contexts/context-work-item-modal.tsx`

Use convenience hooks such as:

- `useFooState()`
- `useFooActions()`
- `useFooData()` or `useFooMeta()`

Compound component namespace pattern:

```tsx
export const Composer = {
	Container: ComposerContainer,
	Textarea: ComposerTextarea,
	Actions: ComposerActions,
} as const;
```

CVA variant pattern for `components/ui/*`:

```tsx
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva("base-classes", {
	variants: { variant: { default: "...", danger: "..." } },
	defaultVariants: { variant: "default" },
});

interface BadgeProps extends React.ComponentProps<"span">, VariantProps<typeof badgeVariants> {}
```
