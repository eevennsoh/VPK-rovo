import { Children, isValidElement, type ComponentProps, type ReactNode } from "react"

import { cn } from "@/lib/utils"
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ReturnIcon,
  type VpkIconComponent,
} from "@/components/ui/vpk-icons"

/**
 * Keys that render as a VPK icon rather than a glyph. Arrows and the
 * return/enter key always use the icon treatment so they read consistently
 * with the rest of the design system. Lookups are case-insensitive.
 */
const KEY_ICONS: Record<string, VpkIconComponent> = {
  up: ArrowUpIcon,
  arrowup: ArrowUpIcon,
  "↑": ArrowUpIcon,
  down: ArrowDownIcon,
  arrowdown: ArrowDownIcon,
  "↓": ArrowDownIcon,
  left: ArrowLeftIcon,
  arrowleft: ArrowLeftIcon,
  "←": ArrowLeftIcon,
  right: ArrowRightIcon,
  arrowright: ArrowRightIcon,
  "→": ArrowRightIcon,
  enter: ReturnIcon,
  return: ReturnIcon,
  "↵": ReturnIcon,
}

/**
 * Maps spelled-out key names to their canonical Unicode glyphs so callers can
 * pass readable strings (e.g. `Cmd`, `Shift`) and still render the standard
 * keyboard symbols. Lookups are case-insensitive on the whole token.
 *
 * Uses the Mac convention: `ctrl` maps to the Option glyph (⌥) and `shift`
 * to ⇧, so shortcuts render with the symbols Mac users expect. Keys with a
 * dedicated icon (arrows, return) live in `KEY_ICONS` instead.
 */
const KEY_GLYPHS: Record<string, string> = {
  cmd: "⌘",
  command: "⌘",
  meta: "⌘",
  ctrl: "⌥",
  control: "⌥",
  shift: "⇧",
  alt: "⌥",
  option: "⌥",
  opt: "⌥",
  esc: "⎋",
  escape: "⎋",
  tab: "⇥",
  backspace: "⌫",
  delete: "⌦",
  del: "⌦",
  capslock: "⇪",
  pageup: "⇞",
  pagedown: "⇟",
  home: "↖",
  end: "↘",
}

/**
 * Renders a single key token as a node: a VPK icon (arrows, return), a Unicode
 * glyph (modifiers, special keys), or the raw text when unrecognized.
 */
function renderToken(token: string): ReactNode {
  const trimmed = token.trim()
  const key = trimmed.toLowerCase()
  const Icon = KEY_ICONS[key]
  if (Icon) return <Icon size="small" />
  return KEY_GLYPHS[key] ?? trimmed
}

/** Shared keycap chrome (surface, color, radius, font, layout). */
const KBD_BASE_CLASS =
  "bg-surface-sunken text-text-subtle in-data-[slot=tooltip-content]:bg-background/20 in-data-[slot=tooltip-content]:text-background h-4 gap-1 rounded-sm font-sans text-xs pointer-events-none inline-flex items-center justify-center select-none"

/** A single glyph or icon renders as a fixed 16×16 square (no side padding). */
const KBD_SQUARE_CLASS = "size-4"

/** Multi-character content grows with side padding while staying 16px tall. */
const KBD_GROW_CLASS = "w-fit min-w-4 px-1"

/** True when the content is a single character or a single React element. */
function isSingleKey(children: ReactNode): boolean {
  if (typeof children === "string") return [...children.trim()].length === 1
  const array = Children.toArray(children)
  return array.length === 1 && isValidElement(array[0])
}

function Kbd({ className, children, ...props }: ComponentProps<"kbd">) {
  // Compound strings (e.g. "Ctrl + B") never render a "+" — each key becomes
  // its own keycap inside a KbdGroup so the chord reads as separate chunks.
  if (typeof children === "string") {
    const tokens = children
      .split("+")
      .map((segment) => segment.trim())
      .filter(Boolean)
    if (tokens.length > 1) {
      return (
        <KbdGroup className={className}>
          {tokens.map((token, index) => (
            <Kbd key={index} {...props}>
              {token}
            </Kbd>
          ))}
        </KbdGroup>
      )
    }
  }

  const content = typeof children === "string" ? renderToken(children) : children

  return (
    <kbd
      data-slot="kbd"
      className={cn(
        KBD_BASE_CLASS,
        isSingleKey(content) ? KBD_SQUARE_CLASS : KBD_GROW_CLASS,
        className
      )}
      {...props}
    >
      {content}
    </kbd>
  )
}

function KbdGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn("gap-0.5 inline-flex items-center", className)}
      {...props}
    />
  )
}

export { Kbd, KbdGroup }
