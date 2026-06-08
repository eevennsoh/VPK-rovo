"use client";

import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CategoryTabOption, WebsiteCategoryTab } from "@/app/data/category-tabs";
import { useHasHorizontalOverflow } from "@/components/hooks/use-has-horizontal-overflow";

interface CategoryTabsProps {
	activeCategory?: WebsiteCategoryTab | null;
	options: ReadonlyArray<CategoryTabOption>;
}

type CategoryTabsMaskStyle = CSSProperties & {
	"--category-tabs-edge-mask": string;
};

function buildCategoryTabsEdgeMask(canScrollLeft: boolean, canScrollRight: boolean): string {
	const leftEdge = canScrollLeft ? "transparent 0, #000 var(--ds-space-300)" : "#000 0";
	const rightEdge = canScrollRight ? "#000 calc(100% - var(--ds-space-300)), transparent 100%" : "#000 100%";

	return `linear-gradient(to right, ${leftEdge}, ${rightEdge})`;
}

function getCategoryTabsMaskStyle(canScrollLeft: boolean, canScrollRight: boolean): CategoryTabsMaskStyle {
	const edgeMask = buildCategoryTabsEdgeMask(canScrollLeft, canScrollRight);

	return {
		"--category-tabs-edge-mask": edgeMask,
		maskRepeat: "no-repeat",
		WebkitMaskRepeat: "no-repeat",
		maskSize: "100% 100%",
		WebkitMaskSize: "100% 100%",
	};
}

export function CategoryTabs({ activeCategory, options }: Readonly<CategoryTabsProps>) {
	const router = useRouter();
	const { ref, canScrollLeft, canScrollRight } = useHasHorizontalOverflow<HTMLDivElement>();

	function handleCategoryChange(value: string) {
		router.push(`/${value}`);
	}

	return (
		<div
			data-slot="category-tabs-scroll-area"
			className="w-full overflow-x-auto overscroll-x-contain [mask-image:var(--category-tabs-edge-mask)] [-webkit-mask-image:var(--category-tabs-edge-mask)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
			ref={ref}
			style={getCategoryTabsMaskStyle(canScrollLeft, canScrollRight)}
		>
			<Tabs
				value={activeCategory ?? "__none__"}
				onValueChange={handleCategoryChange}
			>
				<TabsList className="min-w-max">
					{options.map((cat) => (
						<TabsTrigger
							key={cat.key}
							id={`home-category-tab-${cat.key}`}
							value={cat.key}
							className="gap-2 px-3"
						>
							<span>{cat.title}</span>
							<span className="text-xs text-text-subtle">{cat.count}</span>
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>
		</div>
	);
}
