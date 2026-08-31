"use client";

import AddIcon from "@atlaskit/icon/core/add";
import CrossIcon from "@atlaskit/icon/core/cross";
import PanelRightIcon from "@atlaskit/icon/core/panel-right";
import HourglassIcon from "@atlaskit/icon-lab/core/hourglass";
import { motion } from "motion/react";

import { ScrubberRail } from "@/components/blocks/scrubber/components/scrubber-rail";
import type { ScrubberEntry } from "@/components/blocks/scrubber/lib/scrubber-entries";
import { FloatingComposer } from "@/components/projects/shared/components/floating-composer";
import { RovoComposerActionButton } from "@/components/projects/shared/components/rovo-composer-send-controls";
import { floatingComposerTextareaClassName } from "@/components/projects/shared/components/rovo-composer-styles";
import { ContextBarPill } from "@/components/ui-custom/context-bar";
import {
	PromptInputButton,
	PromptInputTextarea,
} from "@/components/ui-custom/prompt-input";
import { cn } from "@/lib/utils";
import { token } from "@/lib/tokens";

import {
	OMNIBAR_CONTENT,
	OMNIBAR_CONTENT_EXIT,
	OMNIBAR_CONTEXT_ENTER,
	OMNIBAR_CONTEXT_EXIT,
	resolveOmnibarTransition,
} from "../omnibar-motion";

export type OmnibarTone = "inverse" | "default";

/**
 * Inverts the light `PromptInput variant="floating"` chrome onto the black surface.
 *
 * The morphing surface above already paints `bg-bg-neutral-bold`, so the form itself goes
 * fully transparent and only the content is re-tinted. `text.inverse.subtle` does not exist
 * as an ADS token, so the placeholder uses the repo's established `text-text-inverse` +
 * `opacity-60` pairing.
 */
const OMNIBAR_BAR_SKIN = cn(
	"rounded-[28px] border-transparent bg-transparent p-3 shadow-none",
	"[&_[data-slot=prompt-input-placeholder]]:text-text-inverse [&_[data-slot=prompt-input-placeholder]]:opacity-60",
);

/**
 * The ghost button variant hovers on a light neutral, which disappears against
 * `background.neutral.bold`. `neutral.bold.hovered` / `.pressed` get progressively lighter on
 * the black fill, so this is the same inverse pair the Rovo sparkle button uses for its own
 * black tile.
 *
 * Icon colour is NOT set here: ADS icons ship unlayered Compiled CSS, which beats any layered
 * Tailwind utility no matter the specificity. Icons take the ADS `color` prop instead.
 */
const OMNIBAR_GHOST_BUTTON = "hover:bg-bg-neutral-bold-hovered active:bg-bg-neutral-bold-pressed";

/**
 * The send control's glyph is owned by `RovoComposerActionButton`, so there is no `color` prop
 * to reach — this is the one place that needs the `!` escape hatch to outrank Compiled.
 * The resting fill gives it the raised circle from the reference design.
 */
const OMNIBAR_SUBMIT_BUTTON = cn(
	OMNIBAR_GHOST_BUTTON,
	"bg-bg-neutral-bold-hovered [&_svg]:text-icon-inverse!",
);

/**
 * Inverse treatment for the Timeline context pill. The shared `ContextBarPill` is a
 * light neutral chip; on `background.neutral.bold` that chip has to use the same
 * hovered/pressed pair as the other inverse controls.
 */
const OMNIBAR_TIMELINE_PILL_INVERSE = cn(
	"bg-bg-neutral-bold-hovered text-text-inverse hover:bg-bg-neutral-bold-pressed",
	"active:bg-bg-neutral-bold-pressed",
	"aria-pressed:bg-bg-neutral-bold-hovered aria-pressed:text-text-inverse",
);

/**
 * The rail's cell, pinned to the height of the editor row it replaces so the bar does not
 * change height under the click that opened it — the same 36px contract
 * `ScrubberComposer` documents.
 *
 * The headroom above it is the part specific to this host. A major's rule swells to 46px
 * from a 14px rail, so it overhangs the cell by 32px, and the Omnibar's morphing surface
 * is `overflow-hidden` (it has to be — that clip is what makes the pill/bar morph read as
 * one shape). `allowOverflow` frees the swell from the composer's own `InputGroup`, and
 * `pt-8` gives it exactly those 32px inside the surface. The bar grows upward because the
 * whole rail is bottom-anchored, so the controls stay put.
 */
