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
      },
    },
  },
  plugins: [],
};

export default config;
