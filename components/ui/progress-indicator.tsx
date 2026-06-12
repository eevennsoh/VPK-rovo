import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const progressIndicatorVariants = cva("flex items-center", {
	variants: {
		size: {
			sm: "gap-1",
			md: "gap-2",
			lg: "gap-2",
		},
	},
	defaultVariants: {
		size: "md",
	},
});

const dotSizeMap = {
	sm: "size-1",
	md: "size-2",
	lg: "size-3",
} as const;

const selectedVariantMap = {
	default: "bg-bg-neutral-bold",
	primary: "bg-primary",
	discovery: "bg-discovery",
	inverted: "bg-text-inverse",
} as const;

const unselectedVariantMap = {
	default: "bg-bg-neutral",
	primary: "bg-bg-neutral",
	discovery: "bg-bg-neutral",
	inverted: "bg-text-inverse opacity-(--opacity-disabled)",
} as const;

export interface ProgressIndicatorProps extends React.ComponentProps<"ol">, VariantProps<typeof progressIndicatorVariants> {
	/** Total number of steps. */
	steps: number;
	/** Current active step (0-indexed). */
	currentStep: number;
	/** Visual appearance of the indicator dots. */
	variant?: "default" | "primary" | "discovery" | "inverted";
}

function ProgressIndicator({ steps, currentStep, variant = "default", size = "md", className, ...props }: Readonly<ProgressIndicatorProps>) {
	const resolvedSize = size ?? "md";

	return (
		<ol data-slot="progress-indicator" aria-label="Progress" className={cn(progressIndicatorVariants({ size }), className)} {...props}>
			{Array.from({ length: steps }, (_, index) => {
				const isSelected = index === currentStep;

				return (
					<li
						key={index}
						aria-current={isSelected ? "step" : undefined}
						className={cn("rounded-full transition-colors", dotSizeMap[resolvedSize], isSelected ? selectedVariantMap[variant] : unselectedVariantMap[variant])}
					/>
				);
			})}
		</ol>
	);
}

// react-doctor-disable-next-line react-doctor/only-export-components -- This component module intentionally exports colocated non-component API used by consumers.
export { ProgressIndicator, progressIndicatorVariants };
