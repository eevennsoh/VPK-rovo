import type { Locator, Page } from "@playwright/test";

type Box = Readonly<{
	bottom: number;
	height: number;
	left: number;
	right: number;
	top: number;
	width: number;
}>;

export type FocusClip = Readonly<{
	clippedEdges: readonly string[];
	clippingAncestor: string;
	overflowX: string;
	overflowY: string;
}>;

export type FocusClearanceReport = Readonly<{
	clips: readonly FocusClip[];
	focused: boolean;
	focusVisible: boolean;
	focusSpecificDelta: boolean;
	indicatorPlacement: "inset" | "none" | "outset";
	outsets: Readonly<{ bottom: number; left: number; right: number; top: number }>;
	visibleIndicator: boolean;
}>;

export async function clickWhenControlReenables(
	control: Locator,
	readyAccessibleName: string,
): Promise<void> {
	await control.evaluate((element, accessibleName) => new Promise<void>((resolve) => {
		if (!(element instanceof HTMLButtonElement)) {
			throw new Error("Expected the transition control to render as a button.");
		}
		const activateWhenReady = () => {
			if (element.getAttribute("aria-label") !== accessibleName || element.disabled) return false;
			element.click();
			resolve();
			return true;
		};
		if (activateWhenReady()) return;

		const observer = new MutationObserver(() => {
			if (!activateWhenReady()) return;
			observer.disconnect();
		});
		observer.observe(element, {
			attributeFilter: ["aria-label", "disabled"],
			attributes: true,
		});
	}), readyAccessibleName);
}

export async function cancelPointerGesture(
	target: Locator,
	options: Readonly<{ pointerId?: number; pointerType?: "mouse" | "pen" | "touch" }> = {},
): Promise<Readonly<{ capturedAfterCancel: boolean; pointerId: number }>> {
	const pointerId = options.pointerId ?? 71;
	const pointerType = options.pointerType ?? "mouse";
	await target.dispatchEvent("pointerdown", {
		bubbles: true,
		buttons: 1,
		cancelable: true,
		isPrimary: true,
		pointerId,
		pointerType,
	});
	await target.dispatchEvent("pointercancel", {
		bubbles: true,
		buttons: 0,
		cancelable: false,
		isPrimary: true,
		pointerId,
		pointerType,
	});
	return target.evaluate((element, id) => ({
		capturedAfterCancel: element instanceof HTMLElement
			&& typeof element.hasPointerCapture === "function"
			&& element.hasPointerCapture(id),
		pointerId: id,
	}), pointerId);
}

export async function probeStateAcrossRemount<State>(
	target: Locator,
	action: () => Promise<void>,
	readState: (current: Locator) => Promise<State>,
): Promise<Readonly<{ after: State; before: State; remounted: boolean }>> {
	const beforeHandle = await target.elementHandle();
	if (!beforeHandle) throw new Error("Expected the remount target to be attached before the action.");
	const before = await readState(target);
	await action();
	await target.waitFor({ state: "attached" });
	const afterHandle = await target.elementHandle();
	if (!afterHandle) throw new Error("Expected the remount target to be attached after the action.");
	const sameElement = await beforeHandle.evaluate(
		(beforeElement, afterElement) => beforeElement === afterElement,
		afterHandle,
	);
	return {
		after: await readState(target),
		before,
		remounted: !sameElement,
	};
}

export async function dismissWithEscapeAndProbeFocus(
	page: Page,
	dismissedSurface: Locator,
	focusReturnTarget: Locator,
): Promise<Readonly<{ dismissed: boolean; focusRestored: boolean }>> {
	await page.keyboard.press("Escape");
	await dismissedSurface.waitFor({ state: "hidden" });
	return focusReturnTarget.evaluate((element) => ({
		dismissed: true,
		focusRestored: document.activeElement === element || element.contains(document.activeElement),
	}));
}

