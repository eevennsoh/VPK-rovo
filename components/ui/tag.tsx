import * as React from "react";

import CrossIcon from "@atlaskit/icon/core/cross";
import StatusVerifiedIcon from "@atlaskit/icon/core/status-verified";

import { Icon } from "@/components/ui/icon";
import { withTooltip } from "@/components/ui/tooltip-utils";
import { cn } from "@/lib/utils";

type LegacyTagVariant = "success" | "removed" | "inprogress" | "new" | "moved";

type TagVariant = "default" | "rounded" | "editor" | LegacyTagVariant;

type TagColor =
	| "standard"
	| "gray"
	| "grey"
	| "blue"
	| "green"
	| "red"
	| "yellow"
	| "purple"
	| "discovery"
	| "lime"
	| "magenta"
	| "orange"
	| "teal"
	| "grayLight"
	| "greyLight"
	| "blueLight"
	| "greenLight"
	| "redLight"
	| "yellowLight"
	| "purpleLight"
	| "limeLight"
	| "magentaLight"
	| "orangeLight"
	| "tealLight";

type ResolvedTagColor = "gray" | "blue" | "green" | "red" | "yellow" | "purple" | "discovery" | "lime" | "magenta" | "orange" | "teal";

type TagType = "default" | "user" | "other" | "agent";

const legacyVariantToColor: Record<TagVariant, TagColor> = {
	default: "standard",
	rounded: "standard",
	editor: "standard",
	success: "green",
	removed: "red",
	inprogress: "blue",
	new: "purple",
	moved: "yellow",
};

const colorAliases: Record<TagColor, ResolvedTagColor> = {
	standard: "gray",
	gray: "gray",
	grey: "gray",
	grayLight: "gray",
	greyLight: "gray",
	blue: "blue",
	blueLight: "blue",
	green: "green",
	greenLight: "green",
	red: "red",
	redLight: "red",
	yellow: "yellow",
	yellowLight: "yellow",
	purple: "purple",
	discovery: "discovery",
	purpleLight: "purple",
	lime: "lime",
	limeLight: "lime",
	magenta: "magenta",
	magentaLight: "magenta",
	orange: "orange",
	orangeLight: "orange",
	teal: "teal",
	tealLight: "teal",
};

const tagColorClasses: Record<ResolvedTagColor, { border: string; icon: string; metric: string }> = {
	gray: {
		border: "border-border-accent-gray-subtle",
		icon: "text-icon-accent-gray group-hover/tag:text-text-accent-gray group-active/tag:text-text-accent-gray",
		metric: "bg-bg-accent-gray-subtler",
	},
	blue: {
		border: "border-border-accent-blue-subtle",
		icon: "text-icon-accent-blue group-hover/tag:text-text-accent-blue group-active/tag:text-text-accent-blue",
		metric: "bg-bg-accent-blue-subtler",
	},
	green: {
		border: "border-border-accent-green-subtle",
		icon: "text-icon-accent-green group-hover/tag:text-text-accent-green group-active/tag:text-text-accent-green",
		metric: "bg-bg-accent-green-subtler",
	},
	red: {
		border: "border-border-accent-red-subtle",
		icon: "text-icon-accent-red group-hover/tag:text-text-accent-red group-active/tag:text-text-accent-red",
		metric: "bg-bg-accent-red-subtler",
	},
	yellow: {
		border: "border-border-accent-yellow-subtle",
		icon: "text-icon-accent-yellow group-hover/tag:text-text-accent-yellow group-active/tag:text-text-accent-yellow",
		metric: "bg-bg-accent-yellow-subtler",
	},
	purple: {
		border: "border-border-accent-purple-subtle",
		icon: "text-icon-accent-purple group-hover/tag:text-text-accent-purple group-active/tag:text-text-accent-purple",
		metric: "bg-bg-accent-purple-subtler",
	},
	discovery: {
		border: "border-border-discovery-subtle",
		icon: "text-icon-discovery group-hover/tag:text-text-discovery group-active/tag:text-text-discovery",
		metric: "bg-bg-discovery-subtler",
	},
	lime: {
		border: "border-border-accent-lime-subtle",
		icon: "text-icon-accent-lime group-hover/tag:text-text-accent-lime group-active/tag:text-text-accent-lime",
		metric: "bg-bg-accent-lime-subtler",
	},
	magenta: {
		border: "border-border-accent-magenta-subtle",
		icon: "text-icon-accent-magenta group-hover/tag:text-text-accent-magenta group-active/tag:text-text-accent-magenta",
		metric: "bg-bg-accent-magenta-subtler",
	},
	orange: {
		border: "border-border-accent-orange-subtle",
		icon: "text-icon-accent-orange group-hover/tag:text-text-accent-orange group-active/tag:text-text-accent-orange",
		metric: "bg-bg-accent-orange-subtler",
	},
	teal: {
		border: "border-border-accent-teal-subtle",
		icon: "text-icon-accent-teal group-hover/tag:text-text-accent-teal group-active/tag:text-text-accent-teal",
		metric: "bg-bg-accent-teal-subtler",
	},
};

