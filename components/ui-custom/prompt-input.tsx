"use client";

/* eslint-disable @typescript-eslint/no-unused-vars -- These underscored compatibility props and inferred generic placeholders are intentionally retained for API shape. */

// oxlint-disable react-doctor/exhaustive-deps -- Effects in this file intentionally coordinate refs, external animation loops, timers, subscriptions, or measured DOM state; dependencies are constrained to avoid restarting those bridges.
// oxlint-disable react-doctor/no-derived-state -- These components maintain local derived display state for controlled animations, measurements, or draft editing that cannot be represented as render-only values without changing UX.

// oxlint-disable react-doctor/no-event-handler -- Effects in this file bridge external systems, animation/media state, timers, or parent-controlled state rather than user event handlers.

import type { ChatStatus, FileUIPart, SourceDocumentUIPart } from "ai";
import type {
  ChangeEvent,
  ChangeEventHandler,
  ComponentProps,
  FormEvent,
  FormEventHandler,
  HTMLAttributes,
  KeyboardEventHandler,
  PropsWithChildren,
  ReactNode,
  RefObject,
} from "react";

import Image from "next/image";

import type { Editor } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";

import { EDITOR_PALETTE_MENTION_SOURCES } from "@/components/blocks/editor-palette/data/mention-sources";
import {
  clearComposerTraceDecorations,
  composerDirectoryAutocompletePluginKey,
  createComposerEditorExtensions,
  getMentionNodeAttrs,
  setComposerTraceDecorations,
  type ComposerDirectoryAutocompleteController,
  type ComposerTraceDecoration,
  type RichTextMentionSources,
  type RichTextMentionStorage,
} from "@/components/ui-custom/rich-text-editor";
import "@/components/ui-custom/rich-text-editor/rich-text-editor.css";
import { useHasVerticalOverflow } from "@/components/hooks/use-has-vertical-overflow";
import { buildScrollMaskStyle } from "@/components/visual/scroll-mask/lib";
import {
  serializeComposerDoc,
  setComposerPlainText,
} from "@/lib/composer-serialize";
import {
  getDirectoryAutocompleteExactLabelMatches,
  getDirectoryAutocompleteState,
  type DirectoryAutocompleteExactLabelMatch,
  type DirectoryAutocompleteState,
} from "@/lib/directory-autocomplete";

