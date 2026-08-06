import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import {
  stripLlmFormatPrefix,
  isViteSkeleton,
  sanitizeCssForEsbuild,
  buildFuzzyComponentMap,
  resolveFuzzyComponent,
  injectOrphanComponentsIntoApp,
  rewriteAppForExistingPages,
  rewriteAtAliasImports,
  stubIfTruncatedSource,
} from "@/lib/preview/preview-helpers";

export const dynamic = "force-dynamic";

const s3 = new S3Client({ region: "eu-north-1" });
const S3_BUCKET = "ai2me-storage";
const S3_PREFIX = "builder-projects";

const AI_SERVICE_URL =
  process.env.AI_SERVICE_INTERNAL_URL ||
  process.env.AI_SERVICE_URL ||
  "https://us.ai.ai2me.com";

// lucide-react's UMD build resolves React from `global.react` (lowercase) — see the
// wrapper: `factory(global.LucideReact = {}, global.react)`. React's own UMD publishes
// `window.React`, so without this alias `react` is undefined inside the factory, it
// throws on `react.forwardRef` while loading, and `window.LucideReact` stays `{}`.
// Every icon then renders as undefined: "Minified React error #130 …args[]=undefined".
// MUST be emitted before the lucide script tag.
const LUCIDE_REACT_GLOBAL_ALIAS =
  '<script>window.react = window.react || window.React;</script>';

// ── S3 helpers ────────────────────────────────────────────────────────────────

async function s3Get(key: string): Promise<string | null> {
  try {
    const cmd = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
    const obj = await s3.send(cmd);
    const chunks: Uint8Array[] = [];
    for await (const chunk of obj.Body as AsyncIterable<Uint8Array>) chunks.push(chunk);
    return Buffer.concat(chunks).toString("utf-8");
  } catch {
    return null;
  }
}

async function fetchPreviewHtml(id: string): Promise<string | null> {
  for (const key of [
    `${S3_PREFIX}/${id}/preview.html`,
    `${S3_PREFIX}/${id}/index.html`,
    `${S3_PREFIX}/${id}/dist/index.html`,
  ]) {
    const html = await s3Get(key);
    if (html && html.includes("<!DOCTYPE")) return html;
  }
  return null;
}

// ── esbuild bundler path ──────────────────────────────────────────────────────

