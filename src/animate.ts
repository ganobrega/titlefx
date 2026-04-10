export type TitlefxAnimationState = {
  timer: number | null;
  type: "loop" | "bounce" | "blink" | null;
  index: number;
  frames: string[];
};

type AnimationTimerMode = "raf" | "timeout";
type AnimationRuntime = {
  timerMode: AnimationTimerMode | null;
  visibilityHandler: (() => void) | null;
  intervalTimer: number | null;
  timeoutTimer: number | null;
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
const animationRuntime = new WeakMap<TitlefxAnimationState, AnimationRuntime>();

function getRuntime(state: TitlefxAnimationState): AnimationRuntime {
  let runtime = animationRuntime.get(state);
  if (!runtime) {
    runtime = {
      timerMode: null,
      visibilityHandler: null,
      intervalTimer: null,
      timeoutTimer: null,
    };
    animationRuntime.set(state, runtime);
  }
  return runtime;
}

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
  if (!state) return;

  const runtime = getRuntime(state);
  if (runtime.timerMode === "timeout" && runtime.timeoutTimer !== null) {
    window.clearTimeout(runtime.timeoutTimer);
  } else if (runtime.timerMode === "raf" && state.timer !== null) {
    window.cancelAnimationFrame(state.timer);
  }

  if (runtime.intervalTimer !== null) {
    window.clearInterval(runtime.intervalTimer);
  }

  state.timer = null;
  runtime.timerMode = null;
  runtime.intervalTimer = null;
  runtime.timeoutTimer = null;

  if (runtime.visibilityHandler) {
    document.removeEventListener("visibilitychange", runtime.visibilityHandler);
    runtime.visibilityHandler = null;
  }
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

  const runtime = getRuntime(state);
  let nextTickAt = performance.now() + getNextDelay(type, speed, state.index, frames.length);

  const advanceFrame = (now: number) => {
    if (now < nextTickAt) return false;

    state.index = state.index >= state.frames.length - 1 ? 0 : state.index + 1;
    onFrame(state.frames[state.index] ?? text);
    nextTickAt += getNextDelay(type, speed, state.index, state.frames.length);
    return true;
  };

  const catchUpFrames = (now: number) => {
    if (type === "blink" && getRuntime(state).timerMode === "timeout") {
      if (now < nextTickAt) return false;

      state.index = state.index >= state.frames.length - 1 ? 0 : state.index + 1;
      onFrame(state.frames[state.index] ?? text);
      nextTickAt = now + getNextDelay(type, speed, state.index, state.frames.length);
      return true;
    }

    let advanced = false;
    let guard = 0;

    while (now >= nextTickAt && guard < Math.max(4, state.frames.length * 2)) {
      advanced = advanceFrame(now) || advanced;
      guard += 1;
    }

    if (now > nextTickAt) {
      nextTickAt = now + getNextDelay(type, speed, state.index, state.frames.length);
    }

    return advanced;
  };

  const clearScheduledTick = () => {
    if (runtime.timerMode === "timeout" && runtime.timeoutTimer !== null) {
      window.clearTimeout(runtime.timeoutTimer);
    } else if (runtime.timerMode === "raf" && state.timer !== null) {
      window.cancelAnimationFrame(state.timer);
    }
    if (runtime.intervalTimer !== null) {
      window.clearInterval(runtime.intervalTimer);
    }
    state.timer = null;
    runtime.timerMode = null;
    runtime.intervalTimer = null;
    runtime.timeoutTimer = null;
  };

  const scheduleVisibleTick = () => {
    clearScheduledTick();
    runtime.timerMode = "raf";

    const tick = (now: number) => {
      catchUpFrames(now);
      if (runtime.timerMode !== "raf") return;
      state.timer = window.requestAnimationFrame(tick);
    };

    state.timer = window.requestAnimationFrame(tick);
  };

  const scheduleHiddenTick = () => {
    clearScheduledTick();
    runtime.timerMode = "timeout";

    const poll = () => {
      const now = performance.now();
      catchUpFrames(now);
      if (runtime.timerMode !== "timeout") return;
    };

    const startInterval = () => {
      poll();
      if (runtime.timerMode !== "timeout") return;

      const intervalMs = Math.max(
        16,
        Math.min(
          SPEED_INTERVALS[speed],
          getNextDelay(type, speed, state.index, state.frames.length),
        ),
      );
      runtime.intervalTimer = window.setInterval(poll, intervalMs);
    };

    const delay = Math.max(16, Math.round(nextTickAt - performance.now()));
    runtime.timeoutTimer = window.setTimeout(startInterval, delay);
    state.timer = runtime.timeoutTimer;
  };

  const syncScheduler = () => {
    if (document.hidden) {
      scheduleHiddenTick();
    } else {
      scheduleVisibleTick();
    }
  };

  runtime.visibilityHandler = syncScheduler;
  document.addEventListener("visibilitychange", syncScheduler);
  syncScheduler();
}
