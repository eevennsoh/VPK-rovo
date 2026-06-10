import * as React from "react";

import CrossIcon from "@atlaskit/icon/core/cross";
import StatusVerifiedIcon from "@atlaskit/icon/core/status-verified";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type LegacyTagVariant = "success" | "removed" | "inprogress" | "new" | "moved";

type TagVariant = "default" | "rounded" | LegacyTagVariant;

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

const tagColorClasses: Record<ResolvedTagColor, { border: string; icon: string }> = {
	gray: { border: "border-neutral-500", icon: "text-neutral-500" },
	blue: { border: "border-blue-500", icon: "text-blue-500" },
	green: { border: "border-green-500", icon: "text-green-400" },
	red: { border: "border-red-500", icon: "text-red-600" },
	yellow: { border: "border-yellow-400", icon: "text-yellow-400" },
	purple: { border: "border-purple-500", icon: "text-purple-500" },
	discovery: { border: "border-border-discovery", icon: "text-icon-discovery" },
	lime: { border: "border-lime-400", icon: "text-lime-400" },
	magenta: { border: "border-pink-500", icon: "text-pink-500" },
	orange: { border: "border-orange-400", icon: "text-orange-400" },
	teal: { border: "border-teal-400", icon: "text-teal-400" },
};

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
	/** Element rendered before the tag text, such as an icon, logo, or avatar. */
	elemBefore?: React.ReactNode;
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
	elemBefore,
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
	const isInteractive = Boolean(onClick);
	const shouldShowVerifiedIcon = isOtherAvatarTag && isVerified;
	const isOverlayRemove = Boolean(onRemove) && removeVariant === "overlay";
	// Any tag rendering the inline "x" remove button gets the standard 4px
	// right padding (matching non-removable logo/default tags).
	const hasRemoveButton = Boolean(onRemove) && !isOverlayRemove;
	// Round the remove button to match the tag shape: pill tags (user avatars or
	// rounded tags) get a fully-rounded "x"; everything else stays `rounded-xs`.
	const removeButtonShapeClass = isUserAvatarTag || isRounded ? "rounded-full" : "rounded-xs";
	const removeButtonMarginClass = hasLeadingElement ? "mr-[-2px]" : "-mx-0.5";
	const avatarTagBeforeShapeClass = isUserAvatarTag ? "rounded-full" : isOtherAvatarTag ? "rounded-xs" : "";

	const childText = typeof children === "string" || typeof children === "number" ? String(children) : undefined;
	const resolvedRemoveButtonLabel = childText ? `${removeButtonLabel} ${childText}` : removeButtonLabel;
	const resolvedStyle = maxWidth !== undefined ? { ...style, maxWidth } : style;

	const handleRemoveClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();
		onRemove?.();
	};

	return (
		<span
			{...props}
			ref={ref}
			onClick={onClick}
			style={resolvedStyle}
			className={cn(
				"group/tag relative inline-flex max-w-[11.25rem] min-w-0 shrink-0 self-start items-center border bg-bg-neutral-subtle text-xs leading-4 font-normal text-text transition-colors box-border",
				"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none",
				colorClasses.border,
				cn(
					"h-5",
					// Front slot and avatar slot share one leading-padding/gap branch.
					// 1px left padding so the visible inset reads correctly once the
					// tag's 1px inner border is counted.
					hasLeadingElement ? "gap-0.5 py-0 ps-px" : "gap-1 py-0.5 ps-[4px]",
					// Avatar types keep their fixed rounding; everything else honors `isRounded`.
					isUserAvatarTag ? "rounded-full" : isOtherAvatarTag || type === "agent" ? "rounded-sm" : isRounded ? "rounded-full" : "rounded-sm",
					// Removable tags and logo/default tags get 4px right padding;
					// otherwise keep the avatar-type defaults (user 6px, other 4px).
					hasRemoveButton ? "pe-[4px]" : isUserAvatarTag ? "pe-1.5" : isAvatarType ? "pe-1" : "pe-[4px]",
				),
				isInteractive ? "cursor-pointer hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed" : "cursor-default",
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
						"flex size-4 shrink-0 items-center justify-center [&>*]:size-full [&>svg]:size-4",
						hasAvatarTagStyles ? cn("overflow-hidden", avatarTagBeforeShapeClass) : colorClasses.icon,
					)}
					data-slot="tag-before"
				>
					{elemBefore}
				</span>
			) : null}
			<span
				className={cn(
					"min-w-0 grow truncate whitespace-nowrap",
					// Overlay-remove tags fade the trailing edge of the *label itself*
					// (mask to transparent) on hover/focus so the floating X stays
					// legible. Masking the text — rather than painting a colored
					// gradient scrim on top — keeps the effect correct regardless of
					// the surface color behind the tag.
					isOverlayRemove &&
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
			{onRemove && !isOverlayRemove ? (
				<span className="inline-flex shrink-0 items-center" data-slot="tag-after">
					<button
						type="button"
						aria-label={resolvedRemoveButtonLabel}
						disabled={disabled}
						onClick={handleRemoveClick}
						className={cn(
							"inline-flex size-4 shrink-0 items-center justify-center border-0 bg-bg-neutral-subtle text-text transition-colors hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none disabled:pointer-events-none",
							removeButtonShapeClass,
							removeButtonMarginClass,
						)}
					>
						<Icon render={<CrossIcon label="" size="small" color="currentColor" />} aria-hidden />
					</button>
				</span>
			) : null}
			{isOverlayRemove ? (
				<>
					{/* No colored scrim: the trailing edge of the label text is masked
					    to transparent on hover/focus (see data-tag-text above) so the X
					    stays legible without assuming the surface color behind the tag. */}
					<button
						type="button"
						aria-label={resolvedRemoveButtonLabel}
						disabled={disabled}
						onClick={handleRemoveClick}
						data-slot="tag-remove-overlay-button"
						className={cn(
							"absolute end-px top-1/2 inline-flex size-4 -translate-y-1/2 items-center justify-center border-0 bg-transparent text-text opacity-0 transition-[opacity,background-color] duration-fast ease-out hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none disabled:pointer-events-none",
							removeButtonShapeClass,
							"pointer-events-none group-hover/tag:pointer-events-auto group-hover/tag:opacity-100 group-focus-within/tag:pointer-events-auto group-focus-within/tag:opacity-100",
						)}
					>
						<Icon render={<CrossIcon label="" size="small" color="currentColor" />} aria-hidden />
					</button>
				</>
			) : null}
		</span>
	);
});

type TagGroupProps = React.ComponentProps<"div">;

function TagGroup({ className, ...props }: Readonly<TagGroupProps>) {
	return <div data-slot="tag-group" className={cn("flex flex-wrap gap-2", className)} {...props} />;
}

export { Tag, TagGroup, type TagProps, type TagGroupProps, type TagVariant, type TagColor, type TagType };
