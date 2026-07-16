import type { ComponentDetail } from "@/app/data/component-detail-types";

export const BUTTON_GROUP_DETAIL: ComponentDetail = {
    adsUrl: "https://atlassian.design/components/button/button-group",
    adsLinks: [
      {
        label: "{ SplitButton } from @atlaskit/button/new",
        url: "https://atlassian.design/components/button/split-button/",
      },
      {
        label: "{ ButtonGroup } from @atlaskit/button/new",
        url: "https://atlassian.design/components/button/button-group/",
      },
    ],
    description:
      'A group container for related buttons. Use variant="connected" (default) for toolbar-style merged borders, variant="split" for a primary action with a dropdown trigger, or variant="separated" for ADS-style spaced layout with 4px gaps.',
    usage: `import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";

<ButtonGroup>
  <Button variant="outline">Left</Button>
  <Button variant="outline">Center</Button>
  <Button variant="outline">Right</Button>
</ButtonGroup>

<ButtonGroup variant="separated">
  <Button>Save</Button>
  <Button variant="destructive">Delete</Button>
  <Button variant="ghost">Cancel</Button>
</ButtonGroup>

<ButtonGroup variant="split">
  <Button variant="outline">Link work item</Button>
  <DropdownMenu>
    <DropdownMenuTrigger render={<Button aria-label="More link actions" size="icon" variant="outline" />}>
      <ChevronDownIcon />
    </DropdownMenuTrigger>
  </DropdownMenu>
</ButtonGroup>`,
    props: [
      {
        name: "variant",
        type: '"connected" | "split" | "separated"',
        default: '"connected"',
        description:
          "Connected merges borders between children. Split also highlights the shared seam while its dropdown is open. Separated adds a 4px gap.",
      },
      {
        name: "orientation",
        type: '"horizontal" | "vertical"',
        default: '"horizontal"',
        description: "Layout direction.",
      },
    ],
    subComponents: [
      {
        name: "ButtonGroupText",
        description: "Inline text display with icon support.",
      },
      {
        name: "ButtonGroupSeparator",
        description: "Visual separator for connected button actions.",
      },
    ],
    examples: [
      {
        title: "Default",
        description: "Horizontal button group.",
        demoSlug: "button-group-demo-default",
      },
      {
        title: "Separated",
        description: "ADS-style separated buttons with gap.",
        demoSlug: "button-group-demo-separated",
      },
      {
        title: "Separated outline",
        description: "Separated outline buttons.",
        demoSlug: "button-group-demo-separated-outline",
      },
      {
        title: "Variants",
        description: "Connected vs separated side by side.",
        demoSlug: "button-group-demo-variants",
      },
      {
        title: "Vertical",
        description: "Vertical button group.",
        demoSlug: "button-group-demo-vertical",
      },
      {
        title: "Split action",
        description: "Outline and primary actions with a connected dropdown trigger.",
        demoSlug: "button-group-demo-with-separator",
      },
      { title: "Basic", demoSlug: "button-group-demo-basic" },
      {
        title: "Navigation",
        description: "Button group as navigation tabs.",
        demoSlug: "button-group-demo-navigation",
      },
      {
        title: "Nested",
        description: "Nested button groups.",
        demoSlug: "button-group-demo-nested",
      },
      {
        title: "Pagination split",
        description: "Connected button groups for pagination.",
        demoSlug: "button-group-demo-pagination-split",
      },
      {
        title: "Pagination",
        description: "Button group as pagination controls.",
        demoSlug: "button-group-demo-pagination",
      },
      {
        title: "Text alignment",
        description: "Button group with text alignment options.",
        demoSlug: "button-group-demo-text-alignment",
      },
      {
        title: "Vertical icons",
        description: "Vertical button group with icons.",
        demoSlug: "button-group-demo-vertical-icons",
      },
      {
        title: "Vertical nested",
        description: "Vertical nested button groups.",
        demoSlug: "button-group-demo-vertical-nested",
      },
      {
        title: "With dropdown",
        description: "Button group with dropdown menu.",
        demoSlug: "button-group-demo-with-dropdown",
      },
      {
        title: "With fields",
        description: "Button group with form fields.",
        demoSlug: "button-group-demo-with-fields",
      },
      {
        title: "With icons",
        description: "Button group with icon buttons.",
        demoSlug: "button-group-demo-with-icons",
      },
      {
        title: "With input group",
        description: "Button group with input group.",
        demoSlug: "button-group-demo-with-input-group",
      },
      {
        title: "With input",
        description: "Button group with input.",
        demoSlug: "button-group-demo-with-input",
      },
      {
        title: "With like",
        description: "Button group as like/reaction.",
        demoSlug: "button-group-demo-with-like",
      },
      {
        title: "With select and input",
        description: "Button group with select and input.",
        demoSlug: "button-group-demo-with-select-and-input",
      },
      {
        title: "With select",
        description: "Button group with select.",
        demoSlug: "button-group-demo-with-select",
      },
      {
        title: "With text",
        description: "Button group with text display.",
        demoSlug: "button-group-demo-with-text",
      },
    ],
  };
