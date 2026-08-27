import BranchIcon from "@atlaskit/icon/core/branch";
import CommitIcon from "@atlaskit/icon/core/commit";

import type { SmartLinkVisual } from "@/components/blocks/smart-link/components/smart-link-types";

/** Front-slot glyph for an uncaptured GitHub branch SmartLink. */
export const GITHUB_BRANCH_SMART_LINK_ICON: SmartLinkVisual = {
	kind: "icon",
	icon: <BranchIcon label="" />,
};

/** Front-slot glyph for an uncaptured GitHub commit SmartLink. */
export const GITHUB_COMMIT_SMART_LINK_ICON: SmartLinkVisual = {
	kind: "icon",
	icon: <CommitIcon label="" />,
};
