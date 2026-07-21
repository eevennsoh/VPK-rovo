const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const ROOT = join(__dirname, "../../..");
const readRepoFile = (path) => readFileSync(join(ROOT, path), "utf8");
const BUTTON_SOURCE = readRepoFile("components/ui-custom/rovo-sparkle/button.tsx");
const SPARKLE_SOURCE = readRepoFile("components/ui-custom/rovo-sparkle/rovo-sparkle.tsx");
const INDEX_SOURCE = readRepoFile("components/ui-custom/rovo-sparkle/index.ts");
const DEMO_SOURCE = readRepoFile("components/website/demos/ui-custom/rovo-sparkle-demo.tsx");
const DETAILS_SOURCE = readRepoFile("app/data/details/ui-custom/rovo-sparkle.ts");
const DETAILS_REGISTRY_SOURCE = readRepoFile("app/data/details/ui-custom.ts");
const COMPONENTS_SOURCE = readRepoFile("app/data/components.ts");
const MANIFEST_SOURCE = readRepoFile("app/data/component-manifest.ts");
const PRIMARY_REGISTRY_SOURCE = readRepoFile("components/website/registry/ui-custom/primary.ts");

test("Rovo Sparkle exports the composed selector and reusable button API", () => {
	assert.match(INDEX_SOURCE, /RovoSparkleButton,[\s\S]*type RovoSparkleButtonProps,[\s\S]*type RovoSparkleSize/);
	assert.match(INDEX_SOURCE, /RovoSparkle,[\s\S]*type RovoSparkleActionRequest,[\s\S]*type RovoSparkleSelectedItem/);
	assert.match(SPARKLE_SOURCE, /export type RovoSparkleActionRequest =[\s\S]*kind: "ask-rovo"; prompt: string[\s\S]*kind: "agent" \| "skill"; selectedItem: RovoSparkleSelectedItem/);
	assert.match(SPARKLE_SOURCE, /open\?: boolean;/);
	assert.match(SPARKLE_SOURCE, /defaultOpen\?: boolean;/);
	assert.match(SPARKLE_SOURCE, /triggerElement\?: ReactElement;/);
	assert.match(SPARKLE_SOURCE, /triggerPortalContainer\?: HTMLElement \| null;/);
});

