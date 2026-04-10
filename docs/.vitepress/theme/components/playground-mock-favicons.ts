/**
 * Favicons for the browser mockup only (remote PNG via Google’s favicon cache).
 * Demo / illustrative use — not bundled as assets.
 */
const DOMAIN_BY_EXAMPLE_ID: Record<string, string> = {
  spotify: "spotify.com",
  whatsapp: "whatsapp.com",
  gmail: "mail.google.com",
  instagram: "instagram.com",
  tinder: "tinder.com",
  "installer-progress": "utorrent.com",
  github: "github.com",
};

export function mockFaviconUrlForExample(exampleId: string): string | null {
  const domain = DOMAIN_BY_EXAMPLE_ID[exampleId];
  if (!domain) return null;
  const q = encodeURIComponent(domain);
  return `https://www.google.com/s2/favicons?domain=${q}&sz=64`;
}
