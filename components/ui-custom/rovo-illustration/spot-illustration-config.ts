export const SPOT_ILLUSTRATIONS = [
  { id: "chat", label: "Chat" },
  { id: "brainstorm", label: "Brainstorm" },
  { id: "ai", label: "AI" },
  { id: "create", label: "Create" },
  { id: "deep-research", label: "Deep Research" },
  { id: "write", label: "Write" },
  { id: "search", label: "Search" },
  { id: "smart-answer", label: "Smart Answer" },
  { id: "megaphone", label: "Megaphone" },
  { id: "mode", label: "AI First Create - Confluence" },
  { id: "ai-first-jira", label: "AI First Create - JIRA" },
  { id: "code", label: "Code" },
  { id: "error", label: "Error" },
  { id: "help", label: "Help" },
  { id: "summarize", label: "Summarize" },
];

export const ILLUS_HAND_DRAWN: Record<string, number[][]> = {
  'brainstorm': [[3]],
  'write': [[4], [5]],
  'search': [[4], [5], [6]],
  'deep-research': [[6, 7, 8], [9, 10], [11, 12]],
  'smart-answer': [[4], [5], [6]],
  'error': [[5], [6], [7]],
  'help': [[4], [5], [6]],
  'summarize': [[7], [8], [9]],
};

export const ILLUS_ELEMENTS: Record<string, { grey: number[]; mosaic: number[]; overlap: number[]; greyBack?: number[]; mosaicTop?: number[] }> = {
  'brainstorm': { grey: [2, 3], mosaic: [1], overlap: [4] },
  'ai': { grey: [0, 3], mosaic: [2], overlap: [4] },
  'create': { grey: [0, 4], mosaic: [1, 2, 6, 11], overlap: [3, 7], mosaicTop: [8, 9] },
  'write': { grey: [0, 4, 5], mosaic: [2], overlap: [3] },
  'search': { grey: [2, 7], mosaic: [1, 3, 4, 5, 6], overlap: [8] },
  'deep-research': { greyBack: [0, 1], grey: [4, 5], mosaic: [3], overlap: [13, 14] },
  'smart-answer': { grey: [0, 1], mosaic: [3], overlap: [7] },
  'megaphone': { grey: [0], mosaic: [2], overlap: [3] },
  'mode': { grey: [0], mosaic: [2, 3, 4], overlap: [5], mosaicTop: [6, 7] },
  'ai-first-jira': { grey: [0], mosaic: [2, 3, 4], overlap: [5], mosaicTop: [6, 7] },
  'code': { grey: [3], mosaic: [0, 1, 2], overlap: [4, 5] },
  'error': { grey: [2], mosaic: [1], overlap: [3, 4] },
  'help': { grey: [2], mosaic: [1], overlap: [3] },
  'summarize': { greyBack: [0], grey: [], mosaic: [2], overlap: [3, 4, 5, 6] },
};

export type ILLUS_MOTION_TYPE = {
  greyEnterFrom?: { x: number; y: number };
  mosaicEnterFrom?: { x: number; y: number };
  greyExitTo?: { x: number; y: number };
  mosaicExitTo?: { x: number; y: number };
  idleMosaicRoam?: { ax: number; ay: number; period: number };
  mosaicEnterScale?: number;
  mosaicExitScale?: number;
  overlapTrack?: 'grey' | 'mosaic';
  gestureStagger?: number;
  enterTX?: number;
  enterTY?: number;
  enterScale?: number;
  enterRotation?: number;
  exitTX?: number;
  exitTY?: number;
  exitScale?: number;
  exitRotation?: number;
};

