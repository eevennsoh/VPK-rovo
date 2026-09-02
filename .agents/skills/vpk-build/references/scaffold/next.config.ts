import type { NextConfig } from "next";

// Extracted prototype: always builds as a static export so the Micros
// Express wrapper can serve it as plain files. No dev proxy, no API routes.
// If the extracted route later needs a backend, promote the project out of
// /vpk-build's static-export deploy mode.
const nextConfig: NextConfig = {
	output: "export",
	// Hide the floating "N" Next.js dev tools badge in the bottom-left of
	// every page. Extracted prototypes are usually being demoed or embedded
	// as iframes where the badge is visual noise. Re-enable if you need the
	// hydration/build indicators while debugging.
	devIndicators: false,
	// Next advertises a Network URL on 127.0.2.2; without this, that origin
	// is blocked from /_next/* and the page renders as unstyled HTML.
	// Preview via http://localhost:3001 unless you intentionally use the
	// Network URL after this allow-list is in place.
	allowedDevOrigins: ["127.0.2.2", "localhost"],
	// Pin Turbopack's workspace root to the project directory. Without this,
	// Next walks up the filesystem looking for a pnpm-lock.yaml and may find
	// an unrelated lockfile in a parent directory (e.g. the user's home dir),
	// producing a "multiple lockfiles detected" warning.
	// Using process.cwd() here (rather than __dirname via fileURLToPath)
	// because adding ESM-only syntax like import.meta.url to next.config.ts
	// makes Next's transpiler emit a CJS/ESM mismatch that fails to load.
	turbopack: {
		root: process.cwd(),
	},
	images: {
		// Static export has no server, so Next's default image optimizer is
		// unavailable. Setting unoptimized passes src/width/height through
		// without modification.
		unoptimized: true,
	},
};

export default nextConfig;
