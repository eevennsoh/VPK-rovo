"use client";

import { useState, type ReactElement } from "react";

import AddIcon from "@atlaskit/icon/core/add";
import ChildWorkItemsIcon from "@atlaskit/icon/core/child-work-items";

import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAgentSessionsActions } from "@/components/blocks/agent-sessions/experimental/context-agent-sessions";
import {
	createSubtaskFromName,
	SUBTASK_EXISTING,
	SUBTASK_SUGGESTIONS,
} from "@/components/blocks/agent-sessions/data/context-fixtures";
import type { WorkItemChildItem } from "@/app/contexts/context-work-item-modal";

export function SubtasksPopover({ trigger }: Readonly<{ trigger: ReactElement }>) {
	const actions = useAgentSessionsActions();
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [query, setQuery] = useState("");

	const add = (item: WorkItemChildItem) => {
		actions.addContextResource("subtask", item);
		setName("");
		setQuery("");
		setOpen(false);
	};

	const createFromName = () => {
		if (!name.trim()) return;
		add(createSubtaskFromName(name));
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger render={trigger} />
			<PopoverContent align="start" className="w-[22rem] p-0" positionerClassName="z-[502]">
				<Tabs defaultValue="create" className="gap-0">
					<TabsList variant="line" className="w-full px-2.5 pt-2.5">
						<TabsTrigger value="create">Create new</TabsTrigger>
						<TabsTrigger value="existing">Add existing</TabsTrigger>
					</TabsList>

					<TabsContent value="create" className="flex flex-col gap-2 p-2.5">
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
								placeholder="Subtask name"
								className="h-8"
							/>
							<Button type="button" size="icon" variant="outline" aria-label="Create subtask" disabled={!name.trim()} onClick={createFromName}>
								<AddIcon label="" size="small" />
							</Button>
						</div>
						<div className="flex flex-col gap-0.5">
							<span className="px-1 text-xs font-semibold leading-4 text-text-subtlest">Suggestions</span>
							{SUBTASK_SUGGESTIONS.map((suggestion) => (
								<button
									key={suggestion}
									type="button"
									onClick={() => add(createSubtaskFromName(suggestion))}
									className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-text transition-colors hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
								>
									<span className="shrink-0 text-icon-subtle">
										<AddIcon label="" size="small" color="currentColor" />
									</span>
									<span className="min-w-0 flex-1">{suggestion}</span>
								</button>
							))}
						</div>
					</TabsContent>

					<TabsContent value="existing" className="p-2.5">
						<Command className="rounded-lg border border-border p-0">
							<CommandInput value={query} onValueChange={setQuery} placeholder="Search work items…" />
							<CommandList>
								<CommandEmpty>No matching work items.</CommandEmpty>
								<CommandGroup heading="Work items">
									{SUBTASK_EXISTING.map((item) => (
										<CommandItem
											key={item.key}
											value={`${item.key} ${item.summary}`}
											onSelect={() => add({ ...item })}
											showCheckIcon={false}
										>
											<span className="shrink-0 text-icon-subtle">
												<ChildWorkItemsIcon label="" size="small" color="currentColor" />
											</span>
											<span className="shrink-0 text-xs font-medium text-text-subtle">{item.key}</span>
											<span className="min-w-0 flex-1 truncate">{item.summary}</span>
										</CommandItem>
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
