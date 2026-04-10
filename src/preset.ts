import { clampCount } from "./clamp";

export type TitlePresetName =
  | "default"
  | "media"
  | "notifications"
  | "progress"
  | "custom";

/** Tab favicon badge variant. `true` in options is treated as `"warning"`. */
export type TitlePresetTabStatus = "error" | "info" | "success" | "warning";

export type TitlePresetCommonOptions = {
  /** Trim + append a single trailing space (e.g. `"🔥 "`). */
  prefix?: string;
  /** Trim + prepend a single leading space (e.g. `" ❤️😍"`). */
  suffix?: string;
  /**
   * Composites the tab favicon with a small status badge (bottom-right): `error` / `warning` /
   * `info` use a colored dot; `success` draws a check with dark + white + light-green strokes so
   * it stays readable on green-tinted icons. `true` is the same as `"warning"`. Requires an
   * existing `link[rel~=icon]` in the document.
   */
  status?: boolean | TitlePresetTabStatus;
  /** Enable animated title rendering when applied via `titlefx.preset(...)`. */
  animate?: boolean;
  /** Supported animation types. */
  animation?: "loop" | "bounce" | "blink";
  /** Animation speed preset. */
  speed?: "slow" | "normal" | "fast";
};

export type TitlePresetOptionsMap = {
  default: TitlePresetCommonOptions & {
    separator?: string;
    /** Alias for title. If `title` is empty, `context` is used. */
    context?: string;
    title?: string;
    brand?: string;
  };
  media: TitlePresetCommonOptions & {
    content?: string;
    author?: string;
    brand?: string;
  };
  notifications: TitlePresetCommonOptions & {
    separator?: string;
    context?: string;
    brand?: string;
    count?: number;
  };
  progress: TitlePresetCommonOptions & {
    separator?: string;
    context?: string;
    brand?: string;
    count?: number;
  };
  custom: TitlePresetCommonOptions & {
    template?: string;
    separator?: string;
    count?: string | number;
    [key: string]: unknown;
  };
};

function s(v: unknown): string {
  if (v === undefined || v === null) return "";
  return String(v);
}

function formatPrefix(prefix: unknown): string {
  const t = s(prefix).trim();
  if (!t) return "";
  return `${t} `;
}

function formatSuffix(suffix: unknown): string {
  const t = s(suffix).trim();
  if (!t) return "";
  return ` ${t}`;
}

function formatJoiner(joiner: string): string {
  return ` ${joiner.trim()} `;
}

function formatSeparator(separator: unknown): string {
  const t = s(separator).trim();
  // Default separator is "•" (rendered as " • ").
  return formatJoiner(t || "•");
}

function joinWith(
  a: string,
  joiner: string,
  b: string,
): string {
  const left = a.trim();
  const right = b.trim();
  if (!left && !right) return "";
  if (!left) return right;
  if (!right) return left;
  return `${left}${joiner}${right}`;
}

function formatDefaultSeparator(separator: unknown): string {
  const t = s(separator).trim();
  return formatJoiner(t || "-");
}

function formatNotificationsCount(count: unknown): string {
  if (count === undefined) return "";
  const n = clampCount(Number(count));
  return `(${n}) `;
}

function formatProgressCount(count: unknown): string {
  if (count === undefined) return "";
  const n = clampCount(Number(count));
  return `[${n}%] `;
}

function formatCustomValue(key: string, value: unknown): string {
  if (value === undefined || value === null) return "";

  if (key === "prefix" || key === "pre") {
    return formatPrefix(value);
  }

  if (key === "suffix" || key === "suf") {
    return formatSuffix(value);
  }

  if (key === "separator") {
    return formatSeparator(value);
  }

  return s(value);
}

function formatCustomTemplate(
  template: string,
  options: TitlePresetOptionsMap["custom"],
): string {
  return template.replace(/\{([^}]+)\}/g, (_match, rawKey: string) => {
    const key = rawKey.trim();

    if (key === "pre") return formatPrefix(options.prefix);
    if (key === "suf") return formatSuffix(options.suffix);

    return formatCustomValue(key, options[key]);
  });
}

export function preset(
  name: "default",
  options?: TitlePresetOptionsMap["default"],
): string;
export function preset(
  name: "media",
  options?: TitlePresetOptionsMap["media"],
): string;
export function preset(
  name: "notifications",
  options?: TitlePresetOptionsMap["notifications"],
): string;
export function preset(
  name: "progress",
  options?: TitlePresetOptionsMap["progress"],
): string;
export function preset(
  name: "custom",
  options?: TitlePresetOptionsMap["custom"],
): string;
export function preset(
  name: TitlePresetName,
  options?: TitlePresetOptionsMap[TitlePresetName],
): string {
  if (!options) {
    switch (name) {
      case "default":
        return "{pre}{title}{separator}{brand}{suf}";
      case "media":
        return "{pre}{content} - {author} | {brand}{suf}";
      case "notifications":
        return "{pre}({count}) {brand}{separator}{context}{suf}";
      case "progress":
        return "{pre}[{count}%] {brand}{separator}{context}{suf}";
      case "custom":
        return "{template}";
      default: {
        const _exhaustive: never = name;
        return _exhaustive;
      }
    }
  }

  const pre = formatPrefix(options.prefix);
  const suf = formatSuffix(options.suffix);

  switch (name) {
    case "default": {
      const o = options as TitlePresetOptionsMap["default"];
      const title = s(o.title || o.context).trim();
      const brand = s(o.brand).trim();
      const core = joinWith(title, formatDefaultSeparator(o.separator), brand);
      return `${pre}${core}${suf}`;
    }
    case "media": {
      const o = options as TitlePresetOptionsMap["media"];
      const content = s(o.content).trim();
      const author = s(o.author).trim();
      const brand = s(o.brand).trim();
      const left = joinWith(content, formatJoiner("-"), author);
      const core = joinWith(left, formatJoiner("|"), brand);
      return `${pre}${core}${suf}`;
    }
    case "notifications": {
      const o = options as TitlePresetOptionsMap["notifications"];
      const count = formatNotificationsCount(o.count);
      const brand = s(o.brand).trim();
      const context = s(o.context).trim();
      const core = joinWith(brand, formatSeparator(o.separator), context);
      return `${pre}${count}${core}${suf}`;
    }
    case "progress": {
      const o = options as TitlePresetOptionsMap["progress"];
      const count = formatProgressCount(o.count);
      const brand = s(o.brand).trim();
      const context = s(o.context).trim();
      const core = joinWith(brand, formatSeparator(o.separator), context);
      return `${pre}${count}${core}${suf}`;
    }
    case "custom": {
      const o = options as TitlePresetOptionsMap["custom"];
      const template = s(o.template).trim();
      if (!template) return `${pre}${suf}`.trim();
      return formatCustomTemplate(template, o).trim();
    }
    default: {
      const _exhaustive: never = name;
      return _exhaustive;
    }
  }
}