import { Badge } from "@/components/ui/badge";
import { resolveBrandLogoPresentation } from "@/components/ui/data/logo-usage";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  type DropdownMenuItemProps,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowUpIcon,
  ImageIcon,
  MicIcon,
  MonitorIcon,
  PlusIcon,
  XIcon,
} from "@/components/ui/vpk-icons";
import { cn } from "@/lib/utils";
import RandomizeIcon from "@atlaskit/icon-lab/core/randomize";
import { cva, type VariantProps } from "class-variance-authority";
import { nanoid } from "nanoid";
import {
  Children,
  createContext,
  useCallback,
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// ============================================================================
// Helpers
// ============================================================================

const convertBlobUrlToDataUrl = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    // FileReader uses callback-based API, wrapping in Promise is necessary
    // oxlint-disable-next-line eslint-plugin-promise(avoid-new)
    return new Promise((resolve) => {
      const reader = new FileReader();
      // oxlint-disable-next-line eslint-plugin-unicorn(prefer-add-event-listener)
      reader.onloadend = () => resolve(reader.result as string);
      // oxlint-disable-next-line eslint-plugin-unicorn(prefer-add-event-listener)
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const captureScreenshot = async (): Promise<File | null> => {
	if (
		typeof navigator === "undefined" ||
		!navigator.mediaDevices?.getDisplayMedia
	) {
		return null;
	}

	let stream: MediaStream | null = null;
	const video = document.createElement("video");
	video.muted = true;
	video.playsInline = true;

	try {
		stream = await navigator.mediaDevices.getDisplayMedia({
			audio: false,
			video: true,
		});

		video.srcObject = stream;

		await new Promise<void>((resolve, reject) => {
			video.onloadedmetadata = () => resolve();
			video.onerror = () => reject(new Error("Failed to load screen stream"));
		});

		await video.play();

		const width = video.videoWidth;
		const height = video.videoHeight;
		if (!width || !height) {
			return null;
		}

		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		const context = canvas.getContext("2d");
		if (!context) {
			return null;
		}

		context.drawImage(video, 0, 0, width, height);
		const blob = await new Promise<Blob | null>((resolve) => {
			canvas.toBlob(resolve, "image/png");
		});
		if (!blob) {
			return null;
		}

		const timestamp = new Date()
			.toISOString()
			.replaceAll(/[:.]/g, "-")
			.replace("T", "_")
			.replace("Z", "");

		return new File([blob], `screenshot-${timestamp}.png`, {
			lastModified: Date.now(),
			type: "image/png",
		});
	} finally {
		if (stream) {
			for (const track of stream.getTracks()) {
				track.stop();
			}
		}
		video.pause();
		video.srcObject = null;
	}
};

// ============================================================================
// Provider Context & Types
// ============================================================================

export interface AttachmentsContext {
  files: (FileUIPart & { id: string })[];
  add: (files: File[] | FileList) => void;
  remove: (id: string) => void;
  clear: () => void;
  openFileDialog: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
}

export interface TextInputContext {
  value: string;
  setInput: (v: string) => void;
  clear: () => void;
}

export interface PromptInputControllerProps {
  textInput: TextInputContext;
  attachments: AttachmentsContext;
  /** INTERNAL: Allows PromptInput to register its file textInput + "open" callback */
  __registerFileInput: (
    ref: RefObject<HTMLInputElement | null>,
    open: () => void
  ) => void;
}

const PromptInputController = createContext<PromptInputControllerProps | null>(
  null
);
const ProviderAttachmentsContext = createContext<AttachmentsContext | null>(
  null
);

export const usePromptInputController = () => {
  const ctx = use(PromptInputController);
  if (!ctx) {
    throw new Error(
      "Wrap your component inside <PromptInputProvider> to use usePromptInputController()."
    );
  }
  return ctx;
};

// Optional variants (do NOT throw). Useful for dual-mode components.
const useOptionalPromptInputController = () =>
  use(PromptInputController);

export const useProviderAttachments = () => {
  const ctx = use(ProviderAttachmentsContext);
  if (!ctx) {
    throw new Error(
      "Wrap your component inside <PromptInputProvider> to use useProviderAttachments()."
    );
  }
  return ctx;
};

const useOptionalProviderAttachments = () =>
  use(ProviderAttachmentsContext);

export type PromptInputProviderProps = PropsWithChildren<{
  initialInput?: string;
}>;

/**
 * Optional global provider that lifts PromptInput state outside of PromptInput.
 * If you don't use it, PromptInput stays fully self-managed.
 */
export const PromptInputProvider = ({
  initialInput: initialTextInput = "",
  children,
}: PromptInputProviderProps) => {
  // ----- textInput state
  const [textInput, setTextInput] = useState(initialTextInput);
  const clearInput = useCallback(() => setTextInput(""), []);

  // ----- attachments state (global when wrapped)
  const [attachmentFiles, setAttachmentFiles] = useState<
    (FileUIPart & { id: string })[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // oxlint-disable-next-line eslint(no-empty-function)
  const openRef = useRef<() => void>(() => {});

  const add = useCallback((files: File[] | FileList) => {
    const incoming = [...files];
    if (incoming.length === 0) {
      return;
    }

    setAttachmentFiles((prev) => [
      ...prev,
      ...incoming.map((file) => ({
        filename: file.name,
        id: nanoid(),
        mediaType: file.type,
        type: "file" as const,
        url: URL.createObjectURL(file),
      })),
    ]);
  }, []);

  const remove = useCallback((id: string) => {
    setAttachmentFiles((prev) => {
      const found = prev.find((f) => f.id === id);
      if (found?.url) {
        URL.revokeObjectURL(found.url);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const clear = useCallback(() => {
    setAttachmentFiles((prev) => {
      for (const f of prev) {
        if (f.url) {
          URL.revokeObjectURL(f.url);
        }
      }
      return [];
    });
  }, []);

  // Keep a ref to attachments for cleanup on unmount (avoids stale closure)
  const attachmentsRef = useRef(attachmentFiles);

  useEffect(() => {
    attachmentsRef.current = attachmentFiles;
  }, [attachmentFiles]);

  // Cleanup blob URLs on unmount to prevent memory leaks
  useEffect(
    () => () => {
      for (const f of attachmentsRef.current) {
        if (f.url) {
          URL.revokeObjectURL(f.url);
        }
      }
    },
    []
  );

  const openFileDialog = useCallback(() => {
    openRef.current?.();
  }, []);

  const attachments = useMemo<AttachmentsContext>(
    () => ({
      add,
      clear,
      fileInputRef,
      files: attachmentFiles,
      openFileDialog,
      remove,
    }),
    [attachmentFiles, add, remove, clear, openFileDialog]
  );

  const __registerFileInput = useCallback(
    (ref: RefObject<HTMLInputElement | null>, open: () => void) => {
      fileInputRef.current = ref.current;
      openRef.current = open;
    },
    []
  );

  const controller = useMemo<PromptInputControllerProps>(
    () => ({
      __registerFileInput,
      attachments,
      textInput: {
        clear: clearInput,
        setInput: setTextInput,
        value: textInput,
      },
    }),
    [textInput, clearInput, attachments, __registerFileInput]
  );

  return (
    <PromptInputController value={controller}>
      <ProviderAttachmentsContext value={attachments}>
        {children}
      </ProviderAttachmentsContext>
    </PromptInputController>
  );
};

// ============================================================================
// Component Context & Hooks
// ============================================================================

const LocalAttachmentsContext = createContext<AttachmentsContext | null>(null);

export const usePromptInputAttachments = () => {
  // Prefer local context (inside PromptInput) as it has validation, fall back to provider
  const provider = useOptionalProviderAttachments();
  const local = use(LocalAttachmentsContext);
  const context = local ?? provider;
  if (!context) {
    throw new Error(
      "usePromptInputAttachments must be used within a PromptInput or PromptInputProvider"
    );
  }
  return context;
};

// ============================================================================
// Referenced Sources (Local to PromptInput)
// ============================================================================

export interface ReferencedSourcesContext {
  sources: (SourceDocumentUIPart & { id: string })[];
  add: (sources: SourceDocumentUIPart[] | SourceDocumentUIPart) => void;
  remove: (id: string) => void;
  clear: () => void;
}

// react-doctor-disable-next-line react-doctor/only-export-components -- This context module intentionally exports the provider, hook, and context contract together.
export const LocalReferencedSourcesContext =
  createContext<ReferencedSourcesContext | null>(null);

export const usePromptInputReferencedSources = () => {
  const ctx = use(LocalReferencedSourcesContext);
  if (!ctx) {
    throw new Error(
      "usePromptInputReferencedSources must be used within a LocalReferencedSourcesContext.Provider"
    );
  }
  return ctx;
};

export type PromptInputActionAddAttachmentsProps = ComponentProps<
  typeof DropdownMenuItem
> & {
  label?: string;
};

export const PromptInputActionAddAttachments = ({
  label = "Add photos or files",
  children,
  onClick,
  ...props
}: Readonly<PromptInputActionAddAttachmentsProps>) => {
  const attachments = usePromptInputAttachments();

  const handleClick: NonNullable<DropdownMenuItemProps["onClick"]> = useCallback(
    (e) => {
      onClick?.(e);
      attachments.openFileDialog();
    },
    [onClick, attachments]
  );

  return (
    <DropdownMenuItem {...props} onClick={handleClick}>
      {children ?? <><ImageIcon className="mr-2 size-4" /> {label}</>}
    </DropdownMenuItem>
  );
};

export type PromptInputActionAddScreenshotProps = ComponentProps<
  typeof DropdownMenuItem
> & {
  label?: string;
};

export const PromptInputActionAddScreenshot = ({
  label = "Take screenshot",
  children,
  onClick,
  ...props
}: Readonly<PromptInputActionAddScreenshotProps>) => {
  const attachments = usePromptInputAttachments();

  const handleClick: NonNullable<DropdownMenuItemProps["onClick"]> = useCallback(
    async (e) => {
      onClick?.(e);

      try {
        const screenshot = await captureScreenshot();
        if (screenshot) {
          attachments.add([screenshot]);
        }
      } catch (error) {
        if (
          error instanceof DOMException &&
          (error.name === "NotAllowedError" || error.name === "AbortError")
        ) {
          return;
        }
        throw error;
      }
    },
    [onClick, attachments]
  );

  return (
    <DropdownMenuItem {...props} onClick={handleClick}>
      {children ?? <><MonitorIcon className="mr-2 size-4" />{label}</>}
    </DropdownMenuItem>
  );
};

export interface PromptInputMessage {
  text: string;
  files: FileUIPart[];
}

const promptInputVariants = cva("w-full", {
  variants: {
    variant: {
      default: "",
      floating:
        "rounded-xl border border-border bg-bg-input p-4 shadow-[0px_-2px_50px_8px_rgba(30,31,33,0.08)]",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export type PromptInputProps = Omit<
  HTMLAttributes<HTMLFormElement>,
  "onSubmit" | "onError"
> &
  VariantProps<typeof promptInputVariants> & {
    // e.g., "image/*" or leave undefined for any
    accept?: string;
    multiple?: boolean;
    // When true, accepts drops anywhere on document. Default false (opt-in).
    globalDrop?: boolean;
    // Render a hidden input with given name and keep it in sync for native form posts. Default false.
    syncHiddenInput?: boolean;
    // When true, allows children (e.g. animated pulse rings) to render outside bounds.
    allowOverflow?: boolean;
    // Minimal constraints
    maxFiles?: number;
    // bytes
    maxFileSize?: number;
    onError?: (err: {
      code: "max_files" | "max_file_size" | "accept";
      message: string;
    }) => void;
    onSubmit: (
      message: PromptInputMessage,
      event: FormEvent<HTMLFormElement>
    ) => void | Promise<void>;
  };

export const PromptInput = ({
  className,
  variant,
  accept,
  multiple,
  globalDrop,
  syncHiddenInput,
  allowOverflow = false,
  maxFiles,
  maxFileSize,
  onError,
  onSubmit,
  children,
  ...props
}: Readonly<PromptInputProps>) => {
  // Try to use a provider controller if present
  const controller = useOptionalPromptInputController();
  const usingProvider = !!controller;

  // Refs
  const inputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  // ----- Local attachments (only used when no provider)
  const [items, setItems] = useState<(FileUIPart & { id: string })[]>([]);
  const files = usingProvider ? controller.attachments.files : items;

  // ----- Local referenced sources (always local to PromptInput)
  const [referencedSources, setReferencedSources] = useState<
    (SourceDocumentUIPart & { id: string })[]
  >([]);

  // Keep a ref to files for cleanup on unmount (avoids stale closure)
  const filesRef = useRef(files);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const openFileDialogLocal = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const matchesAccept = useCallback(
    (f: File) => {
      if (!accept || accept.trim() === "") {
        return true;
      }

      const patterns = accept
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      return patterns.some((pattern) => {
        if (pattern.endsWith("/*")) {
          // e.g: image/* -> image/
          const prefix = pattern.slice(0, -1);
          return f.type.startsWith(prefix);
        }
        return f.type === pattern;
      });
    },
    [accept]
  );

  const addLocal = useCallback(
    (fileList: File[] | FileList) => {
      const incoming = [...fileList];
      const accepted = incoming.filter((f) => matchesAccept(f));
      if (incoming.length && accepted.length === 0) {
        onError?.({
          code: "accept",
          message: "No files match the accepted types.",
        });
        return;
      }
      const withinSize = (f: File) =>
        maxFileSize ? f.size <= maxFileSize : true;
      const sized = accepted.filter(withinSize);
      if (accepted.length > 0 && sized.length === 0) {
        onError?.({
          code: "max_file_size",
          message: "All files exceed the maximum size.",
        });
        return;
      }

      setItems((prev) => {
        const capacity =
          typeof maxFiles === "number"
            ? Math.max(0, maxFiles - prev.length)
            : undefined;
        const capped =
          typeof capacity === "number" ? sized.slice(0, capacity) : sized;
        if (typeof capacity === "number" && sized.length > capacity) {
          onError?.({
            code: "max_files",
            message: "Too many files. Some were not added.",
          });
        }
        const next: (FileUIPart & { id: string })[] = [];
        for (const file of capped) {
          next.push({
            filename: file.name,
            id: nanoid(),
            mediaType: file.type,
            type: "file",
            url: URL.createObjectURL(file),
          });
        }
        return [...prev, ...next];
      });
    },
    [matchesAccept, maxFiles, maxFileSize, onError]
  );

  const removeLocal = useCallback(
    (id: string) =>
      setItems((prev) => {
        const found = prev.find((file) => file.id === id);
        if (found?.url) {
          URL.revokeObjectURL(found.url);
        }
        return prev.filter((file) => file.id !== id);
      }),
    []
  );

  // Wrapper that validates files before calling provider's add
  const addWithProviderValidation = useCallback(
    (fileList: File[] | FileList) => {
      const incoming = [...fileList];
      const accepted = incoming.filter((f) => matchesAccept(f));
      if (incoming.length && accepted.length === 0) {
        onError?.({
          code: "accept",
          message: "No files match the accepted types.",
        });
        return;
      }
      const withinSize = (f: File) =>
        maxFileSize ? f.size <= maxFileSize : true;
      const sized = accepted.filter(withinSize);
      if (accepted.length > 0 && sized.length === 0) {
        onError?.({
          code: "max_file_size",
          message: "All files exceed the maximum size.",
        });
        return;
      }

      const currentCount = files.length;
      const capacity =
        typeof maxFiles === "number"
          ? Math.max(0, maxFiles - currentCount)
          : undefined;
      const capped =
        typeof capacity === "number" ? sized.slice(0, capacity) : sized;
      if (typeof capacity === "number" && sized.length > capacity) {
        onError?.({
          code: "max_files",
          message: "Too many files. Some were not added.",
        });
      }

      if (capped.length > 0) {
        controller?.attachments.add(capped);
      }
    },
    [matchesAccept, maxFileSize, maxFiles, onError, files.length, controller]
  );

  const clearAttachments = useCallback(
    () =>
      usingProvider
        ? controller?.attachments.clear()
        : setItems((prev) => {
            for (const file of prev) {
              if (file.url) {
                URL.revokeObjectURL(file.url);
              }
            }
            return [];
          }),
    [usingProvider, controller]
  );

  const clearReferencedSources = useCallback(
    () => setReferencedSources([]),
    []
  );

  const add = usingProvider ? addWithProviderValidation : addLocal;
  const remove = usingProvider ? controller.attachments.remove : removeLocal;
  const openFileDialog = usingProvider
    ? controller.attachments.openFileDialog
    : openFileDialogLocal;

  const clear = useCallback(() => {
    clearAttachments();
    clearReferencedSources();
  }, [clearAttachments, clearReferencedSources]);

  // Let provider know about our hidden file input so external menus can call openFileDialog()
  useEffect(() => {
    if (!usingProvider) {
      return;
    }
    controller.__registerFileInput(inputRef, () => inputRef.current?.click());
  }, [usingProvider, controller]);

  // Note: File input cannot be programmatically set for security reasons
  // The syncHiddenInput prop is no longer functional
  useEffect(() => {
    if (syncHiddenInput && inputRef.current && files.length === 0) {
      inputRef.current.value = "";
    }
  }, [files, syncHiddenInput]);

  // Attach drop handlers on nearest form and document (opt-in)
  useEffect(() => {
    const form = formRef.current;
    if (!form) {
      return;
    }
    if (globalDrop) {
      // when global drop is on, let the document-level handler own drops
      return;
    }

    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        e.preventDefault();
      }
    };
    const onDrop = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        e.preventDefault();
      }
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        add(e.dataTransfer.files);
      }
    };
    form.addEventListener("dragover", onDragOver);
    form.addEventListener("drop", onDrop);
    return () => {
      form.removeEventListener("dragover", onDragOver);
      form.removeEventListener("drop", onDrop);
    };
  }, [add, globalDrop]);

  useEffect(() => {
    if (!globalDrop) {
      return;
    }

    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        e.preventDefault();
      }
    };
    const onDrop = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        e.preventDefault();
      }
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        add(e.dataTransfer.files);
      }
    };
    document.addEventListener("dragover", onDragOver);
    document.addEventListener("drop", onDrop);
    return () => {
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("drop", onDrop);
    };
  }, [add, globalDrop]);

  useEffect(
    () => () => {
      if (!usingProvider) {
        for (const f of filesRef.current) {
          if (f.url) {
            URL.revokeObjectURL(f.url);
          }
        }
      }
    },
    [usingProvider]
  );

  const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      if (event.currentTarget.files) {
        add(event.currentTarget.files);
      }
      // Reset input value to allow selecting files that were previously removed
      event.currentTarget.value = "";
    },
    [add]
  );

  const attachmentsCtx = useMemo<AttachmentsContext>(
    () => ({
      add,
      clear: clearAttachments,
      fileInputRef: inputRef,
      files: files.map((item) => ({ ...item, id: item.id })),
      openFileDialog,
      remove,
    }),
    [files, add, remove, clearAttachments, openFileDialog]
  );

  const refsCtx = useMemo<ReferencedSourcesContext>(
    () => ({
      add: (incoming: SourceDocumentUIPart[] | SourceDocumentUIPart) => {
        const array = Array.isArray(incoming) ? incoming : [incoming];
        setReferencedSources((prev) => [
          ...prev,
          ...array.map((s) => ({ ...s, id: nanoid() })),
        ]);
      },
      clear: clearReferencedSources,
      remove: (id: string) => {
        setReferencedSources((prev) => prev.filter((s) => s.id !== id));
      },
      sources: referencedSources,
    }),
    [referencedSources, clearReferencedSources]
  );

  const handleSubmit: FormEventHandler<HTMLFormElement> = useCallback(
    async (event) => {
      event.preventDefault();

      const form = event.currentTarget;
      // Prefer the composer's synced hidden field so a submit-time rich-text
      // flush (e.g. auto-tag conversion) is captured synchronously even when a
      // provider-backed controller state update has not rendered yet.
      const field = form.querySelector<HTMLInputElement>(
        '[data-slot="prompt-input-message"]'
      );
      const text = field
        ? field.value
        : usingProvider
          ? controller.textInput.value
          : (() => {
              const formData = new FormData(form);
              return (formData.get("message") as string) || "";
            })();

      // Reset form immediately after capturing text to avoid race condition
      // where user input during async blob conversion would be lost
      if (!usingProvider) {
        form.reset();
      }

      try {
        // Convert blob URLs to data URLs asynchronously
        const convertedFiles: FileUIPart[] = await Promise.all(
          files.map(async ({ id: _id, ...item }) => {
            if (item.url?.startsWith("blob:")) {
              const dataUrl = await convertBlobUrlToDataUrl(item.url);
              // If conversion failed, keep the original blob URL
              return {
                ...item,
                url: dataUrl ?? item.url,
              };
            }
            return item;
          })
        );

        const result = onSubmit({ files: convertedFiles, text }, event);

        // Handle both sync and async onSubmit
        if (result instanceof Promise) {
          try {
            await result;
            clear();
            if (usingProvider) {
              controller.textInput.clear();
            }
          } catch {
            // Don't clear on error - user may want to retry
          }
        } else {
          // Sync function completed without throwing, clear inputs
          clear();
          if (usingProvider) {
            controller.textInput.clear();
          }
        }
      } catch {
        // Don't clear on error - user may want to retry
      }
    },
    [usingProvider, controller, files, onSubmit, clear]
  );

  // Render with or without local provider
  const inner = (
    <>
      <input
        accept={accept}
        aria-label="Upload files"
        className="hidden"
        multiple={multiple}
        onChange={handleChange}
        ref={inputRef}
        title="Upload files"
        type="file"
      />
      <form
        className={cn(promptInputVariants({ variant }), className)}
        onSubmit={handleSubmit}
        ref={formRef}
        {...props}
        data-prompt-input-root=""
      >
        <InputGroup
          className={cn(
            allowOverflow ? "overflow-visible" : "overflow-hidden",
            "rounded-none border-0 ring-0 has-disabled:opacity-100 has-disabled:bg-transparent has-[[data-slot=input-group-control]:focus-visible]:border-0 has-[[data-slot=input-group-control]:focus-visible]:ring-0"
          )}
        >
          {children}
        </InputGroup>
      </form>
    </>
  );

  const withReferencedSources = (
    <LocalReferencedSourcesContext value={refsCtx}>
      {inner}
    </LocalReferencedSourcesContext>
  );

  // Always provide LocalAttachmentsContext so children get validated add function
  return (
    <LocalAttachmentsContext value={attachmentsCtx}>
      {withReferencedSources}
    </LocalAttachmentsContext>
  );
};

export type PromptInputBodyProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputBody = ({
  className,
  ...props
}: Readonly<PromptInputBodyProps>) => (
  <div className={cn("contents", className)} {...props} />
);

export type PromptInputTextareaProps = ComponentProps<
  typeof InputGroupTextarea
> & {
  autoResize?: boolean;
  /**
   * Opt-in Rovo composer behavior that converts exact unprefixed, "/" skill/app,
   * and "@" mention labels into true mention nodes after a short idle.
   */
  enableVisualTraceAutoTagging?: boolean;
  /**
   * Enables plain-text skill/tool autocomplete backed by the directory mention
   * catalog. Defaults to true so every prompt composer exposes the discoverable
   * token path; pass false for exceptional surfaces.
   */
  enableDirectoryAutocomplete?: boolean;
  /**
   * Whether the host is rendering an external suggestions list for the current
   * composer. When true, ArrowUp/ArrowDown/Enter and Mod+1..9 select that list
   * instead of submitting.
   */
  directoryAutocompleteListVisible?: boolean;
  /** Receives composer-owned autocomplete state for external list rendering. */
  onDirectoryAutocompleteChange?: (state: DirectoryAutocompleteState | null) => void;
  /** Receives imperative insertion/selection actions for external rows. */
  onDirectoryAutocompleteControllerChange?: (controller: ComposerDirectoryAutocompleteController | null) => void;
  /**
   * Mention/reference catalog backing the inline `@`/`/` palette. Defaults to
   * the unified editor-palette catalog (built from `@/app/data/directory`).
   */
  mentionSources?: RichTextMentionSources;
  /**
   * Called once the tiptap editor is ready. Use this (or the forwarded `ref`,
   * which points at the contentEditable DOM) to drive focus or measurement,
   * e.g. from the Rovo/Studio composers.
   */
  onEditorReady?: (editor: Editor) => void;
};

/**
 * Build a textarea-shaped synthetic change event so existing consumers that read
 * `event.currentTarget.value` / `event.target.value` keep working now that the
 * control is a contentEditable rather than a native <textarea>.
 */
function createSyntheticChangeEvent(
  element: HTMLElement | null,
  value: string,
  name: string
): ChangeEvent<HTMLTextAreaElement> {
  // Consumers only read `.value` / `.name` off target/currentTarget. Build a
  // lightweight textarea-shaped target whose prototype is the real
  // contentEditable element, so identity checks still resolve to the DOM node
  // without mutating it.
  const target = Object.create(element, {
    name: { configurable: true, enumerable: true, value: name },
    value: { configurable: true, enumerable: true, value },
  }) as HTMLTextAreaElement & EventTarget;

  return {
    bubbles: true,
    cancelable: false,
    currentTarget: target,
    defaultPrevented: false,
    target,
    type: "change",
    preventDefault: () => undefined,
    stopPropagation: () => undefined,
  } as unknown as ChangeEvent<HTMLTextAreaElement>;
}

const VISUAL_TRACE_AUTO_TAG_TYPED_IDLE_MS = 180;
const VISUAL_TRACE_AUTO_TAG_CONVERT_MS = 940;
const VISUAL_TRACE_AUTO_TAG_STAGGER_MS = 140;
const VISUAL_TRACE_OBJECT_REPLACEMENT = "\uFFFC";

interface VisualTraceAutoTagPendingMatch {
  expectedText: string;
  from: number;
  id: string;
  label: string;
  match: DirectoryAutocompleteExactLabelMatch;
  to: number;
  traceFrom: number;
  traceText: string;
  traceTo: number;
}

interface VisualTraceAutoTagUndoSnapshot {
  afterText: string;
  beforeJSON: ReturnType<Editor["getJSON"]>;
  beforeText: string;
}

// The mention extension stores a per-draft set of source texts the user reverted
// (lowercased) so the auto-tagger can skip re-converting them. The extension's
// name is "mention"; surfaces without it leave `editor.storage.mention` undefined.
function getDismissedAutoTags(editor: Editor): Set<string> | undefined {
  const mentionStorage = (editor.storage as unknown as { mention?: RichTextMentionStorage }).mention;
  return mentionStorage?.dismissedAutoTags;
}

/** A mention node that the composer auto-tagged (carries the typed `sourceText`). */
function isAutoTaggedMention(
  node: { type: { name: string }; attrs: { sourceText?: unknown } } | null | undefined,
): boolean {
  return (
    node?.type.name === "mention" &&
    typeof node.attrs.sourceText === "string" &&
    Boolean(node.attrs.sourceText)
  );
}

/**
 * Resolve the document position of an auto-tagged mention a Backspace should
 * revert, or null. Handles the caret sitting directly after the chip, and the
 * common just-typed case where conversion appended a trailing space so the caret
 * lands after that space (a lone space is treated as adjacency to the chip).
 */
function getBackspaceRevertPos(editor: Editor): number | null {
  const { selection } = editor.state;
  if (!selection.empty) {
    return null;
  }

  const { $from } = selection;
  const before = $from.nodeBefore;
  if (isAutoTaggedMention(before)) {
    return $from.pos - before!.nodeSize;
  }

  if (before?.isText && before.text === " ") {
    const spaceStart = $from.pos - before.nodeSize;
    const beforeSpace = editor.state.doc.resolve(spaceStart).nodeBefore;
    if (isAutoTaggedMention(beforeSpace)) {
      return spaceStart - beforeSpace!.nodeSize;
    }
  }

  return null;
}

interface VisualTraceTextSegment {
  from: number;
  textFrom: number;
  textTo: number;
  to: number;
}

interface VisualTraceBlockText {
  blockFrom: number;
  segments: readonly VisualTraceTextSegment[];
  text: string;
}

function getCurrentVisualTraceBlockText(editor: Editor): VisualTraceBlockText {
  const { selection } = editor.state;
  const blockFrom = selection.$from.start();
  const segments: VisualTraceTextSegment[] = [];
  let text = "";

  selection.$from.parent.descendants((node, offset) => {
    if (node.isText && node.text) {
      const textFrom = text.length;
      text += node.text;
      segments.push({
        from: blockFrom + offset,
        textFrom,
        textTo: text.length,
        to: blockFrom + offset + node.text.length,
      });
      return false;
    }

    if (node.type.name === "hardBreak") {
      text += "\n";
      return false;
    }

    if (node.type.name === "mention") {
      text += VISUAL_TRACE_OBJECT_REPLACEMENT;
      return false;
    }

    return true;
  });

  return {
    blockFrom,
    segments,
    text,
  };
}

function getVisualTraceDocumentText(editor: Editor): VisualTraceBlockText {
  const segments: VisualTraceTextSegment[] = [];
  let text = "";

  editor.state.doc.forEach((block, blockOffset, blockIndex) => {
    if (blockIndex > 0) {
      text += "\n";
    }

    block.descendants((node, offset) => {
      if (node.isText && node.text) {
        const position = blockOffset + 1 + offset;
        const textFrom = text.length;
        text += node.text;
        segments.push({
          from: position,
          textFrom,
          textTo: text.length,
          to: position + node.text.length,
        });
        return false;
      }

      if (node.type.name === "hardBreak") {
        text += "\n";
        return false;
      }

      if (node.type.name === "mention") {
        text += VISUAL_TRACE_OBJECT_REPLACEMENT;
        return false;
      }

      return true;
    });
  });

  return {
    blockFrom: 0,
    segments,
    text,
  };
}

function getVisualTraceDocPosition(
  block: VisualTraceBlockText,
  textOffset: number,
): number | null {
  for (const segment of block.segments) {
    if (textOffset >= segment.textFrom && textOffset <= segment.textTo) {
      return segment.from + textOffset - segment.textFrom;
    }
  }

  return null;
}

function getVisualTraceDocRange(
  block: VisualTraceBlockText,
  match: DirectoryAutocompleteExactLabelMatch,
): { from: number; to: number } | null {
  const from = getVisualTraceDocPosition(block, match.from);
  const to = getVisualTraceDocPosition(block, match.to);
  if (from === null || to === null || from >= to) {
    return null;
  }

  return { from, to };
}

function getVisualTraceDocTraceRange(
  block: VisualTraceBlockText,
  match: DirectoryAutocompleteExactLabelMatch,
): { from: number; to: number } | null {
  const from = getVisualTraceDocPosition(block, match.from);
  const to = getVisualTraceDocPosition(block, match.to);
  if (from === null || to === null || from >= to) {
    return null;
  }

  return { from, to };
}

export const PromptInputTextarea = ({
  autoResize: _autoResize = true,
  enableVisualTraceAutoTagging = false,
  enableDirectoryAutocomplete = true,
  directoryAutocompleteListVisible = false,
  onDirectoryAutocompleteChange,
  onDirectoryAutocompleteControllerChange,
  onChange,
  onInput,
  onKeyDown: _onKeyDown,
  className,
  placeholder = "What would you like to know?",
  ref: forwardedRef,
  value: valueProp,
  name = "message",
  disabled,
  autoFocus,
  mentionSources = EDITOR_PALETTE_MENTION_SOURCES,
  onEditorReady,
  "aria-label": ariaLabel,
  // Native-textarea-only props (rows, enterKeyHint, onPaste, …) have no
  // contentEditable equivalent the composer relies on; absorb them so the
  // public prop type stays drop-in without forwarding them to a <div>.
  rows: _rows,
  // oxlint-disable-next-line eslint(no-unused-vars)
  onCompositionStart: _onCompositionStart,
  // oxlint-disable-next-line eslint(no-unused-vars)
  onCompositionEnd: _onCompositionEnd,
  // oxlint-disable-next-line eslint(no-unused-vars)
  onPaste: _onPaste,
  // oxlint-disable-next-line eslint(no-unused-vars)
  onClick: _onClick,
  // oxlint-disable-next-line eslint(no-unused-vars)
  enterKeyHint: _enterKeyHint,
  ...props
}: Readonly<PromptInputTextareaProps>) => {
  const controller = useOptionalPromptInputController();
  const attachments = usePromptInputAttachments();

  // The public `value` prop inherits the textarea union type; the composer only
  // deals in plain strings, so normalize once.
  const normalizedValueProp =
    typeof valueProp === "string" ? valueProp : undefined;

  // Stable refs for callbacks/values the editor reads, so the editor instance is
  // created once and never torn down by changing handler identities.
  const onChangeRef = useRef(onChange);
  const onInputRef = useRef(onInput);
  const onEditorReadyRef = useRef(onEditorReady);
  const mentionSourcesRef = useRef(mentionSources);
  const attachmentsRef = useRef(attachments);
  const controllerRef = useRef(controller);
  const nameRef = useRef(name);
  const activeEditorRef = useRef<Editor | null>(null);
  const visualTraceApplyingRef = useRef(false);
  const visualTraceGenerationRef = useRef(0);
  const visualTraceImmediateUpdateRef = useRef(false);
  const visualTracePendingRef = useRef(false);
  const visualTracePendingMatchesRef = useRef<readonly VisualTraceAutoTagPendingMatch[]>([]);
  const visualTraceTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const visualTraceUndoSnapshotRef = useRef<VisualTraceAutoTagUndoSnapshot | null>(null);
  const directoryAutocompleteStateRef = useRef<DirectoryAutocompleteState | null>(null);
  const directoryAutocompleteListVisibleRef = useRef(directoryAutocompleteListVisible);
  const onDirectoryAutocompleteChangeRef = useRef(onDirectoryAutocompleteChange);
  const onDirectoryAutocompleteControllerChangeRef = useRef(onDirectoryAutocompleteControllerChange);
  const acceptDirectoryAutocompleteIndexRef = useRef<(index: number, requireGhost?: boolean) => boolean>(() => false);
  const moveDirectoryAutocompleteActiveRef = useRef<(direction: -1 | 1) => boolean>(() => false);
  const setDirectoryAutocompleteActiveIndexRef = useRef<(index: number) => boolean>(() => false);

  const directoryAutocompleteController = useMemo<ComposerDirectoryAutocompleteController>(() => ({
    acceptActive: () => acceptDirectoryAutocompleteIndexRef.current(
      directoryAutocompleteStateRef.current?.activeIndex ?? 0
    ),
    acceptGhost: () => acceptDirectoryAutocompleteIndexRef.current(0, true),
    acceptIndex: (index: number) => acceptDirectoryAutocompleteIndexRef.current(index),
    hasVisibleList: () =>
      directoryAutocompleteListVisibleRef.current &&
      (directoryAutocompleteStateRef.current?.matches.length ?? 0) > 0,
    moveActive: (direction: -1 | 1) => moveDirectoryAutocompleteActiveRef.current(direction),
    setActiveIndex: (index: number) => setDirectoryAutocompleteActiveIndexRef.current(index),
  }), []);

  useEffect(() => {
    onChangeRef.current = onChange;
    onInputRef.current = onInput;
    onEditorReadyRef.current = onEditorReady;
    mentionSourcesRef.current = mentionSources;
    attachmentsRef.current = attachments;
    controllerRef.current = controller;
    nameRef.current = name;
    directoryAutocompleteListVisibleRef.current = directoryAutocompleteListVisible;
    onDirectoryAutocompleteChangeRef.current = onDirectoryAutocompleteChange;
    onDirectoryAutocompleteControllerChangeRef.current = onDirectoryAutocompleteControllerChange;
  });

  const hiddenInputRef = useRef<HTMLInputElement | null>(null);
  const [domEmpty, setDomEmpty] = useState(() => {
    const initial = controller ? controller.textInput.value : normalizedValueProp;
    return !initial;
  });
  const {
    ref: composerScrollOverflowRef,
    showBottomScrollMask: showComposerBottomScrollMask,
    showTopScrollMask: showComposerTopScrollMask,
  } = useHasVerticalOverflow<HTMLElement>();
  const composerScrollMaskStyle = useMemo(
    () => buildScrollMaskStyle({ fadeSize: "var(--ds-space-200)" }),
    []
  );

  // Mirror the serialized text into the hidden input + the optional consumer
  // handlers. `fromEditor` distinguishes user edits (fire onChange) from
  // programmatic syncs (skip onChange to avoid feedback loops).
  const publishText = useCallback(
    (text: string, editorDom: HTMLElement | null, fromEditor: boolean) => {
      if (hiddenInputRef.current) {
        hiddenInputRef.current.value = text;
      }
      setDomEmpty(text === "");

      if (!fromEditor) {
        return;
      }

      const activeController = controllerRef.current;
      if (activeController) {
        activeController.textInput.setInput(text);
      }

      const syntheticEvent = createSyntheticChangeEvent(
        editorDom,
        text,
        nameRef.current
      );
      onChangeRef.current?.(syntheticEvent);
      onInputRef.current?.(
        syntheticEvent as unknown as Parameters<
          NonNullable<PromptInputTextareaProps["onInput"]>
        >[0]
      );
    },
    []
  );

  const applyDirectoryAutocompleteGhost = useCallback((state: DirectoryAutocompleteState | null) => {
    const activeEditor = activeEditorRef.current;
    if (!activeEditor) {
      return;
    }

    const meta = state?.ghostText
      ? { from: state.queryTo, text: state.ghostText }
      : null;
    activeEditor.view.dispatch(
      activeEditor.state.tr.setMeta(composerDirectoryAutocompletePluginKey, meta)
    );
  }, []);

  const setDirectoryAutocompleteState = useCallback((nextState: DirectoryAutocompleteState | null) => {
    directoryAutocompleteStateRef.current = nextState;
    applyDirectoryAutocompleteGhost(nextState);
    onDirectoryAutocompleteChangeRef.current?.(nextState);
  }, [applyDirectoryAutocompleteGhost]);

  const getVisualTraceAutoTagMatches = useCallback((activeEditor: Editor, scope: "block" | "document"): readonly VisualTraceAutoTagPendingMatch[] => {
    const mentionType = activeEditor.schema.nodes.mention;
    if (!enableVisualTraceAutoTagging || !activeEditor.isEditable || !mentionType) {
      return [];
    }

    const block = scope === "document"
      ? getVisualTraceDocumentText(activeEditor)
      : getCurrentVisualTraceBlockText(activeEditor);
    // Skip occurrences the user explicitly reverted in this draft (Backspace or the
    // chip's swap control), so an un-tagged word doesn't get re-converted moments
    // later. Keyed by the exact matched text, lowercased — matching the dismissal
    // recorded by `restoreAutoTaggedMention`.
    const dismissed = getDismissedAutoTags(activeEditor);
    const matches = getDirectoryAutocompleteExactLabelMatches({
      sources: mentionSourcesRef.current,
      suppressTrailingPrefixMatches: scope === "block",
      text: block.text,
    }).filter((match) => !dismissed?.has(block.text.slice(match.from, match.to).toLowerCase()));
    if (matches.length === 0) {
      return [];
    }

    return matches.flatMap((match, index): VisualTraceAutoTagPendingMatch[] => {
      const range = getVisualTraceDocRange(block, match);
      const traceRange = getVisualTraceDocTraceRange(block, match);
      if (!range || !traceRange) {
        return [];
      }

      const currentText = activeEditor.state.doc.textBetween(
        range.from,
        range.to,
        "\n",
        VISUAL_TRACE_OBJECT_REPLACEMENT
      );
      const expectedText = block.text.slice(match.from, match.to);
      if (
        currentText.includes(VISUAL_TRACE_OBJECT_REPLACEMENT) ||
        currentText.toLowerCase() !== expectedText.toLowerCase()
      ) {
        return [];
      }

      return [{
        expectedText,
        from: range.from,
        id: `visual-trace-auto-tag-${visualTraceGenerationRef.current}-${index}`,
        label: match.label,
        match,
        to: range.to,
        traceFrom: traceRange.from,
        traceText: block.text.slice(match.from, match.to),
        traceTo: traceRange.to,
      }];
    });
  }, [enableVisualTraceAutoTagging]);

  const convertVisualTraceAutoTagMatches = useCallback((activeEditor: Editor, pendingMatches: readonly VisualTraceAutoTagPendingMatch[]): boolean => {
    const mentionType = activeEditor.schema.nodes.mention;
    if (!mentionType || pendingMatches.length === 0) {
      return false;
    }

    let transaction = activeEditor.state.tr;
    for (const pendingMatch of [...pendingMatches].sort((a, b) => b.from - a.from)) {
      const currentText = transaction.doc.textBetween(
        pendingMatch.from,
        pendingMatch.to,
        "\n",
        VISUAL_TRACE_OBJECT_REPLACEMENT
      );
      if (
        currentText.includes(VISUAL_TRACE_OBJECT_REPLACEMENT) ||
        currentText.toLowerCase() !== pendingMatch.expectedText.toLowerCase()
      ) {
        continue;
      }

      const nodeAfter = transaction.doc.resolve(pendingMatch.to).nodeAfter;
      const textAfter = nodeAfter?.isText ? nodeAfter.text?.charAt(0) : undefined;
      const shouldInsertTrailingSpace = textAfter === undefined;
      // Stamp the exact typed text on the node so a later revert (Backspace at the
      // caret, or the chip's swap control) restores precisely what was typed. Only
      // this auto-tag path sets `sourceText`; deliberate `@`/`/` mentions leave it
      // null, which is what scopes the revert affordances to auto-tagged tokens.
      const mentionAttrs = {
        ...getMentionNodeAttrs(pendingMatch.match.mention),
        sourceText: pendingMatch.expectedText,
      };
      const replacement = shouldInsertTrailingSpace
        ? [
            mentionType.create(mentionAttrs),
            transaction.doc.type.schema.text(" "),
          ]
        : mentionType.create(mentionAttrs);

      transaction = transaction.replaceWith(
        pendingMatch.from,
        pendingMatch.to,
        replacement,
      );
    }

    if (!transaction.docChanged) {
      return false;
    }
    visualTraceApplyingRef.current = true;
    try {
      activeEditor.view.dispatch(transaction);
      clearComposerTraceDecorations(activeEditor.view);
    } finally {
      visualTraceApplyingRef.current = false;
    }
    return true;
  }, []);

  const restoreVisualTraceUndoSnapshot = useCallback((activeEditor: Editor, snapshot: VisualTraceAutoTagUndoSnapshot): boolean => {
    if (serializeComposerDoc(activeEditor) !== snapshot.afterText) {
      return false;
    }

    visualTraceUndoSnapshotRef.current = null;
    visualTraceApplyingRef.current = true;
    try {
      activeEditor.commands.setContent(snapshot.beforeJSON, {
        emitUpdate: false,
      });
      activeEditor.commands.setTextSelection(activeEditor.state.doc.content.size);
      clearComposerTraceDecorations(activeEditor.view);
      publishText(snapshot.beforeText, activeEditor.view.dom, true);
    } finally {
      visualTraceApplyingRef.current = false;
    }
    return true;
  }, [publishText]);

  const clearPendingVisualTraceAutoTagging = useCallback(() => {
    visualTraceGenerationRef.current += 1;
    visualTracePendingRef.current = false;
    visualTracePendingMatchesRef.current = [];
    for (const timeout of visualTraceTimeoutsRef.current) {
      clearTimeout(timeout);
    }
    visualTraceTimeoutsRef.current = [];
    const activeEditor = activeEditorRef.current;
    if (activeEditor) {
      clearComposerTraceDecorations(activeEditor.view);
    }
  }, []);

  const isAnySuggestionMenuOpen = useCallback((activeEditor: Editor): boolean => {
    for (const plugin of activeEditor.view.state.plugins) {
      const pluginState = plugin.getState(activeEditor.view.state) as
        | { active?: boolean; query?: unknown; range?: unknown }
        | undefined;
      if (pluginState?.active === true && "query" in pluginState && "range" in pluginState) {
        return true;
      }
    }

    return false;
  }, []);

  const refreshDirectoryAutocomplete = useCallback((activeEditor: Editor) => {
    if (
      !enableDirectoryAutocomplete ||
      !activeEditor.isEditable ||
      visualTracePendingRef.current ||
      visualTracePendingMatchesRef.current.length > 0 ||
      visualTraceApplyingRef.current
    ) {
      setDirectoryAutocompleteState(null);
      return;
    }

    const { selection } = activeEditor.state;
    if (activeEditor.view.composing || !selection.empty || isAnySuggestionMenuOpen(activeEditor)) {
      setDirectoryAutocompleteState(null);
      return;
    }

    const textBeforeCursor = selection.$from.parent.textBetween(
      0,
      selection.$from.parentOffset,
      "\n",
      "\uFFFC"
    );
    const nextState = getDirectoryAutocompleteState({
      activeIndex: directoryAutocompleteStateRef.current?.activeIndex ?? 0,
      cursorPosition: selection.from,
      sources: mentionSourcesRef.current,
      textBeforeCursor,
    });
    setDirectoryAutocompleteState(nextState);
  }, [enableDirectoryAutocomplete, isAnySuggestionMenuOpen, setDirectoryAutocompleteState]);

  const runVisualTraceAutoTagging = useCallback((activeEditor: Editor, generation: number, scope: "block" | "document"): boolean => {
    if (generation !== visualTraceGenerationRef.current) {
      return false;
    }

    visualTracePendingRef.current = false;
    setDirectoryAutocompleteState(null);

    const pendingMatches = getVisualTraceAutoTagMatches(activeEditor, scope);
    if (pendingMatches.length === 0) {
      visualTracePendingMatchesRef.current = [];
      clearComposerTraceDecorations(activeEditor.view);
      refreshDirectoryAutocomplete(activeEditor);
      return false;
    }

    visualTracePendingRef.current = true;
    visualTracePendingMatchesRef.current = pendingMatches;
    const undoBaseline = {
      beforeJSON: activeEditor.getJSON(),
      beforeText: serializeComposerDoc(activeEditor),
    };
    let convertedAny = false;
    const reducedMotion = typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
    const decorations: ComposerTraceDecoration[] = pendingMatches.map((pendingMatch, index) => ({
      from: pendingMatch.traceFrom,
      id: pendingMatch.id,
      label: pendingMatch.traceText,
      motion: reducedMotion ? "static" : "active",
      pending: index > 0,
      to: pendingMatch.traceTo,
    }));
    setComposerTraceDecorations(activeEditor.view, decorations);

    const conversionOrder = [...pendingMatches].sort((a, b) => b.from - a.from);
    conversionOrder.forEach((pendingMatch, index) => {
      const timeout = setTimeout(() => {
        if (generation !== visualTraceGenerationRef.current) {
          return;
        }

        const converted = convertVisualTraceAutoTagMatches(activeEditor, [pendingMatch]);
        convertedAny = convertedAny || converted;
        visualTracePendingMatchesRef.current = visualTracePendingMatchesRef.current.filter((match) => match.id !== pendingMatch.id);
        const remainingDecorations = visualTracePendingMatchesRef.current.map((match, remainingIndex) => ({
          from: match.traceFrom,
          id: match.id,
          label: match.traceText,
          motion: reducedMotion ? "static" : "active",
          pending: remainingIndex > 0,
          to: match.traceTo,
        } satisfies ComposerTraceDecoration));
        if (remainingDecorations.length > 0) {
          setComposerTraceDecorations(activeEditor.view, remainingDecorations);
        } else {
          visualTracePendingRef.current = false;
          clearComposerTraceDecorations(activeEditor.view);
          if (convertedAny) {
            visualTraceUndoSnapshotRef.current = {
              ...undoBaseline,
              afterText: serializeComposerDoc(activeEditor),
            };
          }
          refreshDirectoryAutocomplete(activeEditor);
        }
        if (converted) {
          publishText(serializeComposerDoc(activeEditor), activeEditor.view.dom, true);
        }
      }, index * VISUAL_TRACE_AUTO_TAG_STAGGER_MS + VISUAL_TRACE_AUTO_TAG_CONVERT_MS);
      visualTraceTimeoutsRef.current.push(timeout);
    });

    return true;
  }, [convertVisualTraceAutoTagMatches, getVisualTraceAutoTagMatches, publishText, refreshDirectoryAutocomplete, setDirectoryAutocompleteState]);

  const flushVisualTraceAutoTagging = useCallback((activeEditor: Editor | null = activeEditorRef.current): boolean => {
    if (!enableVisualTraceAutoTagging || !activeEditor) {
      return false;
    }

    clearPendingVisualTraceAutoTagging();
    const undoBaseline = {
      beforeJSON: activeEditor.getJSON(),
      beforeText: serializeComposerDoc(activeEditor),
    };
    const pendingMatches = getVisualTraceAutoTagMatches(activeEditor, "document");
    const converted = convertVisualTraceAutoTagMatches(activeEditor, pendingMatches);
    if (converted) {
      visualTraceUndoSnapshotRef.current = {
        ...undoBaseline,
        afterText: serializeComposerDoc(activeEditor),
      };
      publishText(serializeComposerDoc(activeEditor), activeEditor.view.dom, true);
    }
    return converted;
  }, [clearPendingVisualTraceAutoTagging, convertVisualTraceAutoTagMatches, enableVisualTraceAutoTagging, getVisualTraceAutoTagMatches, publishText]);

  const scheduleVisualTraceAutoTagging = useCallback((activeEditor: Editor, immediate: boolean) => {
    if (!enableVisualTraceAutoTagging) {
      return;
    }

    clearPendingVisualTraceAutoTagging();
    visualTracePendingRef.current = true;
    setDirectoryAutocompleteState(null);

    const generation = visualTraceGenerationRef.current;
    const delay = immediate ? 0 : VISUAL_TRACE_AUTO_TAG_TYPED_IDLE_MS;
    const timeout = setTimeout(() => {
      runVisualTraceAutoTagging(activeEditor, generation, immediate ? "document" : "block");
    }, delay);
    visualTraceTimeoutsRef.current = [timeout];
  }, [clearPendingVisualTraceAutoTagging, enableVisualTraceAutoTagging, runVisualTraceAutoTagging, setDirectoryAutocompleteState]);

  acceptDirectoryAutocompleteIndexRef.current = (index: number, requireGhost = false): boolean => {
    const activeEditor = activeEditorRef.current;
    const currentState = directoryAutocompleteStateRef.current;
    if (!activeEditor || !currentState) {
      return false;
    }
    if (requireGhost && !currentState.ghostText) {
      return false;
    }

    const match = currentState.matches[index];
    if (!match) {
      return false;
    }

    activeEditor
      .chain()
      .focus()
      .insertContentAt(
        { from: currentState.queryFrom, to: currentState.queryTo },
        [
          {
            type: "mention",
            attrs: getMentionNodeAttrs(match.mention),
          },
          { type: "text", text: " " },
        ]
      )
      .run();
    setDirectoryAutocompleteState(null);
    return true;
  };

  moveDirectoryAutocompleteActiveRef.current = (direction: -1 | 1): boolean => {
    const currentState = directoryAutocompleteStateRef.current;
    if (!currentState || currentState.matches.length === 0) {
      return false;
    }

    const nextIndex = (currentState.activeIndex + direction + currentState.matches.length) %
      currentState.matches.length;
    setDirectoryAutocompleteState({
      ...currentState,
      activeIndex: nextIndex,
    });
    return true;
  };

  setDirectoryAutocompleteActiveIndexRef.current = (index: number): boolean => {
    const currentState = directoryAutocompleteStateRef.current;
    if (!currentState || index < 0 || index >= currentState.matches.length) {
      return false;
    }
    setDirectoryAutocompleteState({
      ...currentState,
      activeIndex: index,
    });
    return true;
  };

  // Plain Enter (menu closed, no IME) submits the host form unless its submit
  // button is disabled. Returns true to consume the keystroke.
  const handleEnterSubmit = useCallback((view: { dom: HTMLElement }) => {
    flushVisualTraceAutoTagging();

    const form = view.dom.closest("form");
    if (!form) {
      return false;
    }

    const submitButton = form.querySelector(
      'button[type="submit"]'
    ) as HTMLButtonElement | null;
    if (submitButton?.disabled) {
      // Swallow Enter so a disabled composer doesn't insert a newline either.
      return true;
    }

    form.requestSubmit();
    return true;
  }, [flushVisualTraceAutoTagging]);

  const extensions = useMemo(
    () =>
      createComposerEditorExtensions({
        directoryAutocomplete: directoryAutocompleteController,
        getMentionSources: () => mentionSourcesRef.current,
        onEnter: handleEnterSubmit,
        onPasteFiles: (files) => attachmentsRef.current.add(files),
      }),
    [directoryAutocompleteController, handleEnterSubmit]
  );

  const editor = useEditor({
    extensions,
    immediatelyRender: false,
    editable: !disabled,
    autofocus: autoFocus ? "end" : false,
    editorProps: {
      attributes: {
        "aria-label": ariaLabel ?? "Message",
        class: cn(
          "prompt-input-composer max-h-48 min-h-16 w-full overflow-y-auto px-0 py-2 outline-none",
          className
        ),
        ...(disabled ? { "aria-disabled": "true" } : {}),
      },
    },
    onCreate: ({ editor: activeEditor }) => {
      activeEditorRef.current = activeEditor;
      const initial = controllerRef.current
        ? controllerRef.current.textInput.value
        : normalizedValueProp;
      if (initial) {
        setComposerPlainText(activeEditor, initial);
      }
      publishText(serializeComposerDoc(activeEditor), activeEditor.view.dom, false);
      if (enableVisualTraceAutoTagging && initial) {
        scheduleVisualTraceAutoTagging(activeEditor, true);
      } else {
        refreshDirectoryAutocomplete(activeEditor);
      }
      onEditorReadyRef.current?.(activeEditor);
    },
    onSelectionUpdate: ({ editor: activeEditor }) => {
      refreshDirectoryAutocomplete(activeEditor);
    },
    onUpdate: ({ editor: activeEditor }) => {
      publishText(serializeComposerDoc(activeEditor), activeEditor.view.dom, true);
      if (visualTraceApplyingRef.current) {
        setDirectoryAutocompleteState(null);
        return;
      }
      if (enableVisualTraceAutoTagging) {
        const immediate = visualTraceImmediateUpdateRef.current;
        visualTraceImmediateUpdateRef.current = false;
        scheduleVisualTraceAutoTagging(activeEditor, immediate);
        return;
      }
      refreshDirectoryAutocomplete(activeEditor);
    },
  });

  useEffect(() => {
    onDirectoryAutocompleteControllerChangeRef.current?.(directoryAutocompleteController);
    return () => {
      onDirectoryAutocompleteControllerChangeRef.current?.(null);
    };
  }, [directoryAutocompleteController]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    activeEditorRef.current = editor;
    refreshDirectoryAutocomplete(editor);
    return () => {
      if (activeEditorRef.current === editor) {
        activeEditorRef.current = null;
      }
      setDirectoryAutocompleteState(null);
    };
  }, [editor, refreshDirectoryAutocomplete, setDirectoryAutocompleteState]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    composerScrollOverflowRef(editor.view.dom);
    return () => {
      composerScrollOverflowRef(null);
    };
  }, [composerScrollOverflowRef, editor]);

  useEffect(() => {
    if (!editor || !enableVisualTraceAutoTagging) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Backspace next to an auto-tagged token un-tags it back to the exact text
      // that was typed (instead of the mention extension's default
      // delete-and-reinsert-"@"). Scoped to auto-tagged nodes via `sourceText`;
      // deliberate `@`/`/` mentions fall through to the default behavior.
      const backspaceRevertPos =
        event.key === "Backspace" && !event.metaKey && !event.ctrlKey && !event.altKey
          ? getBackspaceRevertPos(editor)
          : null;
      if (backspaceRevertPos !== null && editor.commands.restoreAutoTaggedMention(backspaceRevertPos)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      const snapshot = visualTraceUndoSnapshotRef.current;
      if (
        !snapshot ||
        event.key.toLowerCase() !== "z" ||
        event.shiftKey ||
        !(event.metaKey || event.ctrlKey)
      ) {
        return;
      }

      if (restoreVisualTraceUndoSnapshot(editor, snapshot)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const handlePaste = () => {
      visualTraceImmediateUpdateRef.current = true;
    };
    const handleSubmit = () => {
      flushVisualTraceAutoTagging(editor);
    };
    const form = editor.view.dom.closest("form");

    editor.view.dom.addEventListener("keydown", handleKeyDown, { capture: true });
    editor.view.dom.addEventListener("paste", handlePaste, { capture: true });
    form?.addEventListener("submit", handleSubmit, { capture: true });
    return () => {
      editor.view.dom.removeEventListener("keydown", handleKeyDown, { capture: true });
      editor.view.dom.removeEventListener("paste", handlePaste, { capture: true });
      form?.removeEventListener("submit", handleSubmit, { capture: true });
    };
  }, [editor, enableVisualTraceAutoTagging, flushVisualTraceAutoTagging, restoreVisualTraceUndoSnapshot]);

  useEffect(() => () => {
    clearPendingVisualTraceAutoTagging();
  }, [clearPendingVisualTraceAutoTagging]);

  // Forward the ref to the contentEditable DOM (escape hatch for consumers that
  // previously held a textarea ref to call .focus()/measure).
  useEffect(() => {
    if (!editor) {
      return;
    }
    const node = editor.view.dom as unknown as HTMLTextAreaElement;

    if (typeof forwardedRef === "function") {
      forwardedRef(node);
    } else if (forwardedRef && typeof forwardedRef === "object") {
      forwardedRef.current = node;
    }

    return () => {
      if (typeof forwardedRef === "function") {
        forwardedRef(null);
      } else if (forwardedRef && typeof forwardedRef === "object") {
        forwardedRef.current = null;
      }
    };
  }, [editor, forwardedRef]);

  // Keep editable state in sync with the disabled prop.
  useEffect(() => {
    if (editor && editor.isEditable === Boolean(disabled)) {
      editor.setEditable(!disabled);
      refreshDirectoryAutocomplete(editor);
    }
  }, [editor, disabled, refreshDirectoryAutocomplete]);

  // Truly-uncontrolled demos (no `value`/controller) clear the composer via the
  // host form's reset() after submit. The contentEditable isn't a native form
  // control, so mirror that reset here by clearing the editor on form reset.
  useEffect(() => {
    if (!editor) {
      return;
    }
    const form = editor.view.dom.closest("form");
    if (!form) {
      return;
    }

    const handleReset = () => {
      visualTraceUndoSnapshotRef.current = null;
      getDismissedAutoTags(editor)?.clear();
      setComposerPlainText(editor, "");
      publishText("", editor.view.dom, false);
      setDirectoryAutocompleteState(null);
    };
    form.addEventListener("reset", handleReset);
    return () => {
      form.removeEventListener("reset", handleReset);
    };
  }, [editor, publishText, setDirectoryAutocompleteState]);

  // Sync external value (controller or controlled `value` prop) into the editor.
  // Compares against the serialized text so prefill/clear/setInput apply, while
  // a user's own keystrokes (already serialized) don't loop back through here.
  const resolvedValue = controller ? controller.textInput.value : normalizedValueProp;

  useEffect(() => {
    if (!editor || resolvedValue === undefined || resolvedValue === null) {
      return;
    }

    if (serializeComposerDoc(editor) === resolvedValue) {
      return;
    }

    setComposerPlainText(editor, resolvedValue);
    visualTraceUndoSnapshotRef.current = null;
    getDismissedAutoTags(editor)?.clear();
    publishText(serializeComposerDoc(editor), editor.view.dom, false);
    if (enableVisualTraceAutoTagging) {
      scheduleVisualTraceAutoTagging(editor, true);
    } else {
      refreshDirectoryAutocomplete(editor);
    }
  }, [editor, enableVisualTraceAutoTagging, refreshDirectoryAutocomplete, resolvedValue, publishText, scheduleVisualTraceAutoTagging]);

  // Backspace on an empty composer removes the last attachment, matching the
  // previous textarea behavior.
  const handleContainerKeyDown: KeyboardEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      if (
        event.key === "Backspace" &&
        domEmpty &&
        attachmentsRef.current.files.length > 0
      ) {
        event.preventDefault();
        const lastAttachment = attachmentsRef.current.files.at(-1);
        if (lastAttachment) {
          attachmentsRef.current.remove(lastAttachment.id);
        }
      }
    },
    [domEmpty]
  );

  const showOverlayPlaceholder = domEmpty && Boolean(placeholder);

  return (
    <div className="relative flex min-w-0 flex-1 self-stretch">
      <div
        data-slot="input-group-control-container"
        className="flex min-w-0 flex-1 self-stretch cursor-text px-2.5 has-disabled:cursor-not-allowed"
        onClick={() => editor?.commands.focus()}
        onKeyDownCapture={handleContainerKeyDown}
        // Pass through residual layout attributes (id, data-*, style). Textarea-
        // only handlers were destructured out above; cast bridges the textarea
        // prop type to this container <div>.
        {...(props as HTMLAttributes<HTMLDivElement>)}
      >
        <EditorContent
          editor={editor}
          className={cn(
            "min-w-0 flex-1 self-stretch",
            showComposerTopScrollMask &&
              !showComposerBottomScrollMask &&
              "scroll-mask-top",
            showComposerBottomScrollMask &&
              !showComposerTopScrollMask &&
              "scroll-mask-bottom",
            (showComposerTopScrollMask ||
              showComposerBottomScrollMask) &&
              "overscroll-contain"
          )}
          style={
            showComposerTopScrollMask &&
            showComposerBottomScrollMask
              ? composerScrollMaskStyle
              : undefined
          }
        />
      </div>
      {/* Hidden input keeps FormData.get("message") working for demos that read
          the submitted text from the form rather than the controller. */}
      <input ref={hiddenInputRef} type="hidden" name={name} data-slot="prompt-input-message" />
      {showOverlayPlaceholder ? (
        <span
          aria-hidden="true"
          data-slot="prompt-input-placeholder"
          className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center px-2.5 text-sm text-text-subtlest"
        >
          <span className="block w-full overflow-hidden text-ellipsis whitespace-nowrap">
            {placeholder}
          </span>
        </span>
      ) : null}
    </div>
  );
};