export async function activateAndWaitForScrollSettlement(
	scrollOwner: Locator,
	action: () => Promise<void>,
	options: Readonly<{ idleMs?: number; timeoutMs?: number }> = {},
): Promise<Readonly<{
	endTop: number;
	scrollEvents: number;
	startTop: number;
	timedOut: boolean;
}>> {
	const idleMs = options.idleMs ?? 120;
	const timeoutMs = options.timeoutMs ?? 3_000;
	const token = `jira-scroll-${Date.now()}-${Math.random().toString(36).slice(2)}`;
	const startTop = await scrollOwner.evaluate((element, watchToken) => {
		type Watch = {
			events: number;
			listener: () => void;
			startTop: number;
		};
		const windowWithWatches = window as typeof window & {
			__jiraInteractionScrollWatches?: Map<string, Watch>;
		};
		const watches = windowWithWatches.__jiraInteractionScrollWatches ?? new Map<string, Watch>();
		windowWithWatches.__jiraInteractionScrollWatches = watches;
		const watch: Watch = {
			events: 0,
			listener: () => {
				watch.events += 1;
			},
			startTop: element.scrollTop,
		};
		element.addEventListener("scroll", watch.listener, { passive: true });
		watches.set(watchToken, watch);
		return watch.startTop;
	}, token);

	await action();

	return scrollOwner.evaluate(async (element, settings) => {
		type Watch = {
			events: number;
			listener: () => void;
			startTop: number;
		};
		const windowWithWatches = window as typeof window & {
			__jiraInteractionScrollWatches?: Map<string, Watch>;
		};
		const watch = windowWithWatches.__jiraInteractionScrollWatches?.get(settings.token);
		if (!watch) throw new Error(`Missing scroll watch: ${settings.token}`);
		const startedAt = performance.now();
		let lastChangeAt = startedAt;
		let lastTop = element.scrollTop;
		let timedOut = false;

		while (true) {
			await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
			const currentTop = element.scrollTop;
			if (currentTop !== lastTop) {
				lastChangeAt = performance.now();
				lastTop = currentTop;
			}
			const now = performance.now();
			if (watch.events > 0 && now - lastChangeAt >= settings.idleMs) break;
			if (now - startedAt >= settings.timeoutMs) {
				timedOut = true;
				break;
			}
		}

		element.removeEventListener("scroll", watch.listener);
		windowWithWatches.__jiraInteractionScrollWatches?.delete(settings.token);
		return {
			endTop: element.scrollTop,
			scrollEvents: watch.events,
			startTop: settings.startTop,
			timedOut,
		};
	}, { idleMs, startTop, timeoutMs, token });
}

export async function probeNearestOwnerContainment(subject: Locator): Promise<Readonly<{
	contained: boolean;
	containmentKnown: boolean;
	documentHorizontalOverflow: number;
	owner: string;
	ownerBox: Box;
	ownerHorizontalOverflow: number;
	subjectBox: Box;
}>> {
	return subject.evaluate((element) => {
		const describe = (candidate: Element) => {
			if (candidate.id) return `#${candidate.id}`;
			for (const attribute of [
				"data-jira-work-item-scroll-region",
				"data-work-item-header-navigation",
				"data-pr-context-bar",
			]) {
				if (candidate.hasAttribute(attribute)) return `[${attribute}]`;
			}
			return candidate.tagName.toLowerCase();
		};
		const box = (rect: DOMRect): Box => ({
			bottom: rect.bottom,
			height: rect.height,
			left: rect.left,
			right: rect.right,
			top: rect.top,
			width: rect.width,
		});
		const clippingOverflowValues = new Set(["auto", "clip", "hidden", "scroll"]);
		const paintContainmentValues = new Set(["content", "paint", "strict"]);
		let owner: Element | null = element.parentElement;
		let ownerClipsX = false;
		let ownerClipsY = false;
		let ownerHasUnmeasuredClipPath = false;
		while (owner) {
			const style = getComputedStyle(owner);
			ownerHasUnmeasuredClipPath = style.clipPath !== "none";
			const clipsBothAxes = ownerHasUnmeasuredClipPath
				|| style.contain.split(/\s+/u).some((value) => paintContainmentValues.has(value));
			ownerClipsX = clipsBothAxes || clippingOverflowValues.has(style.overflowX);
			ownerClipsY = clipsBothAxes || clippingOverflowValues.has(style.overflowY);
			if (ownerClipsX || ownerClipsY) break;
			owner = owner.parentElement;
		}
		if (!owner) {
			ownerClipsX = true;
			ownerClipsY = true;
		}

		const subjectRect = element.getBoundingClientRect();
		const ownerRect = owner?.getBoundingClientRect()
			?? new DOMRect(0, 0, window.innerWidth, window.innerHeight);
		const ownerStyle = owner ? getComputedStyle(owner) : null;
		const ownerLeft = ownerStyle
			? ownerRect.left + (Number.parseFloat(ownerStyle.borderLeftWidth) || 0)
			: ownerRect.left;
		const ownerTop = ownerStyle
			? ownerRect.top + (Number.parseFloat(ownerStyle.borderTopWidth) || 0)
			: ownerRect.top;
		const ownerBox = owner
			? {
				bottom: ownerTop + owner.clientHeight,
				height: owner.clientHeight,
				left: ownerLeft,
				right: ownerLeft + owner.clientWidth,
				top: ownerTop,
				width: owner.clientWidth,
			}
			: box(ownerRect);
		const documentHorizontalOverflow = Math.max(
			0,
			document.documentElement.scrollWidth - document.documentElement.clientWidth,
		);
		const ownerHorizontalOverflow = owner
			? Math.max(0, owner.scrollWidth - owner.clientWidth)
			: documentHorizontalOverflow;
		const containmentKnown = !ownerHasUnmeasuredClipPath;
		const containedByMeasuredAxes = (!ownerClipsX || (
			subjectRect.left >= ownerBox.left
			&& subjectRect.right <= ownerBox.right
		)) && (!ownerClipsY || (
			subjectRect.top >= ownerBox.top
			&& subjectRect.bottom <= ownerBox.bottom
		));
		return {
			contained: containmentKnown && containedByMeasuredAxes,
			containmentKnown,
			documentHorizontalOverflow,
			owner: owner ? describe(owner) : "viewport",
			ownerBox,
			ownerHorizontalOverflow,
			subjectBox: box(subjectRect),
		};
	});
}

