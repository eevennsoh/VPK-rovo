"use client";

import { CodeList } from "@/components/ui-custom/code-list";
import { SAMPLE_CODE_LIST_ITEMS } from "@/components/ui-custom/code-list/data/sample-items";

export default function CodeListPage() {
	return (
		<div className="flex min-h-screen w-full items-center justify-center p-4">
			<CodeList className="w-full max-w-xl" items={SAMPLE_CODE_LIST_ITEMS} />
		</div>
	);
}
