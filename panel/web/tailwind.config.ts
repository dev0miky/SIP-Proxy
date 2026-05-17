import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--bg))",
        foreground: "hsl(var(--fg))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-fg))",
        accent: "hsl(var(--accent))",
        border: "hsl(var(--border))",
      },
    },
  },
  plugins: [],
} satisfies Config;