const OMNIBAR_RAIL_CELL = "relative h-9 w-full";
const OMNIBAR_RAIL_BLOCK = "absolute inset-x-0 bottom-0 gap-0";
const OMNIBAR_TIMELINE_SKIN = "pt-8";

// Dictation is out of scope for this block, so the action cluster resolves to submit only.
const noopStop = () => undefined;

/**
 * Everything the bar needs to render the timeline affordance. Absent means the block has
 * no timeline, and no toggle is rendered at all.
 */
export interface OmnibarBarTimeline {
	activeIndex: number;
	/** `x` swaps this bar's editor cell for the rail; `y` leaves the editor alone. */
	axis: "x" | "y";
	entries: readonly ScrubberEntry[];
	isTimeline: boolean;
	/**
	 * True on the one editor mount that follows leaving Timeline. The `x` axis destroys the
	 * tiptap instance, so without this the draft comes back but the caret does not.
	 */
	consumeFocusRestore: () => boolean;
	onExit: () => void;
	onSelect: (id: string) => void;
	onToggle: () => void;
}

export interface OmnibarBarProps {
	onOpenPanel: () => void;
	onSubmit: () => void;
	onValueChange: (value: string) => void;
	placeholder: string;
	shouldReduceMotion: boolean | null;
	tone: OmnibarTone;
	/**
	 * True when the Omnibar has no `onSubmit` consumer.
	 *
	 * `RovoComposerActionButton` resolves `disabled` as `submitDisabled || !canSubmit`, so
	 * without this the control enables on the first keystroke and then does nothing — the
	 * shell's submit guard drops the draft on the floor rather than destroying it, but the
	 * button has already promised an action it cannot perform.
	 */
	submitDisabled: boolean;
	timeline?: OmnibarBarTimeline;
	/**
	 * Compact tone hoists the Timeline chip above the morphing surface so layout
	 * cannot scale it with the composer. Inverse keeps it inside the black bar.
	 */
	hideContextPill?: boolean;
	value: string;
}

/**
 * Expanded state: the shared floating composer.
 *
 * `tone="inverse"` re-skins that composer onto the black morphing surface. `tone="default"`
 * leaves the existing compact prompt chrome alone — the same FloatingComposer the catalog
 * already ships.
 *
 * `FloatingComposer` already owns the `[ + ] [ editor ] [ actions ]` row and the measurement
 * that stacks the editor onto its own line once a draft would wrap, so this only supplies
 * the controls and, on inverse, the re-tint.
 *
 * With a `timeline`, a `ContextBarPill` sits above the composer — the same context-chip
 * treatment the compact prompt already uses — rather than a configure control in the
 * leading cluster. On the `x` axis that pill swaps this bar's editor cell for the notch
 * rail and turns the trailing send into a close. On `y` the bar is unchanged and the rail
 * docks to the screen edge instead; the pill only reads pressed.
 */
function OmnibarTimelinePill({
	isInverse,
	isPressed,
	onToggle,
}: Readonly<{
	isInverse: boolean;
	isPressed: boolean;
	onToggle: () => void;
}>) {
	return (
		<ContextBarPill
			aria-label="Timeline"
			aria-pressed={isPressed}
			className={isInverse ? OMNIBAR_TIMELINE_PILL_INVERSE : "aria-pressed:bg-bg-selected aria-pressed:text-text-selected"}
			icon={<HourglassIcon color="currentColor" label="" size="small" />}
			onClick={onToggle}
		>
			Timeline
		</ContextBarPill>
	);
}

/**
 * Timeline chip with its own presence — fade + 8px slide, popup-family recipe.
 * Mounted *outside* the composer's `layout` surface on compact tone so mouse-out
 * cannot scale it with the prompt.
 */
export function OmnibarContextPill({
	isInverse,
	isPressed,
	onToggle,
	shouldReduceMotion,
}: Readonly<{
	isInverse: boolean;
	isPressed: boolean;
	onToggle: () => void;
	shouldReduceMotion: boolean | null;
}>) {
	const enterTransition = resolveOmnibarTransition(OMNIBAR_CONTEXT_ENTER, shouldReduceMotion);
	const exitTransition = resolveOmnibarTransition(OMNIBAR_CONTEXT_EXIT, shouldReduceMotion);

	return (
		<motion.div
			animate="visible"
			className="pointer-events-auto"
			data-slot="omnibar-context-pill"
			exit="hidden"
			initial="hidden"
			style={{ willChange: "opacity, transform" }}
			variants={{
				hidden: { opacity: 0, y: 8, transition: exitTransition },
				visible: { opacity: 1, y: 0, transition: enterTransition },
			}}
		>
			<OmnibarTimelinePill
				isInverse={isInverse}
				isPressed={isPressed}
				onToggle={onToggle}
			/>
		</motion.div>
	);
}

