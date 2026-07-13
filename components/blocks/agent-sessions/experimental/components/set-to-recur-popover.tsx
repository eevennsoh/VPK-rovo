"use client";

import { useState } from "react";

import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import RefreshIcon from "@atlaskit/icon/core/refresh";
import TrashIcon from "@atlaskit/icon/core/delete";

import { RECUR_DAYS, RECUR_FREQUENCIES, RECUR_TIMINGS } from "@/components/blocks/agent-sessions/data/metadata-fixtures";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";

interface RecurConfig {
	frequency: string;
	day: string;
	timing: string;
}

const DEFAULT_RECUR: RecurConfig = {
	frequency: RECUR_FREQUENCIES[1] ?? "Weekly",
	day: RECUR_DAYS[1] ?? "On Tuesday",
	timing: RECUR_TIMINGS[0] ?? "When scheduled",
};

function RecurSelect({
	ariaLabel,
	options,
	value,
	onChange,
}: Readonly<{ ariaLabel: string; options: readonly string[]; value: string; onChange: (next: string) => void }>) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={<Button aria-label={ariaLabel} className="w-full justify-between gap-2 font-normal" variant="outline" />}
			>
				<span className="min-w-0 truncate">{value}</span>
				<ChevronDownIcon label="" size="small" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="min-w-56" positionerClassName="z-[503]" sideOffset={6}>
				{options.map((option) => (
					<DropdownMenuItem key={option} onSelect={() => onChange(option)} selected={option === value}>
						{option}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

/**
 * The Automation "Set to recur" row + its configuration popover (frequency, day,
 * timing, Save/Delete). Local presentation state only.
 */
export function SetToRecurRow() {
	const [open, setOpen] = useState(false);
	const [config, setConfig] = useState<RecurConfig>(DEFAULT_RECUR);
	const [isRecurring, setIsRecurring] = useState(false);

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger
				render={
					<button
						aria-label="Set to recur"
						className="flex w-full items-center gap-2 rounded-md px-1 py-2 text-left text-sm text-text outline-none transition-colors duration-normal ease-out-practical hover:bg-bg-neutral-subtle-hovered focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
						type="button"
					/>
				}
			>
				<Icon aria-hidden className="text-icon-subtle" render={<RefreshIcon label="" size="small" />} />
				<span className="min-w-0 flex-1 truncate">Set to recur</span>
				{isRecurring ? <span className="shrink-0 text-xs text-text-subtlest">{config.frequency}</span> : null}
			</PopoverTrigger>
			<PopoverContent align="end" className="w-[18rem] p-3" positionerClassName="z-[502]" side="left">
				<PopoverTitle className="mb-2 text-sm font-semibold">Set to recur</PopoverTitle>
				<div className="flex flex-col gap-2">
					<div className="flex flex-col gap-1">
						<span className="text-xs text-text-subtle">Recur</span>
						<RecurSelect
							ariaLabel="Recur frequency"
							onChange={(next) => setConfig((previous) => ({ ...previous, frequency: next }))}
							options={RECUR_FREQUENCIES}
							value={config.frequency}
						/>
					</div>
					<RecurSelect
						ariaLabel="Recur day"
						onChange={(next) => setConfig((previous) => ({ ...previous, day: next }))}
						options={RECUR_DAYS}
						value={config.day}
					/>
					<RecurSelect
						ariaLabel="Recur timing"
						onChange={(next) => setConfig((previous) => ({ ...previous, timing: next }))}
						options={RECUR_TIMINGS}
						value={config.timing}
					/>
				</div>
				<div className="mt-3 flex items-center justify-between gap-2">
					<Button
						aria-label="Delete recurrence"
						disabled={!isRecurring}
						onClick={() => {
							setIsRecurring(false);
							setConfig(DEFAULT_RECUR);
							setOpen(false);
						}}
						size="icon"
						variant="ghost"
					>
						<TrashIcon label="" size="small" />
					</Button>
					<div className="flex items-center gap-2">
						<Button onClick={() => setOpen(false)} variant="ghost">
							Cancel
						</Button>
						<Button
							onClick={() => {
								setIsRecurring(true);
								setOpen(false);
							}}
						>
							Save
						</Button>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
