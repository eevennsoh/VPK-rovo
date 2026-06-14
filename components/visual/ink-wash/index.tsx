"use client";

import {
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
	type ComponentProps,
	type Ref,
} from "react";

import { cn } from "@/lib/utils";

import { InkWashEngine } from "./engine";
import {
	type InkWashConfig,
	type InkWashPresetId,
	getInkWashPreset,
	mergeInkWashConfig,
} from "./data";

export interface InkWashHandle {
	replay: () => void;
	clear: () => void;
	fix: () => void;
	savePNG: () => void;
}

export interface InkWashProps extends Omit<ComponentProps<"div">, "children" | "ref"> {
	config?: Partial<InkWashConfig>;
	presetId?: InkWashPresetId | string;
	height?: number | string;
	canvasLabel?: string;
	ref?: Ref<InkWashHandle>;
}

function formatCssSize(value: number | string): string {
	return typeof value === "number" ? `${value}px` : value;
}

export function InkWash({
	config,
	presetId = "landscape",
	height = 460,
	canvasLabel = "Interactive Ink Wash canvas",
	className,
	style,
	ref,
	...props
}: Readonly<InkWashProps>) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const engineRef = useRef<InkWashEngine | null>(null);
	const [error, setError] = useState<string | null>(null);
	const preset = useMemo(() => getInkWashPreset(presetId), [presetId]);
	const resolvedConfig = useMemo(
		() => mergeInkWashConfig(preset.config, config),
		[config, preset],
	);

	useImperativeHandle(ref, () => ({
		replay: () => engineRef.current?.replay(),
		clear: () => engineRef.current?.clear(),
		fix: () => engineRef.current?.fix(),
		savePNG: () => engineRef.current?.savePNG(),
	}), []);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		try {
			const engine = new InkWashEngine(canvas, {
				config: resolvedConfig,
				preset,
			});
			engineRef.current = engine;
			setError(null);
			const resizeObserver = new ResizeObserver(() => engine.resize());
			resizeObserver.observe(canvas);
			return () => {
				resizeObserver.disconnect();
				engine.destroy();
				if (engineRef.current === engine) engineRef.current = null;
			};
		} catch (caught) {
			const message = caught instanceof Error ? caught.message : "Ink Wash failed to start.";
			setError(message);
			return undefined;
		}
		// Engine creation is intentionally keyed by preset only. Continuous config
		// updates flow through the lighter effect below.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [preset]);

	useEffect(() => {
		engineRef.current?.updateConfig(resolvedConfig);
	}, [resolvedConfig]);

	return (
		<div
			className={cn(
				"relative min-w-0 overflow-hidden rounded-lg border border-border bg-surface",
				className,
			)}
			style={{
				height: formatCssSize(height),
				...style,
			}}
			data-ink-wash-root="true"
			{...props}
		>
			<canvas
				ref={canvasRef}
				aria-label={canvasLabel}
				className="block size-full touch-none bg-[#f1efe8]"
				data-ink-wash-canvas="true"
			/>
			{error ? (
				<div
					className="absolute inset-0 flex items-center justify-center bg-surface px-6 text-center text-sm text-text-subtle"
					data-ink-wash-fallback="true"
				>
					{error}
				</div>
			) : null}
		</div>
	);
}

export {
	DEFAULT_INK_WASH_CONFIG,
	INK_WASH_CONTROL_RANGES,
	INK_WASH_MODE_OPTIONS,
	INK_WASH_PRESETS,
	INK_WASH_PRESET_OPTIONS,
	INK_WASH_QUALITY_OPTIONS,
	INK_WASH_VIEW_OPTIONS,
	type InkWashConfig,
	type InkWashMode,
	type InkWashParams,
	type InkWashPresetId,
	type InkWashQuality,
	type InkWashView,
	getInkWashPreset,
	mergeInkWashConfig,
} from "./data";

export default InkWash;
