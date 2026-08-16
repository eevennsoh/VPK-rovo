"use client";

import StatusErrorIcon from "@atlaskit/icon/core/status-error";

import {
	ComposerContextChip,
	type ComposerContextChipItem,
} from "@/components/ui-custom/composer-context-chip";

export interface FailingChecksComposerChipItem {
	id: string;
	name: string;
	details: string;
}

interface FailingChecksComposerChipProps {
	checks: readonly FailingChecksComposerChipItem[];
	onRemoveAll: () => void;
}

function toChipItems(checks: readonly FailingChecksComposerChipItem[]): ComposerContextChipItem[] {
	return checks.map((check) => ({
		id: check.id,
		title: check.name,
		subtitle: "PR check",
		body: check.details,
	}));
}

/**
 * One-turn composer context pill for failing CI checks staged from Fix / Fix all.
 * Mirrors `CommentsComposerChip` chrome with a failing-check count label.
 */
export function FailingChecksComposerChip({
	checks,
	onRemoveAll,
}: Readonly<FailingChecksComposerChipProps>) {
	const countLabel = `${checks.length} ${checks.length === 1 ? "failing check" : "failing checks"}`;

	return (
		<ComposerContextChip
			countLabel={countLabel}
			icon={
				<span className="text-icon-danger">
					<StatusErrorIcon color="currentColor" label="" size="small" />
				</span>
			}
			items={toChipItems(checks)}
			onRemoveAll={onRemoveAll}
			removeAllLabel="Remove all failing checks"
			testId="failing-checks-chip"
			triggerLabel={`Fix ${countLabel}`}
		/>
	);
}
