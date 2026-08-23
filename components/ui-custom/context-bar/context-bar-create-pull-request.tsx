"use client";

import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import PullRequestIcon from "@atlaskit/icon/core/pull-request";
import ShortcutIcon from "@atlaskit/icon/core/shortcut";
import { useState, type ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { ContextBar } from "./context-bar";

export type ContextBarCreatePullRequestMode = "open" | "draft" | "manual";

export interface ContextBarCreatePullRequestProps
	extends Omit<ComponentProps<"div">, "children"> {
	repository: string;
	branch: string;
	additions: number;
	deletions: number;
	onCreate?: () => void;
	onCreateDraft?: () => void;
	onCreateManually?: () => void;
	onDismiss?: () => void;
	dismissLabel?: string;
}

function shortRepositoryName(repository: string): string {
	const separatorIndex = repository.lastIndexOf("/");
	return separatorIndex === -1 ? repository : repository.slice(separatorIndex + 1);
}

function createPullRequestLabel(mode: ContextBarCreatePullRequestMode): string {
	switch (mode) {
		case "open":
			return "Create PR";
		case "draft":
			return "Create draft PR";
		case "manual":
			return "Manually create PR";
		default: {
			const exhaustive: never = mode;
			return exhaustive;
		}
	}
}

function BranchLabel({ name }: Readonly<{ name: string }>) {
	const slashIndex = name.indexOf("/");
	if (slashIndex === -1) {
		return name;
	}

	return (
		<>
			<span className="text-text-subtle">{name.slice(0, slashIndex + 1)}</span>
			<span className="text-text">{name.slice(slashIndex + 1)}</span>
		</>
	);
}

function CreatePullRequestSplitButton({
	mode,
	onCreate,
	onCreateDraft,
	onCreateManually,
	onModeChange,
}: Readonly<{
	mode: ContextBarCreatePullRequestMode;
	onCreate?: () => void;
	onCreateDraft?: () => void;
	onCreateManually?: () => void;
	onModeChange: (mode: ContextBarCreatePullRequestMode) => void;
}>) {
	const primaryLabel = createPullRequestLabel(mode);

	function handlePrimaryClick() {
		switch (mode) {
			case "open":
				onCreate?.();
				return;
			case "draft":
				onCreateDraft?.();
				return;
			case "manual":
				onCreateManually?.();
				return;
			default: {
				const exhaustive: never = mode;
				return exhaustive;
			}
		}
	}

	return (
		<ButtonGroup aria-label="Create pull request" className="shrink-0" variant="split">
			<Button onClick={handlePrimaryClick} size="compact" type="button" variant="outline">
				{primaryLabel}
			</Button>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							aria-label="More pull request actions"
							size="icon-compact"
							type="button"
							variant="outline"
						/>
					}
				>
					<ChevronDownIcon color="currentColor" label="" size="small" />
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="end"
					className="min-w-52"
					positionerClassName="z-[600]"
					side="top"
				>
					<DropdownMenuGroup>
						<DropdownMenuItem
							elemBefore={<PullRequestIcon color="currentColor" label="" size="small" />}
							onSelect={() => onModeChange("open")}
							selected={mode === "open"}
						>
							Create PR
						</DropdownMenuItem>
						<DropdownMenuItem
							elemBefore={<PullRequestIcon color="currentColor" label="" size="small" />}
							onSelect={() => onModeChange("draft")}
							selected={mode === "draft"}
						>
							Create draft PR
						</DropdownMenuItem>
						<DropdownMenuItem
							elemBefore={<ShortcutIcon color="currentColor" label="" size="small" />}
							onSelect={() => onModeChange("manual")}
							selected={mode === "manual"}
						>
							Manually create PR
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</ButtonGroup>
	);
}

/**
 * Composer-facing pre-PR variation of `ContextBar`: repository + branch +
 * diff stats + Create PR split button (ready, draft, or manual),
 * with the shared dismiss affordance. CI cannot run until a PR exists.
 */
export function ContextBarCreatePullRequest({
	additions,
	branch,
	className,
	deletions,
	dismissLabel = "Dismiss unpublished branch context",
	onCreate,
	onCreateDraft,
	onCreateManually,
	onDismiss,
	repository,
	...props
}: Readonly<ContextBarCreatePullRequestProps>): React.ReactElement {
	const [mode, setMode] = useState<ContextBarCreatePullRequestMode>("open");
	const repositoryLabel = shortRepositoryName(repository);
	const regionLabel = [
		`Unpublished branch ${branch}`,
		`${additions} additions and ${deletions} deletions`,
		`${createPullRequestLabel(mode)} ready`,
	].join(". ");

	return (
		<ContextBar
			aria-label={regionLabel}
			className={cn(
				"mb-2 w-full max-w-[calc(100vw-7rem)] gap-2 overflow-hidden px-2.5 py-0 sm:max-w-full",
				className,
			)}
			data-create-pr-context-bar
			data-create-pr-mode={mode}
			dismissLabel={dismissLabel}
			onDismiss={onDismiss}
			role="region"
			{...props}
		>
			<span
				className="min-w-0 flex-1 truncate text-sm text-text-subtle"
				title={`${repository} ${branch}`}
			>
				<span className="text-text">{repositoryLabel}</span>
				{" "}
				<BranchLabel name={branch} />
			</span>
			<span className="hidden shrink-0 items-center gap-1 rounded-lg bg-surface px-2 py-1 font-mono text-xs sm:inline-flex">
				<span className="sr-only">{additions} additions and {deletions} deletions</span>
				<span aria-hidden className="text-text-success">+{additions}</span>
				<span aria-hidden className="text-text-danger">−{deletions}</span>
			</span>
			<CreatePullRequestSplitButton
				mode={mode}
				onCreate={onCreate}
				onCreateDraft={onCreateDraft}
				onCreateManually={onCreateManually}
				onModeChange={setMode}
			/>
		</ContextBar>
	);
}
