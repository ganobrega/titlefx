import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitepress";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  lang: "en-US",
  title: "titlefx",
  titleTemplate: ":title · titlefx",
  description:
    "A lightweight library to format and apply document.title with presets and simple tab animations.",
  base: "/",

  head: [
    ["link", { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" }],
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
        text: "0.1.0",
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
