import type { JSX, RefObject } from "react";

import { cn } from "@/lib/utils";

export interface GalleryTitleLinesProps {
	title: string;
	className?: string;
	textRef?: RefObject<HTMLSpanElement | null>;
}

export function GalleryTitleLines({
	title,
	className,
	textRef,
}: Readonly<GalleryTitleLinesProps>): JSX.Element {
	return (
		<span ref={textRef} className={cn("block w-full font-semibold leading-[1.02] tracking-tight", className)}>
			{title.split(/\s+/).map((word, index) => (
				<span key={index} className="block">
					{word}
				</span>
			))}
		</span>
	);
}
