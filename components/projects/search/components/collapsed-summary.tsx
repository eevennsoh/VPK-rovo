"use client";

import React from "react";
import { token } from "@/lib/tokens";

import SummaryFooter from "./summary-footer";

interface CollapsedSummaryProps {
	onExpand: () => void;
}

/**
 * Collapsed state preview for AI summary panel with truncated text and fade effect
 */
export default function CollapsedSummary({ onExpand }: Readonly<CollapsedSummaryProps>): React.ReactElement {
	function handleClick(): void {
		onExpand();
	}

	function handleReadMoreClick(): void {
		onExpand();
	}

	return (
		<div>
			<div className="flex flex-col gap-4">
				{/* Preview Text - truncated with fade effect */}
				<button
					type="button"
					onClick={handleClick}
					style={{
						position: "relative",
						marginRight: token("space.200"),
						background: "transparent",
						border: 0,
						color: "inherit",
						cursor: "pointer",
						display: "block",
						padding: 0,
						textAlign: "left",
						width: "100%",
					}}
				>
					<span style={{ display: "block", font: token("font.body") }}>
						<span className="text-sm">For detailed information on the OKRs for 2026, you can refer to the following resources:</span>
					</span>

					<span style={{ display: "block", font: token("font.body"), paddingLeft: token("space.100") }}>
						<span className="text-sm font-semibold">1. 2026 OKR Planning</span>
						<span className="text-sm">: This page captures the work related to crafting KRs and OKRs for L2 and L3 objectives for 2026. You can view it </span>
					</span>

					{/* Fade out gradient overlay */}
					<span
						aria-hidden
						style={{
							display: "block",
							position: "absolute",
							bottom: 0,
							left: 0,
							right: 0,
							height: "40px",
							background: `linear-gradient(to bottom, transparent, ${token("elevation.surface")})`,
							pointerEvents: "none",
						}}
					/>
				</button>

				{/* Read more button */}
				<div>
					<button
						type="button"
						className="rounded-xs p-0 text-link underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
						onClick={handleReadMoreClick}
						style={{
							background: "transparent",
							border: 0,
							cursor: "pointer",
							font: token("font.body"),
						}}
					>
						Read more
					</button>
				</div>

				<SummaryFooter stopPropagation />
			</div>
		</div>
	);
}
