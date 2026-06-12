import { useRef, type RefObject } from "react";

export function useLazyRef<T>(initializer: () => T): RefObject<T> {
	const ref = useRef<T | null>(null);
	if (ref.current === null) {
		ref.current = initializer();
	}
	return ref as RefObject<T>;
}
