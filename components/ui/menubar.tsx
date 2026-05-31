"use client";

import * as React from "react";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { Menubar as MenubarPrimitive } from "@base-ui/react/menubar";
import CheckMarkIcon from "@atlaskit/icon/core/check-mark";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function Menubar({ className, ...props }: MenubarPrimitive.Props) {
  return (
    <MenubarPrimitive
      data-slot="menubar"
      className={cn(
        "bg-background h-8 gap-0.5 rounded-lg border p-[3px] flex items-center",
        className,
      )}
      {...props}
    />
  );
}

function MenubarMenu(props: React.ComponentProps<typeof DropdownMenu>) {
  return <DropdownMenu data-slot="menubar-menu" {...props} />;
}

function MenubarGroup(props: React.ComponentProps<typeof DropdownMenuGroup>) {
  return <DropdownMenuGroup data-slot="menubar-group" {...props} />;
}

function MenubarPortal(props: React.ComponentProps<typeof DropdownMenuPortal>) {
  return <DropdownMenuPortal data-slot="menubar-portal" {...props} />;
}

function MenubarTrigger({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuTrigger>) {
  return (
    <DropdownMenuTrigger
      data-slot="menubar-trigger"
      className={cn(
        "hover:bg-muted aria-expanded:bg-muted rounded-sm px-1.5 py-[2px] text-sm font-medium flex items-center outline-hidden select-none",
        className,
      )}
      {...props}
    />
  );
}

function MenubarContent({
  className,
  align = "start",
  alignOffset = -4,
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof DropdownMenuContent>) {
  return (
    <DropdownMenuContent
      data-slot="menubar-content"
      align={align}
      alignOffset={alignOffset}
      sideOffset={sideOffset}
	      className={cn(
	        "bg-popover text-popover-foreground min-w-36 rounded-lg p-1 shadow-xl origin-(--transform-origin) transition-[opacity,scale,translate] duration-fast ease-out data-starting-style:opacity-0 data-starting-style:scale-95 data-ending-style:opacity-0 data-ending-style:scale-95 data-[side=bottom]:data-starting-style:-translate-y-1 data-[side=top]:data-starting-style:translate-y-1 data-[side=left]:data-starting-style:translate-x-1 data-[side=right]:data-starting-style:-translate-x-1 data-[side=inline-start]:data-starting-style:translate-x-1 data-[side=inline-end]:data-starting-style:-translate-x-1 data-[side=bottom]:data-ending-style:-translate-y-1 data-[side=top]:data-ending-style:translate-y-1 data-[side=left]:data-ending-style:translate-x-1 data-[side=right]:data-ending-style:-translate-x-1 data-[side=inline-start]:data-ending-style:translate-x-1 data-[side=inline-end]:data-ending-style:-translate-x-1",
	        className,
	      )}
      {...props}
    />
  );
}

type MenubarItemClickHandler = NonNullable<MenuPrimitive.Item.Props["onClick"]>;

interface MenubarItemProps extends Omit<MenuPrimitive.Item.Props, "onSelect"> {
  inset?: boolean;
  variant?: "default" | "destructive";
  elemBefore?: React.ReactNode;
  elemAfter?: React.ReactNode;
  description?: string;
  onSelect?: MenubarItemClickHandler;
}

function MenubarItem({
  className,
  inset,
  variant = "default",
  elemBefore,
  elemAfter,
  description,
  children,
  onClick,
  onSelect,
  ...props
}: Readonly<MenubarItemProps>) {
  const handleClick: MenubarItemClickHandler = (event) => {
    onClick?.(event);

    if (event.baseUIHandlerPrevented) {
      return;
    }

    onSelect?.(event);

    if (event.defaultPrevented) {
      event.preventBaseUIHandler();
    }
  };

  const hasStructuredSlots = Boolean(elemBefore || elemAfter || description);

  return (
    <MenuPrimitive.Item
      data-slot="menubar-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "group/menubar-item data-[highlighted]:bg-bg-neutral-subtle-hovered data-[highlighted]:text-text data-[variant=destructive]:text-text-danger data-[variant=destructive]:data-[highlighted]:bg-bg-danger-subtler-hovered data-disabled:pointer-events-none data-disabled:text-text-disabled relative flex w-full cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm leading-5 outline-none select-none active:bg-bg-neutral-subtle-pressed data-[variant=destructive]:active:bg-bg-danger-subtler-pressed data-inset:pl-8 [&_[data-slot=icon]]:shrink-0 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4 [&_svg]:text-icon-subtle data-disabled:[&_svg]:text-icon-disabled data-[variant=destructive]:[&_svg]:text-icon-danger",
        className,
      )}
      onClick={handleClick}
      {...props}
    >
      {hasStructuredSlots ? (
        <>
          {elemBefore ? (
            <span className={cn("inline-flex h-5 shrink-0 items-center justify-center", variant === "destructive" ? "text-icon-danger" : "text-icon-subtle")}>
              {elemBefore}
            </span>
          ) : null}
          <span className="min-w-0 flex flex-1 flex-col">
            <span className="min-w-0 whitespace-normal break-words">
              {children}
            </span>
            {description ? (
              <span className="text-text-subtle text-[11px] leading-4">
                {description}
              </span>
            ) : null}
          </span>
          {elemAfter ? (
            <span className={cn("ml-auto inline-flex h-5 shrink-0 items-center justify-center", variant === "destructive" ? "text-icon-danger" : "text-icon-subtle")}>
              {elemAfter}
            </span>
          ) : null}
        </>
      ) : (
        children
      )}
    </MenuPrimitive.Item>
  );
}

