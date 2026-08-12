import { TaskItem } from "@tiptap/extension-list";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { RichTextTaskItemNodeView } from "./task-item-node-view";

/**
 * TipTap TaskItem with a React NodeView so checkboxes use VPK Checkbox
 * instead of the extension's native `<input type="checkbox">`.
 */
export const RichTextTaskItem = TaskItem.extend({
	addNodeView() {
		return ReactNodeViewRenderer(RichTextTaskItemNodeView);
	},
});
