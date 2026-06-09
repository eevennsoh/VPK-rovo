"use client";

import * as React from "react";
import type {
  ComponentProps,
  ComponentType,
  ReactElement,
  ReactNode,
} from "react";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import CheckMarkIcon from "@atlaskit/icon/core/check-mark";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";

import { Icon } from "@/components/ui/icon";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

/**
 * Shared visual style tokens used by both DropdownMenu and Select components.
 * Select imports these directly so popup, item, group, label, and separator
 * styling stays in sync without duplication.
 */
export const dropdownStyles = {
  popup:
    "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=inline-end]:slide-in-from-left-2 bg-popover text-popover-foreground z-[200] max-h-(--available-height) min-w-56 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-xl p-1 shadow-xl outline-none duration-fast data-closed:overflow-hidden",
  group: "",
  selectableItem:
    "data-[highlighted]:bg-bg-neutral-subtle-hovered data-[highlighted]:text-text data-disabled:pointer-events-none data-disabled:text-text-disabled relative flex min-h-8 w-full cursor-pointer items-center rounded-lg py-1.5 pr-2 pl-8 text-sm leading-5 outline-none select-none active:bg-bg-neutral-subtle-pressed [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  checkedState:
    "data-checked:bg-bg-selected data-checked:text-text-selected data-checked:data-[highlighted]:bg-bg-selected-hovered data-checked:data-[highlighted]:text-text-selected data-checked:active:bg-bg-selected-pressed",
  label: "text-text-subtlest px-2 pt-3 pb-1 text-xs leading-4 font-semibold",
  separator: "bg-border mx-1 my-1 h-px",
  indicator:
    "pointer-events-none absolute left-2 inline-flex size-6 items-center justify-center text-icon-selected [&_[data-slot=icon]]:text-icon-selected [&_svg]:text-icon-selected",
} as const;

const dropdownMenuOverlayShadow = "shadow-2xl";
// The leading-icon slot defaults to the subtle icon token, but the @atlaskit
// icon glyph paints its SVG from `currentColor`, so this wrapper's `color` wins
// over the item's variant rules unless we yield on the destructive/selected
// states. Scope the subtle default to non-destructive, non-selected items so the
// item-level `[&_svg]:text-icon-danger` / `[&_svg]:text-icon-selected` rules take
// effect. (Using group-data so the slot reads the owning item's variant.)
const dropdownMenuFrontSlotClassName =
  "inline-flex size-6 shrink-0 items-center justify-center text-icon-subtle group-data-[variant=destructive]/dropdown-menu-item:text-icon-danger group-data-selected/dropdown-menu-item:text-icon-selected [&_[data-slot=icon]]:text-icon-subtle group-data-[variant=destructive]/dropdown-menu-item:[&_[data-slot=icon]]:text-icon-danger group-data-selected/dropdown-menu-item:[&_[data-slot=icon]]:text-icon-selected [&_svg]:text-icon-subtle group-data-[variant=destructive]/dropdown-menu-item:[&_svg]:text-icon-danger group-data-selected/dropdown-menu-item:[&_svg]:text-icon-selected";

type DropdownMenuProps = MenuPrimitive.Root.Props;

function DropdownMenu(props: Readonly<DropdownMenuProps>) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

type DropdownMenuPortalProps = MenuPrimitive.Portal.Props;

function DropdownMenuPortal(props: Readonly<DropdownMenuPortalProps>) {
  return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />;
}

interface DropdownMenuTriggerProps extends Omit<
  MenuPrimitive.Trigger.Props,
  "render"
> {
  render?: ReactElement;
}

function DropdownMenuTrigger({
  render,
  ...props
}: Readonly<DropdownMenuTriggerProps>) {
  const Trigger =
    MenuPrimitive.Trigger as ComponentType<DropdownMenuTriggerProps>;
  return (
    <Trigger data-slot="dropdown-menu-trigger" render={render} {...props} />
  );
}

interface DropdownMenuContentProps
  extends
    MenuPrimitive.Popup.Props,
    Pick<
      MenuPrimitive.Positioner.Props,
      "align" | "alignOffset" | "side" | "sideOffset"
    > {
  portalled?: boolean;
  portalContainer?: MenuPrimitive.Portal.Props["container"];
  /**
   * Class merged onto the Positioner. Use to override the default `z-[200]`
   * (the shared overlay tier, which sits above persistent chrome like the
   * top nav, product sidebar, and sidebar chat panel) when the trigger lives
   * inside an overlay with an even higher stacking z-index (e.g. floating
   * chat at z-[510]).
   */
  positionerClassName?: string;
}

