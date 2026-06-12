"use client"

import { useId } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"

const spinnerVariants = cva(
	"pointer-events-none shrink-0",
	{
		variants: {
			size: {
				xs: "size-3",
				sm: "size-3.5",
				default: "size-4",
				lg: "size-5",
				xl: "size-6",
			},
			variant: {
				inherit: "",
				invert: "text-background",
				rainbow: "",
			},
		},
		defaultVariants: {
			size: "default",
			variant: "inherit",
		},
	}
)

interface SpinnerProps
	extends VariantProps<typeof spinnerVariants> {
	className?: string
	label?: string
	style?: React.CSSProperties
}

/**
 * Rovo brand color stops, in saffron → lime → blue → purple order, with each
 * stop doubled at the same offset to produce hard color transitions instead
 * of smooth interpolation. Band proportions match the Figma conic gradient
 * the cursor stroke uses (saffron 0–20%, lime 20–46.6%, blue 46.6–70%, purple
 * 70–100%) so the spinner reads as the same rainbow as the rest of the brand.
 */
const ROVO_RAINBOW_STOPS = [
	{ offset: "0%", color: "#FCA700" },
	{ offset: "25%", color: "#FCA700" },
	{ offset: "25%", color: "#6A9A23" },
	{ offset: "50%", color: "#6A9A23" },
	{ offset: "50%", color: "#1868DB" },
	{ offset: "75%", color: "#1868DB" },
	{ offset: "75%", color: "#AF59E1" },
	{ offset: "100%", color: "#AF59E1" },
] as const

function Spinner({
	className,
	size = "default",
	variant = "inherit",
	label = "Loading",
	style,
}: Readonly<SpinnerProps>) {
	const gradientId = useId()
	const isRainbow = variant === "rainbow"
	const stroke = isRainbow ? `url(#${gradientId})` : "currentColor"

	return (
		<svg
			data-slot="spinner"
			role="status"
			aria-label={label}
			viewBox="0 0 50 50"
			fill="none"
			className={cn(spinnerVariants({ size, variant }), className)}
			style={style}
		>
			{isRainbow ? (
				<defs>
					<linearGradient
						id={gradientId}
						x1="0"
						y1="0"
						x2="1"
						y2="1"
						gradientUnits="objectBoundingBox"
					>
						{ROVO_RAINBOW_STOPS.map((stop, i) => (
							<stop
								key={`${stop.offset}-${i}`}
								offset={stop.offset}
								stopColor={stop.color}
							/>
						))}
					</linearGradient>
				</defs>
			) : null}
			<motion.circle
				cx="25"
				cy="25"
				r="20"
				stroke={stroke}
				strokeWidth="4"
				strokeLinecap="round"
				fill="none"
				transform="rotate(-90 25 25)"
				animate={{
					pathLength: [0.05, 0.5, 0.05],
					pathOffset: [0, 0, 1],
				}}
				transition={{
					duration: 0.8,
					repeat: Infinity,
					times: [0, 0.2, 1],
					ease: ["easeOut", "easeOut"],
				}}
			/>
		</svg>
	)
}

// react-doctor-disable-next-line react-doctor/only-export-components -- This component module intentionally exports colocated non-component API used by consumers.
export { Spinner, spinnerVariants, type SpinnerProps }
