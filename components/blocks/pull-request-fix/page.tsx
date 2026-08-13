"use client";

import { useState } from "react";

import { PullRequestFix } from "@/components/blocks/pull-request-fix/components/pull-request-fix";
import type {
	PullRequestFixSubmission,
	PullRequestFixVariant,
} from "@/components/blocks/pull-request-fix/components/pull-request-fix-types";
import { DEMO_PULL_REQUEST_FIX } from "@/components/blocks/pull-request-fix/data/demo-pull-request-fix";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { token } from "@/lib/tokens";

export default function PullRequestFixPage() {
	const [variant, setVariant] = useState<PullRequestFixVariant>("expanded");
	const [lastSubmission, setLastSubmission] =
		useState<PullRequestFixSubmission | null>(null);

	return (
		<div className="h-full min-h-[360px] w-full overflow-y-auto bg-surface p-6 text-text">
			<div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
				<section className="flex flex-col gap-3">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<h2 style={{ font: token("font.heading.small") }}>Fix</h2>
						<ToggleGroup
							aria-label="Pull request fix variant"
							onValueChange={(values) => {
								const nextVariant = values[0] as
									| PullRequestFixVariant
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
					<PullRequestFix
						{...DEMO_PULL_REQUEST_FIX}
						onClose={() => setVariant("compact")}
						onSubmit={setLastSubmission}
						onVariantChange={setVariant}
						variant={variant}
					/>
					<p aria-live="polite" className="text-sm text-text-subtle">
						{lastSubmission
							? `Submitted via “${lastSubmission.agentId}”${lastSubmission.body ? `: ${lastSubmission.body}` : " with no comment"}`
							: "No fix submitted yet."}
					</p>
				</section>

				<section className="flex flex-col gap-3">
					<h2 style={{ font: token("font.heading.small") }}>
						Transform on focus
					</h2>
					<p className="text-sm text-text-subtle">
						Uncontrolled. Starts as the compact prompt bar and grows into the
						fix card when the composer takes focus; the dismiss control
						collapses it again.
					</p>
					<PullRequestFix {...DEMO_PULL_REQUEST_FIX} />
				</section>

				<section className="flex flex-col gap-3">
					<h2 style={{ font: token("font.heading.small") }}>
						Without a check name
					</h2>
					<p className="text-sm text-text-subtle">
						Omit <code>checkName</code> and the lozenge drops out of the
						heading row.
					</p>
					<PullRequestFix
						defaultVariant="expanded"
						placeholder="write your instruction..."
					/>
				</section>

				<section className="flex flex-col gap-3">
					<h2 style={{ font: token("font.heading.small") }}>
						Compact, no auto-expand
					</h2>
					<p className="text-sm text-text-subtle">
						<code>expandOnFocus=&#123;false&#125;</code> keeps the bar compact so
						a host surface can own the transform.
					</p>
					<PullRequestFix
						{...DEMO_PULL_REQUEST_FIX}
						expandOnFocus={false}
					/>
				</section>
			</div>
		</div>
	);
}

export { PullRequestFix } from "@/components/blocks/pull-request-fix/components/pull-request-fix";
export type {
	PullRequestFixAgentId,
	PullRequestFixProps,
	PullRequestFixSubmission,
	PullRequestFixVariant,
} from "@/components/blocks/pull-request-fix/components/pull-request-fix-types";
