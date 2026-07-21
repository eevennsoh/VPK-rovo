"use client";

import AddIcon from "@atlaskit/icon/core/add";
import ArrowUpIcon from "@atlaskit/icon/core/arrow-up";
import SettingsIcon from "@atlaskit/icon/core/settings";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ChatComposerProps {
	placeholder: string;
}

export function ChatComposer({ placeholder }: Readonly<ChatComposerProps>) {
	const [value, setValue] = useState("");
	const hasText = value.trim().length > 0;

	return (
		<div className="mx-3 shrink-0 rounded-lg border border-border bg-bg-input p-2">
			<Textarea
				aria-label="Message"
				className="min-h-12 resize-none px-1 py-1"
				onChange={(event) => setValue(event.target.value)}
				placeholder={placeholder}
				value={value}
				variant="none"
			/>
			<div className="flex items-center gap-1">
				<Button aria-label="Add attachment" size="icon-compact" type="button" variant="ghost">
					<Icon aria-hidden render={<AddIcon label="" size="small" />} />
				</Button>
				<Button aria-label="Message settings" size="icon-compact" type="button" variant="ghost">
					<Icon aria-hidden render={<SettingsIcon label="" size="small" />} />
				</Button>
				<Button
					aria-label="Send message"
					className={cn(
						"ml-auto",
						hasText
							? "bg-bg-neutral-bold text-text-inverse hover:bg-bg-neutral-bold-hovered"
							: "bg-bg-neutral text-icon-disabled",
					)}
					shape="circle"
					size="icon"
					type="button"
					variant="ghost"
				>
					<Icon aria-hidden render={<ArrowUpIcon label="" size="small" />} />
				</Button>
			</div>
		</div>
	);
}
