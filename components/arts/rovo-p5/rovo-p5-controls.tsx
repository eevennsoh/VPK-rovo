"use client";

import {
	ROVO_P5_DEFAULTS,
	ROVO_P5_SECTIONS,
	type RovoP5Control,
	type RovoP5Params,
} from "@/components/arts/rovo-p5/data/rovo-p5-params";
import type { RovoP5ParamsController } from "@/components/arts/rovo-p5/hooks/use-rovo-p5-params";
import { GUI } from "@/components/utils/gui";

interface RovoP5ControlsProps {
	readonly controller: RovoP5ParamsController;
	readonly reducedMotion: boolean;
	readonly onReset: () => void;
}

function isDisabled(control: RovoP5Control, params: RovoP5Params, reducedMotion: boolean): boolean {
	if (control.motionOnly && reducedMotion) return true;
	if (control.dependsOn && !params[control.dependsOn]) return true;
	// The timeline writes these every frame, so leaving them live would show a
	// value the sketch is not using.
	if (control.directed && params.timeline) return true;
	return false;
}

function renderControl(
	control: RovoP5Control,
	{ params, setNumber, setToggle }: RovoP5ParamsController,
	reducedMotion: boolean,
) {
	const id = `rovo-p5-${control.key}`;
	const disabled = isDisabled(control, params, reducedMotion);

	if (control.kind === "toggle") {
		return (
			<GUI.Toggle
				checked={params[control.key]}
				description={control.description}
				disabled={disabled}
				id={id}
				key={control.key}
				label={control.label}
				onChange={(next) => setToggle(control.key, next)}
				valueKeys={control.key}
			/>
		);
	}

	const shared = {
		description: control.description,
		disabled,
		id,
		label: control.label,
		onChange: (next: number) => setNumber(control.key, next),
		valueKeys: control.key,
	};

	if (control.percent) {
		return (
			<GUI.PercentControl
				{...shared}
				defaultValue={ROVO_P5_DEFAULTS[control.key]}
				key={control.key}
				max={control.max}
				min={control.min}
				step={control.step}
				value={params[control.key]}
			/>
		);
	}

	return (
		<GUI.Control
			{...shared}
			defaultValue={ROVO_P5_DEFAULTS[control.key]}
			key={control.key}
			max={control.max}
			min={control.min}
			step={control.step}
			unit={control.unit}
			value={params[control.key]}
		/>
	);
}

export default function RovoP5Controls({
	controller,
	reducedMotion,
	onReset,
}: RovoP5ControlsProps) {
	return (
		<GUI.Panel
			onPlay={onReset}
			playLabel="Reset all"
			title="Rovo p5"
			values={controller.params}
		>
			{ROVO_P5_SECTIONS.map((section, index) => (
				<GUI.Section borderTop={index > 0} key={section.title} title={section.title}>
					{section.controls.map((control) => renderControl(control, controller, reducedMotion))}
				</GUI.Section>
			))}
		</GUI.Panel>
	);
}
