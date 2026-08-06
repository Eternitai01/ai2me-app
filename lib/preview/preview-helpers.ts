/**
 * Shared helpers for on-demand App/Web Preview (esbuild iframe path).
 */

/** Strip LLM format markers like "html\\n" / "css\\n" / markdown fences from file content. */
export function stripLlmFormatPrefix(content: string): string {
  if (!content) return content;
  let out = content;
  // Leading language tag or fence
  out = out.replace(/^(css|html|jsx|tsx|js|ts|json)\s*\n/i, "");
  out = out.replace(/^```(?:css|html|jsx|tsx|js|ts|json|typescript|javascript)?\s*\n/i, "");
  // Fences may appear mid-file after a short preamble
  out = out.replace(/```(?:css|html|jsx|tsx|js|ts|json|typescript|javascript)?\s*\n/gi, "");
  out = out.replace(/```/g, "");
  // Lone language markers on their own line (common mid-CSS artifact: "css")
  out = out.replace(/^\s*(css|html|jsx|tsx|js|ts|json)\s*$/gim, "");
  return out;
}

/** Vite/dev skeleton: has DOCTYPE but only a /src/* module entry — blank in iframe. */
export function isViteSkeleton(h: string): boolean {
  const body = stripLlmFormatPrefix(h);
  return (
    body.includes('src="/src/main.') ||
    body.includes("src='/src/main.") ||
    body.includes('src="/src/index.') ||
    body.includes("src='/src/index.") ||
    (body.includes('type="module"') &&
      body.includes("/src/") &&
      !body.includes("__AppBundle") &&
      !body.includes("text/babel"))
  );
}

/** Remove Tailwind directives esbuild cannot process (CDN Tailwind covers utilities). */
export function sanitizeCssForEsbuild(content: string): string {
  let out = stripLlmFormatPrefix(content);
  out = out.replace(/^\s*@tailwind\s+\S+;?\s*$/gm, "");
  out = out.replace(/^\s*@layer\b[^{]*\{[\s\S]*?^\}/gm, "");
  out = out.replace(/^\s*@apply\s+[^;]+;\s*$/gm, "");
  return out;
}

/**
 * Common LLM naming mismatches: App imports Features but file is Benefits.tsx, etc.
 * Keys and values are lowercase basenames without extension.
 */
export const COMPONENT_SYNONYM_GROUPS: string[][] = [
  ["features", "feature", "benefits", "benefit", "highlights", "advantages", "featurelist"],
  ["howitworks", "howtouse", "howto", "steps", "process", "workflow", "usage"],
  ["pricing", "price", "plans", "cta", "calltoaction", "pricecard", "pricingtable"],
  ["testimonials", "testimonial", "reviews", "review", "socialproof"],
  ["faq", "faqs", "questions", "accordion"],
  ["hero", "herosection", "banner", "jumbotron"],
  ["header", "navbar", "nav", "navigation", "topbar"],
  ["footer", "sitefooter"],
  ["ingredients", "ingredient", "productdetails", "details"],
  ["about", "aboutus", "aboutsection"],
  ["contact", "contactus", "contactform"],
];

const FUZZY_SUFFIXES = ["page", "view", "screen", "container", "section", "component"];

/** Register basename (+ suffix-stripped variants) → relative file path. */
export function buildFuzzyComponentMap(filePaths: string[]): Map<string, string> {
  const fuzzyMap = new Map<string, string>();
  for (const fp of filePaths) {
    if (!/\.(tsx|ts|jsx|js)$/i.test(fp)) continue;
    const bname = fp.split("/").pop()!.replace(/\.[^.]+$/, "").toLowerCase();
    if (!fuzzyMap.has(bname)) fuzzyMap.set(bname, fp);
    for (const suf of FUZZY_SUFFIXES) {
      if (bname.endsWith(suf)) {
        const stripped = bname.slice(0, -suf.length);
        if (stripped.length > 1 && !fuzzyMap.has(stripped)) fuzzyMap.set(stripped, fp);
      }
    }
  }
  return fuzzyMap;
}

/**
 * Resolve a missing import basename to a real file path via exact, suffix, or synonym match.
 */
export function resolveFuzzyComponent(
  wantedBasename: string,
  fuzzyMap: Map<string, string>
): string | undefined {
  const key = wantedBasename.toLowerCase().replace(/[^a-z0-9]/g, "");
  const rawKey = wantedBasename.toLowerCase();

  const tryKeys = [rawKey, key];
  for (const k of tryKeys) {
    if (fuzzyMap.has(k)) return fuzzyMap.get(k);
  }

  for (const suf of FUZZY_SUFFIXES) {
    if (rawKey.endsWith(suf)) {
      const stripped = rawKey.slice(0, -suf.length);
      if (stripped.length > 1 && fuzzyMap.has(stripped)) return fuzzyMap.get(stripped);
    }
  }

  for (const group of COMPONENT_SYNONYM_GROUPS) {
    if (!group.includes(rawKey) && !group.includes(key)) continue;
    for (const candidate of group) {
      if (fuzzyMap.has(candidate)) return fuzzyMap.get(candidate);
    }
  }

  return undefined;
}

/**
 * Ensure App.tsx imports and renders every section component under src/components
 * that is not already referenced — fixes LLM leaving Ingredients/CTA out of App.
 */
export function injectOrphanComponentsIntoApp(
  appSource: string,
  componentBasenames: string[]
): string {
  if (!appSource || !componentBasenames.length) return appSource;

  const imported = new Set<string>();
  const importRe = /from\s+['"][^'"]*\/components\/([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = importRe.exec(appSource)) !== null) {
    imported.add(m[1].replace(/\.[^.]+$/, "").toLowerCase());
  }
  // Also catch `./components/Foo` style already covered; JSX tags for bridged names
  const jsxRe = /<([A-Z][A-Za-z0-9]*)\b/g;
  while ((m = jsxRe.exec(appSource)) !== null) {
    imported.add(m[1].toLowerCase());
  }

  // Treat synonym targets as already covered (Features import → Benefits not an orphan)
  const covered = new Set(imported);
  for (const name of imported) {
    for (const group of COMPONENT_SYNONYM_GROUPS) {
      if (group.includes(name)) {
        for (const g of group) covered.add(g);
      }
    }
  }

  const orphans = componentBasenames.filter((b) => !covered.has(b.toLowerCase()));
  if (!orphans.length) return appSource;

  const importLines = orphans
    .map((name) => `import ${name} from './components/${name}';`)
    .join("\n");

  let out = appSource;
  // Insert imports after the last existing import
  const lastImport = Math.max(
    out.lastIndexOf("\nimport "),
    out.lastIndexOf("\nimport{"),
    out.startsWith("import ") ? 0 : -1
  );
  if (lastImport >= 0) {
    const lineEnd = out.indexOf("\n", lastImport === 0 ? 0 : lastImport + 1);
    // find end of last import block
    let idx = 0;
    let lastEnd = -1;
    const lineImport = /^(import\s.+)$/gm;
    let lm: RegExpExecArray | null;
    while ((lm = lineImport.exec(out)) !== null) {
      lastEnd = lm.index + lm[0].length;
      idx = lastEnd;
    }
    if (lastEnd >= 0) {
      out = out.slice(0, lastEnd) + "\n" + importLines + out.slice(lastEnd);
    } else {
      out = importLines + "\n" + out;
    }
  } else {
    out = importLines + "\n" + out;
  }

  const jsxInsert = orphans.map((name) => `        <${name} />`).join("\n");
  // Prefer before </main>, else before <Footer, else before closing of outer return div
  if (out.includes("</main>")) {
    out = out.replace("</main>", `${jsxInsert}\n      </main>`);
  } else if (/<Footer\s*\/>/.test(out)) {
    out = out.replace(/<Footer\s*\/>/, `${jsxInsert}\n      <Footer />`);
  } else if (/<\/div>\s*;?\s*\)\s*;?\s*\}/.test(out)) {
    out = out.replace(
      /<\/div>(\s*;?\s*\)\s*;?\s*\})/,
      `${jsxInsert}\n    </div>$1`
    );
  }

  return out;
}

/**
 * When App.tsx imports boilerplate pages (Dashboard/Login/…) that were never generated,
 * but real pages exist under src/pages/, rewrite App into a simple react-router shell.
 * Returns null when no rewrite is needed.
 */
export function rewriteAppForExistingPages(
  appSource: string,
  projectPaths: string[]
): string | null {
  const pagePaths = projectPaths.filter((p) =>
    /(?:^|\/)pages\/[^/]+\.(tsx|jsx)$/i.test(p)
  );
  if (!pagePaths.length || !appSource) return null;

  const existing = new Set(
    pagePaths.map((p) => p.split("/").pop()!.replace(/\.[^.]+$/, "").toLowerCase())
  );

  const imported = [
    ...appSource.matchAll(/from\s+['"](?:@\/|\.{1,2}\/)pages\/([^'"]+)['"]/g),
  ].map((m) => m[1].replace(/\.[^.]+$/, "").split("/").pop()!);

  if (imported.length) {
    const missing = imported.filter((name) => !existing.has(name.toLowerCase()));
    if (missing.length < Math.max(1, Math.ceil(imported.length * 0.5))) {
      return null; // most imports resolve — leave App alone
    }
  } else {
    // No pages imports — only rewrite if App clearly looks like missing-auth boilerplate
    // and doesn't already render any existing page component by name.
    const mentionsExisting = [...existing].some((b) =>
      new RegExp(`\\b${b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(appSource)
    );
    if (mentionsExisting) return null;
    if (!/@\/pages\/|ProtectedRoute|AuthProvider|Dashboard/.test(appSource)) {
      return null;
    }
  }

  const pages = pagePaths.map((p) => {
    const base = p.split("/").pop()!.replace(/\.[^.]+$/, "");
    return { base, importPath: `./pages/${base}` };
  });

  const home =
    pages.find((p) => /^home$/i.test(p.base)) ||
    pages.find((p) => /^index$/i.test(p.base)) ||
    pages[0];

  const imports = pages
    .map((p) => `import ${p.base} from '${p.importPath}';`)
    .join("\n");

  const routes = pages
    .map((p) => {
      if (p.base === home.base) {
        return `        <Route path="/" element={<${p.base} />} />`;
      }
      const slug = p.base.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
      return `        <Route path="/${slug}" element={<${p.base} />} />`;
    })
    .join("\n");

  return `import React from 'react';
import { Routes, Route } from 'react-router-dom';
${imports}

function App() {
  return (
    <Routes>
${routes}
    </Routes>
  );
}

export default App;
`;
}

