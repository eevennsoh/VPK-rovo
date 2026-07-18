"use client";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import EyeOpenIcon from "@atlaskit/icon/core/eye-open";
import LockUnlockedIcon from "@atlaskit/icon/core/lock-unlocked";
import ShareIcon from "@atlaskit/icon/core/share";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import DiagramSymbolPackageIcon from "@atlaskit/icon-lab/core/diagram-symbol-package";

/**
 * Title-row action cluster for the experimental Agent Sessions work item:
 * lock / watch / share / Open split button / more. Visual-only (no handlers) —
 * mirrors the standard ModalHeader action styling but sits beside the editable
 * title instead of in the breadcrumb row. The Open split button reuses the
 * shared ButtonGroup primitive so the main + trailing chevron read as one group.
 */
export function ContextTitleActions() {
	return (
		<div className="flex shrink-0 items-center gap-2">
			<Button aria-label="No restrictions" size="icon" variant="outline">
				<LockUnlockedIcon label="" />
			</Button>
			<Button className="gap-2" variant="outline">
				<EyeOpenIcon label="" />
				1
			</Button>
			<Button aria-label="Share" size="icon" variant="outline">
				<ShareIcon label="" />
			</Button>
			<ButtonGroup>
				<Button aria-label="Open" variant="outline">
					<DiagramSymbolPackageIcon label="" />
					Open
				</Button>
				<Button aria-label="More open options" size="icon" variant="outline">
					<ChevronDownIcon label="" size="small" />
				</Button>
			</ButtonGroup>
			<Button aria-label="Actions" size="icon" variant="outline">
				<ShowMoreHorizontalIcon label="" />
			</Button>
		</div>
	);
}
