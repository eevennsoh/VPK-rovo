"use client";

import {
	MessageScroller,
	MessageScrollerButton,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Message, MessageContent } from "@/components/ui/message";

const messages = [
	"Can you summarize the changes?",
	"Added five new shadcn base primitives under UI.",
	"Did you wire demos and details?",
	"Yes. The catalog can render each primitive directly.",
	"Great. I will check the message scroller behavior.",
	"The scroll button appears when the viewport is not at the end.",
];

export default function MessageScrollerDemo() {
	return <MessageScrollerDemoDefault />;
}

export function MessageScrollerDemoDefault() {
	return (
		<MessageScroller className="h-72 rounded-md border bg-surface p-3">
			<MessageScrollerViewport>
				<MessageScrollerContent>
					{messages.map((message, index) => (
						<MessageScrollerItem key={message} scrollAnchor={index === messages.length - 1}>
							<Message align={index % 2 === 0 ? "start" : "end"}>
								<MessageContent>
									<Bubble
										align={index % 2 === 0 ? "start" : "end"}
										variant={index % 2 === 0 ? "secondary" : "default"}
									>
										<BubbleContent>{message}</BubbleContent>
									</Bubble>
								</MessageContent>
							</Message>
						</MessageScrollerItem>
					))}
				</MessageScrollerContent>
			</MessageScrollerViewport>
		</MessageScroller>
	);
}

export function MessageScrollerDemoButton() {
	return (
		<MessageScroller className="h-72 rounded-md border bg-surface p-3">
			<MessageScrollerViewport>
				<MessageScrollerContent>
					{Array.from({ length: 12 }, (_, index) => (
						<MessageScrollerItem key={index} scrollAnchor={index === 11}>
							<Message align={index % 2 === 0 ? "start" : "end"}>
								<MessageContent>
									<Bubble
										align={index % 2 === 0 ? "start" : "end"}
										variant={index % 2 === 0 ? "secondary" : "default"}
									>
										<BubbleContent>Message {index + 1}</BubbleContent>
									</Bubble>
								</MessageContent>
							</Message>
						</MessageScrollerItem>
					))}
				</MessageScrollerContent>
			</MessageScrollerViewport>
			<MessageScrollerButton />
		</MessageScroller>
	);
}
