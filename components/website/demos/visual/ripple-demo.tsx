"use client";

import { useMemo, useState } from "react";

import { GUI } from "@/components/utils/gui";
import { token } from "@/lib/tokens";

import Ripple from "./shaders/ripple";

const DEFAULT_RADIUS = 0.1;
const DEFAULT_FADE = 0.25;
const DEFAULT_SOFTNESS = 0.5;
const DEFAULT_STRENGTH = 0.5;
const DEFAULT_DECAY = 0.5;
const DEFAULT_DISPLACE = 0.03;
const DEFAULT_DISPERSION = 0;
const DEFAULT_CLICK = true;
const DEFAULT_SPEED = 1;

export default function RippleDemo() {
	const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
	const [radius, setRadius] = useState(DEFAULT_RADIUS);
	const [fade, setFade] = useState(DEFAULT_FADE);
	const [softness, setSoftness] = useState(DEFAULT_SOFTNESS);
	const [strength, setStrength] = useState(DEFAULT_STRENGTH);
	const [decay, setDecay] = useState(DEFAULT_DECAY);
	const [displace, setDisplace] = useState(DEFAULT_DISPLACE);
	const [dispersion, setDispersion] = useState(DEFAULT_DISPERSION);
	const [click, setClick] = useState(DEFAULT_CLICK);
	const [speed, setSpeed] = useState(DEFAULT_SPEED);

	const config = useMemo(
		() => ({ imageSrc, radius, fade, softness, strength, decay, displace, dispersion, click, speed }),
		[click, decay, displace, dispersion, fade, imageSrc, radius, softness, speed, strength],
	);

	return (
		<div className="flex w-full max-w-2xl flex-col" style={{ gap: token("space.400") }}>
			<div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-surface">
				<Ripple
					imageSrc={imageSrc}
					radius={radius}
					fade={fade}
					softness={softness}
					strength={strength}
					decay={decay}
					displace={displace}
					dispersion={dispersion}
					click={click}
					speed={speed}
				/>
			</div>

			<GUI.Panel title="Shader controls" values={config}>
				<GUI.ImageInput
					id="ripple-image"
					label="Image"
					value={imageSrc}
					placeholder="Default public image"
					onChange={setImageSrc}
				/>
				<GUI.Control
					id="ripple-radius"
					label="Radius"
					value={radius}
					defaultValue={DEFAULT_RADIUS}
					min={0.01}
					max={0.5}
					step={0.01}
					onChange={setRadius}
				/>
				<GUI.Control
					id="ripple-fade"
					label="Fade"
					value={fade}
					defaultValue={DEFAULT_FADE}
					min={0}
					max={1}
					step={0.01}
					onChange={setFade}
				/>
				<GUI.Control
					id="ripple-softness"
					label="Softness"
					value={softness}
					defaultValue={DEFAULT_SOFTNESS}
					min={0}
					max={1}
					step={0.01}
					onChange={setSoftness}
				/>
				<GUI.Control
					id="ripple-strength"
					label="Strength"
					value={strength}
					defaultValue={DEFAULT_STRENGTH}
					min={0}
					max={1}
					step={0.01}
					onChange={setStrength}
				/>
				<GUI.Control
					id="ripple-decay"
					label="Decay"
					value={decay}
					defaultValue={DEFAULT_DECAY}
					min={0}
					max={1}
					step={0.01}
					onChange={setDecay}
				/>
				<GUI.Control
					id="ripple-displace"
					label="Displace"
					value={displace}
					defaultValue={DEFAULT_DISPLACE}
					min={0}
					max={0.12}
					step={0.001}
					onChange={setDisplace}
				/>
				<GUI.Control
					id="ripple-dispersion"
					label="Dispersion"
					value={dispersion}
					defaultValue={DEFAULT_DISPERSION}
					min={0}
					max={1}
					step={0.01}
					onChange={setDispersion}
				/>
				<GUI.Toggle
					id="ripple-click"
					label="Click"
					checked={click}
					onChange={setClick}
				/>
				<GUI.Control
					id="ripple-speed"
					label="Speed"
					value={speed}
					defaultValue={DEFAULT_SPEED}
					min={0.05}
					max={3}
					step={0.01}
					disabled={!click}
					onChange={setSpeed}
				/>
			</GUI.Panel>
		</div>
	);
}
