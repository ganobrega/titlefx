import type { TitlePresetTabStatus } from "./preset";

/** Embedded in generated SVG so we can recognize our own data URLs if needed. */
const STATUS_MARK = "titlefx-status";

/** Cancels in-flight badge updates when the user clears status or disposes. */
let faviconApplySeq = 0;

/** Resolved icon URL → `href` value for `<image>` (itself a data URL). */
const inlinedFaviconByResolvedUrl = new Map<string, string>();

const TAB_STATUS_DOT: Record<TitlePresetTabStatus, string> = {
  error: "#dc2626",
  warning: "#facc15",
  info: "#3b82f6",
};

function xmlEscapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;");
}

function resolveIconHref(href: string): string {
  try {
    return new URL(href, document.baseURI).href;
  } catch {
    return href;
  }
}

function wrapBaselineInBadgeSvg(
  inlinedImageHref: string,
  tabStatus: TitlePresetTabStatus,
): string {
  const escaped = xmlEscapeAttr(inlinedImageHref);
  const fill = TAB_STATUS_DOT[tabStatus];
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">` +
    `<!-- ${STATUS_MARK} -->` +
    `<image href="${escaped}" width="32" height="32" preserveAspectRatio="xMidYMid slice"/>` +
    `<circle cx="25" cy="25" r="5.5" fill="${fill}" stroke="#fff" stroke-width="1.2"/>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function applyBadgedToLinks(
  links: NodeListOf<HTMLLinkElement> | HTMLLinkElement[],
  inlinedImageHref: string,
  tabStatus: TitlePresetTabStatus,
): void {
  const dataUrl = wrapBaselineInBadgeSvg(inlinedImageHref, tabStatus);
  for (const link of links) {
    link.href = dataUrl;
  }
}

function guessMimeFromUrl(url: string): string {
  const noQuery = url.split("?", 1)[0] ?? url;
  const path = (noQuery.split("#", 1)[0] ?? noQuery).toLowerCase();
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".ico")) return "image/x-icon";
  if (path.endsWith(".webp")) return "image/webp";
  if (path.endsWith(".gif")) return "image/gif";
  return "application/octet-stream";
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

async function blobLooksLikeSvg(blob: Blob): Promise<boolean> {
  const head = await blob.slice(0, 512).text();
  return /^\s*</.test(head) && head.includes("<svg");
}

/**
 * Loads the favicon bytes and returns a data URL suitable for `<image href>` inside our wrapper SVG.
 * External http(s) URLs inside a favicon SVG are often not painted by browsers; inlining fixes that.
 */
async function fetchFaviconAsInlineImageHref(resolvedUrl: string): Promise<string | null> {
  try {
    const res = await fetch(resolvedUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    const mime = blob.type || guessMimeFromUrl(resolvedUrl);

    if (mime.includes("svg") || (await blobLooksLikeSvg(blob))) {
      const text = await blob.text();
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`;
    }

    return await blobToDataUrl(blob);
  } catch {
    return null;
  }
}

export function captureBaselineFaviconHref(): string | null {
  if (typeof document === "undefined") return null;
  const link = document.querySelector(
    'link[rel~="icon"], link[rel="shortcut icon"]',
  ) as HTMLLinkElement | null;
  if (!link?.href) return null;
  const href = link.href;
  if (href.includes(STATUS_MARK)) return null;
  return href;
}

export function applyTabIconStatus(
  baselineHref: string | null,
  tabStatus: TitlePresetTabStatus | null,
): void {
  if (typeof document === "undefined") return;

  const myOp = ++faviconApplySeq;

  const links = document.querySelectorAll<HTMLLinkElement>(
    'link[rel~="icon"], link[rel="shortcut icon"]',
  );
  if (links.length === 0) return;

  if (tabStatus == null) {
    if (baselineHref) {
      for (const link of links) {
        link.href = baselineHref;
      }
    }
    return;
  }

  if (!baselineHref) return;

  const resolved = resolveIconHref(baselineHref);
  const cached = inlinedFaviconByResolvedUrl.get(resolved);
  if (cached) {
    applyBadgedToLinks(links, cached, tabStatus);
    return;
  }

  void fetchFaviconAsInlineImageHref(resolved).then((inlined) => {
    if (myOp !== faviconApplySeq) return;
    if (!inlined) return;
    inlinedFaviconByResolvedUrl.set(resolved, inlined);
    const linksNow = document.querySelectorAll<HTMLLinkElement>(
      'link[rel~="icon"], link[rel="shortcut icon"]',
    );
    if (linksNow.length === 0) return;
    applyBadgedToLinks(linksNow, inlined, tabStatus);
  });
}
