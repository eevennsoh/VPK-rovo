"use client";

// oxlint-disable react-doctor/prefer-module-scope-pure-function -- These helpers are intentionally local to the component/demo because they depend on the surrounding interaction contract.

import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { RovoColorIcon } from "@/components/ui/logo";
import CrossIcon from "@atlaskit/icon/core/cross";
import EditIcon from "@atlaskit/icon/core/edit";

interface ChatHeaderProps {
	onClose: () => void;
}

export default function ChatHeader({ onClose }: Readonly<ChatHeaderProps>): ReactElement {
	const noop = () => {};

	return (
		<div className="px-3 py-3">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<RovoColorIcon size="xxsmall" />
					<span className="text-sm font-semibold text-text">Rovo</span>
				</div>

				<div className="flex items-center gap-1">
					<Button aria-label="New chat" size="icon" variant="ghost" onClick={noop}>
						<EditIcon label="" />
					</Button>
					<Button aria-label="Close" size="icon" variant="ghost" onClick={onClose}>
						<CrossIcon label="" />
					</Button>
				</div>
			</div>
		</div>
	);
}
