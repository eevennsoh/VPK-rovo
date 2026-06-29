"use client";

import BranchIcon from "@atlaskit/icon/core/branch";
import CheckMarkIcon from "@atlaskit/icon/core/check-mark";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import ClockIcon from "@atlaskit/icon/core/clock";
import FileIcon from "@atlaskit/icon/core/file";
import PersonIcon from "@atlaskit/icon/core/person";
import SearchIcon from "@atlaskit/icon/core/search";
import { toast } from "sonner";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { Icon } from "@/components/ui/icon";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Spinner } from "@/components/ui/spinner";

export default function MarkerDemo() {
	return <MarkerDemoMarkers />;
}

export function MarkerDemoMarkers() {
	return (
		<div className="mx-auto flex w-full max-w-md flex-col gap-8">
			<Marker>
				<MarkerContent>A default marker</MarkerContent>
			</Marker>
			<Marker>
				<MarkerIcon>
					<Icon render={<FileIcon label="" size="small" />} label="" />
				</MarkerIcon>
				<MarkerContent>Marker with icon</MarkerContent>
			</Marker>
			<Marker role="status">
				<MarkerIcon>
					<Spinner />
				</MarkerIcon>
				<MarkerContent>Marker with a spinner</MarkerContent>
			</Marker>
			<Marker role="status">
				<MarkerIcon>
					<Spinner />
				</MarkerIcon>
				<MarkerContent className="shimmer motion-reduce:animate-none">
					Marker with shimmer effect
				</MarkerContent>
			</Marker>
			<Marker role="status">
				<MarkerContent className="shimmer motion-reduce:animate-none">
					Thinking...
				</MarkerContent>
			</Marker>
			<Marker render={<a href="#markers" />}>
				<MarkerIcon>
					<Icon render={<BranchIcon label="" size="small" />} label="" />
				</MarkerIcon>
				<MarkerContent>Marker as a link</MarkerContent>
			</Marker>
			<Marker
				render={
					<button
						type="button"
						onClick={() => toast("You clicked the marker button")}
						className="rounded-md transition-colors outline-none hover:text-text focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
					/>
				}
			>
				<MarkerIcon>
					<Icon render={<ClockIcon label="" size="small" />} label="" />
				</MarkerIcon>
				<MarkerContent className="flex-1">
					<span>Marker as a button</span>
				</MarkerContent>
				<MarkerIcon>
					<Icon render={<ChevronRightIcon label="" size="small" />} label="" />
				</MarkerIcon>
			</Marker>
			<Marker>
				<MarkerIcon>
					<Icon render={<PersonIcon label="" size="small" />} label="" />
				</MarkerIcon>
				<MarkerContent>Rhea joined the chat</MarkerContent>
			</Marker>
			<Marker className="justify-center">
				<MarkerContent>
					<strong className="font-medium">Olivia Rose</strong> left the chat
				</MarkerContent>
			</Marker>
			<Marker className="flex-col">
				<MarkerIcon>
					<Icon render={<FileIcon label="" size="small" />} label="" />
				</MarkerIcon>
				<MarkerContent>Marker with icon at the top</MarkerContent>
			</Marker>
		</div>
	);
}

export function MarkerDemoBorder() {
	return (
		<div className="mx-auto flex w-full max-w-md flex-col gap-3">
			<Marker variant="border">
				<MarkerIcon>
					<Icon render={<BranchIcon label="" size="small" />} label="" />
				</MarkerIcon>
				<MarkerContent>Switched to release-candidate</MarkerContent>
			</Marker>
			<Marker variant="border">
				<MarkerIcon>
					<Icon render={<SearchIcon label="" size="small" />} label="" />
				</MarkerIcon>
				<MarkerContent>Reviewed 8 related files</MarkerContent>
			</Marker>
			<Marker variant="border">
				<MarkerIcon>
					<Icon render={<FileIcon label="" size="small" />} label="" />
				</MarkerIcon>
				<MarkerContent>Opened implementation notes</MarkerContent>
			</Marker>
		</div>
	);
}

export function MarkerDemoSeparator() {
	return (
		<div className="mx-auto flex w-full max-w-md flex-col gap-8">
			<Marker variant="separator">
				<MarkerContent>Worked for 42s</MarkerContent>
			</Marker>
			<Marker variant="separator" role="status">
				<MarkerIcon>
					<Spinner />
				</MarkerIcon>
				<MarkerContent>Compacting conversation</MarkerContent>
			</Marker>
			<Marker variant="separator" role="status">
				<MarkerContent className="shimmer motion-reduce:animate-none">
					Reading 4 files
				</MarkerContent>
			</Marker>
			<Marker variant="separator">
				<MarkerIcon>
					<Icon render={<CheckMarkIcon label="" size="small" />} label="" />
				</MarkerIcon>
				<MarkerContent>Conversation compacted</MarkerContent>
			</Marker>
			<Marker variant="separator">
				<MarkerContent>
					With a <a href="#separator">link to learn more</a>
				</MarkerContent>
			</Marker>
			<Marker variant="separator">
				<MarkerContent>
					<Button variant="outline">
						<Icon render={<BranchIcon label="" size="small" />} label="" />
						Button
					</Button>
				</MarkerContent>
			</Marker>
		</div>
	);
}

export function MarkerDemoAccordion() {
	return (
		<div className="mx-auto min-h-72 w-full max-w-md">
			<Accordion>
				<AccordionItem value="work">
					<AccordionTrigger>
						<Marker>
							<MarkerIcon>
								<Icon render={<ClockIcon label="" size="small" />} label="" />
							</MarkerIcon>
							<MarkerContent>Worked for 42s</MarkerContent>
						</Marker>
					</AccordionTrigger>
					<AccordionContent>
						<p className="text-sm text-muted-foreground">
							The user asked for a list of files in the current directory. The
							assistant read the workspace, summarized the relevant files, and
							kept the response anchored to the current task.
						</p>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	);
}

export function MarkerDemoDrawer() {
	return (
		<div className="mx-auto flex w-full max-w-md justify-center">
			<Drawer direction="right">
				<Marker variant="separator">
					<DrawerTrigger
						render={
							<Button variant="outline">
								<Icon render={<SearchIcon label="" size="small" />} label="" />
								Explored 4 files
							</Button>
						}
					/>
				</Marker>
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle>File Activity</DrawerTitle>
						<DrawerDescription>
							Files read while preparing the response.
						</DrawerDescription>
					</DrawerHeader>
					<div className="grid gap-3 px-4 text-sm">
						<div className="flex items-center justify-between gap-4 rounded-md border px-3 py-2">
							<span className="truncate">app/chat/page.tsx</span>
							<span className="text-muted-foreground">read</span>
						</div>
						<div className="flex items-center justify-between gap-4 rounded-md border px-3 py-2">
							<span className="truncate">components/message.tsx</span>
							<span className="text-muted-foreground">read</span>
						</div>
						<div className="flex items-center justify-between gap-4 rounded-md border px-3 py-2">
							<span className="truncate">lib/ai.ts</span>
							<span className="text-muted-foreground">read</span>
						</div>
					</div>
					<DrawerFooter>
						<DrawerClose render={<Button variant="outline">Close</Button>} />
					</DrawerFooter>
				</DrawerContent>
			</Drawer>
		</div>
	);
}
