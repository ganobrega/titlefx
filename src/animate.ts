export type TitlefxAnimationState = {
  timer: number | null;
  type: "loop" | "bounce" | "blink" | null;
  index: number;
  frames: string[];
};

export type TitlefxAnimationSpeed = "slow" | "normal" | "fast";
export type TitlefxAnimationType = "loop" | "bounce" | "blink";

const SPEED_INTERVALS: Record<TitlefxAnimationSpeed, number> = {
  slow: 180,
  normal: 110,
  fast: 70,
};

/** Blink holds each frame longer; tab on/off should read clearly. */
const BLINK_SPEED_INTERVALS: Record<TitlefxAnimationSpeed, number> = {
  slow: 950,
  normal: 580,
  fast: 360,
};

const MIN_DELAY_FACTOR = 0.68;
const MAX_DELAY_FACTOR = 1.45;

export function createAnimationState(): TitlefxAnimationState {
  return {
    timer: null,
    type: null,
    index: 0,
    frames: [],
  };
}

export function createLoopFrames(text: string): string[] {
  if (!text) return [""];

  const gap = "\u2800\u2800\u2800\u2800\u2800\u2800";
  const source = `${text}${gap}`;
  const frames: string[] = [];
  const gapStart = text.length;

  for (let i = 0; i < source.length; i += 1) {
    const frame = source.slice(i) + source.slice(0, i);
    frames.push(frame);

    // Hold a little longer while crossing the wrap gap so it does not feel
    // disproportionately fast when the visible text gets sparse.
    if (i >= gapStart || i <= 1) {
      frames.push(frame);
    }
  }

  return frames;
}

/** Braille pattern blank — visible as empty space in many tab UIs. */
const BRAILLE_BLANK = "\u2800";

/**
 * Alternates between the real title and the same length in Braille blanks
 * (tab keeps width; text appears to blink off/on).
 */
export function createBlinkFrames(text: string): string[] {
  if (!text) return [""];

  const blanked = Array.from(text, () => BRAILLE_BLANK).join("");
  return [text, blanked];
}

export function createBackAndForthFrames(text: string): string[] {
  if (!text) return [""];

  const travel = Math.max(4, Math.min(10, Math.ceil(text.length / 3)));
  const spacer = "\u2800";
  const forward: string[] = [];

  for (let offset = travel; offset >= 0; offset -= 1) {
    forward.push(spacer.repeat(offset) + text);
  }

  if (forward.length <= 2) return forward;
  return [...forward, ...forward.slice(1, -1).reverse()];
}

function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

function easeInOutQuad(value: number): number {
  const x = clamp01(value);
  if (x < 0.5) return 2 * x * x;
  return 1 - Math.pow(-2 * x + 2, 2) / 2;
}

function getCycleProgress(index: number, frameCount: number): number {
  if (frameCount <= 1) return 0;
  return index / (frameCount - 1);
}

function getDelayFactor(
  type: TitlefxAnimationType,
  index: number,
  frameCount: number,
): number {
  const progress = getCycleProgress(index, frameCount);

  if (type === "bounce") {
    const fromEdgeToCenter = 1 - Math.abs(progress * 2 - 1);
    const eased = easeInOutQuad(fromEdgeToCenter);
    return lerp(MAX_DELAY_FACTOR, MIN_DELAY_FACTOR, eased);
  }

  if (type === "blink") {
    return 1;
  }

  const wave = 1 - Math.abs(progress * 2 - 1);
  const eased = easeInOutQuad(wave);
  return lerp(1.15, 0.82, eased);
}

function getNextDelay(
  type: TitlefxAnimationType,
  speed: TitlefxAnimationSpeed,
  index: number,
  frameCount: number,
): number {
  const base =
    type === "blink" ? BLINK_SPEED_INTERVALS[speed] : SPEED_INTERVALS[speed];
  const factor = getDelayFactor(type, index, frameCount);
  return Math.max(16, Math.round(base * factor));
}

export function stopAnimation(state: TitlefxAnimationState | null): void {
  if (!state || state.timer === null) return;
  window.cancelAnimationFrame(state.timer);
  state.timer = null;
}

export function startTitleAnimation(
  state: TitlefxAnimationState,
  text: string,
  type: TitlefxAnimationType,
  speed: TitlefxAnimationSpeed,
  onFrame: (value: string) => void,
): void {
  const frames =
    type === "bounce"
      ? createBackAndForthFrames(text)
      : type === "blink"
        ? createBlinkFrames(text)
        : createLoopFrames(text);

  state.type = type;
  state.frames = frames;
  state.index = 0;

  onFrame(frames[0] ?? text);

  if (frames.length <= 1) {
    state.timer = null;
    return;
  }

  let nextDelay = getNextDelay(type, speed, state.index, frames.length);
  let nextTickAt = performance.now() + nextDelay;

  const tick = (now: number) => {
    if (now >= nextTickAt) {
      state.index = state.index >= state.frames.length - 1 ? 0 : state.index + 1;
      onFrame(state.frames[state.index] ?? text);

      nextDelay = getNextDelay(
        type,
        speed,
        state.index,
        state.frames.length,
      );
      nextTickAt = now + nextDelay;
    }

    state.timer = window.requestAnimationFrame(tick);
  };

  state.timer = window.requestAnimationFrame(tick);
}
