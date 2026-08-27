"use client";

// oxlint-disable react-doctor/jsx-no-jsx-as-prop -- PopoverTrigger uses a render-node trigger so the demo label owns the visual state.

import { ChevronDownIcon } from "@/components/ui/vpk-icons";
import {
	SOURCES_PREVIEW_PAGES,
	SourcesPreviewMenu,
} from "@/components/ui-custom/sources-preview-menu";

const SOURCES_PREVIEW_TOASTER_ID = "sources-demo-preview-menu";

export default function SourcesDemoPreviewMenu() {
	return (
		<div className="not-prose mb-4 text-primary text-xs">
			<SourcesPreviewMenu
				pages={SOURCES_PREVIEW_PAGES}
				toasterId={SOURCES_PREVIEW_TOASTER_ID}
				trigger={<button className="flex items-center gap-2" type="button" />}
			>
				<p className="font-medium">Used {SOURCES_PREVIEW_PAGES.length} sources</p>
				<ChevronDownIcon size="small" />
			</SourcesPreviewMenu>
		</div>
	);
}
