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

## Good practices

Keep tab title logic in one place so presets stay consistent and easy to change. A small module with named helpers works well:

```ts
// src/lib/titles.ts
import titlefx, { type TitlePresetTabStatus } from "titlefx";

type NotificationTabInput = {
  count: number;
  brand: string;
  context: string;
  prefix?: string;
};

export const pushNotificationTitle = (input: NotificationTabInput) =>
  titlefx.preset("notifications", {
    prefix: input.prefix,
    count: input.count,
    brand: input.brand,
    context: input.context,
  });

// Elsewhere
pushNotificationTitle({ count: 2, brand: "App", context: "New message" });
```

For a **GitHub-style** tab (commit message + `user/repo@branch`, custom template, optional favicon status):

```ts
// src/lib/titles.ts (continued — same imports as above)

type GithubStyleTabInput = {
  user: string;
  repo: string;
  branch: string;
  context: string;
  separator?: string;
  status?: boolean | TitlePresetTabStatus;
};

export const pushGithubStyleTitle = (input: GithubStyleTabInput) =>
  titlefx.preset("custom", {
    template: "{pre}{context}{separator}{user}/{repo}@{branch}{suf}",
    user: input.user,
    repo: input.repo,
    branch: input.branch,
    context: input.context,
    separator: input.separator ?? " · ",
    status: input.status,
  });

// Elsewhere
pushGithubStyleTitle({
  user: "ganobrega",
  repo: "titlefx",
  branch: "17c4e2f",
  context: "Update version in package.json to 0.1.0",
  status: "warning",
});
```

- Prefer **typed helpers** (or shared option objects) over scattering raw `preset(...)` calls across components.
- **Animations:** there is no pause/resume API. To stop motion, call **`preset` again** for the same context with **`animate: false`** (or omit `animate` / `animation` / `speed`), or use a second helper that only applies static options—the tab shows the full preset string, not the current marquee frame. For a full reset (original `document.title` and favicon), call **`titlefx.dispose()`**, including when leaving an SPA route or screen that owned the tab.
- Use **`titlefx.debug()`** or **`titlefx.debug("…")`** while iterating to check length and visual budget for desktop tabs (see Reference).
