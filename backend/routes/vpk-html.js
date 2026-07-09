"use strict";

const express = require("express");
const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_VPK_HTML_ROOT = path.resolve(__dirname, "..", "..", ".agents", "skills", "vpk-html");
const CATALOG_ROOT_FILES = new Set([
	"CHEATSHEET.md",
	"README.md",
	"SKILL.md",
	"index.html",
]);

function getWildcardRouteValue(value) {
	if (Array.isArray(value)) {
		return value.join("/");
	}

	return typeof value === "string" && value.length > 0 ? value : null;
}

function resolveVpkHtmlFilePath(assetPath, {
	pathModule = path,
	rootDir = DEFAULT_VPK_HTML_ROOT,
} = {}) {
	const normalizedAssetPath = assetPath && assetPath !== "/" ? assetPath : "index.html";
	if (normalizedAssetPath.includes("\0") || normalizedAssetPath.includes("\\")) {
		return null;
	}

	const resolvedRoot = pathModule.resolve(rootDir);
	const resolvedPath = pathModule.resolve(resolvedRoot, normalizedAssetPath);
	const rootPrefix = `${resolvedRoot}${pathModule.sep}`;

	if (resolvedPath !== resolvedRoot && !resolvedPath.startsWith(rootPrefix)) {
		return null;
	}

	const relativePath = pathModule.relative(resolvedRoot, resolvedPath);
	const normalizedRelativePath = relativePath.split(pathModule.sep).join("/");
	if (!isAllowedVpkHtmlAssetPath(normalizedRelativePath)) {
		return null;
	}

	return resolvedPath;
}

function isAllowedVpkHtmlAssetPath(relativePath) {
	if (CATALOG_ROOT_FILES.has(relativePath)) {
		return true;
	}

	return relativePath.startsWith("assets/demos/") && relativePath.endsWith(".html");
}

function createVpkHtmlRouter({
	fsModule = fs,
	pathModule = path,
	rootDir = DEFAULT_VPK_HTML_ROOT,
} = {}) {
	const router = express.Router();

	function sendVpkHtmlAsset(req, res) {
		const assetPath = getWildcardRouteValue(req.params.assetPath) ?? "index.html";
		const filePath = resolveVpkHtmlFilePath(assetPath, { pathModule, rootDir });

		if (!filePath) {
			return res.status(400).json({ error: "Invalid vpk-html asset path" });
		}

		return fsModule.stat(filePath, (statError, stats) => {
			if (statError || !stats.isFile()) {
				return res.status(404).json({ error: "vpk-html asset not found" });
			}

			return res.sendFile(filePath, { dotfiles: "allow" }, (sendError) => {
				if (!sendError || res.headersSent) {
					return;
				}

				return res.status(500).json({
					error: "Failed to serve vpk-html asset",
					details: sendError instanceof Error ? sendError.message : String(sendError),
				});
			});
		});
	}

	router.get("/", sendVpkHtmlAsset);
	router.get("/*assetPath", sendVpkHtmlAsset);

	return router;
}

function registerVpkHtmlRoutes(app, dependencies = {}) {
	app.use("/api/vpk-html", createVpkHtmlRouter(dependencies));
}

module.exports = {
	createVpkHtmlRouter,
	getWildcardRouteValue,
	isAllowedVpkHtmlAssetPath,
	registerVpkHtmlRoutes,
	resolveVpkHtmlFilePath,
};
