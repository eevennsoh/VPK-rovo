"use client";

// oxlint-disable react-doctor/jsx-no-jsx-as-prop -- These components intentionally use slot/render-node props for icons, triggers, and adornments.

import type { ReactNode } from "react";
import {
	PromptInputActionAddAttachments,
	PromptInputActionAddScreenshot,
	PromptInputActionMenuItem,
} from "@/components/ui-custom/prompt-input";
import AddIcon from "@atlaskit/icon/core/add";
import LinkIcon from "@atlaskit/icon/core/link";
import MentionIcon from "@atlaskit/icon/core/mention";
import PageIcon from "@atlaskit/icon/core/page";
import ScreenIcon from "@atlaskit/icon/core/screen";
import UploadIcon from "@atlaskit/icon/core/upload";

interface RovoAppComposerAddMenuProps {
	itemsBefore?: ReactNode;
	onClose: () => void;
}

export function RovoAppComposerAddMenu({
	itemsBefore,
	onClose,
}: Readonly<RovoAppComposerAddMenuProps>) {
	return (
		<>
			{itemsBefore}
			<PromptInputActionAddAttachments
				elemBefore={<UploadIcon label="" />}
				onSelect={onClose}
			>
				Upload file
			</PromptInputActionAddAttachments>
			<PromptInputActionAddScreenshot
				elemBefore={<ScreenIcon label="" />}
				onSelect={onClose}
			>
				Take screenshot
			</PromptInputActionAddScreenshot>
			<PromptInputActionMenuItem
				elemBefore={<LinkIcon label="" />}
				onSelect={onClose}
			>
				Add a link
			</PromptInputActionMenuItem>
			<PromptInputActionMenuItem
				elemBefore={<MentionIcon label="" />}
				onSelect={onClose}
			>
				Mention someone
			</PromptInputActionMenuItem>
			<PromptInputActionMenuItem
				elemBefore={<AddIcon label="" />}
				onSelect={onClose}
			>
				More formatting
			</PromptInputActionMenuItem>
			<PromptInputActionMenuItem
				elemBefore={<PageIcon label="" />}
				onSelect={onClose}
			>
				Add current page as context
			</PromptInputActionMenuItem>
		</>
	);
}
