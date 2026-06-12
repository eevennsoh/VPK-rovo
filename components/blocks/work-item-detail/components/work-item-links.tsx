"use client";

// oxlint-disable react-doctor/prefer-module-scope-static-value -- These values are intentionally colocated with the component/demo contract for readability and token context.

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type LinkedItem } from "../types";
import LinkIcon from "@atlaskit/icon/core/link";
import AddIcon from "@atlaskit/icon/core/add";

interface WorkItemLinksProps {
	linkedItems: Readonly<LinkedItem[]>;
}

export function WorkItemLinks({ linkedItems }: WorkItemLinksProps) {
	const statusColors: Record<string, string> = {
		"To Do": "bg-bg-neutral text-text",
		"In Progress": "bg-bg-information text-text",
		"In Review": "bg-bg-warning text-text",
		Done: "bg-bg-success text-text",
		Closed: "bg-bg-neutral-bold text-text",
	};

	// Group items by type
	const groupedItems = linkedItems.reduce(
		(acc, item) => {
			const type = item.type;
			if (!acc[type]) acc[type] = [];
			acc[type].push(item);
			return acc;
		},
		{} as Record<string, LinkedItem[]>
	);

	return (
		<div className="space-y-6">
			{Object.entries(groupedItems).map(([type, items]) => (
				<div key={type}>
					<h3 className="text-sm font-semibold text-text mb-3 capitalize">{type}</h3>
					<div className="space-y-2">
						{items.map(item => (
							<div key={item.key} className="flex items-center justify-between p-3 rounded border border-border hover:bg-bg-neutral transition-colors">
								<div className="flex items-center gap-3 flex-1 min-w-0">
									<LinkIcon label="" size="small" />
									<div className="flex-1 min-w-0">
										<div className="font-medium text-text text-sm">{item.key}</div>
										<div className="text-xs text-text-subtle truncate">{item.title}</div>
									</div>
								</div>
								<Badge className={statusColors[item.status]}>{item.status}</Badge>
							</div>
						))}
					</div>
				</div>
			))}

			<div className="pt-4 border-t border-border">
				<Button variant="secondary" size="default">
					<AddIcon label="" size="small" />
					Link issue
				</Button>
			</div>
		</div>
	);
}
