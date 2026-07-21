"use client";

import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import FilterIcon from "@atlaskit/icon/core/filter";
import LayoutOneColumnIcon from "@atlaskit/icon/core/layout-one-column";
import LayoutTwoColumnsIcon from "@atlaskit/icon/core/layout-two-columns";
import SearchIcon from "@atlaskit/icon/core/search";
import SettingsIcon from "@atlaskit/icon/core/settings";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";

import type { DiffLayout } from "../../data/types";

interface SummaryToolbarProps {
	layout: DiffLayout;
	searchQuery: string;
	onLayoutChange: (layout: DiffLayout) => void;
	onSearchQueryChange: (query: string) => void;
}

export function SummaryToolbar({
	layout,
	searchQuery,
	onLayoutChange,
	onSearchQueryChange,
}: Readonly<SummaryToolbarProps>) {
	return (
		<div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-3">
			<label className="relative block w-[180px]">
				<span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-icon-subtle">
					<SearchIcon label="" size="small" />
				</span>
				<Input
					aria-label="Search changed files"
					className="pl-8"
					onChange={(event) => onSearchQueryChange(event.target.value)}
					placeholder="Search"
					value={searchQuery}
				/>
			</label>
			<Button variant="outline">
				<FilterIcon data-icon="inline-start" label="" size="small" />
				Filter
				<ChevronDownIcon data-icon="inline-end" label="" size="small" />
			</Button>
			<div className="ml-auto flex items-center gap-2">
				<ButtonGroup aria-label="Summary diff layout" variant="connected">
					<Button
						aria-label="Unified diff layout"
						aria-pressed={layout === "unified"}
						onClick={() => onLayoutChange("unified")}
						size="icon-compact"
						variant="outline"
					>
						<LayoutOneColumnIcon label="" size="small" />
					</Button>
					<Button
						aria-label="Split diff layout"
						aria-pressed={layout === "split"}
						onClick={() => onLayoutChange("split")}
						size="icon-compact"
						variant="outline"
					>
						<LayoutTwoColumnsIcon label="" size="small" />
					</Button>
				</ButtonGroup>
				<Button aria-label="Diff settings" size="icon-compact" variant="outline">
					<SettingsIcon label="" size="small" />
				</Button>
			</div>
		</div>
	);
}
