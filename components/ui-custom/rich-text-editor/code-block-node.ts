import CodeBlock from "@tiptap/extension-code-block";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { RichTextCodeBlockNodeView } from "./code-block-node-view";

/**
 * StarterKit's CodeBlock replaced with a React NodeView so ```mermaid / ```mmd
 * fences render through MessageResponse (Streamdown mermaid), matching chat and
 * the mermaid-diagram block. Pattern: TipTap CodeBlockLanguage React demo —
 * `CodeBlock.extend({ addNodeView: () => ReactNodeViewRenderer(...) })`.
 */
export const RichTextCodeBlock = CodeBlock.extend({
	addNodeView() {
		return ReactNodeViewRenderer(RichTextCodeBlockNodeView);
	},
});