export type PromptInputHeaderProps = Omit<
  ComponentProps<typeof InputGroupAddon>,
  "align"
>;

export const PromptInputHeader = ({
  className,
  ...props
}: Readonly<PromptInputHeaderProps>) => (
  <InputGroupAddon
    align="block-end"
    className={cn("order-first flex-wrap gap-1", className)}
    {...props}
  />
);

export type PromptInputFooterProps = Omit<
  ComponentProps<typeof InputGroupAddon>,
  "align"
>;

export const PromptInputFooter = ({
  className,
  ...props
}: Readonly<PromptInputFooterProps>) => (
  <InputGroupAddon
    align="block-end"
    className={cn("justify-between gap-1", className)}
    {...props}
  />
);

export type PromptInputToolsProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputTools = ({
  className,
  ...props
}: Readonly<PromptInputToolsProps>) => (
  <div
    className={cn("flex min-w-0 items-center gap-1", className)}
    {...props}
  />
);

export type PromptInputAutoButtonProps = PromptInputButtonProps;

export const PromptInputAutoButton = ({
  children,
  className,
  size = "sm",
  variant = "ghost",
  ...props
}: Readonly<PromptInputAutoButtonProps>) => (
  <PromptInputButton
    className={cn("min-w-[78px]", className)}
    size={size}
    variant={variant}
    {...props}
  >
    {children ?? (
      <>
        <RandomizeIcon label="" />
        <span>Auto</span>
      </>
    )}
  </PromptInputButton>
);

