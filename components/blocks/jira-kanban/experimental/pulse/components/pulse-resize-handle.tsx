"use client";

import { SidebarResizeHandle } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { useSidebarResize } from "@/components/projects/rovo-core/hooks/use-sidebar-resize";

interface PulseResizeHandleProps {
	ariaLabel: string;
	className?: string;
	resize: ReturnType<typeof useSidebarResize>;
	side?: "left" | "right";
	testId: string;
}

/** Same SidebarResizeHandle treatment as the work-item metadata rail. */
export function PulseResizeHandle({
	ariaLabel,
	className,
	resize,
	side = "left",
	testId,
}: Readonly<PulseResizeHandleProps>) {
	return (
		<SidebarResizeHandle
			aria-label={ariaLabel}
			aria-orientation="vertical"
			aria-valuemax={resize.maxWidth}
			aria-valuemin={resize.minWidth}
			aria-valuenow={resize.sidebarWidth}
			className={cn(
				"bottom-6! border-0 bg-transparent! hover:bg-transparent! data-[active]:bg-transparent! data-[will-collapse]:bg-transparent! focus-visible:bg-transparent! focus-visible:outline-none focus-visible:ring-0 duration-normal ease-out-practical [&>div]:h-16 [&>div]:origin-center [&>div]:bg-neutral-100 [&>div]:transition-[opacity,background-color,scale] hover:[&>div]:scale-105 hover:[&>div]:bg-bg-selected-bold data-[active]:[&>div]:scale-105 data-[active]:[&>div]:bg-bg-selected-bold focus-visible:[&>div]:opacity-100 focus-visible:[&>div]:scale-105 focus-visible:[&>div]:bg-bg-selected-bold [&>div]:duration-medium [&>div]:ease-out-practical motion-reduce:transition-none motion-reduce:[&>div]:scale-100 motion-reduce:[&>div]:transition-none",
				className,
			)}
			data-active={resize.isResizing ? "" : undefined}
			data-testid={testId}
			onDoubleClick={resize.onResizeHandleDoubleClick}
			onKeyDown={resize.onResizeHandleKeyDown}
			onPointerDown={resize.onResizeHandlePointerDown}
			onPointerEnter={resize.onResizeHandlePointerEnter}
			onPointerLeave={resize.onResizeHandlePointerLeave}
			role="separator"
			side={side}
			tabIndex={0}
		/>
	);
}
