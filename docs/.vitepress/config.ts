import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitepress";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PKG_PATH = path.resolve(__dirname, "../../package.json");

/** GitHub Pages project URL: https://<owner>.github.io/titlefx/ — head tags are not base-rewritten. */
const SITE_BASE = "/titlefx/";

function readLocalPackageVersion(): string {
  const raw = readFileSync(PKG_PATH, "utf-8");
  const pkg = JSON.parse(raw) as { version?: string };
  return typeof pkg.version === "string" ? pkg.version : "0.0.0";
}

/** Latest dist-tag on npm; falls back to package.json if the registry is unreachable. */
async function navPackageVersion(packageName: string): Promise<string> {
  const local = readLocalPackageVersion();
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 4000);
  try {
    const res = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`,
      { signal: ac.signal, headers: { Accept: "application/json" } },
    );
    if (!res.ok) return local;
    const data = (await res.json()) as { version?: string };
    return typeof data.version === "string" ? data.version : local;
  } catch {
    return local;
  } finally {
    clearTimeout(t);
  }
}

const versionLabel = await navPackageVersion("titlefx");

export default defineConfig({
    lang: "en-US",
    title: "titlefx",
    titleTemplate: ":title · titlefx",
    description:
      "A lightweight library to format and apply document.title with presets and simple tab animations.",
    base: SITE_BASE,

    head: [
      [
        "link",
        { rel: "icon", href: `${SITE_BASE}favicon.svg`, type: "image/svg+xml" },
      ],
    ],

    vite: {
      resolve: {
        alias: {
          titlefx: path.resolve(__dirname, "../../src/index.ts"),
        },
      },
    },

    themeConfig: {
      nav: [
        { text: "Guide", link: "/guide/", activeMatch: "/guide/" },
        { text: "Reference", link: "/api/", activeMatch: "/api/" },
        {
          text: versionLabel,
          items: [
            {
              text: "Changelog",
              link: "https://github.com/ganobrega/titlefx/releases",
              target: "_blank",
              rel: "noreferrer",
            },
            {
              text: "Contributing",
              link: "https://github.com/ganobrega/titlefx/blob/main/.github/contributing.md",
              target: "_blank",
              rel: "noreferrer",
            },
          ],
        },
      ],

      sidebar: {
        "/guide/": [
          {
            text: "Guide",
            items: [{ text: "Overview", link: "/guide/" }],
          },
        ],
        "/api/": [
          {
            text: "Reference",
            items: [{ text: "Overview", link: "/api/" }],
          },
        ],
      },

      outline: {
        level: [2, 3],
        label: "On this page",
      },

      socialLinks: [
        { icon: "github", link: "https://github.com/ganobrega/titlefx" },
      ],

      search: {
        provider: "local",
        options: {
          translations: {
            button: {
              buttonText: "Search",
              buttonAriaLabel: "Search documentation",
            },
            modal: {
              displayDetails: "Display details",
              resetButtonTitle: "Clear",
              backButtonTitle: "Close",
              noResultsText: "No results found",
              footer: {
                selectText: "to select",
                navigateText: "to navigate",
                closeText: "to close",
              },
            },
          },
        },
      },

      docFooter: {
        prev: "Previous",
        next: "Next",
      },
    },
});
