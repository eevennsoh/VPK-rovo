"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { KnowledgeDirectoryDialog } from "@/components/blocks/knowledge-directory";

export default function KnowledgeDirectoryPage() {
	const [open, setOpen] = useState(false);

	return (
		<div className="flex h-full min-h-[400px] items-center justify-center p-4">
			<Button onClick={() => setOpen(true)}>Browse knowledge</Button>
			<KnowledgeDirectoryDialog
				open={open}
				onOpenChange={setOpen}
			/>
		</div>
	);
}