export type PromptInputSendControlsProps = HTMLAttributes<HTMLDivElement> & {
  autoButtonProps?: PromptInputAutoButtonProps;
  submitProps?: PromptInputSubmitProps;
};

export const PromptInputSendControls = ({
  autoButtonProps = {},
  className,
  submitProps = {},
  ...props
}: Readonly<PromptInputSendControlsProps>) => {
  const { children: autoChildren, ...resolvedAutoButtonProps } = autoButtonProps;
  const { children: submitChildren, ...resolvedSubmitProps } = submitProps;

  return (
    <div className={cn("flex shrink-0 items-center gap-1", className)} {...props}>
      <PromptInputAutoButton {...resolvedAutoButtonProps}>
        {autoChildren}
      </PromptInputAutoButton>
      <PromptInputSubmit {...resolvedSubmitProps}>
        {submitChildren ?? <ArrowUpIcon className="size-4" />}
      </PromptInputSubmit>
    </div>
  );
};

export type PromptInputButtonTooltip =
  | string
  | {
      content: ReactNode;
      shortcut?: string;
      side?: ComponentProps<typeof TooltipContent>["side"];
      delay?: number;
    };

export type PromptInputButtonProps = ComponentProps<typeof InputGroupButton> & {
  tooltip?: PromptInputButtonTooltip;
};

