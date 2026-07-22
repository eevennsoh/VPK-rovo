// Exactly four stops, consumed positionally (palette[0..3]) by the selected
// surface's static CSS gradient — the reduced-motion / no-WebGL fallback. A
// shorter palette would emit `undefined` into `backgroundImage` and drop the
// gradient, so the tuple type enforces four stops at every call site.
export type GalleryPalette = [string, string, string, string];

export const DEFAULT_GALLERY_PALETTE: GalleryPalette = ["#0747A6", "#0C66E4", "#1D7AFC", "#579DFF"];
