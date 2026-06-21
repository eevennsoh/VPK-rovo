"use client";

import { useMemo, useState } from "react";

import { GUI } from "@/components/utils/gui";
import { token } from "@/lib/tokens";

import Pixels from "./shaders/pixels";

export default function PixelsDemo() {
	const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
	const [pixels, setPixels] = useState(28);
	const [stagger, setStagger] = useState(0);
	const [border, setBorder] = useState(0);
	const [aberration, setAberration] = useState(0);
	const [hueShift, setHueShift] = useState(0);

	const config = useMemo(
		() => ({ pixels, stagger, border, aberration, hueShift }),
		[pixels, stagger, border, aberration, hueShift],
	);

	return (
		<div className="flex flex-col w-full max-w-2xl" style={{ gap: token("space.400") }}>
			<div
				className="w-full aspect-video rounded-lg overflow-hidden border border-border"
			>
				<Pixels
					imageSrc={imageSrc}
					pixels={pixels}
					stagger={stagger}
					border={border}
					aberration={aberration}
					hueShift={hueShift}
				/>
			</div>

			<GUI.Panel title="Shader controls" values={config}>
				<GUI.ImageInput
					id="px-image"
					label="Image"
					value={imageSrc}
					onChange={setImageSrc}
				/>
				<GUI.Control
					id="px-pixels"
					label="Pixels"
					value={pixels}
					defaultValue={28}
					min={8}
					max={128}
					step={1}
					onChange={setPixels}
				/>
				<GUI.Control
					id="px-stagger"
					label="Stagger"
					value={stagger}
					defaultValue={0}
					min={0}
					max={1}
					step={0.01}
					onChange={setStagger}
				/>
				<GUI.Control
					id="px-border"
					label="Border"
					value={border}
					defaultValue={0}
					min={0}
					max={1}
					step={0.01}
					onChange={setBorder}
				/>
				<GUI.Control
					id="px-aberration"
					label="Aberration"
					value={aberration}
					defaultValue={0}
					min={0}
					max={20}
					step={0.5}
					onChange={setAberration}
				/>
				<GUI.Control
					id="px-hueShift"
					label="Hue Shift"
					value={hueShift}
					defaultValue={0}
					min={-1}
					max={1}
					step={0.01}
					onChange={setHueShift}
				/>
			</GUI.Panel>
		</div>
	);
}
