"use client";

import { useMemo, useState } from "react";

import { GUI } from "@/components/utils/gui";
import { token } from "@/lib/tokens";

import Truchet from "./shaders/truchet";

const DEFAULT_BACKGROUND = "#FFFFFF";

export default function TruchetDemo() {
	const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
	const [cells, setCells] = useState(53);
	const [thickness, setThickness] = useState(0.05);
	const [invert, setInvert] = useState(true);
	const [background, setBackground] = useState(DEFAULT_BACKGROUND);

	const config = useMemo(
		() => ({ cells, thickness, invert, background }),
		[cells, thickness, invert, background],
	);

	return (
		<div className="flex flex-col w-full max-w-2xl" style={{ gap: token("space.400") }}>
			<div
				className="w-full aspect-video rounded-lg overflow-hidden border border-border"
			>
				<Truchet
					imageSrc={imageSrc}
					cells={cells}
					thickness={thickness}
					invert={invert}
					background={background}
				/>
			</div>

			<GUI.Panel title="Shader controls" values={config}>
				<GUI.ImageInput
					id="truchet-image"
					label="Image"
					value={imageSrc}
					onChange={setImageSrc}
				/>
				<GUI.Control
					id="tr-cells"
					label="Cells"
					value={cells}
					defaultValue={53}
					min={8}
					max={128}
					step={1}
					onChange={setCells}
				/>
				<GUI.Control
					id="tr-thickness"
					label="Thickness"
					value={thickness}
					defaultValue={0.05}
					min={0.05}
					max={0.5}
					step={0.01}
					onChange={setThickness}
				/>
				<GUI.Select
					id="tr-invert"
					label="Invert"
					value={invert ? "yes" : "no"}
					options={[
						{ value: "yes", label: "Yes" },
						{ value: "no", label: "No" },
					]}
					onChange={(v) => setInvert(v === "yes")}
				/>
				<GUI.ColorInput
					id="tr-background"
					label="Background"
					value={background}
					defaultValue={DEFAULT_BACKGROUND}
					onChange={setBackground}
				/>
			</GUI.Panel>
		</div>
	);
}
