import {
	DEFAULT_INK_WASH_CONFIG,
	HOUSE_INK_ABSORPTION,
	type InkWashAbsorption,
	type InkWashConfig,
	type InkWashMode,
	type InkWashPreset,
	type InkWashScriptAction,
	clampInkWashParams,
	getInkWashPreset,
	inkWashAbsorptionFromHex,
	mergeInkWashConfig,
} from "./data";

type ProgramInfo = Readonly<{
	program: WebGLProgram;
	uniforms: Record<string, WebGLUniformLocation | null>;
	bind: () => void;
}>;

type Target = Readonly<{
	texture: WebGLTexture;
	framebuffer: WebGLFramebuffer;
	width: number;
	height: number;
	texel: readonly [number, number];
	attach: (unit: number) => number;
}>;

type DoubleTarget = Readonly<{
	width: number;
	height: number;
	texel: readonly [number, number];
	getRead: () => Target;
	getWrite: () => Target;
	swap: () => void;
	targets: readonly [Target, Target];
}>;

type PointerState = {
	down: boolean;
	tx: number;
	ty: number;
	bx: number;
	by: number;
	speed: number;
	simPressure: number;
	force: number;
	hasForce: boolean;
	forceTime: number;
	barrel: boolean;
	type: string;
};

type BrushFootprint = {
	x: number;
	y: number;
	r: number;
};

type EnginePrograms = Readonly<{
	copy: ProgramInfo;
	splat: ProgramInfo;
	advectVelocity: ProgramInfo;
	advectWet: ProgramInfo;
	advectInk: ProgramInfo;
	divergence: ProgramInfo;
	pressure: ProgramInfo;
	gradientSubtract: ProgramInfo;
	curl: ProgramInfo;
	vorticity: ProgramInfo;
	exchange: ProgramInfo;
	display: ProgramInfo;
	debug: ProgramInfo;
}>;

type EngineTargets = {
	velocity: DoubleTarget;
	divergence: Target;
	curl: Target;
	pressure: DoubleTarget;
	ink: DoubleTarget;
	fixed: DoubleTarget;
	wet: DoubleTarget;
};

const VERTEX_SHADER = `#version 300 es
precision highp float;
layout(location=0) in vec2 aPos;
out vec2 vUv;
void main(){
	vUv = aPos * 0.5 + 0.5;
	gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const COPY_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uTex;
uniform float uValue;
void main(){
	o = texture(uTex, vUv) * uValue;
}`;

const SPLAT_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform float uAspect;
uniform vec2 uPoint;
uniform vec4 uColor;
uniform float uRadius;
void main(){
	vec2 p = vUv - uPoint;
	p.x *= uAspect;
	o = uColor * exp(-dot(p, p) / uRadius);
}`;

const ADVECT_VELOCITY_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uVelocity;
uniform sampler2D uWet;
uniform vec2 uTexel;
uniform float uDt;
uniform float uDissipation;
void main(){
	vec2 coord = vUv - uDt * texture(uVelocity, vUv).xy * uTexel;
	vec2 vel = texture(uVelocity, coord).xy * uDissipation;
	float wet = texture(uWet, vUv).x;
	float mask = smoothstep(0.005, 0.2, wet);
	o = vec4(vel * mask, 0.0, 1.0);
}`;

const ADVECT_WET_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uVelocity;
uniform sampler2D uWet;
uniform vec2 uTexel;
uniform vec2 uSrcTexel;
uniform float uDt;
uniform float uDecay;
uniform float uSpread;
void main(){
	vec2 coord = vUv - uDt * texture(uVelocity, vUv).xy * uTexel * 0.6;
	float wet = texture(uWet, coord).x;
	vec2 b = uSrcTexel * 1.6;
	float neighbors = (
		texture(uWet, coord + vec2(b.x, 0.0)).x +
		texture(uWet, coord - vec2(b.x, 0.0)).x +
		texture(uWet, coord + vec2(0.0, b.y)).x +
		texture(uWet, coord - vec2(0.0, b.y)).x
	) * 0.25;
	wet = mix(wet, neighbors, uSpread);
	o = vec4(wet * uDecay, 0.0, 0.0, 1.0);
}`;

const ADVECT_INK_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform sampler2D uWet;
uniform vec2 uTexel;
uniform vec2 uSrcTexel;
uniform float uDt;
uniform float uBleed;
uniform float uAspect;
uniform vec3 uChroma;
uniform vec3 uBrush;
void main(){
	float wet = texture(uWet, vUv).x;
	float mobility = smoothstep(0.02, 0.45, wet);
	vec4 current = texture(uSource, vUv);
	if (mobility < 0.002) {
		o = current;
		return;
	}
	vec2 velocity = texture(uVelocity, vUv).xy;
	vec2 coord = vUv - uDt * velocity * uTexel * mobility;
	vec4 advected = texture(uSource, coord);
	float brush = 0.0;
	if (uBrush.z > 0.0) {
		vec2 d = vUv - uBrush.xy;
		d.x *= uAspect;
		brush = exp(-dot(d, d) / (uBrush.z * uBrush.z));
	}
	vec2 b = uSrcTexel * 1.6;
	vec4 neighbors = (
		texture(uSource, coord + vec2(b.x, 0.0)) +
		texture(uSource, coord - vec2(b.x, 0.0)) +
		texture(uSource, coord + vec2(0.0, b.y)) +
		texture(uSource, coord - vec2(0.0, b.y))
	) * 0.25;
	vec4 bleed = clamp(uBleed * (0.25 + 1.3 * brush) * mobility * vec4(uChroma, 1.05), 0.0, 0.92);
	vec4 mixed = mix(advected, neighbors, bleed);
	o = mix(current, mixed, mobility);
}`;

