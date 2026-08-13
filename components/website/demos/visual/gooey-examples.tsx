"use client";

import Image from "next/image";
import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckIcon, EmailIcon, FileIcon, FolderIcon, ImageIcon, PlusIcon } from "@/components/ui/vpk-icons";
import { Gooey } from "@/components/visual/gooey";
import { cn } from "@/lib/utils";

const PRIMARY_FILL = "var(--color-primary)";
const SURFACE_FILL = "var(--color-surface)";
/** Pinned upstream "Figma soft" surface treatment. Every layer is rendered
 * from the merged SVG silhouette so its ring and elevation morph with the goo.
 * `light-dark()` follows VPK's document color-scheme without duplicating DOM
 * borders on the interactive children. */
export const GOOEY_SOURCE_SHADOW = [
	"0 0 0 1px light-dark(transparent, rgba(255, 255, 255, 0.04)) inset",
	"0 1px 0 0 light-dark(transparent, rgba(255, 255, 255, 0.03)) inset",
	"0 0 0 1px rgba(0, 0, 0, 0.06)",
	"0 2px 6px 0 rgba(0, 0, 0, 0.05)",
	"0 4px 42px 0 light-dark(rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.24))",
].join(", ");

const GOOEY_PILL_SHADOW = [
	"0 1px 3px light-dark(rgba(0, 0, 0, 0.11), rgba(0, 0, 0, 0.5))",
	"0 1px 1px light-dark(rgba(0, 0, 0, 0.07), rgba(0, 0, 0, 0.35))",
].join(", ");

const GOOEY_THUMB_SHADOW = [
	"0 0 0 1px light-dark(transparent, rgba(255, 255, 255, 0.04)) inset",
	"0 1px 0 0 light-dark(transparent, rgba(255, 255, 255, 0.03)) inset",
	"0 0 0 1px light-dark(rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.06))",
	"0 1px 5px light-dark(rgba(0, 0, 0, 0.08), transparent)",
	"0 2px 6px 0 light-dark(transparent, rgba(0, 0, 0, 0.05))",
	"0 4px 42px 0 light-dark(transparent, rgba(0, 0, 0, 0.24))",
].join(", ");

type DragPosition = Readonly<{ x: number; y: number }>;
type DragBounds = Readonly<{ minX: number; maxX: number; minY: number; maxY: number }>;

function clampPosition(position: DragPosition, bounds?: DragBounds): DragPosition {
	if (!bounds) return position;
	return {
		x: Math.min(bounds.maxX, Math.max(bounds.minX, position.x)),
		y: Math.min(bounds.maxY, Math.max(bounds.minY, position.y)),
	};
}

export function useGooeyDemoDrag(
	position: DragPosition,
	onPositionChange: (position: DragPosition) => void,
	bounds?: DragBounds,
	onActivate?: () => void,
) {
	const [dragging, setDragging] = useState(false);
	const draggingRef = useRef(false);
	const movedRef = useRef(false);
	const originRef = useRef({ pointerX: 0, pointerY: 0, x: position.x, y: position.y });

	function onPointerDown(event: PointerEvent<HTMLElement>) {
		event.currentTarget.setPointerCapture(event.pointerId);
		draggingRef.current = true;
		movedRef.current = false;
		originRef.current = {
			pointerX: event.clientX,
			pointerY: event.clientY,
			x: position.x,
			y: position.y,
		};
		setDragging(true);
	}

	function onPointerMove(event: PointerEvent<HTMLElement>) {
		if (!draggingRef.current) return;
		const pointerDeltaX = event.clientX - originRef.current.pointerX;
		const pointerDeltaY = event.clientY - originRef.current.pointerY;
		if (Math.abs(pointerDeltaX) > 2 || Math.abs(pointerDeltaY) > 2) movedRef.current = true;
		onPositionChange(clampPosition({
			x: originRef.current.x + pointerDeltaX,
			y: originRef.current.y + pointerDeltaY,
		}, bounds));
	}

	function onPointerEnd(event: PointerEvent<HTMLElement>) {
		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
		draggingRef.current = false;
		setDragging(false);
	}

	function onClick() {
		if (movedRef.current) {
			movedRef.current = false;
			return;
		}
		onActivate?.();
	}

	function onKeyDown(event: KeyboardEvent<HTMLElement>) {
		const amount = event.shiftKey ? 10 : 2;
		const delta = {
			ArrowLeft: { x: -amount, y: 0 },
			ArrowRight: { x: amount, y: 0 },
			ArrowUp: { x: 0, y: -amount },
			ArrowDown: { x: 0, y: amount },
		}[event.key];
		if (!delta) return;
		event.preventDefault();
		onPositionChange(clampPosition({ x: position.x + delta.x, y: position.y + delta.y }, bounds));
	}

	return {
		position,
		dragging,
		bind: {
			onClick,
			onPointerDown,
			onPointerMove,
			onPointerUp: onPointerEnd,
			onPointerCancel: onPointerEnd,
			onKeyDown,
		},
	};
}

