"use client";

import AddIcon from "@atlaskit/icon/core/add";
import CrossIcon from "@atlaskit/icon/core/cross";
import CustomizeIcon from "@atlaskit/icon/core/customize";
import PanelRightIcon from "@atlaskit/icon/core/panel-right";
import HourglassIcon from "@atlaskit/icon-lab/core/hourglass";
import { motion } from "motion/react";

import { ScrubberRail } from "@/components/blocks/scrubber/components/scrubber-rail";
import type { ScrubberEntry } from "@/components/blocks/scrubber/lib/scrubber-entries";
import { FloatingComposer } from "@/components/projects/shared/components/floating-composer";
import { RovoComposerActionButton } from "@/components/projects/shared/components/rovo-composer-send-controls";
import { floatingComposerTextareaClassName } from "@/components/projects/shared/components/rovo-composer-styles";
import {
	PromptInputButton,
	PromptInputTextarea,
} from "@/components/ui-custom/prompt-input";
import { cn } from "@/lib/utils";
import { token } from "@/lib/tokens";

import { OMNIBAR_CONTENT, resolveOmnibarTransition } from "../omnibar-motion";

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
 * The Timeline toggle, on the inverse skin.
 *
 * `aria-pressed` is both the announced state and the entire selected treatment. The
 * shared button base paints it `background.selected` / `text.selected`, which is a light
 * blue chip designed for a light surface — on the black bar it reads as a foreign object,
 * so the pressed pair is re-pointed at the same `neutral.bold.hovered` fill the other
 * inverse controls use. tailwind-merge resolves these against the base cva's
 * `aria-pressed:*` classes because they land in the same property groups, so no `!` is
 * needed here.
 */
const OMNIBAR_TOGGLE_BUTTON = cn(
	OMNIBAR_GHOST_BUTTON,
	"text-text-inverse",
	"aria-pressed:bg-bg-neutral-bold-hovered aria-pressed:text-text-inverse aria-pressed:border-transparent",
	"aria-pressed:hover:bg-bg-neutral-bold-hovered aria-pressed:active:bg-bg-neutral-bold-pressed",
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
	timeline?: OmnibarBarTimeline;
	value: string;
}

/**
 * Expanded state: the shared floating composer, re-skinned black.
 *
 * `FloatingComposer` already owns the `[ + ] [ editor ] [ actions ]` row and the measurement
 * that stacks the editor onto its own line once a draft would wrap, so this only supplies
 * the controls and the inverse palette.
 *
 * With a `timeline`, the leading cluster grows a `⌛ Timeline` toggle. On the `x` axis that
 * toggle swaps this bar's editor cell for the notch rail and turns the trailing send into a
 * close — the shell, its chrome, and its position never move under the click. On `y` the bar
 * is unchanged and the rail docks to the screen edge instead; the toggle only reads pressed.
 */
export function OmnibarBar({
	onOpenPanel,
	onSubmit,
	onValueChange,
	placeholder,
	shouldReduceMotion,
	timeline,
	value,
}: Readonly<OmnibarBarProps>) {
	const transition = resolveOmnibarTransition(OMNIBAR_CONTENT, shouldReduceMotion);
	// Only the horizontal axis takes over this bar. `y` docks its rail to the screen edge
	// as a sibling surface, so the editor and the trailing controls stay exactly as they
	// are and the toggle just reads as pressed.
	const isRailInBar = timeline?.isTimeline === true && timeline.axis === "x";

	return (
		<motion.div
			animate={{ opacity: 1 }}
			className="w-full"
			data-slot="omnibar-bar"
			exit={{ opacity: 0, transition }}
			initial={{ opacity: 0 }}
			style={{ willChange: "opacity" }}
			transition={transition}
		>
			<FloatingComposer
				actions={
					isRailInBar ? (
						<PromptInputButton
							aria-label="Exit timeline"
							className={OMNIBAR_GHOST_BUTTON}
							onClick={timeline.onExit}
							size="icon-sm"
							tooltip="Exit timeline"
							variant="ghost"
						>
							<CrossIcon color={token("color.icon.inverse")} label="" />
						</PromptInputButton>
					) : (
						<>
							<PromptInputButton
								aria-label="Switch to side panel"
								className={OMNIBAR_GHOST_BUTTON}
								onClick={onOpenPanel}
								size="icon-sm"
								tooltip="Switch to side panel"
								variant="ghost"
							>
								<PanelRightIcon color={token("color.icon.inverse")} label="" />
							</PromptInputButton>
							<RovoComposerActionButton
								canSubmit={value.trim().length > 0}
								composerStatus="ready"
								onStop={noopStop}
								showSubmitWhenEmpty
								submitButtonClassName={OMNIBAR_SUBMIT_BUTTON}
							/>
						</>
					)
				}
				addButton={
					// The leading cluster is identical in both modes on purpose. Dropping the two
					// decorative controls while scrubbing would slide the Timeline pill left, out
					// from under the pointer that just pressed it.
					<>
						<PromptInputButton
							aria-label="Add"
							className={OMNIBAR_GHOST_BUTTON}
							size="icon-sm"
							variant="ghost"
						>
							<AddIcon color={token("color.icon.inverse")} label="" />
						</PromptInputButton>
						<PromptInputButton
							aria-label="Customize"
							className={OMNIBAR_GHOST_BUTTON}
							size="icon-sm"
							variant="ghost"
						>
							<CustomizeIcon color={token("color.icon.inverse")} label="" />
						</PromptInputButton>
						{timeline ? (
							<PromptInputButton
								aria-label="Timeline"
								aria-pressed={timeline.isTimeline}
								className={OMNIBAR_TOGGLE_BUTTON}
								onClick={timeline.onToggle}
								size="sm"
								tooltip="Scrub the timeline"
								variant="ghost"
							>
								{/* ADS ships icon colour as unlayered Compiled CSS, so `currentColor`
								    is the only way the pressed text colour reaches the glyph. */}
								<HourglassIcon color="currentColor" label="" />
								<span>Timeline</span>
							</PromptInputButton>
						) : null}
					</>
				}
				allowOverflow={isRailInBar}
				aria-label="Ask Rovo"
				className={cn(OMNIBAR_BAR_SKIN, isRailInBar ? OMNIBAR_TIMELINE_SKIN : null)}
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
							tone="inverse"
						/>
					</div>
				) : (
					<PromptInputTextarea
						aria-label="Ask Rovo"
						className={cn(floatingComposerTextareaClassName, "text-sm text-text-inverse")}
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
