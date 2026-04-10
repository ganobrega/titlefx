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
    id: "site-default",
    label: "Website (default)",
    preset: "default",
    options: {
      context: "Homepage",
      brand: "My site",
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
];
