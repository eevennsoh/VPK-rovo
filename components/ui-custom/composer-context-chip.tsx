"use client";

import type { ReactNode } from "react";

import CrossIcon from "@atlaskit/icon/core/cross";

import { Button } from "@/components/ui/button";
import { dropdownStyles } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface ComposerContextChipItem {
	id: string;
	/** Primary line in the popover (file path, check name, author, etc.). */
	title: string;
	/** Optional secondary line (line number, check details, etc.). */
	subtitle?: string;
	body: string;
}

export interface ComposerContextChipProps {
	items: readonly ComposerContextChipItem[];
	/** Leading icon inside the chip trigger. */
	icon: ReactNode;
	/** Visible count label (e.g. "1 comment", "2 failing checks"). */
	countLabel: string;
	/** Accessible name for the popover trigger. Defaults to `Review ${countLabel}`. */
	triggerLabel?: string;
	onRemoveAll: () => void;
	/** Accessible label for the dismiss control. */
	removeAllLabel: string;
	/** Test id for the chip root. */
	testId: string;
}

/**
 * One-turn composer context pill: count chip + popover detail list + dismiss.
 * Shared by comment chips and failing CI-check chips so PromptInput attachments
 * share the same chrome.
 */
export function ComposerContextChip({
	items,
	icon,
	countLabel,
	triggerLabel,
	onRemoveAll,
	removeAllLabel,
	testId,
}: Readonly<ComposerContextChipProps>) {
	return (
		<div
			className="inline-flex min-w-0 max-w-full items-center rounded-md border border-border bg-bg-neutral-subtle"
			data-testid={testId}
		>
			<Popover>
				<PopoverTrigger
					render={
						<Button
							aria-label={triggerLabel ?? `Review ${countLabel}`}
							className="min-w-0 rounded-r-none border-0 bg-transparent px-2 text-text hover:bg-bg-neutral-subtle-hovered"
							size="compact"
							variant="ghost"
						/>
					}
				>
					{icon}
					<span className="truncate">{countLabel}</span>
				</PopoverTrigger>
				<PopoverContent
					align="start"
					className="max-h-72 w-[min(22rem,calc(100vw-2rem))] gap-0 overflow-y-auto p-1"
					positionerClassName="z-[600]"
					side="top"
					sideOffset={8}
				>
					<ul>
						{items.map((item, index) => (
							<li className="min-w-0" key={item.id}>
								{index > 0 ? (
									<hr className={dropdownStyles.separator} />
								) : null}
								<div className="px-3 py-2">
									<div className="truncate text-xs font-semibold text-text" title={item.title}>
										{item.title}
									</div>
									{item.subtitle ? (
										<div className="mt-0.5 text-xs text-text-subtle">
											{item.subtitle}
										</div>
									) : null}
									<p className="mt-1 whitespace-pre-wrap break-words text-sm text-text">{item.body}</p>
								</div>
							</li>
						))}
					</ul>
				</PopoverContent>
			</Popover>
			<Button
				aria-label={removeAllLabel}
				className="rounded-l-none border-0 border-l border-border bg-transparent"
				onClick={onRemoveAll}
				size="icon-compact"
				variant="ghost"
			>
				<CrossIcon label="" size="small" />
			</Button>
		</div>
	);
}
