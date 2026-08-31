"use client";

import { useCallback, useState } from "react";

import { AGENT_SESSION_ITEMS, type AgentSessionItem } from "@/components/blocks/agent-session";
import { Button } from "@/components/ui/button";

import { AgentSessionColumn } from "./index";

const CLAUDE_AGENT = {
	brandName: "claude",
	id: "claude",
	kind: "agent",
	name: "Claude",
} as const;

/**
 * Work the next sync will discover, in the batches it arrives in.
 *
 * Two batches rather than one flat list, because the two sizes demonstrate
 * different halves of the design: the first shows arrivals stepping in one
 * after another, the second shows a single arrival landing on its own.
 */
const ARRIVAL_BATCHES: readonly (readonly AgentSessionItem[])[] = [
	[
		{
			id: "lw-sync-webhook-gap",
			title: "Challenge webhook gap note never made it out of the session",
			state: "needs-input",
			agent: CLAUDE_AGENT,
			host: "local",
			machineName: "Venn’s MacBook",
			timeLabel: "just now",
			sessionDetails: {
				host: "local",
				issueKey: "PAY-107",
				issueSummary: "Challenge webhook gap note never made it out of the session",
				worktreePath: ".worktrees/pay-107-webhook-gap",
			},
		},
		{
			id: "lw-sync-sandbox-root-cause",
			title: "Root cause of the sandbox 401 is still only in a local thread",
			state: "running",
			agent: CLAUDE_AGENT,
			host: "local",
			machineName: "Venn’s MacBook",
			timeLabel: "just now",
			sessionDetails: {
				host: "local",
				issueKey: "PAY-112",
				issueSummary: "Root cause of the sandbox 401 is still only in a local thread",
				worktreePath: ".worktrees/pay-112-sandbox-401",
			},
		},
	],
	[
		{
			id: "lw-sync-replay-blast-radius",
			title: "Replay-risk blast radius still lives in an unsaved session",
			state: "attention",
			agent: CLAUDE_AGENT,
			host: "local",
			machineName: "Venn’s MacBook",
			timeLabel: "just now",
			sessionDetails: {
				host: "local",
				issueKey: "PAY-118",
				issueSummary: "Replay-risk blast radius still lives in an unsaved session",
				worktreePath: ".worktrees/pay-118-replay-risk",
			},
		},
	],
];

export default function AgentSessionColumnPage() {
	const [capturedIds, setCapturedIds] = useState<ReadonlySet<string>>(() => new Set());
	const [items, setItems] = useState<readonly AgentSessionItem[]>(AGENT_SESSION_ITEMS);
	const [newIds, setNewIds] = useState<ReadonlySet<string>>(() => new Set());
	const [syncedBatches, setSyncedBatches] = useState(0);

	const handleCapture = useCallback((item: AgentSessionItem) => {
		setCapturedIds((current) => new Set(current).add(item.id));
	}, []);

	// Arrivals land at the top, under the header, because that is where sync sits
	// and where the entrance animation starts from.
	const handleSync = useCallback(() => {
		const batch = ARRIVAL_BATCHES[syncedBatches];
		if (batch === undefined) {
			return;
		}

		setItems((currentItems) => [...batch, ...currentItems]);
		setNewIds((currentNew) => {
			const next = new Set(currentNew);
			for (const item of batch) {
				next.add(item.id);
			}
			return next;
		});
		setSyncedBatches(syncedBatches + 1);
	}, [syncedBatches]);

	// Stands in for the watermark advancing. In the board this fires when the
	// viewer expands the column; here it is explicit so both forms can be watched
	// decaying at once.
	const handleMarkReviewed = useCallback(() => {
		setNewIds(new Set());
	}, []);

	const handleReset = useCallback(() => {
		setItems(AGENT_SESSION_ITEMS);
		setNewIds(new Set());
		setCapturedIds(new Set());
		setSyncedBatches(0);
	}, []);

	const hasArrivals = newIds.size > 0;
	const canSync = syncedBatches < ARRIVAL_BATCHES.length;

	return (
		<div className="flex h-full min-h-[560px] w-full flex-col gap-4 bg-surface p-6">
			<div className="flex shrink-0 flex-wrap items-center gap-2">
				<Button disabled={!canSync} onClick={handleSync} size="compact" variant="default">
					{canSync ? "Sync new work" : "Nothing left to sync"}
				</Button>
				<Button
					disabled={!hasArrivals}
					onClick={handleMarkReviewed}
					size="compact"
					variant="outline"
				>
					Mark reviewed
				</Button>
				<Button onClick={handleReset} size="compact" variant="ghost">
					Reset
				</Button>
				<p className="text-xs text-text-subtlest">
					Sync prepends untracked work to both columns at once: the cards step in
					from above and hold a discovery-toned dash, while each new notch grows
					from its centre and pushes the ones below it down, then stays lit —
					exactly the state a reviewed notch reaches on hover. Mark reviewed
					decays both, which is what the watermark does when the column is
					expanded.
				</p>
			</div>

			<div className="flex min-h-0 flex-1 justify-center gap-4">
				<AgentSessionColumn
					capturedItemIds={capturedIds}
					items={items}
					newItemIds={newIds}
					onCreateWorkItem={handleCapture}
					onLinkWorkItem={handleCapture}
				/>
				{/* The collapsed form, so the notch rail and its session flyout are
				    reachable in the catalog without hunting for the hover control. */}
				<AgentSessionColumn
					capturedItemIds={capturedIds}
					defaultCollapsed
					items={items}
					newItemIds={newIds}
					onCreateWorkItem={handleCapture}
					onLinkWorkItem={handleCapture}
				/>
			</div>
		</div>
	);
}
