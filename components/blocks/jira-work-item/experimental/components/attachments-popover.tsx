"use client";

import { useState, type ReactElement, type ReactNode } from "react";

import FilesIcon from "@atlaskit/icon/core/files";
import LinkIcon from "@atlaskit/icon/core/link";
import PageIcon from "@atlaskit/icon/core/page";
import UploadIcon from "@atlaskit/icon/core/upload";
import VideoIcon from "@atlaskit/icon/core/video";
import WhiteboardIcon from "@atlaskit/icon/core/whiteboard";

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
import { useJiraWorkItemActions } from "@/components/blocks/jira-work-item/experimental/context-jira-work-item";
import {
	ATTACHMENT_CREATE_OPTIONS,
	ATTACHMENT_RECENT,
	ATTACHMENT_SUGGESTED,
	createCreatedAttachment,
	createLinkedContentAttachment,
	createUploadedAttachment,
	getAttachmentLabel,
	type AttachmentCreateKind,
} from "@/components/blocks/jira-work-item/data/context-fixtures";
import type { WorkItemAttachment } from "@/app/contexts/context-work-item-modal";

const CREATE_OPTION_ICON: Record<AttachmentCreateKind, typeof PageIcon> = {
	page: PageIcon,
	"live-doc": PageIcon,
	whiteboard: WhiteboardIcon,
	"loom-video": VideoIcon,
};

function attachmentGlyph(attachment: Readonly<WorkItemAttachment>): ReactNode {
	if (attachment.ext === "link") return <LinkIcon label="" size="small" color="currentColor" />;
	if (attachment.thumbnailKind === "video") return <VideoIcon label="" size="small" color="currentColor" />;
	if (attachment.ext === "page" || attachment.ext === "doc") return <PageIcon label="" size="small" color="currentColor" />;
	return <FilesIcon label="" size="small" color="currentColor" />;
}

function AttachmentResultItem({ attachment, onSelect }: Readonly<{ attachment: WorkItemAttachment; onSelect: () => void }>) {
	const label = getAttachmentLabel(attachment);
	return (
		<CommandItem value={`${label}-${attachment.id}`} onSelect={onSelect} showCheckIcon={false}>
			<span className="text-icon-subtle">{attachmentGlyph(attachment)}</span>
			<span className="min-w-0 flex-1 truncate">{label}</span>
			<span className="shrink-0 text-xs text-text-subtlest">{attachment.date}</span>
		</CommandItem>
	);
}

export function AttachmentsPopover({ trigger }: Readonly<{ trigger: ReactElement }>) {
	const actions = useJiraWorkItemActions();
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [displayName, setDisplayName] = useState("");

	const add = (item: WorkItemAttachment) => {
		actions.addContextResource("attachment", item);
		setQuery("");
		setDisplayName("");
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger render={trigger} />
			<PopoverContent align="start" className="w-[22rem] p-0" positionerClassName="z-[502]">
				<Tabs defaultValue="upload" className="gap-0">
					<TabsList variant="line" className="mt-2.5 w-full px-2.5">
						<TabsTrigger value="upload">Upload files</TabsTrigger>
						<TabsTrigger value="link">Link content</TabsTrigger>
						<TabsTrigger value="create">Create new</TabsTrigger>
					</TabsList>

					<TabsContent value="upload" className="p-2.5">
						<button
							type="button"
							onClick={() => add(createUploadedAttachment())}
							className="flex w-full flex-col items-center gap-1 rounded-lg border border-dashed border-border-bold bg-bg-neutral-subtle px-3 py-6 text-center transition-colors hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
						>
							<span className="text-icon-subtle">
								<UploadIcon label="" color="currentColor" />
							</span>
							<span className="text-sm font-medium text-text">Drop files or click to upload</span>
							<span className="text-xs text-text-subtlest">Files attach directly to this work item</span>
						</button>
					</TabsContent>

					<TabsContent value="link" className="flex flex-col gap-2 p-2.5">
						<Input
							value={displayName}
							onChange={(event) => setDisplayName(event.target.value)}
							placeholder="Display name (optional)"
							className="h-8"
						/>
						<Command className="rounded-lg border border-border p-0">
							<CommandInput
								value={query}
								onValueChange={setQuery}
								placeholder="Search or paste a link…"
							/>
							<CommandList>
								{query.trim() ? (
									<CommandGroup heading="Link">
										<CommandItem
											value={`paste-${query}`}
											onSelect={() => add(createLinkedContentAttachment(query, displayName))}
											showCheckIcon={false}
										>
											<span className="text-icon-subtle">
												<LinkIcon label="" size="small" color="currentColor" />
											</span>
											<span className="min-w-0 flex-1 truncate">Link “{query}”</span>
										</CommandItem>
									</CommandGroup>
								) : null}
								<CommandEmpty>No matching content.</CommandEmpty>
								<CommandGroup heading="Recent">
									{ATTACHMENT_RECENT.map((attachment) => (
										<AttachmentResultItem key={attachment.id} attachment={attachment} onSelect={() => add({ ...attachment })} />
									))}
								</CommandGroup>
								<CommandGroup heading="Suggested attachments">
									{ATTACHMENT_SUGGESTED.map((attachment) => (
										<AttachmentResultItem key={attachment.id} attachment={attachment} onSelect={() => add({ ...attachment })} />
									))}
								</CommandGroup>
							</CommandList>
						</Command>
					</TabsContent>

					<TabsContent value="create" className="flex flex-col gap-0.5 p-2.5">
						{ATTACHMENT_CREATE_OPTIONS.map((option) => {
							const OptionIcon = CREATE_OPTION_ICON[option.id];
							return (
								<button
									key={option.id}
									type="button"
									onClick={() => add(createCreatedAttachment(option))}
									className="flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-text transition-colors hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
								>
									<span className="text-icon-subtle">
										<OptionIcon label="" size="small" color="currentColor" />
									</span>
									<span className="min-w-0 flex-1 truncate">{option.label}</span>
								</button>
							);
						})}
					</TabsContent>
				</Tabs>
			</PopoverContent>
		</Popover>
	);
}
