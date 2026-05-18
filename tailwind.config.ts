import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./pages/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        luminoa: {
          ink: "#18212f",
          muted: "#64748b",
          line: "#d9e2ec",
          panel: "#f7f9fc",
          teal: "#0f766e",
          amber: "#f59e0b",
        },
        gr: {
          dark:       "#1a0f05",
          "dark-mid": "#2d1a08",
          brown:      "#4a2c0a",
          amber:      "#F5A623",
          "amber-hov":"#e6951a",
          "off-white":"#f8f5f0",
          muted:      "#7a5840",
        },
      },
    },
  },
  plugins: [],
};

export default config;
