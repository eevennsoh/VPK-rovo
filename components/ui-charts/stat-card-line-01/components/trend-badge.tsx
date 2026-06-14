"use client";

import ArrowDownIcon from "@atlaskit/icon/core/arrow-down";
import ArrowUpIcon from "@atlaskit/icon/core/arrow-up";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function TrendBadge({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const positive = value >= 0;
  const Icon = positive ? ArrowUpIcon : ArrowDownIcon;

  return (
    <Badge
      className={cn(
        positive &&
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        className
      )}
      variant={positive ? "neutral" : "danger"}
    >
      <Icon color="currentColor" label="" size="small" data-icon="inline-start" />
      {positive ? "+" : ""}
      {value.toFixed(1)}%
    </Badge>
  );
}