/**
 * Detect truncated LLM output (mid-template-literal / mid-JSX) and return a safe stub.
 * Returns null when the file looks complete enough to parse.
 */
export function stubIfTruncatedSource(
  content: string,
  basename: string
): string | null {
  if (!content || !content.trim()) return null;
  const trimmed = content.trimEnd();
  const backticks = (trimmed.match(/`/g) || []).length;
  const looksTruncated =
    backticks % 2 === 1 ||
    /[`'"{\(\[<,=]$/.test(trimmed) ||
    /className=\{`[^`]*$/.test(trimmed) ||
    (!/(\}|;|\))\s*$/.test(trimmed) && trimmed.length > 200);

  if (!looksTruncated) return null;

  const name =
    basename.replace(/\.[^.]+$/, "").replace(/[^A-Za-z0-9_$]/g, "_") || "Page";
  const safe = /^[A-Z]/.test(name) ? name : name.charAt(0).toUpperCase() + name.slice(1);
  return `import React from 'react';
const ${safe}: React.FC = () => (
  <div className="p-8 text-gray-700">
    <h2 className="text-xl font-semibold">${safe}</h2>
    <p className="mt-2 text-sm text-gray-500">Preview stub — source file was truncated during generation.</p>
  </div>
);
export default ${safe};
`;
}

/** Rewrite `from '@/…'` to relative `src/…` paths so esbuild can resolve without tsconfig. */
export function rewriteAtAliasImports(
  fileRelPath: string,
  content: string
): string {
  if (!content.includes("@/")) return content;
  const fileDir = fileRelPath.includes("/")
    ? fileRelPath.slice(0, fileRelPath.lastIndexOf("/"))
    : ".";

  const rewriteOne = (spec: string): string => {
    const targetFromRoot = `src/${spec}`;
    const fromParts = fileDir === "." ? [] : fileDir.split("/");
    const toParts = targetFromRoot.split("/");
    let i = 0;
    while (i < fromParts.length && i < toParts.length && fromParts[i] === toParts[i]) i++;
    const ups = fromParts.length - i;
    const rel = `${ups ? "../".repeat(ups) : "./"}${toParts.slice(i).join("/")}`;
    return rel || "./";
  };

  return content
    .replace(
      /from\s+['"]@\/([^'"]+)['"]/g,
      (_m, spec: string) => `from '${rewriteOne(spec)}'`
    )
    .replace(
      /import\s+['"]@\/([^'"]+)['"]/g,
      (_m, spec: string) => `import '${rewriteOne(spec)}'`
    );
}
