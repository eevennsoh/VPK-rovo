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
		<div
			className="@container flex min-w-0 flex-col gap-4 overflow-x-hidden"
			data-testid="jira-for-you-header"
		>
			<div
				className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 @max-[28rem]:flex-col @max-[28rem]:items-stretch @max-[28rem]:justify-start @max-[28rem]:gap-y-4"
				data-testid="jira-for-you-heading-tabs-row"
			>
				<h2 className="shrink-0 text-text" style={{ font: token("font.heading.small") }}>
					For you
				</h2>
				<Tabs
					className="min-w-0 max-w-full flex-none @max-[28rem]:w-full"
					onValueChange={(value) => onTabChange(String(value))}
					value={activeTabId}
				>
					<TabsList className="h-auto w-max max-w-full flex-nowrap justify-start overflow-x-auto @max-[28rem]:w-full">
						{tabs.map((tab) => (
							<TabsTrigger
								className="shrink-0 flex-none @max-[28rem]:min-w-0 @max-[28rem]:flex-[1_1_auto] @max-[28rem]:overflow-hidden"
								key={tab.id}
								value={tab.id}
							>
								<span className="min-w-min truncate">{tab.label}</span>
								{typeof tab.count === "number" ? <Badge>{tab.count}</Badge> : null}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>
			</div>
			<InputGroup className="min-w-0">
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
