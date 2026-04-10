# titlefx

Small helper to format and apply `document.title` through presets. Browser-only; in SSR or without `window`/`document` it stays inert.

## Usage

```ts
import titlefx from "titlefx";

titlefx.preset("default", {
  brand: "Spotify",
  context: "Homepage",
});

titlefx.preset("notifications", {
  prefix: "🔥",
  context: "Novo match",
  brand: "Tinder",
  count: 3,
  suffix: "❤️😍🥰",
});

titlefx.dispose();
```

## Install

```bash
npm install titlefx
```

```bash
pnpm add titlefx
bun add titlefx
```

## Documentation

Site built with **VitePress** (guide, API, interactive playground):

```bash
bun install
bun run docs:dev
```

Build for static hosting (e.g. GitHub Pages):

```bash
bun run docs:build
```

Output: `docs/.vitepress/dist`. In `docs/.vitepress/config.ts`, `base` defaults to `/` (domínio na raiz). Para GitHub Pages em `https://<user>.github.io/<repo>/`, define `base: '/<repo>/'`.

Repository: [github.com/ganobrega/titlefx](https://github.com/ganobrega/titlefx)
