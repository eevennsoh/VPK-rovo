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
} from "@/components/ui-custom/twg-appstack";

const SOURCES: TwgToolSource[] = [
	{ id: "jira", label: "Jira", provider: "jira" },
	{ id: "confluence", label: "Confluence", provider: "confluence" },
	{ id: "google-drive", label: "Google Drive", provider: "google-drive" },
	{ id: "bitbucket", label: "Bitbucket", provider: "bitbucket" },
	{ id: "salesforce", label: "Salesforce", provider: "salesforce" },
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
