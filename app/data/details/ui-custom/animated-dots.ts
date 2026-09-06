import type { ComponentDetail } from "@/app/data/component-detail-types";

export const ANIMATED_DOTS_DETAIL: ComponentDetail = {
	description:
		"Animated dots with staggered opacity reveal, used as a loading or thinking indicator alongside text labels. Neutral (default) matches surrounding text and falls back to text-subtlest; color uses the Rovo palette.",
	usage: `import { AnimatedDots } from "@/components/ui-custom/animated-dots";

<span className="inline-flex items-baseline text-sm text-text-subtlest">
  Thinking
  <AnimatedDots />
</span>
<AnimatedDots variant="color" />`,
	props: [
		{
			name: "variant",
			type: '"neutral" | "color"',
			default: '"neutral"',
			description:
				'"neutral" paints every dot with the surrounding text colour, defaulting to text-subtlest. "color" uses the Rovo palette (or `colors` when provided). Passing `colors` selects the color variant.',
		},
		{
			name: "colors",
			type: "readonly string[]",
			default: '["#1868db", "#bf63f3", "#fca700"]',
			description:
				"Array of CSS color values for each dot. Applies to the color variant; providing this prop selects that variant.",
		},
		{
			name: "duration",
			type: "number",
			default: "1.2",
			description: "Animation cycle duration in seconds.",
		},
		{
			name: "staggerDelay",
			type: "number",
			default: "0.2",
			description: "Delay between each dot's animation start in seconds.",
		},
		{
			name: "className",
			type: "string",
			description:
				"Additional classes applied to the wrapper span. On the neutral variant, pass a text colour class to match adjacent copy.",
		},
	],
	examples: [
		{ title: "Variants", description: "Neutral (default), matching nearby text, and the color palette.", demoSlug: "animated-dots-demo-variants" },
		{ title: "Custom colors", description: "Dots with alternative color palettes.", demoSlug: "animated-dots-demo-custom-colors" },
		{ title: "Timing", description: "Fast, default, and slow animation speeds.", demoSlug: "animated-dots-demo-timing" },
		{ title: "Sizes", description: "Dots at various text sizes from xs to lg.", demoSlug: "animated-dots-demo-sizes" },
	],
};
