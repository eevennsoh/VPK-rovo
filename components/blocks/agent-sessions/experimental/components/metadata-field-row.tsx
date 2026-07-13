"use client";

import type { ReactNode } from "react";

interface MetadataFieldRowProps {
	label: string;
	children: ReactNode;
}

/**
 * A single label / control row for the metadata rail. Adapted from the standard
 * work-item modal `DetailRow`: a fixed 126px label column beside a flexible
 * control. Kept generic so any metadata control can drop into the slot.
 */
export function MetadataFieldRow({ label, children }: Readonly<MetadataFieldRowProps>) {
	return (
		<div className="flex items-center gap-2 py-1">
			<span className="flex w-[126px] shrink-0 items-center text-sm font-medium text-text-subtlest">
				{label}
			</span>
			<div className="min-w-0 flex-1">{children}</div>
		</div>
	);
}
