"use strict";

let aiSdk;
let aiSdkPromise;

function loadAiSdk() {
	return aiSdkPromise ??= import("ai").then((module) => (aiSdk = module));
}

function getAiSdk() {
	if (!aiSdk) {
		throw new Error(
			"AI SDK runtime is not initialized. Call loadAiSdk() before creating the backend runtime."
		);
	}

	return aiSdk;
}

module.exports = {
	getAiSdk,
	loadAiSdk,
};
