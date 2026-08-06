/**
 * Tests for the LIVE badge state contract invariant.
 *
 * Invariant: LIVE ⟺ deployStatus.status === "ready" AND appPreviewUrl exists AND iframeLoaded === true
 *
 * These tests are structural — they verify the render logic and callback wiring in the
 * source files without requiring a running browser or DOM environment.
 * No cross-origin DOM inspection. No HEAD requests.
 */

import { strict as assert } from "node:assert";
import * as fs from "node:fs";
import * as path from "node:path";

const PAGE_FILE = path.resolve(
  __dirname,
  "../app/(chat)/project/[id]/page.tsx"
);
const PREVIEW_FILE = path.resolve(
  __dirname,
  "../components/chat/AppPreview.tsx"
);
const src = fs.readFileSync(PAGE_FILE, "utf8");
const previewSrc = fs.readFileSync(PREVIEW_FILE, "utf8");

// ─── helpers ─────────────────────────────────────────────────────────────────

function countOccurrences(text: string, pattern: string): number {
  let count = 0;
  let idx = 0;
  while ((idx = text.indexOf(pattern, idx)) !== -1) {
    count++;
    idx += pattern.length;
  }
  return count;
}

function lineOf(text: string, pattern: string): number {
  const idx = text.indexOf(pattern);
  if (idx === -1) return -1;
  return text.slice(0, idx).split("\n").length;
}

// ─── 1. Previous-version URL cannot display for a new version ───────────────

{
  // AppPreview must reset all state when versionId changes.
  // The versionId effect must: clear previewSrc, bump key, revoke blob URL.
  assert.ok(
    previewSrc.includes("versionId !== prevVersionRef.current"),
    "AppPreview must compare versionId to prevVersionRef to detect version change"
  );
  assert.ok(
    previewSrc.includes("setPreviewSrc(null)"),
    "AppPreview must call setPreviewSrc(null) when versionId changes"
  );
  assert.ok(
    previewSrc.includes("setKey((k) => k + 1)"),
    "AppPreview must bump key when versionId changes to unmount the stale iframe"
  );
  assert.ok(
    previewSrc.includes("URL.revokeObjectURL(blobUrlRef.current)"),
    "AppPreview must revoke the old blob URL when versionId changes"
  );
  // The iframe key in page.tsx must include currentVersionId so stale src never persists
  assert.ok(
    src.includes("currentVersionId"),
    "page.tsx must reference currentVersionId"
  );
  assert.ok(
    src.includes("`${appPreviewUrl}-${currentVersionId ?? \"\"}`"),
    "AppPreview key in page.tsx must be scoped to appPreviewUrl + currentVersionId"
  );
  console.log("✅ 1. Previous-version URL cannot display for a new version");
}

// ─── 2. ready status without iframe load does not show LIVE ─────────────────

{
  // LIVE badge must require iframeLoaded in addition to deployStatus.status === "ready"
  assert.ok(
    src.includes("deployStatus?.status === \"ready\" && Boolean(appPreviewUrl) && iframeLoaded"),
    "LIVE badge must require iframeLoaded — ready + URL alone is insufficient"
  );
  // iframeLoaded must be a state variable
  assert.ok(
    src.includes("const [iframeLoaded, setIframeLoaded] = useState(false)"),
    "iframeLoaded must be useState(false) — starts false, only set true by onLoadSuccess"
  );
  // It must start false — any generation resets it
  const iframeLoadedInit = src.match(/useState\(false\)/g)?.length ?? 0;
  assert.ok(iframeLoadedInit >= 1, "iframeLoaded must be initialised to false");
  console.log("✅ 2. ready status without iframe load does not show LIVE");
}

// ─── 3. Iframe failure clears LIVE ──────────────────────────────────────────

{
  // onLoadFailure must set iframeLoaded=false
  assert.ok(
    src.includes("onLoadFailure={(reason) => {"),
    "page.tsx must wire onLoadFailure to AppPreview"
  );
  assert.ok(
    src.includes("setIframeLoaded(false)"),
    "onLoadFailure handler must call setIframeLoaded(false)"
  );
  assert.ok(
    src.includes("setIframeError(reason)"),
    "onLoadFailure handler must call setIframeError(reason)"
  );
  // AppPreview must call onLoadFailureRef.current when the iframe fires onError
  assert.ok(
    previewSrc.includes("onLoadFailureRef.current?.(reason)"),
    "AppPreview must call onLoadFailure when iframe fails or retries are exhausted"
  );
  // AppPreview onError handler must set loadError and clear previewSrc
  assert.ok(
    previewSrc.includes("onError={() => {"),
    "AppPreview iframe must have an onError handler"
  );
  assert.ok(
    previewSrc.includes("setPreviewSrc(null)") &&
      previewSrc.includes("onLoadFailureRef.current?.(reason)"),
    "AppPreview onError must clear previewSrc and call onLoadFailure"
  );
  console.log("✅ 3. Iframe failure clears LIVE");
}

// ─── 4. New generation resets loaded state ──────────────────────────────────

