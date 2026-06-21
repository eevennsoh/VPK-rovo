"use client";

import { useState } from "react";
import AddIcon from "@atlaskit/icon/core/add";
import ArrowUpIcon from "@atlaskit/icon/core/arrow-up";

import {
	composerPromptInputClassName,
	composerTextareaClassName,
	composerUpwardShadow,
	floatingComposerTextareaClassName,
	textareaCSS,
} from "@/components/projects/shared/components/rovo-composer-styles";
import {
	PromptInput,
	PromptInputBody,
	PromptInputButton,
	PromptInputFooter,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputTools,
} from "@/components/ui-custom/prompt-input";
import { cn } from "@/lib/utils";

export default function RovoComposerStylesDemo() {
	const [raisedPrompt, setRaisedPrompt] = useState("");
	const [floatingPrompt, setFloatingPrompt] = useState("");

	return (
		<div className="mx-auto grid w-full max-w-[680px] gap-8">
			<div className="rounded-xl border border-border bg-surface px-4 py-2.5" style={{ boxShadow: composerUpwardShadow }}>
				<PromptInput className={cn(composerPromptInputClassName, "relative z-10")} onSubmit={() => setRaisedPrompt("")}>
					<PromptInputBody>
						<PromptInputTextarea
							aria-label="Raised composer prompt"
							className={composerTextareaClassName}
							onChange={(event) => setRaisedPrompt(event.currentTarget.value)}
							placeholder="Ask, @mention, or / for skills"
							rows={1}
							value={raisedPrompt}
						/>
					</PromptInputBody>
					<PromptInputFooter className="mt-3 justify-between px-0 pb-0">
						<PromptInputTools>
							<PromptInputButton aria-label="Add context" size="icon-sm" variant="ghost">
								<AddIcon label="" />
							</PromptInputButton>
						</PromptInputTools>
						<PromptInputSubmit aria-label="Send" disabled={!raisedPrompt.trim()} size="icon-sm">
							<ArrowUpIcon label="" />
						</PromptInputSubmit>
					</PromptInputFooter>
				</PromptInput>
			</div>

			<div className="rounded-full border border-border bg-surface px-3 py-2 shadow-sm">
				<PromptInput className={composerPromptInputClassName} onSubmit={() => setFloatingPrompt("")}>
					<PromptInputBody className="flex items-center gap-2">
						<PromptInputButton aria-label="Add context" size="icon-sm" variant="ghost">
							<AddIcon label="" />
						</PromptInputButton>
						<PromptInputTextarea
							aria-label="Floating composer prompt"
							className={floatingComposerTextareaClassName}
							onChange={(event) => setFloatingPrompt(event.currentTarget.value)}
							placeholder="Ask Rovo"
							rows={1}
							value={floatingPrompt}
						/>
						<PromptInputSubmit aria-label="Send" disabled={!floatingPrompt.trim()} size="icon-sm">
							<ArrowUpIcon label="" />
						</PromptInputSubmit>
					</PromptInputBody>
				</PromptInput>
			</div>

			<style>{textareaCSS}</style>
		</div>
	);
}
