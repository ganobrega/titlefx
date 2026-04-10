---
title: Reference
---

# Reference

`titlefx` exposes a very small API:

- `titlefx.preset(name, options?)`
- `titlefx.dispose()`
- exported animation helpers

## Quick start

```ts
import titlefx from "titlefx";

titlefx.preset("notifications", {
  prefix: "NEW",
  count: 3,
  brand: "Tinder",
  context: "New match",
});

titlefx.dispose();
```

## `titlefx.preset(name, options?)`

Applies a preset to `document.title` and returns the final string.

```ts
titlefx.preset("media", {
  content: "Blinding Lights",
  author: "The Weeknd",
  brand: "Spotify",
});
```

### Without `options`

When called without `options`, it returns the preset template:

| Preset | Template |
| --- | --- |
| `default` | `{pre}{title}{separator}{brand}{suf}` |
| `media` | `{pre}{content} - {author} \| {brand}{suf}` |
| `notifications` | `{pre}({count}) {brand}{separator}{context}{suf}` |
| `progress` | `{pre}[{count}%] {brand}{separator}{context}{suf}` |
| `custom` | `{template}` |

## Available presets

### `default`

```ts
titlefx.preset("default", {
  context: "Homepage",
  brand: "My site",
});
```

- Format: `{pre}{title}{separator}{brand}{suf}`
- If `title` is empty, `context` is used instead
- `separator` defaults to ` - `

### `media`

```ts
titlefx.preset("media", {
  content: "Blinding Lights",
  author: "The Weeknd",
  brand: "Spotify",
});
```

- Format: `{pre}{content} - {author} | {brand}{suf}`

### `notifications`

```ts
titlefx.preset("notifications", {
  count: 7,
  brand: "WhatsApp",
  context: "Lucas",
});
```

- Format: `{pre}({count}) {brand}{separator}{context}{suf}`
- `count` is clamped to an integer `>= 0`
- `separator` defaults to ` • `

### `progress`

```ts
titlefx.preset("progress", {
  count: 42,
  brand: "uTorrent",
  context: "Downloading update",
});
```

- Format: `{pre}[{count}%] {brand}{separator}{context}{suf}`
- `count` is clamped to an integer `>= 0`
- `%` is part of the preset output

### `custom`

```ts
titlefx.preset("custom", {
  template: "{pre}Inbox ({count}) - {email}{suf}",
  prefix: "Mail",
  count: 8,
  email: "me@example.com",
});
```

- Uses `template` as the base string
- Replaces any `{key}` placeholder with the matching object value
- `{pre}`, `{suf}`, and `{separator}` get special formatting treatment

## Common options

All presets accept:

| Field | Type | Description |
| --- | --- | --- |
| `separator?` | `string` | Separator used by the `default` preset, trimmed with spaces around it |
| `prefix?` | `string` | Text before the title, trimmed with one trailing space |
| `suffix?` | `string` | Text after the title, trimmed with one leading space |
| `animate?` | `boolean` | Enables animation when used with `titlefx.preset(...)` |
| `animation?` | `"loop" \| "bounce" \| "blink"` | Animation type |
| `speed?` | `"slow" \| "normal" \| "fast"` | Animation speed |

## Animations

When `animate: true` and `animation` is set, the browser tab title becomes animated.

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

Types:

```ts
type TitlefxAnimationType = "loop" | "bounce" | "blink";
type TitlefxAnimationSpeed = "slow" | "normal" | "fast";
```

Runtime behavior:

- while the page is visible, animations run with `requestAnimationFrame`
- when the page goes into the background, `titlefx` falls back to timers so the tab title keeps moving
- delayed background ticks catch up based on elapsed time to avoid obvious slow motion

Exported helpers:

- `createAnimationState()`
- `createLoopFrames(text)`
- `createBackAndForthFrames(text)`
- `createBlinkFrames(text)`
- `startTitleAnimation(state, text, type, speed, onFrame)`
- `stopAnimation(state)`

## `titlefx.dispose()`

Stops the active animation and restores the original page title captured on the first apply call.

```ts
titlefx.dispose();
```

## Exported types

```ts
import type {
  Titlefx,
  TitlePresetName,
  TitlePresetCommonOptions,
  TitlePresetOptionsMap,
  TitlefxAnimationState,
  TitlefxAnimationType,
  TitlefxAnimationSpeed,
} from "titlefx";
```
