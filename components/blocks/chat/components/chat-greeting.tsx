"use client";

import { token } from "@/lib/tokens";
import Heading from "@/components/blocks/shared-ui/heading";
import { GreetingPromptRow } from "@/components/projects/shared/components/greeting-prompt-row";
import Image from "next/image";
import { defaultSuggestions, type RovoSuggestion } from "@/lib/rovo-suggestions";

interface ChatGreetingProps {
	/**
	 * Optional custom heading text
	 */
	heading?: string;
	/**
	 * Callback when a suggestion is clicked
	 */
	onSuggestionClick?: (suggestion: RovoSuggestion) => void;
}

function SkillListItem({
	suggestion,
	onClick,
}: Readonly<{
	suggestion: RovoSuggestion;
	onClick?: () => void;
}>) {
	const iconColor = suggestion.id === "work-last-7-days" || suggestion.id === "draft-confluence-page"
		? token("color.icon.accent.blue")
		: token("color.icon.subtlest");

	return (
		<GreetingPromptRow
			description={suggestion.description}
			icon={suggestion.icon}
			iconColor={iconColor}
			imageName={suggestion.imageName}
			imageSrc={suggestion.imageSrc}
			label={suggestion.label}
			onClick={onClick}
		/>
	);
}

export default function ChatGreeting({ heading = "Let's do this together", onSuggestionClick }: Readonly<ChatGreetingProps>) {
	return (
		<div className="w-full">
			<div className="flex flex-col gap-6">
				{/* Greeting section - centered */}
				<div className="flex flex-col items-center gap-2">
					<Image src="/illustration-ai/chat/light.svg" alt="Chat" width={80} height={80} loading="eager" style={{ objectFit: "contain", width: "auto", height: "auto" }} />
					<Heading size="large">{heading}</Heading>
				</div>

				{/* Skills list - full width */}
				<div className="w-full">
					<div className="flex flex-col gap-1">
						{defaultSuggestions.map((suggestion) => (
							<SkillListItem key={suggestion.id} suggestion={suggestion} onClick={() => onSuggestionClick?.(suggestion)} />
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
