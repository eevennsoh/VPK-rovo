import { ArrowLeftIcon, ArrowRightIcon, CircleDashedIcon, SaveIcon } from "@/components/ui/vpk-icons";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function KbdDemo() {
	return (
		<div className="flex items-center gap-3">
			<KbdGroup>
				<Kbd>⌘</Kbd>
				<Kbd>K</Kbd>
			</KbdGroup>
			<KbdGroup>
				<Kbd>Ctrl</Kbd>
				<Kbd>C</Kbd>
			</KbdGroup>
		</div>
	);
}

export function KbdDemoArrowKeys() {
	return (
		<div className="flex items-center gap-2">
			<Kbd>↑</Kbd>
			<Kbd>↓</Kbd>
			<Kbd>←</Kbd>
			<Kbd>→</Kbd>
		</div>
	);
}

export function KbdDemoBasic() {
	return (
		<div className="flex items-center gap-2">
			{/* Combined chords render as a single keycap (no "+" separator). */}
			<Kbd>⌘K</Kbd>
			<Kbd>⌥B</Kbd>
		</div>
	);
}

export function KbdDemoDefault() {
	return <Kbd>⌘</Kbd>;
}

export function KbdDemoGroup() {
	return (
		<KbdGroup>
			<Kbd>⌘</Kbd>
			<Kbd>K</Kbd>
		</KbdGroup>
	);
}

export function KbdDemoInputGroup() {
	return (
		<InputGroup>
			<InputGroupInput />
			<InputGroupAddon>
				<Kbd>Space</Kbd>
			</InputGroupAddon>
		</InputGroup>
	);
}

export function KbdDemoKbdGroup() {
	return (
		<KbdGroup>
			<Kbd>Ctrl</Kbd>
			<Kbd>Shift</Kbd>
			<Kbd>P</Kbd>
		</KbdGroup>
	);
}

export function KbdDemoModifierKeys() {
	return (
		<div className="flex items-center gap-2">
			<Kbd>⌘</Kbd>
			<Kbd>C</Kbd>
		</div>
	);
}

export function KbdDemoTooltip() {
	return (
		<Tooltip>
			<TooltipTrigger render={<Button size="icon" variant="outline" />}>
				<SaveIcon />
			</TooltipTrigger>
			<TooltipContent className="pr-1.5">
				<div className="flex items-center gap-2">
					Save Changes <Kbd>S</Kbd>
				</div>
			</TooltipContent>
		</Tooltip>
	);
}

export function KbdDemoWithIconsAndText() {
	return (
		<KbdGroup>
			<Kbd>
				<ArrowLeftIcon size="small" />
				Left
			</Kbd>
			<Kbd>
				<CircleDashedIcon size="small" />
				Voice Enabled
			</Kbd>
		</KbdGroup>
	);
}

export function KbdDemoWithIcons() {
	return (
		<KbdGroup>
			<Kbd>
				<CircleDashedIcon size="small" />
			</Kbd>
			<Kbd>
				<ArrowLeftIcon size="small" />
			</Kbd>
			<Kbd>
				<ArrowRightIcon size="small" />
			</Kbd>
		</KbdGroup>
	);
}

export function KbdDemoWithSamp() {
	return (
		<Kbd>
			<samp>File</samp>
		</Kbd>
	);
}