/** A non-remove control rendered in the tag's hover-reveal overlay slot. */
interface TagOverlayAction {
	/** Icon shown inside the control (wrapped in the shared `Icon` for sizing). */
	icon: React.ReactElement;
	/** Accessible name for the control's button. */
	label: string;
	/** Optional tooltip text shown on hover/focus. */
	tooltip?: string;
	/** Invoked when the control is activated. */
	onClick: () => void;
}

interface TagProps extends Omit<React.ComponentProps<"span">, "color"> {
	as?: React.ElementType;
	children: React.ReactNode;
	variant?: TagVariant;
	color?: TagColor;
	shape?: "default" | "rounded";
	type?: TagType;
	disabled?: boolean;
	onRemove?: () => void;
	/**
	 * How the remove control occupies space.
	 * - `"inline"` (default): the remove button is laid out after the label and reserves horizontal space.
	 * - `"overlay"`: the remove button floats over the trailing edge and only appears on hover/focus,
	 *   fading into the label behind a gradient backdrop. The label keeps its full width.
	 */
	removeVariant?: "inline" | "overlay";
	removeButtonLabel?: string;
	/**
	 * A non-remove control occupying the same hover-reveal overlay slot as the
	 * remove "×" (mutually exclusive with `onRemove` overlay). Use for actions
	 * that aren't a removal — e.g. a swap icon that reverts an auto-tagged token
	 * back to text. Kept distinct from `onRemove` so "remove" styling/selectors
	 * (`data-slot="tag-remove-overlay-button"`) never match this action.
	 */
	overlayAction?: TagOverlayAction;
	/** Element rendered before the tag text, such as an icon, logo, or avatar. */
	elemBefore?: React.ReactNode;
	/**
	 * Element rendered after the tag text, such as a count `<Badge>`. It sits in
	 * its own trailing slot (before any remove button) and stays `shrink-0`, so
	 * the label keeps the ellipsis while the trailing element stays fully visible.
	 */
	elemAfter?: React.ReactNode;
	/** Compact metric rendered after the tag text using the tag color's accent-subtler fill. */
	trailingMetric?: string | number;
	isVerified?: boolean;
	maxWidth?: React.CSSProperties["maxWidth"];
}

