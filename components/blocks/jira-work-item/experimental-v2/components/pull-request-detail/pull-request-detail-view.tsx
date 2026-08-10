"use client";

import { useState, type RefObject } from "react";

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
	scrollContainerRef: RefObject<HTMLElement | null>;
}

export function PullRequestDetailView({
	entry,
	scrollContainerRef,
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
	const header = (
		<PullRequestDetailHeader
			data={data}
			scrollContainerRef={scrollContainerRef}
		/>
	);

	return (
		<section
			aria-label={`Pull request #${data.number}: ${data.title}`}
			className="flex min-h-0 min-w-0 flex-1 flex-col"
			data-jira-work-item-pull-request-detail
		>
			{review ? (
				<Tabs
					className="flex min-h-0 flex-1 flex-col"
					onValueChange={(value) => setActiveTab(value as PullRequestDetailTab)}
					value={activeTab}
				>
					{/*
					 * Sticky stack inside the body-only left-column scrollport;
					 * header + tabs stay anchored together below ContextResources.
					 */}
					<div className="sticky top-0 z-10 flex shrink-0 flex-col gap-4 bg-surface">
						{header}
						<div className="shrink-0">
							<TabsList aria-label="Pull request details" className="w-full justify-start" variant="line">
								<TabsTrigger value="details">Overview</TabsTrigger>
								<TabsTrigger value="code">
									<span>{review.files.length} Files</span>
									<span className="inline-flex items-center gap-1 tabular-nums">
										<span className="text-text-success">+{data.additions}</span>
										<span className="text-text-danger">-{data.deletions}</span>
									</span>
								</TabsTrigger>
								<TabsTrigger value="guide">Guide</TabsTrigger>
							</TabsList>
						</div>
					</div>
					<div className="min-h-0 flex-1 py-5">
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
				<>
					<div className="sticky top-0 z-10 shrink-0 bg-surface">
						{header}
					</div>
					<div className="min-h-0 flex-1 py-5">
						<PullRequestOverview data={data} />
					</div>
				</>
			)}
		</section>
	);
}
