"use client";

import { ConfluenceIcon, JiraIcon, LoomIcon, GoalsIcon, TeamsIcon } from "@/components/ui/logo";
import { Tile } from "@/components/ui/tile";

interface LogoProps {
	label: string;
	color?: string;
}

function ProductLogoTile({ children, label }: Readonly<{ children: React.ReactNode; label: string }>) {
	const isDecorative = label === "";

	return (
		<Tile aria-hidden={isDecorative ? true : undefined} label={label || "Product logo"} size="small" variant="transparent" isSnug>
			{children}
		</Tile>
	);
}

export function ConfluenceLogo(props: Readonly<LogoProps>) {
	return <ProductLogoTile label={props.label}><ConfluenceIcon size="xsmall" /></ProductLogoTile>;
}

export function JiraLogo(props: Readonly<LogoProps>) {
	return <ProductLogoTile label={props.label}><JiraIcon size="xsmall" /></ProductLogoTile>;
}

export function LoomLogoWrapper(props: Readonly<LogoProps>) {
	return <ProductLogoTile label={props.label}><LoomIcon size="xsmall" /></ProductLogoTile>;
}

export function GoalsLogo(props: Readonly<LogoProps>) {
	return <ProductLogoTile label={props.label}><GoalsIcon size="xsmall" /></ProductLogoTile>;
}

export function TeamsLogo(props: Readonly<LogoProps>) {
	return <ProductLogoTile label={props.label}><TeamsIcon size="xsmall" /></ProductLogoTile>;
}
