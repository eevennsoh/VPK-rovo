"use client";

import AddIcon from "@atlaskit/icon/core/add";
import EditIcon from "@atlaskit/icon/core/edit";
import SearchIcon from "@atlaskit/icon/core/search";
import SettingsIcon from "@atlaskit/icon/core/settings";
import StarIcon from "@atlaskit/icon/core/star-starred";
import HomeIcon from "@atlaskit/icon/core/home";
import LightbulbIcon from "@atlaskit/icon/core/lightbulb";
import HeartIcon from "@atlaskit/icon/core/heart";
import LockIcon from "@atlaskit/icon/core/lock-locked";
import FlagIcon from "@atlaskit/icon/core/flag";
import { type ReactElement } from "react";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { AtlassianLogo, RovoColorIcon } from "@/components/ui/logo";

function tileIcon(render: ReactElement) {
	return <Icon aria-hidden render={render} />;
}

export default function IconTileDemo() {
	return (
		<div className="flex items-center gap-3">
			<IconTile icon={tileIcon(<SearchIcon label="" />)} label="Search" variant="blue" />
			<IconTile icon={tileIcon(<AddIcon label="" />)} label="Add" variant="green" />
			<IconTile icon={tileIcon(<EditIcon label="" />)} label="Edit" variant="purple" />
			<IconTile icon={tileIcon(<SettingsIcon label="" />)} label="Settings" variant="gray" />
		</div>
	);
}

export function IconTileDemoDefault() {
	return <IconTile icon={tileIcon(<SearchIcon label="" />)} label="Search" variant="blue" />;
}

export function IconTileDemoSizes() {
	return (
		<div className="flex items-end gap-3">
			<IconTile icon={tileIcon(<SearchIcon label="" size="small" />)} label="Search" variant="blue" size="xsmall" />
			<IconTile icon={tileIcon(<SearchIcon label="" size="small" />)} label="Search" variant="blue" size="small" />
			<IconTile icon={tileIcon(<SearchIcon label="" />)} label="Search" variant="blue" size="medium" />
			<IconTile icon={tileIcon(<SearchIcon label="" />)} label="Search" variant="blue" size="large" />
			<IconTile icon={tileIcon(<SearchIcon label="" />)} label="Search" variant="blue" size="xlarge" />
		</div>
	);
}

// Each column demonstrates the transparent tile at one box size. The tile size
// maps to a px value (xxsmall=16, small=24, medium=32) and insets + centers a
// backgroundless mark to the tile's content scale — e.g. a 12px glyph in the
// xxsmall (16px) box. This is the treatment inline chips use for the Atlassian
// master logo and the Rovo family (see AtlassianLogoMark frame="chip").
const TRANSPARENT_COLUMNS = [
	{ label: "16", size: "xxsmall", logoSize: "xxsmall" },
	{ label: "24", size: "small", logoSize: "small" },
	{ label: "32", size: "medium", logoSize: "small" },
] as const;

export function IconTileDemoTransparent() {
	return (
		<div className="flex items-start gap-10">
			{TRANSPARENT_COLUMNS.map(({ label, size, logoSize }) => (
				<div key={label} className="flex flex-col items-center gap-3">
					<p className="text-xs font-medium text-text-subtle">{label}</p>
					<div className="flex items-center gap-3 text-icon-subtle">
						<IconTile icon={tileIcon(<SearchIcon label="" size="small" />)} label="Search" variant="transparent" size={size} />
						<IconTile icon={tileIcon(<HomeIcon label="" />)} label="Home" variant="transparent" size={size} />
						<IconTile icon={<AtlassianLogo name="atlassian" label="Atlassian" size={logoSize} themeAware />} label="Atlassian" variant="transparent" size={size} />
						<IconTile icon={<RovoColorIcon aria-hidden />} label="Rovo" variant="transparent" size={size} />
					</div>
				</div>
			))}
		</div>
	);
}

export function IconTileDemoAppearances() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<IconTile icon={tileIcon(<SearchIcon label="" />)} label="Gray" variant="gray" />
			<IconTile icon={tileIcon(<StarIcon label="" />)} label="Blue" variant="blue" />
			<IconTile icon={tileIcon(<HomeIcon label="" />)} label="Teal" variant="teal" />
			<IconTile icon={tileIcon(<AddIcon label="" />)} label="Green" variant="green" />
			<IconTile icon={tileIcon(<LightbulbIcon label="" />)} label="Lime" variant="lime" />
			<IconTile icon={tileIcon(<HeartIcon label="" />)} label="Yellow" variant="yellow" />
			<IconTile icon={tileIcon(<FlagIcon label="" />)} label="Orange" variant="orange" />
			<IconTile icon={tileIcon(<LockIcon label="" />)} label="Red" variant="red" />
			<IconTile icon={tileIcon(<EditIcon label="" />)} label="Magenta" variant="magenta" />
			<IconTile icon={tileIcon(<SettingsIcon label="" />)} label="Purple" variant="purple" />
		</div>
	);
}

export function IconTileDemoAppearancesBold() {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<IconTile icon={tileIcon(<SearchIcon label="" />)} label="Gray" variant="grayBold" />
			<IconTile icon={tileIcon(<StarIcon label="" />)} label="Blue" variant="blueBold" />
			<IconTile icon={tileIcon(<HomeIcon label="" />)} label="Teal" variant="tealBold" />
			<IconTile icon={tileIcon(<AddIcon label="" />)} label="Green" variant="greenBold" />
			<IconTile icon={tileIcon(<LightbulbIcon label="" />)} label="Lime" variant="limeBold" />
			<IconTile icon={tileIcon(<HeartIcon label="" />)} label="Yellow" variant="yellowBold" />
			<IconTile icon={tileIcon(<FlagIcon label="" />)} label="Orange" variant="orangeBold" />
			<IconTile icon={tileIcon(<LockIcon label="" />)} label="Red" variant="redBold" />
			<IconTile icon={tileIcon(<EditIcon label="" />)} label="Magenta" variant="magentaBold" />
			<IconTile icon={tileIcon(<SettingsIcon label="" />)} label="Purple" variant="purpleBold" />
		</div>
	);
}

export function IconTileDemoShapes() {
	return (
		<div className="flex items-center gap-3">
			<IconTile icon={tileIcon(<SearchIcon label="" />)} label="Square" variant="blue" shape="square" />
			<IconTile icon={tileIcon(<SearchIcon label="" />)} label="Circle" variant="blue" shape="circle" />
		</div>
	);
}
