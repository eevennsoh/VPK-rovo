"use client";

import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

import type { ChangedFile, CodeReviewCommit } from "../../data/types";
import { sumChangedFileDiffStats } from "../../lib/sum-changed-file-diff-stats";
import { DiffStats } from "../diff-stats";

type FixedChangesScope =
	| "all-changes"
	| "uncommitted"
	| "staged"
	| "unstaged"
	| "all-commits";
type ChangesScope = FixedChangesScope | `commit:${string}`;

const CHANGES_SCOPE_LABELS: Record<FixedChangesScope, string> = {
	"all-changes": "All changes",
	uncommitted: "Uncommitted",
	staged: "Staged",
	unstaged: "Unstaged",
	"all-commits": "All commits",
};

const EMPTY_COMMITS = [] as const satisfies readonly CodeReviewCommit[];

function isFixedChangesScope(scope: ChangesScope): scope is FixedChangesScope {
	return !scope.startsWith("commit:");
}

function resolveScopeLabel(
	scope: ChangesScope,
	commits: readonly CodeReviewCommit[],
): string {
	if (isFixedChangesScope(scope)) {
		return CHANGES_SCOPE_LABELS[scope];
	}
	const commitId = scope.slice("commit:".length);
	const commit = commits.find((entry) => entry.id === commitId);
	return commit?.shortSha ?? CHANGES_SCOPE_LABELS["all-commits"];
}

function ScopeMenuLabel({
	label,
	additions,
	deletions,
	emphasized,
}: Readonly<{
	label: string;
	additions?: number;
	deletions?: number;
	emphasized?: boolean;
}>) {
	const hasStats = additions !== undefined && deletions !== undefined
		&& (additions > 0 || deletions > 0);

	return (
		<span className="flex min-w-0 items-center gap-2">
			<span className="truncate">{label}</span>
			{hasStats ? (
				<DiffStats
					additions={additions}
					deletions={deletions}
					emphasized={emphasized}
				/>
			) : null}
		</span>
	);
}

interface EditorChangesPickerProps {
	files: readonly ChangedFile[];
	commits?: readonly CodeReviewCommit[];
	className?: string;
}

export function EditorChangesPicker({
	files,
	commits = EMPTY_COMMITS,
	className,
}: Readonly<EditorChangesPickerProps>) {
	const [scope, setScope] = useState<ChangesScope>("all-changes");
	const { additions, deletions } = sumChangedFileDiffStats(files);
	const fileCount = files.length;
	const fileCountLabel = `${fileCount} ${fileCount === 1 ? "file" : "files"}`;
	const scopeLabel = resolveScopeLabel(scope, commits);

	const selectScope = (next: ChangesScope) => {
		setScope(next);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				aria-label={`${scopeLabel}, ${fileCountLabel}, +${additions} −${deletions}`}
				data-code-review-changes-picker
				render={
					<Button
						className={cn(
							// Idle ghost uses text-text-subtle; keep body text at text-text.
							// Selected chrome (incl. border-border-selected) comes from Button —
							// both toolbar buttons already paint a transparent border when idle,
							// so expanding this trigger doesn’t change the gap-1 footprint.
							"text-text",
							className,
						)}
						size="compact"
						type="button"
						variant="ghost"
					/>
				}
			>
				<span>{scopeLabel}</span>
				<span className="font-normal text-text-subtle group-aria-expanded/button:text-text-selected group-aria-pressed/button:text-text-selected">
					{fileCountLabel}
				</span>
				<DiffStats additions={additions} deletions={deletions} emphasized />
				<Icon
					aria-hidden
					className="text-icon-subtle group-aria-expanded/button:text-icon-selected group-aria-pressed/button:text-icon-selected"
					render={<ChevronDownIcon label="" size="small" />}
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="min-w-56">
				<DropdownMenuGroup>
					<DropdownMenuItem
						onSelect={() => selectScope("all-changes")}
						selected={scope === "all-changes"}
					>
						<ScopeMenuLabel
							additions={additions}
							deletions={deletions}
							emphasized={scope === "all-changes"}
							label={CHANGES_SCOPE_LABELS["all-changes"]}
						/>
					</DropdownMenuItem>
					<DropdownMenuItem
						onSelect={() => selectScope("uncommitted")}
						selected={scope === "uncommitted"}
					>
						<ScopeMenuLabel
							additions={additions}
							deletions={deletions}
							emphasized={scope === "uncommitted"}
							label={CHANGES_SCOPE_LABELS.uncommitted}
						/>
					</DropdownMenuItem>
					<DropdownMenuItem
						onSelect={() => selectScope("staged")}
						selected={scope === "staged"}
					>
						{CHANGES_SCOPE_LABELS.staged}
					</DropdownMenuItem>
					<DropdownMenuItem
						onSelect={() => selectScope("unstaged")}
						selected={scope === "unstaged"}
					>
						<ScopeMenuLabel
							additions={additions}
							deletions={deletions}
							emphasized={scope === "unstaged"}
							label={CHANGES_SCOPE_LABELS.unstaged}
						/>
					</DropdownMenuItem>
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>Commits</DropdownMenuSubTrigger>
						<DropdownMenuSubContent className="min-w-56 max-w-80">
							{commits.map((commit) => {
								const commitScope = `commit:${commit.id}` as const;
								return (
									<DropdownMenuItem
										key={commit.id}
										onSelect={() => selectScope(commitScope)}
										selected={scope === commitScope}
									>
										<ScopeMenuLabel
											additions={commit.additions}
											deletions={commit.deletions}
											emphasized={scope === commitScope}
											label={`${commit.title} · ${commit.shortSha}`}
										/>
									</DropdownMenuItem>
								);
							})}
							{commits.length > 0 ? <DropdownMenuSeparator /> : null}
							<DropdownMenuItem
								onSelect={() => selectScope("all-commits")}
								selected={scope === "all-commits"}
							>
								{CHANGES_SCOPE_LABELS["all-commits"]}
							</DropdownMenuItem>
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
