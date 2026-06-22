"use client";

import { useMemo, useState } from "react";

import { GUI } from "@/components/utils/gui";
import { token } from "@/lib/tokens";

import ChromaticAberration from "./shaders/chromatic-aberration";

export default function ChromaticAberrationDemo() {
	const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
	const [mode, setMode] = useState<"0" | "1" | "2" | "3">("3");
	const [radius, setRadius] = useState(60);
	const [pulse, setPulse] = useState(30);
	const [speed, setSpeed] = useState(0);
	const [swirl, setSwirl] = useState(3);
	const [swirlSpeed, setSwirlSpeed] = useState(0);

	const config = useMemo(
		() => ({ mode: Number(mode), radius, pulse, speed, swirl, swirlSpeed }),
		[mode, radius, pulse, speed, swirl, swirlSpeed],
	);

	return (
		<div className="flex w-full max-w-2xl flex-col" style={{ gap: token("space.400") }}>
			<div
				className="aspect-video w-full overflow-hidden rounded-lg border border-border"
			>
				<ChromaticAberration
					imageSrc={imageSrc}
					mode={Number(mode)}
					radius={radius}
					pulse={pulse}
					speed={speed}
					swirl={swirl}
					swirlSpeed={swirlSpeed}
				/>
			</div>

			<GUI.Panel title="Shader controls" values={config}>
				<GUI.ImageInput
					id="ca-image"
					label="Image"
					value={imageSrc}
					onChange={setImageSrc}
				/>
				<GUI.Select
					id="ca-mode"
					label="Mode"
					value={mode}
					options={[
						{ value: "0", label: "Radial" },
						{ value: "1", label: "Horizontal" },
						{ value: "2", label: "Vertical" },
						{ value: "3", label: "Swirl" },
					]}
					onChange={setMode}
				/>
				<GUI.Control
					id="ca-radius"
					label="Radius"
					value={radius}
					defaultValue={60}
					min={0}
					max={120}
					step={0.5}
					onChange={setRadius}
				/>
				<GUI.Control
					id="ca-pulse"
					label="Pulse"
					value={pulse}
					defaultValue={30}
					min={0}
					max={60}
					step={0.5}
					onChange={setPulse}
				/>
				<GUI.Control
					id="ca-speed"
					label="Speed"
					value={speed}
					defaultValue={0}
					min={0}
					max={5}
					step={0.1}
					onChange={setSpeed}
				/>
				{mode === "3" ? (
					<>
						<GUI.Control
							id="ca-swirl"
							label="Swirl"
							value={swirl}
							defaultValue={3}
							min={0}
							max={10}
							step={0.1}
							onChange={setSwirl}
						/>
						<GUI.Control
							id="ca-swirlSpeed"
							label="Swirl Speed"
							value={swirlSpeed}
							defaultValue={0}
							min={0}
							max={2}
							step={0.01}
							onChange={setSwirlSpeed}
						/>
					</>
				) : null}
			</GUI.Panel>
		</div>
	);
}