function ExampleStage({ label, children, className }: Readonly<{ label: string; children: ReactNode; className?: string }>) {
	return (
		<section
			aria-label={label}
			className={cn(
				"relative flex min-h-[352px] w-full flex-1 self-stretch items-center justify-center overflow-visible rounded-[10px] bg-bg-neutral-subtle p-0 sm:p-6",
				className,
			)}
		>
			{children}
		</section>
	);
}

function MenuButton({ label, disabled, expanded, children, onClick }: Readonly<{ label: string; disabled?: boolean; expanded?: boolean; children: ReactNode; onClick?: () => void }>) {
	return (
		<button
			type="button"
			aria-label={label}
			aria-expanded={expanded}
			disabled={disabled}
			onClick={onClick}
			className="flex size-10 items-center justify-center rounded-full text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none"
		>
			{children}
		</button>
	);
}

export function GooeyMorphMenuExample() {
	const [open, setOpen] = useState(false);
	const items = [
		{ label: "New file", x: -54, y: -34, icon: <FileIcon size="small" aria-hidden /> },
		{ label: "Add image", x: 0, y: -64, icon: <ImageIcon size="small" aria-hidden /> },
		{ label: "New folder", x: 54, y: -34, icon: <FolderIcon size="small" aria-hidden /> },
	];

	return (
		<ExampleStage label="Morph plus menu">
			<Gooey
				fill={PRIMARY_FILL}
				shadow={GOOEY_SOURCE_SHADOW}
				className="relative h-[140px] w-[200px]"
			>
				{items.map((item, index) => (
					<Gooey.Item
						key={item.label}
						x={open ? item.x : 0}
						y={open ? item.y : 0}
						delay={open ? index * 45 : (items.length - index) * 25}
						transition="bouncy"
						style={{ position: "absolute", left: 80, top: 80 }}
					>
						<MenuButton label={item.label} disabled={!open} onClick={() => setOpen(false)}>
							<span
								aria-hidden="true"
								style={{ transitionDelay: open ? `${120 + index * 45}ms` : "0ms" }}
								className={cn(
									"flex items-center justify-center transition-[opacity,filter] duration-normal ease-out-practical motion-reduce:transition-none",
									open ? "opacity-100 blur-none" : "opacity-0 blur-[2px]",
								)}
							>
								{item.icon}
							</span>
						</MenuButton>
					</Gooey.Item>
				))}
				<Gooey.Item style={{ position: "absolute", left: 80, top: 80 }}>
					<MenuButton label={open ? "Close menu" : "Open menu"} expanded={open} onClick={() => setOpen((current) => !current)}>
						<PlusIcon aria-hidden className={cn("transition-transform duration-normal ease-in-out motion-reduce:transition-none", open ? "rotate-45" : "rotate-0")} />
					</MenuButton>
				</Gooey.Item>
			</Gooey>
		</ExampleStage>
	);
}

