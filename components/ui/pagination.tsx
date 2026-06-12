import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import ChevronLeftIcon from "@atlaskit/icon/core/chevron-left"
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right"
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal"

export type PaginationProps = React.ComponentProps<"nav">

function Pagination({ className, ...props }: Readonly<PaginationProps>) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn(
        "mx-auto flex w-full justify-center",
        className
      )}
      {...props}
    />
  )
}

export type PaginationContentProps = React.ComponentProps<"ul">

function PaginationContent({
  className,
  ...props
}: Readonly<PaginationContentProps>) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("gap-0.5 flex items-center", className)}
      {...props}
    />
  )
}

export type PaginationItemProps = React.ComponentProps<"li">

function PaginationItem(props: Readonly<PaginationItemProps>) {
  return <li data-slot="pagination-item" {...props} />
}

export type PaginationLinkProps = {
  isActive?: boolean
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      variant={isActive ? "outline" : "ghost"}
      size={size}
      className={className}
      nativeButton={false}
      render={
	        <a
	          aria-label={typeof props["aria-label"] === "string" ? props["aria-label"] : "Pagination link"}
	          aria-current={isActive ? "page" : undefined}
          data-slot="pagination-link"
          data-active={isActive}
          {...props}
        />
      }
    />
  )
}

function PaginationPrevious({
  className,
  text = "Previous",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("pl-1.5!", className)}
      {...props}
    >
      <ChevronLeftIcon label="" spacing="none" data-icon="inline-start" />
      <span className="hidden sm:block">
        {text}
      </span>
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  text = "Next",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("pr-1.5!", className)}
      {...props}
    >
      <span className="hidden sm:block">{text}</span>
      <ChevronRightIcon label="" spacing="none" data-icon="inline-end" />
    </PaginationLink>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "size-8 [&_svg:not([class*='size-'])]:size-4 flex items-center justify-center",
        className
      )}
      {...props}
    >
      <ShowMoreHorizontalIcon label="" spacing="none" />
      <span className="sr-only">More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
