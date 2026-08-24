import type { DemoContentWidth, DemoLayout } from "@/app/data/component-detail-types";
import type { DemoCategory } from "@/components/website/demo-registry-loader";

export function shouldUseFullPagePreview(category: DemoCategory, demoLayout?: DemoLayout) {
	return (category === "projects" || category === "blocks") && (demoLayout?.previewHeight === "fixed" || demoLayout?.previewHeight === "fit");
}

export interface ExamplesShellLayout {
	contentWidth?: DemoContentWidth;
	fullPage: boolean;
	fitContent: boolean;
}

/**
 * Resolves the shell an example renders in.
 *
 * By default an example uses the inset, centred shell inside the 860px reading
 * container. `examplesContentWidth: "bleed"` makes the example render exactly
 * like the Preview section instead: `ComponentDoc` hoists it out of the reading
 * container into the same wide band, and this returns the same shell arguments
 * `DocPreview` computes — so both sections land at an identical width.
 */
export function resolveExamplesShellLayout(
	category: DemoCategory,
	demoLayout?: DemoLayout,
): ExamplesShellLayout {
	// Bound to a local so the `=== "bleed"` check narrows it: TypeScript will not
	// narrow an optional property access across the early return.
	const examplesContentWidth = demoLayout?.examplesContentWidth;

	if (examplesContentWidth !== "bleed") {
		return {
			contentWidth: examplesContentWidth,
			fullPage: false,
			fitContent: false,
		};
	}

	// Mirror DocPreview exactly, including its content width, so a bleeding
	// example can never be laid out differently from the preview above it.
	const fullPage = shouldUseFullPagePreview(category, demoLayout);

	return {
		contentWidth: demoLayout?.previewContentWidth,
		fullPage,
		fitContent: fullPage && demoLayout?.previewHeight === "fit",
	};
}

/** True when `ComponentDoc` must render Examples in the wide preview band. */
export function shouldBleedExamples(demoLayout?: DemoLayout) {
	return demoLayout?.examplesContentWidth === "bleed";
}

/**
 * `DocSection` hides its own bottom divider with `last:border-b-0`, which CSS
 * resolves against the section's DOM parent. Bleed mode splits the doc sections
 * across three width wrappers, which changes who is `:last-child`, so a wrapper
 * that is still followed by another section has to re-assert the divider. The
 * child combinator outranks `last:border-b-0` on specificity, so this wins
 * regardless of utility order.
 */
export const KEEP_SECTION_DIVIDER = "[&>section:last-child]:border-b";

export interface BleedWrapperDividers {
	installationAndUsage?: string;
	examples?: string;
	props?: string;
}

/**
 * Divider override per bleed wrapper. `undefined` means "this wrapper really
 * does hold the last section", so `last:border-b-0` should stand.
 */
export function resolveBleedWrapperDividers(
	hasExamples: boolean,
	hasProps: boolean,
): BleedWrapperDividers {
	return {
		installationAndUsage: hasExamples || hasProps ? KEEP_SECTION_DIVIDER : undefined,
		// Only meaningful when this wrapper actually holds Examples; with no
		// examples the wrapper is empty and has no section to draw a divider on.
		examples: hasExamples && hasProps ? KEEP_SECTION_DIVIDER : undefined,
		props: undefined,
	};
}
