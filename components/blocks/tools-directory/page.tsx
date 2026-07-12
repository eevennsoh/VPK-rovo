"use client";

import { useState } from "react";

import { ToolsDirectoryDialog } from "@/components/blocks/tools-directory";
import { DEMO_SESSION_TOOLS, DEMO_TOOLS } from "@/app/data/directory/tools";
import { Button } from "@/components/ui/button";

export default function ToolsDirectoryPage() {
	const [open, setOpen] = useState(false);

	return (
		<div className="flex h-full min-h-screen items-center justify-center p-4">
			<Button onClick={() => setOpen(true)}>Open tools directory</Button>
			<ToolsDirectoryDialog
				defaultAddedToolIds={["atlassian"]}
				open={open}
				onOpenChange={setOpen}
				sessionTools={DEMO_SESSION_TOOLS}
				tools={DEMO_TOOLS}
			/>
		</div>
	);
}
