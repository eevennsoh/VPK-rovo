# Visual Spec Extraction

The `atlas ads` CLI returns API-level information (props, variants, usage) but **not** precise CSS values. For pixel-accurate enrichment (padding, border-radius, height, font-size, etc.), use the following methods in priority order.

> **Critical rule — never guess CSS values from token names:** Token names like `radius.small`, `radius.medium`, etc. do not reliably map to the actual computed pixel values used by ADS components. For example, ADS Button uses `border-radius: 6px` (`rounded-md`), not `rounded-sm` (4px) or `rounded-lg` (8px). The only reliable source is `getComputedStyle()` on the live `atlassian.design` examples page. **Always extract before coding — never assume.**

## Method 1 (Mandatory): Computed style extraction from atlassian.design example pages

Navigate to the component's example page on `atlassian.design` using `/agent-browser`, then use `npx agent-browser eval` to read `window.getComputedStyle()` on the rendered DOM element. This step is **mandatory** — do not skip it or substitute with token documentation lookups.

URL pattern:
```
https://atlassian.design/components/[name]/examples
```

> **Warning:** Do **not** use `atlaskit.atlassian.com/examples.html` — this site is outdated and returns stale CSS values (e.g., incorrect border-radius). Always use `atlassian.design` as the canonical source.

Reusable extraction snippet:
```js
(() => {
	const el = document.querySelector('[data-testid]') || document.querySelector('button, [role="button"], [class]');
	if (!el) return { error: 'No element found' };
	const s = window.getComputedStyle(el);
	// Check parent — ADS components often nest wrapper spans
	const p = el.parentElement;
	const ps = p ? window.getComputedStyle(p) : null;
	return {
		element: {
			tag: el.tagName,
			borderRadius: s.borderRadius,
			padding: s.padding,
			paddingBlock: s.paddingBlock,
			paddingInline: s.paddingInline,
			height: s.height,
			minHeight: s.minHeight,
			fontSize: s.fontSize,
			fontWeight: s.fontWeight,
			lineHeight: s.lineHeight,
			gap: s.gap,
			backgroundColor: s.backgroundColor,
			color: s.color,
			border: s.border,
		},
		parent: ps ? {
			tag: p.tagName,
			borderRadius: ps.borderRadius,
			padding: ps.padding,
			height: ps.height,
		} : null,
	};
})()
```

> **Caveat:** ADS components frequently nest wrapper `<span>` elements. If the computed styles on the target element look empty or wrong, check `el.parentElement` for the actual styled container.

> **Inner layout rule (required):**
> - ADS components often nest an inner flex container (`<span display="flex; gap">`) between the outer shell and child elements (icon, text, metric badge).
> - The outer element carries height/padding/border-radius, while the **inner** element carries the `gap` between children.
> - Always extract `gap` from the inner content container per size variant, not just from the outer element.
> - Use a second extraction pass targeting child elements to capture size-dependent gap values:
> ```js
> (() => {
> 	const lozenges = document.querySelectorAll('[data-testid]');
> 	return Array.from(lozenges).slice(0, 4).map(el => {
> 		const children = el.querySelectorAll(':scope > *');
> 		const innerFlex = Array.from(children).find(c => window.getComputedStyle(c).display === 'flex');
> 		const innerS = innerFlex ? window.getComputedStyle(innerFlex) : null;
> 		return {
> 			outerGap: window.getComputedStyle(el).gap,
> 			innerElement: innerFlex ? {
> 				tag: innerFlex.tagName,
> 				display: innerS.display,
> 				gap: innerS.gap,
> 				alignItems: innerS.alignItems,
> 			} : null,
> 		};
> 	});
> })()
> ```

> **Typography parity rule (required):**
> - Treat `atlassian.design` examples as the source of truth for rendered text scale.
> - Do not infer final typography from token names or utility names alone (`text-sm`, `font.body`, etc.).
> - Capture `fontSize`, `lineHeight`, and `fontWeight` from the same rendered example element you are mapping.
> - If local output still looks larger/smaller than ADS, adjust to the closest matching utility class and prioritize visual parity with the ADS example.

> **Container/layout component rule (required for ButtonGroup, FieldGroup, etc.):**
> - For container/layout components, extract properties from the **parent container** element, not just children:
>   - `gap`, `display`, `flexDirection`, `alignItems`, `justifyContent`
> - Also extract child element properties to confirm they match VPK's existing child component values:
>   - `borderRadius`, `height`, `padding`, `fontSize`, `fontWeight`
> - Extraction snippet for container components:
> ```js
> (() => {
> 	const container = document.querySelector('[role="group"]') || document.querySelector('[data-testid]');
> 	if (!container) return { error: 'No container found' };
> 	const cs = window.getComputedStyle(container);
> 	const children = Array.from(container.children).slice(0, 4);
> 	return {
> 		container: {
> 			tag: container.tagName,
> 			display: cs.display,
> 			gap: cs.gap,
> 			flexDirection: cs.flexDirection,
> 			alignItems: cs.alignItems,
> 		},
> 		children: children.map(c => {
> 			const s = window.getComputedStyle(c);
> 			return {
> 				tag: c.tagName,
> 				borderRadius: s.borderRadius,
> 				height: s.height,
> 				padding: s.padding,
> 				fontSize: s.fontSize,
> 				fontWeight: s.fontWeight,
> 			};
> 		}),
> 	};
> })()
> ```

> **ADS Toggle geometry rule (required when mapping to VPK `Switch`):**
> - Extract geometry for both checked and unchecked states; icon/thumb overlap issues often only appear in one state.
> - Capture:
>   - Root `boxSizing`, `width`, `height`, `padding`, `borderWidth`
>   - Thumb size (often via `::before` on ADS Toggle) and translation distance
>   - Left/right icon container size and inline inset from edges
> - For ADS parity, verify regular/default and large variants separately.
> - If geometry does not match, do not proceed to token tuning yet; fix sizing first.
> - Quick extraction pattern:
> ```js
> (() => {
> 	const toggle = document.querySelector('label[data-size], [data-testid*="toggle"]');
> 	if (!toggle) return { error: 'No ADS toggle root found' };
> 	const s = window.getComputedStyle(toggle);
> 	const before = window.getComputedStyle(toggle, "::before");
> 	return {
> 		root: {
> 			boxSizing: s.boxSizing,
> 			width: s.width,
> 			height: s.height,
> 			padding: s.padding,
> 			borderWidth: s.borderWidth,
> 		},
> 		thumbPseudo: {
> 			width: before.width,
> 			height: before.height,
> 			transform: before.transform,
> 		},
> 	};
> })()
> ```

## Method 2 (API/Props only): `atlas ads` CLI

Run `atlas ads search <terms> --type component` (add `--type token` / `--type icon`, or batch them with `atlas ads batch --command "search <terms> --type component" --command "search <terms> --type token"`), then `atlas ads component <Name>` for an exact lookup or `atlas ads component --all` for the full catalog. Add `--json` when parsing the output. These return prop names, variant values, package names, and usage guidance. They do **not** return CSS values — those are embedded in compiled CSS-in-JS at runtime.

Fall back to the ADS MCP tools (`ads_plan`, `ads_search_components`, `ads_get_all_components`) only when the CLI is unavailable or erroring.

## Method 3 (Last resort): Atlaskit source code

ADS uses compiled CSS-in-JS with Emotion + `cssMap` + token references. Extracting styles from source requires mapping design tokens to resolved values. DOM class names are obfuscated hashes and cannot be inspected directly. Only use this approach when no example page exists on `atlassian.design`.
