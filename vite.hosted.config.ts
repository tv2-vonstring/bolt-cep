import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte"; // BOLT_SVELTE_ONLY
import dotenv from "dotenv";
import path from "path";
import { extendscriptConfig } from "./vite.es.config";
import cepConfig from "./cep.config";

dotenv.config({ path: ".env.hosted" });

const src = path.resolve(__dirname, "src");
const root = path.resolve(src, "js");
const outDir = path.resolve(__dirname, "dist", "hosted");
const extensions = [".js", ".ts", ".tsx"];

export default defineConfig({
  plugins: [
    svelte(), // BOLT_SVELTE_ONLY
    {
      name: "build-extendscript",
      closeBundle: () =>
        extendscriptConfig(
          "src/jsx/index.ts",
          path.join("dist", "hosted", "jsx", "index.js"),
          cepConfig,
          extensions,
          true,
          false
        ),
    },
  ],
  define: {
    __CEP_ID__: JSON.stringify(cepConfig.id),
    HOSTED_URL: JSON.stringify(process.env.HOSTED_URL || ""),
    IS_HOSTED: JSON.stringify(true),
  },
  resolve: {
    alias: [{ find: "@esTypes", replacement: path.resolve(__dirname, "src") }],
  },
  root,
  server: {
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
  build: {
    rollupOptions: {
      input: { main: path.resolve(root, "main/index.html") },
      output: {
        format: "es",
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
      },
    },
    outDir,
    emptyOutDir: true,
  },
});
