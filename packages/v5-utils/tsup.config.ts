import { fileURLToPath } from "node:url";
import { defineConfig } from "tsup";

const v5Source = fileURLToPath(new URL("../v5/src/module/", import.meta.url));

export default defineConfig({
  entry: {
    "core/index": "src/module/core/index.ts",
    "adapters-inbound/index": "src/module/adapters/inbound/index.ts",
    "adapters-outbound/index": "src/module/adapters/outbound/index.ts",
  },
  format: ["cjs", "esm"],
  dts: {
    compilerOptions: {
      paths: { "@arts-and-crafts/v5/*": [`${v5Source}*/index.ts`] },
    },
  },
  noExternal: ["uuid"],
  outDir: "dist",
  clean: true,
  splitting: false,
  sourcemap: true,
  treeshake: true,
});
