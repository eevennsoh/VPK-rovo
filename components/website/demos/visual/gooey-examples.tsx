"use client";

import AddIcon from "@atlaskit/icon/core/add";
import CheckMarkIcon from "@atlaskit/icon/core/check-mark";
import EmailIcon from "@atlaskit/icon/core/email";
import Image from "next/image";
import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Gooey } from "@/components/visual/gooey";
import { cn } from "@/lib/utils";

const PRIMARY_FILL = "var(--color-primary)";
const SURFACE_FILL = "var(--color-surface)";
const LIQUID_SHADOW = "0 8px 22px rgba(9, 30, 66, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.35)";

type DragPosition = Readonly<{ x: number; y: number }>;

function useDraggable(initial: DragPosition) {
	const [position, setPosition] = useState(initial);
	const [dragging, setDragging] = useState(false);
	const originRef = useRef({ pointerX: 0, pointerY: 0, x: initial.x, y: initial.y });

	function onPointerDown(event: PointerEvent<HTMLElement>) {
		event.currentTarget.setPointerCapture(event.pointerId);
		originRef.current = {
			pointerX: event.clientX,
			pointerY: event.clientY,
			x: position.x,
			y: position.y,
		};
		setDragging(true);
	}

	function onPointerMove(event: PointerEvent<HTMLElement>) {
		if (!dragging) return;
		setPosition({
			x: originRef.current.x + event.clientX - originRef.current.pointerX,
			y: originRef.current.y + event.clientY - originRef.current.pointerY,
		});
	}

	function onPointerEnd(event: PointerEvent<HTMLElement>) {
		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
		setDragging(false);
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
		setPosition((current) => ({ x: current.x + delta.x, y: current.y + delta.y }));
	}

	return {
		position,
		dragging,
		bind: {
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
				"relative flex h-[280px] w-full max-w-[294px] items-center justify-center overflow-hidden rounded-[10px] bg-bg-neutral-subtle p-4",
				className,
			)}
		>
			{children}
		</section>
	);
}

function MenuButton({ label, disabled, children, onClick }: Readonly<{ label: string; disabled?: boolean; children: ReactNode; onClick?: () => void }>) {
	return (
		<button
			type="button"
			aria-label={label}
			disabled={disabled}
			onClick={onClick}
			className="flex size-11 items-center justify-center rounded-full text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none"
		>
			{children}
		</button>
	);
}

