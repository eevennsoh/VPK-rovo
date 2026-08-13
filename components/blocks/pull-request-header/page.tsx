"use client";

import { useRef, useState } from "react";

import { PullRequestHeader } from "@/components/blocks/pull-request-header/components/pull-request-header";
import type {
	PullRequestHeaderProps,
	PullRequestHeaderVariant,
} from "@/components/blocks/pull-request-header/components/pull-request-header-types";
import { DEMO_PULL_REQUEST_HEADER } from "@/components/blocks/pull-request-header/data/demo-pull-request-header";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { token } from "@/lib/tokens";

function DemoPullRequestTabs() {
	return (
		<TabsList
			aria-label="Pull request details"
			className="w-full justify-start"
			variant="line"
		>
			<TabsTrigger value="details">Overview</TabsTrigger>
			<TabsTrigger value="guide">Guide</TabsTrigger>
			<TabsTrigger value="code">
				<span>4 Files</span>
				<span className="inline-flex items-center gap-1 tabular-nums">
					<span className="text-text-success">+86</span>
					<span className="text-text-danger">-21</span>
				</span>
			</TabsTrigger>
		</TabsList>
	);
}

function DemoPullRequestHeader(props: Readonly<PullRequestHeaderProps>) {
	return (
		<Tabs defaultValue="details">
			<PullRequestHeader
				{...props}
				tabNavigation={<DemoPullRequestTabs />}
			/>
		</Tabs>
	);
}

export default function PullRequestHeaderPage() {
	const [variant, setVariant] =
		useState<PullRequestHeaderVariant>("expanded");
	const [autoMerge, setAutoMerge] = useState(true);
	const scrollContainerRef = useRef<HTMLDivElement | null>(null);

	return (
		<div className="h-full min-h-[360px] w-full overflow-y-auto bg-surface p-6 text-text">
			<div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
				<section className="flex flex-col gap-3">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<h2 style={{ font: token("font.heading.small") }}>Merge</h2>
						<ToggleGroup
							aria-label="Pull request header variant"
							onValueChange={(values) => {
								const nextVariant = values[0] as
									| PullRequestHeaderVariant
									| undefined;
								if (nextVariant) {
									setVariant(nextVariant);
								}
							}}
							value={[variant]}
							variant="outline"
						>
							<ToggleGroupItem value="expanded">Expanded</ToggleGroupItem>
							<ToggleGroupItem value="compact">Compact</ToggleGroupItem>
						</ToggleGroup>
					</div>
					<DemoPullRequestHeader
						{...DEMO_PULL_REQUEST_HEADER}
						autoMerge={autoMerge}
						className="rounded-xl border"
						mergeState="ready"
						onAutoMergeChange={setAutoMerge}
						onClosePullRequestClick={() => undefined}
						onConvertToDraftClick={() => undefined}
						onMergeClick={() => undefined}
						variant={variant}
					/>
				</section>

				<section className="flex flex-col gap-3">
					<h2 style={{ font: token("font.heading.small") }}>
						Checks running
					</h2>
					<DemoPullRequestHeader
						{...DEMO_PULL_REQUEST_HEADER}
						autoMerge={autoMerge}
						className="rounded-xl border"
						mergeState="checks-running"
						onAutoMergeChange={setAutoMerge}
						onChecksRunningClick={() => undefined}
						onClosePullRequestClick={() => undefined}
						onConvertToDraftClick={() => undefined}
						variant="expanded"
					/>
				</section>

				<section className="flex flex-col gap-3">
					<h2 style={{ font: token("font.heading.small") }}>
						Merge conflicts
					</h2>
					<DemoPullRequestHeader
						{...DEMO_PULL_REQUEST_HEADER}
						autoMerge={autoMerge}
						className="rounded-xl border"
						mergeState="merge-conflicts"
						onAutoMergeChange={setAutoMerge}
						onClosePullRequestClick={() => undefined}
						onConvertToDraftClick={() => undefined}
						onMergeConflictsClick={() => undefined}
						variant="expanded"
					/>
				</section>

				<section className="flex flex-col gap-3">
					<h2 style={{ font: token("font.heading.small") }}>
						Scroll-driven variant
					</h2>
					<div className="flex flex-col gap-3">
						<DemoPullRequestHeader
							{...DEMO_PULL_REQUEST_HEADER}
							autoMerge={autoMerge}
							className="rounded-xl border"
							mergeState="ready"
							onAutoMergeChange={setAutoMerge}
							onClosePullRequestClick={() => undefined}
							onConvertToDraftClick={() => undefined}
							onMergeClick={() => undefined}
							scrollContainerRef={scrollContainerRef}
						/>
						<div
							aria-label="Pull request review context"
							className="h-40 space-y-3 overflow-y-auto rounded-md border border-border p-4 text-sm text-text-subtle"
							ref={scrollContainerRef}
							role="region"
							tabIndex={0}
						>
							{Array.from({ length: 8 }, (_, index) => (
								<p key={index}>
									Review context {index + 1}: storefront checkout changes and
									implementation notes.
								</p>
							))}
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}

export { PullRequestHeader } from "@/components/blocks/pull-request-header/components/pull-request-header";
export type {
	PullRequestHeaderMergeMethod,
	PullRequestHeaderMergeState,
	PullRequestHeaderProps,
	PullRequestHeaderStatus,
	PullRequestHeaderSubmitReviewAction,
	PullRequestHeaderVariant,
} from "@/components/blocks/pull-request-header/components/pull-request-header-types";