const PROMPT_INPUT_PREFERENCE_SOURCES = [
  {
    src: "/3p/google-drive/16.svg",
    label: "Google Drive",
  },
  {
    src: "/3p/microsoft-teams/16.svg",
    label: "Microsoft Teams",
  },
] as const;

export const PromptInputButton = ({
  variant = "ghost",
  className,
  size,
  tooltip,
  ...props
}: Readonly<PromptInputButtonProps>) => {
  const newSize =
    size ?? (Children.count(props.children) > 1 ? "sm" : "icon-sm");

  const button = (
    <InputGroupButton
      className={cn(className)}
      size={newSize}
      type="button"
      variant={variant}
      {...props}
    />
  );

  if (!tooltip) {
    return button;
  }

  const tooltipContent =
    typeof tooltip === "string" ? tooltip : tooltip.content;
  const shortcut = typeof tooltip === "string" ? undefined : tooltip.shortcut;
  const side = typeof tooltip === "string" ? "top" : (tooltip.side ?? "top");
  const delay = typeof tooltip === "string" ? undefined : tooltip.delay;

  const tooltipElement = (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent side={side}>
        {tooltipContent}
        {shortcut && (
          <span className="ml-2 text-muted-foreground">{shortcut}</span>
        )}
      </TooltipContent>
    </Tooltip>
  );

  if (delay != null) {
    return <TooltipProvider delay={delay}>{tooltipElement}</TooltipProvider>;
  }

  return tooltipElement;
};