export function OmnibarBar({
	onOpenPanel,
	onSubmit,
	onValueChange,
	placeholder,
	shouldReduceMotion,
	hideContextPill = false,
	submitDisabled,
	timeline,
	tone,
	value,
}: Readonly<OmnibarBarProps>) {
	const enterTransition = resolveOmnibarTransition(OMNIBAR_CONTENT, shouldReduceMotion);
	const exitTransition = resolveOmnibarTransition(OMNIBAR_CONTENT_EXIT, shouldReduceMotion);
	// Only the horizontal axis takes over this bar. `y` docks its rail to the screen edge
	// as a sibling surface, so the editor and the trailing controls stay exactly as they
	// are and the toggle just reads as pressed.
	const isRailInBar = timeline?.isTimeline === true && timeline.axis === "x";
	const isInverse = tone === "inverse";
	const iconColor = isInverse ? token("color.icon.inverse") : "currentColor";
	const ghostButtonClassName = isInverse ? OMNIBAR_GHOST_BUTTON : undefined;

	return (
		<motion.div
			animate={{ opacity: 1 }}
			className="flex w-full flex-col items-start gap-2 overflow-visible"
			data-slot="omnibar-bar"
			exit={{ opacity: 0, transition: exitTransition }}
			initial={{ opacity: 0 }}
			// Position only — a size `layout` here would scale placeholder/button type.
			layout="position"
			style={{ willChange: "opacity" }}
			transition={enterTransition}
		>
			{timeline && !hideContextPill ? (
				<OmnibarTimelinePill
					isInverse={isInverse}
					isPressed={timeline.isTimeline}
					onToggle={timeline.onToggle}
				/>
			) : null}
			<FloatingComposer
				actions={
					isRailInBar ? (
						<PromptInputButton
							aria-label="Exit timeline"
							className={ghostButtonClassName}
							onClick={timeline.onExit}
							size="icon-sm"
							tooltip="Exit timeline"
							variant="ghost"
						>
							<CrossIcon color={iconColor} label="" />
						</PromptInputButton>
					) : (
						<>
							<PromptInputButton
								aria-label="Switch to side panel"
								className={ghostButtonClassName}
								onClick={onOpenPanel}
								size="icon-sm"
								tooltip="Switch to side panel"
								variant="ghost"
							>
								<PanelRightIcon color={iconColor} label="" />
							</PromptInputButton>
							<RovoComposerActionButton
								canSubmit={value.trim().length > 0}
								composerStatus="ready"
								onStop={noopStop}
								showSubmitWhenEmpty
								submitButtonClassName={isInverse ? OMNIBAR_SUBMIT_BUTTON : undefined}
								submitDisabled={submitDisabled}
							/>
						</>
					)
				}
				addButton={
					<PromptInputButton
						aria-label="Add"
						className={ghostButtonClassName}
						size="icon-sm"
						variant="ghost"
					>
						<AddIcon color={iconColor} label="" />
					</PromptInputButton>
				}
				allowOverflow={isRailInBar}
				aria-label="Ask Rovo"
				className={cn(
					"w-full",
					isInverse ? OMNIBAR_BAR_SKIN : null,
					isRailInBar ? OMNIBAR_TIMELINE_SKIN : null,
				)}
				layout={isRailInBar ? "compact" : "auto"}
				onSubmit={onSubmit}
			>
				{isRailInBar ? (
					<div className={OMNIBAR_RAIL_CELL}>
						<ScrubberRail
							activeIndex={timeline.activeIndex}
							ariaLabel="Timeline"
							axis="x"
							className={OMNIBAR_RAIL_BLOCK}
							entries={timeline.entries}
							onSelect={timeline.onSelect}
							tone={isInverse ? "inverse" : undefined}
						/>
					</div>
				) : (
					<PromptInputTextarea
						aria-label="Ask Rovo"
						className={cn(
							floatingComposerTextareaClassName,
							"text-sm",
							isInverse ? "text-text-inverse" : "leading-5",
						)}
						onChange={(event) => onValueChange(event.currentTarget.value)}
						onEditorReady={(editor) => {
							if (timeline?.consumeFocusRestore() === true) {
								editor.commands.focus("end");
							}
						}}
						placeholder={placeholder}
						rows={1}
						value={value}
					/>
				)}
			</FloatingComposer>
		</motion.div>
	);
}
