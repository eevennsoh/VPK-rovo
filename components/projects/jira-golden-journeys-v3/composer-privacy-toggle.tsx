"use client";

import { useState, type ReactElement } from "react";

import EyeOpenIcon from "@atlaskit/icon/core/eye-open";
import EyeOpenStrikethroughIcon from "@atlaskit/icon/core/eye-open-strikethrough";

import { PromptInputButton } from "@/components/ui-custom/prompt-input-button";

type ComposerPrivacyVisibility = "private" | "space";

/**
 * Demo-only privacy flip for the jira-golden-journeys-v3 side-chat composer.
 * Eye open → private to you; eye strikethrough → visible to the space.
 */
export function JiraGoldenJourneysV3ComposerPrivacyToggle(): ReactElement {
	const [visibility, setVisibility] = useState<ComposerPrivacyVisibility>("private");
	const isPrivate = visibility === "private";

	return (
		<PromptInputButton
			aria-label={isPrivate ? "Private to you" : "Visible to space"}
			onClick={() => {
				setVisibility((current) => (current === "private" ? "space" : "private"));
			}}
			size="icon-sm"
			tooltip={{
				content: isPrivate ? "Private to you" : "Visible to space",
				delay: 0,
			}}
			variant="ghost"
		>
			{isPrivate ? (
				<EyeOpenIcon label="" />
			) : (
				<EyeOpenStrikethroughIcon label="" />
			)}
		</PromptInputButton>
	);
}
