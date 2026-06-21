"use client";

// oxlint-disable react-doctor/no-initialize-state -- These components intentionally seed local interactive state from props once before user edits take ownership.

import type { ComponentProps, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
	PromptInput,
	PromptInputBody,
	PromptInputButton,
} from "@/components/ui-custom/prompt-input";
import { composerPromptInputClassName } from "@/components/projects/shared/components/rovo-composer-styles";
import { cn } from "@/lib/utils";
import AddIcon from "@atlaskit/icon/core/add";

export type FloatingComposerProps = Omit<
	ComponentProps<typeof PromptInput>,
	"variant" | "children"
> & {
	// The text field — render a <PromptInputTextarea> with your own ref/value/handlers.
	children: ReactNode;
	// Trailing action cluster (e.g. <RovoComposerActionButton />). Sits at the far right.
	actions: ReactNode;
	// Full override for the leading "+" control. Defaults to a ghost Add icon button.
	addButton?: ReactNode;
	// Props forwarded to the default "+" button (ignored when `addButton` is provided).
	addButtonProps?: ComponentProps<typeof PromptInputButton>;
};

/**
 * Shared floating prompt composer shell.
 *
 * This is the single source of truth for the floating composer layout: the Studio composer and
 * the Prompt Input demo both render it, so any layout change here propagates to both surfaces.
 *
 * Compact mode keeps `[ + ] [ editor ] [ actions ]` in one row. Once the text would wrap at
 * compact-row width, the editor takes the top row and controls sit together on a bottom row.
 * Measurement is always based on compact geometry, even while expanded, so the layout cannot
 * oscillate when expanding gives the editor more width.
 */
