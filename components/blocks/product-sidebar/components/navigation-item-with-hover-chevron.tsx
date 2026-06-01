"use client";

import { useState } from "react";
import { token } from "@/lib/tokens";
import { Button } from "@/components/ui/button";
import { NavigationItemWithHoverChevronProps } from "./types";
import AddIcon from "@atlaskit/icon/core/add";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

export function NavigationItemWithHoverChevron({
	icon: Icon,
	label,
	isExpanded = false,
	hasActions = false,
	onClick,
}: Readonly<NavigationItemWithHoverChevronProps>) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				padding: token("space.050"),
				borderRadius: token("radius.xsmall"),
				cursor: "pointer",
				backgroundColor: "transparent",
				position: "relative",
				gap: token("space.025"),
				minHeight: "32px",
			}}
			onClick={onClick}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			{/* Icon - swaps to chevron on hover */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					width: "24px",
					height: "24px",
					marginLeft: token("space.025"),
				}}
			>
				{isHovered ? (
					isExpanded ? (
						<ChevronDownIcon label="Expanded" color={token("color.icon.subtle")} size="small" />
					) : (
						<ChevronRightIcon label="Collapsed" color={token("color.icon.subtle")} size="small" />
					)
				) : (
					<Icon label={label} color={token("color.icon.subtle")} />
				)}
			</div>

			{/* Label */}
			<span
				style={{
					font: token("font.body"),
					fontWeight: token("font.weight.medium"),
					color: token("color.text.subtle"),
					flex: 1,
					paddingLeft: token("space.025"),
					overflow: "hidden",
					textOverflow: "ellipsis",
					whiteSpace: "nowrap",
				}}
			>
				{label}
			</span>

			{/* Right actions - only show on hover if hasActions */}
			{hasActions && isHovered && (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: token("space.050"),
						marginRight: token("space.025"),
					}}
				>
					<Button
						aria-label="Add"
						size="icon"
						variant="ghost"
						onClick={(e) => {
							e.stopPropagation();
						}}
					>
						<AddIcon label="" size="small" />
					</Button>
					<Button
						aria-label="More"
						size="icon"
						variant="ghost"
						onClick={(e) => {
							e.stopPropagation();
						}}
					>
						<ShowMoreHorizontalIcon label="" size="small" />
					</Button>
				</div>
			)}
		</div>
	);
}
