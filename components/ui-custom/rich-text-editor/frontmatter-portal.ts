"use client";

import { createContext } from "react";

/**
 * Portal target for the SKILL.md frontmatter card.
 *
 * When set (skill config), the frontmatter node-view renders its card into this
 * element — which the editor places ABOVE the toolbar — instead of inline as the
 * editor's first node. The node itself stays in the document, so the markdown
 * round-trip, the Markdown-source view, and save are all unchanged; only the
 * card's DOM position moves. `null` everywhere else, so the card renders inline.
 */
export const FrontmatterPortalContext = createContext<HTMLElement | null>(null);
