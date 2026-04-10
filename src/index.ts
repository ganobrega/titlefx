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
import { buildTitleDebugReport, type TitlefxDebugReport } from "./debug";
import { applyTabIconStatus, captureBaselineFaviconHref } from "./favicon";
import {
  preset,
  type TitlePresetName,
  type TitlePresetOptionsMap,
  type TitlePresetTabStatus,
} from "./preset";

export type {
  TitlePresetCommonOptions,
  TitlePresetName,
  TitlePresetOptionsMap,
  TitlePresetTabStatus,
} from "./preset";

export {
  createAnimationState,
  createBackAndForthFrames,
  createBlinkFrames,
  createLoopFrames,
  startTitleAnimation,
  stopAnimation,
} from "./animate";

export type { TitlefxDebugLimits, TitlefxDebugReport, TitlefxDebugRules } from "./debug";

export {
  TITLE_TAB_COMFORT_CHARS,
  TITLE_TAB_MAX_CHARS,
  TITLE_TAB_MAX_VISUAL_UNITS,
  buildTitleDebugReport,
  estimateTitleVisualUnits,
} from "./debug";

type TitlefxState = {
  originalTitle: string;
  lastTitle: string;
  lastPreset: TitlePresetName;
  lastOptions: Record<string, unknown>;
  animation: TitlefxAnimationState;
  /** Favicon `href` before any titlefx badge; used to restore on clear or when `status` is off. */
  originalFaviconHref: string | null;
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

function normalizePresetTabStatus(
  raw: boolean | TitlePresetTabStatus | undefined,
): TitlePresetTabStatus | null {
  if (raw === true || raw === "warning") return "warning";
  if (raw === "error") return "error";
  if (raw === "info") return "info";
  return null;
}

type TitlefxApi = {
  preset<TName extends TitlePresetName>(
    name: TName,
    options?: TitlePresetOptionsMap[TName],
  ): string;
  dispose(): void;
  /**
   * Checks the current (or given) title against desktop tab length rules:
   * ~55 chars comfort, 60 max by count, ~70 max by approximate glyph width.
   */
  debug(overrideTitle?: string): TitlefxDebugReport;
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
      const originalFaviconHref =
        current?.originalFaviconHref ?? captureBaselineFaviconHref();
      stopAnimation(current?.animation ?? null);

      const nextState: TitlefxState = {
        originalTitle,
        lastTitle: built,
        lastPreset: name,
        lastOptions: options as unknown as Record<string, unknown>,
        animation: createAnimationState(),
        originalFaviconHref,
      };

      applyTabIconStatus(
        originalFaviconHref,
        normalizePresetTabStatus(options.status),
      );

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
      if (state.originalFaviconHref != null) {
        applyTabIconStatus(state.originalFaviconHref, null);
      }
    }
    clearState();

    // Keep `window.titlefx` pointing to the API for debugging, but allow users
    // to fully clean up by deleting it themselves if they want.
    window.titlefx = titlefx;
  },

  debug(overrideTitle) {
    let title: string;
    if (overrideTitle !== undefined) {
      title = overrideTitle;
    } else if (hasDOM()) {
      title = document.title;
    } else {
      title = getState()?.lastTitle ?? "";
    }
    return buildTitleDebugReport(title);
  },
};

// Attach eagerly when in the browser.
if (hasDOM()) {
  window.titlefx = titlefx;
}

export { titlefx };
export default titlefx;
