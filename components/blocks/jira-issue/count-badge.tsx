import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

export function JiraIssueCountBadge({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<Badge className="h-5 min-w-0 rounded-sm px-1.5 font-semibold text-text-subtle" max={false} variant="neutral">
			{children}
		</Badge>
	);
}
