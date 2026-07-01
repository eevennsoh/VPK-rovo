"use client";

import { token } from "@/lib/tokens";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import FolderOpenIcon from "@atlaskit/icon/core/folder-open";

interface FolderHeaderProps {
	name: string;
	isExpanded?: boolean;
	onClick?: () => void;
}

export function FolderHeader({
	name,
	isExpanded = true,
	onClick,
}: Readonly<FolderHeaderProps>) {
	return (
		<button
			type="button"
			aria-expanded={isExpanded}
			aria-label={`${isExpanded ? "Collapse" : "Expand"} ${name}`}
			style={{
				display: "flex",
				alignItems: "center",
				padding: token("space.050"),
				borderRadius: token("radius.xsmall"),
				border: 0,
				cursor: "pointer",
				backgroundColor: "transparent",
				color: "inherit",
				position: "relative",
				gap: token("space.025"),
				minHeight: "32px",
				marginLeft: "-16px",
				textAlign: "left",
				width: "calc(100% + 16px)",
			}}
			onClick={onClick}
		>
			<span
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					width: "24px",
					height: "24px",
					marginLeft: token("space.025"),
					transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
					transition: "transform var(--duration-normal) var(--ease-out)",
				}}
			>
				<ChevronDownIcon
					label=""
					color={token("color.icon.subtle")}
					size="small"
				/>
			</span>

			<span
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<FolderOpenIcon label="" color={token("color.icon.subtle")} />
			</span>

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
				{name}
			</span>
		</button>
	);
}
