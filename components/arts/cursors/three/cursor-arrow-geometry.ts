import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

// ---------------------------------------------------------------------------
// Arrow glyph — extruded from the Rovo cursor's SVG path
// ---------------------------------------------------------------------------

// Keep in sync with ARROW_PATH in components/ui-custom/rovo-cursor.tsx
const ARROW_PATH =
	"M0.5999 2.38246C0.160828 1.26482 1.26482 0.160828 2.38246 0.5999L13.3845 4.92213C14.5955 5.39786 14.5296 7.13348 13.2861 7.51611L8.87375 8.87375L7.51611 13.2861C7.13348 14.5296 5.39786 14.5955 4.92213 13.3845L0.5999 2.38246Z";
const ARROW_VIEWBOX = 14.7568;
const ARROW_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ARROW_VIEWBOX} ${ARROW_VIEWBOX}"><path d="${ARROW_PATH}"/></svg>`;

const EXTRUDE_SETTINGS = {
	depth: 4,
	bevelEnabled: true,
	bevelThickness: 0.6,
	bevelSize: 0.5,
	bevelSegments: 3,
} as const;

let cachedGeometry: THREE.ExtrudeGeometry | null = null;

function buildGeometry(): THREE.ExtrudeGeometry {
	const { paths } = new SVGLoader().parse(ARROW_SVG);
	const shapes = paths.flatMap((path) => SVGLoader.createShapes(path));
	const geometry = new THREE.ExtrudeGeometry(shapes, EXTRUDE_SETTINGS);

	geometry.center();
	// SVG is y-down; flip so the glyph reads right-side-up in world (y-up) space.
	geometry.scale(1, -1, 1);

	// Normalize so the glyph's largest dimension is exactly 1 world unit —
	// callers then scale meshes directly in CSS px (1 world unit = 1 CSS px,
	// see cursor-scene.tsx's camera setup).
	geometry.computeBoundingBox();
	const box = geometry.boundingBox;
	const size = box ? Math.max(box.max.x - box.min.x, box.max.y - box.min.y) : 1;
	const normalizeScale = size > 0 ? 1 / size : 1;
	geometry.scale(normalizeScale, normalizeScale, normalizeScale);
	geometry.center();
	geometry.computeVertexNormals();

	return geometry;
}

/**
 * Lazy module singleton: builds the shared cursor-arrow geometry once (a
 * local copy of the Rovo cursor's SVG arrow, extruded, centered, Y-flipped,
 * and normalized to a 1-unit glyph) and reuses it across every mesh —
 * follower, fan-out, and orbit cursors alike.
 */
export function getCursorArrowGeometry(): THREE.ExtrudeGeometry {
	if (!cachedGeometry) {
		cachedGeometry = buildGeometry();
	}
	return cachedGeometry;
}

// ---------------------------------------------------------------------------
// Material factories
// ---------------------------------------------------------------------------

/** Glossy, agent-colored material for the fan-out / orbit companion cursors. */
export function makeAgentMaterial(hex: string): THREE.MeshPhysicalMaterial {
	const identityColor = new THREE.Color(hex);
	const baseColor = identityColor.clone().lerp(new THREE.Color("#000000"), 0.38);

	return new THREE.MeshPhysicalMaterial({
		color: baseColor,
		emissive: identityColor,
		emissiveIntensity: 0.5,
		roughness: 0.34,
		metalness: 0,
		envMapIntensity: 0.03,
		specularIntensity: 0.35,
		reflectivity: 0.2,
		clearcoat: 1,
		clearcoatRoughness: 0.15,
		transparent: true,
		toneMapped: false,
	});
}

/** Iridescent pearl material for the pointer-following cursor. */
export function makeIridescentMaterial(): THREE.MeshPhysicalMaterial {
	return new THREE.MeshPhysicalMaterial({
		// Pearl base tint + damped env reflection keep the glyph visible over
		// white surfaces — full metalness with the room env map washes out to
		// near-white.
		color: "#a9a7cf",
		metalness: 0.4,
		roughness: 0.32,
		envMapIntensity: 0.45,
		iridescence: 1,
		iridescenceIOR: 1.6,
		clearcoat: 1,
		clearcoatRoughness: 0.2,
		transparent: true,
	});
}