export type PromptInputPreferencesButtonProps = Omit<
  PromptInputButtonProps,
  "children" | "size"
> & {
  overflowCount?: number;
};

export const PromptInputPreferencesButton = ({
  "aria-label": ariaLabel = "Customize",
  className,
  overflowCount = 5,
  variant = "ghost",
  ...props
}: Readonly<PromptInputPreferencesButtonProps>) => (
  <PromptInputButton
    aria-label={ariaLabel}
    className={cn(
      "h-8 w-[110px] min-w-[110px] gap-1 rounded-lg px-3 text-text hover:text-text",
      className
    )}
    size="sm"
    type="button"
    variant={variant}
    {...props}
  >
    {PROMPT_INPUT_PREFERENCE_SOURCES.map((source) => (
      <Image
        alt=""
        aria-hidden
        className="size-4 shrink-0 object-contain"
        height={16}
        key={source.label}
        src={resolveBrandLogoPresentation(source.src).src}
        width={16}
      />
    ))}
    <span aria-hidden className="inline-flex size-4 shrink-0 items-center justify-center rounded bg-primary">
      <Image
        alt=""
        aria-hidden
        className="size-3 invert"
        height={12}
        src="/brand-icons/teams.svg"
        width={12}
      />
    </span>
    <Badge
      aria-hidden
      className="pointer-events-none h-4 min-w-0 rounded-xs bg-surface-pressed px-1.5 text-xs font-normal leading-4 text-text hover:bg-surface-pressed active:bg-surface-pressed"
      max={false}
      variant="neutral"
    >
      +{overflowCount}
    </Badge>
  </PromptInputButton>
);

