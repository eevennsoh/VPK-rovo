"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { type Comment } from "../types";
import ThumbsUpIcon from "@atlaskit/icon/core/thumbs-up";

interface WorkItemCommentsProps {
	comments: Readonly<Comment[]>;
}

export function WorkItemComments({ comments }: WorkItemCommentsProps) {
	return (
		<div className="space-y-4">
			{comments.map(comment => (
				<div key={comment.id} className="flex gap-4 pb-4 border-b border-border last:border-0">
					<Avatar className="w-8 h-8 flex-shrink-0">
						<AvatarImage src={comment.author.avatar} />
						<AvatarFallback>{comment.author.initials}</AvatarFallback>
					</Avatar>
					<div className="flex-1">
						<div className="flex items-baseline gap-2 mb-1">
							<span className="font-semibold text-text text-sm">{comment.author.name}</span>
							<span className="text-xs text-text-subtle">{comment.timestamp}</span>
						</div>
						<p className="text-sm text-text-subtle mb-3">{comment.text}</p>
						<div className="flex gap-3">
							<Button size="default" variant="ghost" className="h-7 gap-1">
								<ThumbsUpIcon label="" size="small" />
								<span className="text-xs">{comment.likes}</span>
							</Button>
							<Button size="default" variant="ghost" className="h-7">
								Reply
							</Button>
						</div>
					</div>
				</div>
			))}

			<div className="mt-6 pt-4 border-t border-border">
				<div className="flex gap-3">
					<Avatar className="w-8 h-8">
						<AvatarFallback>ME</AvatarFallback>
					</Avatar>
					<div className="flex-1">
						<textarea
							className="w-full p-3 rounded border border-border bg-bg-neutral text-text text-sm focus:outline-none focus:ring-2 focus:ring-color-border-focused"
							placeholder="Add a comment..."
							rows={3}
						/>
						<div className="flex gap-2 mt-2 justify-end">
							<Button variant="secondary" size="default">
								Cancel
							</Button>
							<Button size="default">Comment</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
