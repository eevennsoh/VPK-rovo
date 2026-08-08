"use client";

import { useState } from "react";

import type { JiraActivityEventEntry } from "@/components/blocks/jira-activity";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs";

import { resolvePullRequestDetailData } from "../../lib/pull-request-detail-data";
import { PullRequestDetailHeader } from "./pull-request-detail-header";
import { PullRequestFiles } from "./pull-request-files";
import { PullRequestGuide } from "./pull-request-guide";
import { PullRequestOverview } from "./pull-request-overview";

type PullRequestDetailTab = "details" | "code" | "guide";

interface PullRequestDetailViewProps {
	entry: JiraActivityEventEntry;
	onBack: () => void;
}

export function PullRequestDetailView({
	entry,
	onBack,
}: Readonly<PullRequestDetailViewProps>) {
	const [activeTab, setActiveTab] = useState<PullRequestDetailTab>("details");
	const data = resolvePullRequestDetailData(entry);

	if (!data) {
		return (
			<div
				className="grid min-h-48 place-items-center p-6 text-sm text-text-subtle"
				data-jira-work-item-pull-request-detail
			>
				Pull request details are unavailable.
			</div>
		);
	}

	const review = data.guidedReview;
	return (
		<section
			aria-label={`Pull request #${data.number}: ${data.title}`}
			className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-surface"
			data-jira-work-item-pull-request-detail
		>
			<PullRequestDetailHeader data={data} onBack={onBack} />
			{review ? (
				<Tabs
					className="min-h-0 flex-1"
					onValueChange={(value) => setActiveTab(value as PullRequestDetailTab)}
					value={activeTab}
				>
					<div className="shrink-0 px-4 sm:px-6">
						<TabsList aria-label="Pull request details" className="w-full justify-start" variant="line">
							<TabsTrigger value="details">Overview</TabsTrigger>
							<TabsTrigger value="code">Files {review.files.length}</TabsTrigger>
							<TabsTrigger value="guide">Guide</TabsTrigger>
						</TabsList>
					</div>
					<div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
						<TabsContent value="details">
							<PullRequestOverview data={data} />
						</TabsContent>
						<TabsContent value="code">
							<PullRequestFiles review={review} />
						</TabsContent>
						<TabsContent value="guide">
							<PullRequestGuide review={review} onFinish={() => setActiveTab("details")} />
						</TabsContent>
					</div>
				</Tabs>
			) : (
				<div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
					<PullRequestOverview data={data} />
				</div>
			)}
		</section>
	);
}
