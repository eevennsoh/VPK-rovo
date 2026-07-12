(function () {
	"use strict";

	var AGENTS = [
		{ id: "claude", label: "Claude" },
		{ id: "codex", label: "Codex" },
		{ id: "cursor", label: "Cursor" },
		{ id: "rovo", label: "Rovo" },
	];

	function clear(element) {
		element.textContent = "";
	}

	function clamp(value, min, max) {
		return Math.max(min, Math.min(max, value));
	}

	function createButton(className, label, icon, onClick) {
		var button = document.createElement("button");
		button.type = "button";
		button.className = className;
		button.setAttribute("aria-label", label);
		button.title = label;
		if (icon) {
			button.innerHTML = icon;
		} else {
			button.textContent = label;
		}
		button.addEventListener("click", function (event) {
			event.preventDefault();
			event.stopPropagation();
			onClick();
		});
		return button;
	}

	function createText(className, text) {
		var element = document.createElement("div");
		element.className = className;
		element.textContent = text;
		return element;
	}

	function positionNear(panel, rect) {
		panel.style.left = "8px";
		panel.style.top = "8px";
		panel.classList.add("vpkhs-visible");
		var width = panel.offsetWidth || 320;
		var height = panel.offsetHeight || 220;
		var left = rect.right + 10;
		if (left + width > window.innerWidth - 8) {
			left = rect.left - width - 10;
		}
		if (left < 8) {
			left = clamp(rect.left, 8, Math.max(8, window.innerWidth - width - 8));
		}
		var top = clamp(rect.top, 8, Math.max(8, window.innerHeight - height - 8));
		panel.style.left = left + "px";
		panel.style.top = top + "px";
	}

	function createController(options) {
		var callbacks = options.callbacks || {};
		var icons = options.icons || {};
		var root = null;
		var overlay = null;
		var label = null;
		var bar = null;
		var pinLayer = null;
		var tree = null;
		var contextMenu = null;
		var commentPopover = null;
		var stylePopover = null;
		var commentsList = null;
		var agentPopover = null;
		var toast = null;
		var toastTimer = 0;
		var collapsed = false;
		var lastBarData = {
			active: false,
			agent: "codex",
			enabled: false,
			pinCount: 0,
		};

		function getAgentLabel(agentId) {
			for (var index = 0; index < AGENTS.length; index += 1) {
				if (AGENTS[index].id === agentId) {
					return AGENTS[index].label;
				}
			}
			return "Codex";
		}

		function getSendLabel(agentId) {
			return "Send to " + getAgentLabel(agentId);
		}

		function isLayerVisible(layer) {
			return Boolean(layer && layer.classList.contains("vpkhs-visible"));
		}

		function getVisibleLayerForTarget(target) {
			var node = target && target.nodeType === 1 ? target : target && target.parentElement;
			if (!root || !node || !root.contains(node) || typeof node.closest !== "function") {
				return null;
			}
			var layer = node.closest(".vpkhs-popover.vpkhs-visible, .vpkhs-tree.vpkhs-visible");
			return layer && root.contains(layer) ? layer : null;
		}

		function canElementScroll(element, deltaX, deltaY) {
			var canScrollY = element.scrollHeight > element.clientHeight + 1 && (
				(deltaY < 0 && element.scrollTop > 0)
				|| (deltaY > 0 && element.scrollTop + element.clientHeight < element.scrollHeight - 1)
			);
			var canScrollX = element.scrollWidth > element.clientWidth + 1 && (
				(deltaX < 0 && element.scrollLeft > 0)
				|| (deltaX > 0 && element.scrollLeft + element.clientWidth < element.scrollWidth - 1)
			);
			return canScrollY || canScrollX;
		}

		function canWheelScrollInside(layer, target, deltaX, deltaY) {
			var node = target && target.nodeType === 1 ? target : target && target.parentElement;
			while (node && root && root.contains(node)) {
				if (canElementScroll(node, deltaX, deltaY)) {
					return true;
				}
				if (node === layer) {
					break;
				}
				node = node.parentElement;
			}
			return false;
		}

		function handlePopoverWheel(event) {
			var layer = getVisibleLayerForTarget(event.target);
			if (!layer) {
				return;
			}
			if (!canWheelScrollInside(layer, event.target, event.deltaX, event.deltaY)) {
				event.preventDefault();
				event.stopPropagation();
			}
		}

		function getOpenLayers() {
			return {
				agentPopover: isLayerVisible(agentPopover),
				commentPopover: isLayerVisible(commentPopover),
				commentsList: isLayerVisible(commentsList),
				contextMenu: isLayerVisible(contextMenu),
				stylePopover: isLayerVisible(stylePopover),
				tree: isLayerVisible(tree),
			};
		}

		function ensure() {
			if (root) {
				return;
			}
			root = document.createElement("div");
			root.className = "vpkhs-root";
			document.body.appendChild(root);

			overlay = document.createElement("div");
			overlay.className = "vpkhs-overlay";
			root.appendChild(overlay);

			label = document.createElement("div");
			label.className = "vpkhs-label";
			root.appendChild(label);

			pinLayer = document.createElement("div");
			pinLayer.className = "vpkhs-pin-layer";
			root.appendChild(pinLayer);

			bar = document.createElement("div");
			bar.className = "vpkhs-bar";
			root.appendChild(bar);

				tree = document.createElement("div");
				tree.className = "vpkhs-tree";
				tree.tabIndex = -1;
				root.appendChild(tree);

				contextMenu = document.createElement("div");
				contextMenu.className = "vpkhs-popover vpkhs-menu";
				contextMenu.tabIndex = -1;
				root.appendChild(contextMenu);

				commentPopover = document.createElement("div");
				commentPopover.className = "vpkhs-popover vpkhs-comment-popover";
				commentPopover.tabIndex = -1;
				root.appendChild(commentPopover);

				stylePopover = document.createElement("div");
				stylePopover.className = "vpkhs-popover vpkhs-style-popover";
				stylePopover.tabIndex = -1;
				root.appendChild(stylePopover);

				commentsList = document.createElement("div");
				commentsList.className = "vpkhs-popover vpkhs-comments-list";
				commentsList.tabIndex = -1;
				root.appendChild(commentsList);

				agentPopover = document.createElement("div");
				agentPopover.className = "vpkhs-popover vpkhs-agent-popover";
				agentPopover.tabIndex = -1;
				root.appendChild(agentPopover);

			toast = document.createElement("div");
			toast.className = "vpkhs-toast";
			root.appendChild(toast);

				document.addEventListener("pointerdown", handleOutsidePointerDown, true);
				document.addEventListener("wheel", handlePopoverWheel, { capture: true, passive: false });
			}

		function handleOutsidePointerDown(event) {
			if (!root || root.contains(event.target)) {
				return;
			}
			hideContextMenu();
			hideCommentPopover();
			hideStylePopover();
			hideAgentPopover();
		}

		function renderBar(data) {
			ensure();
			lastBarData = Object.assign({}, lastBarData, data);
			clear(bar);
			bar.className = "vpkhs-bar" + (lastBarData.enabled ? "" : " vpkhs-hidden");
			if (!lastBarData.enabled) {
				return;
			}
			if (collapsed) {
				bar.classList.add("vpkhs-bar-collapsed");
				bar.appendChild(createButton("vpkhs-tool-button", "Expand HTML selector", icons.chevronRight, function () {
					collapsed = false;
					renderBar(lastBarData);
				}));
				return;
			}
			bar.classList.remove("vpkhs-bar-collapsed");
			bar.appendChild(createButton(
				"vpkhs-tool-button" + (lastBarData.active ? " vpkhs-tool-button-active" : ""),
				"Inspect",
				icons.cursor,
				callbacks.onToggleInspect || function () {},
			));
			var commentsButton = createButton("vpkhs-tool-button", "Comments", icons.comment, callbacks.onToggleComments || function () {});
			if (lastBarData.pinCount > 0) {
				var badge = document.createElement("span");
				badge.className = "vpkhs-badge";
				badge.textContent = String(lastBarData.pinCount);
				commentsButton.appendChild(badge);
			}
			bar.appendChild(commentsButton);
			var sendButton = createButton(
				"vpkhs-tool-button",
				getSendLabel(lastBarData.agent) + " (right-click to switch agent)",
				icons.send,
				callbacks.onSend || function () {},
			);
			sendButton.addEventListener("contextmenu", function (event) {
				event.preventDefault();
				event.stopPropagation();
				toggleAgentPopover(sendButton.getBoundingClientRect());
			});
			bar.appendChild(sendButton);
			bar.appendChild(createButton("vpkhs-tool-button", "Copy all", icons.copy, callbacks.onCopyAll || function () {}));
			bar.appendChild(createButton("vpkhs-tool-button", "Collapse", icons.chevronLeft, function () {
				collapsed = true;
				hideAgentPopover();
				renderBar(lastBarData);
			}));
		}

		function toggleAgentPopover(rect) {
			if (agentPopover.classList.contains("vpkhs-visible")) {
				hideAgentPopover();
				return;
			}
			showAgentPopover(rect);
		}

		function showAgentPopover(rect) {
			ensure();
			clear(agentPopover);
			agentPopover.appendChild(createText("vpkhs-popover-title", "Agent"));
			for (var index = 0; index < AGENTS.length; index += 1) {
				var agent = AGENTS[index];
				var row = createButton(
					"vpkhs-menu-row" + (agent.id === lastBarData.agent ? " vpkhs-menu-row-active" : ""),
					agent.label,
					"",
					(function (agentId) {
						return function () {
							hideAgentPopover();
							if (callbacks.onAgentChange) {
								callbacks.onAgentChange(agentId);
							}
						};
					})(agent.id),
				);
				row.textContent = agent.label;
				agentPopover.appendChild(row);
			}
			var copyRow = createButton("vpkhs-menu-row", "Copy all", "", callbacks.onCopyAll || function () {});
			copyRow.textContent = "Copy all";
			agentPopover.appendChild(copyRow);
			positionNear(agentPopover, rect);
		}

		function hideAgentPopover() {
			if (agentPopover) {
				agentPopover.classList.remove("vpkhs-visible");
			}
		}

		function setOverlay(data) {
			ensure();
			if (!data || !data.visible || !data.rect) {
				overlay.classList.remove("vpkhs-visible");
				label.classList.remove("vpkhs-visible");
				return;
			}
			overlay.style.left = data.rect.left + "px";
			overlay.style.top = data.rect.top + "px";
			overlay.style.width = data.rect.width + "px";
			overlay.style.height = data.rect.height + "px";
			overlay.classList.add("vpkhs-visible");
			label.textContent = data.label || "";
			label.style.left = clamp(data.rect.left, 8, Math.max(8, window.innerWidth - 420)) + "px";
			label.style.top = Math.max(8, data.rect.top - 30) + "px";
			label.classList.add("vpkhs-visible");
		}

		function showTree(entries, activeIndex, rect) {
			ensure();
			clear(tree);
			if (!entries || entries.length === 0 || !rect) {
				hideTree();
				return;
			}
			for (var index = 0; index < entries.length; index += 1) {
				var entry = entries[index];
				var row = createButton(
					"vpkhs-tree-row" + (index === activeIndex ? " vpkhs-tree-row-active" : ""),
					entry.tagSummary,
					"",
					(function (nextIndex) {
						return function () {
							if (callbacks.onTreePick) {
								callbacks.onTreePick(nextIndex);
							}
						};
					})(index),
				);
				row.textContent = entry.tagSummary;
				tree.appendChild(row);
			}
			positionNear(tree, rect);
		}

		function hideTree() {
			if (tree) {
				tree.classList.remove("vpkhs-visible");
			}
		}

		function showContextMenu(data) {
			ensure();
			clear(contextMenu);
			contextMenu.appendChild(createText("vpkhs-popover-title", data.summary || "Element"));
			var rows = [
				["Copy", "⌘C", callbacks.onContextCopy],
				["Style", "S", callbacks.onContextStyle],
				["Comment", "↵", callbacks.onContextComment],
				["Send", "⌘⇧↵", callbacks.onSend],
			];
			for (var index = 0; index < rows.length; index += 1) {
				var rowData = rows[index];
				var row = createButton("vpkhs-menu-row", rowData[0], "", rowData[2] || function () {});
				var name = document.createElement("span");
				name.textContent = rowData[0];
				var shortcut = document.createElement("kbd");
				shortcut.textContent = rowData[1];
				row.append(name, shortcut);
				contextMenu.appendChild(row);
			}
			positionNear(contextMenu, data.rect);
		}

		function hideContextMenu() {
			if (contextMenu) {
				contextMenu.classList.remove("vpkhs-visible");
			}
		}

		function showCommentPopover(data) {
			ensure();
			hideContextMenu();
			clear(commentPopover);
			var pin = data.pin || {};
			var scope = pin.scope || "element";
			commentPopover.appendChild(createText("vpkhs-popover-title", data.summary || "Comment"));
			var textarea = document.createElement("textarea");
			textarea.className = "vpkhs-field vpkhs-textarea";
			textarea.value = pin.comment || "";
			textarea.rows = 4;
			commentPopover.appendChild(textarea);
			var scopeRow = document.createElement("div");
			scopeRow.className = "vpkhs-segmented";
			var elementButton = createButton("vpkhs-segment" + (scope === "element" ? " vpkhs-segment-active" : ""), "Element", "", function () {
				scope = "element";
				elementButton.classList.add("vpkhs-segment-active");
				everywhereButton.classList.remove("vpkhs-segment-active");
			});
			elementButton.textContent = "Element";
			var everywhereButton = createButton("vpkhs-segment" + (scope === "everywhere" ? " vpkhs-segment-active" : ""), "Everywhere", "", function () {
				scope = "everywhere";
				everywhereButton.classList.add("vpkhs-segment-active");
				elementButton.classList.remove("vpkhs-segment-active");
			});
			everywhereButton.textContent = "Everywhere";
			scopeRow.append(elementButton, everywhereButton);
			commentPopover.appendChild(scopeRow);
			var actions = document.createElement("div");
			actions.className = "vpkhs-actions";
			if (pin.id) {
				var remove = createButton("vpkhs-secondary-button", "Remove", "", function () {
					if (callbacks.onCommentRemove) {
						callbacks.onCommentRemove(pin.id);
					}
				});
				remove.textContent = "Remove";
				actions.appendChild(remove);
			}
			var save = createButton("vpkhs-primary-button", "Save", "", function () {
				if (callbacks.onCommentSave) {
					callbacks.onCommentSave({ comment: textarea.value, scope: scope });
				}
			});
			save.textContent = "Save";
			actions.appendChild(save);
			commentPopover.appendChild(actions);
			positionNear(commentPopover, data.rect);
			textarea.focus();
			textarea.select();
		}

		function hideCommentPopover() {
			if (commentPopover) {
				commentPopover.classList.remove("vpkhs-visible");
			}
		}

		function showStylePopover(data) {
			ensure();
			hideContextMenu();
			clear(stylePopover);
			stylePopover.appendChild(createText("vpkhs-popover-title", data.summary || "Style"));
			var search = document.createElement("input");
			search.className = "vpkhs-field";
			search.type = "search";
			search.placeholder = "Search property";
			stylePopover.appendChild(search);
			var list = document.createElement("div");
			list.className = "vpkhs-style-list";
			stylePopover.appendChild(list);

			function renderRows() {
				var query = search.value.trim().toLowerCase();
				clear(list);
				for (var index = 0; index < data.rows.length; index += 1) {
					var rowData = data.rows[index];
					if (query && rowData.property.toLowerCase().indexOf(query) === -1) {
						continue;
					}
					var row = document.createElement("div");
					row.className = "vpkhs-style-row";
					var labelWrap = document.createElement("div");
					labelWrap.className = "vpkhs-style-label";
					var labelText = document.createElement("div");
					labelText.className = "vpkhs-style-label-text";
					var name = document.createElement("span");
					name.className = "vpkhs-style-name";
					name.textContent = rowData.property;
					labelText.appendChild(name);
					var tokenBadge = document.createElement("span");
					tokenBadge.className = "vpkhs-token-badge" + (rowData.provenanceCustom ? " vpkhs-token-badge-custom" : "");
					tokenBadge.textContent = rowData.provenanceLabel || "Custom style";
					tokenBadge.title = rowData.provenanceTitle || tokenBadge.textContent;
					labelText.appendChild(tokenBadge);
					labelWrap.appendChild(labelText);
					if (rowData.origin) {
						var badge = document.createElement("span");
						badge.className = "vpkhs-origin-badge" + (rowData.override ? " vpkhs-origin-badge-warn" : "");
						badge.textContent = rowData.override ? rowData.origin + " override" : rowData.origin;
						labelWrap.appendChild(badge);
					}
					var value = document.createElement("input");
					value.className = "vpkhs-field vpkhs-style-input";
					value.value = rowData.value || "";
					// Live-preview every keystroke; record the edit (pin save)
					// only on commit so parent state is not churned per key.
					value.addEventListener("input", (function (styleRow) {
						return function (event) {
							if (callbacks.onStylePreview) {
								callbacks.onStylePreview(styleRow, event.currentTarget.value);
							}
						};
					})(rowData));
					value.addEventListener("change", (function (styleRow) {
						return function (event) {
							if (callbacks.onStyleEdit) {
								callbacks.onStyleEdit(styleRow, event.currentTarget.value);
							}
						};
					})(rowData));
					// Commit deterministically on Enter via blur -> change.
					value.addEventListener("keydown", function (event) {
						if (event.key === "Enter") {
							event.preventDefault();
							event.currentTarget.blur();
						}
					});
					row.append(labelWrap, value);
					list.appendChild(row);
				}
			}

			search.addEventListener("input", renderRows);
			renderRows();
			positionNear(stylePopover, data.rect);
			search.focus();
		}

		function hideStylePopover() {
			if (stylePopover) {
				stylePopover.classList.remove("vpkhs-visible");
			}
		}

		function showCommentsList(data) {
			ensure();
			var wasVisible = commentsList.classList.contains("vpkhs-visible");
			var previousScrollTop = wasVisible ? commentsList.scrollTop : 0;
			clear(commentsList);
			commentsList.appendChild(createText("vpkhs-popover-title", data.pins.length + " pins on this page"));
			var list = document.createElement("div");
			list.className = "vpkhs-list";
			if (data.pins.length === 0) {
				list.appendChild(createText("vpkhs-empty", "No pins on this page."));
			}
			for (var index = 0; index < data.pins.length; index += 1) {
				var pin = data.pins[index];
				var item = document.createElement("div");
				item.className = "vpkhs-list-item";
				var comment = createButton("vpkhs-list-comment", pin.comment || "(no comment)", "", (function (pinId) {
					return function () {
						if (callbacks.onOpenPin) {
							callbacks.onOpenPin(pinId);
						}
					};
				})(pin.id));
				comment.textContent = pin.comment || "(no comment)";
				var meta = createText("vpkhs-list-meta", pin.selector + " · " + pin.scope + " · " + ((pin.styleEdits || []).length) + " style edits");
				var remove = createButton("vpkhs-icon-text-button", "Remove", "", (function (pinId) {
					return function () {
						if (callbacks.onCommentRemove) {
							callbacks.onCommentRemove(pinId);
						}
					};
				})(pin.id));
				remove.textContent = "Remove";
				item.append(comment, meta, remove);
				list.appendChild(item);
			}
			commentsList.appendChild(list);
			if (data.meta && data.meta.otherPagesPinCount > 0) {
				commentsList.appendChild(createText(
					"vpkhs-footer-note",
					data.meta.otherPagesPinCount + " pins on " + data.meta.otherPagesCount + " other pages",
				));
			}
			var actions = document.createElement("div");
			actions.className = "vpkhs-actions";
			var agentId = data.meta && data.meta.agent ? data.meta.agent : lastBarData.agent;
			var agentLabel = getAgentLabel(agentId);
			var copy = createButton("vpkhs-secondary-button", "Copy all", "", callbacks.onCopyAll || function () {});
			copy.textContent = "Copy all";
			var agentButton = createButton("vpkhs-secondary-button vpkhs-agent-button", "Change agent, current " + agentLabel, "", function () {
				showAgentPopover(agentButton.getBoundingClientRect());
			});
			agentButton.textContent = agentLabel;
			var send = createButton("vpkhs-primary-button", "Send to " + agentLabel, "", callbacks.onSend || function () {});
			send.textContent = "Send to " + agentLabel;
			actions.append(copy, agentButton, send);
			commentsList.appendChild(actions);
			commentsList.classList.add("vpkhs-visible");
			if (wasVisible) {
				commentsList.scrollTop = previousScrollTop;
			}
		}

		function hideCommentsList() {
			if (commentsList) {
				commentsList.classList.remove("vpkhs-visible");
			}
		}

		function toggleCommentsList(data) {
			ensure();
			if (commentsList.classList.contains("vpkhs-visible")) {
				hideCommentsList();
				return;
			}
			showCommentsList(data);
		}

		function renderPins(items) {
			ensure();
			clear(pinLayer);
			for (var index = 0; index < items.length; index += 1) {
				var item = items[index];
				var marker = createButton(
					"vpkhs-pin" + (item.stale ? " vpkhs-stale" : ""),
					item.comment || item.selector,
					"",
					(function (pinId) {
						return function () {
							if (callbacks.onPinClick) {
								callbacks.onPinClick(pinId);
							}
						};
					})(item.id),
				);
				marker.textContent = String(item.index + 1);
				marker.style.left = item.rect.left + "px";
				marker.style.top = item.rect.top + "px";
				pinLayer.appendChild(marker);
				if (item.comment) {
					var bubble = createText("vpkhs-comment", item.comment);
					bubble.style.left = clamp(item.rect.left + 20, 8, Math.max(8, window.innerWidth - 288)) + "px";
					bubble.style.top = clamp(item.rect.top, 8, Math.max(8, window.innerHeight - 48)) + "px";
					pinLayer.appendChild(bubble);
				}
			}
		}

		function notify(notification) {
			ensure();
			window.clearTimeout(toastTimer);
			toast.className = "vpkhs-toast vpkhs-toast-" + (notification.type || "success") + " vpkhs-visible";
			toast.textContent = notification.message || "";
			toastTimer = window.setTimeout(function () {
				toast.classList.remove("vpkhs-visible");
			}, notification.type === "pending" ? 2200 : 3600);
		}

		function closePopovers() {
			hideContextMenu();
			hideCommentPopover();
			hideStylePopover();
			hideAgentPopover();
			hideCommentsList();
		}

		function destroy() {
			if (!root) {
				return;
				}
				document.removeEventListener("pointerdown", handleOutsidePointerDown, true);
				document.removeEventListener("wheel", handlePopoverWheel, true);
				window.clearTimeout(toastTimer);
				root.remove();
				root = null;
			}

			return {
				closePopovers: closePopovers,
				destroy: destroy,
				getOpenLayers: getOpenLayers,
				hideCommentPopover: hideCommentPopover,
				hideContextMenu: hideContextMenu,
				hideCommentsList: hideCommentsList,
				hideAgentPopover: hideAgentPopover,
				hideStylePopover: hideStylePopover,
				hideTree: hideTree,
			notify: notify,
			renderBar: renderBar,
			renderPins: renderPins,
			setOverlay: setOverlay,
			showCommentPopover: showCommentPopover,
			showCommentsList: showCommentsList,
			showContextMenu: showContextMenu,
			showStylePopover: showStylePopover,
			showTree: showTree,
			toggleCommentsList: toggleCommentsList,
		};
	}

	window.__VPK_HTML_SELECTOR_UI__ = {
		createController: createController,
	};
})();
