"use client";

import { EditorContent, useEditor } from "@tiptap/react";

import "@/components/ui-custom/rich-text-editor/rich-text-editor.css";
import { EditorToolbar } from "@/components/blocks/editor-toolbar";
import { Button } from "@/components/ui/button";
import { createRichTextEditorExtensions } from "@/components/ui-custom/rich-text-editor";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export interface EditorToolbarPageProps {
	className?: string;
}

export default function EditorToolbarPage({
	className,
}: Readonly<EditorToolbarPageProps>) {
	const editor = useEditor({
		extensions: createRichTextEditorExtensions(),
		content: "Use the toolbar to format this editor content.",
		contentType: "markdown",
		immediatelyRender: false,
		editorProps: {
			attributes: {
				"aria-label": "Editor toolbar demo editor",
				class: "tiptap-editor min-h-24",
			},
		},
	});

	return (
		<div
			className={cn("mx-auto flex w-full max-w-[720px] flex-col rounded-lg border border-border bg-surface", className)}
			style={{ padding: token("space.200"), gap: token("space.200") }}
		>
			{editor ? (
				<EditorToolbar
					editor={editor}
					endSlot={
						<Button type="button" variant="ghost" size="compact">
							Saved
						</Button>
					}
				/>
			) : null}
			<div className="rich-text-editor-content rounded-md bg-surface-sunken p-3">
				{editor ? <EditorContent editor={editor} /> : null}
			</div>
		</div>
	);
}

export { EditorToolbar };
export type { EditorToolbarProps } from "@/components/blocks/editor-toolbar";
