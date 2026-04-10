import type { TitlePresetName, TitlePresetOptionsMap } from "../../../../src/preset";

export type Example<TName extends TitlePresetName = TitlePresetName> = {
  id: string;
  label: string;
  preset: TName;
  options: TitlePresetOptionsMap[TName];
};

export const examples: Example[] = [
  {
    id: "spotify",
    label: "Spotify",
    preset: "media",
    options: {
      content: "Blinding Lights",
      author: "The Weeknd",
      brand: "Spotify",
      animate: true,
      animation: "loop",
      speed: "normal",
    },
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    preset: "notifications",
    options: {
      count: 7,
      brand: "WhatsApp",
      context: "Lucas",
      status: "warning",
      prefix: "💬",
    },
  },
  {
    id: "gmail",
    label: "Gmail",
    preset: "custom",
    options: {
      template: "Inbox ({count}) - {email} - {brand}",
      count: "8.456",
      email: "me@example.com",
      brand: "Gmail",
    },
  },
  {
    id: "instagram",
    label: "Instagram",
    preset: "notifications",
    options: {
      count: 4,
      brand: "Instagram",
      context: "New notifications",
      prefix: "📸",
    },
  },
  {
    id: "tinder",
    label: "Tinder",
    preset: "notifications",
    options: {
      prefix: "🔥",
      count: 3,
      brand: "Tinder",
      context: "New match",
      suffix: "❤️😍🥰",
      animate: true,
      animation: "blink",
      speed: "fast",
    },
  },
  {
    id: "installer-progress",
    label: "uTorrent",
    preset: "progress",
    options: {
      count: 42,
      brand: "uTorrent",
      context: "Downloading",
    },
  },
  {
    id: "github",
    label: "Github",
    preset: "custom",
    options: {
      template: "{pre}{context}{separator}{user}/{repo}@{branch}{suf}",
      user: "ganobrega",
      repo: "titlefx",
      branch: "17c4e2f",
      context: "Update version in package.json to 0.1.0",
      status: "warning",
      separator: " · ",
    },
  },
  {
    id: "site-default",
    label: "Default",
    preset: "default",
    options: {
      context: "Homepage",
      brand: "My site",
    },
  },
];
