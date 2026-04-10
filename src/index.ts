import {
  createAnimationState,
  createBackAndForthFrames,
  createLoopFrames,
  startTitleAnimation,
  stopAnimation,
  type TitlefxAnimationState,
  type TitlefxAnimationSpeed,
  type TitlefxAnimationType,
} from "./animate";
import { preset, type TitlePresetName, type TitlePresetOptionsMap } from "./preset";

export type {
  TitlePresetCommonOptions,
  TitlePresetName,
  TitlePresetOptionsMap,
} from "./preset";

export {
  createAnimationState,
  createBackAndForthFrames,
  createBlinkFrames,
  createLoopFrames,
  startTitleAnimation,
  stopAnimation,
} from "./animate";

type TitlefxState = {
  originalTitle: string;
  lastTitle: string;
  lastPreset: TitlePresetName;
  lastOptions: Record<string, unknown>;
  animation: TitlefxAnimationState;
};

const STATE_KEY = "__titlefx_state__";

function hasDOM(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function getState(): TitlefxState | null {
  if (!hasDOM()) return null;
  return ((window as any)[STATE_KEY] as TitlefxState | null | undefined) ?? null;
}

function setState(next: TitlefxState): void {
  if (!hasDOM()) return;
  (window as any)[STATE_KEY] = next;
}

function clearState(): void {
  if (!hasDOM()) return;
  delete (window as any)[STATE_KEY];
}

type TitlefxApi = {
  preset<TName extends TitlePresetName>(
    name: TName,
    options?: TitlePresetOptionsMap[TName],
  ): string;
  dispose(): void;
};

export type Titlefx = TitlefxApi;

declare global {
  interface Window {
    /** Singleton API + state lives in `window` for framework-agnostic use. */
    titlefx?: TitlefxApi;
  }
}

const titlefx: TitlefxApi = {
  preset(name, options) {
    // Template mode: return the placeholder string for docs/UX.
    if (!options) return preset(name as any);

    const built = preset(name as any, options as any);

    if (hasDOM()) {
      const current = getState();
      const originalTitle = current?.originalTitle ?? document.title;
      stopAnimation(current?.animation ?? null);

      const nextState: TitlefxState = {
        originalTitle,
        lastTitle: built,
        lastPreset: name,
        lastOptions: options as unknown as Record<string, unknown>,
        animation: createAnimationState(),
      };

      if (
        options.animate &&
        (
          options.animation === "loop" ||
          options.animation === "bounce" ||
          options.animation === "blink"
        )
      ) {
        const animationType = options.animation as TitlefxAnimationType;
        const speed = (options.speed ?? "normal") as TitlefxAnimationSpeed;
        startTitleAnimation(
          nextState.animation,
          built,
          animationType,
          speed,
          (value) => {
            document.title = value;
          },
        );
      } else {
        document.title = built;
      }

      setState(nextState);
      // Expose for debugging and "state in window".
      window.titlefx = titlefx;
    }

    return built;
  },

  dispose() {
    if (!hasDOM()) return;

    const state = getState();
    stopAnimation(state?.animation ?? null);
    if (state) {
      document.title = state.originalTitle;
    }
    clearState();

    // Keep `window.titlefx` pointing to the API for debugging, but allow users
    // to fully clean up by deleting it themselves if they want.
    window.titlefx = titlefx;
  },
};

// Attach eagerly when in the browser.
if (hasDOM()) {
  window.titlefx = titlefx;
}

export { titlefx };
export default titlefx;
