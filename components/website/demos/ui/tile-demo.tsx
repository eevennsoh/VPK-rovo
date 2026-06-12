"use client";

import SearchIcon from "@atlaskit/icon/core/search";

import { Tile } from "@/components/ui/tile";
import { RovoColorIcon } from "@/components/ui/logo";

export default function TileDemo() {
	return (
		<div className="flex items-center gap-3">
			<Tile label="Search" variant="neutral" size="medium">
				🔍
			</Tile>
			<Tile label="Attachment" variant="blueSubtle" size="medium">
				📎
			</Tile>
			<Tile label="Target" variant="greenSubtle" size="medium">
				🎯
			</Tile>
		</div>
	);
}

export function TileDemoDefault() {
	return (
		<Tile label="Smile" variant="neutral" size="medium">
			😀
		</Tile>
	);
}

const TILE_SIZES = ["xxsmall", "xsmall", "small", "medium", "large", "xlarge"] as const;

export function TileDemoSizes() {
	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-col gap-2">
				<p className="text-xs font-medium text-text-subtle">Border + transparent</p>
				<div className="flex items-end gap-3">
					{TILE_SIZES.map((size) => (
						<Tile key={size} label={`${size} border transparent`} variant="transparent" size={size} hasBorder>
							<SearchIcon label="" color="currentColor" />
						</Tile>
					))}
				</div>
			</div>
			<div className="flex flex-col gap-2">
				<p className="text-xs font-medium text-text-subtle">Border + white fill</p>
				<div className="flex items-end gap-3">
					{TILE_SIZES.map((size) => (
						<Tile
							key={size}
							label={`${size} border white`}
							variant="transparent"
							size={size}
							hasBorder
							className="bg-surface"
						>
							<SearchIcon label="" color="currentColor" />
						</Tile>
					))}
				</div>
			</div>
		</div>
	);
}

export function TileDemoAppearances() {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				<p className="text-xs font-medium text-text-subtle">Semantic</p>
				<div className="flex flex-wrap items-center gap-2">
					<Tile label="neutral" variant="neutral">⚪</Tile>
					<Tile label="brand" variant="brand">⭐</Tile>
					<Tile label="danger" variant="danger">🔴</Tile>
					<Tile label="warning" variant="warning">🟡</Tile>
					<Tile label="success" variant="success">🟢</Tile>
					<Tile label="discovery" variant="discovery">🟣</Tile>
					<Tile label="information" variant="information">🔵</Tile>
				</div>
			</div>
			<div className="flex flex-col gap-2">
				<p className="text-xs font-medium text-text-subtle">Accent subtle</p>
				<div className="flex flex-wrap items-center gap-2">
					<Tile label="blue" variant="blueSubtle">💧</Tile>
					<Tile label="red" variant="redSubtle">🌹</Tile>
					<Tile label="green" variant="greenSubtle">🌿</Tile>
					<Tile label="yellow" variant="yellowSubtle">🌻</Tile>
					<Tile label="purple" variant="purpleSubtle">🔮</Tile>
					<Tile label="teal" variant="tealSubtle">🧊</Tile>
					<Tile label="orange" variant="orangeSubtle">🍊</Tile>
					<Tile label="magenta" variant="magentaSubtle">🌸</Tile>
					<Tile label="lime" variant="limeSubtle">🍀</Tile>
					<Tile label="gray" variant="graySubtle">🪨</Tile>
				</div>
			</div>
			<div className="flex flex-col gap-2">
				<p className="text-xs font-medium text-text-subtle">Accent bold</p>
				<div className="flex flex-wrap items-center gap-2">
					<Tile label="blue" variant="blueBold">💧</Tile>
					<Tile label="red" variant="redBold">🌹</Tile>
					<Tile label="green" variant="greenBold">🌿</Tile>
					<Tile label="yellow" variant="yellowBold">🌻</Tile>
					<Tile label="purple" variant="purpleBold">🔮</Tile>
					<Tile label="teal" variant="tealBold">🧊</Tile>
					<Tile label="orange" variant="orangeBold">🍊</Tile>
					<Tile label="magenta" variant="magentaBold">🌸</Tile>
					<Tile label="lime" variant="limeBold">🍀</Tile>
					<Tile label="gray" variant="grayBold">🪨</Tile>
				</div>
			</div>
		</div>
	);
}

export function TileDemoBorder() {
	return (
		<div className="flex items-center gap-3">
			<Tile label="with border" variant="neutral" hasBorder>
				📌
			</Tile>
			<Tile label="with border" variant="transparent" hasBorder>
				📌
			</Tile>
		</div>
	);
}

export function TileDemoInset() {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-end gap-3">
				{(["xxsmall", "xsmall", "small", "medium", "large", "xlarge"] as const).map((size) => (
					<Tile key={size} label={`Rovo ${size} inset`} variant="neutral" size={size} isInset>
						<RovoColorIcon size="xlarge" />
					</Tile>
				))}
				<p className="text-xs text-text-subtle self-center">Inset (default)</p>
			</div>
			<div className="flex items-end gap-3">
				{(["xxsmall", "xsmall", "small", "medium", "large", "xlarge"] as const).map((size) => (
					<Tile key={size} label={`Rovo ${size} no inset`} variant="neutral" size={size} isInset={false}>
						<RovoColorIcon size="xlarge" />
					</Tile>
				))}
				<p className="text-xs text-text-subtle self-center">No inset</p>
			</div>
		</div>
	);
}
