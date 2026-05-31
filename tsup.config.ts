import { defineConfig } from "tsup";
import fs from "fs";
import path from "path";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  outDir: "dist",
  clean: true,
  dts: false,
  minify: false,
  sourcemap: true,
  onSuccess: async () => {
    const srcDir = path.resolve("src/app/templates");
    const destDir = path.resolve("dist/app/templates");
    fs.mkdirSync(destDir, { recursive: true });
    fs.cpSync(srcDir, destDir, { recursive: true });
    console.log(
      "[tsup] Successfully copied EJS templates to dist/app/templates",
    );
  },
});
