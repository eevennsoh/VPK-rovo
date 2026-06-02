"use client";

import Page from "@/components/blocks/data-table/page";

export default function DataTableDemo() {
	return (
		<div className="flex h-full w-full items-center justify-center overflow-auto p-6">
			<div className="w-full max-w-[1280px]">
				<Page />
			</div>
		</div>
	);
}
