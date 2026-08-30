import type { ComponentDetail } from "@/app/data/component-detail-types";

export const TOOLTIP_DETAIL: ComponentDetail = {
    description:
      "A floating tooltip built on Base UI. Opens immediately on hover or focus (delay 0), then plays a fade plus 8px slide from the side. Pass delay to wait before opening; pass animate={false} to skip motion.",
    adsUrl: "https://atlassian.design/components/tooltip",
    usage: `import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

<TooltipProvider delay={0}>
  <Tooltip>
    <TooltipTrigger><Button>Hover me</Button></TooltipTrigger>
    <TooltipContent>Tooltip text</TooltipContent>
  </Tooltip>
</TooltipProvider>`,
    props: [
      {
        name: "animate",
        type: "boolean",
        default: "true",
        description:
          "Play the enter/exit fade and 8px slide. Default on. Set false on Tooltip (or TooltipContent) to appear and dismiss instantly.",
      },
      {
        name: "delay",
        type: "number",
        default: "0",
        description:
          "Milliseconds to wait before showing on hover (TooltipProvider). Default 0 — the tooltip starts entering immediately. Callers that need a pause can pass a larger delay.",
      },
      {
        name: "side",
        type: '"top" | "bottom" | "left" | "right"',
        description: "Placement side.",
      },
      {
        name: "sideOffset",
        type: "number",
        description: "Offset from trigger.",
      },
    ],
    subComponents: [
      {
        name: "TooltipProvider",
        description: "Context provider for tooltip configuration.",
      },
      {
        name: "TooltipTrigger",
        description: "Element that triggers the tooltip.",
      },
      { name: "TooltipContent", description: "Floating tooltip content." },
    ],
    examples: [
      {
        title: "Default",
        description:
          "Opens immediately (no hover delay) with the default fade and 8px slide.",
        demoSlug: "tooltip-demo-default",
      },
      {
        title: "Without animation",
        description: "Same tooltip with animate={false} — no fade or slide.",
        demoSlug: "tooltip-demo-without-animation",
      },
      {
        title: "Side",
        description: "Right-side placement.",
        demoSlug: "tooltip-demo-side",
      },
      {
        title: "Icon button",
        description: "Tooltip on an icon-only button.",
        demoSlug: "tooltip-demo-icon-button",
      },
      { title: "Basic", demoSlug: "tooltip-demo-basic" },
      {
        title: "Disabled",
        description: "Tooltip on a disabled element.",
        demoSlug: "tooltip-demo-disabled",
      },
      {
        title: "Formatted content",
        description: "Tooltip with rich formatted content.",
        demoSlug: "tooltip-demo-formatted-content",
      },
      {
        title: "Long content",
        description: "Tooltip with long text content.",
        demoSlug: "tooltip-demo-long-content",
      },
      {
        title: "On link",
        description: "Tooltip on a text link.",
        demoSlug: "tooltip-demo-on-link",
      },
      {
        title: "Sides",
        description: "Tooltips on all four sides.",
        demoSlug: "tooltip-demo-sides",
      },
      {
        title: "With icon",
        description: "Tooltip triggered by an icon.",
        demoSlug: "tooltip-demo-with-icon",
      },
      {
        title: "With keyboard shortcut",
        description: "Tooltip showing a keyboard shortcut.",
        demoSlug: "tooltip-demo-with-keyboard-shortcut",
      },
    ],
  };
