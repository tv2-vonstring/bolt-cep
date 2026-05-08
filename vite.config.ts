import { defineConfig } from "vite";

import react from "@vitejs/plugin-react"; // BOLT_REACT_ONLY
import vue from "@vitejs/plugin-vue"; // BOLT_VUE_ONLY
import { svelte } from "@sveltejs/vite-plugin-svelte"; // BOLT_SVELTE_ONLY
import {sveltePreprocess} from "svelte-preprocess"; // BOLT_SVELTE_ONLY

import { cep, CepOptions, runAction } from "vite-cep-plugin";
import cepConfig from "./cep.config";
import path from "path";
import fs from "fs";
import { extendscriptConfig } from "./vite.es.config";
import dotenv from "dotenv";

if (process.env.APP_ENV === "development") {
  dotenv.config({ path: ".env.development" });
} else if (process.env.APP_ENV === "hosted-stage") {
  dotenv.config({ path: ".env.hosted.stage" });
} else if (process.env.APP_ENV === "hosted") {
  dotenv.config({ path: ".env.hosted" });
} else {
  dotenv.config({ path: ".env.production" });
}

const extensions = [".js", ".ts", ".tsx"];

const devDist = "dist";
const cepDist = "cep";

const src = path.resolve(__dirname, "src");
const root = path.resolve(src, "js");
const outDir = path.resolve(__dirname, "dist", cepDist);

const debugReact = process.env.DEBUG_REACT === "true";
const isProduction = process.env.NODE_ENV === "production";
const isHosted = process.env.APP_ENV?.startsWith("hosted") ?? false;
const isMetaPackage = process.env.ZIP_PACKAGE === "true";
const isPackage = process.env.ZXP_PACKAGE === "true" || isMetaPackage;
const isServe = process.env.SERVE_PANEL === "true";
const action = process.env.BOLT_ACTION;

let input: { [key: string]: string } = {};
cepConfig.panels.map((panel) => {
  input[panel.name] = path.resolve(root, panel.mainPath);
});

const config: CepOptions = {
  cepConfig,
  isProduction,
  isPackage,
  isMetaPackage,
  isServe,
  debugReact,
  dir: `${__dirname}/${devDist}`,
  cepDist: cepDist,
  zxpOutput: `${__dirname}/${devDist}/zxp/${cepConfig.id}`,
  zipOutput: `${__dirname}/${devDist}/zip/${cepConfig.displayName}_${cepConfig.version}`,
  packages: cepConfig.installModules || [],
};

if (action) runAction(config, action);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), // BOLT_REACT_ONLY
    vue(), // BOLT_VUE_ONLY
    svelte({ preprocess: sveltePreprocess({ typescript: true }) }), // BOLT_SVELTE_ONLY
    // svelte(), // BOLT_SVELTE_ONLY
    cep(config),
  ],
  define: {
    __CEP_ID__: JSON.stringify(cepConfig.id),
    HOSTED_URL: JSON.stringify(process.env.HOSTED_URL || ""),
    IS_HOSTED: JSON.stringify(isHosted),
  },
  resolve: {
    alias: [{ find: "@esTypes", replacement: path.resolve(__dirname, "src") }],
  },
  root,
  clearScreen: false,
  server: {
    port: cepConfig.port,
  },
  preview: {
    port: cepConfig.servePort,
  },

  build: {
    sourcemap: isPackage ? cepConfig.zxp.sourceMap : cepConfig.build?.sourceMap,
    watch: {
      include: "src/jsx/**",
    },
    // commonjsOptions: {
    //   transformMixedEsModules: true,
    // },
    rollupOptions: {
      input,
      output: {
        manualChunks: {},
        // esModule: false,
        preserveModules: false,
        format: "cjs",
        entryFileNames: "assets/[name]-[hash].cjs",
        chunkFileNames: "assets/[name]-[hash].cjs",
      },
    },
    target: "chrome74",
    outDir,
  },
});

// rollup es3 build (skip for hosted; jsx is served from the web server)
if (!isHosted) {
  const outPathExtendscript = path.join("dist", cepDist, "jsx", "index.js");
  extendscriptConfig(
    `src/jsx/index.ts`,
    outPathExtendscript,
    cepConfig,
    extensions,
    isProduction,
    isPackage,
  );
} else if (isPackage) {
  // ZXP packager waits for dist/cep/jsx/ to exist before signing.
  // Create a placeholder so it doesn't hang when ExtendScript is skipped.
  const jsxDir = path.join("dist", cepDist, "jsx");
  fs.mkdirSync(jsxDir, { recursive: true });
  fs.writeFileSync(path.join(jsxDir, "index.js"), "// hosted stub - ExtendScript served from web server\n");
}