export type PromptInputActionMenuProps = ComponentProps<typeof DropdownMenu>;
export const PromptInputActionMenu = (props: Readonly<PromptInputActionMenuProps>) => (
  <DropdownMenu {...props} />
);

export type PromptInputActionMenuTriggerProps = PromptInputButtonProps;

export const PromptInputActionMenuTrigger = ({
  className,
  children,
  ...props
}: Readonly<PromptInputActionMenuTriggerProps>) => (
  <DropdownMenuTrigger render={<PromptInputButton className={className} {...props} />}>{children ?? <PlusIcon className="size-4" />}</DropdownMenuTrigger>
);

export type PromptInputActionMenuContentProps = ComponentProps<
  typeof DropdownMenuContent
>;
export const PromptInputActionMenuContent = ({
  className,
  ...props
}: Readonly<PromptInputActionMenuContentProps>) => (
  <DropdownMenuContent
    align="start"
    className={cn("w-auto min-w-[200px] p-1", className)}
    {...props}
  />
);

export type PromptInputActionMenuItemProps = ComponentProps<
  typeof DropdownMenuItem
>;
export const PromptInputActionMenuItem = ({
  className,
  ...props
}: Readonly<PromptInputActionMenuItemProps>) => (
  <DropdownMenuItem className={cn(className)} {...props} />
);

