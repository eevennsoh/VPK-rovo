"use client";

import {
	Bubble,
	BubbleContent,
	BubbleGroup,
	BubbleReactions,
} from "@/components/ui/bubble";

export default function BubbleDemo() {
	return <BubbleDemoDefault />;
}

export function BubbleDemoDefault() {
	return (
		<BubbleGroup className="w-full max-w-md">
			<Bubble variant="secondary">
				<BubbleContent>Can you review the latest prototype?</BubbleContent>
			</Bubble>
			<Bubble align="end">
				<BubbleContent>Done. The interaction states look consistent.</BubbleContent>
			</Bubble>
		</BubbleGroup>
	);
}

export function BubbleDemoVariants() {
	return (
		<div className="flex w-full max-w-md flex-col gap-2">
			{(["default", "secondary", "muted", "tinted", "outline", "ghost", "destructive"] as const).map((variant) => (
				<Bubble key={variant} variant={variant}>
					<BubbleContent>{variant}</BubbleContent>
				</Bubble>
			))}
		</div>
	);
}

export function BubbleDemoReactions() {
	return (
		<Bubble className="my-4" variant="secondary">
			<BubbleContent>Launch notes are ready for review.</BubbleContent>
			<BubbleReactions>👍 3</BubbleReactions>
		</Bubble>
	);
}
