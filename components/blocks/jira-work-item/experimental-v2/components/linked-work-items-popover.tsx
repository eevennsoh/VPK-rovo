"use client";

import { useState, type ReactElement } from "react";

import AddIcon from "@atlaskit/icon/core/add";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import LinkIcon from "@atlaskit/icon/core/link";

import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useJiraWorkItemActions } from "@/components/blocks/jira-work-item/experimental-v2/context-jira-work-item";
import {
	createLinkedItem,
	linkExistingItem,
	LINK_RECENT,
	LINK_RELATIONSHIPS,
	LINK_SIMILAR,
	LINK_TYPES,
} from "@/components/blocks/jira-work-item/data/context-fixtures";
import type {
	ContextLinkedItem,
	LinkedWorkItemType,
	RelationshipOption,
} from "@/components/blocks/jira-work-item/data/session-state";

// A relationship/type picker backed by DropdownMenu (not Select): the experimental
// dialog sits at z-[501] and SelectContent hardcodes z-[200] with no override, so a
// nested Select would render behind the dialog. DropdownMenu accepts a
// positionerClassName, so we push it to z-[600] above the popover (z-[502]).
function LinkOptionPicker<T extends string>({
	ariaLabel,
	value,
	options,
	onChange,
}: Readonly<{ ariaLabel: string; value: T; options: readonly T[]; onChange: (value: T) => void }>) {
	const [open, setOpen] = useState(false);
	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger
				render={
					<button
						type="button"
						aria-label={ariaLabel}
						className="flex h-8 min-w-0 flex-1 items-center justify-between gap-1.5 rounded-md border border-input bg-bg-input px-2.5 text-sm text-text transition-colors hover:bg-bg-input-hovered active:bg-bg-input-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-expanded:border-ring motion-reduce:transition-none"
					>
						<span className="min-w-0 truncate">{value}</span>
						<span className="shrink-0 text-icon-subtle">
							<ChevronDownIcon label="" size="small" color="currentColor" />
						</span>
					</button>
				}
			/>
			<DropdownMenuContent align="start" positionerClassName="z-[600]">
				<DropdownMenuRadioGroup
					value={value}
					onValueChange={(next) => {
						onChange(next as T);
						setOpen(false);
					}}
				>
					{options.map((option) => (
						<DropdownMenuRadioItem key={option} value={option}>
							{option}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export function LinkedWorkItemsPopover({ trigger }: Readonly<{ trigger: ReactElement }>) {
	const actions = useJiraWorkItemActions();
	const [open, setOpen] = useState(false);
	const [relationship, setRelationship] = useState<RelationshipOption>("relates to");
	const [type, setType] = useState<LinkedWorkItemType>("Task");
	const [name, setName] = useState("");
	const [query, setQuery] = useState("");

	const add = (item: ContextLinkedItem) => {
		actions.addContextResource("link", item);
		setName("");
		setQuery("");
		setOpen(false);
	};

	const createFromName = () => {
		if (!name.trim()) return;
		add(createLinkedItem(relationship, type, name));
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger render={trigger} />
			<PopoverContent align="start" className="w-[24rem] p-0" positionerClassName="z-[502]">
				<Tabs defaultValue="create" className="gap-0">
					<TabsList variant="line" className="w-full px-2.5 pt-2.5">
						<TabsTrigger value="create">Create new</TabsTrigger>
						<TabsTrigger value="existing">Add existing</TabsTrigger>
					</TabsList>

					<TabsContent value="create" className="flex flex-col gap-2 p-2.5">
						<div className="flex items-center gap-1.5">
							<LinkOptionPicker ariaLabel="Relationship" value={relationship} options={LINK_RELATIONSHIPS} onChange={setRelationship} />
							<LinkOptionPicker ariaLabel="Work item type" value={type} options={LINK_TYPES} onChange={setType} />
						</div>
						<div className="flex items-center gap-1.5">
							<Input
								value={name}
								onChange={(event) => setName(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === "Enter") {
										event.preventDefault();
										createFromName();
									}
								}}
								placeholder="Work item summary"
								className="h-8"
							/>
							<Button type="button" size="icon" variant="outline" aria-label="Create linked work item" disabled={!name.trim()} onClick={createFromName}>
								<AddIcon label="" size="small" />
							</Button>
						</div>
					</TabsContent>

					<TabsContent value="existing" className="flex flex-col gap-2 p-2.5">
						<LinkOptionPicker ariaLabel="Relationship" value={relationship} options={LINK_RELATIONSHIPS} onChange={setRelationship} />
						<Command className="rounded-lg border border-border p-0">
							<CommandInput value={query} onValueChange={setQuery} placeholder="Search work items…" />
							<CommandList>
								<CommandEmpty>No matching work items.</CommandEmpty>
								<CommandGroup heading="Recent issues">
									{LINK_RECENT.map((item) => (
										<LinkedResultItem key={item.id} item={item} onSelect={() => add(linkExistingItem(item, relationship))} />
									))}
								</CommandGroup>
								<CommandGroup heading="Similar work items">
									{LINK_SIMILAR.map((item) => (
										<LinkedResultItem key={item.id} item={item} onSelect={() => add(linkExistingItem(item, relationship))} />
									))}
								</CommandGroup>
							</CommandList>
						</Command>
					</TabsContent>
				</Tabs>
			</PopoverContent>
		</Popover>
	);
}

function LinkedResultItem({ item, onSelect }: Readonly<{ item: ContextLinkedItem; onSelect: () => void }>) {
	return (
		<CommandItem value={`${item.key} ${item.summary}`} onSelect={onSelect} showCheckIcon={false}>
			<span className="shrink-0 text-icon-subtle">
				<LinkIcon label="" size="small" color="currentColor" />
			</span>
			<span className="shrink-0 text-xs font-medium text-text-subtle">{item.key}</span>
			<span className="min-w-0 flex-1 truncate">{item.summary}</span>
			<span className="shrink-0 text-xs text-text-subtlest">{item.type}</span>
		</CommandItem>
	);
}
