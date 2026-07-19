"use client";

import { type CSSProperties } from "react";
import { useReducedMotion } from "motion/react";

import { token } from "@/lib/tokens";
import { ContextEditableTitle } from "@/components/blocks/agent-sessions/experimental/components/context-editable-header";
import { ContextTitleActions } from "@/components/blocks/agent-sessions/experimental/components/context-title-actions";
import { usePanelLayout } from "@/components/blocks/agent-sessions/experimental/context-panel-layout";

/**
 * Full-width title band beneath the breadcrumb header: the editable work-item
 * title (left) and the visual action cluster (right). Spanning the whole dialog
 * — rather than living inside the left content column — keeps the actions aligned
 * to the modal's right edge (under the breadcrumb controls) and above the
 * two-column body, so they can never collide with the metadata rail.
 */
export function ContextTitleBar() {
	const { metadataCollapsed } = usePanelLayout();
	const shouldReduceMotion = useReducedMotion();
	const contentColumnStyle = {
		maxWidth: metadataCollapsed ? "800px" : "100%",
		transition: shouldReduceMotion
			? undefined
			: metadataCollapsed
				? "max-width var(--duration-medium) var(--ease-in)"
				: "max-width var(--duration-slow) var(--ease-in-out)",
	} as CSSProperties;

	return (
		<div style={{ paddingBottom: token("space.200") }}>
			<div
				className="mx-auto flex w-full items-center justify-between gap-3 px-6 motion-reduce:transition-none"
				data-agent-sessions-title-column
				style={contentColumnStyle}
			>
				<div className="min-w-0 flex-1">
					<ContextEditableTitle />
				</div>
				<ContextTitleActions />
			</div>
		</div>
	);
}
