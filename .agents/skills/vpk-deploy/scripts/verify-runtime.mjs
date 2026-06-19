#!/usr/bin/env node

const rawBaseUrl = process.argv[2] || process.env.VPK_DEPLOY_URL;
if (!rawBaseUrl) {
	console.error("Usage: verify-runtime.mjs <base-url> [route ...]");
	process.exit(2);
}

const baseUrl = new URL(rawBaseUrl);
const routes = process.argv.slice(3);
if (routes.length === 0) {
	routes.push("/", "/studio/");
}

const failures = [];

function resolveUrl(pathname) {
	return new URL(pathname, baseUrl).toString();
}

async function fetchCheck(pathname, options = {}) {
	const label = options.label || pathname;
	const response = await fetch(resolveUrl(pathname), options.fetchOptions);
	if (!response.ok) {
		failures.push(`${label}: ${response.status}`);
	}
	return response;
}

function extractStaticRefs(html) {
	return [
		...new Set(
			[...html.matchAll(/["'](\/_next\/static\/[^"']+)/g)]
				.map((match) => match[1])
				.map((ref) => ref.replace(/\\$/u, "")),
		),
	];
}

function isFontRef(ref) {
	return /\.(?:woff2?|ttf|otf)(?:[?#].*)?$/iu.test(ref);
}

console.log(`Verifying deployed runtime at ${baseUrl.origin}`);

for (const route of routes) {
	const response = await fetchCheck(route, { label: `route ${route}` });
	const linkHeader = response.headers.get("link");
	const html = await response.text();
	const staticRefs = extractStaticRefs(html);
	const badRefs = [];

	for (const ref of staticRefs) {
		const staticResponse = await fetch(resolveUrl(ref));
		if (!staticResponse.ok) {
			badRefs.push(`${staticResponse.status} ${ref}`);
		}
	}

	for (const ref of staticRefs.filter(isFontRef)) {
		const fontResponse = await fetch(resolveUrl(ref), {
			headers: {
				Origin: baseUrl.origin,
				Referer: resolveUrl(route),
				"Sec-Fetch-Dest": "font",
				"Sec-Fetch-Mode": "cors",
			},
		});
		if (!fontResponse.ok) {
			badRefs.push(`${fontResponse.status} browser-font ${ref}`);
		}
	}

	if (badRefs.length > 0) {
		failures.push(`route ${route} bad static refs: ${badRefs.join(", ")}`);
	}
	console.log(
		`${route}: ${response.status}, link=${linkHeader || "none"}, staticRefs=${staticRefs.length}, bad=${badRefs.length}`,
	);
}

try {
	const health = await fetchCheck("/api/health", { label: "/api/health" });
	const payload = await health.json();
	const aiGatewayConfigured = payload?.llmRouting?.aiGatewayConfigured;
	const realtimeModel = payload?.llmRouting?.aiGatewayConfig?.OPENAI_REALTIME_MODEL;
	console.log(
		`/api/health: ${health.status}, aiGatewayConfigured=${String(aiGatewayConfigured)}, realtimeModel=${realtimeModel || "unknown"}`,
	);
} catch (error) {
	failures.push(`/api/health parse failed: ${error instanceof Error ? error.message : String(error)}`);
}

try {
	const realtimeToken = await fetchCheck("/api/realtime/audio-conversation-token", {
		label: "/api/realtime/audio-conversation-token",
		fetchOptions: {
			headers: {
				Origin: baseUrl.origin,
			},
		},
	});
	console.log(`/api/realtime/audio-conversation-token: ${realtimeToken.status}`);
} catch (error) {
	failures.push(
		`/api/realtime/audio-conversation-token failed: ${error instanceof Error ? error.message : String(error)}`,
	);
}

if (failures.length > 0) {
	console.error("\nRuntime verification failed:");
	for (const failure of failures) {
		console.error(`- ${failure}`);
	}
	process.exit(1);
}

console.log("\nRuntime verification passed");
process.exit(0);
