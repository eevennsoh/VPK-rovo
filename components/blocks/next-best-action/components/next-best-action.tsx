"use client";

import { ArtifactList, type ArtifactListItem } from "@/components/ui-custom/artifact-list";

/**
 * A suggestion row. Structurally identical to an Artifact List row — this block
 * intentionally reuses that implementation rather than restating it — so the
 * only difference is what the fields mean:
 *
 * - `title` is the suggested action ("Create a Sprint triage agent")
 * - `source` is the suggestion kind ("Suggested agent")
 * - `owner` is the rationale ("Would cover 23 untriaged bugs")
 * - `rowActionLabel` is the verb for that row ("Create", "Enable", "Connect")
 */
export type NextBestActionItem = ArtifactListItem;

export interface NextBestActionProps
	extends Omit<
		React.ComponentProps<typeof ArtifactList>,
		"onOpen" | "openLabel" | "openOnRowClick"
	> {
	/** Fired when a row's hover/focus-revealed action button is activated. */
	onAct?: (item: NextBestActionItem) => void;
	/** Default action-button label. Defaults to "Create". Rows override it with `rowActionLabel`. */
	actionLabel?: string;
	/** Also fire `onAct` when the row body is clicked. */
	actOnRowClick?: boolean;
}

/**
 * Next Best Action — proactive suggestions (skills and agents worth creating,
 * automations worth enabling, integrations worth connecting, in-context work
 * nudges) rendered with the Artifact List row anatomy.
 *
 * This is a naming/semantics adapter, not a second row implementation. Layout,
 * tiles, metadata, PR bylines, hover/focus reveal, and accessibility all live in
 * `components/ui-custom/artifact-list` so fixes land once.
 */
export function NextBestAction({
	onAct,
	actionLabel = "Create",
	actOnRowClick = false,
	...props
}: Readonly<NextBestActionProps>) {
	return (
		<ArtifactList
			onOpen={onAct}
			openLabel={actionLabel}
			openOnRowClick={actOnRowClick}
			{...props}
		/>
	);
}