function DropdownMenuContent({
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  portalled = true,
  portalContainer,
  className,
  positionerClassName,
  ...props
}: Readonly<DropdownMenuContentProps>) {
  const inlinePortalContainerRef = React.useRef<HTMLSpanElement | null>(null);
  const content = (
    <MenuPrimitive.Positioner
      className={cn("z-[200] outline-none", positionerClassName)}
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
		>
			<MenuPrimitive.Popup
				data-slot="dropdown-menu-content"
				className={cn(
					dropdownStyles.popup,
					dropdownMenuOverlayShadow,
					className,
				)}
				{...props}
			/>
		</MenuPrimitive.Positioner>
	);

  const resolvedPortalContainer = portalled
    ? portalContainer
    : (portalContainer ?? inlinePortalContainerRef);

  return (
    <>
      {!portalled ? (
        <span
          aria-hidden
          data-slot="dropdown-menu-inline-portal-container"
          className="contents"
          ref={inlinePortalContainerRef}
        />
      ) : null}
      <MenuPrimitive.Portal container={resolvedPortalContainer}>
        {content}
      </MenuPrimitive.Portal>
    </>
  );
}

type DropdownMenuGroupProps = MenuPrimitive.Group.Props;

function DropdownMenuGroup({
  className,
  ...props
}: Readonly<DropdownMenuGroupProps>) {
  return (
    <MenuPrimitive.Group
      data-slot="dropdown-menu-group"
      className={cn(dropdownStyles.group, className)}
      {...props}
    />
  );
}

interface DropdownMenuLabelProps extends MenuPrimitive.GroupLabel.Props {
  inset?: boolean;
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: Readonly<DropdownMenuLabelProps>) {
  return (
    <MenuPrimitive.GroupLabel
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(dropdownStyles.label, "data-inset:pl-8", className)}
      {...props}
    />
  );
}

type DropdownMenuItemClickHandler = NonNullable<MenuPrimitive.Item.Props["onClick"]>;

interface DropdownMenuItemProps extends Omit<MenuPrimitive.Item.Props, "onSelect"> {
  inset?: boolean;
  variant?: "default" | "destructive";
  /**
   * Marks the item as the active choice in a single-select menu. Applies the
   * selected background (with hover/pressed states), recolors the leading icon
   * to the selected icon token, and shows a trailing check mark unless the
   * caller supplies their own `elemAfter`.
   */
  selected?: boolean;
  elemBefore?: ReactNode;
  elemAfter?: ReactNode;
  description?: string;
  onSelect?: DropdownMenuItemClickHandler;
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  selected = false,
  elemBefore,
  elemAfter,
  description,
  children,
  onClick,
  onSelect,
  ...props
}: Readonly<DropdownMenuItemProps>) {
  const handleClick: DropdownMenuItemClickHandler = (event) => {
    onClick?.(event);

    if (event.baseUIHandlerPrevented) {
      return;
    }

    onSelect?.(event);

    if (event.defaultPrevented) {
      event.preventBaseUIHandler();
    }
  };

  // Default the trailing slot to a check mark when selected so every callsite
  // gets a consistent selected affordance without repeating it.
  const resolvedElemAfter =
    elemAfter ?? (selected ? <CheckMarkIcon label="" /> : undefined);
  const isSelected = selected && variant === "default";

  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      data-selected={isSelected || undefined}
      className={cn(
        // py-1.5 (6px) + leading-5 (20px) == 32px, so a single line lands exactly on the
        // min-h-8 floor and stays fixed at 32px; when the label or description wraps to
        // multiple lines the row grows with a consistent 6px top/bottom padding.
        "group/dropdown-menu-item data-[highlighted]:bg-bg-neutral-subtle-hovered data-[highlighted]:text-text data-[variant=destructive]:text-text-danger data-[variant=destructive]:data-[highlighted]:bg-bg-danger-subtler-hovered data-disabled:pointer-events-none data-disabled:text-text-disabled relative flex min-h-8 w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm leading-5 outline-none select-none active:bg-bg-neutral-subtle-pressed data-[variant=destructive]:active:bg-bg-danger-subtler-pressed data-inset:pl-8 [&_svg]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:text-icon-subtle data-[variant=destructive]:[&_svg]:text-icon-danger",
        // Selected state: selected surface + selected hover/pressed + selected icon/text tokens.
        "data-selected:bg-bg-selected data-selected:text-text-selected data-selected:data-[highlighted]:bg-bg-selected-hovered data-selected:data-[highlighted]:text-text-selected data-selected:active:bg-bg-selected-pressed data-selected:[&_svg]:text-icon-selected",
        className,
      )}
      onClick={handleClick}
      {...props}
    >
      {elemBefore ? (
        <span className={dropdownMenuFrontSlotClassName}>
          {elemBefore}
        </span>
      ) : null}
      <span className="min-w-0 flex flex-1 flex-col">
        <span className="min-w-0 whitespace-normal break-words">
          {children}
        </span>
        {description ? (
          <span
            data-slot="dropdown-menu-item-description"
            className="text-text-subtle text-[11px] leading-4"
          >
            {description}
          </span>
        ) : null}
      </span>
      {resolvedElemAfter ? (
        <span className={cn("ml-auto inline-flex h-5 shrink-0 items-center justify-center", variant === "destructive" ? "text-icon-danger" : isSelected ? "text-icon-selected" : "text-icon-subtle")}>
          {resolvedElemAfter}
        </span>
      ) : null}
    </MenuPrimitive.Item>
  );
}

type DropdownMenuSubProps = MenuPrimitive.SubmenuRoot.Props;

