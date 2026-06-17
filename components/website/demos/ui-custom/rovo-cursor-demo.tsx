"use client";

import { useMemo, useState } from "react";

import { RovoCursor, type RovoCursorState } from "@/components/ui-custom/rovo-cursor";
import { GUI } from "@/components/utils/gui";

const STATE_OPTIONS = [
	{ value: "cursor" as const, label: "cursor" },
	{ value: "painting" as const, label: "painting" },
	{ value: "telepointer" as const, label: "typing" },
	{ value: "typing" as const, label: "talking" },
	{ value: "loading" as const, label: "loading" },
	{ value: "speaking" as const, label: "replying" },
] as const;

export default function RovoCursorDemo() {
	const [state, setState] = useState<RovoCursorState>("cursor");
	const [size, setSize] = useState(16);
	const [animated, setAnimated] = useState(true);

	const config = useMemo(() => ({ state, size, animated }), [state, size, animated]);

	return (
		<div className="grid h-full w-full gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-stretch">
			<div className="flex h-full min-h-[350px] w-full items-center justify-center rounded-lg bg-surface p-12 text-text">
				<RovoCursor state={state} size={size} animated={animated} />
			</div>
			<div className="flex h-full flex-col justify-center pt-6 pr-6">
				<GUI.Panel title="Rovo cursor controls" values={config}>
					<GUI.Select
						id="rovo-cursor-state"
						label="State"
						description="Which animated state to render."
						value={state}
						options={STATE_OPTIONS}
						onChange={setState}
					/>
					<GUI.Control
						id="rovo-cursor-size"
						label="Size"
						description="Glyph height in pixels (width scales per state)."
						value={size}
						defaultValue={16}
						min={12}
						max={96}
						step={1}
						unit="px"
						onChange={setSize}
					/>
					<GUI.Toggle
						id="rovo-cursor-animated"
						label="Animated rainbow"
						description="Rotate the rainbow around the cursor arrow and typing ring."
						checked={animated}
						onChange={setAnimated}
					/>
				</GUI.Panel>
			</div>
		</div>
	);
}
