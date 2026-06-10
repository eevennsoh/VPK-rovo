"use client";

import { useState } from "react";

import { AppsDirectoryDialog } from "@/components/blocks/apps-directory";
import { DIRECTORY_APPS } from "@/app/data/directory/apps";
import { Button } from "@/components/ui/button";

export default function AppsDirectoryPage() {
	const [open, setOpen] = useState(false);

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Button onClick={() => setOpen(true)}>Open apps directory</Button>
			<AppsDirectoryDialog
				defaultAddedToolIds={["atlassian"]}
				open={open}
				onOpenChange={setOpen}
				tools={DIRECTORY_APPS}
			/>
		</div>
	);
}
