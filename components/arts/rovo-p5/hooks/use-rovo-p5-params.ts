"use client";

import { useCallback, useMemo, useReducer } from "react";

import {
	clampRovoP5Param,
	ROVO_P5_DEFAULTS,
	type RovoP5NumericKey,
	type RovoP5Params,
	type RovoP5ToggleKey,
} from "@/components/arts/rovo-p5/data/rovo-p5-params";

type RovoP5Action =
	| { type: "set-number"; key: RovoP5NumericKey; value: number }
	| { type: "set-toggle"; key: RovoP5ToggleKey; value: boolean }
	| { type: "reset" };

function reducer(state: RovoP5Params, action: RovoP5Action): RovoP5Params {
	switch (action.type) {
		case "set-number": {
			const value = clampRovoP5Param(action.key, action.value);
			return state[action.key] === value ? state : { ...state, [action.key]: value };
		}
		case "set-toggle":
			return state[action.key] === action.value ? state : { ...state, [action.key]: action.value };
		case "reset":
			return ROVO_P5_DEFAULTS;
	}
}

export interface RovoP5ParamsController {
	readonly params: RovoP5Params;
	readonly setNumber: (key: RovoP5NumericKey, value: number) => void;
	readonly setToggle: (key: RovoP5ToggleKey, value: boolean) => void;
	readonly reset: () => void;
}

export function useRovoP5Params(): RovoP5ParamsController {
	const [params, dispatch] = useReducer(reducer, ROVO_P5_DEFAULTS);

	const setNumber = useCallback((key: RovoP5NumericKey, value: number) => {
		dispatch({ type: "set-number", key, value });
	}, []);

	const setToggle = useCallback((key: RovoP5ToggleKey, value: boolean) => {
		dispatch({ type: "set-toggle", key, value });
	}, []);

	const reset = useCallback(() => {
		dispatch({ type: "reset" });
	}, []);

	return useMemo(
		() => ({ params, setNumber, setToggle, reset }),
		[params, setNumber, setToggle, reset],
	);
}
