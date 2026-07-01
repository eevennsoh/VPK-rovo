"use client";

import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const progressIndicatorVariants = cva("h-full rounded-full transition-[background-color,width]", {
	variants: {
		variant: {
			default: "bg-bg-neutral-bold",
			success: "bg-success",
			inverse: "bg-foreground",
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

const progressTrackVariants = cva("relative flex h-1.5 w-full items-center overflow-hidden rounded-full", {
	variants: {
		variant: {
			default: "bg-bg-neutral",
			success: "bg-bg-neutral",
			inverse: "bg-bg-neutral",
			transparent: "bg-transparent",
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

type ProgressVariant = "default" | "success" | "inverse" | "transparent";

export interface ProgressProps extends Omit<ProgressPrimitive.Root.Props, "value"> {
	value?: number | null;
	variant?: ProgressVariant;
	isIndeterminate?: boolean;
}

function Progress({ className, children, value, variant = "default", isIndeterminate = false, ...props }: Readonly<ProgressProps>) {
	const indicatorVariant = variant === "transparent" ? "default" : variant;
	return (
		<ProgressPrimitive.Root
			value={isIndeterminate ? null : (value ?? null)}
			data-slot="progress"
			data-variant={variant}
			data-indeterminate={isIndeterminate || undefined}
			className={cn("flex flex-wrap gap-3 group/progress", className)}
			{...props}
		>
			{children}
			<ProgressTrack variant={variant}>
				{isIndeterminate ? (
					<span
						className={cn(
							progressIndicatorVariants({ variant: indicatorVariant }),
							"absolute inset-y-0 w-[40%] animate-progress-indeterminate rounded-full",
						)}
					/>
				) : (
					<ProgressIndicator variant={indicatorVariant} />
				)}
			</ProgressTrack>
		</ProgressPrimitive.Root>
	);
}

interface ProgressTrackProps extends ProgressPrimitive.Track.Props {
	variant?: ProgressVariant;
}

function ProgressTrack({ className, variant = "default", ...props }: Readonly<ProgressTrackProps>) {
	return <ProgressPrimitive.Track className={cn(progressTrackVariants({ variant }), className)} data-slot="progress-track" {...props} />;
}

interface ProgressIndicatorProps extends ProgressPrimitive.Indicator.Props, VariantProps<typeof progressIndicatorVariants> {}

function ProgressIndicator({ className, variant = "default", ...props }: Readonly<ProgressIndicatorProps>) {
	return (
		<ProgressPrimitive.Indicator
			data-slot="progress-indicator"
			className={cn(progressIndicatorVariants({ variant }), className)}
			{...props}
		/>
	);
}

function ProgressLabel({ className, ...props }: ProgressPrimitive.Label.Props) {
	return <ProgressPrimitive.Label className={cn("text-sm font-medium text-text", className)} data-slot="progress-label" {...props} />;
}

function ProgressValue({ className, ...props }: ProgressPrimitive.Value.Props) {
	return <ProgressPrimitive.Value className={cn("ml-auto text-sm tabular-nums text-text-subtle", className)} data-slot="progress-value" {...props} />;
}

// react-doctor-disable-next-line react-doctor/only-export-components -- This component module intentionally exports colocated non-component API used by consumers.
export { Progress, ProgressTrack, ProgressIndicator, ProgressLabel, ProgressValue, progressIndicatorVariants, progressTrackVariants, type ProgressTrackProps, type ProgressIndicatorProps };
