import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

export function JiraIssueCountBadge({
	children,
	compact = false,
}: Readonly<{ children: ReactNode; compact?: boolean }>) {
	return compact ? (
		<span className="shrink-0 text-xs font-normal leading-4 text-text-subtlest">
			{children}
		</span>
	) : (
		<Badge className="h-5 min-w-0 rounded-sm px-1.5 font-semibold text-text-subtle" max={false} variant="neutral">
			{children}
		</Badge>
	);
}
