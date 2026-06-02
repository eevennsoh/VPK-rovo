"use client";

import type { ReactNode, RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";

import AddIcon from "@atlaskit/icon/core/add";
import AlignTextCenterIcon from "@atlaskit/icon/core/align-text-center";
import AlignTextLeftIcon from "@atlaskit/icon/core/align-text-left";
import AlignTextRightIcon from "@atlaskit/icon/core/align-text-right";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import LinkIcon from "@atlaskit/icon/core/link";
import ListBulletedIcon from "@atlaskit/icon/core/list-bulleted";
import ListNumberedIcon from "@atlaskit/icon/core/list-numbered";
import MarkdownIcon from "@atlaskit/icon/core/markdown";
import QuotationMarkIcon from "@atlaskit/icon/core/quotation-mark";
import SnippetIcon from "@atlaskit/icon/core/snippet";
import TextIcon from "@atlaskit/icon/core/text";
import TextBoldIcon from "@atlaskit/icon/core/text-bold";
import TextItalicIcon from "@atlaskit/icon/core/text-italic";
import TextStrikethroughIcon from "@atlaskit/icon/core/text-strikethrough";
import TextUnderlineIcon from "@atlaskit/icon/core/text-underline";
import TerminalIcon from "@atlaskit/icon-lab/core/terminal";
import TextHeadingOneIcon from "@atlaskit/icon-lab/core/text-heading-one";
import TextHeadingThreeIcon from "@atlaskit/icon-lab/core/text-heading-three";
import TextHeadingTwoIcon from "@atlaskit/icon-lab/core/text-heading-two";

import { useClickOutside } from "@/components/hooks/use-click-outside";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { MarkdownFormatKind } from "@/components/ui-custom/rich-text-editor/markdown-format";
import { TextNormalIcon } from "@/components/ui/vpk-icons";
import { cn } from "@/lib/utils";

type DropdownType = "textStyle" | "formatting" | "list" | "align" | null;
type TextStyleType = "normal" | "h1" | "h2" | "h3" | "quote" | "codeBlock";
type Alignment = "left" | "center" | "right";

const TOOLBAR_SPLIT_TOGGLE_GROUP_CLASS_NAME = "*:data-[slot=toggle-group-item]:w-6! *:data-[slot=toggle-group-item]:min-w-6! *:data-[slot=toggle-group-item]:px-0!";

const TEXT_STYLE_TO_MARKDOWN: Record<TextStyleType, MarkdownFormatKind> = {
	normal: "normal",
	h1: "h1",
	h2: "h2",
	h3: "h3",
	quote: "quote",
	codeBlock: "codeBlock",
};

export interface EditorToolbarProps {
	editor: Editor;
	className?: string;
	controlsClassName?: string;
	leadingSlot?: ReactNode;
	endSlot?: ReactNode;
	isMarkdownMode?: boolean;
	onToggleMarkdownMode?: () => void;
	onMarkdownFormat?: (kind: MarkdownFormatKind) => void;
}

interface DropdownMenuItemProps {
	icon: ReactNode;
	label: string;
	isSelected: boolean;
	onClick: () => void;
	className?: string;
}

interface DropdownMenuContainerProps {
	children: ReactNode;
	align?: "left" | "right";
}

function useEditorTransactionRerender(editor: Editor): void {
	const [, setVersion] = useState(0);

	useEffect(() => {
		const update = () => setVersion((version) => version + 1);

		editor.on("transaction", update);
		editor.on("selectionUpdate", update);
		editor.on("update", update);

		return () => {
			editor.off("transaction", update);
			editor.off("selectionUpdate", update);
			editor.off("update", update);
		};
	}, [editor]);
}

function DropdownMenuItem({
	icon,
	label,
	isSelected,
	onClick,
	className,
}: Readonly<DropdownMenuItemProps>) {
	return (
		<button
			type="button"
			aria-label={label}
			aria-pressed={isSelected}
			className={cn(
				"flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm text-text-subtle transition-colors hover:bg-bg-neutral-subtle-hovered",
				isSelected && "bg-bg-selected text-text-selected",
				className,
			)}
			onClick={onClick}
		>
			{icon}
			<span className="min-w-0 truncate">{label}</span>
		</button>
	);
}

function DropdownMenuContainer({
	children,
	align = "left",
}: Readonly<DropdownMenuContainerProps>) {
	return (
		<div
			className={cn(
				"absolute top-full z-50 mt-1 min-w-52 rounded-lg bg-popover p-1 text-popover-foreground shadow-2xl",
				align === "right" ? "right-0" : "left-0",
			)}
		>
			{children}
		</div>
	);
}

function getCurrentTextStyle(editor: Editor): string {
	if (editor.isActive("heading", { level: 1 })) return "Heading 1";
	if (editor.isActive("heading", { level: 2 })) return "Heading 2";
	if (editor.isActive("heading", { level: 3 })) return "Heading 3";
	if (editor.isActive("blockquote")) return "Quote";
	if (editor.isActive("codeBlock")) return "Code block";
	return "Normal text";
}

function renderCurrentTextStyleIcon(editor: Editor) {
	if (editor.isActive("heading", { level: 1 })) {
		return <TextHeadingOneIcon label="" size="small" />;
	}
	if (editor.isActive("heading", { level: 2 })) {
		return <TextHeadingTwoIcon label="" size="small" />;
	}
	if (editor.isActive("heading", { level: 3 })) {
		return <TextHeadingThreeIcon label="" size="small" />;
	}
	if (editor.isActive("blockquote")) {
		return <QuotationMarkIcon label="" size="small" />;
	}
	if (editor.isActive("codeBlock")) {
		return <TerminalIcon label="" size="small" />;
	}
	return <TextIcon label="" size="small" />;
}

function setTextStyle(editor: Editor, style: TextStyleType): void {
	switch (style) {
		case "normal":
			editor.chain().focus().setParagraph().run();
			break;
		case "h1":
			editor.chain().focus().toggleHeading({ level: 1 }).run();
			break;
		case "h2":
			editor.chain().focus().toggleHeading({ level: 2 }).run();
			break;
		case "h3":
			editor.chain().focus().toggleHeading({ level: 3 }).run();
			break;
		case "quote":
			editor.chain().focus().toggleBlockquote().run();
			break;
		case "codeBlock":
			editor.chain().focus().toggleCodeBlock().run();
			break;
	}
}

function getCurrentAlignment(editor: Editor): Alignment {
	if (editor.isActive({ textAlign: "center" })) return "center";
	if (editor.isActive({ textAlign: "right" })) return "right";
	return "left";
}

function renderCurrentAlignmentIcon(alignment: Alignment) {
	if (alignment === "center") {
		return <AlignTextCenterIcon label="" size="small" />;
	}
	if (alignment === "right") {
		return <AlignTextRightIcon label="" size="small" />;
	}
	return <AlignTextLeftIcon label="" size="small" />;
}

function addLink(editor: Editor): void {
	const url = window.prompt("Enter URL");

	if (url) {
		editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
	}
}

function ToolbarSeparator() {
	return (
		<Separator
			orientation="vertical"
			className="mx-2 h-4 self-center bg-border data-vertical:self-center"
		/>
	);
}

export function EditorToolbar({
	editor,
	className,
	controlsClassName,
	leadingSlot,
	endSlot,
	isMarkdownMode = false,
	onToggleMarkdownMode,
	onMarkdownFormat,
}: Readonly<EditorToolbarProps>) {
	const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
	const toolbarRef = useRef<HTMLDivElement>(null);
	const outsideRefs = useMemo(
		() => [toolbarRef as RefObject<HTMLElement | null>],
		[],
	);
	const alignment = getCurrentAlignment(editor);
	// Alignment has no raw-Markdown equivalent, so it stays disabled in source
	// mode. Every other control rewrites the textarea selection instead.
	const markdownUnsupported = isMarkdownMode;
	const formattingValue = [
		...(!isMarkdownMode && editor.isActive("bold") ? ["bold"] : []),
		...(openDropdown === "formatting" ? ["formatting"] : []),
	];
	const listValue = [
		...(!isMarkdownMode && editor.isActive("bulletList") ? ["bulletList"] : []),
		...(openDropdown === "list" ? ["list"] : []),
	];
	const showModeTabs = Boolean(onToggleMarkdownMode);

	useEditorTransactionRerender(editor);
	useClickOutside(outsideRefs, () => setOpenDropdown(null), openDropdown !== null);

	useEffect(() => {
		if (isMarkdownMode) {
			setOpenDropdown(null);
		}
	}, [isMarkdownMode]);

	function toggleDropdown(dropdown: DropdownType): void {
		setOpenDropdown((current) => (current === dropdown ? null : dropdown));
	}

	function closeDropdown(): void {
		setOpenDropdown(null);
	}

	// In source mode dispatch the Markdown-syntax transform; otherwise run the
	// equivalent Tiptap command against the rendered document.
	function runFormat(kind: MarkdownFormatKind, applyRich: () => void): void {
		if (isMarkdownMode) {
			onMarkdownFormat?.(kind);
			return;
		}

		applyRich();
	}

	function handleTextStyle(style: TextStyleType): void {
		runFormat(TEXT_STYLE_TO_MARKDOWN[style], () => setTextStyle(editor, style));
		closeDropdown();
	}

	function handleAlignment(nextAlignment: Alignment): void {
		editor.chain().focus().setTextAlign(nextAlignment).run();
		closeDropdown();
	}

	function handleFormattingValueChange(next: string[]): void {
		const boldActive = !isMarkdownMode && editor.isActive("bold");
		const boldNext = next.includes("bold");

		if (boldNext !== boldActive) {
			runFormat("bold", () => editor.chain().focus().toggleBold().run());
		}

		const formattingNext = next.includes("formatting");

		if (formattingNext !== (openDropdown === "formatting")) {
			toggleDropdown("formatting");
		}
	}

	function handleListValueChange(next: string[]): void {
		const bulletListActive = !isMarkdownMode && editor.isActive("bulletList");
		const bulletListNext = next.includes("bulletList");

		if (bulletListNext !== bulletListActive) {
			runFormat("bulletList", () => editor.chain().focus().toggleBulletList().run());
		}

		const listNext = next.includes("list");

		if (listNext !== (openDropdown === "list")) {
			toggleDropdown("list");
		}
	}

	function handleLinkPressedChange(pressed: boolean): void {
		if (isMarkdownMode) {
			onMarkdownFormat?.("link");
		} else if (pressed) {
			addLink(editor);
		} else {
			editor.chain().focus().unsetLink().run();
		}
	}

	function handleAddContent(): void {
		editor.chain().focus().insertContent({ type: "paragraph" }).run();
	}

	return (
		<div
			ref={toolbarRef}
			className={cn("flex min-h-8 items-center justify-between gap-4", className)}
		>
			<div className="flex min-w-0 items-center gap-1">
				{leadingSlot}
				<div className={cn("flex min-w-0 items-center gap-1", controlsClassName)}>
					<div className="relative">
						<Button
							type="button"
							aria-label={getCurrentTextStyle(editor)}
							aria-expanded={openDropdown === "textStyle"}
							size="icon"
							variant="ghost"
							onClick={() => toggleDropdown("textStyle")}
						>
							{renderCurrentTextStyleIcon(editor)}
						</Button>
						{openDropdown === "textStyle" ? (
							<DropdownMenuContainer>
								<DropdownMenuItem
									icon={<TextIcon label="Normal text" size="small" />}
									label="Normal text"
									isSelected={editor.isActive("paragraph")}
									onClick={() => handleTextStyle("normal")}
								/>
								<DropdownMenuItem
									icon={<TextHeadingOneIcon label="Heading 1" size="small" />}
									label="Heading 1"
									isSelected={editor.isActive("heading", { level: 1 })}
									onClick={() => handleTextStyle("h1")}
									className="text-lg font-semibold"
								/>
								<DropdownMenuItem
									icon={<TextHeadingTwoIcon label="Heading 2" size="small" />}
									label="Heading 2"
									isSelected={editor.isActive("heading", { level: 2 })}
									onClick={() => handleTextStyle("h2")}
									className="font-semibold text-base"
								/>
								<DropdownMenuItem
									icon={<TextHeadingThreeIcon label="Heading 3" size="small" />}
									label="Heading 3"
									isSelected={editor.isActive("heading", { level: 3 })}
									onClick={() => handleTextStyle("h3")}
									className="font-semibold"
								/>
								<DropdownMenuItem
									icon={<QuotationMarkIcon label="Quote" size="small" />}
									label="Quote"
									isSelected={editor.isActive("blockquote")}
									onClick={() => handleTextStyle("quote")}
								/>
								<DropdownMenuItem
									icon={<TerminalIcon label="Code block" size="small" />}
									label="Code block"
									isSelected={editor.isActive("codeBlock")}
									onClick={() => handleTextStyle("codeBlock")}
								/>
							</DropdownMenuContainer>
						) : null}
					</div>

					<div className="relative">
						<ToggleGroup
							multiple
							value={formattingValue}
							className={TOOLBAR_SPLIT_TOGGLE_GROUP_CLASS_NAME}
							onValueChange={handleFormattingValueChange}
						>
							<ToggleGroupItem
								value="bold"
								aria-label="Bold"
							>
								<TextBoldIcon label="" size="small" />
							</ToggleGroupItem>
							<ToggleGroupItem
								value="formatting"
								aria-label="More formatting options"
								aria-expanded={openDropdown === "formatting"}
							>
								<ChevronDownIcon label="" size="small" />
							</ToggleGroupItem>
						</ToggleGroup>
						{openDropdown === "formatting" ? (
							<DropdownMenuContainer>
								<DropdownMenuItem
									icon={<TextItalicIcon label="Italic" size="small" />}
									label="Italic"
									isSelected={editor.isActive("italic")}
									onClick={() => {
										runFormat("italic", () => editor.chain().focus().toggleItalic().run());
										closeDropdown();
									}}
								/>
								<DropdownMenuItem
									icon={<TextUnderlineIcon label="Underline" size="small" />}
									label="Underline"
									isSelected={editor.isActive("underline")}
									onClick={() => {
										runFormat("underline", () => editor.chain().focus().toggleUnderline().run());
										closeDropdown();
									}}
								/>
								<DropdownMenuItem
									icon={<TextStrikethroughIcon label="Strikethrough" size="small" />}
									label="Strikethrough"
									isSelected={editor.isActive("strike")}
									onClick={() => {
										runFormat("strikethrough", () => editor.chain().focus().toggleStrike().run());
										closeDropdown();
									}}
								/>
								<DropdownMenuItem
									icon={<SnippetIcon label="Code" size="small" />}
									label="Code"
									isSelected={editor.isActive("code")}
									onClick={() => {
										runFormat("inlineCode", () => editor.chain().focus().toggleCode().run());
										closeDropdown();
									}}
								/>
							</DropdownMenuContainer>
						) : null}
					</div>

					<ToolbarSeparator />

					<div className="relative">
						<ToggleGroup
							multiple
							value={listValue}
							className={TOOLBAR_SPLIT_TOGGLE_GROUP_CLASS_NAME}
							onValueChange={handleListValueChange}
						>
							<ToggleGroupItem
								value="bulletList"
								aria-label="Bulleted list"
							>
								<ListBulletedIcon label="" size="small" />
							</ToggleGroupItem>
							<ToggleGroupItem
								value="list"
								aria-label="More list options"
								aria-expanded={openDropdown === "list"}
							>
								<ChevronDownIcon label="" size="small" />
							</ToggleGroupItem>
						</ToggleGroup>
						{openDropdown === "list" ? (
							<DropdownMenuContainer>
								<DropdownMenuItem
									icon={<ListBulletedIcon label="Bulleted list" size="small" />}
									label="Bulleted list"
									isSelected={editor.isActive("bulletList")}
									onClick={() => {
										runFormat("bulletList", () => editor.chain().focus().toggleBulletList().run());
										closeDropdown();
									}}
								/>
								<DropdownMenuItem
									icon={<ListNumberedIcon label="Numbered list" size="small" />}
									label="Numbered list"
									isSelected={editor.isActive("orderedList")}
									onClick={() => {
										runFormat("orderedList", () => editor.chain().focus().toggleOrderedList().run());
										closeDropdown();
									}}
								/>
							</DropdownMenuContainer>
						) : null}
					</div>

					<ToolbarSeparator />

					<div className="relative">
						<Button
							type="button"
							aria-label="Text alignment"
							aria-expanded={openDropdown === "align"}
							size="icon"
							variant="ghost"
							disabled={markdownUnsupported}
							onClick={() => toggleDropdown("align")}
						>
							{renderCurrentAlignmentIcon(alignment)}
						</Button>
						{openDropdown === "align" ? (
							<DropdownMenuContainer>
								<DropdownMenuItem
									icon={<AlignTextLeftIcon label="Align left" size="small" />}
									label="Align left"
									isSelected={alignment === "left"}
									onClick={() => handleAlignment("left")}
								/>
								<DropdownMenuItem
									icon={<AlignTextCenterIcon label="Align center" size="small" />}
									label="Align center"
									isSelected={alignment === "center"}
									onClick={() => handleAlignment("center")}
								/>
								<DropdownMenuItem
									icon={<AlignTextRightIcon label="Align right" size="small" />}
									label="Align right"
									isSelected={alignment === "right"}
									onClick={() => handleAlignment("right")}
								/>
							</DropdownMenuContainer>
						) : null}
					</div>

					<Toggle
						aria-label="Link"
						pressed={!isMarkdownMode && editor.isActive("link")}
						onPressedChange={handleLinkPressedChange}
					>
						<LinkIcon label="" size="small" />
					</Toggle>
					<Button
						type="button"
						aria-label="Add content"
						size="icon"
						variant="ghost"
						disabled={isMarkdownMode}
						onClick={handleAddContent}
					>
						<AddIcon label="" size="small" />
					</Button>
				</div>
			</div>
			{endSlot || showModeTabs ? (
				<div className="flex shrink-0 items-center gap-2">
					{endSlot}
					{showModeTabs ? (
						<Tabs
							value={isMarkdownMode ? "markdown" : "rendered"}
							onValueChange={(value) => {
								const nextIsMarkdownMode = value === "markdown";

								if (nextIsMarkdownMode !== isMarkdownMode) {
									onToggleMarkdownMode?.();
								}
							}}
						>
							<TabsList>
								<TabsTrigger
									aria-label="Rendered text"
									value="rendered"
									className="px-2"
								>
									<TextNormalIcon size="small" />
								</TabsTrigger>
								<TabsTrigger
									aria-label="Markdown source"
									value="markdown"
									className="px-2"
								>
									<MarkdownIcon label="" size="small" />
								</TabsTrigger>
							</TabsList>
						</Tabs>
					) : null}
				</div>
			) : null}
		</div>
	);
}
