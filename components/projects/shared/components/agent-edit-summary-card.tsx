"use client";

import { memo, useState } from "react";

import AutomationIcon from "@atlaskit/icon/core/automation";
import EditIcon from "@atlaskit/icon/core/edit";

import {
	GenerativeCard,
	GenerativeCardBody,
	GenerativeCardContent,
	GenerativeCardFooter,
	GenerativeCardHeader,
} from "@/components/blocks/generative-card";
import { Button } from "@/components/ui/button";
import { Tile } from "@/components/ui/tile";
import type { AgentEditSummaryPayload } from "@/components/projects/shared/lib/agent-edit-summary";

/**
 * Collapsed-by-default card the Ask Rovo sidebar shows after a deterministic
 * agent-config edit. The header carries a one-line summary while collapsed;
 * expanding reveals the per-field change rows. Replaces the previous plain
 * "Done — I added …" text reply so each edit reads as a reviewable change.
 *
 * The leading glyph mirrors the config's Flows/trigger row: a 32px automation
 * tile (lime), matching `AgentTriggerSummaryRow`'s automation icon. When `onOpen`
 * is supplied the collapsed header shows an edit icon button — sitting to the left
 * of the expand chevron — and the expanded footer shows the full edit button.
 */
function AgentEditSummaryCardComponent({
	payload,
	onOpen,
}: Readonly<{ payload: AgentEditSummaryPayload; onOpen?: () => void }>) {
	const [isExpanded, setExpanded] = useState(false);

	return (
		<GenerativeCard className="w-full" expanded={isExpanded} onExpandedChange={setExpanded} size="sm">
			<GenerativeCardHeader
				collapseLabel="Hide change details"
				description={payload.summary}
				expandLabel="Show change details"
				action={!isExpanded && onOpen ? (
						<Button
							variant="ghost"
							size="icon"
							className="text-icon-subtle"
							onClick={onOpen}
							type="button"
							aria-label="Edit automation"
						>
							<EditIcon label="" size="small" />
						</Button>
					) : null}
				leading={
					<Tile label="Automation" size="medium" variant="limeSubtle">
						<AutomationIcon label="" color="currentColor" />
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
				{onOpen ? (
					<GenerativeCardFooter>
						<Button type="button" variant="outline" onClick={onOpen}>
							Edit
						</Button>
					</GenerativeCardFooter>
				) : null}
			</GenerativeCardBody>
		</GenerativeCard>
	);
}

export const AgentEditSummaryCard = memo(AgentEditSummaryCardComponent);
