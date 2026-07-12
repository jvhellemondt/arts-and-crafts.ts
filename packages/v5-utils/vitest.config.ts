import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    watch: false,
    globals: true,
    passWithNoTests: true,
    reporters: ["verbose"],
    include: ["src/**/*.{spec,test}.?(c|m)[jt]s?(x)"],
    exclude: [
      "**/index.ts",
      "**/__tests__/**",
      "**/node_modules/**",
      "**/dist/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*",
    ],
    coverage: {
      provider: "istanbul",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.?(c|m)[jt]s?(x)"],
      exclude: ["**/index.ts", "**/main.ts", "**/__tests__/**"],
      thresholds: {
        lines: 100,
        statements: 100,
        functions: 100,
        branches: 100,
      },
    },
  },
  plugins: [tsconfigPaths()],
});
