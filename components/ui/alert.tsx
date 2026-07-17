import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
	"grid w-full rounded-md text-left [word-break:break-word] group/alert has-[>[data-slot=icon]]:grid-cols-[auto_1fr] has-[>[data-slot=icon]]:items-start has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:items-start [&>[data-slot=icon]]:self-center [&>svg]:self-center has-[>[data-slot=alert-description]]:[&>[data-slot=icon]]:self-start has-[>[data-slot=alert-description]]:[&>svg]:self-start has-[>[data-slot=alert-action]]:[&>[data-slot=icon]]:self-start has-[>[data-slot=alert-action]]:[&>svg]:self-start",
	{
		variants: {
			variant: {
				default:
					"bg-bg-information text-text [&>[data-slot=icon]]:text-icon-information [&>svg]:text-icon-information [&_a]:text-link [&_a]:underline-offset-3 [&_a:hover]:underline",
				info:
					"bg-bg-information text-text [&>[data-slot=icon]]:text-icon-information [&>svg]:text-icon-information [&_a]:text-link [&_a]:underline-offset-3 [&_a:hover]:underline",
				warning:
					"bg-bg-warning text-text [&>[data-slot=icon]]:text-icon-warning [&>svg]:text-icon-warning [&_a]:text-link [&_a]:underline-offset-3 [&_a:hover]:underline",
				success:
					"bg-bg-success text-text [&>[data-slot=icon]]:text-icon-success [&>svg]:text-icon-success [&_a]:text-link [&_a]:underline-offset-3 [&_a:hover]:underline",
				discovery:
					"bg-bg-discovery text-text [&>[data-slot=icon]]:text-icon-discovery [&>svg]:text-icon-discovery [&_a]:text-link [&_a]:underline-offset-3 [&_a:hover]:underline",
				danger:
					"bg-bg-danger text-text [&>[data-slot=icon]]:text-icon-danger [&>svg]:text-icon-danger [&_a]:text-link [&_a]:underline-offset-3 [&_a:hover]:underline",
				error:
					"bg-bg-danger text-text [&>[data-slot=icon]]:text-icon-danger [&>svg]:text-icon-danger [&_a]:text-link [&_a]:underline-offset-3 [&_a:hover]:underline",
				announcement:
					"bg-bg-neutral-bold text-text-inverse [&>[data-slot=icon]]:text-icon-inverse [&>svg]:text-icon-inverse [&_a]:text-text-inverse [&_a]:underline-offset-3 [&_a:hover]:underline",
				destructive:
					"bg-bg-danger text-text [&>[data-slot=icon]]:text-icon-danger [&>svg]:text-icon-danger [&_a]:text-link [&_a]:underline-offset-3 [&_a:hover]:underline",
			},
			size: {
				// Default: 16px padding, 14px/20px text, 16px icon, 16px column gap.
				default:
					"gap-y-2 p-4 text-[14px]/[20px] has-[>[data-slot=icon]]:gap-x-4 has-[>svg]:gap-x-4 [&>[data-slot=icon]>svg:not([class*='size-'])]:size-4 [&>svg:not([class*='size-'])]:size-4 has-[>[data-slot=alert-description]]:[&>[data-slot=icon]]:mt-0.5 has-[>[data-slot=alert-description]]:[&>svg]:mt-0.5",
				// Small: 12px padding, 12px/16px text, 12px icon, 8px column gap.
				small:
					"gap-y-1 p-3 text-[12px]/[16px] has-[>[data-slot=icon]]:gap-x-2 has-[>svg]:gap-x-2 [&>[data-slot=icon]>svg:not([class*='size-'])]:size-3 [&>svg:not([class*='size-'])]:size-3",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	}
)

interface AlertProps
	extends React.ComponentProps<"div">,
		VariantProps<typeof alertVariants> {}

function Alert({ className, variant, size, ...props }: Readonly<AlertProps>) {
	// Gate `role="alert"` so only urgent variants trigger an immediate SR
	// announcement. Informational/discovery/announcement variants use
	// `status` + polite to avoid interrupting the user.
	const isUrgent =
		variant === "warning" ||
		variant === "danger" ||
		variant === "error" ||
		variant === "destructive"

	return (
		<div
			data-slot="alert"
			data-size={size ?? "default"}
			role={isUrgent ? "alert" : "status"}
			aria-live={isUrgent ? "assertive" : "polite"}
			className={cn(alertVariants({ variant, size }), className)}
			{...props}
		/>
	)
}

function AlertTitle({ className, ...props }: Readonly<React.ComponentProps<"div">>) {
	return (
		<div
			data-slot="alert-title"
			className={cn(
				"text-sm/5 font-semibold group-data-[size=small]/alert:text-[12px]/[16px] group-has-[>[data-slot=icon]]/alert:col-start-2 group-has-[>svg]/alert:col-start-2",
				className
			)}
			{...props}
		/>
	)
}

function AlertDescription({
	className,
	...props
}: Readonly<React.ComponentProps<"div">>) {
	return (
		<div
			data-slot="alert-description"
			className={cn(
				"text-inherit group-has-[>[data-slot=icon]]/alert:col-start-2 group-has-[>svg]/alert:col-start-2 [&_p:not(:last-child)]:mb-2",
				className
			)}
			{...props}
		/>
	)
}

function AlertAction({ className, ...props }: Readonly<React.ComponentProps<"div">>) {
	return (
		<div
			data-slot="alert-action"
			className={cn(
				"mt-1 flex flex-wrap items-center gap-2 text-[14px]/[20px] group-data-[size=small]/alert:text-[12px]/[16px] group-has-[>[data-slot=icon]]/alert:col-start-2 group-has-[>svg]/alert:col-start-2",
				className
			)}
			{...props}
		/>
	)
}

// react-doctor-disable-next-line react-doctor/only-export-components -- This component module intentionally exports colocated non-component API used by consumers.
export { Alert, AlertTitle, AlertDescription, AlertAction, alertVariants, type AlertProps }
