"use client";

import { useState } from "react";

import {
	PIXEL_LOADER_PATTERN_FAMILIES,
	PixelLoader,
	type PixelLoaderColor,
	type PixelLoaderShape,
	type PixelLoaderSize,
} from "@/components/ui-custom/pixel-loader";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const SIZES: readonly PixelLoaderSize[] = ["small", "medium", "large", "xlarge"];

/** Turns `wave-left-to-right` into `wave left to right` for the tile caption. */
function toCaption(pattern: string): string {
	return pattern.replaceAll("-", " ");
}

/**
 * Browse all 51 patterns at once, with live shape / size / colour controls.
 *
 * Every tile runs its own independent CSS animation, so the patterns stay out
 * of phase with each other — which is what makes the differences in direction
 * and angle readable side by side.
 */
export default function PixelLoaderPlaygroundDemo() {
	const [shape, setShape] = useState<PixelLoaderShape>("square");
	const [size, setSize] = useState<PixelLoaderSize>("xlarge");
	const [rovo, setRovo] = useState(false);

	const color: PixelLoaderColor = rovo ? "rovo" : "default";

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-wrap items-center gap-6 rounded-lg border border-border bg-surface-raised p-4">
				<ToggleGroup
					value={[shape]}
					onValueChange={(value) => {
						const next = value.at(0);
						if (next) {
							setShape(next as PixelLoaderShape);
						}
					}}
					variant="outline"
					size="sm"
				>
					<ToggleGroupItem value="square">Square</ToggleGroupItem>
					<ToggleGroupItem value="dot">Dots</ToggleGroupItem>
				</ToggleGroup>

				<ToggleGroup
					value={[size]}
					onValueChange={(value) => {
						const next = value.at(0);
						if (next) {
							setSize(next as PixelLoaderSize);
						}
					}}
					variant="outline"
					size="sm"
				>
					{SIZES.map((option) => (
						<ToggleGroupItem key={option} value={option}>
							{option}
						</ToggleGroupItem>
					))}
				</ToggleGroup>

				<div className="flex items-center gap-2">
					<Switch id="pixel-loader-rovo" checked={rovo} onCheckedChange={setRovo} />
					<Label htmlFor="pixel-loader-rovo" className="text-sm">
						Rovo spot colours
					</Label>
				</div>
			</div>

			{PIXEL_LOADER_PATTERN_FAMILIES.map((family) => (
				<section key={family.name} className="flex flex-col gap-3">
					<h3 className="text-xs font-semibold tracking-wide text-text-subtlest uppercase">
						{family.name}
					</h3>
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
						{family.patterns.map((pattern) => (
							<div
								key={pattern}
								className="flex min-h-24 flex-col items-center justify-center gap-3 rounded-lg border border-border bg-surface p-3"
							>
								<PixelLoader
									className="text-icon-subtle"
									pattern={pattern}
									shape={shape}
									size={size}
									color={color}
								/>
								<span className="text-center text-[11px] leading-tight text-text-subtlest">
									{toCaption(pattern)}
								</span>
							</div>
						))}
					</div>
				</section>
			))}
		</div>
	);
}
