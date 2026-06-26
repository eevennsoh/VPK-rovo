import type { NextConfig } from "next";

const projectRoot = process.cwd();

const nextConfig: NextConfig = {
	devIndicators: false,
	allowedDevOrigins: ["vpk-rovo.localhost", "*.vpk-rovo.localhost"],

	experimental: {
		viewTransition: true,
		// Rewrite named barrel imports to deep paths at build time so only the
		// used symbols ship to the client. recharts (~86 files) and the motion
		// package (~175 files) are NOT in Next's default optimizePackageImports
		// list (the older framer-motion was); date-fns benefits too. Preserves
		// types and autocomplete with zero source changes.
		optimizePackageImports: ["recharts", "motion/react", "date-fns"],
	},

	turbopack: {
		// Prevent Turbopack from inferring the wrong workspace root.
		root: projectRoot,
	},

	images: {
		unoptimized: true,
	},

	// Static export for production deployment
	// Enabled when NEXT_OUTPUT=export is set (during Docker build)
	...(process.env.NEXT_OUTPUT === "export" && {
		output: "export",
	}),
};

export default nextConfig;
