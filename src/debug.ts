/** Comfortable desktop tab title length (between ~50–60). */
export const TITLE_TAB_COMFORT_CHARS = 55;

/** Recommended maximum character count for desktop tab titles. */
export const TITLE_TAB_MAX_CHARS = 60;

/**
 * Approximate visual “width” budget for a tab title on desktop (narrow vs wide letters).
 * Goes up to ~70 depending on glyphs (e.g. `W`, emoji).
 */
export const TITLE_TAB_MAX_VISUAL_UNITS = 70;

export type TitlefxDebugLimits = {
  comfortChars: number;
  maxChars: number;
  maxVisualUnits: number;
};

export type TitlefxDebugRules = {
  withinComfortChars: boolean;
  withinMaxChars: boolean;
  withinMaxVisual: boolean;
};

export type TitlefxDebugReport = {
  title: string;
  /** `String#length` (UTF-16 code units; many emoji count as 2). */
  length: number;
  /** Heuristic tab “width”; compare to `limits.maxVisualUnits`. */
  visualUnits: number;
  limits: TitlefxDebugLimits;
  rules: TitlefxDebugRules;
  /**
   * `true` when both character and visual budgets are respected
   * (`withinMaxChars` and `withinMaxVisual`).
   */
  canContinue: boolean;
  /** Human-readable outcomes per rule / hints when something fails. */
  notes: string[];
};

const NARROW_ASCII = new Set(
  "il1|!'.,;:`\"[](){}".split(""),
);

const WIDE_ASCII = new Set("wmWM@%&".split(""));

/**
 * Sums approximate visual units for tab truncation (proportional fonts).
 */
export function estimateTitleVisualUnits(title: string): number {
  let total = 0;
  for (let i = 0; i < title.length; ) {
    const cp = title.codePointAt(i)!;
    const ch = String.fromCodePoint(cp);
    let w: number;
    if (cp === 0x20) {
      w = 0.35;
    } else if (cp < 0x80) {
      const s = String.fromCodePoint(cp);
      if (NARROW_ASCII.has(s)) w = 0.78;
      else if (WIDE_ASCII.has(s)) w = 1.28;
      else w = 1;
    } else if (cp >= 0x1f300 || (cp >= 0x2600 && cp <= 0x27bf)) {
      w = 2;
    } else if (cp >= 0x4e00 && cp <= 0x9fff) {
      w = 1.2;
    } else {
      w = 1.05;
    }
    total += w;
    i += ch.length;
  }
  return Math.round(total * 10) / 10;
}

export function buildTitleDebugReport(
  title: string,
  limits: TitlefxDebugLimits = {
    comfortChars: TITLE_TAB_COMFORT_CHARS,
    maxChars: TITLE_TAB_MAX_CHARS,
    maxVisualUnits: TITLE_TAB_MAX_VISUAL_UNITS,
  },
): TitlefxDebugReport {
  const length = title.length;
  const visualUnits = estimateTitleVisualUnits(title);

  const withinComfortChars = length <= limits.comfortChars;
  const withinMaxChars = length <= limits.maxChars;
  const withinMaxVisual = visualUnits <= limits.maxVisualUnits;

  const canContinue = withinMaxChars && withinMaxVisual;

  const notes: string[] = [];

  if (withinComfortChars) {
    notes.push(
      `Comfort: length ${length} ≤ ${limits.comfortChars} (good for desktop tabs).`,
    );
  } else if (withinMaxChars) {
    notes.push(
      `Comfort: length ${length} is above ${limits.comfortChars} but still ≤ ${limits.maxChars}.`,
    );
  } else {
    notes.push(
      `Length ${length} exceeds desktop max (${limits.maxChars}); tab will truncate heavily.`,
    );
  }

  if (withinMaxVisual) {
    notes.push(
      `Visual budget: ~${visualUnits} ≤ ${limits.maxVisualUnits} (glyph mix is OK).`,
    );
  } else {
    notes.push(
      `Visual budget: ~${visualUnits} exceeds ~${limits.maxVisualUnits}; many wide letters or emoji shorten the readable part.`,
    );
  }

  if (canContinue) {
    notes.push("Overall: title can continue within desktop tab rules.");
  } else {
    notes.push("Overall: shorten the title for reliable desktop tab visibility.");
  }

  return {
    title,
    length,
    visualUnits,
    limits: { ...limits },
    rules: {
      withinComfortChars,
      withinMaxChars,
      withinMaxVisual,
    },
    canContinue,
    notes,
  };
}
