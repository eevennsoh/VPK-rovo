"use client";

import {
	type CSSProperties,
	type HTMLAttributes,
	type ReactNode,
	useCallback,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";

interface ParentSizeState {
	width: number;
	height: number;
	top: number;
	left: number;
}

interface MeasuredParentSizeProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	children: (args: ParentSizeState & {
		ref: HTMLDivElement | null;
		resize: (state: Partial<ParentSizeState>) => void;
	}) => ReactNode;
	initialSize?: Partial<ParentSizeState>;
	parentSizeStyles?: CSSProperties;
}

const DEFAULT_PARENT_SIZE: ParentSizeState = {
	width: 640,
	height: 320,
	top: 0,
	left: 0,
};

const DEFAULT_PARENT_SIZE_STYLES: CSSProperties = {
	width: "100%",
	height: "100%",
};

function readElementSize(node: HTMLDivElement): ParentSizeState {
	const rect = node.getBoundingClientRect();

	return {
		width: rect.width,
		height: rect.height,
		top: rect.top,
		left: rect.left,
	};
}

function isSameSize(a: ParentSizeState, b: ParentSizeState) {
	return a.width === b.width && a.height === b.height && a.top === b.top && a.left === b.left;
}

export function MeasuredParentSize({
	children,
	initialSize,
	parentSizeStyles = DEFAULT_PARENT_SIZE_STYLES,
	...props
}: MeasuredParentSizeProps) {
	const parentRef = useRef<HTMLDivElement | null>(null);
	const [size, setSize] = useState<ParentSizeState>(() => ({
		...DEFAULT_PARENT_SIZE,
		...initialSize,
	}));

	const resize = useCallback((nextSize: Partial<ParentSizeState>) => {
		setSize((current) => {
			const merged = { ...current, ...nextSize };
			return isSameSize(current, merged) ? current : merged;
		});
	}, []);

	useLayoutEffect(() => {
		const node = parentRef.current;
		if (!node) {
			return;
		}

		resize(readElementSize(node));

		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) {
				return;
			}

			const { width, height, top, left } = entry.contentRect;
			resize({ width, height, top, left });
		});

		observer.observe(node);

		return () => {
			observer.disconnect();
		};
	}, [resize]);

	const measured = useMemo(
		() => ({
			...size,
			ref: parentRef.current,
			resize,
		}),
		[resize, size],
	);

	return (
		<div ref={parentRef} style={parentSizeStyles} {...props}>
			{children(measured)}
		</div>
	);
}
