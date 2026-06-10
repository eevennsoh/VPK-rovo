/**
 * Pure text-morphing logic ported from Raphael Salaja's Calligraph
 * (https://github.com/raphaelsalaja/calligraph) `shared.ts` + `reconcile.ts`,
 * trimmed to the `text` variant. Kept framework-free (no `motion` import) so it
 * is unit-testable under `node --test` — see `lib.test.js`.
 *
 * The morph is driven entirely by *stable React keys*: a Longest Common
 * Subsequence (LCS) match between the previous and next graphemes lets every
 * surviving character keep its key (so Motion's `layout` slides it to its new
 * position), while inserted characters receive fresh keys (so they animate in)
 * and removed ones drop out.
 */

// One Segmenter instance, reused — grapheme segmentation is the unit of morphing
// so multi-codepoint clusters (emoji, combining marks) move as a single glyph.
const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

/** Split a string into grapheme clusters (not code units). */
export const splitGraphemes = (s: string): string[] =>
	Array.from(segmenter.segment(s), (seg) => seg.segment);

/** True for an ASCII digit `0`–`9`. */
export const isDigit = (c: string): boolean => c >= "0" && c <= "9";

/** Always-positive modulo (JS `%` keeps the sign of the dividend). */
export function mod(n: number, m: number): number {
	return ((n % m) + m) % m;
}

/** Vertical travel, in px, of a rolling digit in the `number` variant. */
export const DIGIT_DISTANCE = 8;

/** Result of reconciling one text change into the next render's keys. */
export type ReconcileResult = Readonly<{
	/** Per-grapheme React keys for the *new* text, length === newSegs.length. */
	keys: string[];
	/** Fraction of the passage that changed (0 = identical, 1 = fully replaced). */
	changeRatio: number;
	/** Next free id, threaded through subsequent reconciles via a ref. */
	nextId: number;
}>;

/**
 * Classic LCS over grapheme arrays. Returns the matched `[oldIdx, newIdx]`
 * pairs in ascending order — these are the characters that persist across the
 * edit and must keep their key. The `i >= j` tie-break biases retained matches
 * toward the front, matching Calligraph's reconciler.
 */
function computeLCS(oldSegs: string[], newSegs: string[]): [number, number][] {
	const m = oldSegs.length;
	const n = newSegs.length;
	const dp: number[][] = [];

	for (let i = 0; i <= m; i++) {
		dp[i] = [];
		for (let j = 0; j <= n; j++) {
			if (i === 0 || j === 0) {
				dp[i][j] = 0;
			} else if (oldSegs[i - 1] === newSegs[j - 1]) {
				dp[i][j] = dp[i - 1][j - 1] + 1;
			} else {
				dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
			}
		}
	}

	const pairs: [number, number][] = [];
	let i = m;
	let j = n;

	while (i > 0 && j > 0) {
		if (oldSegs[i - 1] === newSegs[j - 1]) {
			pairs.push([i - 1, j - 1]);
			i--;
			j--;
		} else if (dp[i - 1][j] > dp[i][j - 1] || (dp[i - 1][j] === dp[i][j - 1] && i >= j)) {
			i--;
		} else {
			j--;
		}
	}

	pairs.reverse();
	return pairs;
}

/**
 * Map the previous render's keys onto the new text. Surviving graphemes (per the
 * LCS) keep their old key; new graphemes mint `c{id}` keys from `nextId`.
 * `changeRatio` (inserted + removed over the longer length) scales the drift in
 * the renderer so small edits barely move and large edits swirl.
 */
export function reconcileTextKeys(
	prevText: string,
	newText: string,
	prevKeys: string[],
	nextId: number,
): ReconcileResult {
	const prevSegs = splitGraphemes(prevText);
	const newSegs = splitGraphemes(newText);
	const matches = computeLCS(prevSegs, newSegs);
	const newKeys: string[] = new Array(newSegs.length).fill("");

	for (const [oldIdx, newIdx] of matches) {
		newKeys[newIdx] = prevKeys[oldIdx];
	}

	let id = nextId;
	let newCount = 0;
	for (let i = 0; i < newKeys.length; i++) {
		if (!newKeys[i]) {
			newKeys[i] = `c${id++}`;
			newCount++;
		}
	}

	const keptCount = newSegs.length - newCount;
	const removedCount = prevSegs.length - keptCount;
	const totalChange = newCount + removedCount;
	const maxLen = Math.max(newSegs.length, prevSegs.length);

	return {
		keys: newKeys,
		changeRatio: maxLen > 0 ? totalChange / maxLen : 1,
		nextId: id,
	};
}

/** Result of reconciling a numeric change for the `number`/`slots` variants. */
export type DigitReconcileResult = Readonly<{
	keys: number[];
	/** Sign of (new − old): 1 counts up, -1 counts down, 0 unchanged. */
	direction: number;
	nextId: number;
}>;

/**
 * Reconcile a numeric string change. Non-digit prefix (currency symbols, signs)
 * is matched positionally from the left; the digit body is matched from the
 * *right* (so "$9" → "$10" keeps the trailing digits aligned as a new leading
 * digit rolls in). `direction` drives which way digits spin. Ported from
 * Calligraph `reconcile.ts`.
 */
export function reconcileDigitKeys(
	prevText: string,
	newText: string,
	prevKeys: number[],
	nextId: number,
): DigitReconcileResult {
	const toNum = (s: string) => parseFloat(s.replace(/[^0-9.-]/g, "")) || 0;
	const direction = Math.sign(toNum(newText) - toNum(prevText));

	const oldChars = splitGraphemes(prevText);
	const newChars = splitGraphemes(newText);

	const firstDigitIndex = (arr: string[]) => {
		const idx = arr.findIndex((c) => isDigit(c));
		return idx === -1 ? arr.length : idx;
	};

	const newPrefixLen = firstDigitIndex(newChars);
	const oldPrefixLen = firstDigitIndex(oldChars);
	const minPrefix = Math.min(newPrefixLen, oldPrefixLen);

	const newKeys: number[] = new Array(newChars.length);
	let id = nextId;

	for (let i = 0; i < newPrefixLen; i++) {
		newKeys[i] = i < minPrefix && newChars[i] === oldChars[i] ? prevKeys[i] : id++;
	}

	const oldBody = oldChars.slice(oldPrefixLen);
	const newBody = newChars.slice(newPrefixLen);
	const oldBodyKeys = prevKeys.slice(oldPrefixLen);
	const maxBodyLen = Math.max(oldBody.length, newBody.length);

	const padOld = [...Array<string>(Math.max(0, maxBodyLen - oldBody.length)).fill(""), ...oldBody];
	const padNew = [...Array<string>(Math.max(0, maxBodyLen - newBody.length)).fill(""), ...newBody];
	const padKeys = [
		...Array<number>(Math.max(0, maxBodyLen - oldBodyKeys.length)).fill(-1),
		...oldBodyKeys,
	];

	const bodyOffset = maxBodyLen - newBody.length;
	for (let i = 0; i < newBody.length; i++) {
		const pi = bodyOffset + i;
		newKeys[newPrefixLen + i] = padNew[pi] === padOld[pi] && padKeys[pi] >= 0 ? padKeys[pi] : id++;
	}

	return { keys: newKeys, direction, nextId: id };
}