export function GooeyMorphEmailExample() {
	const [email, setEmail] = useState("");
	const [expanded, setExpanded] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	return (
		<ExampleStage label="Morph email input">
			<Gooey fill={SURFACE_FILL} shadow={GOOEY_SOURCE_SHADOW} className="h-20 w-full max-w-64">
				<Gooey.Item morph={{ shape: true, speed: 1.15, bounce: 0.35, contentBlur: 3 }}>
					<form
						onSubmit={(event) => {
							event.preventDefault();
							setSubmitted(true);
						}}
						className={cn(
							"absolute left-1/2 top-1/2 flex h-12 -translate-x-1/2 -translate-y-1/2 items-center overflow-hidden rounded-full transition-[width] duration-slower ease-in-out motion-reduce:transition-none",
							expanded ? "w-60" : "w-12",
						)}
					>
						<button type="button" aria-label="Compose email" onClick={() => setExpanded(true)} className="flex size-12 shrink-0 items-center justify-center text-icon-brand">
							<EmailIcon size="small" aria-hidden />
						</button>
						<Input
							type="email"
							aria-label="Email address"
							placeholder="you@example.com"
							value={email}
							onFocus={() => setExpanded(true)}
							onChange={(event) => {
								setEmail(event.currentTarget.value);
								setSubmitted(false);
							}}
							className="border-0 px-0 focus-visible:ring-0"
						/>
						<Button type="submit" size="icon" shape="circle" aria-label="Submit email" className="mr-1 size-10 shrink-0">
							<CheckIcon size="small" aria-hidden />
						</Button>
					</form>
				</Gooey.Item>
			</Gooey>
			<p aria-live="polite" className="absolute bottom-8 text-xs text-text-subtle">{submitted ? `Saved ${email || "email"}` : "Focus to expand"}</p>
		</ExampleStage>
	);
}

const AVATARS = [
	{ src: "/avatar-human/mia-mcdougall.png", alt: "Mia McDougall" },
	{ src: "/avatar-human/annie-clare.png", alt: "Annie Clare" },
	{ src: "/avatar-human/maclaughlin-tai.png", alt: "Maclaughlin Tai" },
];

export function GooeyMorphAvatarExample() {
	const [position, setPosition] = useState<DragPosition>({ x: 0, y: 0 });
	const drag = useGooeyDemoDrag(position, setPosition, { minX: -24, maxX: 144, minY: -48, maxY: 48 });

	return (
		<ExampleStage label="Morph avatar group with dissolve">
			<Gooey fill={SURFACE_FILL} blur={7} shadow={GOOEY_SOURCE_SHADOW} className="relative h-36 w-full max-w-64">
				{AVATARS.map((avatar, index) => {
					const draggable = index === 0;
					return (
						<Gooey.Item
							key={avatar.src}
							observe
							dissolve={draggable ? { active: drag.dragging, fadeMs: 240, sink: 0.8 } : false}
							morph={{ advanced: { blobInset: 3, bridgeGrow: 7 } }}
						>
							<button
								type="button"
								aria-label={draggable ? `Drag ${avatar.alt}; arrow keys also move it` : avatar.alt}
								{...(draggable ? drag.bind : {})}
								style={{ transform: `translate(${index * 66 + (draggable ? drag.position.x : 0)}px, ${draggable ? drag.position.y : 0}px)` }}
								className="absolute left-7 top-10 size-16 touch-none rounded-full p-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
							>
								<Image src={avatar.src} alt={avatar.alt} width={56} height={56} draggable={false} className="pointer-events-none size-14 select-none rounded-full object-cover [outline:1px_solid_var(--color-border)] [outline-offset:-1px]" />
							</button>
						</Gooey.Item>
					);
				})}
			</Gooey>
			<p className="absolute bottom-7 text-xs text-text-subtle">Drag the first avatar into the group</p>
		</ExampleStage>
	);
}

