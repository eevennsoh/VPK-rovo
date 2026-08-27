"use client";

import { useState } from "react";
import RefreshIcon from "@atlaskit/icon/core/refresh";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	TWGAppstack,
	type TwgAppstackAnimationDirection,
	type TwgToolSource,
	type TwgToolSourceIconSize,
} from "@/components/ui-custom/twg-appstack";

const SOURCES: TwgToolSource[] = [
	{ id: "jira", label: "Jira", provider: "jira" },
	{ id: "confluence", label: "Confluence", provider: "confluence" },
	{ id: "google-drive", label: "Google Drive", provider: "google-drive" },
	{ id: "bitbucket", label: "Bitbucket", provider: "bitbucket" },
	{ id: "salesforce", label: "Salesforce", provider: "salesforce" },
];

const SIZES: ReadonlyArray<{ size: TwgToolSourceIconSize; label: string }> = [
	{ size: "xxsmall", label: "xxsmall — 16x16" },
	{ size: "xsmall", label: "xsmall — 20x20" },
	{ size: "small", label: "small — 24x24" },
	{ size: "medium", label: "medium — 32x32" },
];

export default function TWGAppstackDemo() {
	const [replayKey, setReplayKey] = useState(0);
	const [direction, setDirection] = useState<TwgAppstackAnimationDirection>("right-to-left");

	const isLeftToRight = direction === "left-to-right";

	return (
		<div className="flex w-full max-w-md flex-col gap-6">
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-2">
					<Switch
						id="twg-appstack-direction"
						checked={isLeftToRight}
						onCheckedChange={(checked) => {
							setDirection(checked ? "left-to-right" : "right-to-left");
							setReplayKey((currentKey) => currentKey + 1);
						}}
						label="Animate left to right"
					/>
					<Label htmlFor="twg-appstack-direction">
						{isLeftToRight ? "Left to right" : "Right to left"}
					</Label>
				</div>
				<Button
					aria-label="Replay TWG app stack animation"
					onClick={() => setReplayKey((currentKey) => currentKey + 1)}
					size="default"
					variant="outline"
				>
					<RefreshIcon label="" size="small" />
					Replay
				</Button>
			</div>
			<div key={replayKey} className="flex flex-col gap-6">
				<div className="flex flex-col gap-2">
					<span className="text-xs font-semibold leading-4 text-text-subtle">Animated</span>
					<TWGAppstack className="justify-start" direction={direction} sources={SOURCES} maxVisible={4} />
				</div>
				<div className="flex flex-col gap-2">
					<span className="text-xs font-semibold leading-4 text-text-subtle">Static</span>
					<TWGAppstack animated={false} className="justify-start" sources={SOURCES.slice(0, 4)} />
				</div>
				<div className="flex flex-col gap-2">
					<span className="text-xs font-semibold leading-4 text-text-subtle">Sizes</span>
					<TWGAppstackDemoSizes />
				</div>
				<div className="flex flex-col gap-2">
					<span className="text-xs font-semibold leading-4 text-text-subtle">Overflow grow</span>
					<TWGAppstackDemoOverflowGrow />
				</div>
			</div>
		</div>
	);
}

export function TWGAppstackDemoStatic() {
	return <TWGAppstack animated={false} className="justify-start" sources={SOURCES.slice(0, 4)} />;
}

export function TWGAppstackDemoOverflow() {
	return <TWGAppstack animated={false} className="justify-start" sources={SOURCES} maxVisible={3} />;
}

function createOverflowSources(hiddenCount: number, visibleCount = 3): TwgToolSource[] {
	const total = visibleCount + hiddenCount;
	return Array.from({ length: total }, (_, index) => {
		const source = SOURCES[index % SOURCES.length];
		return {
			id: `${source.id}-${hiddenCount}-${index}`,
			label: source.label,
			provider: source.provider,
		};
	});
}

export function TWGAppstackDemoOverflowGrow() {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-1.5">
				<span className="text-xs leading-4 text-text-subtlest">+10 — square min-width</span>
				<TWGAppstack
					animated={false}
					className="justify-start"
					maxVisible={3}
					sources={createOverflowSources(10)}
				/>
			</div>
			<div className="flex flex-col gap-1.5">
				<span className="text-xs leading-4 text-text-subtlest">+48 — grows past the tile square</span>
				<TWGAppstack
					animated={false}
					className="justify-start"
					maxVisible={3}
					sources={createOverflowSources(48)}
				/>
			</div>
			<div className="flex flex-col gap-1.5">
				<span className="text-xs leading-4 text-text-subtlest">+100 — three-digit overflow</span>
				<TWGAppstack
					animated={false}
					className="justify-start"
					maxVisible={3}
					sources={createOverflowSources(100)}
				/>
			</div>
		</div>
	);
}

export function TWGAppstackDemoSizes() {
	return (
		<div className="flex flex-col gap-4">
			{SIZES.map(({ size, label }) => (
				<div key={size} className="flex flex-col gap-1.5">
					<span className="text-xs leading-4 text-text-subtlest">{label}</span>
					<TWGAppstack
						animated={false}
						className="justify-start"
						iconSize={size}
						maxVisible={4}
						sources={SOURCES}
					/>
				</div>
			))}
		</div>
	);
}
