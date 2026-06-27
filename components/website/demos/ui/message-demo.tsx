"use client";

import { Bubble, BubbleContent, BubbleGroup } from "@/components/ui/bubble";
import {
	Message,
	MessageAvatar,
	MessageContent,
	MessageFooter,
	MessageGroup,
	MessageHeader,
} from "@/components/ui/message";

export default function MessageDemo() {
	return <MessageDemoDefault />;
}

export function MessageDemoDefault() {
	return (
		<Message className="max-w-md">
			<MessageAvatar>V</MessageAvatar>
			<MessageContent>
				<MessageHeader>VPK assistant</MessageHeader>
				<Bubble variant="secondary">
					<BubbleContent>The new components are ready for review.</BubbleContent>
				</Bubble>
				<MessageFooter>Now</MessageFooter>
			</MessageContent>
		</Message>
	);
}

export function MessageDemoGroup() {
	return (
		<MessageGroup className="w-full max-w-md">
			<Message>
				<MessageAvatar>V</MessageAvatar>
				<MessageContent>
					<MessageHeader>VPK assistant</MessageHeader>
					<BubbleGroup>
						<Bubble variant="secondary">
							<BubbleContent>I added the primitives under UI.</BubbleContent>
						</Bubble>
						<Bubble variant="secondary">
							<BubbleContent>Each one has docs and demo wiring.</BubbleContent>
						</Bubble>
					</BubbleGroup>
					<MessageFooter>2 min ago</MessageFooter>
				</MessageContent>
			</Message>
			<Message align="end">
				<MessageContent>
					<Bubble align="end">
						<BubbleContent>Thanks. I will test the catalog route.</BubbleContent>
					</Bubble>
					<MessageFooter>Just now</MessageFooter>
				</MessageContent>
			</Message>
		</MessageGroup>
	);
}