interface MenubarCheckboxItemProps
  extends MenuPrimitive.CheckboxItem.Props {
  inset?: boolean;
}

function MenubarCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}: Readonly<MenubarCheckboxItemProps>) {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="menubar-checkbox-item"
      data-inset={inset}
      className={cn(
        "data-[highlighted]:bg-bg-neutral-subtle-hovered data-[highlighted]:text-text data-disabled:pointer-events-none data-disabled:text-text-disabled relative flex w-full cursor-pointer items-center gap-2 rounded-sm py-2 pr-3 pl-8 text-sm leading-5 outline-none select-none active:bg-bg-neutral-subtle-pressed data-checked:bg-bg-selected data-checked:text-text-selected data-checked:data-[highlighted]:bg-bg-selected-hovered data-checked:data-[highlighted]:text-text-selected data-checked:active:bg-bg-selected-pressed data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span
        className="pointer-events-none absolute left-2 inline-flex items-center justify-center"
        data-slot="menubar-checkbox-item-indicator"
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

function MenubarRadioGroup(
  props: React.ComponentProps<typeof DropdownMenuRadioGroup>,
) {
  return <DropdownMenuRadioGroup data-slot="menubar-radio-group" {...props} />;
}

interface MenubarRadioItemProps extends MenuPrimitive.RadioItem.Props {
  inset?: boolean;
}

function MenubarRadioItem({
  className,
  children,
  inset,
  ...props
}: Readonly<MenubarRadioItemProps>) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="menubar-radio-item"
      data-inset={inset}
      className={cn(
        "data-[highlighted]:bg-bg-neutral-subtle-hovered data-[highlighted]:text-text data-disabled:pointer-events-none data-disabled:text-text-disabled relative flex w-full cursor-pointer items-center gap-2 rounded-sm py-2 pr-3 pl-8 text-sm leading-5 outline-none select-none active:bg-bg-neutral-subtle-pressed data-checked:bg-bg-selected data-checked:text-text-selected data-checked:data-[highlighted]:bg-bg-selected-hovered data-checked:data-[highlighted]:text-text-selected data-checked:active:bg-bg-selected-pressed data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4",
        className,
      )}
      {...props}
    >
      <span
        className="pointer-events-none absolute left-2 inline-flex items-center justify-center"
        data-slot="menubar-radio-item-indicator"
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

function MenubarLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuLabel> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuLabel
      data-slot="menubar-label"
      data-inset={inset}
      className={cn(
        "px-1.5 py-1 text-sm font-medium data-inset:pl-7",
        className,
      )}
      {...props}
    />
  );
}

function MenubarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuSeparator>) {
  return (
    <DropdownMenuSeparator
      data-slot="menubar-separator"
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}

function MenubarShortcut({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuShortcut>) {
  return (
    <DropdownMenuShortcut
      data-slot="menubar-shortcut"
      className={cn(
        "text-text-subtlest group-data-[highlighted]/menubar-item:text-text-subtle ml-auto shrink-0 pl-6 text-right text-[11px] leading-4 tracking-wide",
        className,
      )}
      {...props}
    />
  );
}

function MenubarSub(props: React.ComponentProps<typeof DropdownMenuSub>) {
  return <DropdownMenuSub data-slot="menubar-sub" {...props} />;
}

function MenubarSubTrigger({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuSubTrigger> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuSubTrigger
      data-slot="menubar-sub-trigger"
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-open:bg-accent data-open:text-accent-foreground gap-1.5 rounded-md px-1.5 py-1 text-sm data-inset:pl-7 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function MenubarSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuSubContent>) {
  return (
    <DropdownMenuSubContent
      data-slot="menubar-sub-content"
	      className={cn(
	        "bg-popover text-popover-foreground min-w-32 rounded-lg p-1 shadow-xl origin-(--transform-origin) transition-[opacity,scale,translate] duration-fast ease-out data-starting-style:opacity-0 data-starting-style:scale-95 data-ending-style:opacity-0 data-ending-style:scale-95 data-[side=bottom]:data-starting-style:-translate-y-1 data-[side=top]:data-starting-style:translate-y-1 data-[side=left]:data-starting-style:translate-x-1 data-[side=right]:data-starting-style:-translate-x-1 data-[side=inline-start]:data-starting-style:translate-x-1 data-[side=inline-end]:data-starting-style:-translate-x-1 data-[side=bottom]:data-ending-style:-translate-y-1 data-[side=top]:data-ending-style:translate-y-1 data-[side=left]:data-ending-style:translate-x-1 data-[side=right]:data-ending-style:-translate-x-1 data-[side=inline-start]:data-ending-style:translate-x-1 data-[side=inline-end]:data-ending-style:-translate-x-1",
	        className,
	      )}
      {...props}
    />
  );
}

export {
  Menubar,
  MenubarPortal,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarGroup,
  MenubarSeparator,
  MenubarLabel,
  MenubarItem,
  MenubarShortcut,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
};
