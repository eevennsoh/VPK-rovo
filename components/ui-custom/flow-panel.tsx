import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";
import { Panel as PanelPrimitive } from "@xyflow/react";

type FlowPanelProps = ComponentProps<typeof PanelPrimitive>;

export const FlowPanel = ({ className, ...props }: FlowPanelProps) => (
  <PanelPrimitive
    className={cn(
      "m-4 overflow-hidden rounded-md border bg-card p-1",
      className
    )}
    {...props}
  />
);
