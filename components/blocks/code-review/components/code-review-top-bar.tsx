"use client";

import AngleBracketsIcon from "@atlaskit/icon/core/angle-brackets";
import CrossIcon from "@atlaskit/icon/core/cross";
import PageIcon from "@atlaskit/icon/core/page";
import ScreenIcon from "@atlaskit/icon/core/screen";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { IconTile } from "@/components/ui/icon-tile";
import { Lozenge } from "@/components/ui/lozenge";

import type { CodeReviewWorkItem } from "../data/types";

interface CodeReviewTopBarProps {
	workItem: CodeReviewWorkItem;
	screen: "summary" | "editor";
	onScreenChange: (screen: "summary" | "editor") => void;
}

export function CodeReviewTopBar({
	workItem,
	screen,
	onScreenChange,
}: Readonly<CodeReviewTopBarProps>) {
	return (
		<header className="flex h-16 shrink-0 items-center justify-between gap-4 px-4">
		<div className="flex min-w-0 items-center gap-2">
			<IconTile
				icon={<AngleBracketsIcon label="" size="small" />}
				label="Code review"
				size="small"
				variant="blueBold"
			/>
			<p className="truncate text-sm font-semibold text-text">
				{workItem.key} {workItem.title}
			</p>
			<Lozenge className="shrink-0" variant="neutral">
				{workItem.environment}
			</Lozenge>
		</div>
		<div className="flex shrink-0 items-center gap-2">
			{screen === "editor" ? (
				<ButtonGroup aria-label="Review view" variant="connected">
					<Button
						aria-label="View code summary"
						aria-pressed={false}
						onClick={() => onScreenChange("summary")}
						size="icon-compact"
						variant="outline"
					>
						<PageIcon label="" size="small" />
					</Button>
					<Button
						aria-label="View code editor"
						aria-pressed
						onClick={() => onScreenChange("editor")}
						size="icon-compact"
						variant="outline"
					>
						<AngleBracketsIcon label="" size="small" />
					</Button>
					<Button aria-label="Monitor view" size="icon-compact" variant="outline">
						<ScreenIcon label="" size="small" />
					</Button>
				</ButtonGroup>
			) : null}
			<Button>Create pull request</Button>
			<Button aria-label="More actions" size="icon" variant="outline">
				<ShowMoreHorizontalIcon label="" size="small" />
			</Button>
			<Button aria-label="Close code review" shape="circle" size="icon" variant="ghost">
				<CrossIcon label="" size="small" />
			</Button>
		</div>
	</header>
	);
}
