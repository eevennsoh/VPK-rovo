(function () {
	"use strict";

	var utils = window.__VPK_HTML_SELECTOR_UTILS__;
	if (!utils) {
		return;
	}

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

	function buildStyleRows(element, report) {
		var computed = window.getComputedStyle(element);
		return STYLE_ROWS.map(function (definition) {
			var origin = findDeclarationOrigin(report, definition.css);
			return {
				origin: origin ? origin.origin : "",
				override: origin ? Boolean(origin.override || origin.tokenOverride) : false,
				previousValue: definition.read(computed),
				property: definition.property,
				style: definition.style,
				value: definition.read(computed),
			};
		});
	}

	window.__VPK_HTML_SELECTOR_INSPECT__ = {
		buildStyleRows: buildStyleRows,
		collectMatchedDeclarations: collectMatchedDeclarations,
	};
})();
