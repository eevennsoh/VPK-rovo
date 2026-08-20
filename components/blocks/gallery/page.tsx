"use client";

import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronLeftIcon from "@atlaskit/icon/core/chevron-left";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import { useState } from "react";

import { Gallery, DEMO_GALLERY_ITEMS } from "@/components/blocks/gallery";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// The Gallery demo doubles as a live reference for the props around the top bar:
//   - `title`            → the label at the far left of the control row
//   - `topBarCenter`     → the full connected step group at large viewports
//   - `topBarCenterCompact` → a section dropdown with prev/next steppers below
//                             the large breakpoint
//   - `showTopBarBorder` → optional 1px semantic divider under the bar; omitted
//                          here (defaults to false) so the header is borderless
//   - `stagePosition`    → "center" so a single-line placeholder sits in the
//                          true vertical center of the stage instead of hugging
//                          the top
// The right-side controls (reset / theme / open-close) are built in.

// A small set of named sections the demo dropdown can jump between, each mapping
// to a screen index — a stand-in for a real experience's section runs.
const DEMO_SECTIONS = [
	{ label: "Terminal", startIndex: 0, count: 4 },
	{ label: "Kanban", startIndex: 4, count: 1 },
] as const;
const DEMO_SCREEN_COUNT = DEMO_SECTIONS.reduce((total, section) => total + section.count, 0);

/** Full section treatment used when the Gallery header has enough horizontal room. */
function DemoSectionControls({
	index,
	onIndexChange,
}: Readonly<{
	index: number;
	onIndexChange: (nextIndex: number) => void;
}>): React.ReactElement {
	const activeSection = activeSectionIndex(index);

	return (
		<ButtonGroup
			aria-label="Open a gallery demo section"
			className="[&>[data-slot]~[data-slot]]:-ml-px [&>[data-slot]~[data-slot]]:border-l!"
			variant="connected"
		>
			{DEMO_SECTIONS.map((section, sectionIndex) => (
				<Button
					aria-pressed={activeSection === sectionIndex}
					className="aria-pressed:z-10"
					key={section.label}
					onClick={() => onIndexChange(section.startIndex)}
					size="compact"
					type="button"
					variant="outline"
				>
					{activeSection === sectionIndex ? sectionLabel(index) : section.label}
				</Button>
			))}
		</ButtonGroup>
	);
}

/** Position label like `Terminal · 2 of 4`, counted within the active section. */
function sectionLabel(index: number): string {
	const section = DEMO_SECTIONS.find(
		(candidate) => index >= candidate.startIndex && index < candidate.startIndex + candidate.count,
	);
	if (!section) return `Screen ${index + 1} of ${DEMO_SCREEN_COUNT}`;
	if (section.count === 1) return section.label;
	// U+00B7 MIDDLE DOT between the section name and its position.
	return `${section.label} \u00b7 ${index - section.startIndex + 1} of ${section.count}`;
}

function activeSectionIndex(index: number): number {
	const found = DEMO_SECTIONS.findIndex(
		(candidate) => index >= candidate.startIndex && index < candidate.startIndex + candidate.count,
	);
	return found === -1 ? 0 : found;
}

/**
 * Section-jump dropdown + prev/next stepper rendered in the top bar's center
 * slot. The text link keeps a chevron beside it; opening the menu jumps to a
 * section's first screen. The menu portals to the document, which inherits the
 * demo's `data-color-mode`, so it follows the demo's light/dark theme.
 */
function DemoScreenControls({
	index,
	onIndexChange,
}: Readonly<{
	index: number;
	onIndexChange: (nextIndex: number) => void;
}>): React.ReactElement {
	const canPrev = index > 0;
	const canNext = index < DEMO_SCREEN_COUNT - 1;
	const activeSection = activeSectionIndex(index);

	return (
		<div className="flex items-center gap-2 text-sm text-text">
			<Button
				type="button"
				variant="outline"
				size="icon-compact"
				aria-label="Previous screen"
				onClick={() => onIndexChange(Math.max(index - 1, 0))}
				disabled={!canPrev}
			>
				<ChevronLeftIcon label="" size="small" />
			</Button>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<button
							type="button"
							className="flex items-center gap-1 rounded-sm px-1 py-0.5 tabular-nums text-text outline-none hover:text-text-subtle focus-visible:ring-2 focus-visible:ring-ring/50"
							aria-label="Jump to section"
						/>
					}
				>
					<span>{sectionLabel(index)}</span>
					<ChevronDownIcon label="" size="small" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="center">
					{DEMO_SECTIONS.map((section, sectionIndex) => (
						<DropdownMenuItem
							key={section.label}
							selected={sectionIndex === activeSection}
							onSelect={() => onIndexChange(section.startIndex)}
						>
							{section.label}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
			<Button
				type="button"
				variant="outline"
				size="icon-compact"
				aria-label="Next screen"
				onClick={() => onIndexChange(Math.min(index + 1, DEMO_SCREEN_COUNT - 1))}
				disabled={!canNext}
			>
				<ChevronRightIcon label="" size="small" />
			</Button>
		</div>
	);
}

export default function Page(): React.ReactElement {
	// A tiny screen index drives both responsive center-slot variations so the
	// full step group and compact dropdown/steppers stay in sync.
	const [screen, setScreen] = useState(0);

	return (
		// Definite height: Gallery is `h-full`, so a `min-h-*` parent would let it
		// collapse to content height.
		<div className="relative h-dvh w-full bg-surface">
			<Gallery
				items={DEMO_GALLERY_ITEMS}
				title="Gallery"
				stagePosition="center"
				topBarCenter={<DemoSectionControls index={screen} onIndexChange={setScreen} />}
				topBarCenterCompact={(
					<DemoScreenControls index={screen} onIndexChange={setScreen} />
				)}
				renderSelectedItem={(item) => (
					<h1 className="text-center font-semibold text-4xl tracking-tight text-text sm:text-6xl">
						{item.title}
					</h1>
				)}
			/>
		</div>
	);
}
