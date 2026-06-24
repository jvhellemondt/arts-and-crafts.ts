import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/module/adapters/outbound/capabilities/index.ts",
    "src/module/adapters/outbound/shapes/index.ts",
    "src/module/core/capabilities/index.ts",
    "src/module/core/shapes/index.ts",
    "src/module/useCases/command/capabilities/index.ts",
    "src/module/useCases/command/shapes/index.ts",
    "src/module/useCases/policy/capabilities/index.ts",
    "src/module/useCases/query/capabilities/index.ts",
    "src/module/useCases/query/shapes/index.ts",
  ],
  format: ["cjs", "esm"],
  dts: true,
  outDir: "dist",
  clean: true,
  splitting: true,
  sourcemap: true,
  treeshake: true,
});