export const ILLUS_MOTION: Record<string, ILLUS_MOTION_TYPE> = {
  'ai': {
    greyEnterFrom: { x: -8, y: 2 },
    mosaicEnterFrom: { x: 8, y: 2 },
    greyExitTo: { x: 4, y: -1.5 },
    mosaicExitTo: { x: -4, y: -1.5 },
    overlapTrack: 'mosaic',
  },
  'create': {
    greyEnterFrom: { x: 0, y: 0 },
    mosaicEnterFrom: { x: 0, y: 0 },
    greyExitTo: { x: 0, y: 0 },
    mosaicExitTo: { x: 0, y: 0 },
    overlapTrack: 'mosaic',
    enterTX: -14,
    enterTY: 14,
    enterScale: 0.75,
    enterRotation: -5,
    exitTX: 12,
    exitTY: -10,
    exitScale: 0.75,
    exitRotation: 5,
  },
  'brainstorm': {
    greyEnterFrom: { x: 0, y: 0 },
    mosaicEnterFrom: { x: 0, y: 0 },
    greyExitTo: { x: 0, y: 0 },
    mosaicExitTo: { x: 0, y: 0 },
    overlapTrack: 'mosaic',
    enterTX: -14,
    enterTY: 14,
    enterScale: 0.75,
    enterRotation: -5,
    exitTX: 12,
    exitTY: -10,
    exitScale: 0.75,
    exitRotation: 5,
  },
  'search': {
    greyEnterFrom: { x: -3, y: 3 },
    mosaicEnterFrom: { x: 3, y: -2 },
    greyExitTo: { x: 2.5, y: -2.5 },
    mosaicExitTo: { x: -2.5, y: 2 },
    overlapTrack: 'mosaic',
    enterTX: -14,
    enterTY: 14,
    enterScale: 0.75,
    enterRotation: -5,
    exitTX: 12,
    exitTY: -10,
    exitScale: 0.75,
    exitRotation: 5,
  },
  'write': {
    greyEnterFrom: { x: -3, y: 3 },
    mosaicEnterFrom: { x: 3, y: -2 },
    greyExitTo: { x: 2.5, y: -2.5 },
    mosaicExitTo: { x: -2.5, y: 2 },
    overlapTrack: 'mosaic',
    enterTX: -14,
    enterTY: 14,
    enterScale: 0.75,
    enterRotation: -5,
    exitTX: 12,
    exitTY: -10,
    exitScale: 0.75,
    exitRotation: 5,
  },
  'deep-research': {
    greyEnterFrom: { x: -3, y: 3 },
    mosaicEnterFrom: { x: 3, y: -2 },
    greyExitTo: { x: 2.5, y: -2.5 },
    mosaicExitTo: { x: -2.5, y: 2 },
    overlapTrack: 'mosaic',
    gestureStagger: 0.12,
    enterTX: -14,
    enterTY: 14,
    enterScale: 0.75,
    enterRotation: -5,
    exitTX: 12,
    exitTY: -10,
    exitScale: 0.75,
    exitRotation: 5,
  },
  'smart-answer': {
    greyEnterFrom: { x: -3, y: 3 },
    mosaicEnterFrom: { x: 3, y: -2 },
    greyExitTo: { x: 2.5, y: -2.5 },
    mosaicExitTo: { x: -2.5, y: 2 },
    overlapTrack: 'mosaic',
    gestureStagger: 0.12,
    enterTX: -14,
    enterTY: 14,
    enterScale: 0.75,
    enterRotation: -5,
    exitTX: 12,
    exitTY: -10,
    exitScale: 0.75,
    exitRotation: 5,
  },
  'megaphone': {
    greyEnterFrom: { x: 0, y: 0 },
    mosaicEnterFrom: { x: 0, y: 0 },
    greyExitTo: { x: 0, y: 0 },
    mosaicExitTo: { x: 0, y: 0 },
    overlapTrack: 'mosaic',
    enterTX: -14,
    enterTY: 14,
    enterScale: 0.75,
    enterRotation: -5,
    exitTX: 12,
    exitTY: -10,
    exitScale: 0.75,
    exitRotation: 5,
  },
  'mode': {
    greyEnterFrom: { x: -3, y: 3 },
    mosaicEnterFrom: { x: 3, y: -2 },
    greyExitTo: { x: 2.5, y: -2.5 },
    mosaicExitTo: { x: -2.5, y: 2 },
    overlapTrack: 'mosaic',
    enterTX: -14,
    enterTY: 14,
    enterScale: 0.75,
    enterRotation: -5,
    exitTX: 12,
    exitTY: -10,
    exitScale: 0.75,
    exitRotation: 5,
  },
  'ai-first-jira': {
    greyEnterFrom: { x: -3, y: 3 },
    mosaicEnterFrom: { x: 3, y: -2 },
    greyExitTo: { x: 2.5, y: -2.5 },
    mosaicExitTo: { x: -2.5, y: 2 },
    overlapTrack: 'mosaic',
    enterTX: -14,
    enterTY: 14,
    enterScale: 0.75,
    enterRotation: -5,
    exitTX: 12,
    exitTY: -10,
    exitScale: 0.75,
    exitRotation: 5,
  },
  'code': {
    greyEnterFrom: { x: -3, y: 3 },
    mosaicEnterFrom: { x: 3, y: -2 },
    greyExitTo: { x: 2.5, y: -2.5 },
    mosaicExitTo: { x: -2.5, y: 2 },
    overlapTrack: 'mosaic',
    enterTX: -14,
    enterTY: 14,
    enterScale: 0.75,
    enterRotation: -5,
    exitTX: 12,
    exitTY: -10,
    exitScale: 0.75,
    exitRotation: 5,
  },
  'error': {
    greyEnterFrom: { x: -3, y: 3 },
    mosaicEnterFrom: { x: 3, y: -2 },
    greyExitTo: { x: 2.5, y: -2.5 },
    mosaicExitTo: { x: -2.5, y: 2 },
    overlapTrack: 'mosaic',
    gestureStagger: 0.12,
    enterTX: -14,
    enterTY: 14,
    enterScale: 0.75,
    enterRotation: -5,
    exitTX: 12,
    exitTY: -10,
    exitScale: 0.75,
    exitRotation: 5,
  },
  'help': {
    greyEnterFrom: { x: -3, y: 3 },
    mosaicEnterFrom: { x: 3, y: -2 },
    greyExitTo: { x: 2.5, y: -2.5 },
    mosaicExitTo: { x: -2.5, y: 2 },
    overlapTrack: 'mosaic',
    gestureStagger: 0.12,
    enterTX: -14,
    enterTY: 14,
    enterScale: 0.75,
    enterRotation: -5,
    exitTX: 12,
    exitTY: -10,
    exitScale: 0.75,
    exitRotation: 5,
  },
  'summarize': {
    greyEnterFrom: { x: -3, y: 3 },
    mosaicEnterFrom: { x: 3, y: -2 },
    greyExitTo: { x: 2.5, y: -2.5 },
    mosaicExitTo: { x: -2.5, y: 2 },
    overlapTrack: 'mosaic',
    gestureStagger: 0.12,
    enterTX: -14,
    enterTY: 14,
    enterScale: 0.75,
    enterRotation: -5,
    exitTX: 12,
    exitTY: -10,
    exitScale: 0.75,
    exitRotation: 5,
  },
};

