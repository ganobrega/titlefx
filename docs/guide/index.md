# Guide

`titlefx` formats and applies `document.title` through presets. The basic idea is simple: build a clear browser tab title and optionally animate it.

## Installation

```bash
npm install titlefx
```

```bash
pnpm add titlefx
```

```bash
bun add titlefx
```

## First use

```ts
import titlefx from "titlefx";

titlefx.preset("default", {
  context: "Homepage",
  brand: "My site",
});
```

This produces:

```txt
Homepage - My site
```

You can override the `default` preset separator with `separator`, but it falls back to `-`.

## Common presets

### Notifications

```ts
titlefx.preset("notifications", {
  prefix: "NEW",
  count: 3,
  brand: "Tinder",
  context: "New match",
});
```

Result:

```txt
NEW (3) Tinder • New match
```

### Progress

```ts
titlefx.preset("progress", {
  count: 42,
  brand: "uTorrent",
  context: "Downloading update",
});
```

Result:

```txt
[42%] uTorrent • Downloading update
```

### Custom

```ts
titlefx.preset("custom", {
  template: "{pre}Inbox ({count}) - {email}{suf}",
  prefix: "Mail",
  count: 8,
  email: "me@example.com",
});
```

## Animation

All presets accept:

```ts
{
  animate?: boolean;
  animation?: "loop" | "bounce" | "blink";
  speed?: "slow" | "normal" | "fast";
}
```

Example:

```ts
titlefx.preset("media", {
  content: "Blinding Lights",
  author: "The Weeknd",
  brand: "Spotify",
  animate: true,
  animation: "bounce",
  speed: "normal",
});
```

When the tab is visible, animations use `requestAnimationFrame`. When the page loses focus, `titlefx` switches to timers and catches up delayed ticks so marquee-like motion does not obviously slow down in the background.

## Cleanup

To restore the original page title and stop the current animation:

```ts
titlefx.dispose();
```

## Browser and SSR

- In the browser, `window.titlefx` points to the same API
- Without DOM access, the package does not touch `window` or `document`

For full formatting and type details, see the [Reference](/api/).