async function buildWithEsbuild(projectId: string): Promise<string | null> {
  try {
    const manifestJson = await s3Get(`${S3_PREFIX}/${projectId}/source_files.json`);
    if (!manifestJson) return null;

    const manifest: string[] = JSON.parse(manifestJson);
    if (!manifest.length) return null;

    // Write all source files to a temp dir
    const DEPLOY_SHA = (process.env.DEPLOY_SHA || "dev").slice(0,8);
    const reqId = Math.random().toString(36).slice(2, 8);
    const tmpDir = path.join(os.tmpdir(), `ai2me-preview-${projectId}-${DEPLOY_SHA}-${reqId}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    for (const filePath of manifest) {
      let content = await s3Get(`${S3_PREFIX}/${projectId}/sources/${filePath}`);
      if (!content) continue;
      // Strip LLM-injected format markers / markdown fences from any file
      content = filePath.endsWith(".css")
        ? sanitizeCssForEsbuild(content)
        : stripLlmFormatPrefix(content);
      const abs = path.join(tmpDir, filePath);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, content, "utf-8");
    }

    // ── Pre-esbuild import scan: stub any missing local imports before bundling ──
    // This is the defensive guard for when the AI service writes an App.tsx that
    // imports components it never generated. Without this, esbuild hard-fails on
    // the first unresolved import and returns null, cascading to a 404.
    // Scan every downloaded source file; for each unresolved local import, write
    // a minimal stub so esbuild can bundle. Only safe presentational stubs are
    // generated here — context providers and hooks get appropriate skeletons.
    // Raw Vite index.html (type=module src=/src/main.tsx) is never served.
    {
      const SRC_EXTS_PRE = [".tsx", ".ts", ".jsx", ".js"];
      const writtenPaths = new Set<string>(manifest);
      const localImportScanRe = /from\s+['"](\.{1,2}\/[^'"]+)['"]/g;
      const sideEffectScanRe = /^\s*import\s+['"](\.\.?\/[^'"]+\.css)['"]\s*;/gm;
      const allSourceFiles = [...manifest];

      for (const filePath of allSourceFiles) {
        if (!SRC_EXTS_PRE.some(e => filePath.endsWith(e))) continue;
        const abs = path.join(tmpDir, filePath);
        if (!fs.existsSync(abs)) continue;
        const srcText = fs.readFileSync(abs, "utf-8");

        // Stub missing CSS side-effect imports
        let sm: RegExpExecArray | null;
        const sre = new RegExp(sideEffectScanRe.source, sideEffectScanRe.flags);
        while ((sm = sre.exec(srcText)) !== null) {
          const cssAbs = path.resolve(path.dirname(abs), sm[1]);
          if (!fs.existsSync(cssAbs)) {
            fs.mkdirSync(path.dirname(cssAbs), { recursive: true });
            fs.writeFileSync(cssAbs, "/* auto-stub */\n", "utf-8");
          }
        }

        // Stub missing source imports
        const lre = new RegExp(localImportScanRe.source, localImportScanRe.flags);
        let m: RegExpExecArray | null;
        while ((m = lre.exec(srcText)) !== null) {
          const rel = m[1];
          if (rel.endsWith(".css")) continue;
          const baseResolved = path.resolve(path.dirname(abs), rel);
          const alreadyExists = SRC_EXTS_PRE.some(ext =>
            fs.existsSync(baseResolved + ext) || fs.existsSync(path.join(baseResolved, "index" + ext))
          );
          if (alreadyExists) continue;
          const stubPath = SRC_EXTS_PRE.some(e => baseResolved.endsWith(e))
            ? baseResolved
            : baseResolved + ".tsx";
          if (fs.existsSync(stubPath)) continue;
          // Skip garbage from template literals
          if (/[${` ]/.test(stubPath) || stubPath.length > 300) continue;
          fs.mkdirSync(path.dirname(stubPath), { recursive: true });
          const compName = path.basename(stubPath).replace(/\.[^.]+$/, "").replace(/[^A-Za-z0-9]/g, "") || "Stub";
          const capName = compName[0].toUpperCase() + compName.slice(1);
          const isContext = /context/i.test(stubPath);
          const isHook = /^\/use[A-Z]/.test("/" + path.basename(stubPath));
          let stubContent: string;
          if (isContext) {
            stubContent = `import React from 'react';
export const ${capName} = React.createContext<any>({});
export const ${capName}Provider: React.FC<{value?: any; children: React.ReactNode}> = ({ children }) => React.createElement(${capName}.Provider, { value: {} }, children);
export default ${capName}Provider;
`;
          } else if (isHook) {
            stubContent = `export function ${capName}() { return {}; }
export default ${capName};
`;
          } else {
            stubContent = `import React from 'react';
const ${capName}: React.FC<any> = ({ children }) => React.createElement(React.Fragment, null, children);
export default ${capName};
export const ${capName}Context = React.createContext({});
`;
          }
          fs.writeFileSync(stubPath, stubContent, "utf-8");
          console.info(`[preview] pre-scan stub: ${path.relative(tmpDir, stubPath)} (missing import in ${filePath})`);
        }
      }
    }

    // Rewrite App when it imports missing boilerplate pages but real src/pages/* exist
    for (const appRel of ["src/App.tsx", "src/App.jsx", "App.tsx", "App.jsx"]) {
      const appAbs = path.join(tmpDir, appRel);
      if (!fs.existsSync(appAbs)) continue;
      const rewritten = rewriteAppForExistingPages(
        fs.readFileSync(appAbs, "utf-8"),
        manifest
      );
      if (rewritten) fs.writeFileSync(appAbs, rewritten, "utf-8");
      break;
    }

    // Resolve @/… aliases → relative src paths before stubbing / bundling
    for (const fp of manifest.filter((f) => /\.(tsx|ts|jsx|js)$/.test(f))) {
      const abs = path.join(tmpDir, fp);
      if (!fs.existsSync(abs)) continue;
      let text = rewriteAtAliasImports(fp, fs.readFileSync(abs, "utf-8"));
      const stubbed = stubIfTruncatedSource(text, path.basename(fp));
      if (stubbed) text = stubbed;
      fs.writeFileSync(abs, text, "utf-8");
    }
    // Also rewrite App if we just rewrote it above (already relative) — and any new App content
    for (const appRel of ["src/App.tsx", "src/App.jsx", "App.tsx", "App.jsx"]) {
      const appAbs = path.join(tmpDir, appRel);
      if (!fs.existsSync(appAbs)) continue;
      fs.writeFileSync(
        appAbs,
        rewriteAtAliasImports(appRel, fs.readFileSync(appAbs, "utf-8")),
        "utf-8"
      );
      break;
    }

    // Auto-stub missing local imports so esbuild doesn't hard-fail.
    // Handles two cases:
    //   1. File simply missing (LLM forgot to generate it) -> write stub
    //   2. Path mismatch (LLM used 'contexts/' but file lives at 'context/') -> write re-export bridge
    //   3. Synonym mismatch (Features vs Benefits, HowItWorks vs HowToUse, Pricing vs CTA)
    const SRC_EXTS = [".tsx", ".ts", ".jsx", ".js"];
    const toScan = manifest.filter((f: string) => /\.(tsx|ts|jsx|js)$/.test(f));
    const fuzzyMap = buildFuzzyComponentMap(manifest);

    for (const filePath of toScan) {
      const abs = path.join(tmpDir, filePath);
      if (!fs.existsSync(abs)) continue;
      const srcText = fs.readFileSync(abs, "utf-8");

      // Also stub missing side-effect imports: import './App.css', import "../styles.css"
      // These don't use `from` so the main regex misses them, but esbuild hard-fails on missing CSS.
      const sideEffectRe = /^\s*import\s+['"](\.{1,2}\/[^'"]+\.css)['"]/gm;
      let sm: RegExpExecArray | null;
      while ((sm = sideEffectRe.exec(srcText)) !== null) {
        const rel = sm[1];
        const cssAbs = path.resolve(path.dirname(abs), rel);
        if (!fs.existsSync(cssAbs)) {
          fs.mkdirSync(path.dirname(cssAbs), { recursive: true });
          fs.writeFileSync(cssAbs, "/* auto-stub: file not generated */\n", "utf-8");
        }
      }

      const localImportRe = /from\s+['"](\.{1,2}\/[^'"]+)['"]/g;
      let m: RegExpExecArray | null;
      while ((m = localImportRe.exec(srcText)) !== null) {
        const rel = m[1];
        const baseResolved = path.resolve(path.dirname(abs), rel);

        // CSS / CSS-modules must never be stubbed as .tsx
        if (rel.endsWith(".css") || baseResolved.endsWith(".css")) {
          const cssPath = baseResolved.endsWith(".css") ? baseResolved : baseResolved + ".css";
          if (!fs.existsSync(cssPath)) {
            fs.mkdirSync(path.dirname(cssPath), { recursive: true });
            fs.writeFileSync(cssPath, "/* auto-stub: css not generated */\n", "utf-8");
          }
          continue;
        }

        const missing = SRC_EXTS.every(ext => !fs.existsSync(baseResolved + ext) && !fs.existsSync(path.join(baseResolved, "index" + ext)));
        if (!missing) continue;
        const stubPath = SRC_EXTS.some(e => baseResolved.endsWith(e)) ? baseResolved : baseResolved + ".tsx";
        if (fs.existsSync(stubPath)) continue;
        fs.mkdirSync(path.dirname(stubPath), { recursive: true });
        const name = path.basename(stubPath).replace(/\.[^.]+$/, "");

        const realFile = resolveFuzzyComponent(name, fuzzyMap);
        if (realFile && realFile !== filePath) {
          const realAbs = path.join(tmpDir, realFile);
          const relToReal = path.relative(path.dirname(stubPath), realAbs).replace(/\\/g, "/").replace(/\.[^.]+$/, "");
          const relPath = relToReal.startsWith(".") ? relToReal : "./" + relToReal;
          // Safety: don't bridge to itself or outside project
          if (relPath.startsWith("../../") || relPath === "./" || relPath === ".") {
            fs.writeFileSync(stubPath, `import React from 'react';\nconst __StubDefault: React.FC<any> = ({ children }) => React.createElement(React.Fragment, null, children);\nexport default __StubDefault;\n`, "utf-8");
          } else {
            const bridgeContent = `// Auto-bridge: '${rel}' -> real file at '${realFile}'\nexport * from '${relPath}';\nexport { default } from '${relPath}';\n`;
            fs.writeFileSync(stubPath, bridgeContent, "utf-8");
          }
        } else {
          // No fuzzy match: write a safe stub with common export patterns
          fs.writeFileSync(stubPath,
            `import React from 'react';\nconst __StubDefault: React.FC<any> = ({ children }) => React.createElement(React.Fragment, null, children);\nexport default __StubDefault;\nexport const ${name.replace(/[^A-Za-z0-9_$]/g, "_") || "Stub"}Context = React.createContext({});\n`,
            "utf-8"
          );
        }
      }
    }

    // Prefer App.tsx over main.tsx as the esbuild entry.
    // main.tsx side-effects createRoot().render() inside the IIFE but typically has
    // *no exports*, so `var __AppBundle = (()=>{...main...})()` becomes undefined and
    // our post-bundle mount helper cannot find App. App.tsx exports the component so
    // globalName __AppBundle.default is set and the CDN mount below can render it.
    const entryOptions = [
      "src/App.tsx", "src/App.jsx", "src/app.tsx", "src/app.jsx",
      "App.tsx", "App.jsx",
      "src/main.tsx", "src/main.jsx", "src/index.tsx", "src/index.jsx",
      "main.tsx", "main.jsx", "index.tsx", "index.jsx",
    ];
    const entry = entryOptions.find(e => fs.existsSync(path.join(tmpDir, e)));
    if (!entry) return null;

    // Use esbuild CLI via child_process — fully excluded from webpack bundling
    const outFile = path.join(tmpDir, "bundle.js");

    // Write alias shim files — resolve packages to window globals via shim .cjs files
    const shimDir = path.join(tmpDir, "_shims");
    fs.mkdirSync(shimDir, { recursive: true });
    fs.writeFileSync(path.join(shimDir, "react-dom-client.js"),
      "module.exports = window.ReactDOM || {};");
    fs.writeFileSync(path.join(shimDir, "react-jsx-runtime.js"),
      "var R=window.React||{}; module.exports={jsx:R.createElement,jsxs:R.createElement,Fragment:R.Fragment};");
    fs.writeFileSync(path.join(shimDir, "framer-motion.js"),
      "module.exports = window.FramerMotion || window.Motion || {};");
    fs.writeFileSync(path.join(shimDir, "lucide-react.js"),
      "module.exports = window.LucideReact || {};");



    // Write shims for ALL packages that have CDN UMD builds.
    // esbuild --external:* externalises every node_module; these shims redirect
    // the generated require() calls to window globals loaded from CDN.
    // Any package NOT in the shim map gets an empty-object fallback so the bundle
    // never throws "Dynamic require of X is not supported".
    const SHIM_PKGS: Record<string, string> = {
      "react":                "window.React || {}",
      "react-dom":            "window.ReactDOM || {}",
      "react-dom/client":     "window.ReactDOM || {}",
      "react/jsx-runtime":    "window.React ? { jsx: window.React.createElement, jsxs: window.React.createElement, Fragment: window.React.Fragment } : {}",
      "react-router-dom":     "window.ReactRouterDOM || {}",
      "react-router":         "window.ReactRouter || {}",
      "@remix-run/router":    "window.RemixRouter || {}",
      "framer-motion":        "window.FramerMotion || window.Motion || {}",
      "lucide-react":         "window.LucideReact || {}",
      "axios":                "window.axios || { get: function(){return Promise.resolve({data:{}})}, post: function(){return Promise.resolve({data:{}})}, create: function(){ return this; } }",
      "react-i18next":        "{ useTranslation: function(){ return { t: function(k){ return k; }, i18n: {} }; }, Trans: function(p){ return p.children||null; }, initReactI18next: {} }",
      "i18next":              "{ init: function(){}, use: function(){ return this; }, t: function(k){ return k; }, changeLanguage: function(){} }",
      "react-helmet":         "{ Helmet: function(p){ return null; } }",
      "react-helmet-async":   "{ Helmet: function(p){ return null; }, HelmetProvider: function(p){ return p.children||null; } }",
      "react-hot-toast":      "{ default: { success:function(){}, error:function(){}, loading:function(){} }, Toaster: function(){ return null; } }",
      "sonner":               "{ toast: { success:function(){}, error:function(){}, loading:function(){} }, Toaster: function(){ return null; } }",
      "zustand":              "{ create: function(fn){ var state=fn(function(){}); return function(sel){ return sel?sel(state):state; }; } }",
      "clsx":                 "{ default: function(){ return Array.prototype.slice.call(arguments).filter(Boolean).join(' '); } }",
      "tailwind-merge":       "{ twMerge: function(){ return Array.prototype.slice.call(arguments).join(' '); } }",
      "class-variance-authority": "{ cva: function(b){ return function(){ return b; }; }, cx: function(){ return Array.prototype.slice.call(arguments).join(' '); } }",
      "date-fns":             "{}",
      "dayjs":                "window.dayjs || function(d){ return { format: function(){ return String(d||''); }, fromNow: function(){ return ''; } }; }",
      "zod":                  "{ z: { object: function(){ return { parse: function(v){ return v; } }; }, string: function(){ return { min: function(){ return this; }, max: function(){ return this; }, optional: function(){ return this; }, parse: function(v){ return v; } }; }, number: function(){ return { optional: function(){ return this; }, parse: function(v){ return v; } }; }, array: function(){ return { parse: function(v){ return v; } }; }, infer: {} } }",
      "react-hook-form":      "{ useForm: function(){ return { register: function(){ return {}; }, handleSubmit: function(fn){ return function(e){ e&&e.preventDefault&&e.preventDefault(); fn({}); }; }, formState: { errors: {} }, watch: function(){ return ''; }, setValue: function(){}, getValues: function(){ return {}; }, reset: function(){} }; }, Controller: function(p){ return null; } }",
      "@hookform/resolvers":  "{ zodResolver: function(){ return function(){ return { values:{}, errors:{} }; }; } }",
      "recharts":             "window.Recharts || {}",
      "@tanstack/react-query":"window.ReactQuery || { useQuery: function(){ return { data: undefined, isLoading: false, error: null }; }, QueryClient: function(){}, QueryClientProvider: function(p){ return p.children||null; } }",
      "embla-carousel-react": "{ default: function(){ return [null, { scrollNext: function(){}, scrollPrev: function(){} }]; } }",
      // Accidental LLM deps in web apps — stub so preview still bundles
      "react-native":         "{}",
      "@react-native-async-storage/async-storage": "{ default: { getItem: async function(){ return null; }, setItem: async function(){}, removeItem: async function(){} } }",
    };
    // Write one shim file per package (including scoped packages)
    for (const [pkg, expr] of Object.entries(SHIM_PKGS)) {
      const safeName = pkg.replace(/[@/]/g, "_").replace(/[^a-zA-Z0-9_]/g, "_");
      fs.writeFileSync(path.join(shimDir, safeName + ".cjs"), `module.exports = ${expr};`);
    }
    const aliasArgs = Object.entries(SHIM_PKGS).map(([pkg]) => {
      const safeName = pkg.replace(/[@/]/g, "_").replace(/[^a-zA-Z0-9_]/g, "_");
      return `--alias:${pkg}=./_shims/${safeName}.cjs`;
    });


    // Inject orphan section components into App.tsx (e.g. Ingredients never wired)
    for (const appRel of ["src/App.tsx", "src/App.jsx", "App.tsx", "App.jsx"]) {
      const appAbs = path.join(tmpDir, appRel);
      if (!fs.existsSync(appAbs)) continue;
      const compNames = manifest
        .filter((f) => /(?:^|\/)components\/[^/]+\.(tsx|jsx)$/i.test(f))
        .map((f) => path.basename(f).replace(/\.[^.]+$/, ""));
      const nextApp = injectOrphanComponentsIntoApp(fs.readFileSync(appAbs, "utf-8"), compNames);
      fs.writeFileSync(appAbs, nextApp, "utf-8");
      break;
    }

    // ── Ensure export default on React component files ────────────────────────────
    // LLMs frequently forget to add export default. Scan all TSX/JSX files and
    // append it if the file defines a React component but lacks export default.
    for (const filePath of manifest.filter((f: string) => /\.(tsx|jsx)$/.test(f))) {
      const absF = path.join(tmpDir, filePath);
      if (!fs.existsSync(absF)) continue;
      let fText = fs.readFileSync(absF, "utf-8");
      if (fText.includes("export default")) continue;  // already has it
      // Find the last React component name defined in the file
      // Match: const Foo: React.FC = ... | const Foo = () => | function Foo(
      const compMatch = fText.match(/(?:const|function)\s+([A-Z][A-Za-z0-9_]*)(?:\s*:\s*React\.FC[^=]*)?\s*=/);
      if (compMatch) {
        const compName = compMatch[1];
        fText = fText + `\nexport default ${compName};\n`;
        fs.writeFileSync(absF, fText, "utf-8");
      }
    }

    // Use esbuild JS API — no CLI binary path dependency, works in any container
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const esbuildApi = require("esbuild");
    const aliasPlugin = {
      name: "alias-shims",
      setup(build: any) {
        for (const [pkg] of Object.entries(SHIM_PKGS)) {
          const safeName = pkg.replace(/[@/]/g, "_").replace(/[^a-zA-Z0-9_]/g, "_");
          const shimPath = path.join(shimDir, safeName + ".cjs");
          const escapedPkg = pkg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          build.onResolve({ filter: new RegExp("^" + escapedPkg + "$") },
            () => ({ path: shimPath }));
        }
      }
    };
    const buildResult = await esbuildApi.build({
      entryPoints: [path.join(tmpDir, entry)],
      bundle: true,
      format: "iife" as const,
      globalName: "__AppBundle",
      platform: "browser" as const,
      external: [
        "react", "react-dom",
        "fs", "path", "os", "http", "https", "stream", "crypto", "events",
        "util", "buffer", "url", "net", "tls", "child_process",
        "express", "cors", "helmet", "morgan", "winston", "dotenv",
        "vite", "@vitejs/plugin-react-swc", "tailwindcss", "postcss", "autoprefixer",
      ],
      define: { "process.env.NODE_ENV": '"production"' },
      loader: {
        ".tsx": "tsx", ".ts": "ts", ".jsx": "jsx", ".js": "js",
        ".css": "css", ".cjs": "js",
        ".png": "dataurl", ".svg": "dataurl", ".gif": "dataurl",
        ".webp": "dataurl", ".woff": "dataurl", ".woff2": "dataurl",
      },
      jsx: "automatic" as const,
      outfile: outFile,
      absWorkingDir: tmpDir,
      plugins: [aliasPlugin],
      logLevel: "silent" as const,
    });
    if (buildResult.errors && buildResult.errors.length > 0) {
      console.error("[preview] esbuild JS API errors:", JSON.stringify(buildResult.errors).slice(0, 2000));
      return null;
    }

    let bundle = fs.existsSync(outFile) ? fs.readFileSync(outFile, "utf-8") : "";
    if (!bundle) return null;

    // Patch esbuild's own __require — it generates a closure-scoped var __require
    // that throws "Dynamic require of X is not supported". Replace the throw
    // with a CDN globals lookup so react-router-dom / framer-motion / lucide-react resolve.
    bundle = bundle.replace(
      /var __require = \/\* @__PURE__ \*\/ \(\(x\) =>.*?throw Error\('Dynamic require of "' \+ x \+ '" is not supported'\);\s*\}\);/s,
      `var __require = (function() {
  var _map = {
    'react': function() { return window.React; },
    'react-dom': function() { return window.ReactDOM; },
    'react-dom/client': function() { return window.ReactDOM; },
    'react/jsx-runtime': function() { return window.React ? { jsx: window.React.createElement, jsxs: window.React.createElement, Fragment: window.React.Fragment } : undefined; },
    'framer-motion': function() { return window.FramerMotion || window.Motion; },
    'lucide-react': function() { return window.LucideReact; },
  };
  return function __require(mod) {
    if (_map[mod]) return _map[mod]();
    var base = mod.split('/')[0];
    if (_map[base]) return _map[base]();
    throw new Error('Dynamic require of "' + mod + '" is not supported');
  };
})();`
    );

    const css = "";

    // Clean up temp dir
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }

    return buildEsbuildHtml(bundle, css);
  } catch (err) {
    console.error("[preview] esbuild failed:", err);
    return null;
  }
}