export async function probeStickyOverlap(
	stickySurface: Locator,
	content: Locator,
): Promise<Readonly<{ horizontalPx: number; overlapPx: number; verticalPx: number }>> {
	const stickyRect = await stickySurface.boundingBox();
	const contentRect = await content.boundingBox();
	if (!stickyRect || !contentRect) {
		throw new Error("Expected both sticky and content surfaces to have measurable boxes.");
	}
	const stickyBox = {
		bottom: stickyRect.y + stickyRect.height,
		left: stickyRect.x,
		right: stickyRect.x + stickyRect.width,
		top: stickyRect.y,
	};
	const contentBox = {
		bottom: contentRect.y + contentRect.height,
		left: contentRect.x,
		right: contentRect.x + contentRect.width,
		top: contentRect.y,
	};
	const horizontalPx = Math.max(
		0,
		Math.min(stickyBox.right, contentBox.right) - Math.max(stickyBox.left, contentBox.left),
	);
	const verticalPx = Math.max(
		0,
		Math.min(stickyBox.bottom, contentBox.bottom) - Math.max(stickyBox.top, contentBox.top),
	);
	return {
		horizontalPx,
		overlapPx: horizontalPx * verticalPx,
		verticalPx,
	};
}

export async function probeFocusIndicatorClearance(
	page: Page,
	indicatorOwner: Locator,
	focusTargetSelector?: string,
): Promise<FocusClearanceReport> {
	await page.keyboard.press("Tab");
	return indicatorOwner.evaluate(async (element, selector) => {
		const focusTarget = selector
			? element.querySelector<HTMLElement>(selector)
			: element as HTMLElement;
		if (!focusTarget) throw new Error(`Missing focus target: ${selector}`);
		focusTarget.focus();
		await new Promise((resolve) => window.setTimeout(resolve, 200));
		const splitShadows = (value: string) => {
			const shadows: string[] = [];
			let current = "";
			let parenthesisDepth = 0;
			for (const character of value) {
				if (character === "(") parenthesisDepth += 1;
				if (character === ")") parenthesisDepth -= 1;
				if (character === "," && parenthesisDepth === 0) {
					shadows.push(current);
					current = "";
					continue;
				}
				current += character;
			}
			if (current) shadows.push(current);
			return shadows;
		};
		const describe = (candidate: Element) => {
			if (candidate.hasAttribute("data-jira-work-item-scroll-region")) {
				return "[data-jira-work-item-scroll-region]";
			}
			if (candidate.id) return `#${candidate.id}`;
			return candidate.tagName.toLowerCase();
		};

		if (document.activeElement === focusTarget) focusTarget.blur();
		await new Promise((resolve) => window.setTimeout(resolve, 200));
		const restingStyle = getComputedStyle(element);
		const restingIndicator = {
			boxShadows: splitShadows(restingStyle.boxShadow).filter((shadow) => shadow !== "none"),
			outlineColor: restingStyle.outlineColor,
			outlineOffset: restingStyle.outlineOffset,
			outlineStyle: restingStyle.outlineStyle,
			outlineWidth: restingStyle.outlineWidth,
		};

		focusTarget.focus();
		await new Promise((resolve) => window.setTimeout(resolve, 200));
		const style = getComputedStyle(element);
		const focusedShadows = splitShadows(style.boxShadow).filter((shadow) => shadow !== "none");
		const unmatchedRestingShadows = [...restingIndicator.boxShadows];
		const focusSpecificShadows = focusedShadows.filter((shadow) => {
			const restingIndex = unmatchedRestingShadows.indexOf(shadow);
			if (restingIndex === -1) return true;
			unmatchedRestingShadows.splice(restingIndex, 1);
			return false;
		});
		const outlineChanged = style.outlineStyle !== "none"
			&& (
				style.outlineStyle !== restingIndicator.outlineStyle
				|| style.outlineWidth !== restingIndicator.outlineWidth
				|| style.outlineOffset !== restingIndicator.outlineOffset
				|| style.outlineColor !== restingIndicator.outlineColor
			);
		const outlineOutset = !outlineChanged
			? 0
			: Math.max(0, parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset));
		const outsets = {
			top: outlineOutset,
			right: outlineOutset,
			bottom: outlineOutset,
			left: outlineOutset,
		};
		let hasInsetShadow = false;
		for (const shadow of focusSpecificShadows) {
			const lengths = (shadow.match(/-?(?:\d+\.?\d*|\.\d+)px/gu) ?? [])
				.map((length) => Number.parseFloat(length));
			if (shadow.includes("inset")) {
				hasInsetShadow ||= lengths.some((length) => length > 0);
				continue;
			}
			const [offsetX = 0, offsetY = 0, blur = 0, spread = 0] = lengths;
			outsets.top = Math.max(outsets.top, spread + blur - offsetY);
			outsets.right = Math.max(outsets.right, spread + blur + offsetX);
			outsets.bottom = Math.max(outsets.bottom, spread + blur + offsetY);
			outsets.left = Math.max(outsets.left, spread + blur - offsetX);
		}
		const hasOutset = Object.values(outsets).some((value) => value > 0);
		const indicatorPlacement = hasOutset ? "outset" : hasInsetShadow ? "inset" : "none";
		const focusSpecificDelta = outlineChanged || focusSpecificShadows.length > 0;

		const clips: FocusClip[] = [];
		const controlRect = element.getBoundingClientRect();
		const clippedOverflowValues = new Set(["auto", "clip", "hidden", "scroll"]);
		let ancestor = element.parentElement;
		while (ancestor) {
			const ancestorStyle = getComputedStyle(ancestor);
			const clipsX = clippedOverflowValues.has(ancestorStyle.overflowX)
				|| ancestorStyle.contain.includes("paint")
				|| ancestorStyle.clipPath !== "none";
			const clipsY = clippedOverflowValues.has(ancestorStyle.overflowY)
				|| ancestorStyle.contain.includes("paint")
				|| ancestorStyle.clipPath !== "none";
			if (clipsX || clipsY) {
				const ancestorRect = ancestor.getBoundingClientRect();
				const innerLeft = ancestorRect.left + parseFloat(ancestorStyle.borderLeftWidth);
				const innerRight = ancestorRect.right - parseFloat(ancestorStyle.borderRightWidth);
				const innerTop = ancestorRect.top + parseFloat(ancestorStyle.borderTopWidth);
				const innerBottom = ancestorRect.bottom - parseFloat(ancestorStyle.borderBottomWidth);
				const clippedEdges = [
					clipsY && controlRect.top - outsets.top < innerTop ? "top" : null,
					clipsX && controlRect.right + outsets.right > innerRight ? "right" : null,
					clipsY && controlRect.bottom + outsets.bottom > innerBottom ? "bottom" : null,
					clipsX && controlRect.left - outsets.left < innerLeft ? "left" : null,
				].filter((edge): edge is string => edge !== null);
				if (clippedEdges.length > 0) {
					clips.push({
						clippedEdges,
						clippingAncestor: describe(ancestor),
						overflowX: ancestorStyle.overflowX,
						overflowY: ancestorStyle.overflowY,
					});
				}
			}
			ancestor = ancestor.parentElement;
		}

		return {
			clips,
			focused: document.activeElement === focusTarget,
			focusVisible: focusTarget.matches(":focus-visible"),
			focusSpecificDelta,
			indicatorPlacement,
			outsets,
			visibleIndicator: focusSpecificDelta && indicatorPlacement !== "none",
		};
	}, focusTargetSelector);
}