test("Rovo Sparkle uses VPK button geometry and the exact four Rovo leaves", () => {
	assert.match(BUTTON_SOURCE, /export type RovoSparkleSize = "compact" \| "default";/);
	assert.match(BUTTON_SOURCE, /hideWhenSelected\?: boolean;/);
	assert.match(BUTTON_SOURCE, /size === "compact" \? "icon-compact" : "icon"/);
	assert.match(BUTTON_SOURCE, /const glyphSize = size === "compact" \? 12 : 16;/);
	assert.match(BUTTON_SOURCE, /animate=\{\{ opacity: selected \|\| colorActive \? 0 : 1 \}\}[\s\S]*fill="#FFFFFF"/);
	assert.match(BUTTON_SOURCE, /animate=\{\{ opacity: selected \? 1 : 0 \}\}[\s\S]*className="text-icon-selected!"[\s\S]*fill="currentColor"/);
	assert.match(BUTTON_SOURCE, /<motion\.path[\s\S]*fill="currentColor"/);
	assert.match(BUTTON_SOURCE, /import \{ ROVO_COLOR_SWATCHES \} from "@\/lib\/rovo-colors";/);
	assert.match(BUTTON_SOURCE, /clipPath=\{`url\(#\$\{clipId\}-top\)`\}[\s\S]*ROVO_COLOR_SWATCHES\[0\]\.hex/);
	assert.match(BUTTON_SOURCE, /clipPath=\{`url\(#\$\{clipId\}-right\)`\}[\s\S]*ROVO_COLOR_SWATCHES\[2\]\.hex/);
	assert.match(BUTTON_SOURCE, /clipPath=\{`url\(#\$\{clipId\}-bottom\)`\}[\s\S]*ROVO_COLOR_SWATCHES\[1\]\.hex/);
	assert.match(BUTTON_SOURCE, /clipPath=\{`url\(#\$\{clipId\}-left\)`\}[\s\S]*ROVO_COLOR_SWATCHES\[3\]\.hex/);
	assert.match(BUTTON_SOURCE, /selected \? "shadow-none" : "shadow-overlay"/);
	assert.match(BUTTON_SOURCE, /overflow-hidden/);
	assert.match(BUTTON_SOURCE, /selected[\s\S]*bg-bg-selected[\s\S]*group-hover\/rovo-sparkle:bg-bg-selected-hovered[\s\S]*group-active\/rovo-sparkle:bg-bg-selected-pressed/);
	assert.match(BUTTON_SOURCE, /bg-\[#292A2E\]/);
	assert.match(BUTTON_SOURCE, /group-hover\/rovo-sparkle:bg-\[#3B3D42\][\s\S]*group-active\/rovo-sparkle:bg-\[#505258\]/);
	assert.match(BUTTON_SOURCE, /const hiddenWhileSelected = hideWhenSelected && selected;/);
	assert.match(BUTTON_SOURCE, /const visuallyHidden = !visible \|\| hiddenWhileSelected;/);
	assert.match(BUTTON_SOURCE, /hiddenWhileSelected \? "pointer-events-none opacity-0" : null/);
	assert.match(BUTTON_SOURCE, /visuallyHidden \? "opacity-0 shadow-none" : null/);
	assert.match(BUTTON_SOURCE, /data-hidden-when-selected=\{hiddenWhileSelected \|\| undefined\}/);
});

test("Rovo Sparkle uses token-matched Motion transitions with reduced-motion handling", () => {
	assert.match(BUTTON_SOURCE, /import \{ motion, useReducedMotion, type Transition \} from "motion\/react";/);
	assert.match(BUTTON_SOURCE, /const SPARKLE_COLOR_ENTER: Transition = \{ duration: 0\.15, ease: \[0\.4, 1, 0\.6, 1\] \}/);
	assert.match(BUTTON_SOURCE, /const SPARKLE_COLOR_EXIT: Transition = \{ duration: 0\.25, ease: \[0\.6, 0, 0\.8, 0\.6\] \}/);
	assert.match(BUTTON_SOURCE, /const SPARKLE_VISIBILITY_EXIT: Transition = \{ duration: 0\.1, ease: \[0\.6, 0, 0\.8, 0\.6\] \}/);
	assert.match(BUTTON_SOURCE, /visible[\s\S]*\? SPARKLE_COLOR_ENTER[\s\S]*: SPARKLE_VISIBILITY_EXIT/);
	assert.match(BUTTON_SOURCE, /const SPARKLE_TRANSFORM_ENTER: Transition = \{ duration: 0\.4, ease: \[0\.4, 0, 0, 1\] \}/);
	assert.match(BUTTON_SOURCE, /const SPARKLE_TRANSFORM_EXIT: Transition = \{ duration: 0\.25, ease: \[0\.6, 0, 0\.8, 0\.6\] \}/);
	assert.match(BUTTON_SOURCE, /const SPARKLE_REDUCED: Transition = \{ duration: 0 \}/);
	assert.match(BUTTON_SOURCE, /shouldReduceMotion \|\| !active[\s\S]*"scale\(1\) rotate\(0deg\)"[\s\S]*"scale\(1\.06\) rotate\(360deg\)"/);
	assert.match(BUTTON_SOURCE, /style=\{\{ willChange: "transform" \}\}/);
	assert.match(BUTTON_SOURCE, /const colorActive = active && !selected;/);
	assert.match(BUTTON_SOURCE, /animate=\{\{ opacity: selected \|\| colorActive \? 0 : 1 \}\}/);
	assert.match(BUTTON_SOURCE, /<motion\.g[\s\S]*animate=\{\{ opacity: colorActive \? 1 : 0 \}\}/);
	assert.match(BUTTON_SOURCE, /const selected = active \|\| ariaExpanded === true \|\| ariaExpanded === "true";/);
	assert.match(BUTTON_SOURCE, /if \(selected !== previousSelected\) \{[\s\S]*if \(!selected\) \{[\s\S]*setInteractionSuppressed\(true\)/);
	assert.match(BUTTON_SOURCE, /const interactionActive = selected \|\| \(!interactionSuppressed && \(focused \|\| hovered\)\);/);
});

test("Rovo Sparkle preserves the shared selector interaction contract", () => {
	assert.match(SPARKLE_SOURCE, /const SECTION_LIMIT = 3;/);
	assert.match(SPARKLE_SOURCE, /headingLabel: "Agents"/);
	assert.match(SPARKLE_SOURCE, /headingLabel: "Skills"/);
	assert.match(SPARKLE_SOURCE, /label: "Browse all"/);
	assert.match(SPARKLE_SOURCE, /function filterItems[\s\S]*toLowerCase\(\)[\s\S]*includes\(normalizedQuery\)/);
	assert.match(SPARKLE_SOURCE, /event\.key === "ArrowDown" \|\| event\.key === "ArrowUp"/);
	assert.match(SPARKLE_SOURCE, /event\.key === "Enter" && isSelectableRow\(rows\[selectedIndex\]\)/);
	assert.match(SPARKLE_SOURCE, /autoFocus[\s\S]*label="Ask Rovo"[\s\S]*onEscape=\{\(\) => handleOpenChange\(false\)\}/);
	assert.match(SPARKLE_SOURCE, /submitRequest\(\{ kind: "ask-rovo", prompt \}\)/);
	assert.match(SPARKLE_SOURCE, /kind: agentIds\.has\(item\.id\) \? "agent" : "skill"/);
});

test("Rovo Sparkle is registered and demonstrated at both sizes", () => {
	assert.match(COMPONENTS_SOURCE, /customComponent\("rovo-sparkle", "Rovo Sparkle"\)/);
	assert.match(MANIFEST_SOURCE, /customComponent\("rovo-sparkle", "Rovo Sparkle"\)/);
	assert.match(DETAILS_REGISTRY_SOURCE, /"rovo-sparkle": ROVO_SPARKLE_DETAIL/);
	assert.match(PRIMARY_REGISTRY_SOURCE, /"rovo-sparkle": dynamic\(\(\) => import\("\.\.\/\.\.\/demos\/ui-custom\/rovo-sparkle-demo"\)/);
	assert.match(DETAILS_SOURCE, /demoSlug: "rovo-sparkle"/);
	assert.match(DEMO_SOURCE, /size="compact"/);
	assert.match(DEMO_SOURCE, /Compact · 24px/);
	assert.match(DEMO_SOURCE, /Default · 32px/);
	assert.match(DEMO_SOURCE, /<output className="text-sm text-text-subtle">\{lastAction\}<\/output>/);
});
