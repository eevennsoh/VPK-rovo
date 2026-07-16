"use client";

import SearchIcon from "@atlaskit/icon/core/search";

import { Badge } from "@/components/ui/badge";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { token } from "@/lib/tokens";

import type { JiraForYouTab } from "./jira-for-you-types";

export function JiraForYouHeader({
	activeTabId,
	onQueryChange,
	onTabChange,
	query,
	tabs,
}: Readonly<{
	activeTabId: string;
	onQueryChange: (query: string) => void;
	onTabChange: (tabId: string) => void;
	query: string;
	tabs: readonly JiraForYouTab[];
}>) {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between gap-4">
				<h2 className="text-text" style={{ font: token("font.heading.large") }}>
					For you
				</h2>
				<Tabs onValueChange={(value) => onTabChange(String(value))} value={activeTabId}>
					<TabsList>
						{tabs.map((tab) => (
							<TabsTrigger key={tab.id} value={tab.id}>
								{tab.label}
								{typeof tab.count === "number" ? <Badge>{tab.count}</Badge> : null}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>
			</div>
			<InputGroup>
				<InputGroupAddon>
					<SearchIcon label="" />
				</InputGroupAddon>
				<InputGroupInput
					aria-label="Search work items"
					onChange={(event) => onQueryChange(event.currentTarget.value)}
					placeholder="Search"
					value={query}
				/>
			</InputGroup>
		</div>
	);
}
