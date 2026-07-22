"use client";

import CrossIcon from "@atlaskit/icon/core/cross";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DialogTitle } from "@/components/ui/dialog";
import { Icon as VpkIcon } from "@/components/ui/icon";
import { RovoColorIcon } from "@/components/ui/logo";

import type { ReactNode } from "react";

interface RovoCanvasHeaderProps {
	title: string;
	start?: ReactNode;
	primaryActionLabel: string;
	onPrimaryAction?: () => void;
	/**
	 * Optional caller-supplied menu items for a split primary-action button
	 * (the code review canvas supplies its pull-request commands this way).
	 * When omitted the header renders a plain primary button, so report and
	 * dashboard canvases never advertise capabilities they do not have.
	 */
	primaryActionMenu?: ReactNode;
	onClose: () => void;
}

function RovoCanvasBrand(): React.ReactElement {
	return (
		<div className="flex h-8 shrink-0 items-center gap-1.5 px-2 text-sm font-medium text-text">
			<span
				aria-hidden
				data-icon="inline-start"
				className="flex size-4 items-center justify-center"
			>
				<RovoColorIcon size="xxsmall" />
			</span>
			<span className="font-semibold">Rovo</span>
		</div>
	);
}

export function RovoCanvasHeader({
	title,
	start,
	primaryActionLabel,
	onPrimaryAction,
	primaryActionMenu,
	onClose,
}: Readonly<RovoCanvasHeaderProps>): React.ReactElement {
	return (
		<header className="flex shrink-0 items-center justify-between gap-4">
			{start ?? <RovoCanvasBrand />}
			<DialogTitle className="sr-only">{title}</DialogTitle>

			<div className="flex shrink-0 items-center gap-2">
				{primaryActionMenu ? (
					<ButtonGroup variant="split">
						<Button onClick={onPrimaryAction}>{primaryActionLabel}</Button>
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<Button aria-label="More primary action options" size="icon">
										<VpkIcon render={<ChevronDownIcon label="" size="small" />} />
									</Button>
								}
							/>
							<DropdownMenuContent align="end">
								<DropdownMenuGroup>{primaryActionMenu}</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</ButtonGroup>
				) : (
					<Button onClick={onPrimaryAction}>{primaryActionLabel}</Button>
				)}
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button aria-label="More canvas actions" size="icon" variant="outline">
								<VpkIcon render={<ShowMoreHorizontalIcon label="" size="small" />} />
							</Button>
						}
					/>
					<DropdownMenuContent align="end" className="w-48">
						<DropdownMenuGroup>
							<DropdownMenuItem>Share</DropdownMenuItem>
							<DropdownMenuItem>Duplicate</DropdownMenuItem>
							<DropdownMenuItem>Save as app</DropdownMenuItem>
							<DropdownMenuItem>Export HTML</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem>Start from scratch</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
				<Button aria-label="Close canvas" size="icon" variant="outline" onClick={onClose}>
					<VpkIcon render={<CrossIcon label="" size="small" />} />
				</Button>
			</div>
		</header>
	);
}