const DIVERGENCE_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uVelocity;
uniform vec2 uTexel;
void main(){
	float l = texture(uVelocity, vUv - vec2(uTexel.x, 0.0)).x;
	float r = texture(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
	float b = texture(uVelocity, vUv - vec2(0.0, uTexel.y)).y;
	float t = texture(uVelocity, vUv + vec2(0.0, uTexel.y)).y;
	o = vec4(0.5 * (r - l + t - b), 0.0, 0.0, 1.0);
}`;

const PRESSURE_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 uTexel;
void main(){
	float l = texture(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
	float r = texture(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
	float b = texture(uPressure, vUv - vec2(0.0, uTexel.y)).x;
	float t = texture(uPressure, vUv + vec2(0.0, uTexel.y)).x;
	float div = texture(uDivergence, vUv).x;
	o = vec4((l + r + b + t - div) * 0.25, 0.0, 0.0, 1.0);
}`;

const GRADIENT_SUBTRACT_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
uniform vec2 uTexel;
void main(){
	float l = texture(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
	float r = texture(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
	float b = texture(uPressure, vUv - vec2(0.0, uTexel.y)).x;
	float t = texture(uPressure, vUv + vec2(0.0, uTexel.y)).x;
	vec2 vel = texture(uVelocity, vUv).xy - 0.5 * vec2(r - l, t - b);
	o = vec4(vel, 0.0, 1.0);
}`;

const CURL_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uVelocity;
uniform vec2 uTexel;
void main(){
	float l = texture(uVelocity, vUv - vec2(uTexel.x, 0.0)).y;
	float r = texture(uVelocity, vUv + vec2(uTexel.x, 0.0)).y;
	float b = texture(uVelocity, vUv - vec2(0.0, uTexel.y)).x;
	float t = texture(uVelocity, vUv + vec2(0.0, uTexel.y)).x;
	o = vec4(0.5 * ((r - l) - (t - b)), 0.0, 0.0, 1.0);
}`;

const VORTICITY_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform vec2 uTexel;
uniform float uCurlAmt;
uniform float uDt;
void main(){
	float l = texture(uCurl, vUv - vec2(uTexel.x, 0.0)).x;
	float r = texture(uCurl, vUv + vec2(uTexel.x, 0.0)).x;
	float b = texture(uCurl, vUv - vec2(0.0, uTexel.y)).x;
	float t = texture(uCurl, vUv + vec2(0.0, uTexel.y)).x;
	float c = texture(uCurl, vUv).x;
	vec2 force = 0.5 * vec2(abs(t) - abs(b), abs(r) - abs(l));
	force /= length(force) + 0.0001;
	force *= uCurlAmt * c * vec2(1.0, -1.0);
	vec2 vel = texture(uVelocity, vUv).xy + force * uDt;
	o = vec4(clamp(vel, -1000.0, 1000.0), 0.0, 1.0);
}`;

const EXCHANGE_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uFixed;
uniform sampler2D uInk;
uniform sampler2D uWet;
uniform float uSettle;
uniform float uDt;
uniform float uAspect;
uniform float uMode;
uniform vec3 uBrush;
void main(){
	vec4 fixedInk = texture(uFixed, vUv);
	vec4 mobileInk = texture(uInk, vUv);
	float wet = clamp(texture(uWet, vUv).x, 0.0, 1.0);
	float brush = 0.0;
	if (uBrush.z > 0.0) {
		vec2 d = vUv - uBrush.xy;
		d.x *= uAspect;
		brush = exp(-dot(d, d) / (uBrush.z * uBrush.z));
	}
	float lift = 0.0 * wet * brush * uDt;
	if (uMode < 0.5) {
		vec3 fixedDensity = fixedInk.rgb * (1.0 - lift) + mobileInk.rgb * uSettle;
		float fixedWhite = fixedInk.a * (1.0 - lift) + mobileInk.a * uSettle;
		if (uSettle > 0.0) {
			float coverage = (1.0 - exp(-2.2 * fixedWhite)) * uSettle;
			vec3 transmittance = exp(-fixedDensity);
			fixedDensity = -log(clamp(transmittance * (1.0 - coverage) + coverage, 0.0001, 1.0));
			fixedWhite *= 1.0 - uSettle;
		}
		o = vec4(fixedDensity, fixedWhite);
	} else {
		o = mobileInk * (1.0 - uSettle) + fixedInk * lift;
	}
}`;

const DISPLAY_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uInk;
uniform sampler2D uFixed;
uniform sampler2D uWet;
uniform vec2 uTexel;
uniform vec2 uRes;
uniform float uInkStrength;
uniform float uEdge;
uniform float uGrain;
uniform float uWhiteTint;
uniform float uPaperOn;
uniform float uWetDark;
uniform float uVignette;
float hash(vec2 p){
	p = fract(p * vec2(123.34, 456.21));
	p += dot(p, p + 45.32);
	return fract(p.x * p.y);
}
float vnoise(vec2 p){
	vec2 i = floor(p);
	vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	float a = hash(i);
	float b = hash(i + vec2(1.0, 0.0));
	float c = hash(i + vec2(0.0, 1.0));
	float d = hash(i + vec2(1.0, 1.0));
	return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p){
	float value = 0.0;
	float amp = 0.5;
	for (int i = 0; i < 4; i++) {
		value += amp * vnoise(p);
		p *= 2.07;
		amp *= 0.5;
	}
	return value;
}
vec4 pigment(vec2 uv){
	return texture(uInk, uv) + texture(uFixed, uv);
}
void main(){
	vec4 pw = pigment(vUv);
	vec3 density = pw.rgb;
	float total = dot(density, vec3(1.0));
	float l = dot(pigment(vUv - vec2(uTexel.x, 0.0)).rgb, vec3(1.0));
	float r = dot(pigment(vUv + vec2(uTexel.x, 0.0)).rgb, vec3(1.0));
	float b = dot(pigment(vUv - vec2(0.0, uTexel.y)).rgb, vec3(1.0));
	float t = dot(pigment(vUv + vec2(0.0, uTexel.y)).rgb, vec3(1.0));
	float edge = length(vec2(r - l, t - b));
	vec2 px = vUv * uRes;
	float fiber = fbm(px * 0.055);
	float tooth = vnoise(px * 0.42);
	float grain = fbm(px * 0.12 + 31.7);
	vec3 paper = vec3(0.962, 0.954, 0.930);
	if (uPaperOn > 0.5) {
		paper -= (fiber - 0.5) * 0.05;
		paper -= (tooth - 0.5) * 0.022;
	}
	vec3 absorption = density * uInkStrength;
	absorption *= 1.0 + (grain - 0.5) * uGrain * clamp(total * 2.0, 0.0, 1.0);
	absorption *= 1.0 + edge * uEdge;
	vec3 color = paper * exp(-absorption);
	float coverage = 1.0 - exp(-pw.a * 2.2);
	coverage = clamp(coverage * (1.0 - (grain - 0.5) * 0.35), 0.0, 1.0);
	vec3 whiteColor = mix(vec3(0.985, 0.982, 0.972), vec3(0.945, 0.955, 1.0), uWhiteTint);
	color = mix(color, whiteColor, coverage);
	float wet = texture(uWet, vUv).x;
	float wetMask = smoothstep(0.02, 0.6, wet) * uWetDark;
	color *= vec3(1.0) - wetMask * vec3(0.16, 0.15, 0.11);
	vec2 q = vUv - 0.5;
	color *= 1.0 - dot(q, q) * 0.16 * uVignette;
	o = vec4(color, 1.0);
}`;

const DEBUG_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uInk;
uniform sampler2D uFixed;
uniform sampler2D uWet;
uniform sampler2D uVelocity;
uniform float uView;
vec3 hsv2rgb(vec3 c){
	vec4 k = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
	vec3 p = abs(fract(c.xxx + k.xyz) * 6.0 - k.www);
	return c.z * mix(k.xxx, clamp(p - k.xxx, 0.0, 1.0), c.y);
}
void main(){
	if (uView < 1.5) {
		vec4 pigment = texture(uInk, vUv) + texture(uFixed, vUv);
		vec3 density = pigment.rgb;
		float white = pigment.a;
		o = vec4(vec3(1.0) - exp(-density * 1.4) + white * 0.6, 1.0);
		return;
	}
	if (uView < 2.5) {
		float wet = texture(uWet, vUv).x;
		o = vec4(vec3(wet), 1.0);
		return;
	}
	vec2 velocity = texture(uVelocity, vUv).xy;
	float angle = atan(velocity.y, velocity.x) / 6.2831853 + 0.5;
	float speed = clamp(length(velocity) / 120.0, 0.0, 1.0);
	o = vec4(hsv2rgb(vec3(angle, 0.75, speed)), 1.0);
}`;

const PRESSURE_ITERATIONS = 22;
const MAX_DPR = 2;

const QUALITY_BASES: Record<InkWashConfig["quality"], { sim: number; dye: number }> = {
	low: { sim: 64, dye: 360 },
	medium: { sim: 128, dye: 720 },
	high: { sim: 192, dye: 1200 },
};

function isStrokeAction(action: InkWashScriptAction): action is Extract<InkWashScriptAction, { t0: number }> {
	return "t0" in action;
}

function assertPresent<T>(value: T | null, message: string): T {
	if (value === null) throw new Error(message);
	return value;
}

function getResolution(base: number, aspect: number): { width: number; height: number } {
	return aspect > 1
		? { width: Math.round(base * aspect), height: base }
		: { width: base, height: Math.round(base / aspect) };
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

function viewIndex(view: InkWashConfig["view"]): number {
	switch (view) {
		case "pigment":
			return 1;
		case "water":
			return 2;
		case "flow":
			return 3;
		case "painting":
		default:
			return 0;
	}
}

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
	const shader = assertPresent(gl.createShader(type), "Unable to create Ink Wash shader.");
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const info = gl.getShaderInfoLog(shader) ?? "Unknown shader error";
		gl.deleteShader(shader);
		throw new Error(`Ink Wash shader compile failed: ${info}`);
	}
	return shader;
}

function createProgram(
	gl: WebGL2RenderingContext,
	vertexShader: WebGLShader,
	fragmentSource: string,
): ProgramInfo {
	const program = assertPresent(gl.createProgram(), "Unable to create Ink Wash program.");
	const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	gl.deleteShader(fragmentShader);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		const info = gl.getProgramInfoLog(program) ?? "Unknown program error";
		gl.deleteProgram(program);
		throw new Error(`Ink Wash program link failed: ${info}`);
	}

	const uniforms: Record<string, WebGLUniformLocation | null> = {};
	const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
	for (let index = 0; index < count; index += 1) {
		const active = gl.getActiveUniform(program, index);
		if (active) uniforms[active.name] = gl.getUniformLocation(program, active.name);
	}

	return {
		program,
		uniforms,
		bind: () => gl.useProgram(program),
	};
}

function createTarget(
	gl: WebGL2RenderingContext,
	width: number,
	height: number,
	internalFormat: number,
	format: number,
	type: number,
	filter: number,
): Target {
	const texture = assertPresent(gl.createTexture(), "Unable to create Ink Wash texture.");
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, null);

	const framebuffer = assertPresent(gl.createFramebuffer(), "Unable to create Ink Wash framebuffer.");
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
	gl.viewport(0, 0, width, height);
	gl.clearColor(0, 0, 0, 0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	const target: Target = {
		texture,
		framebuffer,
		width,
		height,
		texel: [1 / width, 1 / height],
		attach: (unit: number) => {
			gl.activeTexture(gl.TEXTURE0 + unit);
			gl.bindTexture(gl.TEXTURE_2D, texture);
			return unit;
		},
	};
	return target;
}

function createDoubleTarget(
	gl: WebGL2RenderingContext,
	width: number,
	height: number,
	internalFormat: number,
	format: number,
	type: number,
	filter: number,
): DoubleTarget {
	let read = createTarget(gl, width, height, internalFormat, format, type, filter);
	let write = createTarget(gl, width, height, internalFormat, format, type, filter);

	return {
		width,
		height,
		texel: [1 / width, 1 / height],
		getRead: () => read,
		getWrite: () => write,
		swap: () => {
			const next = read;
			read = write;
			write = next;
		},
		targets: [read, write],
	};
}

function deleteTarget(gl: WebGL2RenderingContext, target: Target) {
	gl.deleteFramebuffer(target.framebuffer);
	gl.deleteTexture(target.texture);
}

function deleteDoubleTarget(gl: WebGL2RenderingContext, target: DoubleTarget) {
	for (const singleTarget of target.targets) {
		deleteTarget(gl, singleTarget);
	}
}

function setUniform1i(gl: WebGL2RenderingContext, program: ProgramInfo, name: string, value: number) {
	gl.uniform1i(program.uniforms[name], value);
}

function setUniform1f(gl: WebGL2RenderingContext, program: ProgramInfo, name: string, value: number) {
	gl.uniform1f(program.uniforms[name], value);
}

function setUniform2f(gl: WebGL2RenderingContext, program: ProgramInfo, name: string, x: number, y: number) {
	gl.uniform2f(program.uniforms[name], x, y);
}

function setUniform3f(gl: WebGL2RenderingContext, program: ProgramInfo, name: string, x: number, y: number, z: number) {
	gl.uniform3f(program.uniforms[name], x, y, z);
}

function setUniform4f(
	gl: WebGL2RenderingContext,
	program: ProgramInfo,
	name: string,
	x: number,
	y: number,
	z: number,
	w: number,
) {
	gl.uniform4f(program.uniforms[name], x, y, z, w);
}

export interface InkWashEngineOptions {
	config?: Partial<InkWashConfig>;
	preset?: InkWashPreset | string;
}

export class InkWashEngine {
	private readonly canvas: HTMLCanvasElement;
	private readonly gl: WebGL2RenderingContext;
	private readonly programs: EnginePrograms;
	private readonly vertexShader: WebGLShader;
	private readonly vao: WebGLVertexArrayObject;
	private readonly vbo: WebGLBuffer;
	private readonly pointerAbort = new AbortController();
	private config: InkWashConfig;
	private preset: InkWashPreset;
	private targets!: EngineTargets;
	private animationFrame: number | null = null;
	private lastFrameTime = 0;
	private scriptTime = 0;
	private scriptDisabled = false;
	private activeScriptActionIndex = -1;
	private triggeredCommands = new Set<number>();
	private scriptMode: InkWashMode = "pen";
	private scriptBrushInk: number | null = null;
	private scriptInkAbsorption: InkWashAbsorption | null = null;
	private fixTimer = 0;
	private readonly brush: BrushFootprint = { x: 0, y: 0, r: 0 };
	private readonly pointer: PointerState = {
		down: false,
		tx: 0.5,
		ty: 0.5,
		bx: 0.5,
		by: 0.5,
		speed: 0,
		simPressure: 0.35,
		force: 0,
		hasForce: false,
		forceTime: 0,
		barrel: false,
		type: "mouse",
	};

	constructor(canvas: HTMLCanvasElement, options: InkWashEngineOptions = {}) {
		this.canvas = canvas;
		this.preset = typeof options.preset === "string"
			? getInkWashPreset(options.preset)
			: options.preset ?? getInkWashPreset("landscape");
		this.config = mergeInkWashConfig(this.preset.config, options.config);

		const gl = canvas.getContext("webgl2", {
			alpha: false,
			antialias: false,
			depth: false,
			preserveDrawingBuffer: true,
			stencil: false,
		});
		if (!gl) throw new Error("Ink Wash needs WebGL2.");
		if (!gl.getExtension("EXT_color_buffer_float")) {
			throw new Error("Ink Wash needs EXT_color_buffer_float.");
		}
		this.gl = gl;
		gl.disable(gl.BLEND);

		this.vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
		this.programs = {
			copy: createProgram(gl, this.vertexShader, COPY_SHADER),
			splat: createProgram(gl, this.vertexShader, SPLAT_SHADER),
			advectVelocity: createProgram(gl, this.vertexShader, ADVECT_VELOCITY_SHADER),
			advectWet: createProgram(gl, this.vertexShader, ADVECT_WET_SHADER),
			advectInk: createProgram(gl, this.vertexShader, ADVECT_INK_SHADER),
			divergence: createProgram(gl, this.vertexShader, DIVERGENCE_SHADER),
			pressure: createProgram(gl, this.vertexShader, PRESSURE_SHADER),
			gradientSubtract: createProgram(gl, this.vertexShader, GRADIENT_SUBTRACT_SHADER),
			curl: createProgram(gl, this.vertexShader, CURL_SHADER),
			vorticity: createProgram(gl, this.vertexShader, VORTICITY_SHADER),
			exchange: createProgram(gl, this.vertexShader, EXCHANGE_SHADER),
			display: createProgram(gl, this.vertexShader, DISPLAY_SHADER),
			debug: createProgram(gl, this.vertexShader, DEBUG_SHADER),
		};

		this.vao = assertPresent(gl.createVertexArray(), "Unable to create Ink Wash vertex array.");
		gl.bindVertexArray(this.vao);
		this.vbo = assertPresent(gl.createBuffer(), "Unable to create Ink Wash vertex buffer.");
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

		this.resize();
		this.targets = this.createTargets();
		this.attachInput();
		this.replay();
		this.start();
	}

	updateConfig(config: Partial<InkWashConfig>) {
		const previousQuality = this.config.quality;
		this.config = mergeInkWashConfig(this.config, config);
		if (this.config.quality !== previousQuality) {
			this.deleteTargets();
			this.targets = this.createTargets();
			this.replay();
		}
		if (this.config.playing) this.start();
	}

	setPreset(preset: InkWashPreset | string, config?: Partial<InkWashConfig>) {
		this.preset = typeof preset === "string" ? getInkWashPreset(preset) : preset;
		this.config = mergeInkWashConfig(DEFAULT_INK_WASH_CONFIG, this.preset.config, config);
		this.deleteTargets();
		this.targets = this.createTargets();
		this.replay();
	}

	resize() {
		const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
		const rect = this.canvas.getBoundingClientRect();
		const width = Math.max(2, Math.floor((rect.width || 640) * dpr));
		const height = Math.max(2, Math.floor((rect.height || rect.width / this.preset.aspect || 360) * dpr));
		if (this.canvas.width === width && this.canvas.height === height) return;
		this.canvas.width = width;
		this.canvas.height = height;
		if (this.targets) {
			this.deleteTargets();
			this.targets = this.createTargets();
			this.replay();
		}
	}

	replay() {
		this.clear({ keepScript: true });
		this.scriptTime = 0;
		this.scriptDisabled = false;
		this.activeScriptActionIndex = -1;
		this.triggeredCommands = new Set();
		this.pointer.down = false;
		this.pointer.tx = 0.5;
		this.pointer.ty = 0.5;
		this.pointer.bx = 0.5;
		this.pointer.by = 0.5;
		this.pointer.speed = 0;
		this.pointer.simPressure = 0.35;
		this.scriptBrushInk = null;
		this.scriptInkAbsorption = null;
		this.scriptMode = "pen";
		this.fixTimer = 0;
		this.render();
		this.start();
	}

	clear(options: { keepScript?: boolean } = {}) {
		const gl = this.gl;
		if (!options.keepScript) {
			this.scriptDisabled = true;
			this.activeScriptActionIndex = -1;
			this.triggeredCommands = new Set();
			this.pointer.down = false;
			this.fixTimer = 0;
		}
		const clearTarget = (target: Target) => {
			gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
		};
		for (const target of [
			...this.targets.velocity.targets,
			this.targets.divergence,
			this.targets.curl,
			...this.targets.pressure.targets,
			...this.targets.ink.targets,
			...this.targets.fixed.targets,
			...this.targets.wet.targets,
		]) {
			clearTarget(target);
		}
		this.render();
	}

	fix() {
		this.fixTimer = 1.2;
	}

	savePNG() {
		this.render();
		this.canvas.toBlob((blob) => {
			if (!blob) return;
			const anchor = document.createElement("a");
			const objectUrl = URL.createObjectURL(blob);
			anchor.href = objectUrl;
			anchor.download = `ink-wash-${new Date().toISOString().replace(/[:.]/gu, "-").slice(0, 19)}.png`;
			anchor.click();
			URL.revokeObjectURL(objectUrl);
		});
	}

	destroy() {
		if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
		this.animationFrame = null;
		this.pointerAbort.abort();
		const gl = this.gl;
		this.deleteTargets();
		for (const program of Object.values(this.programs)) {
			gl.deleteProgram(program.program);
		}
		gl.deleteShader(this.vertexShader);
		gl.deleteBuffer(this.vbo);
		gl.deleteVertexArray(this.vao);
		}

	private deleteTargets() {
		const gl = this.gl;
		deleteDoubleTarget(gl, this.targets.velocity);
		deleteTarget(gl, this.targets.divergence);
		deleteTarget(gl, this.targets.curl);
		deleteDoubleTarget(gl, this.targets.pressure);
		deleteDoubleTarget(gl, this.targets.ink);
		deleteDoubleTarget(gl, this.targets.fixed);
		deleteDoubleTarget(gl, this.targets.wet);
	}

	private createTargets(): EngineTargets {
		const gl = this.gl;
		const bases = QUALITY_BASES[this.config.quality];
		const aspect = this.canvas.width / Math.max(this.canvas.height, 1);
		const sim = getResolution(bases.sim, aspect);
		const dyeBase = Math.min(bases.dye, Math.max(2, Math.min(this.canvas.width, this.canvas.height)));
		const dye = getResolution(dyeBase, aspect);
		const halfFloat = gl.HALF_FLOAT;
		return {
			velocity: createDoubleTarget(gl, sim.width, sim.height, gl.RG16F, gl.RG, halfFloat, gl.LINEAR),
			divergence: createTarget(gl, sim.width, sim.height, gl.R16F, gl.RED, halfFloat, gl.NEAREST),
			curl: createTarget(gl, sim.width, sim.height, gl.R16F, gl.RED, halfFloat, gl.NEAREST),
			pressure: createDoubleTarget(gl, sim.width, sim.height, gl.R16F, gl.RED, halfFloat, gl.NEAREST),
			ink: createDoubleTarget(gl, dye.width, dye.height, gl.RGBA16F, gl.RGBA, halfFloat, gl.LINEAR),
			fixed: createDoubleTarget(gl, dye.width, dye.height, gl.RGBA16F, gl.RGBA, halfFloat, gl.LINEAR),
			wet: createDoubleTarget(gl, dye.width, dye.height, gl.R16F, gl.RED, halfFloat, gl.LINEAR),
		};
	}

	private attachInput() {
		const signal = this.pointerAbort.signal;
		const toUv = (event: PointerEvent): readonly [number, number] => {
			const rect = this.canvas.getBoundingClientRect();
			return [
				clamp((event.clientX - rect.left) / Math.max(rect.width, 1), 0, 1),
				clamp(1 - (event.clientY - rect.top) / Math.max(rect.height, 1), 0, 1),
			];
		};
		const readPressure = (event: PointerEvent) => {
			if (event.pointerType === "pen" || (event.pressure > 0 && Math.abs(event.pressure - 0.5) > 0.001)) {
				this.pointer.force = event.pressure;
				this.pointer.hasForce = true;
				this.pointer.forceTime = performance.now();
			}
		};

		this.canvas.addEventListener("pointerdown", (event) => {
			if (!this.config.interactive) return;
			event.preventDefault();
			this.canvas.setPointerCapture(event.pointerId);
			this.scriptDisabled = true;
			const [x, y] = toUv(event);
			this.pointer.down = true;
			this.pointer.tx = x;
			this.pointer.ty = y;
			this.pointer.bx = x;
			this.pointer.by = y;
			this.pointer.speed = 0;
			this.pointer.simPressure = 0.35;
			this.pointer.type = event.pointerType;
			this.pointer.barrel = (event.buttons & 34) !== 0;
			readPressure(event);
			this.start();
		}, { signal });

		this.canvas.addEventListener("pointermove", (event) => {
			if (!this.config.interactive || !this.pointer.down) return;
			const [x, y] = toUv(event);
			this.pointer.tx = x;
			this.pointer.ty = y;
			this.pointer.type = event.pointerType;
			this.pointer.barrel = (event.buttons & 34) !== 0;
			readPressure(event);
		}, { signal });

		const endStroke = () => {
			this.pointer.down = false;
			this.pointer.barrel = false;
		};
		this.canvas.addEventListener("pointerup", endStroke, { signal });
		this.canvas.addEventListener("pointercancel", endStroke, { signal });
		this.canvas.addEventListener("contextmenu", (event) => event.preventDefault(), { signal });
	}

	private start() {
		if (this.animationFrame !== null) return;
		this.lastFrameTime = performance.now();
		this.animationFrame = requestAnimationFrame((time) => this.frame(time));
	}

	private frame(now: number) {
		this.animationFrame = null;
		const dt = Math.min((now - this.lastFrameTime) / 1000, 1 / 30) || 1 / 60;
		this.lastFrameTime = now;

		if (this.config.playing) {
			if (!this.scriptDisabled) this.advanceScript(dt);
			this.updateStroke(dt);
			this.step(dt);
			this.render();
			this.animationFrame = requestAnimationFrame((time) => this.frame(time));
		}
	}

	private advanceScript(dt: number) {
		this.scriptTime += dt;
		if (this.scriptTime > this.preset.duration) {
			this.replay();
			return;
		}

		for (let index = 0; index < this.preset.script.length; index += 1) {
			const action = this.preset.script[index];
			if (!action || isStrokeAction(action) || this.triggeredCommands.has(index) || this.scriptTime < action.at) continue;
			this.triggeredCommands.add(index);
			if (action.command === "fix") this.fix();
			if (action.command === "clear") this.clear({ keepScript: true });
		}

		const actionIndex = this.preset.script.findIndex((action) => (
			isStrokeAction(action) && this.scriptTime >= action.t0 && this.scriptTime <= action.t1
		));
		if (actionIndex < 0) {
			this.pointer.down = false;
			this.activeScriptActionIndex = -1;
			this.scriptBrushInk = null;
			this.scriptInkAbsorption = null;
			return;
		}

		const action = this.preset.script[actionIndex];
		if (!action || !isStrokeAction(action)) return;
		const progress = clamp((this.scriptTime - action.t0) / Math.max(action.t1 - action.t0, 0.001), 0, 1);
		const [x, y] = action.path(progress);
		if (this.activeScriptActionIndex !== actionIndex) {
			this.pointer.bx = x;
			this.pointer.by = y;
			this.pointer.speed = 0;
		}
		this.activeScriptActionIndex = actionIndex;
		this.pointer.down = true;
		this.pointer.tx = x;
		this.pointer.ty = y;
		this.pointer.type = "script";
		this.pointer.simPressure = typeof action.pressure === "function"
			? action.pressure(progress)
			: action.pressure ?? 0.65;
		this.scriptMode = action.mode ?? "pen";
		this.scriptBrushInk = action.brushInk ?? null;
		this.scriptInkAbsorption = action.inkAbsorption ?? null;
	}

	private activeMode(): InkWashMode {
		if (!this.scriptDisabled) return this.scriptMode;
		if (!this.pointer.barrel) return this.config.mode;
		if (this.config.mode === "water") return "pen";
		return "water";
	}

	private activeWhite(): boolean {
		return this.activeMode() === "white";
	}

	private activeBrushInk(): number {
		return this.scriptDisabled
			? this.config.brushInk
			: this.scriptBrushInk ?? this.config.brushInk;
	}

	private activeInkAbsorption(): InkWashAbsorption {
		if (this.activeWhite()) return HOUSE_INK_ABSORPTION;
		if (!this.scriptDisabled && this.scriptInkAbsorption) return this.scriptInkAbsorption;
		return inkWashAbsorptionFromHex(this.config.inkColor);
	}

	private pressureNow(): number {
		if (this.pointer.type === "touch") return this.pointer.simPressure;
		if (this.pointer.hasForce && performance.now() - this.pointer.forceTime < 3000) return this.pointer.force;
		return this.pointer.simPressure;
	}

	private sizeMultiplier(): number {
		return Math.pow(3, (this.config.size - 0.5) * 2);
	}

	private penRadius(pressure: number, speed: number): number {
		return (0.0016 + 0.0042 * pressure)
			* Math.min(Math.max(1.12 - speed * 0.3, 0.55), 1.12)
			* this.sizeMultiplier();
	}

	private brushRadius(pressure: number, speed: number): number {
		return (0.014 + 0.06 * pressure)
			* (1 + Math.min(speed, 2.5) * 0.28)
			* this.sizeMultiplier();
	}

	private inkColor(density: number): readonly [number, number, number, number] {
		if (this.activeWhite()) return [0, 0, 0, density];
		const absorption = this.activeInkAbsorption();
		return [
			absorption[0] * density,
			absorption[1] * density,
			absorption[2] * density,
			0,
		];
	}

	private updateStroke(dt: number) {
		this.brush.r = 0;
		const pointer = this.pointer;
		const smoothing = 1 - Math.exp(-dt * 14);
		const px = pointer.bx;
		const py = pointer.by;
		pointer.bx += (pointer.tx - pointer.bx) * smoothing;
		pointer.by += (pointer.ty - pointer.by) * smoothing;
		const dx = pointer.bx - px;
		const dy = pointer.by - py;
		const distance = Math.hypot(dx, dy);
		const instantSpeed = distance / Math.max(dt, 0.0001);
		pointer.speed += (instantSpeed - pointer.speed) * (1 - Math.exp(-dt * 10));

		if (this.scriptDisabled) {
			const targetPressure = Math.min(Math.max(1.18 - pointer.speed * 0.95, 0.12), 1);
			pointer.simPressure += (targetPressure - pointer.simPressure) * (1 - Math.exp(-dt * 6));
		}
		if (!pointer.down) return;

		const pressure = this.pressureNow();
		const speed = pointer.speed;
		const mode = this.activeMode();
		if (mode === "pen" || mode === "white") {
			const radius = this.penRadius(pressure, speed);
			const density = (0.55 + 1.05 * pressure) * Math.min(Math.max(1.25 - speed * 0.45, 0.6), 1.25);
			if (distance < radius * 0.4) {
				this.splat(this.targets.ink, pointer.bx, pointer.by, radius * 1.15, this.inkColor(density * dt * 4), false);
				this.splat(this.targets.wet, pointer.bx, pointer.by, radius * 2.8, [0.16, 0, 0, 0], true);
				return;
			}
			const spacing = radius * 0.6;
			const steps = Math.min(Math.ceil(distance / spacing), 60);
			for (let index = 1; index <= steps; index += 1) {
				const step = index / steps;
				const x = px + dx * step;
				const y = py + dy * step;
				this.splat(this.targets.ink, x, y, radius, this.inkColor(density), false);
				if (index % 2 === 0 || steps === 1) {
					this.splat(this.targets.wet, x, y, radius * 2.8, [0.16, 0, 0, 0], true);
				}
			}
			return;
		}

		const radius = this.brushRadius(pressure, speed);
		this.brush.x = pointer.bx;
		this.brush.y = pointer.by;
		this.brush.r = radius;
		const waterAmount = 0.5 + 0.5 * pressure;
		const force = 15 + this.config.flow * 95;
		const maxVelocity = 240;
		let vx = (dx / Math.max(dt, 0.0001)) * force;
		let vy = (dy / Math.max(dt, 0.0001)) * force;
		const magnitude = Math.hypot(vx, vy);
		if (magnitude > maxVelocity) {
			vx *= maxVelocity / magnitude;
			vy *= maxVelocity / magnitude;
		}
		const brushDensity = this.activeBrushInk() * 0.1 * (0.4 + 0.6 * pressure);

		if (distance < radius * 0.25) {
			this.splat(this.targets.wet, pointer.bx, pointer.by, radius, [waterAmount, 0, 0, 0], true);
			const angle = Math.random() * Math.PI * 2;
			const jitter = (6 + 26 * this.config.flow) * pressure;
			this.splat(
				this.targets.velocity,
				pointer.bx,
				pointer.by,
				radius * 0.9,
				[Math.cos(angle) * jitter, Math.sin(angle) * jitter, 0, 0],
				false,
			);
			if (brushDensity > 0) {
				this.splat(this.targets.ink, pointer.bx, pointer.by, radius * 0.8, this.inkColor(brushDensity * dt * 5), false);
			}
			return;
		}

		const spacing = radius * 0.7;
		const steps = Math.min(Math.ceil(distance / spacing), 12);
		for (let index = 1; index <= steps; index += 1) {
			const step = index / steps;
			const x = px + dx * step;
			const y = py + dy * step;
			this.splat(this.targets.wet, x, y, radius, [waterAmount, 0, 0, 0], true);
			this.splat(this.targets.velocity, x, y, radius * 1.15, [vx, vy, 0, 0], false);
			if (brushDensity > 0) {
				this.splat(this.targets.ink, x, y, radius * 0.8, this.inkColor(brushDensity), false);
			}
		}
	}

	private splat(
		target: DoubleTarget,
		x: number,
		y: number,
		radius: number,
		color: readonly [number, number, number, number],
		useMax: boolean,
	) {
		const gl = this.gl;
		const framebufferTarget = target.getRead();
		gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferTarget.framebuffer);
		gl.viewport(0, 0, framebufferTarget.width, framebufferTarget.height);
		const extent = Math.ceil(radius * 4.5 * framebufferTarget.height) + 2;
		const cx = Math.round(x * framebufferTarget.width);
		const cy = Math.round(y * framebufferTarget.height);
		gl.enable(gl.SCISSOR_TEST);
		gl.scissor(Math.max(cx - extent, 0), Math.max(cy - extent, 0), extent * 2, extent * 2);
		gl.enable(gl.BLEND);
		if (useMax) {
			gl.blendEquation(gl.MAX);
		} else {
			gl.blendEquation(gl.FUNC_ADD);
			gl.blendFunc(gl.ONE, gl.ONE);
		}
		const program = this.programs.splat;
		program.bind();
		setUniform1f(gl, program, "uAspect", this.canvas.width / Math.max(this.canvas.height, 1));
		setUniform2f(gl, program, "uPoint", x, y);
		setUniform4f(gl, program, "uColor", color[0], color[1], color[2], color[3]);
		setUniform1f(gl, program, "uRadius", radius * radius);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
		gl.blendEquation(gl.FUNC_ADD);
		gl.disable(gl.BLEND);
		gl.disable(gl.SCISSOR_TEST);
	}

	private blit(target: Target | null) {
		const gl = this.gl;
		if (target === null) {
			gl.viewport(0, 0, this.canvas.width, this.canvas.height);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		} else {
			gl.viewport(0, 0, target.width, target.height);
			gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
		}
		gl.drawArrays(gl.TRIANGLES, 0, 3);
	}

	private step(dt: number) {
		const gl = this.gl;
		const { config, targets, programs } = this;
		const fixing = this.fixTimer > 0;
		if (fixing) this.fixTimer -= dt;

		programs.advectVelocity.bind();
		setUniform1i(gl, programs.advectVelocity, "uVelocity", targets.velocity.getRead().attach(0));
		setUniform1i(gl, programs.advectVelocity, "uWet", targets.wet.getRead().attach(1));
		setUniform2f(gl, programs.advectVelocity, "uTexel", targets.velocity.texel[0], targets.velocity.texel[1]);
		setUniform1f(gl, programs.advectVelocity, "uDt", dt);
		setUniform1f(
			gl,
			programs.advectVelocity,
			"uDissipation",
			Math.exp(-dt * (3 - config.flow * 2.4)) * (fixing ? Math.exp(-dt * 7) : 1),
		);
		this.blit(targets.velocity.getWrite());
		targets.velocity.swap();

		programs.curl.bind();
		setUniform1i(gl, programs.curl, "uVelocity", targets.velocity.getRead().attach(0));
		setUniform2f(gl, programs.curl, "uTexel", targets.velocity.texel[0], targets.velocity.texel[1]);
		this.blit(targets.curl);

		programs.vorticity.bind();
		setUniform1i(gl, programs.vorticity, "uVelocity", targets.velocity.getRead().attach(0));
		setUniform1i(gl, programs.vorticity, "uCurl", targets.curl.attach(1));
		setUniform2f(gl, programs.vorticity, "uTexel", targets.velocity.texel[0], targets.velocity.texel[1]);
		setUniform1f(gl, programs.vorticity, "uCurlAmt", 4 + config.flow * 22);
		setUniform1f(gl, programs.vorticity, "uDt", dt);
		this.blit(targets.velocity.getWrite());
		targets.velocity.swap();

		programs.divergence.bind();
		setUniform1i(gl, programs.divergence, "uVelocity", targets.velocity.getRead().attach(0));
		setUniform2f(gl, programs.divergence, "uTexel", targets.velocity.texel[0], targets.velocity.texel[1]);
		this.blit(targets.divergence);

		programs.copy.bind();
		setUniform1i(gl, programs.copy, "uTex", targets.pressure.getRead().attach(0));
		setUniform1f(gl, programs.copy, "uValue", 0.8);
		this.blit(targets.pressure.getWrite());
		targets.pressure.swap();

		programs.pressure.bind();
		setUniform1i(gl, programs.pressure, "uDivergence", targets.divergence.attach(1));
		setUniform2f(gl, programs.pressure, "uTexel", targets.velocity.texel[0], targets.velocity.texel[1]);
		for (let index = 0; index < PRESSURE_ITERATIONS; index += 1) {
			setUniform1i(gl, programs.pressure, "uPressure", targets.pressure.getRead().attach(0));
			this.blit(targets.pressure.getWrite());
			targets.pressure.swap();
		}

		programs.gradientSubtract.bind();
		setUniform1i(gl, programs.gradientSubtract, "uPressure", targets.pressure.getRead().attach(0));
		setUniform1i(gl, programs.gradientSubtract, "uVelocity", targets.velocity.getRead().attach(1));
		setUniform2f(gl, programs.gradientSubtract, "uTexel", targets.velocity.texel[0], targets.velocity.texel[1]);
		this.blit(targets.velocity.getWrite());
		targets.velocity.swap();

		const dryTau = fixing ? 0.25 : 2 + (1 - config.dry) * 16;
		programs.advectWet.bind();
		setUniform1i(gl, programs.advectWet, "uVelocity", targets.velocity.getRead().attach(0));
		setUniform1i(gl, programs.advectWet, "uWet", targets.wet.getRead().attach(1));
		setUniform2f(gl, programs.advectWet, "uTexel", targets.velocity.texel[0], targets.velocity.texel[1]);
		setUniform2f(gl, programs.advectWet, "uSrcTexel", targets.wet.texel[0], targets.wet.texel[1]);
		setUniform1f(gl, programs.advectWet, "uDt", dt);
		setUniform1f(gl, programs.advectWet, "uDecay", Math.exp(-dt / dryTau));
		setUniform1f(gl, programs.advectWet, "uSpread", 0.12);
		this.blit(targets.wet.getWrite());
		targets.wet.swap();

		programs.advectInk.bind();
		setUniform1i(gl, programs.advectInk, "uVelocity", targets.velocity.getRead().attach(0));
		setUniform1i(gl, programs.advectInk, "uSource", targets.ink.getRead().attach(1));
		setUniform1i(gl, programs.advectInk, "uWet", targets.wet.getRead().attach(2));
		setUniform2f(gl, programs.advectInk, "uTexel", targets.velocity.texel[0], targets.velocity.texel[1]);
		setUniform2f(gl, programs.advectInk, "uSrcTexel", targets.ink.texel[0], targets.ink.texel[1]);
		setUniform1f(gl, programs.advectInk, "uDt", dt);
		setUniform1f(gl, programs.advectInk, "uBleed", config.bleed);
		setUniform1f(gl, programs.advectInk, "uAspect", this.canvas.width / Math.max(this.canvas.height, 1));
		setUniform3f(
			gl,
			programs.advectInk,
			"uChroma",
			1 + 0.85 * config.color,
			1 + 0.15 * config.color,
			Math.max(0.25, 1 - 0.65 * config.color),
		);
		setUniform3f(gl, programs.advectInk, "uBrush", this.brush.x, this.brush.y, this.brush.r);
		this.blit(targets.ink.getWrite());
		targets.ink.swap();

		const settle = fixing ? 1 - Math.exp(-dt * 5) : 0;
		programs.exchange.bind();
		setUniform1i(gl, programs.exchange, "uFixed", targets.fixed.getRead().attach(0));
		setUniform1i(gl, programs.exchange, "uInk", targets.ink.getRead().attach(1));
		setUniform1i(gl, programs.exchange, "uWet", targets.wet.getRead().attach(2));
		setUniform1f(gl, programs.exchange, "uSettle", settle);
		setUniform1f(gl, programs.exchange, "uDt", dt);
		setUniform1f(gl, programs.exchange, "uAspect", this.canvas.width / Math.max(this.canvas.height, 1));
		setUniform3f(gl, programs.exchange, "uBrush", this.brush.x, this.brush.y, this.brush.r);
		setUniform1f(gl, programs.exchange, "uMode", 0);
		this.blit(targets.fixed.getWrite());
		setUniform1f(gl, programs.exchange, "uMode", 1);
		this.blit(targets.ink.getWrite());
		targets.fixed.swap();
		targets.ink.swap();
	}

	private render() {
		const gl = this.gl;
		const { targets, programs, config } = this;
		const displayView = viewIndex(config.view);
		if (displayView === 0) {
			programs.display.bind();
			setUniform1i(gl, programs.display, "uInk", targets.ink.getRead().attach(0));
			setUniform1i(gl, programs.display, "uWet", targets.wet.getRead().attach(1));
			setUniform1i(gl, programs.display, "uFixed", targets.fixed.getRead().attach(2));
			setUniform2f(gl, programs.display, "uTexel", targets.ink.texel[0], targets.ink.texel[1]);
			setUniform2f(gl, programs.display, "uRes", this.canvas.width, this.canvas.height);
			setUniform1f(gl, programs.display, "uInkStrength", config.inkStrength);
			setUniform1f(gl, programs.display, "uEdge", config.edgeStrength);
			setUniform1f(gl, programs.display, "uGrain", config.grainStrength);
			setUniform1f(gl, programs.display, "uWhiteTint", config.color * 0.35);
			setUniform1f(gl, programs.display, "uPaperOn", config.paper ? 1 : 0);
			setUniform1f(gl, programs.display, "uWetDark", config.wetSheen ? 1 : 0);
			setUniform1f(gl, programs.display, "uVignette", config.vignette ? 1 : 0);
		} else {
			programs.debug.bind();
			setUniform1i(gl, programs.debug, "uInk", targets.ink.getRead().attach(0));
			setUniform1i(gl, programs.debug, "uWet", targets.wet.getRead().attach(1));
			setUniform1i(gl, programs.debug, "uFixed", targets.fixed.getRead().attach(2));
			setUniform1i(gl, programs.debug, "uVelocity", targets.velocity.getRead().attach(3));
			setUniform1f(gl, programs.debug, "uView", displayView);
		}
		this.blit(null);
	}
}

export function resolveInkWashConfig(
	presetId: string,
	config?: Partial<InkWashConfig>,
): InkWashConfig {
	return clampInkWashParams(mergeInkWashConfig(DEFAULT_INK_WASH_CONFIG, getInkWashPreset(presetId).config, config));
}
