"use client";

import { useState } from "react";

import { Example } from "@/components/example";
import {
	PromptInput,
	PromptInputBody,
	PromptInputButton,
	PromptInputFooter,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputTools,
} from "@/components/ui-custom/prompt-input";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuPortal,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/kbd";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	AudioLinesIcon,
	BookOpenIcon,
	GlobeIcon,
	MoreHorizontalIcon,
	MousePointerIcon,
	PaperclipIcon,
	PenToolIcon,
	PlusIcon,
	ShareIcon,
	ShoppingBagIcon,
	SparklesIcon,
	WandIcon,
} from "@/components/ui/vpk-icons";

export function PromptForm() {
	const [, setDictateEnabled] = useState(false);

	return (
		<Example title="Prompt Form">
			<PromptInput onSubmit={() => undefined}>
				<PromptInputBody>
					<PromptInputTextarea aria-label="Prompt" placeholder="Ask anything" rows={1} />
				</PromptInputBody>
				<PromptInputFooter>
					<PromptInputTools>
						<DropdownMenu>
							<Tooltip>
								<TooltipTrigger
									render={
										<DropdownMenuTrigger
											render={
												<PromptInputButton
													variant="ghost"
													size="icon-sm"
													className="rounded-4xl"
												/>
											}
										/>
									}
								>
									<PlusIcon />
								</TooltipTrigger>
								<TooltipContent>
									Add files and more <Kbd>/</Kbd>
								</TooltipContent>
							</Tooltip>
							<DropdownMenuContent className="w-56">
								<DropdownMenuGroup>
									<DropdownMenuItem>
										<PaperclipIcon />
										Add photos & files
									</DropdownMenuItem>
									<DropdownMenuItem>
										<SparklesIcon />
										Deep research
									</DropdownMenuItem>
									<DropdownMenuItem>
										<ShoppingBagIcon />
										Shopping research
									</DropdownMenuItem>
									<DropdownMenuItem>
										<WandIcon />
										Create image
									</DropdownMenuItem>
									<Tooltip>
										<TooltipTrigger
											render={
												<DropdownMenuItem>
													<MousePointerIcon />
													Agent mode
												</DropdownMenuItem>
											}
										/>
										<TooltipContent side="right">
											<div className="font-medium">35 left</div>
											<div className="text-primary-foreground/80 text-xs">
												More available for purchase
											</div>
										</TooltipContent>
									</Tooltip>
								</DropdownMenuGroup>
								<DropdownMenuSub>
									<DropdownMenuSubTrigger>
										<MoreHorizontalIcon />
										More
									</DropdownMenuSubTrigger>
									<DropdownMenuPortal>
										<DropdownMenuSubContent>
											<DropdownMenuGroup>
												<DropdownMenuItem>
													<ShareIcon />
													Add sources
												</DropdownMenuItem>
												<DropdownMenuItem>
													<BookOpenIcon />
													Study and learn
												</DropdownMenuItem>
												<DropdownMenuItem>
													<GlobeIcon />
													Web search
												</DropdownMenuItem>
												<DropdownMenuItem>
													<PenToolIcon />
													Canvas
												</DropdownMenuItem>
											</DropdownMenuGroup>
										</DropdownMenuSubContent>
									</DropdownMenuPortal>
								</DropdownMenuSub>
							</DropdownMenuContent>
						</DropdownMenu>
						<Tooltip>
							<TooltipTrigger
								render={
									<PromptInputButton
										variant="ghost"
										size="icon-sm"
										onClick={() => setDictateEnabled((prev) => !prev)}
										className="ml-auto rounded-4xl"
									/>
								}
							>
								<AudioLinesIcon />
							</TooltipTrigger>
							<TooltipContent>Dictate</TooltipContent>
						</Tooltip>
					</PromptInputTools>
					<PromptInputSubmit className="rounded-4xl" />
				</PromptInputFooter>
			</PromptInput>
		</Example>
	);
}
