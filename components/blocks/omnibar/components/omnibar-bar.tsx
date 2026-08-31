"use client";

import AddIcon from "@atlaskit/icon/core/add";
import CustomizeIcon from "@atlaskit/icon/core/customize";
import PanelRightIcon from "@atlaskit/icon/core/panel-right";
import { motion } from "motion/react";

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

// Dictation is out of scope for this block, so the action cluster resolves to submit only.
const noopStop = () => undefined;

export interface OmnibarBarProps {
	onOpenPanel: () => void;
	onSubmit: () => void;
	onValueChange: (value: string) => void;
	placeholder: string;
	shouldReduceMotion: boolean | null;
	value: string;
}

/**
 * Expanded state: the shared floating composer, re-skinned black.
 *
 * `FloatingComposer` already owns the `[ + ] [ editor ] [ actions ]` row and the measurement
 * that stacks the editor onto its own line once a draft would wrap, so this only supplies
 * the controls and the inverse palette.
 */
export function OmnibarBar({
	onOpenPanel,
	onSubmit,
	onValueChange,
	placeholder,
	shouldReduceMotion,
	value,
}: Readonly<OmnibarBarProps>) {
	const transition = resolveOmnibarTransition(OMNIBAR_CONTENT, shouldReduceMotion);

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
				}
				addButton={
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
					</>
				}
				aria-label="Ask Rovo"
				className={OMNIBAR_BAR_SKIN}
				onSubmit={onSubmit}
			>
				<PromptInputTextarea
					aria-label="Ask Rovo"
					className={cn(floatingComposerTextareaClassName, "text-sm text-text-inverse")}
					onChange={(event) => onValueChange(event.currentTarget.value)}
					placeholder={placeholder}
					rows={1}
					value={value}
				/>
			</FloatingComposer>
		</motion.div>
	);
}
