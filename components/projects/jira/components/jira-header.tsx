"use client";

import Heading from "@/components/ui/heading";
import { token } from "@/lib/tokens";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DEFAULT_JIRA_WORK_ITEM_VIEW, type JiraWorkItemView } from "../data/tabs";
import { useJiraTabs } from "../hooks/use-jira-tabs";
import { resolveJiraTab } from "../lib/jira-tab-model";
import ExpandHorizontalIcon from "@atlaskit/icon/core/expand-horizontal";
import ShareIcon from "@atlaskit/icon/core/share";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import TeamsIcon from "@atlaskit/icon/core/teams";

interface JiraViewTabsProps {
	/**
	 * Selection is tracked by label, not index: the design variation decides
	 * whether work items is one tab or two, so an index would silently point at
	 * a different destination after a flip.
	 */
	selectedTabLabel: string;
	onTabChange: (tabLabel: string) => void;
	/**
	 * Current board/list choice. Only consulted when the selected label is absent
	 * from this variation's tabs, so the reader keeps their view across a flip.
	 */
	workItemView?: JiraWorkItemView;
	/**
	 * Work item surfaces this route renders. A board-only route omits `list` so
	 * Team EU shows `Board` instead of splitting into a `List` tab it cannot fill.
	 */
	supportedWorkItemViews?: readonly JiraWorkItemView[];
}

export function JiraViewTabs({
	selectedTabLabel,
	onTabChange,
	workItemView = DEFAULT_JIRA_WORK_ITEM_VIEW,
	supportedWorkItemViews,
}: Readonly<JiraViewTabsProps>) {
	const tabs = useJiraTabs(supportedWorkItemViews);
	const activeTab = resolveJiraTab(tabs, selectedTabLabel, workItemView);

	return (
		<Tabs value={activeTab?.label} onValueChange={onTabChange}>
			<TabsList variant="line" className="w-full justify-start">
				{tabs.map((tab, index) => {
					const IconComponent = tab.icon;
					const isFirst = index === 0;
					const isSelected = activeTab?.label === tab.label;

					return (
						<TabsTrigger
							key={tab.label}
							value={tab.label}
							className={isFirst ? "ml-4 flex-none" : "flex-none"}
						>
							<div className="flex items-center gap-1.5">
								<IconComponent
									label=""
									color={isSelected ? token("color.icon.selected") : "currentColor"}
								/>
								<span className={`text-sm font-medium${isSelected ? " text-text-selected" : ""}`}>
									{tab.label}
								</span>
							</div>
						</TabsTrigger>
					);
				})}
			</TabsList>
			{tabs.map((tab) => (
				<TabsContent key={tab.label} value={tab.label}>
					{tab.hasContent ? (
						<div />
					) : (
						<div style={{ padding: token("space.400") }}>
							<span className="text-sm font-medium text-text-subtlest">
								No RFP content here yet
							</span>
						</div>
					)}
				</TabsContent>
			))}
		</Tabs>
	);
}

export default function JiraHeader({
	selectedTabLabel,
	onTabChange,
	workItemView,
	supportedWorkItemViews,
}: Readonly<JiraViewTabsProps>) {
	return (
		<div className="pt-4">
			<div className="flex flex-col gap-1">
				{/* Top row: Spaces label and heading with buttons */}
				<div
					className="flex justify-between items-center gap-2"
				>
					<div className="px-4">
						<div className="flex flex-col gap-0.5">
							<span className="text-sm text-text-subtle font-medium">
								Spaces
							</span>
							<div className="flex items-center gap-2">
								<Avatar shape="square" size="xs">
									<AvatarImage src="/avatar-project/rocket.svg" alt="" />
									<AvatarFallback>ER</AvatarFallback>
								</Avatar>
								<Heading size="medium">Enterprise RFP Response</Heading>
								<Button aria-label="Teams" size="icon-compact" variant="ghost">
									<TeamsIcon label="" size="small" />
								</Button>
								<Button aria-label="More options" size="icon-compact" variant="ghost">
									<ShowMoreHorizontalIcon label="" size="small" />
								</Button>
							</div>
						</div>
					</div>

					<div className="px-4">
						<div className="flex gap-2">
							<Button aria-label="Share" size="icon" variant="ghost">
								<ShareIcon label="" />
							</Button>
							<Button aria-label="Expand" size="icon" variant="ghost">
								<ExpandHorizontalIcon label="" />
							</Button>
						</div>
					</div>
				</div>

				{/* Tabs */}
				<div>
					<JiraViewTabs
						selectedTabLabel={selectedTabLabel}
						onTabChange={onTabChange}
						supportedWorkItemViews={supportedWorkItemViews}
						workItemView={workItemView}
					/>
				</div>
			</div>
		</div>
	);
}
