"use client";

import { useState } from "react";

import { PullRequest } from "@/components/blocks/pull-request/components/pull-request";
import type { PullRequestVariant } from "@/components/blocks/pull-request/components/pull-request-types";
import { DEMO_PULL_REQUESTS } from "@/components/blocks/pull-request/data/demo-pull-requests";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function PullRequestPage() {
	const [variant, setVariant] = useState<PullRequestVariant>("compact");
	const [selectedNumber, setSelectedNumber] = useState<number | null>(
		DEMO_PULL_REQUESTS[0]?.number ?? null,
	);

	return (
		<div className="flex h-full min-h-[360px] w-full items-center justify-center bg-surface p-6 text-text">
			<div className="flex w-full max-w-xl flex-col gap-3">
				<ToggleGroup
					aria-label="Pull request card density"
					onValueChange={(values) => {
						const nextVariant = values[0] as PullRequestVariant | undefined;
						if (nextVariant) {
							setVariant(nextVariant);
						}
					}}
					value={[variant]}
					variant="outline"
				>
					<ToggleGroupItem value="compact">Compact</ToggleGroupItem>
					<ToggleGroupItem value="spacious">Spacious</ToggleGroupItem>
				</ToggleGroup>
				{DEMO_PULL_REQUESTS.map((item) => (
					<PullRequest
						key={item.number}
						{...item}
						variant={variant}
						selected={item.number === selectedNumber}
						onActivate={() =>
							setSelectedNumber((current) => (
								current === item.number ? null : item.number
							))
						}
					/>
				))}
			</div>
		</div>
	);
}

export { PullRequest } from "@/components/blocks/pull-request/components/pull-request";
export type {
	PullRequestAuthor,
	PullRequestProps,
	PullRequestStatus,
	PullRequestVariant,
} from "@/components/blocks/pull-request/components/pull-request-types";
