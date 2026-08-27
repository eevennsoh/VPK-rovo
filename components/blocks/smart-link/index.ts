export { default } from "@/components/blocks/smart-link/page";
export { SmartLink, SmartLinkCard } from "@/components/blocks/smart-link/components/smart-link";
export {
	SMART_LINK_COPY_ACTION,
	SMART_LINK_MODAL_ACTIONS,
	SMART_LINK_PANEL_ACTIONS,
} from "@/components/blocks/smart-link/data/smart-link-actions";
export {
	GITHUB_BRANCH_SMART_LINK_ICON,
	GITHUB_COMMIT_SMART_LINK_ICON,
} from "@/components/blocks/smart-link/lib/github-artifact-icons";
export {
	toPullRequestSmartLink,
	type PullRequestSmartLinkInput,
	type PullRequestSmartLinkStatus,
} from "@/components/blocks/smart-link/lib/pull-request-smart-link";
export type {
	SmartLinkAction,
	SmartLinkAppearance,
	SmartLinkAvatar,
	SmartLinkItem,
	SmartLinkMetadata,
	SmartLinkPreviewImage,
	SmartLinkProps,
	SmartLinkProvider,
	SmartLinkSize,
	SmartLinkVariant,
	SmartLinkVisual,
} from "@/components/blocks/smart-link/components/smart-link";
