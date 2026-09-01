import type { Config } from "tailwindcss";

/**
 * Tailwind v4 is CSS-first: the actual token *values* live in
 * `src/app/globals.css` under `@theme`, and that file loads this config
 * via `@config "../../tailwind.config.ts";` at the very top (required —
 * v4 does not auto-detect this file the way v3 did).
 *
 * This file exists so editors/IntelliSense and any JS-side theme access
 * see the same names, and so `theme.extend` (fonts, etc.) has a home.
 * Prefer adding new *values* in globals.css `@theme`; add *structure*
 * (font families, plugin config) here.
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        obsidian: "#0C0A09", // page background
        stone: "#1C1917", // card / panel background
        wall: "#44403C", // thick card border
        amber: "#F59E0B", // primary accent — CTA, active border, easy CR, XP fill
        brown: "#92400E", // 3D button drop-shadow
        gold: "#F59E0B", // title color (same family as amber)
        silver: "#9CA3AF", // medium CR shield
        danger: "#DC2626", // hard CR / red shield
        xpPurple: "#8B5CF6", // XP trophy badge
        passed: "#22C55E", // "Passed" badge
      },
      fontFamily: {
        pixel: ["var(--font-display)"], // Bungee — big dungeon-title display type
        ui: ["var(--font-ui)"], // Poppins — buttons, badges, card titles
        sans: ["var(--font-body)"], // Space Grotesk — body copy
        mono: ["var(--font-mono)"], // JetBrains Mono — data / code
      },
    },
  },
};

export default config;
