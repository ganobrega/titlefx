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
  success: "#22c55e",
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

/** Bottom-right badge: solid dot, or outlined check for `success` (white stroke under green). */
function tabStatusOverlay(tabStatus: TitlePresetTabStatus): string {
  const cx = 25;
  const cy = 25;
  const r = 5.5;
  const ring = ` stroke="#fff" stroke-width="1.2"`;

  if (tabStatus === "success") {
    const green = TAB_STATUS_DOT.success;
    const d = "M4 8.8 7.4 12.4 14.2 3.9";
    // Nested SVG in the corner; viewBox padding so thick strokes are not clipped.
    return (
      `<svg x="13" y="13" width="19" height="19" viewBox="-1.5 -1.5 20 20" overflow="visible">` +
      `<path d="${d}" fill="none" stroke="#ffffff" stroke-width="3.9" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="${d}" fill="none" stroke="${green}" stroke-width="2.45" stroke-linecap="round" stroke-linejoin="round"/>` +
      `</svg>`
    );
  }

  const fill = TAB_STATUS_DOT[tabStatus];
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${ring}/>`;
}

function wrapBaselineInBadgeSvg(
  inlinedImageHref: string,
  tabStatus: TitlePresetTabStatus,
): string {
  const escaped = xmlEscapeAttr(inlinedImageHref);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">` +
    `<!-- ${STATUS_MARK} -->` +
    `<image href="${escaped}" width="32" height="32" preserveAspectRatio="xMidYMid slice"/>` +
    tabStatusOverlay(tabStatus) +
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
