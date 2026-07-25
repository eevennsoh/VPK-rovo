import { cn } from "@/lib/utils";

interface Frame2087327905Props {
	className?: string;
}

/**
 * Frame2087327905 - Triangular arrangement demo component
 * 
 * Displays three colored rectangular elements arranged in a triangular pattern:
 * - Red frame (top-left)
 * - Purple frame (top-right)
 * - Green frame (bottom-center)
 * 
 * Original design: 501px × 286px container with absolute positioning
 */
export function Frame2087327905({ className }: Readonly<Frame2087327905Props>) {
	return (
		<div
			className={cn(
				"relative bg-white",
				"w-[501px] h-[286px]",
				className
			)}
			data-node-id="frame-2087327905"
			role="img"
			aria-label="Triangular pattern demonstration with colored frames"
		>
			{/* Red frame - top-left */}
			<div
				className="absolute w-[122px] h-[71px]"
				style={{
					backgroundColor: "#a93d3d",
					left: "90px",
					top: "80px",
				}}
				data-node-id="red-frame"
				aria-label="Red rectangular element"
			/>

			{/* Purple frame - top-right */}
			<div
				className="absolute w-[122px] h-[71px]"
				style={{
					backgroundColor: "#513da9",
					left: "300px",
					top: "80px",
				}}
				data-node-id="purple-frame"
				aria-label="Purple rectangular element"
			/>

			{/* Green frame - bottom-center */}
			<div
				className="absolute w-[122px] h-[71px]"
				style={{
					backgroundColor: "#4ea93d",
					left: "190px",
					top: "183px",
				}}
				data-node-id="green-frame"
				aria-label="Green rectangular element"
			/>
		</div>
	);
}