function buildEsbuildHtml(bundle: string, css: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Preview</title>
<!-- React + ReactDOM UMD (globals: React, ReactDOM) -->
<!-- React 18 UMD (React 19 has no UMD; pin codegen to 18 for CDN compat) -->
<script crossorigin src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
<!-- react-router-dom v6 -->
<script src="https://unpkg.com/@remix-run/router@1.22.0/dist/router.umd.min.js"></script>
<script src="https://unpkg.com/react-router@6.30.4/dist/umd/react-router.production.min.js"></script>
<script>window.ReactRouter = window.ReactRouter || {};</script>
<script src="https://unpkg.com/react-router-dom@6.30.4/dist/umd/react-router-dom.production.min.js"></script>
<script>window.ReactRouterDOM = window.ReactRouterDOM || {}; Object.assign(window, window.ReactRouterDOM);</script>
<!-- Framer Motion 12 UMD -->
<script src="https://unpkg.com/framer-motion@12.34.3/dist/framer-motion.js"></script>
<script>window.FramerMotion = window.Motion || window.FramerMotion || {};</script>
<!-- Lucide React 0.542 UMD -->
${LUCIDE_REACT_GLOBAL_ALIAS}
<script src="https://unpkg.com/lucide-react@0.542.0/dist/umd/lucide-react.js"></script>
<script>Object.assign(window, window.LucideReact || {});</script>
<!-- axios -->
<script src="https://unpkg.com/axios@1.9.0/dist/axios.min.js"></script>
<!-- Recharts -->
<script src="https://unpkg.com/recharts@2.12.7/umd/Recharts.js"></script>
<script>window.Recharts = window.Recharts || {};</script>
<!-- dayjs -->
<script src="https://unpkg.com/dayjs@1.11.13/dayjs.min.js"></script>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#fff;color:#111}
${css}
</style>
</head>
<body>
<div id="root"></div>
<script>
// __require shim: esbuild --external leaves require() calls in the IIFE bundle.
// Map every external module name to its CDN window global so require() resolves.
(function() {
  var __moduleMap = {
    'react': window.React,
    'react-dom': window.ReactDOM,
    'react-dom/client': window.ReactDOM,
    'react/jsx-runtime': window.React ? { jsx: window.React.createElement, jsxs: window.React.createElement, Fragment: window.React.Fragment } : undefined,
    'react-router-dom': window.ReactRouterDOM || {},
    'react-router': window.ReactRouter || {},
    '@remix-run/router': window.RemixRouter || {},
    'framer-motion': window.FramerMotion || window.Motion || {},
    'lucide-react': window.LucideReact || {},
    'axios': window.axios || {},
    'react-i18next': { useTranslation: function(){ return { t: function(k){ return k; }, i18n: { language: 'en', changeLanguage: function(){} } }; }, Trans: function(p){ return p.children||null; }, initReactI18next: {} },
    'i18next': { init: function(){}, use: function(){ return this; }, t: function(k){ return k; }, changeLanguage: function(){}, language: 'en' },
    'react-helmet-async': { Helmet: function(){ return null; }, HelmetProvider: function(p){ return p.children||null; } },
    'react-hot-toast': { default: { success:function(){}, error:function(){}, loading:function(){}, dismiss:function(){} }, Toaster: function(){ return null; } },
    'sonner': { toast: { success:function(){}, error:function(){}, loading:function(){}, dismiss:function(){} }, Toaster: function(){ return null; } },
    'zustand': { create: function(fn){ var s=fn(function(){}); return function(sel){ return sel?sel(s):s; }; } },
    'clsx': { default: function(){ return Array.prototype.slice.call(arguments).filter(Boolean).join(' '); } },
    'tailwind-merge': { twMerge: function(){ return Array.prototype.slice.call(arguments).join(' '); } },
    'class-variance-authority': { cva: function(b){ return function(){ return b; }; }, cx: function(){ return Array.prototype.slice.call(arguments).join(' '); } },
    'dayjs': window.dayjs || function(d){ return { format: function(){ return String(d||''); }, fromNow: function(){ return ''; }, isValid: function(){ return true; } }; },
    'recharts': window.Recharts || {},
    '@tanstack/react-query': { useQuery: function(){ return { data: undefined, isLoading: false, error: null }; }, QueryClient: function(){}, QueryClientProvider: function(p){ return p.children||null; } },
    'zod': { z: { object: function(s){ return { parse: function(v){ return v; }, safeParse: function(v){ return {success:true,data:v}; } }; }, string: function(){ return { min:function(){return this;}, max:function(){return this;}, optional:function(){return this;}, parse:function(v){return v;} }; }, number: function(){ return { optional:function(){return this;}, parse:function(v){return v;} }; }, array: function(){ return { parse:function(v){return v;} }; } } },
    'react-hook-form': { useForm: function(){ return { register:function(){return {};}, handleSubmit:function(fn){ return function(e){ e&&e.preventDefault&&e.preventDefault(); fn({}); }; }, formState:{errors:{}}, watch:function(){return '';}, setValue:function(){}, getValues:function(){return {};}, reset:function(){} }; }, Controller: function(p){ return p.render ? p.render({field:{value:'',onChange:function(){}}}) : null; } },
  };
  window.__require = function(mod) {
    if (__moduleMap[mod] !== undefined) return __moduleMap[mod];
    // strip sub-paths: e.g. 'react-dom/client' already handled above
    var base = mod.split('/')[0];
    if (__moduleMap[base] !== undefined) return __moduleMap[base];
    throw new Error('Dynamic require of "' + mod + '" is not supported');
  };
})();
// esbuild IIFE bundle — no import/export, React/ReactDOM are globals from CDN above
${bundle}
// Mount: esbuild wraps App in __AppBundle; find the default export.
// Prefer createRoot, but fall back to legacy ReactDOM.render when createRoot
// leaves #root empty (seen in some embedded browsers / odd ReactDOM builds).
// Always wrap with BrowserRouter when available — many generated apps use <Link>
// / useNavigate without declaring a router in App.tsx, which white-screens.
(function() {
  function __wrap(App) {
    var RRD = window.ReactRouterDOM || {};
    var Router = RRD.BrowserRouter || RRD.HashRouter || null;
    var node = React.createElement(App);
    return Router ? React.createElement(Router, null, node) : node;
  }
  function __mount(App, el) {
    var node = __wrap(App);
    try {
      if (typeof ReactDOM.createRoot === 'function') {
        ReactDOM.createRoot(el).render(node);
        if (el.childNodes && el.childNodes.length) return;
      }
    } catch (e1) { console.warn('createRoot failed, trying legacy render', e1); }
    if (typeof ReactDOM.render === 'function') {
      ReactDOM.render(node, el);
    }
  }
  try {
    var App = (window.__AppBundle && (window.__AppBundle.default || window.__AppBundle.App)) || window.App;
    if (!App && window.__AppBundle) {
      for (var k in window.__AppBundle) {
        if (typeof window.__AppBundle[k] === 'function') { App = window.__AppBundle[k]; break; }
      }
    }
    var el = document.getElementById('root');
    // If main.tsx entry already mounted content, leave it alone
    if (el && el.childNodes && el.childNodes.length) return;
    if (App && el) {
      __mount(App, el);
    } else if (el && !(el.childNodes && el.childNodes.length)) {
      el.innerHTML = '<div style="padding:2rem;font-family:sans-serif"><h2>Preview rendered</h2></div>';
    }
  } catch(e) {
    console.error('Mount error:', e);
    var root = document.getElementById('root');
    if (root) root.innerHTML = '<div style="padding:2rem;font-family:sans-serif;color:#c00"><h2>Preview error</h2><pre style="font-size:12px;margin-top:1rem;white-space:pre-wrap">' + e.message + '</pre></div>';
  }
})();
</script>
</body>
</html>`;
}

// ── Babel fallback (legacy projects without source_files.json) ────────────────

function stripImportsFromBabelBlocks(html: string): string {
  const ICON_ALIASES: Record<string, string> = {
    CheckCircle: "CircleCheck", Code2: "Code",
    PersonStanding: "User", HeartHandshake: "Handshake", GalleryHorizontal: "Layout",
  };

  return html.replace(
    /(<script[^>]+type=["']text\/babel["'][^>]*>)([\s\S]*?)(<\/script>)/gi,
    (_match, open: string, code: string, close: string) => {
      let cleaned = code;
      cleaned = cleaned.replace(/^[ \t]*import\s+[\s\S]*?from\s*['"][^'"]+['"];?[ \t]*$/gm, "// import stripped");
      cleaned = cleaned.replace(/import\s*\{[^}]*\}\s*from\s*['"][^'"]+['"];?/gs, "// import stripped");
      cleaned = cleaned.replace(/import\s+[A-Za-z_$][\w$]*\s+from\s*['"][^'"]+['"];?/g, "// import stripped");
      // ── esbuild path: keep ESM syntax intact (do not strip export/default) ──
      // Empty bracket accessor: `()[].map(` -> `().map(`  /  `)[].` -> `).`  /  `x[].` -> `x?.`
      cleaned = cleaned.replace(/\(\)\[\]\.(?=[a-zA-Z])/g, "().");
      cleaned = cleaned.replace(/\)\[\]\.(?=[a-zA-Z])/g, ").");
      cleaned = cleaned.replace(/\b([A-Za-z_$][\w$]*)\[\]\.(?=[a-zA-Z])/g, "$1?.");
      // Stray `>` before `=` from TypeScript generic truncation: `const x> =` -> `const x =`
      cleaned = cleaned.replace(/\b(const|let|var)(\s+\w+)>\s*=/g, "$1$2 =");
      // Double semicolons
      cleaned = cleaned.replace(/;;+/g, ";");
      // Markdown code-fence artifacts
      cleaned = cleaned.replace(/^```[a-zA-Z]*\s*\n/gm, "");
      cleaned = cleaned.replace(/\n```\s*$/g, "");
      // Stray language-tag first line (tsx, typescript, css, etc.)
      cleaned = cleaned.replace(/^(tsx|ts|js|jsx|typescript|javascript|css|html|react)\s*\n/, "");
      const aliasLines = Object.entries(ICON_ALIASES)
        .map(([f, t]) => `if (typeof ${f} === 'undefined' && typeof ${t} !== 'undefined') { var ${f} = ${t}; }`)
        .join("\n");
      const lucideSetup = `const _lucideAll = window.LucideReact || {};\nObject.keys(_lucideAll).forEach(function(k) { if (typeof window[k] === 'undefined') window[k] = _lucideAll[k]; });\n${aliasLines}\n`;
      if (!cleaned.includes("_lucideAll")) cleaned = lucideSetup + cleaned;
      return open + cleaned + close;
    }
  );
}

function sanitizeHtml(html: string): string {
  let out = html.replace(/strokeWidth="(\d+(?:\.\d+)?)"/g, (_, n) => `strokeWidth={${n}}`);
  out = out.replace(/<script[^>]+type=["']module["'][^>]+src=["'][^"']*\/src\/[^"']*["'][^>]*><\/script>/gi, "");
  out = out.replace(/<script[^>]+src=["'][^"']*\/src\/main\.[jt]sx?["'][^>]*><\/script>/gi, "");
  out = out.replace(/https:\/\/unpkg\.com\/lucide-react@latest\/dist\/umd\/lucide-react\.js/g,
    "https://unpkg.com/lucide-react@0.475.0/dist/umd/lucide-react.js");
  // Alias window.react before the lucide UMD runs (see LUCIDE_REACT_GLOBAL_ALIAS),
  // then expose the loaded icons as globals.
  out = out.replace(
    /(<script[^>]+unpkg\.com\/lucide-react[^>]*><\/script>)(?!\s*<script>Object\.assign)/i,
    `${LUCIDE_REACT_GLOBAL_ALIAS}\n$1\n<script>Object.assign(window, window.LucideReact || {});<\/script>`
  );
  out = out.replace(/import\s*\{[\s\S]*?\}\s*from\s*["']lucide-react["'];?/gs,
    () => `const _lucide = window.LucideReact || {}; Object.assign(window, _lucide);`);
  out = out.replace(/import\s*\{[\s\S]*?\}\s*from\s*["'][^"']+["'];?/g, "/* import stripped */");
  out = out.replace(/import\s+[^\n]+from\s+["'][^"']+["'];?/g, "/* import stripped */");
  out = out.replace(/(?:^[ \t]*[A-Za-z_][A-Za-z0-9_,\s]*\n)*[ \t]*\}\s*from\s*["'][^"']+["'];?/gm, "/* import stripped */");

  if (out.includes('type="text/babel"') || out.includes("type='text/babel'")) {
    const hasBabel = out.includes("babel.min.js") || out.includes("@babel/standalone");
    const hasReact = out.includes("react.production") || out.includes("react.development") || out.includes("unpkg.com/react");
    const inj: string[] = [];
    if (!hasReact) {
      inj.push('<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>');
      inj.push('<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>');
      inj.push(LUCIDE_REACT_GLOBAL_ALIAS);
    }
    // forwardRef patch: Lucide UMD calls React.forwardRef on load before Babel runs
    // Without this, icons crash: "Cannot read properties of undefined (reading 'forwardRef')"
    if (!out.includes("forwardRef")) {
      inj.push('<script>window.React=window.React||{};if(!window.React.forwardRef)window.React.forwardRef=function(r){return r;};</script>');
    }
    if (!hasBabel) inj.push('<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>');
    if (inj.length) out = out.replace("</head>", inj.join("\n") + "\n</head>");
  }

  // Convert type=module → type=text/babel AND strip imports from converted blocks
  if ((out.includes("text/babel") || out.includes("@babel/standalone")) &&
      (out.includes('type="module"') || out.includes("type='module'"))) {
    out = out.replace(
      /<script([^>]+)type=["'`]module["'`]([^>]*)>([\s\S]*?)<\/script>/gi,
      (_m: string, pre: string, post: string, code: string) => {
        let cleaned = code;
        cleaned = cleaned.replace(/^[ \t]*import\s+[\s\S]*?from\s*['"][^'"]+['"];?[ \t]*$/gm, "// import stripped");
        cleaned = cleaned.replace(/import\s*\{[^}]*\}\s*from\s*['"][^'"]+['"];?/gs, "// import stripped");
        cleaned = cleaned.replace(/import\s+[A-Za-z_$][\w$]*\s+from\s*['"][^'"]+['"];?/g, "// import stripped");
        cleaned = cleaned.replace(/^[ \t]*export\s+default\s+/gm, "const __defaultExport = ");
        cleaned = cleaned.replace(/^[ \t]*export\s+\{[^}]*\};?[ \t]*$/gm, "// export stripped");
        return "<script" + pre + 'type="text/babel"' + post + ">" + cleaned + "</script>";
      }
    );
  }

  if ((out.includes('type="module"') || out.includes("type='module'")) && !out.includes("importmap")) {
    const importMap = '<script type="importmap">{"imports":{"react":"https://esm.sh/react@18","react/jsx-runtime":"https://esm.sh/react@18/jsx-runtime","react-dom/client":"https://esm.sh/react-dom@18/client","lucide-react":"https://esm.sh/lucide-react@0.475.0"}}</script>';
    out = out.replace("</head>", importMap + "</head>");
  }
  return out;
}

