import type { CSSProperties, ReactNode } from "react";

import type { CornerRadii } from "./geometry";
import { GooeyItemPrimitive, type DissolveOptions } from "./item-core";
import type { Transition } from "./spring";
import {
	resolveDissolveTuning,
	resolveMorphTuning,
	resolveMoveTuning,
	type MorphTuning,
	type MoveTuning,
} from "./tuning";

export type GooeyEffect = "morph" | "move";

export interface GooeyItemProps {
	effect?: GooeyEffect;
	morph?: MorphTuning;
	move?: MoveTuning;
	dissolve?: boolean | number | DissolveOptions;
	x?: number;
	y?: number;
	scale?: number;
	transition?: Transition;
	delay?: number;
	observe?: boolean;
	radius?: number | CornerRadii;
	className?: string;
	style?: CSSProperties;
	children?: ReactNode;
}

/** Public item adapter from normalized Gooey tuning to the raw observer. */
export function GooeyItem(props: Readonly<GooeyItemProps>) {
	const { effect = "morph", morph, move, dissolve, observe, ...rest } = props;

	if (effect === "move") {
		if (process.env.NODE_ENV !== "production" && dissolve !== undefined && dissolve !== false) {
			console.warn(
				"[Gooey] `dissolve` is ignored with effect=\"move\": the melt follows "
				+ "the element while the liquid lags on its spring, so the two would "
				+ "visibly disagree. Use it on a morph item.",
			);
		}
		return <GooeyItemPrimitive {...rest} observe effect="move" move={resolveMoveTuning(move)} />;
	}

	const advanced = morph?.advanced;
	const shape = Boolean(morph?.shape);
	const wantsDissolve = dissolve !== undefined && dissolve !== false;
	const contactBlur = wantsDissolve
		? typeof dissolve === "object"
			? { ...resolveDissolveTuning(true), ...dissolve }
			: resolveDissolveTuning(dissolve)
		: undefined;
	const evolve = shape
		? { ...resolveMorphTuning(morph), ...advanced?.evolve }
		: undefined;

	return (
		<GooeyItemPrimitive
			{...rest}
			observe={observe || shape || Boolean(contactBlur) || undefined}
			effect={shape ? "evolve" : undefined}
			evolve={evolve}
			contactBlur={contactBlur}
			blobInset={advanced?.blobInset}
			bridgeGrow={advanced?.bridgeGrow}
		/>
	);
}
