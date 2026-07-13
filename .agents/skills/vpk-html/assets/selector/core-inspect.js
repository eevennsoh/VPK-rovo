(function () {
	"use strict";

	var utils = window.__VPK_HTML_SELECTOR_UTILS__;
	if (!utils) {
		return;
	}

	var semanticTokenMatches = [];
	var sourceOrder = 0;

	function readBackground(computed) { return computed.backgroundColor; }
	function readColor(computed) { return computed.color; }
	function readFontSize(computed) { return computed.fontSize; }
	function readFontWeight(computed) { return computed.fontWeight; }
	function readLetterSpacing(computed) { return computed.letterSpacing; }
	function readTextTransform(computed) { return computed.textTransform; }
	function readDecoration(computed) { return computed.textDecorationLine; }
	function readAlignItems(computed) { return computed.alignItems; }
	function readPaddingX(computed) { return computed.paddingLeft === computed.paddingRight ? computed.paddingLeft : computed.paddingLeft + " / " + computed.paddingRight; }
	function readPaddingY(computed) { return computed.paddingTop === computed.paddingBottom ? computed.paddingTop : computed.paddingTop + " / " + computed.paddingBottom; }
	function readBorderRadius(computed) {
		var values = [computed.borderTopLeftRadius, computed.borderTopRightRadius, computed.borderBottomRightRadius, computed.borderBottomLeftRadius];
		return values.every(function (value) { return value === values[0]; }) ? values[0] : values.join(" ");
	}
	function readBorderColor(computed) {
		var values = [computed.borderTopColor, computed.borderRightColor, computed.borderBottomColor, computed.borderLeftColor];
		return values.every(function (value) { return value === values[0]; }) ? values[0] : values.join(" ");
	}

	function clampNumber(value, min, max) {
		return Math.max(min, Math.min(max, value));
	}

	function normalizeColorComponent(value) {
		var text = String(value == null ? "" : value).trim();
		if (text.endsWith("%")) {
			var percent = Number.parseFloat(text.slice(0, -1));
			return Number.isFinite(percent) ? String(Math.round(clampNumber(percent, 0, 100) * 2.55)) : "";
		}
		var number = Number.parseFloat(text);
		return Number.isFinite(number) ? String(Math.round(clampNumber(number, 0, 255))) : "";
	}

	function normalizeAlpha(value) {
		var text = String(value == null ? "" : value).trim();
		if (!text) {
			return "1";
		}
		var number = text.endsWith("%")
			? Number.parseFloat(text.slice(0, -1)) / 100
			: Number.parseFloat(text);
		if (!Number.isFinite(number)) {
			return "1";
		}
		return String(Math.round(clampNumber(number, 0, 1) * 1000) / 1000);
	}

	function normalizeColorValue(value) {
		var text = String(value == null ? "" : value).trim().toLowerCase();
		var hex = text.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/u);
		if (hex) {
			var raw = hex[1];
			var expanded = raw.length === 3
				? raw[0] + raw[0] + raw[1] + raw[1] + raw[2] + raw[2]
				: raw;
			return "rgb("
				+ Number.parseInt(expanded.slice(0, 2), 16) + ","
				+ Number.parseInt(expanded.slice(2, 4), 16) + ","
				+ Number.parseInt(expanded.slice(4, 6), 16) + ")";
		}
		var rgb = text.match(/^rgba?\((.*)\)$/u);
		if (!rgb) {
			return text;
		}
		var body = rgb[1].replace(/\s*\/\s*/u, " ").trim();
		var parts = body.indexOf(",") === -1 ? body.split(/\s+/u) : body.split(/\s*,\s*/u);
		if (parts.length < 3) {
			return text;
		}
		var red = normalizeColorComponent(parts[0]);
		var green = normalizeColorComponent(parts[1]);
		var blue = normalizeColorComponent(parts[2]);
		if (!red || !green || !blue) {
			return text;
		}
		var alpha = parts.length > 3 ? normalizeAlpha(parts[3]) : "1";
		if (alpha === "1") {
			return "rgb(" + red + "," + green + "," + blue + ")";
		}
		return "rgba(" + red + "," + green + "," + blue + "," + alpha + ")";
	}

	function setSemanticTokens(tokens) {
		semanticTokenMatches = [];
		var semantic = tokens && tokens.semantic ? tokens.semantic : tokens;
		if (!semantic || typeof semantic !== "object") {
			return;
		}
		Object.keys(semantic).forEach(function (name) {
			var normalized = normalizeColorValue(semantic[name]);
			if (normalized) {
				semanticTokenMatches.push({ name: "tokens." + name, value: normalized });
			}
		});
	}

	function findSemanticTokenName(value) {
		var normalized = normalizeColorValue(value);
		for (var index = 0; index < semanticTokenMatches.length; index += 1) {
			if (semanticTokenMatches[index].value === normalized) {
				return semanticTokenMatches[index].name;
			}
		}
		return "";
	}

	var STYLE_ROWS = [
		{ property: "background", css: ["background-color", "background"], style: ["backgroundColor"], read: readBackground },
		{ property: "text color", css: ["color"], style: ["color"], read: readColor },
		{ property: "padding-x", css: ["padding-left", "padding-right", "padding"], style: ["paddingLeft", "paddingRight"], read: readPaddingX },
		{ property: "padding-y", css: ["padding-top", "padding-bottom", "padding"], style: ["paddingTop", "paddingBottom"], read: readPaddingY },
		{ property: "font size", css: ["font-size"], style: ["fontSize"], read: readFontSize },
		{ property: "font weight", css: ["font-weight"], style: ["fontWeight"], read: readFontWeight },
		{ property: "letter spacing", css: ["letter-spacing"], style: ["letterSpacing"], read: readLetterSpacing },
		{ property: "text transform", css: ["text-transform"], style: ["textTransform"], read: readTextTransform },
		{ property: "decoration", css: ["text-decoration", "text-decoration-line"], style: ["textDecoration"], read: readDecoration },
		{ property: "border radius", css: ["border-radius"], style: ["borderRadius"], read: readBorderRadius },
		{ property: "align items", css: ["align-items"], style: ["alignItems"], read: readAlignItems },
		{ property: "border color", css: ["border-color"], style: ["borderColor"], read: readBorderColor },
	];

	function computeSpecificity(selector) {
		var idCount = (selector.match(/#[\w-]+/gu) || []).length;
		var classCount = (selector.match(/(\.[\w-]+|\[[^\]]+\]|:[\w-]+)/gu) || []).length;
		var tagCount = (selector.replace(/#[\w-]+|\.[\w-]+|\[[^\]]+\]|::?[\w-]+|\*/gu, "").match(/[a-zA-Z][\w-]*/gu) || []).length;
		return idCount * 10000 + classCount * 100 + tagCount;
	}

	function collectStyleDeclarations(style, meta, declarations, customProps) {
		for (var index = 0; index < style.length; index += 1) {
			var property = style[index];
			var value = style.getPropertyValue(property).trim();
			var declaration = {
				important: style.getPropertyPriority(property) === "important",
				origin: meta.origin,
				property: property,
				selector: meta.selector,
				sourceOrder: sourceOrder += 1,
				specificity: meta.specificity,
				value: value,
			};
			declarations.push(declaration);
			if (property.startsWith("--")) {
				customProps[property] = value;
			}
		}
	}

	function walkRules(cssRules, element, origin, declarations, customProps) {
		for (var index = 0; index < cssRules.length; index += 1) {
			var rule = cssRules[index];
			if (rule.selectorText && rule.style) {
				collectRuleIfMatched(rule, element, origin, declarations, customProps);
			}
			// With CSS Nesting support, every CSSStyleRule exposes a (usually
			// empty) cssRules list, so grouping rules cannot be detected by
			// the presence of cssRules alone — recurse only into non-empty
			// child lists after collecting the rule itself.
			if (rule.cssRules && rule.cssRules.length > 0) {
				walkRules(rule.cssRules, element, origin, declarations, customProps);
			}
		}
	}

	function collectRuleIfMatched(rule, element, origin, declarations, customProps) {
		var selector = rule.selectorText;
		var rootRule = false;
		try {
			rootRule = selector.split(",").some(function (part) {
				return part.trim() === ":root";
			});
		} catch {
			rootRule = false;
		}

		var matches = false;
		try {
			matches = element.matches(selector);
		} catch {
			matches = false;
		}
		if (matches || rootRule) {
			collectStyleDeclarations(rule.style, {
				origin: origin,
				selector: selector,
				specificity: rootRule ? 0 : computeSpecificity(selector),
			}, rootRule ? [] : declarations, customProps);
		}
	}

	function parseStyleSegment(cssText, origin, element, declarations, customProps) {
		if (!cssText || !cssText.trim() || typeof CSSStyleSheet === "undefined") {
			return;
		}
		try {
			var sheet = new CSSStyleSheet();
			sheet.replaceSync(cssText);
			walkRules(sheet.cssRules, element, origin, declarations, customProps);
		} catch {
			// Invalid page CSS should not break inspection.
		}
	}

	function collectMatchedDeclarations(element) {
		sourceOrder = 0;
		var declarations = [];
		var customProps = {};
		var styleElements = document.querySelectorAll("style");
		for (var index = 0; index < styleElements.length; index += 1) {
			var split = utils.splitSharedAndLocalCss(styleElements[index].textContent || "");
			if (split.hasSharedBlock) {
				parseStyleSegment(split.shared, "design-system", element, declarations, customProps);
				parseStyleSegment(split.local, "page-local", element, declarations, customProps);
			} else {
				parseStyleSegment(split.local, "page-local", element, declarations, customProps);
			}
		}
		if (element.getAttribute("style")) {
			collectStyleDeclarations(element.style, {
				origin: "inline",
				selector: "style attribute",
				specificity: 1000000,
			}, declarations, customProps);
		}
		var classified = utils.classifyDeclarations(declarations);
		var computed = window.getComputedStyle(element);
		var tokenChains = classified.declarations
			.filter(function (declaration) {
				return declaration.value.includes("var(");
			})
			.map(function (declaration) {
				var names = declaration.value.match(/--[a-zA-Z0-9_-]+/gu) || [];
				return {
					chains: names.map(function (name) {
						return utils.resolveVarChain(name, customProps);
					}),
					computedValue: computed.getPropertyValue(declaration.property).trim(),
					origin: declaration.origin,
					property: declaration.property,
					selector: declaration.selector,
					value: declaration.value,
				};
			});
		return {
			declarations: classified.declarations,
			overrides: classified.declarations.filter(function (declaration) {
				return declaration.override || declaration.tokenOverride;
			}),
			tokenChains: tokenChains,
		};
	}

	function findDeclarationOrigin(report, properties) {
		if (!report || !report.matchedRules || !Array.isArray(report.matchedRules.declarations)) {
			return null;
		}
		for (var index = report.matchedRules.declarations.length - 1; index >= 0; index -= 1) {
			var declaration = report.matchedRules.declarations[index];
			if (declaration.winner && properties.indexOf(declaration.property) !== -1) {
				return declaration;
			}
		}
		return null;
	}

	function findTokenFinding(report, declaration) {
		if (!declaration || !report || !report.matchedRules || !Array.isArray(report.matchedRules.tokenChains)) {
			return null;
		}
		for (var index = 0; index < report.matchedRules.tokenChains.length; index += 1) {
			var finding = report.matchedRules.tokenChains[index];
			if (
				finding.property === declaration.property
				&& finding.value === declaration.value
				&& finding.selector === declaration.selector
				&& finding.origin === declaration.origin
			) {
				return finding;
			}
		}
		return null;
	}

	function formatChainLabel(chain) {
		var names = chain.map(function (entry) {
			return entry.name;
		}).filter(Boolean);
		if (names.length === 0) {
			return "";
		}
		var label = names.join(" ← ");
		var terminal = chain[chain.length - 1];
		var semanticName = terminal ? findSemanticTokenName(terminal.value) : "";
		return semanticName ? label + " · " + semanticName : label;
	}

	function formatChainTitle(chain) {
		return chain.map(function (entry) {
			return entry.name + (entry.value ? " = " + entry.value : "");
		}).join(" ← ");
	}

	function buildStyleProvenance(report, declaration) {
		if (!declaration || !declaration.value || declaration.value.indexOf("var(") === -1) {
			return { custom: true, label: "Custom style", title: "Custom style" };
		}
		var finding = findTokenFinding(report, declaration);
		if (!finding || !Array.isArray(finding.chains) || finding.chains.length === 0) {
			return { custom: true, label: "Custom style", title: "Custom style" };
		}
		var labels = [];
		var titles = [];
		for (var index = 0; index < finding.chains.length; index += 1) {
			var chain = finding.chains[index];
			if (!Array.isArray(chain) || chain.length === 0) {
				continue;
			}
			var label = formatChainLabel(chain);
			if (label) {
				labels.push(label);
				titles.push(formatChainTitle(chain));
			}
		}
		return labels.length > 0
			? { custom: false, label: labels.join(", "), title: titles.join("\n") }
			: { custom: true, label: "Custom style", title: "Custom style" };
	}

	function buildStyleRows(element, report) {
		var computed = window.getComputedStyle(element);
		return STYLE_ROWS.map(function (definition) {
			var origin = findDeclarationOrigin(report, definition.css);
			var provenance = buildStyleProvenance(report, origin);
			return {
				origin: origin ? origin.origin : "",
				override: origin ? Boolean(origin.override || origin.tokenOverride) : false,
				previousValue: definition.read(computed),
				property: definition.property,
				provenanceCustom: provenance.custom,
				provenanceLabel: provenance.label,
				provenanceTitle: provenance.title,
				style: definition.style,
				value: definition.read(computed),
			};
		});
	}

	window.__VPK_HTML_SELECTOR_INSPECT__ = {
		buildStyleRows: buildStyleRows,
		collectMatchedDeclarations: collectMatchedDeclarations,
		setSemanticTokens: setSemanticTokens,
	};
})();