function repairTruncatedHtml(html: string): string {
  const hasBabelOpen = html.includes('type="text/babel"') || html.includes("type='text/babel'");
  const hasBodyClose = html.includes("</body>");
  const hasHtmlClose = html.includes("</html>");
  if (!hasBabelOpen || (hasBodyClose && hasHtmlClose)) return html;
  let repair = html;
  if (!hasBodyClose) repair += "\n</body>";
  if (!hasHtmlClose) repair += "\n</html>";
  return repair;
}

// Detect standalone HTML (complete website from LLM — no JSX/React components)
// Standalone HTML should be served as-is with no Babel transformation.
function isStandaloneHtml(html: string): boolean {
  const hasJsx = /<[A-Z][A-Za-z]+\s|React\.createElement|type=["']text\/babel/i.test(html);
  const hasModuleImports = /import\s+[\w{*].*from\s+['"][^'"]+['"]/.test(html);
  if (hasJsx) return false;
  // Has complete HTML boilerplate but no JSX → standalone
  return html.includes('<!DOCTYPE') && !hasJsx;
}

// Sanitize standalone HTML minimally — fix CDN links, no Babel injection
// Server-side compile all type="text/babel" script blocks using esbuild transform.
// Strips CDN loaders (Babel, React, ReactDOM, Lucide, Tailwind) and replaces with
// compiled plain JS + React/ReactDOM UMD. No browser Babel. No transformScriptTags.
function patchUmdHtml(html: string): string {
  // Fix Lucide @latest pin
  let out = html.replace(/https:\/\/unpkg\.com\/lucide-react@latest/g, "https://unpkg.com/lucide-react@0.475.0");
  // Ensure forwardRef guard is present before </head>
  const guard = '<script>window.React=window.React||{};if(!window.React.forwardRef)window.React.forwardRef=function(r){return r;};</script>';
  if (!out.includes("forwardRef") && out.includes("</head>")) {
    out = out.replace("</head>", guard + "\n</head>");
  }
  return out;
}

// Known React/built-in identifiers that are never icon stubs
const REACT_GLOBALS = new Set([
  'React','ReactDOM','Fragment','Component','PureComponent','StrictMode',
  'useState','useEffect','useRef','useCallback','useMemo','useContext','useReducer',
  'useLayoutEffect','useImperativeHandle','useDebugValue','useId','useTransition',
  'createContext','forwardRef','memo','lazy','Suspense','createRef','cloneElement',
  'isValidElement','Children','createPortal',
  'Object','Array','Math','String','Number','Boolean','Promise','Error','JSON',
  'Map','Set','Date','RegExp','Symbol','Proxy','Reflect','WeakMap','WeakSet',
  'console','window','document','navigator','location','history','localStorage',
  'sessionStorage','fetch','XMLHttpRequest','URL','URLSearchParams','FormData',
  'Event','EventTarget','HTMLElement','HTMLDivElement','HTMLInputElement',
  'setTimeout','setInterval','clearTimeout','clearInterval','requestAnimationFrame',
  'App','Header','Footer','Navbar','Sidebar','Main','Hero','Section','Page',
  'Router','Route','Switch','Link','Redirect','NavLink',
  'Provider','Consumer','ThemeProvider','AuthProvider',
  'motion','AnimatePresence',
  'Chart','LineChart','BarChart','PieChart','AreaChart',
  'XAxis','YAxis','CartesianGrid','Tooltip','Legend','ResponsiveContainer',
  'Line','Bar','Area','Pie','Cell',
]);

/** Scan JSX source and return PascalCase identifiers used as components/icons that need stubs.
 * Only looks in CODE positions (JSX tags, object values, array items) — not string content. */
function extractUsedComponents(src: string): string[] {
  // Step 1: Strip string literals to avoid false positives from text content
  // e.g. "Authentic Salvadoran" should not generate stubs for Authentic, Salvadoran
  const srcNoStrings = src
    .replace(/`[\s\S]*?`/g, '""')          // template literals
    .replace(/"(?:[^"\\]|\\.)*"/g, '""') // double-quoted strings
    .replace(/'(?:[^'\\]|\\.)*'/g, "''"); // single-quoted strings

  // Step 2: scan for JSX tags — most reliable signal of component usage
  const seen = new Set<string>();
  const jsxRe = /<([A-Z][A-Za-z0-9]*)(?:[\s/>])/g;
  let m: RegExpExecArray | null;
  while ((m = jsxRe.exec(srcNoStrings)) !== null) seen.add(m[1]);

  // Step 3: scan for identifiers in array/object value positions in code
  // Covers: [Instagram, Facebook, Twitter], { icon: Wine }, iconMap[Star]
  const valRe = /[:{,=(\[]\s*([A-Z][A-Za-z0-9]+)\s*[,}\])/]/g;
  while ((m = valRe.exec(srcNoStrings)) !== null) seen.add(m[1]);

  // Step 4: names declared in this source are NOT undefined — exclude them
  const declaredNames = new Set<string>();
  const declRe = /(?:const|let|var|function|class)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*[=({:]/g;
  while ((m = declRe.exec(src)) !== null) declaredNames.add(m[1]);

  return Array.from(seen).filter(n =>
    !REACT_GLOBALS.has(n) &&     // not a React built-in
    /[a-z]/.test(n) &&           // PascalCase — skip ALL_CAPS constants
    !declaredNames.has(n) &&     // not declared in this source
    n.length >= 3                // skip short abbreviations
  );
}





async function compileBabelBlocks(html: string): Promise<string> {
  // Extract all type="text/babel" blocks
  const babelBlockRe = /<script[^>]+type=["'`]text\/babel["'`][^>]*>([\s\S]*?)<\/script>/gi;
  const blocks: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = babelBlockRe.exec(html)) !== null) blocks.push(match[1]);
  // Even if no Babel blocks, still patch UMD CDN order and inject forwardRef guard
  if (blocks.length === 0) return patchUmdHtml(html);

  // Use esbuild JS API transform() — no binary, no file I/O, no child_process
  // esbuild is marked external in next.config.ts so require() works in API routes
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const esbuild = require("esbuild");

  // Inline SVG stub — returned for any unknown icon component reference
  const SVG_STUB_FN = `function(p){return React.createElement('svg',{xmlns:'http://www.w3.org/2000/svg',width:(p&&p.size)||24,height:(p&&p.size)||24,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,className:(p&&p.className)||'',style:(p&&p.style)||{}})}`;

  const compiled: string[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const src = blocks[i]
      .replace(/^[ \t]*import\s+[\s\S]*?from\s*['"][^'"]+['"];?[ \t]*$/gm, '// stripped')
      .replace(/import\s*\{[^}]*\}\s*from\s*['"][^'"]+['"];?/gs, '// stripped')
      .replace(/^[ \t]*export\s+default\s+/gm, 'window.__PreviewApp = ');
    try {
      const result = await esbuild.transform(src, {
        loader: 'tsx',
        jsx: 'transform',
        jsxFactory: 'React.createElement',
        jsxFragment: 'React.Fragment',
      });
      // Dynamically detect every UpperCase component/icon name used in THIS block's source.
      // Generate var declarations so bare name references resolve in the compiled script scope.
      // This is zero-hardcoding: Wine, Beer, Cocktail, AnyFutureIcon — all handled automatically.
      const usedComponents = extractUsedComponents(src);
      const iconVarDecls = usedComponents.map(n =>
        `var ${n} = (typeof ${n} !== 'undefined') ? ${n} : (window['${n}'] || (${SVG_STUB_FN}));`
      ).join('\n');
      // Wrap in IIFE to scope all const/let/var declarations
      // Prevents 'already been declared' SyntaxError when same const name appears twice
      const iife = `(function(){
${iconVarDecls}
${result.code}
})();`;
      compiled.push(iife);
    } catch (e: unknown) {
      console.error(`[preview] esbuild transform block ${i} failed:`, (e as Error).message?.slice(0, 300));
      // On compile failure: inject visible error UI instead of blank/silent fail
      const errMsg = ((e as Error).message || 'Unknown error').slice(0, 500).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      compiled.push(`(function(){
  const rootEl = document.getElementById('root');
  if (rootEl) rootEl.innerHTML = '<div style="padding:2rem;font-family:monospace;background:#1a1a1a;color:#ff6b6b;min-height:100vh"><h2 style="color:#ffa07a;margin-bottom:1rem">⚠️ Preview compile error (block ${i})</h2><pre style="font-size:12px;white-space:pre-wrap;line-height:1.5">' + ${JSON.stringify(errMsg)} + '</pre><p style="margin-top:1rem;color:#aaa;font-size:11px">Regenerate the project to fix this. The generated JSX contained a syntax error.</p></div>';
})();`);
    }
  }

  // Replace babel blocks with compiled plain JS, strip CDN loaders
  let idx = 0;
  // Replace all type="text/babel" blocks with compiled/error JS
  let out = html.replace(babelBlockRe, () => `<script>${compiled[idx++] || ""}</script>`);
  // Hard guarantee: no type="text/babel" remains — browser Babel must never load
  out = out.replace(/(<script[^>]*)\s+type=["']text\/babel["']([^>]*>)/gi, '$1$2');
  out = out.replace(/(<script[^>]*)\s+data-presets=["'][^"']*["']([^>]*>)/gi, '$1$2');

  // Fix mount call: after esbuild compilation, App is no longer in global scope —
  // it was captured as window.__PreviewApp by the export-default replacement above.
  // Update the mount script to use window.__PreviewApp.
  out = out.replace(
    /ReactDOM\.createRoot\(document\.getElementById\(["']root["']\)\)\.render\(React\.createElement\(App\)\)/g,
    `ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(window.__PreviewApp || window.App || (typeof App !== "undefined" ? App : null) || function(){return React.createElement("div",null,"App not found");}))`
  );
  // Also handle window.__PreviewApp used directly
  out = out.replace(
    /ReactDOM\.createRoot\([^)]+\)\.render\(React\.createElement\(window\.__PreviewApp\)\)/g,
    `ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(window.__PreviewApp || window.App || (typeof App !== "undefined" ? App : null) || function(){return React.createElement("div",null,"App not found");}))`
  );

  // Remove CDN loaders — they are not needed when JSX is compiled server-side
  out = out.replace(/<script[^>]+unpkg\.com\/@babel\/standalone[^>]*><\/script>\s*/gi, "");
  out = out.replace(/<script[^>]+unpkg\.com\/react@[^"']+\/umd\/[^"']+['"][^>]*><\/script>\s*/gi, "");
  out = out.replace(/<script[^>]+unpkg\.com\/react-dom@[^"']+\/umd\/[^"']+['"][^>]*><\/script>\s*/gi, "");
  out = out.replace(/<script[^>]+cdn\.tailwindcss\.com[^>]*><\/script>\s*/gi, "");
  out = out.replace(/<script[^>]+unpkg\.com\/lucide-react[^>]*><\/script>\s*/gi, "");
  // Strip orphaned Babel.registerPreset / Babel.* script blocks (Babel CDN was stripped above)
  out = out.replace(/<script(?:[^>]*)>(?:\s*\/\/[^\n]*)?\s*Babel\.\w[\s\S]{0,1000}?<\/script>/gi, "<!-- babel stripped -->");

  // Inject React/ReactDOM UMD + Lucide UMD + Tailwind play CDN before </head>
  const injected = [
    '<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>',
    '<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>',
    LUCIDE_REACT_GLOBAL_ALIAS,
    '<script src="https://cdn.tailwindcss.com"></script>',
  ].join("\n");
  out = out.replace("</head>", injected + "\n</head>");

  return out;
}

function sanitizeStandaloneHtml(html: string): string {
  const out = html.replace(/https:\/\/unpkg\.com\/lucide-react@latest/g, "https://unpkg.com/lucide-react@0.475.0");
  // 0.475 has the same `global.react` lookup as 0.542 — alias before it loads.
  return out.replace(
    /(<script[^>]+unpkg\.com\/lucide-react[^>]*><\/script>)/i,
    `${LUCIDE_REACT_GLOBAL_ALIAS}\n$1`
  );
}


function processHtml(raw: string): string {
  // Order: sanitize first (converts type=module→text/babel), then strip imports from all babel blocks
  const repaired = repairTruncatedHtml(raw);
  const sanitized = sanitizeHtml(repaired);
  return stripImportsFromBabelBlocks(sanitized);
}

// ── Backend project lookup ────────────────────────────────────────────────────

async function resolveProjectId_FromS3(sessionId: string): Promise<string | null> {
  // Fast S3 lookup: builder-projects/{sessionId}/project_id.txt written by Python backend on codegen
  const val = await s3Get(`${S3_PREFIX}/${sessionId}/project_id.txt`);
  if (val && val.trim().length > 0) return val.trim();
  return null;
}

async function resolveProjectId(sessionId: string, token: string): Promise<string | null> {
  // First: S3 mapping file (written by project_generation_service.py)
  const s3ProjectId = await resolveProjectId_FromS3(sessionId);
  if (s3ProjectId) return s3ProjectId;
  // Fallback: AI service
  try {
    const res = await fetch(`${AI_SERVICE_URL}/v1/chat/projects?session_id=${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      const projects = data.projects || data.items || (Array.isArray(data) ? data : []);
      const match = projects.find((p: { session_id?: string; project_id?: string }) =>
        p.session_id === sessionId && p.project_id);
      if (match?.project_id) return match.project_id;
    }
  } catch { /* ignore */ }
  return null;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // Preview route is intentionally public — project IDs are UUIDs (not guessable),
    // and the rendered HTML is not sensitive. Auth was blocking iframe rendering
    // because iframes do not send cookies on initial load in all browsers.
    // Token is still used for AI service lookups; read from cookie OR query param.
    const token =
      request.cookies.get("auth-token")?.value ||
      request.nextUrl.searchParams.get("t") ||
      request.headers.get("Authorization")?.replace("Bearer ", "") ||
      "anonymous";

    const serve = (html: string) =>
      new NextResponse(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });

    // ── Step 0: If DB has a CloudFront preview_url, redirect there immediately ──
    // New static-build pipeline stores preview_url = https://preview.ai2me.com/{id}/{ver}/index.html
    try {
      const sessRes = await fetch(
        `${AI_SERVICE_URL}/v1/chat/sessions/${sessionId}`,
        { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(5000) }
      );
      if (sessRes.ok) {
        const sessData = await sessRes.json();
        const cfUrl: string | undefined =
          sessData?.preview_url ||
          sessData?.session?.preview_url ||
          sessData?.data?.preview_url;
        if (cfUrl && cfUrl.startsWith("https://preview.ai2me.com")) {
          return NextResponse.redirect(cfUrl, { status: 302 });
        }
      }
    } catch { /* AI service unreachable — fall through to legacy chain */ }

    // ── Step 1: Try esbuild pipeline (new projects with source_files.json) ──
    const esbuildHtml = await buildWithEsbuild(sessionId);
    if (esbuildHtml) return serve(esbuildHtml);

    // Try resolving project_id then esbuild again
    const projectId = await resolveProjectId(sessionId, token);
    if (projectId && projectId !== sessionId) {
      const esbuildHtml2 = await buildWithEsbuild(projectId);
      if (esbuildHtml2) return serve(esbuildHtml2);
    }

    // ── Step 2: S3 HTML — server-side compile Babel blocks, strip CDN loaders ──
    const lookupId = projectId || sessionId;
    let html = await fetchPreviewHtml(sessionId);
    if (!html && projectId && projectId !== sessionId) html = await fetchPreviewHtml(projectId);
    // Detect Vite dev skeleton: has <!DOCTYPE but no real JS bundle — just a <script src="/src/..."> dev entry.
    // Returning this raw causes a blank page because /src/main.jsx 404s inside the iframe.
    // Skip it and fall through to Step 3/4 which fetch and bundle the actual source files.
    if (html) html = stripLlmFormatPrefix(html);
    if (html && html.includes("<!DOCTYPE") && !isViteSkeleton(html)) {
      const compiled = await compileBabelBlocks(html);
      return serve(compiled);
    }

    // ── Step 3: Ask AI service directly ──
    // Skip Vite skeletons here too — the AI /preview endpoint often returns the raw
    // index.html (with optional "html\\n" prefix). Serving that looks like success
    // but the iframe is blank; fall through to Step 4 esbuild instead.
    try {
      for (const refId of [lookupId, ...(lookupId !== sessionId ? [sessionId] : [])]) {
        const upstream = await fetch(
          `${AI_SERVICE_URL}/v1/chat/projects/${refId}/preview`,
          { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) }
        );
        if (!upstream.ok) continue;
        const body = stripLlmFormatPrefix(await upstream.text());
        if (body.length > 200 && body.includes("<") && !isViteSkeleton(body)) {
          const compiled = await compileBabelBlocks(body);
          return serve(compiled);
        }
      }
    } catch { /* AI service unreachable */ }

    // ── Step 4: Fetch files via internal Next.js proxy, build esbuild bundle ──
    // IMPORTANT: The preview iframe sends no cookies, so calling the AI service
    // directly with token="anonymous" fails with 404 (org ownership check).
    // Fix: call our own /api/chat/projects/{id}/files proxy which runs server-side
    // and carries AI_SERVICE_API_KEY in env — bypasses the missing-cookie problem.
    const internalOrigin = request.nextUrl.origin;
    try {
      for (const refId of [sessionId, ...(projectId && projectId !== sessionId ? [projectId] : [])]) {
        const filesRes = await fetch(
          `${internalOrigin}/api/chat/projects/${refId}/files?format=flat`,
          {
            headers: token && token !== "anonymous"
              ? { Cookie: `auth-token=${token}` }
              : {},
            signal: AbortSignal.timeout(45000)
          }
        );
        if (!filesRes.ok) continue;
        const filesData = await filesRes.json();
        const fileList: Array<{ path: string; content: string }> =
          Array.isArray(filesData) ? filesData :
          (filesData.files || filesData.items || filesData.data || []);
        if (!fileList.length) continue;

        // Write files to a temp dir and run esbuild
        const DEPLOY_SHA2 = (process.env.DEPLOY_SHA || "dev").slice(0,8);
        const reqId2 = Math.random().toString(36).slice(2, 8);
        const tmpDir = path.join(os.tmpdir(), `ai2me-preview-live-${refId}-${DEPLOY_SHA2}-${reqId2}`);
        fs.mkdirSync(tmpDir, { recursive: true });
        const uploaded: string[] = [];
        const SKIP = new Set(["package-lock.json", "yarn.lock", "pnpm-lock.yaml"]);
        const SRC_EXTS = [".tsx", ".ts", ".jsx", ".js", ".css", ".html", ".json"];
        for (const f of fileList) {
          const fp = (f.path || "").replace(/^\//, "");
          let content = f.content || "";
          if (!fp || !content || SKIP.has(fp) || fp.startsWith("dist/")) continue;
          content = fp.endsWith(".css")
            ? sanitizeCssForEsbuild(content)
            : stripLlmFormatPrefix(content);
          const abs = path.join(tmpDir, fp);
          fs.mkdirSync(path.dirname(abs), { recursive: true });
          fs.writeFileSync(abs, content, "utf-8");
          if (SRC_EXTS.some(e => fp.endsWith(e))) uploaded.push(fp);
        }

        // Rewrite mismatched App (boilerplate pages missing, real pages present)
        for (const appRel of ["src/App.tsx", "src/App.jsx", "App.tsx", "App.jsx"]) {
          const appAbs = path.join(tmpDir, appRel);
          if (!fs.existsSync(appAbs)) continue;
          const rewritten = rewriteAppForExistingPages(
            fs.readFileSync(appAbs, "utf-8"),
            uploaded
          );
          if (rewritten) {
            fs.writeFileSync(appAbs, rewritten, "utf-8");
            if (!uploaded.includes(appRel)) uploaded.push(appRel);
          }
          break;
        }
        // @/ → relative before stubbing; stub truncated LLM files
        for (const fp of uploaded.filter((f) => /\.(tsx|ts|jsx|js)$/.test(f))) {
          const abs = path.join(tmpDir, fp);
          if (!fs.existsSync(abs)) continue;
          let text = rewriteAtAliasImports(fp, fs.readFileSync(abs, "utf-8"));
          const stubbed = stubIfTruncatedSource(text, path.basename(fp));
          if (stubbed) text = stubbed;
          fs.writeFileSync(abs, text, "utf-8");
        }

        // Bridge path mismatches (e.g. import ./screens/X when file is src/pages/X.tsx)
        // and stub missing CSS / CSS-module imports (import styles from './X.module.css').
        // Named imports require matching named exports — collect bindings first.
        // Also synonym-bridge Features→Benefits, HowItWorks vs HowToUse, Pricing→CTA.
        const CODE_EXTS = [".tsx", ".ts", ".jsx", ".js"];
        const fuzzyMap = buildFuzzyComponentMap(uploaded);
        type StubSpec = { stubPath: string; named: Set<string>; bridgeTo?: string };
        const stubs = new Map<string, StubSpec>();

        for (const filePath of uploaded.filter((f) => CODE_EXTS.some((e) => f.endsWith(e)))) {
          const abs = path.join(tmpDir, filePath);
          if (!fs.existsSync(abs)) continue;
          const srcText = fs.readFileSync(abs, "utf-8");

          // import styles from './x.module.css' OR import './x.css'
          const cssImportRe =
            /import\s+(?:[\w*{}\s,]+\s+from\s+)?['"](\.{1,2}\/[^'"]+\.css)['"]/g;
          let cm: RegExpExecArray | null;
          while ((cm = cssImportRe.exec(srcText)) !== null) {
            const cssAbs = path.resolve(path.dirname(abs), cm[1]);
            if (!fs.existsSync(cssAbs)) {
              fs.mkdirSync(path.dirname(cssAbs), { recursive: true });
              fs.writeFileSync(cssAbs, "/* auto-stub: css not generated */\n", "utf-8");
            }
          }

          // import Foo from './x'
          // import { a, b as c } from './x'
          // import Foo, { a } from './x'
          const importRe =
            /import\s+(?:type\s+)?(?:(\w+)(?:\s*,\s*\{([^}]*)\})?|\{([^}]*)\})\s+from\s+['"](\.{1,2}\/[^'"]+)['"]/g;
          let m: RegExpExecArray | null;
          while ((m = importRe.exec(srcText)) !== null) {
            const defaultImport = m[1];
            const namedRaw = m[2] || m[3] || "";
            const rel = m[4];
            if (rel.endsWith(".css")) continue;

            const baseResolved = path.resolve(path.dirname(abs), rel);
            const missing = CODE_EXTS.every(
              (ext) =>
                !fs.existsSync(baseResolved + ext) &&
                !fs.existsSync(path.join(baseResolved, "index" + ext))
            );
            if (!missing) continue;

            const stubPath = CODE_EXTS.some((e) => baseResolved.endsWith(e))
              ? baseResolved
              : baseResolved + ".tsx";
            const key = stubPath;
            const rawName = path.basename(stubPath).replace(/\.[^.]+$/, "");
            const realFile = resolveFuzzyComponent(rawName, fuzzyMap);
            let spec = stubs.get(key);
            if (!spec) {
              spec = {
                stubPath,
                named: new Set<string>(),
                bridgeTo: realFile && realFile !== filePath ? realFile : undefined,
              };
              stubs.set(key, spec);
            }
            if (defaultImport) spec.named.add("default");
            for (const part of namedRaw.split(",")) {
              const token = part.trim();
              if (!token || token === "type") continue;
              // `foo as bar` or `type Foo` — keep the local binding name for export
              const cleaned = token.replace(/^type\s+/, "");
              const local = (cleaned.split(/\s+as\s+/).pop() || cleaned).trim();
              if (local && /^[A-Za-z_$][\w$]*$/.test(local)) spec.named.add(local);
            }
          }
        }

        for (const spec of stubs.values()) {
          if (fs.existsSync(spec.stubPath)) continue;
          fs.mkdirSync(path.dirname(spec.stubPath), { recursive: true });
          if (spec.bridgeTo) {
            const realAbs = path.join(tmpDir, spec.bridgeTo);
            const relToReal = path
              .relative(path.dirname(spec.stubPath), realAbs)
              .replace(/\\/g, "/")
              .replace(/\.[^.]+$/, "");
            const relPath = relToReal.startsWith(".") ? relToReal : "./" + relToReal;
            fs.writeFileSync(
              spec.stubPath,
              `// Auto-bridge -> '${spec.bridgeTo}'\nexport * from '${relPath}';\nexport { default } from '${relPath}';\n`,
              "utf-8"
            );
            continue;
          }
          const lines = ["// Auto-stub for missing generated module", "import React from 'react';"];
          for (const n of spec.named) {
            if (n === "default") continue;
            if (/^use[A-Z]/.test(n)) {
              lines.push(`export const ${n} = (..._args: any[]) => ({});`);
            } else if (/^[A-Z]/.test(n)) {
              // Component or enum-like value
              lines.push(
                `export const ${n}: any = (props: any) => React.createElement(React.Fragment, null, props?.children);`
              );
            } else {
              lines.push(`export const ${n}: any = {};`);
            }
          }
          // Fixed name avoids clashing with named exports like useGameState
          lines.push(
            "const __StubDefault: React.FC<any> = ({ children }) => React.createElement(React.Fragment, null, children);"
          );
          lines.push("export default __StubDefault;");
          fs.writeFileSync(spec.stubPath, lines.join("\n") + "\n", "utf-8");
        }

        // Inject orphan section components into App (e.g. Ingredients never wired by LLM)
        for (const appRel of ["src/App.tsx", "src/App.jsx", "App.tsx", "App.jsx"]) {
          const appAbs = path.join(tmpDir, appRel);
          if (!fs.existsSync(appAbs)) continue;
          const compNames = uploaded
            .filter((f) => /(?:^|\/)components\/[^/]+\.(tsx|jsx)$/i.test(f))
            .map((f) => path.basename(f).replace(/\.[^.]+$/, ""));
          const nextApp = injectOrphanComponentsIntoApp(
            fs.readFileSync(appAbs, "utf-8"),
            compNames
          );
          fs.writeFileSync(appAbs, nextApp, "utf-8");
          break;
        }

        // Ensure export default on component files (same as S3 path)
        for (const filePath of uploaded.filter((f) => /\.(tsx|jsx)$/.test(f))) {
          const absF = path.join(tmpDir, filePath);
          if (!fs.existsSync(absF)) continue;
          let fText = fs.readFileSync(absF, "utf-8");
          if (fText.includes("export default")) continue;
          const compMatch = fText.match(
            /(?:const|function)\s+([A-Z][A-Za-z0-9_]*)(?:\s*:\s*React\.FC[^=]*)?\s*=/
          );
          if (compMatch) {
            fText = fText + `\nexport default ${compMatch[1]};\n`;
            fs.writeFileSync(absF, fText, "utf-8");
          }
        }

        // Also persist to S3 so future loads skip this step
        try {
          const { PutObjectCommand } = await import("@aws-sdk/client-s3");
          const pid = projectId || refId;
          for (const fp of uploaded) {
            const content = fs.readFileSync(path.join(tmpDir, fp), "utf-8");
            await s3.send(new PutObjectCommand({
              Bucket: S3_BUCKET,
              Key: `${S3_PREFIX}/${pid}/sources/${fp}`,
              Body: content,
              ContentType: "text/plain; charset=utf-8",
            }));
          }
          await s3.send(new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: `${S3_PREFIX}/${pid}/source_files.json`,
            Body: JSON.stringify(uploaded),
            ContentType: "application/json",
          }));
        } catch { /* S3 persist failed — non-fatal */ }

        // Prefer App.tsx so __AppBundle.default is defined (main.tsx has side-effect mount, no exports)
        const entryOptions = [
          "src/App.tsx", "src/App.jsx", "src/app.tsx", "src/app.jsx", "App.tsx", "App.jsx",
          "src/main.tsx", "src/main.jsx", "src/index.tsx", "src/index.jsx",
          "main.tsx", "main.jsx", "index.tsx", "index.jsx",
        ];
        const entry = entryOptions.find(e => fs.existsSync(path.join(tmpDir, e)));
        if (!entry) continue;

        const outFile = path.join(tmpDir, "bundle.js");
        // Use esbuild JS API (same shims as S3 path) — CLI lacked @tanstack/react-query etc.
        const shimDir4 = path.join(tmpDir, "_shims");
        fs.mkdirSync(shimDir4, { recursive: true });
        const SHIM_PKGS4: Record<string, string> = {
          "react": "window.React || {}",
          "react-dom": "window.ReactDOM || {}",
          "react-dom/client": "window.ReactDOM || {}",
          "react/jsx-runtime": "window.React ? { jsx: window.React.createElement, jsxs: window.React.createElement, Fragment: window.React.Fragment } : {}",
          "react-router-dom": "window.ReactRouterDOM || {}",
          "react-router": "window.ReactRouter || {}",
          "@remix-run/router": "window.RemixRouter || {}",
          "framer-motion": "window.FramerMotion || window.Motion || {}",
          "lucide-react": "window.LucideReact || {}",
          "axios": "window.axios || { get: function(){return Promise.resolve({data:{}})}, post: function(){return Promise.resolve({data:{}})}, create: function(){ return this; } }",
          "@tanstack/react-query": "{ useQuery: function(){ return { data: undefined, isLoading: false, error: null }; }, useMutation: function(){ return { mutate: function(){}, isLoading: false }; }, QueryClient: function(){ return { defaultOptions: {} }; }, QueryClientProvider: function(p){ return p.children||null; } }",
          "react-native": "{}",
          "@react-native-async-storage/async-storage": "{ default: { getItem: async function(){ return null; }, setItem: async function(){}, removeItem: async function(){} } }",
        };
        for (const [pkg, expr] of Object.entries(SHIM_PKGS4)) {
          const safeName = pkg.replace(/[@/]/g, "_").replace(/[^a-zA-Z0-9_]/g, "_");
          fs.writeFileSync(path.join(shimDir4, safeName + ".cjs"), `module.exports = ${expr};`);
        }
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const esbuildApi4 = require("esbuild");
        const aliasPlugin4 = {
          name: "alias-shims-step4",
          setup(build: any) {
            for (const [pkg] of Object.entries(SHIM_PKGS4)) {
              const safeName = pkg.replace(/[@/]/g, "_").replace(/[^a-zA-Z0-9_]/g, "_");
              const shimPath = path.join(shimDir4, safeName + ".cjs");
              const escapedPkg = pkg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
              build.onResolve({ filter: new RegExp("^" + escapedPkg + "$") },
                () => ({ path: shimPath }));
            }
          },
        };
        let built = false;
        try {
          const buildResult4 = await esbuildApi4.build({
            entryPoints: [path.join(tmpDir, entry)],
            bundle: true,
            format: "iife" as const,
            globalName: "__AppBundle",
            platform: "browser" as const,
            external: ["react", "react-dom", "fs", "path", "os", "http", "https", "stream", "crypto", "events", "util", "buffer", "url", "net", "tls", "child_process", "express", "cors", "helmet", "morgan", "winston", "dotenv", "vite", "tailwindcss", "postcss", "autoprefixer"],
            define: { "process.env.NODE_ENV": '"production"' },
            loader: {
              ".tsx": "tsx", ".ts": "ts", ".jsx": "jsx", ".js": "js",
              ".css": "css", ".cjs": "js",
              ".png": "dataurl", ".svg": "dataurl", ".gif": "dataurl",
              ".webp": "dataurl", ".woff": "dataurl", ".woff2": "dataurl",
            },
            jsx: "automatic" as const,
            outfile: outFile,
            absWorkingDir: tmpDir,
            plugins: [aliasPlugin4],
            logLevel: "silent" as const,
          });
          built = !(buildResult4.errors && buildResult4.errors.length);
          if (!built) {
            console.error("[preview] step4 esbuild errors:", JSON.stringify(buildResult4.errors).slice(0, 800));
          }
        } catch (e4) {
          console.error("[preview] step4 esbuild threw:", (e4 as Error).message?.slice(0, 400));
          built = false;
        }

        if (built && fs.existsSync(outFile)) {
          const bundle = fs.readFileSync(outFile, "utf-8");
          try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
          return serve(buildEsbuildHtml(bundle, ""));
        }
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
      }
    } catch { /* AI service files fetch failed */ }

    return NextResponse.json({ detail: "Preview not available yet" }, { status: 404 });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ detail: "Preview proxy error: " + err.message }, { status: 500 });
  }
}