export function GooeyMorphCardsExample() {
	const [position, setPosition] = useState<DragPosition>({ x: 0, y: 0 });
	const drag = useGooeyDemoDrag(position, setPosition, { minX: -24, maxX: 112, minY: -16, maxY: 72 });

	return (
		<ExampleStage label="Morph melting cards">
			<Gooey fill={SURFACE_FILL} blur={8} shadow={GOOEY_SOURCE_SHADOW} className="relative h-48 w-full max-w-64">
				<Gooey.Item observe dissolve={{ active: drag.dragging, strength: 0.9, gravity: 72, fadeMs: 280 }} morph={{ advanced: { blobInset: 2, bridgeGrow: 8 } }}>
					<button
						type="button"
						aria-label="Drag first card; arrow keys also move it"
						{...drag.bind}
						style={{ transform: `translate(${drag.position.x}px, ${drag.position.y}px)` }}
						className="absolute left-4 top-4 z-10 w-32 touch-none overflow-hidden rounded-xl p-2 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
					>
						<Image src="/avatar-human/bradley-phillips.png" alt="Bradley Phillips" width={112} height={70} draggable={false} className="pointer-events-none h-[70px] w-28 select-none rounded-lg object-cover" />
						<span className="mt-2 block text-xs font-medium text-text">Design review</span>
					</button>
				</Gooey.Item>
				<Gooey.Item observe>
					<article className="absolute bottom-4 right-3 w-32 overflow-hidden rounded-xl p-2">
						<Image src="/avatar-human/florence-applebee.png" alt="Florence Applebee" width={112} height={70} draggable={false} className="pointer-events-none h-[70px] w-28 select-none rounded-lg object-cover" />
						<span className="mt-2 block text-xs font-medium text-text">Ready to merge</span>
					</article>
				</Gooey.Item>
			</Gooey>
		</ExampleStage>
	);
}

const TAB_LABELS = ["Inbox", "Work", "Done"] as const;

export function GooeyMoveTabsExample() {
	const [active, setActive] = useState(0);

	return (
		<ExampleStage label="Move gooey tabs">
			<Gooey fill={PRIMARY_FILL} blur={5} shadow={GOOEY_PILL_SHADOW} className="relative h-16 w-full max-w-[246px] rounded-full bg-bg-neutral p-1">
				<Gooey.Item effect="move" move={{ springiness: 0.55, wobble: 0.62, stretch: 0.44, trail: 0.72 }} style={{ position: "absolute", left: 4, top: 4 }}>
					<span style={{ transform: `translateX(${active * 79}px)` }} className="block h-14 w-[75px] rounded-full transition-transform duration-slower ease-in-out motion-reduce:transition-none" />
				</Gooey.Item>
				<div role="tablist" aria-label="Gooey tabs" className="absolute inset-1 z-10 grid grid-cols-3">
					{TAB_LABELS.map((label, index) => (
						<button key={label} type="button" role="tab" aria-selected={active === index} onClick={() => setActive(index)} className={cn("rounded-full text-xs font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50", active === index ? "text-primary-foreground" : "text-text-subtle")}>{label}</button>
					))}
				</div>
			</Gooey>
		</ExampleStage>
	);
}

export function GooeyMoveSliderExample() {
	const [value, setValue] = useState(48);
	const travel = 188;

	return (
		<ExampleStage label="Move liquid-rubber slider">
			<div className="w-full max-w-60">
				<div className="mb-4 flex items-baseline justify-between"><span className="text-sm font-medium text-text">Intensity</span><output className="text-xs text-text-subtle">{value}%</output></div>
				<Gooey fill={PRIMARY_FILL} blur={5} shadow={GOOEY_THUMB_SHADOW} className="relative h-20 w-full">
					<span aria-hidden="true" data-gooey-slider-track="" className="absolute inset-x-[14px] top-[38px] h-2 rounded-sm bg-primary" />
					<Gooey.Item effect="move" move={{ springiness: 0.5, stretch: 0.6, trail: 0.35 }} style={{ position: "absolute", left: 14, top: 30 }}>
						<span
							aria-hidden="true"
							data-gooey-slider-thumb=""
							style={{ transform: `translateX(${(value / 100) * travel}px)` }}
							className="block size-6 rounded-full"
						/>
					</Gooey.Item>
					<input
						type="range"
						aria-label="Liquid rubber intensity"
						min={0}
						max={100}
						value={value}
						onChange={(event) => setValue(Number(event.currentTarget.value))}
						className="absolute inset-x-[14px] top-6 z-10 h-10 cursor-pointer opacity-0"
					/>
				</Gooey>
			</div>
		</ExampleStage>
	);
}
