---
layout: home

hero:
  name: titlefx
  text: Browser tab titles without fuss
  tagline: "Format and apply `document.title` with presets for notifications, progress, media, and custom layouts."
  image:
    src: /favicon.svg
    alt: titlefx
  actions:
    - theme: brand
      text: Quick guide
      link: /guide/
    - theme: alt
      text: Playground
      link: /playground
    - theme: alt
      text: API
      link: /api/

features:
  - icon: 1
    title: Ready-made presets
    details: "`default`, `media`, `notifications`, `progress`, and `custom`."
  - icon: 2
    title: Apply or just format
    details: "Use `titlefx.preset(...)` for both formatting and applying the browser tab title."
  - icon: 3
    title: Simple animations
    details: "`loop`, `bounce`, and `blink` work directly through presets."
  - icon: 4
    title: Clear cleanup
    details: "`titlefx.dispose()` stops the current animation and restores the original title."
  - icon: 5
    title: Browser-first
    details: "In the browser, the same API is also available on `window.titlefx`."
  - icon: 6
    title: SSR-friendly
    details: "Without DOM access, the package does not touch `window` or `document`."
---
