import type { ReactNode } from "react";
import type { DemoContentWidth } from "@/app/data/component-detail-types";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

const DEMO_SHELL_MIN_HEIGHT_PX = 400;
const DEMO_SHELL_PADDING_PX = 24;
const DEMO_CONTENT_MIN_HEIGHT_PX = DEMO_SHELL_MIN_HEIGHT_PX - DEMO_SHELL_PADDING_PX * 2;
const FULL_PAGE_HEIGHT_PX = 1000;
const DEMO_SHELL_BORDER_COLOR = token("color.border", "rgba(9, 30, 66, 0.14)");
const DEMO_SHELL_BORDER_RADIUS = token("radius.large", "8px");
const DEMO_SHELL_SURFACE_COLOR = token("elevation.surface", "#FFFFFF");
const DEMO_SHELL_FRAME_STYLE = {
	border: `1px solid ${DEMO_SHELL_BORDER_COLOR}`,
	borderRadius: DEMO_SHELL_BORDER_RADIUS,
	backgroundColor: DEMO_SHELL_SURFACE_COLOR,
};
interface DemoPreviewShellProps {
	children: ReactNode;
	contentWidth?: DemoContentWidth;
	/** When true, constrains the shell to a fixed height for full-page demos (templates, sidebars). */
	fullPage?: boolean;
	/** When true (with fullPage), the shell auto-sizes to content instead of using a fixed height. */
	fitContent?: boolean;
}

export function DemoPreviewShell({ children, contentWidth = "fit", fullPage, fitContent }: Readonly<DemoPreviewShellProps>) {
	const isFullWidth = contentWidth === "full";

	if (fullPage) {
		return (
			<div
				className={cn(
					"relative w-full",
					!fitContent && "overflow-hidden [&>*]:h-full",
					"[&_[data-slot=sidebar-wrapper]]:!min-h-full [&_[data-slot=sidebar-wrapper]]:!h-full",
					"[&_[data-slot=sidebar-container]]:!h-full",
					"[&_[data-slot=sidebar-inset]]:!min-h-0 [&_[data-slot=sidebar-inset]]:!h-full",
				)}
				style={{
					...DEMO_SHELL_FRAME_STYLE,
					...(!fitContent && { height: FULL_PAGE_HEIGHT_PX }),
					transform: "translateZ(0)",
				}}
			>
				{children}
			</div>
		);
	}

	return (
		<div
			style={{
				...DEMO_SHELL_FRAME_STYLE,
				position: "relative",
				width: "100%",
				maxWidth: "100%",
				overflow: "auto",
			}}
		>
			<div
				style={{
					display: "flex",
					width: "100%",
					minHeight: DEMO_SHELL_MIN_HEIGHT_PX,
					padding: isFullWidth ? 0 : DEMO_SHELL_PADDING_PX,
					alignItems: isFullWidth ? "stretch" : "center",
					justifyContent: isFullWidth ? "stretch" : "center",
				}}
			>
				<div
					style={{
						display: "flex",
						flex: 1,
						width: "100%",
						minWidth: "100%",
						maxWidth: "100%",
						minHeight: isFullWidth ? DEMO_SHELL_MIN_HEIGHT_PX : DEMO_CONTENT_MIN_HEIGHT_PX,
						alignItems: isFullWidth ? "stretch" : "center",
						justifyContent: isFullWidth ? "stretch" : "center",
					}}
				>
					{children}
				</div>
			</div>
		</div>
	);
}
