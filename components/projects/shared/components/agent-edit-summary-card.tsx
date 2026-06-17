"use client";

import { memo } from "react";

import EditIcon from "@atlaskit/icon/core/edit";

import {
	GenerativeCard,
	GenerativeCardBody,
	GenerativeCardContent,
	GenerativeCardHeader,
} from "@/components/blocks/generative-card";
import { Tile } from "@/components/ui/tile";
import type { AgentEditSummaryPayload } from "@/components/projects/shared/lib/agent-edit-summary";

/**
 * Collapsed-by-default card the Ask Rovo sidebar shows after a deterministic
 * agent-config edit. The header carries a one-line summary while collapsed;
 * expanding reveals the per-field change rows. Replaces the previous plain
 * "Done — I added …" text reply so each edit reads as a reviewable change.
 */
function AgentEditSummaryCardComponent({
	payload,
}: Readonly<{ payload: AgentEditSummaryPayload }>) {
	return (
		<GenerativeCard className="w-full" defaultExpanded={false} size="sm">
			<GenerativeCardHeader
				collapseLabel="Hide change details"
				description={payload.summary}
				expandLabel="Show change details"
				leading={
					<Tile label="Edit" size="small" variant="discovery">
						<EditIcon label="" color="currentColor" />
					</Tile>
				}
				title={payload.headline}
			/>
			<GenerativeCardBody>
				<GenerativeCardContent>
					<dl className="flex flex-col gap-2">
						{payload.changes.map((change) => (
							<div
								className="flex items-start justify-between gap-3 text-sm leading-5"
								key={`${change.label}:${change.value}`}
							>
								<dt className="shrink-0 text-text-subtle">{change.label}</dt>
								<dd className="min-w-0 text-right font-medium text-text">{change.value}</dd>
							</div>
						))}
					</dl>
				</GenerativeCardContent>
			</GenerativeCardBody>
		</GenerativeCard>
	);
}

export const AgentEditSummaryCard = memo(AgentEditSummaryCardComponent);
