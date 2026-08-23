"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

import {
	CHROMATIC_DEFAULTS,
	DEFAULT_CHROMATIC_ABERRATION_MEDIA_SRC,
	type ChromaticAnimation,
	type ChromaticMode,
	type ChromaticSymmetry,
} from "./chromatic-aberration-config";

const VERTEX_SHADER = `#version 300 es
precision highp float;
in vec2 a_position;
out vec2 v_uv;
void main() {
	v_uv = a_position * 0.5 + 0.5;
	gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
precision highp int;

in vec2 v_uv;
out vec4 fragColor;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_pixelRatio;
uniform sampler2D u_texture;
uniform float u_mode;
uniform float u_zoom;
uniform vec2 u_focus;
uniform float u_radius;
uniform float u_angle;
uniform float u_symmetry;
uniform float u_edgeAmount;
uniform float u_edges;
uniform float u_falloff;
uniform float u_swirl;
uniform float u_dispersion;
uniform float u_animate;
uniform float u_animationAmount;
uniform float u_speed;

const float PI = 3.141592653589793;

vec2 rotatePoint(vec2 point, float angle) {
	float c = cos(angle);
	float s = sin(angle);
	return mat2(c, -s, s, c) * point;
}

vec2 coverUv(vec2 uv) {
	float canvasAspect = (u_resolution.x / u_pixelRatio) / (u_resolution.y / u_pixelRatio);
	vec2 textureSizeValue = vec2(textureSize(u_texture, 0));
	float textureAspect = textureSizeValue.x / textureSizeValue.y;
	vec2 scale = vec2(1.0);
	vec2 offset = vec2(0.0);

	if (canvasAspect > textureAspect) {
		float ratio = canvasAspect / textureAspect;
		scale.y = 1.0 / ratio;
		offset.y = (1.0 - scale.y) * 0.5;
	} else {
		float ratio = textureAspect / canvasAspect;
		scale.x = 1.0 / ratio;
		offset.x = (1.0 - scale.x) * 0.5;
	}

	vec2 fitted = uv * scale + offset;
	fitted.y = 1.0 - fitted.y;
	return fitted;
}

vec4 sampleChromatic(vec2 uv, vec2 direction, float amount) {
	vec2 offset = direction * amount;
	vec4 redSample = texture(u_texture, coverUv(uv + offset));
	vec4 greenSample = texture(u_texture, coverUv(uv));
	vec4 blueSample = texture(u_texture, coverUv(uv - offset));
	return vec4(redSample.r, greenSample.g, blueSample.b, greenSample.a);
}

float pulseScale() {
	if (u_animate < 0.5) return 1.0;
	float wave = sin(u_time * u_speed * 2.0);
	return 1.0 + wave * u_animationAmount;
}

void main() {
	float aspect = (u_resolution.x / u_pixelRatio) / (u_resolution.y / u_pixelRatio);
	float pulse = pulseScale();
	vec4 color;

	if (u_mode < 0.5) {
		vec2 focus = vec2(u_focus.x, 1.0 - u_focus.y);
		vec2 delta = v_uv - focus;
		vec2 aspectDelta = delta * vec2(aspect, 1.0);
		float distanceFromFocus = length(aspectDelta);
		vec2 radialDirection = distanceFromFocus > 0.0001
			? normalize(aspectDelta) / vec2(aspect, 1.0)
			: vec2(0.0);
		float zoomStrength = (u_zoom - 0.25) / 1.25;
		vec2 warpedUv = v_uv + radialDirection * distanceFromFocus * distanceFromFocus * zoomStrength * 0.24 * pulse;
		float split = u_radius / 1600.0 * pulse;
		color = sampleChromatic(warpedUv, radialDirection, split);
	} else if (u_mode < 1.5) {
		float angle = radians(u_angle);
		vec2 direction = normalize(vec2(cos(angle) / aspect, sin(angle)));
		float split = u_radius / 1600.0 * pulse;
		color = sampleChromatic(v_uv, direction, split);
	} else {
		vec2 centered = v_uv - 0.5;
		vec2 aspectPoint = centered * vec2(aspect, 1.0);
		float side = aspectPoint.x < 0.0 ? -1.0 : 1.0;
		vec2 symmetryPoint = u_symmetry < 0.5
			? aspectPoint
			: vec2(abs(aspectPoint.x), aspectPoint.y);
		float maxDistance = length(vec2(aspect, 1.0) * 0.5);
		float normalizedDistance = clamp(length(symmetryPoint) / maxDistance, 0.0, 1.0);
		float edgeShape = pow(normalizedDistance, max(u_edges, 0.01));
		float edgeMask = pow(edgeShape, max(u_falloff, 0.01));
		float swirlAngle = radians(u_swirl * 9.0) * edgeMask * pulse;
		vec2 warpedPoint = rotatePoint(symmetryPoint, swirlAngle);
		float bend = (u_edgeAmount / 200.0) * 0.42 * edgeMask * pulse;
		warpedPoint *= 1.0 + bend;
		if (u_symmetry >= 0.5) warpedPoint.x *= side;
		vec2 warpedUv = warpedPoint / vec2(aspect, 1.0) + 0.5;
		vec2 edgeDirection = length(aspectPoint) > 0.0001
			? normalize(aspectPoint) / vec2(aspect, 1.0)
			: vec2(0.0);
		float split = u_dispersion * 0.035 * (0.2 + edgeMask) * pulse;
		color = sampleChromatic(warpedUv, edgeDirection, split);
	}

	fragColor = vec4(color.rgb, color.a);
}
`;

