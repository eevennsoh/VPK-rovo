export { default } from "@/components/blocks/emoji-picker/page";
// `EmojiPickerPanel` is deliberately NOT re-exported as a value: it is the only
// module that imports frimousse, and a static re-export here would pull the
// library (and its emojibase fetch) into every consumer of this barrel,
// defeating the dynamic import in `EmojiPickerPopover`. Deep-import it if you
// genuinely need the bare panel.
export { EmojiPickerPopover } from "@/components/blocks/emoji-picker/components/emoji-picker-popover";
export { EmojiQuickBar } from "@/components/blocks/emoji-picker/components/emoji-quick-bar";
export { EmojiReactionBar } from "@/components/blocks/emoji-picker/components/emoji-reaction-bar";
export { EmojiReactionPill } from "@/components/blocks/emoji-picker/components/emoji-reaction-pill";
export { emojiLabel, FREQUENT_EMOJI } from "@/components/blocks/emoji-picker/data/emoji-frequent";
export type { EmojiPickerPanelProps } from "@/components/blocks/emoji-picker/components/emoji-picker-panel";
export type { EmojiPickerPopoverProps } from "@/components/blocks/emoji-picker/components/emoji-picker-popover";
export type { EmojiQuickBarProps } from "@/components/blocks/emoji-picker/components/emoji-quick-bar";
export type { EmojiReactionBarProps } from "@/components/blocks/emoji-picker/components/emoji-reaction-bar";
export type { EmojiReactionPillProps } from "@/components/blocks/emoji-picker/components/emoji-reaction-pill";
export type { EmojiReactionSummary } from "@/components/blocks/emoji-picker/data/emoji-frequent";
