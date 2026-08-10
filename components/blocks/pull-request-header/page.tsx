"use client";

import { useRef, useState } from "react";

import { PullRequestHeader } from "@/components/blocks/pull-request-header/components/pull-request-header";
import type { PullRequestHeaderVariant } from "@/components/blocks/pull-request-header/components/pull-request-header-types";
import { DEMO_PULL_REQUEST_HEADER } from "@/components/blocks/pull-request-header/data/demo-pull-request-header";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { token } from "@/lib/tokens";

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
					<PullRequestHeader
						{...DEMO_PULL_REQUEST_HEADER}
						autoMerge={autoMerge}
						className="rounded-xl border p-4"
						mergeState="ready"
						onAutoMergeChange={setAutoMerge}
						onMergeClick={() => undefined}
						onMoreActionsClick={() => undefined}
						variant={variant}
					/>
				</section>

				<section className="flex flex-col gap-3">
					<h2 style={{ font: token("font.heading.small") }}>
						Checks running
					</h2>
					<PullRequestHeader
						{...DEMO_PULL_REQUEST_HEADER}
						autoMerge={autoMerge}
						className="rounded-xl border p-4"
						mergeState="checks-running"
						onAutoMergeChange={setAutoMerge}
						onChecksRunningClick={() => undefined}
						onMoreActionsClick={() => undefined}
						variant="expanded"
					/>
				</section>

				<section className="flex flex-col gap-3">
					<h2 style={{ font: token("font.heading.small") }}>
						Merge conflicts
					</h2>
					<PullRequestHeader
						{...DEMO_PULL_REQUEST_HEADER}
						autoMerge={autoMerge}
						className="rounded-xl border p-4"
						mergeState="merge-conflicts"
						onAutoMergeChange={setAutoMerge}
						onMoreActionsClick={() => undefined}
						variant="expanded"
					/>
				</section>

				<section className="flex flex-col gap-3">
					<h2 style={{ font: token("font.heading.small") }}>
						Scroll-driven variant
					</h2>
					<div className="overflow-hidden rounded-md border border-border">
						<PullRequestHeader
							{...DEMO_PULL_REQUEST_HEADER}
							autoMerge={autoMerge}
							className="p-4"
							mergeState="ready"
							onAutoMergeChange={setAutoMerge}
							onMergeClick={() => undefined}
							onMoreActionsClick={() => undefined}
							scrollContainerRef={scrollContainerRef}
						/>
						<div
							aria-label="Pull request review context"
							className="h-40 space-y-3 overflow-y-auto p-4 text-sm text-text-subtle"
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
	PullRequestHeaderMergeState,
	PullRequestHeaderProps,
	PullRequestHeaderStatus,
	PullRequestHeaderVariant,
} from "@/components/blocks/pull-request-header/components/pull-request-header-types";
