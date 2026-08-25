"use client";

import { useState } from "react";
import GrowDiagonalIcon from "@atlaskit/icon/core/grow-diagonal";
import LinkIcon from "@atlaskit/icon/core/link";
import PageIcon from "@atlaskit/icon/core/page";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { SonnerToast, Toaster } from "@/components/ui/sonner";
import { ChevronDownIcon } from "@/components/ui/vpk-icons";
import "@/components/ui-custom/rich-text-editor/rich-text-editor.css";
import { cn } from "@/lib/utils";
import {
	formatSourcesPreviewDate,
	getSourcesPreviewIconTileVariant,
	SOURCES_PREVIEW_PAGES,
	type SourcesPreviewPage,
} from "./sources-preview-menu-data";

const SOURCES_PREVIEW_TOASTER_ID = "sources-demo-preview-menu";

function showSourcesToast(title: string, appearance: "success" | "error"): void {
	toast.custom(
		(id) => (
			<SonnerToast
				appearance={appearance}
				onDismiss={() => toast.dismiss(id)}
				title={title}
			/>
		),
		{ toasterId: SOURCES_PREVIEW_TOASTER_ID },
	);
}

async function copySourceLink(href: string): Promise<void> {
	try {
		await navigator.clipboard.writeText(href);
		showSourcesToast("Link copied", "success");
	} catch {
		showSourcesToast("Could not copy link", "error");
	}
}

function SourcePreviewMetadata({
	source,
}: Readonly<{ source: SourcesPreviewPage }>) {
	return (
		<>
			<span>Updated on {formatSourcesPreviewDate(source.updatedAt)}</span>
			<span aria-hidden="true">·</span>
			<span>Owned by {source.owner}</span>
		</>
	);
}

function SourcePreviewActions({
	source,
	onPreview,
}: Readonly<{
	source: SourcesPreviewPage;
	onPreview: (source: SourcesPreviewPage) => void;
}>) {
	return (
		<div
			className={cn(
				"shrink-0 opacity-0 transition-opacity duration-fast ease-out-practical motion-reduce:transition-none",
				"group-hover/preview-card:opacity-100 group-has-[:focus-visible]/preview-card:opacity-100",
				"has-[[aria-expanded=true]]:opacity-100",
			)}
		>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							aria-label={`More actions for ${source.title}`}
							size="icon-compact"
							type="button"
							variant="ghost"
						>
							<ShowMoreHorizontalIcon label="" size="small" />
						</Button>
					}
				/>
				<DropdownMenuContent align="end" portalled={false} sideOffset={6}>
					<DropdownMenuGroup>
						<DropdownMenuItem
							elemBefore={<Icon render={<LinkIcon label="" size="small" />} />}
							onSelect={() => {
								void copySourceLink(source.href);
							}}
						>
							Copy link
						</DropdownMenuItem>
						<DropdownMenuItem
							elemBefore={<Icon render={<GrowDiagonalIcon label="" size="small" />} />}
							onSelect={() => onPreview(source)}
						>
							Open preview modal
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

function SourcePreviewCard({
	source,
	onPreview,
}: Readonly<{
	source: SourcesPreviewPage;
	onPreview: (source: SourcesPreviewPage) => void;
}>) {
	return (
		<article
			className={cn(
				"group/preview-card relative rich-text-command-menu-item",
				"h-auto! items-start! py-2!",
				"hover:bg-bg-neutral-subtle-hovered! has-[:focus-visible]:bg-bg-neutral-subtle-hovered!",
			)}
			data-has-trailing="true"
		>
			<a
				aria-label={source.title}
				className="absolute inset-0 z-0 rounded-lg"
				href={source.href}
				rel="noreferrer"
				target="_blank"
			/>
			<span className="rich-text-command-menu-avatar inline-flex shrink-0 items-center justify-center">
				<IconTile
					aria-hidden={true}
					as="span"
					icon={<PageIcon label="" size="small" />}
					label={source.title}
					size="small"
					variant={getSourcesPreviewIconTileVariant(source.href)}
				/>
			</span>
			<span className="rich-text-command-menu-copy">
				<span className="menu-row-title text-text!">{source.title}</span>
				<span className="menu-row-byline flex min-w-0 items-center gap-1.5 text-text-subtlest!">
					<SourcePreviewMetadata source={source} />
				</span>
				<span className="menu-row-byline mt-0.5 line-clamp-2 whitespace-normal! text-text-subtle!">
					{source.snippet}
				</span>
			</span>
			<span className="rich-text-command-menu-shortcut z-10 top-2! right-2! bottom-auto!">
				<SourcePreviewActions onPreview={onPreview} source={source} />
			</span>
		</article>
	);
}

function SourcePreviewDialog({
	source,
	onOpenChange,
}: Readonly<{
	source: SourcesPreviewPage | null;
	onOpenChange: (open: boolean) => void;
}>) {
	return (
		<Dialog onOpenChange={onOpenChange} open={source !== null}>
			<DialogContent size="md">
				<DialogHeader>
					<DialogTitle>{source?.title ?? "Source preview"}</DialogTitle>
					<DialogDescription>
						{source ? (
							<span className="inline-flex min-w-0 flex-wrap items-center gap-1.5">
								<SourcePreviewMetadata source={source} />
							</span>
						) : (
							"Source details"
						)}
					</DialogDescription>
				</DialogHeader>
				{source ? <p className="text-sm text-text-subtle">{source.snippet}</p> : null}
				<DialogFooter>
					<Button
						onClick={() => {
							if (source) {
								window.open(source.href, "_blank", "noopener,noreferrer");
							}
						}}
						type="button"
					>
						Open source
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default function SourcesDemoPreviewMenu() {
	const [menuOpen, setMenuOpen] = useState(false);
	const [previewSource, setPreviewSource] = useState<SourcesPreviewPage | null>(null);

	const openPreview = (source: SourcesPreviewPage) => {
		setMenuOpen(false);
		setPreviewSource(source);
	};

	return (
		<>
			<div className="not-prose mb-4 text-primary text-xs">
				<Popover onOpenChange={setMenuOpen} open={menuOpen}>
					<PopoverTrigger
						render={<button className="flex items-center gap-2" type="button" />}
					>
						<p className="font-medium">Used {SOURCES_PREVIEW_PAGES.length} sources</p>
						<ChevronDownIcon size="small" />
					</PopoverTrigger>
					<PopoverContent
						align="start"
						className="w-[min(26rem,var(--available-width,26rem))] gap-0 overflow-visible border-0 p-1 shadow-2xl"
						initialFocus={(openType) => openType === "keyboard"}
					>
						<PopoverTitle className="sr-only">Source previews</PopoverTitle>
						{SOURCES_PREVIEW_PAGES.map((previewItem) => (
							<SourcePreviewCard
								key={previewItem.id}
								onPreview={openPreview}
								source={previewItem}
							/>
						))}
					</PopoverContent>
				</Popover>
			</div>
			<SourcePreviewDialog
				onOpenChange={(open) => {
					if (!open) {
						setPreviewSource(null);
					}
				}}
				source={previewSource}
			/>
			<Toaster id={SOURCES_PREVIEW_TOASTER_ID} />
		</>
	);
}
