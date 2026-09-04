"use client";

import {
	createContext,
	use,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
	type RefObject,
} from "react";

import {
	CREATE_WORK_ITEM_PROXIMITY_HOVER_AREA_PX,
	resolveExclusiveProximityWinner,
} from "../lib/create-work-item-exclusive-proximity";

interface ExclusiveCreateWellEntry {
	getRect: () => { bottom: number; left: number; right: number; top: number } | null;
	id: string;
}

interface ExclusiveCreateWellProximityValue {
	register: (id: string, getRect: ExclusiveCreateWellEntry["getRect"]) => () => void;
	winnerId: string | null;
}

const ExclusiveCreateWellProximityContext = createContext<ExclusiveCreateWellProximityValue | null>(null);

export function ExclusiveCreateWellProximityProvider({
	children,
	hoverArea = CREATE_WORK_ITEM_PROXIMITY_HOVER_AREA_PX,
}: Readonly<{
	children: ReactNode;
	hoverArea?: number;
}>) {
	const wellsRef = useRef<ExclusiveCreateWellEntry[]>([]);
	const [winnerId, setWinnerId] = useState<string | null>(null);

	const register = useCallback((id: string, getRect: ExclusiveCreateWellEntry["getRect"]) => {
		const entry = { getRect, id };
		wellsRef.current = [...wellsRef.current, entry];
		return () => {
			wellsRef.current = wellsRef.current.filter((well) => well !== entry);
		};
	}, []);

	useEffect(() => {
		if (typeof document === "undefined") return;

		const handleMove = (event: PointerEvent) => {
			if (event.pointerType === "touch") {
				setWinnerId((current) => (current === null ? current : null));
				return;
			}

			const wells = wellsRef.current.flatMap((well) => {
				const rect = well.getRect();
				if (!rect || rect.right <= rect.left || rect.bottom <= rect.top) return [];
				return [{ id: well.id, rect }];
			});
			const nextWinnerId = resolveExclusiveProximityWinner(
				{ x: event.clientX, y: event.clientY },
				wells,
				hoverArea,
			);
			setWinnerId((current) => (current === nextWinnerId ? current : nextWinnerId));
		};

		document.addEventListener("pointermove", handleMove, { passive: true });
		return () => {
			document.removeEventListener("pointermove", handleMove);
			setWinnerId(null);
		};
	}, [hoverArea]);

	const value = useMemo(
		() => ({ register, winnerId }),
		[register, winnerId],
	);

	return (
		<ExclusiveCreateWellProximityContext value={value}>
			{children}
		</ExclusiveCreateWellProximityContext>
	);
}

export function useExclusiveCreateWellProximity(
	id: string,
	targetRef: RefObject<HTMLElement | null>,
): boolean {
	const coordinator = use(ExclusiveCreateWellProximityContext);

	useEffect(() => {
		if (!coordinator) return;
		return coordinator.register(id, () => targetRef.current?.getBoundingClientRect() ?? null);
	}, [coordinator, id, targetRef]);

	return coordinator ? coordinator.winnerId === id : true;
}