export function GooeyMorphMenuExample() {
	const [open, setOpen] = useState(false);
	const items = [
		{ label: "Create", x: -72, y: -44, icon: <AddIcon label="" /> },
		{ label: "Email", x: 0, y: -82, icon: <EmailIcon label="" /> },
		{ label: "Confirm", x: 72, y: -44, icon: <CheckMarkIcon label="" /> },
	];

	return (
		<ExampleStage label="Morph plus menu">
			<Gooey
				fill={PRIMARY_FILL}
				shadow={LIQUID_SHADOW}
				className="relative h-44 w-56"
			>
				{items.map((item, index) => (
					<Gooey.Item
						key={item.label}
						x={open ? item.x : 0}
						y={open ? item.y : 0}
						scale={open ? 1 : 0.35}
						delay={open ? index * 45 : (items.length - index) * 25}
						transition="bouncy"
						style={{ position: "absolute", left: 90, top: 108 }}
					>
						<MenuButton label={item.label} disabled={!open}>
							<Icon render={item.icon} label="" />
						</MenuButton>
					</Gooey.Item>
				))}
				<Gooey.Item style={{ position: "absolute", left: 90, top: 108 }}>
					<MenuButton label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((current) => !current)}>
						<span aria-hidden="true" className={cn("text-2xl leading-none transition-transform duration-normal motion-reduce:transition-none", open ? "rotate-45" : "rotate-0")}>+</span>
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
			<Gooey fill={SURFACE_FILL} shadow={LIQUID_SHADOW} className="h-20 w-64">
				<Gooey.Item morph={{ shape: true, speed: 1.15, bounce: 0.35, contentBlur: 3 }}>
					<form
						onSubmit={(event) => {
							event.preventDefault();
							setSubmitted(true);
						}}
						className={cn(
							"absolute left-1/2 top-1/2 flex h-12 -translate-x-1/2 -translate-y-1/2 items-center overflow-hidden rounded-full bg-surface transition-[width] duration-slower ease-in-out motion-reduce:transition-none",
							expanded ? "w-60" : "w-12",
						)}
					>
						<button type="button" aria-label="Compose email" onClick={() => setExpanded(true)} className="flex size-12 shrink-0 items-center justify-center text-icon-brand">
							<Icon render={<EmailIcon label="" />} label="" />
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
							<Icon render={<CheckMarkIcon label="" />} label="" />
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
	const drag = useDraggable({ x: 0, y: 0 });

	return (
		<ExampleStage label="Morph avatar group with dissolve">
			<Gooey fill={SURFACE_FILL} blur={7} shadow={LIQUID_SHADOW} className="relative h-36 w-64">
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
								className="absolute left-7 top-10 size-16 touch-none rounded-full bg-surface p-1 shadow-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
							>
								<Image src={avatar.src} alt={avatar.alt} width={56} height={56} className="size-14 rounded-full object-cover" />
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
	const drag = useDraggable({ x: 0, y: 0 });

	return (
		<ExampleStage label="Morph melting cards">
			<Gooey fill={SURFACE_FILL} blur={8} shadow={LIQUID_SHADOW} className="relative h-48 w-64">
				<Gooey.Item observe dissolve={{ active: drag.dragging, strength: 0.9, gravity: 72, fadeMs: 280 }} morph={{ advanced: { blobInset: 2, bridgeGrow: 8 } }}>
					<button
						type="button"
						aria-label="Drag first card; arrow keys also move it"
						{...drag.bind}
						style={{ transform: `translate(${drag.position.x}px, ${drag.position.y}px)` }}
						className="absolute left-4 top-4 z-10 w-32 touch-none overflow-hidden rounded-xl bg-surface p-2 text-left shadow-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
					>
						<Image src="/avatar-human/bradley-phillips.png" alt="Bradley Phillips" width={112} height={70} className="h-[70px] w-28 rounded-lg object-cover" />
						<span className="mt-2 block text-xs font-medium text-text">Design review</span>
					</button>
				</Gooey.Item>
				<Gooey.Item observe>
					<article className="absolute bottom-4 right-3 w-32 overflow-hidden rounded-xl bg-surface p-2 shadow-sm">
						<Image src="/avatar-human/florence-applebee.png" alt="Florence Applebee" width={112} height={70} className="h-[70px] w-28 rounded-lg object-cover" />
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
			<Gooey fill={PRIMARY_FILL} blur={5} shadow="0 5px 14px rgba(9, 30, 66, 0.2)" className="relative h-16 w-[246px] rounded-full bg-bg-neutral p-1">
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
	const travel = 184;

	return (
		<ExampleStage label="Move liquid-rubber slider">
			<div className="w-60">
				<div className="mb-4 flex items-baseline justify-between"><span className="text-sm font-medium text-text">Intensity</span><output className="text-xs text-text-subtle">{value}%</output></div>
				<Gooey fill={PRIMARY_FILL} blur={5} className="relative h-12 w-60">
					<Gooey.Item observe>
						<span className="absolute left-3 top-[21px] h-1.5 w-[208px] rounded-full bg-primary" />
					</Gooey.Item>
					<Gooey.Item effect="move" move={{ springiness: 0.7, wobble: 0.72, stretch: 0.7, trail: 0.82 }} style={{ position: "absolute", left: 12, top: 10 }}>
						<span style={{ transform: `translateX(${(value / 100) * travel}px)` }} className="block size-7 rounded-full bg-primary shadow-sm transition-transform duration-slower ease-in-out motion-reduce:transition-none" />
					</Gooey.Item>
					<input
						type="range"
						aria-label="Liquid rubber intensity"
						min={0}
						max={100}
						value={value}
						onChange={(event) => setValue(Number(event.currentTarget.value))}
						className="absolute inset-x-3 top-2 z-10 h-8 cursor-pointer opacity-0"
					/>
				</Gooey>
			</div>
		</ExampleStage>
	);
}
