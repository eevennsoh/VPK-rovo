"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { resolveRovoAppComposerPreviewHeight } from "@/components/projects/shared/lib/rovo-app-composer-preview";

interface UseRovoAppComposerHeightOptions {
	/** Current text value of the composer (used to release the fixed height once typing). */
	textValue: string;
	/** Number of pending attachments (releases the fixed height when present). */
	attachmentCount: number;
	/** Whether a preview-prompt placeholder is showing (taller composer). */
	isPreviewPlaceholderActive: boolean;
	/** Whether the prompt gallery is expanded (taller composer). */
	galleryExpanded: boolean;
	/** Whether an artifact context pill is shown (releases the stale base height). */
	hasArtifactTitle: boolean;
	/** The active preview-prompt value, if any. */
	previewPrompt: string | null;
}

interface UseRovoAppComposerHeightResult {
	composerRef: React.RefObject<HTMLDivElement | null>;
	textareaRef: React.RefObject<HTMLTextAreaElement | null>;
	/** Pixel height to apply to the composer, or null to let it auto-size. */
	composerHeight: number | null;
}

/**
 * Owns the Rovo "card" composer's smooth height-animation system. The composer
 * holds a stable base height while idle so the CSS height transition animates
 * smoothly when hovering across prompt-gallery pills, and grows to a computed
 * preview height when a gallery preview or expanded gallery is active.
 *
 * Extracted verbatim from the original Rovo composer so behavior is unchanged.
 */
export function useRovoAppComposerHeight({
	textValue,
	attachmentCount,
	isPreviewPlaceholderActive,
	galleryExpanded,
	hasArtifactTitle,
	previewPrompt,
}: UseRovoAppComposerHeightOptions): UseRovoAppComposerHeightResult {
	const composerRef = useRef<HTMLDivElement | null>(null);
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const textInputValueRef = useRef(textValue);
	const galleryExpandedRef = useRef(galleryExpanded);
	const isPreviewPlaceholderActiveRef = useRef(false);
	const [baseComposerHeight, setBaseComposerHeight] = useState(0);
	const [baseTextareaHeight, setBaseTextareaHeight] = useState(0);
	const [stableBaseHeight, setStableBaseHeight] = useState(0);

	useLayoutEffect(() => {
		textInputValueRef.current = textValue;
		galleryExpandedRef.current = galleryExpanded;
		isPreviewPlaceholderActiveRef.current = isPreviewPlaceholderActive;
	}, [textValue, galleryExpanded, isPreviewPlaceholderActive, previewPrompt]);

	const captureBaseMeasurements = useCallback(() => {
		const composerElement = composerRef.current;
		const textareaElement = textareaRef.current;
		if (!composerElement || !textareaElement) {
			return;
		}

		const height = composerElement.getBoundingClientRect().height;
		setBaseComposerHeight(height);
		setBaseTextareaHeight(textareaElement.getBoundingClientRect().height);

		// Capture stable base height once for smooth transition fallback.
		// Subsequent calls may read mid-transition values, so only the first
		// measurement (when the composer is at its natural height) is trusted.
		setStableBaseHeight((prev) => (prev === 0 && height > 0 ? height : prev));
	}, []);

	useEffect(() => {
		if (textValue.trim().length > 0 || previewPrompt || galleryExpanded) {
			return;
		}

		captureBaseMeasurements();
	}, [captureBaseMeasurements, textValue, galleryExpanded, previewPrompt]);

	useEffect(() => {
		const composerElement = composerRef.current;
		const textareaElement = textareaRef.current;
		if (!composerElement || !textareaElement) {
			return;
		}

		const resizeObserver = new ResizeObserver(() => {
			if (isPreviewPlaceholderActiveRef.current) {
				return;
			}
			if (galleryExpandedRef.current || textInputValueRef.current.trim().length > 0) {
				return;
			}

			captureBaseMeasurements();
		});

		resizeObserver.observe(composerElement);
		resizeObserver.observe(textareaElement);

		return () => {
			resizeObserver.disconnect();
		};
	}, [captureBaseMeasurements]);

	const previewComposerHeight = isPreviewPlaceholderActive
		? resolveRovoAppComposerPreviewHeight({
				baseComposerHeight,
				baseTextareaHeight,
				previewPromptHeight: baseTextareaHeight,
			})
		: null;
	const expandedGalleryComposerHeight = galleryExpanded
		? resolveRovoAppComposerPreviewHeight({
				baseComposerHeight,
				baseTextareaHeight,
				previewPromptHeight: baseTextareaHeight * 2,
			})
		: null;
	const composerHeight = (() => {
		// When user has typed text or attachments are present, release the fixed height so the composer auto-sizes
		if (textValue.trim().length > 0) return null;
		if (attachmentCount > 0) return null;

		// When artifact context is shown, the stable base height (captured without
		// the artifact pill) is stale. Let the composer auto-size instead — the
		// gallery that needs the stable height isn't visible with artifacts open.
		if (hasArtifactTitle) return null;

		const combined = previewComposerHeight && expandedGalleryComposerHeight ? Math.max(previewComposerHeight, expandedGalleryComposerHeight) : (previewComposerHeight ?? expandedGalleryComposerHeight);

		if (combined) return combined;

		// Keep a stable base height so the CSS transition animates smoothly
		// when hovering across gallery pills (prevents snap on gap-crossing).
		// Uses the once-captured stableBaseHeight to avoid feedback loops
		// from the ResizeObserver reading mid-transition values.
		return stableBaseHeight > 0 ? stableBaseHeight : null;
	})();

	return { composerRef, textareaRef, composerHeight };
}
