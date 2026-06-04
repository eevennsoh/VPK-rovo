const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

const SOURCE_FILE = path.join(__dirname, "chat-greeting.tsx");
const CHAT_GREETING_SOURCE = fs.readFileSync(SOURCE_FILE, "utf8");

async function loadChatGreetingHarness() {
	const mockModules = new Map([
		[
			"motion/react",
			`
				import React from "react";

				export function AnimatePresence(props) {
					return React.createElement(React.Fragment, null, props.children);
				}

				export const motion = {
					div: function MotionDiv(props) {
						const { animate, exit, initial, variants, ...rest } = props;
						return React.createElement("div", rest, props.children);
					},
				};

				export function useReducedMotion() {
					return false;
				}
			`,
		],
		[
			"next/image",
			`
				import React from "react";

				export default function Image(props) {
					return React.createElement("img", props);
				}
			`,
		],
		[
			"@/lib/tokens",
			`
				export function token(name) {
					return name;
				}
			`,
		],
		[
			"@/components/blocks/shared-ui/heading",
			`
				import React from "react";

				export default function Heading(props) {
					return React.createElement("h2", props, props.children);
				}
			`,
		],
		[
			"@/components/ui/icon-tile",
			`
				import React from "react";

				export function IconTile(props) {
					return React.createElement("span", props, props.icon);
				}
			`,
		],
		[
			"@/components/projects/shared/components/visual-identity-tile",
			`
				import React from "react";

				export function VisualIdentityTile(props) {
					return React.createElement("span", props,
						props.visualIdentity?.iconName === "ai-chat"
							? React.createElement("svg", { "data-testid": "ai-chat-icon" })
							: null
					);
				}
			`,
		],
		[
			"@/components/ui-custom/rovo-illustration",
			`
				import React from "react";

				export function ControlledRovoIllustration(props) {
					return React.createElement("div", {
						"data-testid": "controlled-rovo-illustration",
						"data-illus-id": props.illusId,
						"data-size": String(props.size),
					});
				}
			`,
		],
		[
			"@/components/ui-custom/agent-avatar-visual",
			`
				import React from "react";

				export function AgentAvatarVisual(props) {
					return React.createElement("img", {
						alt: "",
						"data-testid": "agent-avatar-visual",
						src: props.avatarSrc ?? "",
					});
				}
			`,
		],
		[
			"@atlaskit/icon/core/ai-chat",
			`
				import React from "react";

				export default function AiChatIcon() {
					return React.createElement("svg", { "data-testid": "ai-chat-icon" });
				}
			`,
		],
		[
			"@/lib/rovo-suggestions",
			`
				export const defaultSuggestions = [];
			`,
		],
	]);

	const result = await esbuild.build({
		stdin: {
			contents: `
				import React from "react";
				import { renderToStaticMarkup } from "react-dom/server";
				import ChatGreeting from "./components/projects/sidebar-chat/components/chat-greeting.tsx";
				import { AI_INSIGHTS_AGENT_ID, getRovoAgentProfile } from "./components/projects/rovo/data/agent-profiles.ts";

				export function renderCustomLightGreeting() {
					return renderToStaticMarkup(React.createElement(ChatGreeting, {
						heading: "What should we change?",
						illustrationSrc: "/illustration-ai/write/light.svg",
						suggestions: [],
					}));
				}

				export function renderDefaultGreeting() {
					return renderToStaticMarkup(React.createElement(ChatGreeting, {
						suggestions: [],
					}));
				}

				export function renderAgentIllustrationGreeting() {
					return renderToStaticMarkup(React.createElement(ChatGreeting, {
						heading: "Improve your agent?",
						illustrationSrc: "/illustration-ai/ai/light.svg",
						illustrationDarkSrc: "/illustration-ai/ai/dark.svg",
						suggestions: [],
					}));
				}

				export function renderMaxGreeting() {
					return renderToStaticMarkup(React.createElement(ChatGreeting, {
						isMaxMode: true,
						suggestions: [],
					}));
				}

				export function renderCustomAgentGreeting(isAgentTest = false) {
					return renderToStaticMarkup(React.createElement(ChatGreeting, {
						isAgentTest,
						selectedAgent: getRovoAgentProfile(AI_INSIGHTS_AGENT_ID),
					}));
				}
			`,
			loader: "tsx",
			resolveDir: process.cwd(),
			sourcefile: "chat-greeting-harness.tsx",
		},
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
		plugins: [
			{
				name: "chat-greeting-test-mocks",
				setup(build) {
					build.onResolve({ filter: /.*/ }, (args) => {
						if (!mockModules.has(args.path)) {
							return undefined;
						}

						return {
							path: args.path,
							namespace: "chat-greeting-test-mock",
						};
					});

					build.onLoad(
						{ filter: /.*/, namespace: "chat-greeting-test-mock" },
						(args) => ({
							contents: mockModules.get(args.path),
							loader: "tsx",
							resolveDir: process.cwd(),
						}),
					);
				},
			},
		],
	});

	return loadCjsModuleFromText(result.outputFiles[0].text);
}

test("ChatGreeting derives the dark illustration from a custom light SVG", async () => {
	const harness = await loadChatGreetingHarness();
	const markup = harness.renderCustomLightGreeting();

	assert.match(markup, /src="\/illustration-ai\/write\/light\.svg"/u);
	assert.match(markup, /src="\/illustration-ai\/write\/dark\.svg"/u);
	assert.doesNotMatch(markup, /src="\/illustration-ai\/chat\/dark\.svg"/u);
});

