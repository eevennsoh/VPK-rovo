import { cn } from "@/lib/utils"

export const tabsExperimentalListClass = "gap-4 bg-transparent"

const tabsExperimentalIndicatorClass =
	"after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-border-selected"

export const tabsExperimentalTriggerClass = cn(
	"relative inline-flex h-full items-center justify-center gap-1.5 whitespace-nowrap rounded-sm border-x-[6px] border-x-transparent px-0 text-xs font-medium leading-4 text-text-subtle no-underline",
	"transition-[background-color,border-radius,color] duration-normal ease-out-practical motion-reduce:transition-none",
	"hover:rounded-md hover:text-text active:rounded-md active:bg-bg-neutral-subtle-pressed group-data-[header-variant=compact]/work-item-navigation:hover:rounded-b-none group-data-[header-variant=compact]/work-item-navigation:active:rounded-b-none",
	"focus-visible:text-text focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50",
	"after:pointer-events-none after:absolute after:opacity-0 after:transition-opacity after:content-[''] motion-reduce:after:transition-none",
	tabsExperimentalIndicatorClass,
	"after:bg-bg-neutral-bold data-active:text-text data-active:after:opacity-100 aria-[current=location]:text-text aria-[current=location]:after:opacity-100 aria-[current=location]:hover:text-text aria-[current=location]:focus-visible:text-text",
)
