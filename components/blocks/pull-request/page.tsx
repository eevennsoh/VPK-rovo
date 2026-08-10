"use client";

import { useState } from "react";

import { PullRequest } from "@/components/blocks/pull-request/components/pull-request";
import { DEMO_PULL_REQUESTS } from "@/components/blocks/pull-request/data/demo-pull-requests";

export default function PullRequestPage() {
	const [selectedNumber, setSelectedNumber] = useState<number | null>(
		DEMO_PULL_REQUESTS[0]?.number ?? null,
	);

	return (
		<div className="flex h-full min-h-[360px] w-full items-center justify-center bg-surface p-6 text-text">
			<div className="flex w-full max-w-xl flex-col gap-3">
				{DEMO_PULL_REQUESTS.map((item) => (
					<PullRequest
						key={item.number}
						{...item}
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
} from "@/components/blocks/pull-request/components/pull-request-types";
