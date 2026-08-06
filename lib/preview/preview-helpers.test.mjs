/**
 * Lightweight node tests for preview helpers (run: node --experimental-strip-types
 * or: npx tsx web/lib/preview/preview-helpers.test.mjs after compiling).
 * Uses dynamic import of the .ts module via tsx.
 */
import assert from "node:assert/strict";
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
} from "./preview-helpers.ts";

// stripLlmFormatPrefix
assert.equal(
  stripLlmFormatPrefix("html\n<!DOCTYPE html><html></html>").startsWith("<!DOCTYPE"),
  true
);
assert.equal(stripLlmFormatPrefix("css\nbody{}\n").includes("css\n"), false);
assert.match(stripLlmFormatPrefix("@tailwind base;\n\ncss\n\nbody{}"), /body\{\}/);
assert.ok(!/^\s*css\s*$/m.test(stripLlmFormatPrefix("@tailwind base;\n\ncss\n\nbody{}")));

// Vite skeleton
assert.equal(
  isViteSkeleton('<!DOCTYPE html><script type="module" src="/src/main.tsx"></script>'),
  true
);
assert.equal(
  isViteSkeleton("<!DOCTYPE html><div id='root'></div><script>window.__AppBundle={}</script>"),
  false
);

// sanitizeCss
const css = sanitizeCssForEsbuild("@tailwind base;\n@tailwind utilities;\nbody{color:red}");
assert.ok(!css.includes("@tailwind"));
assert.ok(css.includes("body{color:red}"));

// synonym resolve Features -> Benefits
const map = buildFuzzyComponentMap([
  "src/components/Benefits.tsx",
  "src/components/HowToUse.tsx",
  "src/components/CTA.tsx",
  "src/components/Hero.tsx",
]);
assert.equal(resolveFuzzyComponent("Features", map), "src/components/Benefits.tsx");
assert.equal(resolveFuzzyComponent("HowItWorks", map), "src/components/HowToUse.tsx");
assert.equal(resolveFuzzyComponent("Pricing", map), "src/components/CTA.tsx");
assert.equal(resolveFuzzyComponent("Hero", map), "src/components/Hero.tsx");

// orphan injection
const app = `import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Footer from './components/Footer';

const App = () => (
  <div>
    <Header />
    <main>
      <Hero />
    </main>
    <Footer />
  </div>
);
export default App;
`;
const patched = injectOrphanComponentsIntoApp(app, ["Ingredients", "CTA"]);
assert.ok(patched.includes("import Ingredients from './components/Ingredients'"));
assert.ok(patched.includes("import CTA from './components/CTA'"));
assert.ok(patched.includes("<Ingredients />"));
assert.ok(patched.includes("<CTA />"));

// Features import should cover Benefits via synonyms (no duplicate section)
const appWithFeatures = `import Features from './components/Features';
const App = () => (<main><Features /></main>);
export default App;
`;
const noDup = injectOrphanComponentsIntoApp(appWithFeatures, ["Benefits", "Ingredients"]);
assert.ok(!noDup.includes("import Benefits"));
assert.ok(noDup.includes("import Ingredients"));

// rewrite broken App that imports missing Dashboard/Login
const brokenApp = `import { Dashboard } from "@/pages/Dashboard";
import { Login } from "@/pages/Login";
export default function App(){ return null }
`;
const fixed = rewriteAppForExistingPages(brokenApp, [
  "src/pages/Home.tsx",
  "src/pages/Courses.tsx",
]);
assert.ok(fixed);
assert.ok(fixed.includes("import Home from './pages/Home'"));
assert.ok(fixed.includes('path="/"'));
assert.ok(fixed.includes("Courses"));

assert.equal(
  rewriteAtAliasImports("src/App.tsx", "import X from '@/pages/Home';"),
  "import X from './pages/Home';"
);

const trunc = stubIfTruncatedSource(
  'const x = `hello\nclassName={`flex items-center',
  "Contact.tsx"
);
assert.ok(trunc && trunc.includes("export default Contact"));
assert.equal(stubIfTruncatedSource("export default function Ok(){ return null }\n", "Ok.tsx"), null);

console.log("preview-helpers: all assertions passed");
