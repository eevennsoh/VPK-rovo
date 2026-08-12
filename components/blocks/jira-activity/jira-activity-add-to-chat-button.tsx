"use client";

import CommentAddIcon from "@atlaskit/icon/core/comment-add";

import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

interface JiraActivityAddToChatButtonProps {
	onClick: () => void;
}

/**
 * Outlined header control on activity comment cards, placed just left of the
 * thread expand/collapse control. Attaches the comment as a pill on the sticky
 * work-item activity composer (Code Review multi-comment chip path).
 */
export function JiraActivityAddToChatButton({
	onClick,
}: Readonly<JiraActivityAddToChatButtonProps>) {
	return (
		<TooltipProvider delay={0}>
			<Tooltip>
				<TooltipTrigger
					render={
						<Button
							aria-label="Add to chat"
							onClick={onClick}
							size="icon-compact"
							type="button"
							variant="outline"
						/>
					}
				>
					<CommentAddIcon label="" />
				</TooltipTrigger>
				<TooltipContent>Add to chat</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