export const ILLUS_ROTATE_GROUP: Record<string, { elements: number[]; anchorX: number; anchorY: number; degrees: number; period: number }> = {
  'deep-research': { elements: [2, 3, 4, 5, 13, 14], anchorX: 34.46, anchorY: 40.18, degrees: 5, period: 3.5 },
};

export const ILLUS_ENTER_DURATION = 0.65;
export const ILLUS_HOLD_DURATION = 3.2;
export const ILLUS_EXIT_DURATION = 0.4;
export const ILLUS_PAUSE_BETWEEN = 0.04;
export const CHAT_ENTER_DURATION = 0.65;
export const CHAT_HOLD_DURATION = 3.2;
export const CHAT_EXIT_DURATION = 0.4;
export const CHAT_PAUSE_DURATION = 0.4;
export const ILLUS_ENTER_Y_OFFSET = 30;
export const ILLUS_EXIT_Y_OFFSET = -20;
// Continuous rotation speed (deg/sec) of the colored mosaic group. Single source
// of truth shared across every Rovo illustration surface: the looping scene here,
// the chat lifecycle, the controlled idle frame, and frame.ts enter/exit. Import
// this rather than redefining a local rate so all surfaces stay in sync.
export const MOSAIC_SPIN_DEG_PER_SEC = 30;
