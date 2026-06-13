"use client";

import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";

import type { FrontmatterEntries, FrontmatterValue } from "@/app/data/directory/skill-frontmatter";
import { Tag, TagGroup } from "@/components/ui/tag";

const READONLY_KEYS = new Set(["name"]);

function asEntries(value: unknown): FrontmatterEntries {
	return Array.isArray(value) ? (value as FrontmatterEntries) : [];
}

/** Stop ProseMirror from hijacking pointer/key events meant for the card's inputs. */
function stopEditorCapture(event: { stopPropagation: () => void }) {
	event.stopPropagation();
}

function FrontmatterScalarRow({
	entryKey,
	value,
	editable,
	onCommit,
}: Readonly<{
	entryKey: string;
	value: string;
	editable: boolean;
	onCommit: (next: string) => void;
}>) {
	const isDescription = entryKey === "description";
	const readOnly = !editable || READONLY_KEYS.has(entryKey);
	const [draft, setDraft] = useState(value);
	const focusedRef = useRef(false);

	// Keep the field in sync with external edits (e.g. the markdown view) while the
	// user isn't actively editing it.
	useEffect(() => {
		if (!focusedRef.current) {
			setDraft(value);
		}
	}, [value]);

	if (readOnly) {
		return <dd className="min-w-0 break-words text-text">{value}</dd>;
	}

	const sharedProps = {
		value: draft,
		onMouseDown: stopEditorCapture,
		onKeyDown: stopEditorCapture,
		onFocus: () => {
			focusedRef.current = true;
		},
		onBlur: () => {
			focusedRef.current = false;
			if (draft !== value) {
				onCommit(draft);
			}
		},
		className:
			"w-full resize-none rounded-xs border border-transparent bg-transparent px-1 py-0.5 text-text outline-none hover:border-border focus:border-border-focused",
	} as const;

	return (
		<dd className="min-w-0">
			{isDescription ? (
				<textarea
					{...sharedProps}
					rows={1}
					// `field-sizing-content` auto-grows the textarea to its content (same
					// mechanism as components/ui/textarea.tsx) — no manual row counting,
					// which mis-sizes against soft-wrapped lines.
					className={`${sharedProps.className} field-sizing-content min-h-[2lh]`}
					onChange={(event) => setDraft(event.target.value)}
					aria-label="Edit description"
				/>
			) : (
				<input
					{...sharedProps}
					type="text"
					onChange={(event) => setDraft(event.target.value)}
					aria-label={`Edit ${entryKey}`}
				/>
			)}
		</dd>
	);
}

/**
 * Editable SKILL.md frontmatter card. Renders the parsed `---` block as dynamic
 * key/value rows: `name` is read-only (the derived slug), `description` and other
 * scalars are inline-editable, and list values (`allowed-tools`) render as
 * removable tags. Edits write back through `updateAttributes({ entries })`, which
 * flows out via the editor's markdown round-trip.
 */
export function FrontmatterNodeView({ node, updateAttributes, editor }: ReactNodeViewProps) {
	const entries = asEntries(node.attrs.entries);
	const editable = editor.isEditable;

	function setEntryValue(key: string, value: FrontmatterValue) {
		updateAttributes({
			entries: entries.map((entry) => (entry.key === key ? { key, value } : entry)),
		});
	}

	function removeListItem(key: string, index: number) {
		const entry = entries.find((candidate) => candidate.key === key);
		if (!entry || !Array.isArray(entry.value)) {
			return;
		}
		setEntryValue(
			key,
			entry.value.filter((_, itemIndex) => itemIndex !== index),
		);
	}

	return (
		<NodeViewWrapper
			as="div"
			contentEditable={false}
			data-frontmatter-card=""
			className="my-3 overflow-hidden rounded-md border border-border bg-surface-sunken"
		>
			<dl className="grid grid-cols-[max-content_minmax(0,1fr)] items-start gap-x-6 gap-y-2 p-4 text-sm leading-5">
				{entries.map((entry) => (
					<div key={entry.key} className="contents">
						<dt className="pt-0.5 font-medium text-text-subtle">{entry.key}</dt>
						{Array.isArray(entry.value) ? (
							<dd className="min-w-0">
								<TagGroup className="flex flex-wrap gap-1" onMouseDown={stopEditorCapture}>
									{entry.value.length === 0 ? (
										<span className="text-text-subtlest">None</span>
									) : (
										entry.value.map((item, index) => (
											<Tag
												key={`${entry.key}-${item}-${index}`}
												color="standard"
												onRemove={editable ? () => removeListItem(entry.key, index) : undefined}
												removeButtonLabel={`Remove ${item}`}
											>
												{item}
											</Tag>
										))
									)}
								</TagGroup>
							</dd>
						) : (
							<FrontmatterScalarRow
								entryKey={entry.key}
								value={String(entry.value)}
								editable={editable}
								onCommit={(next) => setEntryValue(entry.key, next)}
							/>
						)}
					</div>
				))}
			</dl>
		</NodeViewWrapper>
	);
}
