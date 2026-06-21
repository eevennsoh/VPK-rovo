"use client";

import type { CSSProperties, ElementType, HTMLAttributes } from "react";
import { token } from "@/lib/tokens";

export interface HeadingProps extends HTMLAttributes<HTMLElement> {
	as?: ElementType;
	size?: "xxsmall" | "xsmall" | "small" | "medium" | "large" | "xlarge" | "xxlarge";
}

const sizeMap: Record<NonNullable<HeadingProps["size"]>, Parameters<typeof token>[0]> = {
	xxsmall: "font.heading.xxsmall",
	xsmall: "font.heading.xsmall",
	small: "font.heading.small",
	medium: "font.heading.medium",
	large: "font.heading.large",
	xlarge: "font.heading.xlarge",
	xxlarge: "font.heading.xxlarge",
};

export function Heading({
	as: Component = "h2",
	size = "medium",
	style,
	className,
	...props
}: Readonly<HeadingProps>) {
	const mergedStyle: CSSProperties = {
		font: token(sizeMap[size]),
		color: token("color.text"),
		...style,
	};

	const PolymorphicHeading = Component as ElementType<HTMLAttributes<HTMLElement>>;

	return <PolymorphicHeading style={mergedStyle} className={className} {...props} />;
}

export default Heading;
