import { type ReactElement } from "react";
import AngleBracketsIcon from "@atlaskit/icon/core/angle-brackets";
import BranchIcon from "@atlaskit/icon/core/branch";
import CalendarIcon from "@atlaskit/icon/core/calendar";
import ChartTrendUpIcon from "@atlaskit/icon/core/chart-trend-up";
import CommentIcon from "@atlaskit/icon/core/comment";
import CurlyBracketsIcon from "@atlaskit/icon/core/curly-brackets";
import DeviceMobileIcon from "@atlaskit/icon/core/device-mobile";
import EditIcon from "@atlaskit/icon/core/edit";
import LinkIcon from "@atlaskit/icon/core/link";
import MegaphoneIcon from "@atlaskit/icon/core/megaphone";
import PageIcon from "@atlaskit/icon/core/page";
import PaintPaletteIcon from "@atlaskit/icon/core/paint-palette";
import SearchIcon from "@atlaskit/icon/core/search";
import VideoIcon from "@atlaskit/icon/core/video";

import type { RichTextMentionVisual } from "@/components/ui-custom/rich-text-editor";

import type { DirectoryVisual, SkillIconKey } from "./types";

/**
 * Resolves a skill icon key to a raw Atlaskit icon element (color inherits from
 * the parent). This is the single icon resolver for directory data — the
 * rich-text editor's `mention-visual` and every directory surface route through
 * it so an `iconKey` always maps to the same element.
 */
export function getSkillIcon(icon: SkillIconKey = "page"): ReactElement {
	switch (icon) {
		case "comment":
			return <CommentIcon label="" color="currentColor" />;
		case "curly-brackets":
			return <CurlyBracketsIcon label="" color="currentColor" />;
		case "device-mobile":
			return <DeviceMobileIcon label="" color="currentColor" />;
		case "video":
			return <VideoIcon label="" color="currentColor" />;
		case "edit":
			return <EditIcon label="" color="currentColor" />;
		case "chart-trend-up":
			return <ChartTrendUpIcon label="" color="currentColor" />;
		case "branch":
			return <BranchIcon label="" color="currentColor" />;
		case "angle-brackets":
			return <AngleBracketsIcon label="" color="currentColor" />;
		case "link":
			return <LinkIcon label="" color="currentColor" />;
		case "calendar":
			return <CalendarIcon label="" color="currentColor" />;
		case "megaphone":
			return <MegaphoneIcon label="" color="currentColor" />;
		case "paint-palette":
			return <PaintPaletteIcon label="" color="currentColor" />;
		case "search":
			return <SearchIcon label="" color="currentColor" />;
		case "page":
		default:
			return <PageIcon label="" color="currentColor" />;
	}
}

/**
 * Rehydrates a JSON-serializable {@link DirectoryVisual} into the rich-text
 * editor's runtime `RichTextMentionVisual` (resolving the `icon` kind's key
 * into a live element). `avatar`/`image`/`logo` pass through unchanged.
 */
export function resolveDirectoryVisual(
	visual: DirectoryVisual | undefined,
): RichTextMentionVisual | undefined {
	if (!visual) {
		return undefined;
	}

	if (visual.kind === "icon") {
		return {
			kind: "icon",
			icon: getSkillIcon(visual.iconKey),
			iconColor: visual.iconColor,
			iconKey: visual.iconKey,
		};
	}

	return visual;
}
