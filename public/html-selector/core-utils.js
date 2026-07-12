(function () {
	"use strict";

	var SHARED_START = "/* vpk-shared:start */";
	var SHARED_END = "/* vpk-shared:end */";
	var ORIGIN_PRECEDENCE = {
		"design-system": 1,
		"page-local": 2,
		inline: 3,
	};

	function normalizeIdentifier(value) {
		return String(value == null ? "" : value).trim();
	}

	function escapeIdentifier(value) {
		var raw = normalizeIdentifier(value);
		if (!raw) {
			return "";
		}

		if (typeof CSS !== "undefined" && CSS.escape) {
			return CSS.escape(raw);
		}

		return raw.replace(/(^-?\d)|[^a-zA-Z0-9_-]/g, function (match, leadingDigit) {
			if (leadingDigit) {
				return "\\" + leadingDigit;
			}
			return "\\" + match;
		});
	}

	function getTagName(element) {
		return normalizeIdentifier(element && (element.localName || element.tagName || element.nodeName))
			.toLowerCase() || "element";
	}

	function getClassNames(element) {
		if (!element) {
			return [];
		}

		if (element.classList && typeof element.classList.length === "number") {
			var classes = [];
			for (var index = 0; index < element.classList.length; index += 1) {
				var className = normalizeIdentifier(element.classList[index]);
				if (className) {
					classes.push(className);
				}
			}
			return classes;
		}

		if (Array.isArray(element.classes)) {
			return element.classes.map(normalizeIdentifier).filter(Boolean);
		}

		if (typeof element.className === "string") {
			return element.className.split(/\s+/u).map(normalizeIdentifier).filter(Boolean);
		}

		return [];
	}

	function getOwnerDocument(element) {
		if (element && element.ownerDocument) {
			return element.ownerDocument;
		}
		if (typeof document !== "undefined") {
			return document;
		}
		return null;
	}

	function isUniqueSelector(element, selector) {
		var ownerDocument = getOwnerDocument(element);
		if (!ownerDocument || typeof ownerDocument.querySelectorAll !== "function") {
			return false;
		}

		try {
			var matches = ownerDocument.querySelectorAll(selector);
			return matches.length === 1 && matches[0] === element;
		} catch {
			return false;
		}
	}

	function getUniqueSelector(element) {
		var id = normalizeIdentifier(element && element.id);
		if (id) {
			var idSelector = "#" + escapeIdentifier(id);
			if (isUniqueSelector(element, idSelector)) {
				return idSelector;
			}
		}

		var classNames = getClassNames(element);
		if (classNames.length > 0) {
			var classSelector = getTagName(element) + classNames.map(function (className) {
				return "." + escapeIdentifier(className);
			}).join("");
			if (isUniqueSelector(element, classSelector)) {
				return classSelector;
			}
		}

		return null;
	}

	function getElementChildren(parent) {
		var rawChildren = parent && (parent.children || parent.childNodes);
		if (!rawChildren) {
			return [];
		}

		return Array.prototype.slice.call(rawChildren).filter(function (node) {
			return !node.nodeType || node.nodeType === 1;
		});
	}

	function getNthOfType(element) {
		var parent = element && (element.parentElement || element.parentNode);
		if (!parent) {
			return 1;
		}

		var tagName = getTagName(element);
		var sameTypeIndex = 0;
		var children = getElementChildren(parent);
		for (var index = 0; index < children.length; index += 1) {
			if (getTagName(children[index]) === tagName) {
				sameTypeIndex += 1;
			}
			if (children[index] === element) {
				return sameTypeIndex;
			}
		}

		return 1;
	}

	function buildSelectorPath(element) {
		if (!element) {
			return "";
		}

		var directUniqueSelector = getUniqueSelector(element);
		if (directUniqueSelector) {
			return directUniqueSelector;
		}

		var segments = [];
		var node = element;
		while (node && (!node.nodeType || node.nodeType === 1)) {
			var uniqueSelector = getUniqueSelector(node);
			if (uniqueSelector) {
				segments.unshift(uniqueSelector);
				break;
			}

			var tagName = getTagName(node);
			segments.unshift(tagName + ":nth-of-type(" + getNthOfType(node) + ")");
			if (tagName === "html") {
				break;
			}

			node = node.parentElement || node.parentNode || null;
		}

		return segments.join(" > ");
	}

	function splitSharedAndLocalCss(cssText) {
		var text = String(cssText == null ? "" : cssText);
		var startIndex = text.indexOf(SHARED_START);
		var endIndex = text.indexOf(SHARED_END);
		if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
			return {
				shared: "",
				local: text,
				hasSharedBlock: false,
			};
		}

		var sharedContentStart = startIndex + SHARED_START.length;
		var localBefore = text.slice(0, startIndex);
		var shared = text.slice(sharedContentStart, endIndex);
		var localAfter = text.slice(endIndex + SHARED_END.length);
		return {
			shared: shared,
			local: localBefore + localAfter,
			hasSharedBlock: true,
		};
	}

	function getPropertyValue(name, propMap) {
		if (!propMap) {
			return "";
		}
		if (typeof propMap.get === "function") {
			return propMap.get(name) || "";
		}
		return propMap[name] || "";
	}

	function normalizeVarName(name) {
		var normalized = normalizeIdentifier(name);
		return normalized.startsWith("--") ? normalized : "--" + normalized;
	}

	function resolveVarChain(name, propMap) {
		var chain = [];
		var currentName = normalizeVarName(name);
		var seen = new Set();

		for (var depth = 0; depth < 20; depth += 1) {
			if (!currentName || seen.has(currentName)) {
				break;
			}
			seen.add(currentName);

			var value = normalizeIdentifier(getPropertyValue(currentName, propMap));
			chain.push({ name: currentName, value: value });
			var nested = value.match(/var\(\s*(--[a-zA-Z0-9_-]+)/u);
			if (!nested) {
				break;
			}
			currentName = nested[1];
		}

		return chain;
	}

	function toSpecificityScore(specificity) {
		if (Array.isArray(specificity)) {
			return (specificity[0] || 0) * 10000 + (specificity[1] || 0) * 100 + (specificity[2] || 0);
		}
		if (typeof specificity === "number" && Number.isFinite(specificity)) {
			return specificity;
		}
		return 0;
	}

	function compareDeclarations(left, right) {
		if (Boolean(left.important) !== Boolean(right.important)) {
			return left.important ? 1 : -1;
		}

		var leftOrigin = ORIGIN_PRECEDENCE[left.origin] || 0;
		var rightOrigin = ORIGIN_PRECEDENCE[right.origin] || 0;
		if (leftOrigin !== rightOrigin) {
			return leftOrigin - rightOrigin;
		}

		var leftSpecificity = toSpecificityScore(left.specificity);
		var rightSpecificity = toSpecificityScore(right.specificity);
		if (leftSpecificity !== rightSpecificity) {
			return leftSpecificity - rightSpecificity;
		}

		return (left.sourceOrder || 0) - (right.sourceOrder || 0);
	}

	function classifyDeclarations(declarations) {
		var groups = new Map();
		var normalized = (Array.isArray(declarations) ? declarations : []).map(function (declaration, index) {
			return {
				origin: declaration.origin || "page-local",
				property: normalizeIdentifier(declaration.property),
				value: declaration.value == null ? "" : String(declaration.value),
				selector: declaration.selector || "",
				specificity: declaration.specificity || 0,
				sourceOrder: typeof declaration.sourceOrder === "number" ? declaration.sourceOrder : index,
				important: Boolean(declaration.important),
				varChain: declaration.varChain || null,
			};
		}).filter(function (declaration) {
			return declaration.property.length > 0;
		});

		for (var index = 0; index < normalized.length; index += 1) {
			var declaration = normalized[index];
			var existingGroup = groups.get(declaration.property) || [];
			existingGroup.push(declaration);
			groups.set(declaration.property, existingGroup);
		}

		var winners = {};
		var annotated = [];
		groups.forEach(function (group, property) {
			var winner = group[0];
			for (var index = 1; index < group.length; index += 1) {
				if (compareDeclarations(winner, group[index]) <= 0) {
					winner = group[index];
				}
			}

			var hasDesignSystemDeclaration = group.some(function (declaration) {
				return declaration.origin === "design-system";
			});
			winners[property] = winner;

			for (var itemIndex = 0; itemIndex < group.length; itemIndex += 1) {
				var item = group[itemIndex];
				var isWinner = item === winner;
				var shadowsDesignSystem = isWinner
					&& hasDesignSystemDeclaration
					&& (item.origin === "page-local" || item.origin === "inline");
				annotated.push(Object.assign({}, item, {
					winner: isWinner,
					overridden: !isWinner,
					override: shadowsDesignSystem,
					tokenOverride: shadowsDesignSystem && item.property.startsWith("--"),
				}));
			}
		});

		return {
			declarations: annotated.sort(function (left, right) {
				return (left.sourceOrder || 0) - (right.sourceOrder || 0);
			}),
			winners: winners,
		};
	}

	function truncateOuterHtml(element, maxChars) {
		var limit = Number.isFinite(maxChars) ? Math.max(0, Math.floor(maxChars)) : 500;
		var html = element && typeof element.outerHTML === "string"
			? element.outerHTML
			: String(element == null ? "" : element);
		if (html.length <= limit) {
			return html;
		}
		if (limit <= 3) {
			return html.slice(0, limit);
		}
		return html.slice(0, limit - 3) + "...";
	}

	function summarizeAncestryNode(element) {
		var tagName = getTagName(element);
		var id = normalizeIdentifier(element && element.id);
		var classes = getClassNames(element).slice(0, 2);
		return tagName + (id ? "#" + id : "") + (classes.length ? "." + classes.join(".") : "");
	}

	function buildAncestryChain(element, maxDepth) {
		var limit = Number.isFinite(maxDepth) ? Math.max(1, Math.floor(maxDepth)) : 7;
		var chain = [];
		var node = element;
		while (node && (!node.nodeType || node.nodeType === 1)) {
			chain.unshift({
				element: node,
				selector: buildSelectorPath(node),
				tagSummary: summarizeAncestryNode(node),
			});
			node = node.parentElement || node.parentNode || null;
		}
		if (chain.length > limit) {
			return chain.slice(chain.length - limit);
		}
		return chain;
	}

	var api = {
		buildAncestryChain: buildAncestryChain,
		buildSelectorPath: buildSelectorPath,
		classifyDeclarations: classifyDeclarations,
		resolveVarChain: resolveVarChain,
		splitSharedAndLocalCss: splitSharedAndLocalCss,
		truncateOuterHtml: truncateOuterHtml,
	};

	if (typeof window !== "undefined") {
		window.__VPK_HTML_SELECTOR_UTILS__ = api;
	}
	if (typeof module !== "undefined" && module.exports) {
		module.exports = api;
	}
})();