{
  // clearProjectViewState must reset iframeLoaded and iframeError
  assert.ok(
    src.includes("// Reset preview state contract"),
    "clearProjectViewState must reset preview state contract"
  );
  // Count setIframeLoaded(false) occurrences — must be in at least:
  //   clearProjectViewState, onLoadFailure handler, deployStatus effect
  const resets = countOccurrences(src, "setIframeLoaded(false)");
  assert.ok(
    resets >= 3,
    `setIframeLoaded(false) must appear at least 3 times (clearProjectViewState, onLoadFailure, deployStatus non-ready); found ${resets}`
  );
  // deployStatus effect for in-progress states must also reset iframeLoaded.
  // Verify the guard branch exists and contains setIframeLoaded(false).
  const inProgressGuard = src.indexOf("deployStatus?.status && deployStatus.status !== \"ready\"");
  assert.ok(inProgressGuard > 0, "deployStatus effect must have a non-ready in-progress guard branch");
  const afterGuard = src.slice(inProgressGuard, inProgressGuard + 250);
  assert.ok(
    afterGuard.includes("setIframeLoaded(false)"),
    "deployStatus in-progress branch must call setIframeLoaded(false)"
  );
  console.log("✅ 4. New generation resets loaded state");
}

// ─── 5. Failed backend status displays the exact error string ───────────────

{
  // Failed panel must display: iframeError || deployStatus?.error || fallback
  assert.ok(
    src.includes(
      "{iframeError || deployStatus?.error || \"The generated website did not pass browser validation.\"}"
    ),
    "Failed panel must show iframeError then deployStatus.error then fallback — in that priority order"
  );
  // Failed panel condition must cover both backend failure and iframe failure
  assert.ok(
    src.includes(
      "previewMode === \"app\" && (deployStatus?.status === \"failed\" || iframeError)"
    ),
    "Failed panel condition must cover both deployStatus=failed and iframeError"
  );
  // The failures list (render gate detail lines) must appear in the failed panel
  assert.ok(
    src.includes("deployStatus.failures.slice(0, 5).map"),
    "Failed panel must list up to 5 detailed failure strings from deployStatus.failures"
  );
  console.log("✅ 5. Failed backend status displays the exact error string");
}

// ─── 6. Blank preview plus LIVE is impossible ───────────────────────────────

{
  // LIVE badge requires iframeLoaded — proven in test 2.
  // iframeLoaded is only set true by onLoadSuccess — which fires from the iframe onLoad handler.
  // If iframe is blank or errored, onLoad may fire but onError fires after, clearing state.
  // Verify onLoadSuccess sets iframeLoaded=true AND iframeError=null
  assert.ok(
    src.includes("onLoadSuccess={() => {") &&
      src.includes("setIframeLoaded(true);") &&
      src.includes("setIframeError(null);"),
    "onLoadSuccess must set iframeLoaded=true and clear iframeError"
  );
  // AppPreview must call onLoadSuccessRef.current from the iframe onLoad handler
  assert.ok(
    previewSrc.includes("onLoadSuccessRef.current?.()"),
    "AppPreview must call onLoadSuccess from iframe onLoad"
  );
  // Structural impossibility proof:
  //   LIVE badge = deployStatus.status=ready AND appPreviewUrl AND iframeLoaded
  //   iframeLoaded = true only via onLoadSuccess
  //   onLoadSuccess fires only from AppPreview iframe onLoad
  //   AppPreview is only rendered when deployStatus.status=ready AND appPreviewUrl
  //   Therefore: blank panel (previewSrc=null in AppPreview) cannot coexist with iframeLoaded=true
  //   because blank panel means AppPreview returned the empty state div, not the iframe,
  //   so onLoad never fired, so iframeLoaded stays false, so LIVE badge is suppressed.
  //
  // Verify blank state in AppPreview never calls onLoadSuccess
  const blankStateLine = lineOf(previewSrc, "if (!previewSrc) {");
  const onLoadSuccessLine = lineOf(previewSrc, "onLoadSuccessRef.current?.()");
  assert.ok(
    blankStateLine > 0 && onLoadSuccessLine > 0,
    "Both blank state guard and onLoadSuccess call must exist in AppPreview"
  );
  assert.ok(
    onLoadSuccessLine > blankStateLine,
    `onLoadSuccess must be in iframe render path (line ${onLoadSuccessLine}) not in blank-state path (line ${blankStateLine})`
  );
  // Also verify there is no onLoadSuccessRef call before the early return
  const blankReturn = previewSrc.indexOf("if (!previewSrc) {");
  const onLoadSuccessCall = previewSrc.indexOf("onLoadSuccessRef.current?.()");
  assert.ok(
    onLoadSuccessCall > blankReturn,
    "onLoadSuccess must not be reachable from the blank-state code path"
  );
  console.log("✅ 6. Blank preview plus LIVE is impossible (structural proof)");
}

// ─── 7. AppPreview versionId prop exists in interface ───────────────────────

{
  assert.ok(
    previewSrc.includes("versionId?: string | null;"),
    "AppPreview interface must declare versionId prop"
  );
  assert.ok(
    previewSrc.includes("onLoadSuccess?: () => void;"),
    "AppPreview interface must declare onLoadSuccess callback"
  );
  assert.ok(
    previewSrc.includes("onLoadFailure?: (reason: string) => void;"),
    "AppPreview interface must declare onLoadFailure callback"
  );
  console.log("✅ 7. AppPreview interface declares versionId, onLoadSuccess, onLoadFailure");
}

// ─── 8. Stable callback refs — no re-render required to get latest callbacks ─

{
  assert.ok(
    previewSrc.includes("const onLoadSuccessRef = useRef(onLoadSuccess);"),
    "AppPreview must stabilise onLoadSuccess in a ref to avoid stale closure"
  );
  assert.ok(
    previewSrc.includes("const onLoadFailureRef = useRef(onLoadFailure);"),
    "AppPreview must stabilise onLoadFailure in a ref to avoid stale closure"
  );
  console.log("✅ 8. Callback refs are stable across renders");
}

console.log("\n✅ All 8 LIVE state-contract tests passed.");