test("ChatGreeting uses the animated controlled chat illustration for the default Rovo greeting", async () => {
	const harness = await loadChatGreetingHarness();
	const markup = harness.renderDefaultGreeting();

	assert.match(CHAT_GREETING_SOURCE, /resolvedIllustrationSrc === DEFAULT_ILLUSTRATION_SRC/u);
	assert.match(markup, /data-testid="controlled-rovo-illustration"/u);
	assert.match(markup, /data-illus-id="chat"/u);
	assert.match(markup, /data-size="74"/u);
	// The static chat SVG must no longer render for the default greeting.
	assert.doesNotMatch(markup, /src="\/illustration-ai\/chat\/light\.svg"/u);
	assert.doesNotMatch(markup, /src="\/illustration-ai\/chat\/dark\.svg"/u);
});

test("ChatGreeting uses the Studio controlled agent illustration for the AI greeting asset", async () => {
	const harness = await loadChatGreetingHarness();
	const markup = harness.renderAgentIllustrationGreeting();

	assert.match(CHAT_GREETING_SOURCE, /import \{ ControlledRovoIllustration \} from "@\/components\/ui-custom\/rovo-illustration";/u);
	assert.match(CHAT_GREETING_SOURCE, /resolvedIllustrationSrc === AGENT_ILLUSTRATION_SRC/u);
	assert.match(markup, /data-testid="controlled-rovo-illustration"/u);
	assert.match(markup, /data-illus-id="ai"/u);
	assert.match(markup, /data-size="74"/u);
	assert.doesNotMatch(markup, /src="\/illustration-ai\/ai\/light\.svg"/u);
});

test("ChatGreeting switches theme illustrations for local data-color-mode dark containers", () => {
	assert.match(CHAT_GREETING_SOURCE, /\[\[data-color-mode=dark\]_&\]:hidden/u);
	assert.match(CHAT_GREETING_SOURCE, /\[\[data-color-mode=dark\]_&\]:block/u);
});

test("ChatGreeting switches to Max heading and fixed illustration box", async () => {
	const harness = await loadChatGreetingHarness();
	const markup = harness.renderMaxGreeting();

	assert.match(markup, /Let&#x27;s plan your next move/u);
	assert.match(markup, /src="\/illustration-ai\/max\/light\.gif"/u);
	assert.match(markup, /src="\/illustration-ai\/max\/dark\.gif"/u);
	assert.match(markup, /width="74"/u);
	assert.match(markup, /height="67"/u);
});

test("ChatGreeting staggers the illustration before the heading", () => {
	assert.match(CHAT_GREETING_SOURCE, /import \{ AnimatePresence, motion, useReducedMotion \} from "motion\/react";/u);
	assert.match(CHAT_GREETING_SOURCE, /staggerChildren: 0\.04/u);
	assert.match(CHAT_GREETING_SOURCE, /transform: "translateY\(6px\)"/u);
	assert.match(CHAT_GREETING_SOURCE, /transform: "translateY\(-6px\)"/u);
	assert.match(CHAT_GREETING_SOURCE, /<motion\.div className=\{cn\(CHAT_GREETING_ILLUSTRATION_CLASS_NAME, "relative"\)[\s\S]*<motion\.div style=\{\{ willChange: "transform, opacity" \}\} variants=\{itemVariants\}>[\s\S]*<Heading size="large"/u);
});

test("ChatGreeting prompt row icons are decorative inside labelled buttons", () => {
	assert.match(CHAT_GREETING_SOURCE, /<IconTile[\s\S]*aria-hidden=\{true\}/u);
	assert.match(CHAT_GREETING_SOURCE, /<span className="text-left text-sm text-text-subtle">\{suggestion\.label\}<\/span>/u);
});

test("ChatGreeting renders selected custom agent profile and three starters", async () => {
	const harness = await loadChatGreetingHarness();
	const markup = harness.renderCustomAgentGreeting();

	assert.match(CHAT_GREETING_SOURCE, /function CustomAgentGreeting/u);
	assert.match(CHAT_GREETING_SOURCE, /itemVariants: ChatGreetingItemVariants;/u);
	assert.match(CHAT_GREETING_SOURCE, /isAgentTest \? "max-w-\[600px\]" : "max-w-\[800px\]"/u);
	// Default (main Rovo App chat) renders the wide 800px custom-agent greeting.
	assert.match(markup, /max-w-\[800px\]/u);
	assert.doesNotMatch(markup, /max-w-\[600px\]/u);
	assert.match(CHAT_GREETING_SOURCE, /<motion\.div key=\{suggestion\.id\} variants=\{itemVariants\}>/u);
	assert.match(CHAT_GREETING_SOURCE, /<AnimatePresence mode="wait">[\s\S]*customAgent \? \(/u);
	assert.match(markup, /AI Insights Agent/u);
	assert.match(markup, /Researches and summarizes latest AI trends, breakthroughs, and industry developments for weekly insights\./u);
	assert.match(markup, /What are the latest AI trends this week\?/u);
	assert.match(markup, /Summarize recent AI breakthroughs for me/u);
	assert.match(markup, /Give me AI industry insights and developments/u);
	assert.equal((markup.match(/data-testid="ai-chat-icon"/g) ?? []).length, 3);
	assert.equal((markup.match(/<button/g) ?? []).length, 3);
});

test("ChatGreeting renders the custom agent greeting at 600px in Test mode", async () => {
	const harness = await loadChatGreetingHarness();
	const markup = harness.renderCustomAgentGreeting(true);

	// The Studio Test panel passes isAgentTest so the greeting narrows to 600px.
	assert.match(markup, /max-w-\[600px\]/u);
	assert.doesNotMatch(markup, /max-w-\[800px\]/u);
});
