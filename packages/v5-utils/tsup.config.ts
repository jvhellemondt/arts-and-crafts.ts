import { defineConfig } from "tsup";

export default defineConfig({
  // Named (not array) entries so each output file sits exactly one directory
  // under dist/ — @oxc-node/core's ESM resolve hook (used by examples/v5's
  // dev script) fails to resolve files nested two or more directories deep.
  entry: {
    "core/index": "src/module/core/index.ts",
    "adapters-inbound/index": "src/module/adapters/inbound/index.ts",
    "useCases-command/index": "src/module/useCases/command/index.ts",
    "useCases-query/index": "src/module/useCases/query/index.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  outDir: "dist",
  clean: true,
  splitting: false,
  sourcemap: true,
  treeshake: true,
});
