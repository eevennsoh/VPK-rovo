"use client"

// oxlint-disable react-doctor/no-multi-comp -- This module intentionally colocates coupled component parts as a compound component or demo surface API.

import * as React from "react"
import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card"

import { cn } from "@/lib/utils"

type HoverCardProps = PreviewCardPrimitive.Root.Props & {
  openDelay?: number
  closeDelay?: number
}

// Base UI's PreviewCard reads hover delays on the Trigger (`delay`/`closeDelay`),
// not the Root. Bridge the Root-level `openDelay`/`closeDelay` props down to the
// Trigger via context so existing call sites keep their intended delays.
const HoverCardDelayContext = React.createContext<{
  openDelay?: number
  closeDelay?: number
}>({})

function HoverCard({ openDelay, closeDelay, ...props }: HoverCardProps) {
  const delays = React.useMemo(() => ({ openDelay, closeDelay }), [openDelay, closeDelay])
  return (
    <HoverCardDelayContext value={delays}>
      <PreviewCardPrimitive.Root data-slot="hover-card" {...props} />
    </HoverCardDelayContext>
  )
}

function HoverCardTrigger({
  delay,
  closeDelay,
  ...props
}: PreviewCardPrimitive.Trigger.Props) {
  const contextDelays = React.use(HoverCardDelayContext)
  return (
    <PreviewCardPrimitive.Trigger
      data-slot="hover-card-trigger"
      closeDelay={closeDelay ?? contextDelays.closeDelay}
      delay={delay ?? contextDelays.openDelay}
      {...props}
    />
  )
}

function HoverCardContent({
  className,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 4,
  ...props
}: PreviewCardPrimitive.Popup.Props &
  Pick<
    PreviewCardPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <PreviewCardPrimitive.Portal data-slot="hover-card-portal">
      <PreviewCardPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-[200]"
      >
        <PreviewCardPrimitive.Popup
          data-slot="hover-card-content"
          className={cn(
            "bg-popover text-popover-foreground w-64 rounded-lg p-2.5 text-sm shadow-xl z-[200] origin-(--transform-origin) outline-hidden transition-[opacity,scale,translate] duration-fast ease-out data-starting-style:opacity-0 data-starting-style:scale-95 data-ending-style:opacity-0 data-ending-style:scale-95 data-[side=bottom]:data-starting-style:-translate-y-1 data-[side=top]:data-starting-style:translate-y-1 data-[side=left]:data-starting-style:translate-x-1 data-[side=right]:data-starting-style:-translate-x-1 data-[side=inline-start]:data-starting-style:translate-x-1 data-[side=inline-end]:data-starting-style:-translate-x-1 data-[side=bottom]:data-ending-style:-translate-y-1 data-[side=top]:data-ending-style:translate-y-1 data-[side=left]:data-ending-style:translate-x-1 data-[side=right]:data-ending-style:-translate-x-1 data-[side=inline-start]:data-ending-style:translate-x-1 data-[side=inline-end]:data-ending-style:-translate-x-1",
            className
          )}
          {...props}
        />
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  )
}

export { HoverCard, HoverCardTrigger, HoverCardContent }