const Tag = React.forwardRef<HTMLSpanElement, TagProps>(function Tag({
	as,
	children,
	variant = "default",
	color,
	shape = "default",
	type = "default",
	disabled = false,
	onRemove,
	removeVariant = "inline",
	removeButtonLabel = "Remove",
	overlayAction,
	elemBefore,
	elemAfter,
	trailingMetric,
	isVerified = false,
	maxWidth,
	className,
	style,
	onClick,
	...props
}: Readonly<TagProps>, ref) {
	void as;

	const resolvedColor = colorAliases[color ?? legacyVariantToColor[variant]];
	const colorClasses = tagColorClasses[resolvedColor];
	// The front slot (logos) and the avatar slot are the same thing: both render
	// content via `elemBefore`. Anything with a leading element shares one slot
	// styling branch (leading padding / gap / right padding). The real avatar
	// `type`s only differ in how the before-element itself is rendered (16px
	// avatar vs 12px logo icon) and in their fixed rounding.
	const hasLeadingElement = Boolean(elemBefore);
	const isAvatarType = type !== "default";
	const hasAvatarTagStyles = isAvatarType && hasLeadingElement;
	const isUserAvatarTag = hasAvatarTagStyles && type === "user";
	const isOtherAvatarTag = hasAvatarTagStyles && type === "other";
	const isRounded = shape === "rounded" || variant === "rounded";
	// The "editor" variant drops the colored border stroke and swaps the surface
	// from the hollow `bg-bg-neutral-subtle` to the solid `bg-bg-neutral` fill —
	// matching the filled treatment used by SkillTag (`components/ui-custom/skill-tag`).
	// The leading-icon accent color (`colorClasses.icon`) is preserved.
	const isEditor = variant === "editor";
	const isInteractive = Boolean(onClick);
	const shouldShowVerifiedIcon = isOtherAvatarTag && isVerified;
	const isOverlayRemove = Boolean(onRemove) && removeVariant === "overlay";
	// Any tag rendering the inline "x" remove button gets the standard 4px
	// right padding (matching non-removable logo/default tags).
	const hasRemoveButton = Boolean(onRemove) && !isOverlayRemove;
	const hasOverlayControl = isOverlayRemove || Boolean(overlayAction);
	const resolvedElemAfter = elemAfter ?? (
		trailingMetric != null && trailingMetric !== "" ? (
			<span
				className={cn(
					"inline-flex h-4 min-w-6 shrink-0 items-center justify-center rounded-xs px-1 text-xs leading-4 text-text",
					colorClasses.metric,
				)}
				data-slot="tag-trailing-metric"
			>
				{trailingMetric}
			</span>
		) : null
	);
	// A trailing `elemAfter` (typically a count `<Badge>`) sits flush at the edge:
	// it carries its own internal padding, so the tag only needs a hairline 1px
	// inset to clear the inner border (no remove button reserving space here).
	const hasElemAfter = Boolean(resolvedElemAfter);
	// Round the remove button to match the tag shape: all avatar tags and
	// explicitly rounded tags get a fully-rounded "x".
	const removeButtonShapeClass = isAvatarType || isRounded ? "rounded-full" : "rounded-xs";
	const removeButtonMarginClass = hasLeadingElement ? "mr-[-2px]" : "-mx-0.5";
	const avatarTagBeforeShapeClass = isUserAvatarTag ? "rounded-full" : isOtherAvatarTag ? "rounded-xs" : "";

	const childText = typeof children === "string" || typeof children === "number" ? String(children) : undefined;
	const resolvedRemoveButtonLabel = childText ? `${removeButtonLabel} ${childText}` : removeButtonLabel;
	const resolvedStyle = maxWidth !== undefined ? { ...style, maxWidth } : style;

	const handleRemoveClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();
		onRemove?.();
	};

	// Resolve the single hover-reveal overlay control: a custom action takes
	// precedence; otherwise the overlay-variant remove "×". Built lazily (null
	// when neither applies) so non-removable tags allocate no icon/closure.
	const overlayControl: {
		icon: React.ReactElement;
		label: string;
		tooltip?: string;
		slot: string;
		onClick: () => void;
	} | null = overlayAction
		? {
			icon: overlayAction.icon,
			label: overlayAction.label,
			tooltip: overlayAction.tooltip,
			slot: "tag-overlay-action-button",
			onClick: overlayAction.onClick,
		}
		: isOverlayRemove
			? {
				icon: <CrossIcon label="" size="small" color="currentColor" />,
				label: resolvedRemoveButtonLabel,
				slot: "tag-remove-overlay-button",
				onClick: () => onRemove?.(),
			}
			: null;

	return (
		<span
			{...props}
			ref={ref}
			onClick={onClick}
			style={resolvedStyle}
			className={cn(
				"group/tag relative inline-flex max-w-[11.25rem] min-w-0 shrink-0 self-start items-center text-xs leading-4 font-normal text-text transition-colors box-border",
				"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none",
				isEditor ? "border-0 bg-bg-neutral" : cn("border bg-bg-neutral-subtle", colorClasses.border),
				cn(
					"h-5",
					// Front slot and avatar slot share one leading-padding/gap branch.
					// Team/project avatars get 2px left padding so their rounded-square
					// shape reads with the same inset as circular and hexagonal avatars.
					hasLeadingElement
						? cn(hasElemAfter ? "gap-1" : "gap-0.5", "py-0", isOtherAvatarTag ? "ps-0.5" : "ps-px")
						: "gap-1 py-0.5 ps-[4px]",
					// All avatar tags use the same pill shell while preserving the
					// circle, square, or hexagon shape of their leading avatar.
					isAvatarType || isRounded ? "rounded-full" : "rounded-sm",
					// Removable tags and logo/default tags get 4px right padding;
					// a trailing badge (`elemAfter`) tightens to 1px so it sits flush;
					// otherwise every avatar type gets the same 6px trailing inset.
					hasRemoveButton ? "pe-[4px]" : hasElemAfter ? "pe-px" : isAvatarType ? "pe-1.5" : "pe-[4px]",
				),
				isInteractive ? cn("cursor-pointer", isEditor ? "hover:bg-bg-neutral-hovered active:bg-bg-neutral-pressed" : "hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed") : "cursor-default",
				disabled && "pointer-events-none opacity-(--opacity-disabled)",
				className,
			)}
			data-slot="tag"
			data-type={type}
			aria-disabled={disabled || undefined}
		>
			{elemBefore ? (
				<span
					className={cn(
						// Front slot and avatar slot share a 16x16 leading box; the element fills it.
						// Inset glyphs are 12px: direct `Icon` children are constrained here,
						// while inset logos come from their own wrapper — `IconTile
						// variant="transparent" size="xxsmall"` (12px content) or `BrandLogoMark
						// frame="chip"` (bordered marks at 12px, solid marks fill the box).
						// Solid product marks fill the full
						// 16px box; avatars (type=user/other) likewise fill it.
						"flex size-4 shrink-0 items-center justify-center [&>*]:size-full [&>svg]:size-4 [&>[data-slot=icon]>span]:size-3! [&>[data-slot=icon]_svg]:size-3!",
						hasAvatarTagStyles ? cn("overflow-hidden", avatarTagBeforeShapeClass) : colorClasses.icon,
					)}
					data-slot="tag-before"
				>
					{elemBefore}
				</span>
			) : null}
			<span
				className={cn(
					// `truncate` sets `overflow: hidden`, which clips vertically as well
					// as horizontally. The Tag root's `leading-4` (16px) line box is too
					// short for Atlassian Sans descenders, so `p`/`g`/`y` get sliced at
					// the clip edge. Match the chip's 20px height (`h-5`) with `leading-5`
					// so descenders have room; the glyph stays vertically centered (flex
					// `items-center`) and left-aligned, so no alignment shifts.
					"min-w-0 grow truncate whitespace-nowrap leading-5",
					// Overlay-control tags fade the trailing edge of the *label itself*
					// (mask to transparent) on hover/focus so the floating control stays
					// legible. Masking the text — rather than painting a colored
					// gradient scrim on top — keeps the effect correct regardless of
					// the surface color behind the tag.
					hasOverlayControl &&
						"group-hover/tag:[mask-image:linear-gradient(to_right,#000_calc(100%-2.25rem),transparent_calc(100%-1.25rem))] group-focus-within/tag:[mask-image:linear-gradient(to_right,#000_calc(100%-2.25rem),transparent_calc(100%-1.25rem))] group-hover/tag:[-webkit-mask-image:linear-gradient(to_right,#000_calc(100%-2.25rem),transparent_calc(100%-1.25rem))] group-focus-within/tag:[-webkit-mask-image:linear-gradient(to_right,#000_calc(100%-2.25rem),transparent_calc(100%-1.25rem))]",
				)}
				data-tag-text
			>
				{children}
			</span>
			{shouldShowVerifiedIcon ? (
				<span className="ml-px inline-flex shrink-0 items-center text-blue-500" data-slot="tag-verified-icon">
					<Icon render={<StatusVerifiedIcon label="" size="small" />} label="Verified" />
				</span>
			) : null}
			{resolvedElemAfter ? (
				<span
					className={cn(
						"inline-flex shrink-0 items-center",
						// When an overlay control shares the trailing edge, it floats
						// absolutely over this slot on hover/focus. Fade the trailing
						// content out (and drop pointer events) in that state — mirroring
						// the label's trailing-edge mask — so the control stays legible
						// and clickable instead of sitting on top of the badge.
						hasOverlayControl &&
							"transition-opacity duration-fast ease-out group-hover/tag:pointer-events-none group-hover/tag:opacity-0 group-focus-within/tag:pointer-events-none group-focus-within/tag:opacity-0",
					)}
					data-slot="tag-after-content"
				>
					{resolvedElemAfter}
				</span>
			) : null}
			{hasRemoveButton ? (
				<span className="inline-flex shrink-0 items-center" data-slot="tag-after">
					<button
						type="button"
						aria-label={resolvedRemoveButtonLabel}
						disabled={disabled}
						onClick={handleRemoveClick}
						className={cn(
							"inline-flex size-4 shrink-0 items-center justify-center border-0 text-text transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none disabled:pointer-events-none",
							isEditor ? "bg-bg-neutral hover:bg-bg-neutral-hovered active:bg-bg-neutral-pressed" : "bg-bg-neutral-subtle hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed",
							removeButtonShapeClass,
							removeButtonMarginClass,
						)}
					>
						<Icon render={<CrossIcon label="" size="small" color="currentColor" />} aria-hidden />
					</button>
				</span>
			) : null}
			{overlayControl ? (
				/* No colored scrim: the trailing edge of the label text is masked to
				   transparent on hover/focus (see data-tag-text above) so the floating
				   control stays legible without assuming the surface color behind the tag. */
				withTooltip(
					<button
						type="button"
						aria-label={overlayControl.label}
						disabled={disabled}
						onClick={(event) => {
							event.stopPropagation();
							overlayControl.onClick();
						}}
						data-slot={overlayControl.slot}
						className={cn(
							"absolute end-px top-1/2 inline-flex size-4 -translate-y-1/2 items-center justify-center border-0 bg-transparent text-text opacity-0 transition-[opacity,background-color] duration-fast ease-out focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none disabled:pointer-events-none",
							isEditor ? "hover:bg-bg-neutral-hovered active:bg-bg-neutral-pressed" : "hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed",
							removeButtonShapeClass,
							"pointer-events-none group-hover/tag:pointer-events-auto group-hover/tag:opacity-100 group-focus-within/tag:pointer-events-auto group-focus-within/tag:opacity-100",
						)}
					>
						<Icon render={overlayControl.icon} aria-hidden />
					</button>,
					overlayControl.tooltip,
				)
			) : null}
		</span>
	);
});

type TagGroupProps = React.ComponentProps<"div">;

function TagGroup({ className, ...props }: Readonly<TagGroupProps>) {
	return <div data-slot="tag-group" className={cn("flex flex-wrap gap-2", className)} {...props} />;
}

export { Tag, TagGroup, type TagProps, type TagGroupProps, type TagVariant, type TagColor, type TagType, type TagOverlayAction };