interface ChromaticAberrationProps {
	className?: string;
	mediaSrc?: string;
	mediaType?: "image" | "video";
	/** Compatibility alias for existing image-only consumers. */
	imageSrc?: string;
	mode?: ChromaticMode;
	zoom?: number;
	focusX?: number;
	focusY?: number;
	radius?: number;
	angle?: number;
	symmetry?: ChromaticSymmetry;
	edgeAmount?: number;
	edges?: number;
	falloff?: number;
	swirl?: number;
	dispersion?: number;
	animate?: ChromaticAnimation;
	animationAmount?: number;
	speed?: number;
}

export default function ChromaticAberration({
	className,
	mediaSrc,
	mediaType = "image",
	imageSrc,
	mode = CHROMATIC_DEFAULTS.mode,
	zoom = CHROMATIC_DEFAULTS.zoom,
	focusX = CHROMATIC_DEFAULTS.focusX,
	focusY = CHROMATIC_DEFAULTS.focusY,
	radius = CHROMATIC_DEFAULTS.radius,
	angle = CHROMATIC_DEFAULTS.angle,
	symmetry = CHROMATIC_DEFAULTS.symmetry,
	edgeAmount = CHROMATIC_DEFAULTS.edgeAmount,
	edges = CHROMATIC_DEFAULTS.edges,
	falloff = CHROMATIC_DEFAULTS.falloff,
	swirl = CHROMATIC_DEFAULTS.swirl,
	dispersion = CHROMATIC_DEFAULTS.dispersion,
	animate = CHROMATIC_DEFAULTS.animate,
	animationAmount = CHROMATIC_DEFAULTS.animationAmount,
	speed = CHROMATIC_DEFAULTS.speed,
}: ChromaticAberrationProps) {
	const resolvedMediaSrc = mediaSrc ?? imageSrc ?? DEFAULT_CHROMATIC_ABERRATION_MEDIA_SRC;
	const resolvedMediaType = mediaSrc ? mediaType : "image";
	const modeValue = mode === "radial" ? 0 : mode === "uniform" ? 1 : 2;
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animRef = useRef<number>(0);
	const reduced = useReducedMotion();
	const [inView, setInView] = useState(false);
	const [tabVisible, setTabVisible] = useState(
		typeof document === "undefined" ? true : document.visibilityState === "visible",
	);

	useEffect(() => {
		const el = canvasRef.current;
		if (!el) return;
		const io = new IntersectionObserver(
			([entry]) => setInView(entry.isIntersecting),
			{ rootMargin: "200px" },
		);
		io.observe(el);
		const onVis = () => setTabVisible(document.visibilityState === "visible");
		document.addEventListener("visibilitychange", onVis);
		return () => {
			io.disconnect();
			document.removeEventListener("visibilitychange", onVis);
		};
	}, []);

	const shouldAnimate = !reduced && inView && tabVisible;
	const shouldRenderContinuously = shouldAnimate && (animate === "pulse" || resolvedMediaType === "video");

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const gl = canvas.getContext("webgl2", { antialias: false, alpha: true, premultipliedAlpha: false });
		if (!gl) return;

		const compile = (type: number, src: string) => {
			const s = gl.createShader(type)!;
			gl.shaderSource(s, src);
			gl.compileShader(s);
			if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
				console.error(gl.getShaderInfoLog(s));
			}
			return s;
		};

		const vertexShader = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
		const fragmentShader = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
		const prog = gl.createProgram()!;
		gl.attachShader(prog, vertexShader);
		gl.attachShader(prog, fragmentShader);
		gl.linkProgram(prog);
		gl.useProgram(prog);

		const buf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
		const aPos = gl.getAttribLocation(prog, "a_position");
		gl.enableVertexAttribArray(aPos);
		gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

		const uRes = gl.getUniformLocation(prog, "u_resolution");
		const uTime = gl.getUniformLocation(prog, "u_time");
		const uPixelRatio = gl.getUniformLocation(prog, "u_pixelRatio");

		gl.uniform1f(gl.getUniformLocation(prog, "u_mode"), modeValue);
		gl.uniform1f(gl.getUniformLocation(prog, "u_zoom"), zoom);
		gl.uniform2f(gl.getUniformLocation(prog, "u_focus"), focusX, focusY);
		gl.uniform1f(gl.getUniformLocation(prog, "u_radius"), radius);
		gl.uniform1f(gl.getUniformLocation(prog, "u_angle"), angle);
		gl.uniform1f(gl.getUniformLocation(prog, "u_symmetry"), symmetry === "point" ? 0 : 1);
		gl.uniform1f(gl.getUniformLocation(prog, "u_edgeAmount"), edgeAmount);
		gl.uniform1f(gl.getUniformLocation(prog, "u_edges"), edges);
		gl.uniform1f(gl.getUniformLocation(prog, "u_falloff"), falloff);
		gl.uniform1f(gl.getUniformLocation(prog, "u_swirl"), swirl);
		gl.uniform1f(gl.getUniformLocation(prog, "u_dispersion"), dispersion);
		gl.uniform1f(gl.getUniformLocation(prog, "u_animate"), animate === "pulse" && shouldAnimate ? 1 : 0);
		gl.uniform1f(gl.getUniformLocation(prog, "u_animationAmount"), animationAmount);
		gl.uniform1f(gl.getUniformLocation(prog, "u_speed"), speed);

		const tex = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.uniform1i(gl.getUniformLocation(prog, "u_texture"), 0);

		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			1,
			1,
			0,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			new Uint8Array([0, 0, 0, 0]),
		);

		let image: HTMLImageElement | null = null;
		let video: HTMLVideoElement | null = null;
		const start = performance.now();
		const render = () => {
			if (video && video.readyState >= video.HAVE_CURRENT_DATA) {
				gl.bindTexture(gl.TEXTURE_2D, tex);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
			}

			const dpr = window.devicePixelRatio || 1;
			const w = canvas.clientWidth * dpr;
			const h = canvas.clientHeight * dpr;
			if (canvas.width !== w || canvas.height !== h) {
				canvas.width = w;
				canvas.height = h;
				gl.viewport(0, 0, w, h);
			}
			gl.uniform2f(uRes, w, h);
			gl.uniform1f(uTime, (performance.now() - start) / 1000);
			gl.uniform1f(uPixelRatio, dpr);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			if (shouldRenderContinuously) {
				animRef.current = requestAnimationFrame(render);
			}
		};
		const resizeObserver = new ResizeObserver(() => {
			if (!shouldRenderContinuously) render();
		});
		resizeObserver.observe(canvas);

		if (resolvedMediaSrc && resolvedMediaType === "video") {
			const nextVideo = document.createElement("video");
			video = nextVideo;
			nextVideo.crossOrigin = "anonymous";
			nextVideo.loop = true;
			nextVideo.muted = true;
			nextVideo.playsInline = true;
			nextVideo.preload = "auto";
			nextVideo.onloadeddata = () => {
				if (shouldRenderContinuously) {
					void nextVideo.play().catch(() => undefined);
				} else {
					render();
				}
			};
			nextVideo.src = resolvedMediaSrc;
			nextVideo.load();
		} else if (resolvedMediaSrc) {
			const nextImage = new Image();
			image = nextImage;
			nextImage.crossOrigin = "anonymous";
			nextImage.onload = () => {
				gl.bindTexture(gl.TEXTURE_2D, tex);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, nextImage);
				if (!shouldAnimate) render();
			};
			nextImage.src = resolvedMediaSrc;
		}

		render();

		return () => {
			resizeObserver.disconnect();
			cancelAnimationFrame(animRef.current);
			if (image) image.onload = null;
			if (video) {
				video.onloadeddata = null;
				video.pause();
				video.removeAttribute("src");
				video.load();
			}
			gl.deleteTexture(tex);
			gl.deleteBuffer(buf);
			gl.deleteProgram(prog);
			gl.deleteShader(vertexShader);
			gl.deleteShader(fragmentShader);
		};
	}, [
		resolvedMediaSrc,
		resolvedMediaType,
		modeValue,
		zoom,
		focusX,
		focusY,
		radius,
		angle,
		symmetry,
		edgeAmount,
		edges,
		falloff,
		swirl,
		dispersion,
		animate,
		animationAmount,
		speed,
		shouldAnimate,
		shouldRenderContinuously,
	]);

	return (
		<canvas
			ref={canvasRef}
			className={className}
			style={{ width: "100%", height: "100%", display: "block" }}
		/>
	);
}