export function FloatingComposer({
	actions,
	addButton,
	addButtonProps,
	children,
	className,
	...props
}: Readonly<FloatingComposerProps>) {
	const containerRef = useRef<HTMLDivElement>(null);
	const addButtonRef = useRef<HTMLDivElement>(null);
	const textFieldRef = useRef<HTMLDivElement>(null);
	const actionsRef = useRef<HTMLDivElement>(null);
	const [isExpanded, setIsExpanded] = useState(false);

	useEffect(() => {
		const container = containerRef.current;
		const addButtonContainer = addButtonRef.current;
		const textFieldContainer = textFieldRef.current;
		const actionsContainer = actionsRef.current;
		if (!container || !addButtonContainer || !textFieldContainer || !actionsContainer) {
			return;
		}

		const findField = () =>
			textFieldContainer.querySelector<HTMLElement>(
				"textarea, [contenteditable='true']",
			);

		const getComposerPlainText = (field: HTMLElement): string => {
			const form = field.closest("form");
			const hiddenValue = form
				?.querySelector<HTMLInputElement>('[data-slot="prompt-input-message"]')
				?.value;
			if (typeof hiddenValue === "string" && hiddenValue.length > 0) {
				return hiddenValue;
			}

			const clone = field.cloneNode(true) as HTMLElement;
			for (const element of clone.querySelectorAll<HTMLElement>(
				".prompt-input-directory-autocomplete-ghost, [aria-hidden='true']",
			)) {
				element.remove();
			}
			return clone.textContent ?? "";
		};

		let frameId: number | null = null;

		const getDistinctLineCount = (element: HTMLElement): number => {
			const range = document.createRange();
			range.selectNodeContents(element);
			const lineTops: number[] = [];
			for (const rect of Array.from(range.getClientRects())) {
				if (rect.width <= 0 || rect.height <= 0) {
					continue;
				}
				if (!lineTops.some((top) => Math.abs(top - rect.top) < 2)) {
					lineTops.push(rect.top);
				}
			}
			range.detach();
			return lineTops.length;
		};

		const measure = () => {
			frameId = null;
			const field = findField();
			if (!field) {
				return;
			}

			const fieldText = getComposerPlainText(field);
			if (fieldText.trim().length === 0) {
				setIsExpanded(false);
				return;
			}

			const containerStyles = window.getComputedStyle(container);
			const gap = parseFloat(containerStyles.columnGap || containerStyles.gap) || 0;
			const compactFieldWidth = Math.max(
				0,
				container.getBoundingClientRect().width -
					addButtonContainer.getBoundingClientRect().width -
					actionsContainer.getBoundingClientRect().width -
					gap * 2,
			);
			if (compactFieldWidth <= 0) {
				setIsExpanded(true);
				return;
			}

			const probe = document.createElement("div");
			probe.removeAttribute("id");
			probe.removeAttribute("contenteditable");
			probe.removeAttribute("tabindex");
			probe.setAttribute("aria-hidden", "true");
			probe.textContent = fieldText;
			probe.className = field.className;
			Object.assign(probe.style, {
				position: "absolute",
				left: "-10000px",
				top: "0",
				width: `${compactFieldWidth}px`,
				maxWidth: `${compactFieldWidth}px`,
				minWidth: "0",
				height: "auto",
				maxHeight: "none",
				whiteSpace: "pre-wrap",
				wordBreak: "break-word",
				overflow: "visible",
				pointerEvents: "none",
				visibility: "hidden",
			});

			document.body.appendChild(probe);
			const lineCount = getDistinctLineCount(probe);
			document.body.removeChild(probe);
			setIsExpanded(lineCount > 1);
		};

		const scheduleMeasure = () => {
			if (frameId !== null) {
				return;
			}
			frameId = window.requestAnimationFrame(measure);
		};

		const resizeObserver = new ResizeObserver(scheduleMeasure);
		resizeObserver.observe(container);
		resizeObserver.observe(addButtonContainer);
		resizeObserver.observe(actionsContainer);

		const mutationObserver = new MutationObserver(scheduleMeasure);
		let boundField: HTMLElement | null = null;
		const bindField = () => {
			const field = findField();
			if (!field || field === boundField) {
				return Boolean(boundField);
			}
			if (boundField) {
				resizeObserver.unobserve(boundField);
			}
			boundField = field;
			resizeObserver.observe(field);
			mutationObserver.observe(field, {
				characterData: true,
				childList: true,
				subtree: true,
			});
			scheduleMeasure();
			return true;
		};

		let pollId: ReturnType<typeof setInterval> | null = null;
		if (!bindField()) {
			pollId = setInterval(() => {
				if (bindField() && pollId) {
					clearInterval(pollId);
					pollId = null;
				}
			}, 50);
		}
		scheduleMeasure();

		return () => {
			if (frameId !== null) {
				window.cancelAnimationFrame(frameId);
			}
			if (pollId) {
				clearInterval(pollId);
			}
			resizeObserver.disconnect();
			mutationObserver.disconnect();
		};
	}, []);

	const addButtonNode = addButton ?? (
		<PromptInputButton
			size="icon-sm"
			variant="ghost"
			aria-label="Add"
			{...addButtonProps}
		>
			<AddIcon label="" />
		</PromptInputButton>
	);

	return (
		<PromptInput
			variant="floating"
			className={cn(composerPromptInputClassName, "px-4 py-3.5", className)}
			{...props}
		>
			<PromptInputBody>
				<div
					ref={containerRef}
					className="flex w-full flex-wrap items-center gap-2"
				>
					<div
						ref={addButtonRef}
						className={cn(
							"flex shrink-0 items-center gap-1",
							isExpanded ? "order-2" : "order-1",
						)}
					>
						{addButtonNode}
					</div>
					<div
						ref={textFieldRef}
						className={cn(
							"flex min-w-0",
							isExpanded ? "order-1 basis-full" : "order-2 flex-1",
						)}
					>
						{children}
					</div>
					<div
						ref={actionsRef}
						className="order-3 ml-auto flex shrink-0 items-center gap-1"
					>
						{actions}
					</div>
				</div>
			</PromptInputBody>
		</PromptInput>
	);
}