function DropdownMenuSub(props: Readonly<DropdownMenuSubProps>) {
  return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />;
}

interface DropdownMenuSubTriggerProps
  extends MenuPrimitive.SubmenuTrigger.Props {
  inset?: boolean;
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: Readonly<DropdownMenuSubTriggerProps>) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "group/dropdown-menu-item data-[highlighted]:bg-bg-neutral-subtle-hovered data-[highlighted]:text-text data-popup-open:bg-bg-neutral-subtle-hovered data-popup-open:text-text data-disabled:pointer-events-none data-disabled:text-text-disabled flex min-h-8 w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm leading-5 outline-none select-none active:bg-bg-neutral-subtle-pressed data-inset:pl-8 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      {children}
      <Icon
        render={<ChevronRightIcon label="" size="small" />}
        label="Open submenu"
        className="text-icon-subtle ml-auto"
      />
    </MenuPrimitive.SubmenuTrigger>
  );
}

type DropdownMenuSubContentProps = ComponentProps<typeof DropdownMenuContent>;

function DropdownMenuSubContent({
  align = "start",
  alignOffset = -4,
  side = "right",
  sideOffset = 2,
  className,
  ...props
}: Readonly<DropdownMenuSubContentProps>) {
  return (
    <DropdownMenuContent
      data-slot="dropdown-menu-sub-content"
      className={cn("w-auto min-w-48", className)}
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      {...props}
    />
  );
}

interface DropdownMenuCheckboxItemProps
  extends MenuPrimitive.CheckboxItem.Props {
  inset?: boolean;
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}: Readonly<DropdownMenuCheckboxItemProps>) {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      className={cn(
        dropdownStyles.selectableItem,
        dropdownStyles.checkedState,
        "data-inset:pl-8",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span
        className={dropdownStyles.indicator}
        data-slot="dropdown-menu-checkbox-item-indicator"
      >
        <MenuPrimitive.CheckboxItemIndicator>
          <Icon
            render={<CheckMarkIcon label="" size="small" />}
            label="Selected"
            className="text-text-selected"
          />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  );
}

type DropdownMenuRadioGroupProps = MenuPrimitive.RadioGroup.Props;

function DropdownMenuRadioGroup(props: Readonly<DropdownMenuRadioGroupProps>) {
  return (
    <MenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  );
}

interface DropdownMenuRadioItemProps extends MenuPrimitive.RadioItem.Props {
  inset?: boolean;
}

function DropdownMenuRadioItem({
  className,
  children,
  inset,
  ...props
}: Readonly<DropdownMenuRadioItemProps>) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      data-inset={inset}
      className={cn(
        dropdownStyles.selectableItem,
        dropdownStyles.checkedState,
        "data-inset:pl-8",
        className,
      )}
      {...props}
    >
      <span
        className={dropdownStyles.indicator}
        data-slot="dropdown-menu-radio-item-indicator"
      >
        <MenuPrimitive.RadioItemIndicator>
          <Icon
            render={<CheckMarkIcon label="" size="small" />}
            label="Selected"
            className="text-text-selected"
          />
        </MenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  );
}

type DropdownMenuSeparatorProps = MenuPrimitive.Separator.Props;

function DropdownMenuSeparator({
  className,
  ...props
}: Readonly<DropdownMenuSeparatorProps>) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn(dropdownStyles.separator, className)}
      {...props}
    />
  );
}

type DropdownMenuShortcutProps = ComponentProps<"span">;

function DropdownMenuShortcut({
  className,
  children,
  ...props
}: Readonly<DropdownMenuShortcutProps>) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "group-data-[highlighted]/dropdown-menu-item:[&_kbd]:text-text-subtle ml-auto inline-flex shrink-0 items-center justify-end",
        className,
      )}
      {...props}
    >
      {typeof children === "string" ? (
        <DropdownMenuShortcutKeys shortcut={children} />
      ) : (
        children
      )}
    </span>
  );
}

function DropdownMenuShortcutKeys({ shortcut }: Readonly<{ shortcut: string }>) {
  const trimmedShortcut = shortcut.trim();

  if (!trimmedShortcut.includes("+") && [...trimmedShortcut].length > 1) {
    return (
      <KbdGroup>
        {[...trimmedShortcut].map((key, index) => (
          <Kbd key={`${key}-${index}`}>{key}</Kbd>
        ))}
      </KbdGroup>
    );
  }

  return <Kbd>{trimmedShortcut}</Kbd>;
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  type DropdownMenuProps,
  type DropdownMenuPortalProps,
  type DropdownMenuTriggerProps,
  type DropdownMenuContentProps,
  type DropdownMenuGroupProps,
  type DropdownMenuLabelProps,
  type DropdownMenuItemProps,
  type DropdownMenuCheckboxItemProps,
  type DropdownMenuRadioGroupProps,
  type DropdownMenuRadioItemProps,
  type DropdownMenuSeparatorProps,
  type DropdownMenuShortcutProps,
  type DropdownMenuSubProps,
  type DropdownMenuSubTriggerProps,
  type DropdownMenuSubContentProps,
};