// Note: Actions that perform side-effects (like opening a file dialog)
// are provided in opt-in modules (e.g., prompt-input-attachments).

export type PromptInputMicrophoneProps = ComponentProps<typeof InputGroupButton>;

export const PromptInputMicrophone = ({
  className,
  variant = "ghost",
  size = "icon-sm",
  children,
  ...props
}: Readonly<PromptInputMicrophoneProps>) => {
  return (
    <InputGroupButton
      aria-label="Voice"
      className={cn(className)}
      size={size}
      type="button"
      variant={variant}
      {...props}
    >
      {children ?? <MicIcon className="size-4" />}
    </InputGroupButton>
  );
};

export type PromptInputSubmitProps = ComponentProps<typeof InputGroupButton> & {
  status?: ChatStatus;
  onStop?: () => void;
};

export const PromptInputSubmit = ({
  className,
  variant = "default",
  size = "icon-sm",
  status,
  onStop,
  onClick,
  disabled,
  children,
  ...props
}: Readonly<PromptInputSubmitProps>) => {
  const isGenerating = status === "submitted" || status === "streaming";
  const canStopGeneration = isGenerating && Boolean(onStop);
  const shouldUseStatusIcon =
    status === "submitted" || status === "streaming" || status === "error";
  const resolvedVariant = canStopGeneration ? "outline" : variant;
  const stateClassName = canStopGeneration
    ? "border-border bg-surface-raised text-icon-danger hover:bg-bg-neutral-hovered active:bg-bg-neutral-pressed"
    : undefined;

  let Icon = <ArrowUpIcon className="size-4" />;

  if (status === "submitted" || status === "streaming") {
    Icon = <span aria-hidden className="size-3 rounded-[2px] bg-current" />;
  } else if (status === "error") {
    Icon = <XIcon className="size-4" />;
  }

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (canStopGeneration && onStop) {
        e.preventDefault();
        onStop();
        return;
      }
      onClick?.(e as React.MouseEvent<HTMLButtonElement> & { preventBaseUIHandler: () => void });
    },
    [canStopGeneration, onStop, onClick]
  );

  return (
    <InputGroupButton
      aria-label={isGenerating ? "Stop" : "Submit"}
      className={cn(stateClassName, className)}
      disabled={canStopGeneration ? false : disabled}
      onClick={handleClick}
      size={size}
      type={canStopGeneration ? "button" : "submit"}
      variant={resolvedVariant}
      {...props}
    >
      {shouldUseStatusIcon ? Icon : children ?? Icon}
    </InputGroupButton>
  );
};

export type PromptInputSelectProps = ComponentProps<typeof Select>;

export const PromptInputSelect = (props: Readonly<PromptInputSelectProps>) => (
  <Select {...props} />
);

export type PromptInputSelectTriggerProps = ComponentProps<
  typeof SelectTrigger
>;

export const PromptInputSelectTrigger = ({
  className,
  ...props
}: Readonly<PromptInputSelectTriggerProps>) => (
  <SelectTrigger
    className={cn(
      "border-none bg-transparent font-medium text-muted-foreground shadow-none transition-colors",
      "hover:bg-accent hover:text-foreground aria-expanded:bg-accent aria-expanded:text-foreground",
      className
    )}
    {...props}
  />
);

export type PromptInputSelectContentProps = ComponentProps<
  typeof SelectContent
>;

export const PromptInputSelectContent = ({
  className,
  ...props
}: Readonly<PromptInputSelectContentProps>) => (
  <SelectContent className={cn(className)} {...props} />
);

export type PromptInputSelectItemProps = ComponentProps<typeof SelectItem>;

export const PromptInputSelectItem = ({
  className,
  ...props
}: Readonly<PromptInputSelectItemProps>) => (
  <SelectItem className={cn(className)} {...props} />
);

export type PromptInputSelectValueProps = ComponentProps<typeof SelectValue>;

export const PromptInputSelectValue = ({
  className,
  ...props
}: Readonly<PromptInputSelectValueProps>) => (
  <SelectValue className={cn(className)} {...props} />
);

export type PromptInputHoverCardProps = ComponentProps<typeof HoverCard>;

export const PromptInputHoverCard = ({
  openDelay = 0,
  closeDelay = 0,
  ...props
}: Readonly<PromptInputHoverCardProps>) => (
  <HoverCard closeDelay={closeDelay} openDelay={openDelay} {...props} />
);

export type PromptInputHoverCardTriggerProps = ComponentProps<
  typeof HoverCardTrigger
>;

export const PromptInputHoverCardTrigger = (
  props: Readonly<PromptInputHoverCardTriggerProps>
) => <HoverCardTrigger {...props} />;

export type PromptInputHoverCardContentProps = ComponentProps<
  typeof HoverCardContent
>;

export const PromptInputHoverCardContent = ({
  align = "start",
  ...props
}: Readonly<PromptInputHoverCardContentProps>) => (
  <HoverCardContent align={align} {...props} />
);

export type PromptInputTabsListProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputTabsList = ({
  className,
  ...props
}: Readonly<PromptInputTabsListProps>) => <div className={cn(className)} {...props} />;

export type PromptInputTabProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputTab = ({
  className,
  ...props
}: Readonly<PromptInputTabProps>) => <div className={cn(className)} {...props} />;

export type PromptInputTabLabelProps = HTMLAttributes<HTMLHeadingElement>;

export const PromptInputTabLabel = ({
  className,
  ...props
}: Readonly<PromptInputTabLabelProps>) => (
  // Content provided via children in props
  // oxlint-disable-next-line eslint-plugin-jsx-a11y(heading-has-content)
  <h3
    className={cn(
      "mb-2 px-3 font-medium text-muted-foreground text-xs",
      className
    )}
    {...props}
  />
);

export type PromptInputTabBodyProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputTabBody = ({
  className,
  ...props
}: Readonly<PromptInputTabBodyProps>) => (
  <div className={cn("space-y-1", className)} {...props} />
);

export type PromptInputTabItemProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputTabItem = ({
  className,
  ...props
}: Readonly<PromptInputTabItemProps>) => (
  <div
    className={cn(
      "flex items-center gap-2 px-3 py-2 text-xs hover:bg-accent",
      className
    )}
    {...props}
  />
);

export type PromptInputCommandProps = ComponentProps<typeof Command>;

export const PromptInputCommand = ({
  className,
  ...props
}: Readonly<PromptInputCommandProps>) => <Command className={cn(className)} {...props} />;

export type PromptInputCommandInputProps = ComponentProps<typeof CommandInput>;

export const PromptInputCommandInput = ({
  className,
  ...props
}: Readonly<PromptInputCommandInputProps>) => (
  <CommandInput className={cn(className)} {...props} />
);

export type PromptInputCommandListProps = ComponentProps<typeof CommandList>;

export const PromptInputCommandList = ({
  className,
  ...props
}: Readonly<PromptInputCommandListProps>) => (
  <CommandList className={cn(className)} {...props} />
);

export type PromptInputCommandEmptyProps = ComponentProps<typeof CommandEmpty>;

export const PromptInputCommandEmpty = ({
  className,
  ...props
}: Readonly<PromptInputCommandEmptyProps>) => (
  <CommandEmpty className={cn(className)} {...props} />
);

export type PromptInputCommandGroupProps = ComponentProps<typeof CommandGroup>;

export const PromptInputCommandGroup = ({
  className,
  ...props
}: Readonly<PromptInputCommandGroupProps>) => (
  <CommandGroup className={cn(className)} {...props} />
);

export type PromptInputCommandItemProps = ComponentProps<typeof CommandItem>;

export const PromptInputCommandItem = ({
  className,
  ...props
}: Readonly<PromptInputCommandItemProps>) => (
  <CommandItem className={cn(className)} {...props} />
);

export type PromptInputCommandSeparatorProps = ComponentProps<
  typeof CommandSeparator
>;

export const PromptInputCommandSeparator = ({
  className,
  ...props
}: Readonly<PromptInputCommandSeparatorProps>) => (
  <CommandSeparator className={cn(className)} {...props} />
);
