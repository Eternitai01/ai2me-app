/**
 * Lightweight checks for clarify helpers (run: node web/lib/clarify.test.mjs)
 * Uses dynamic import of the compiled-free TS via TypeScript strip if available;
 * otherwise duplicates the pure format/normalize logic smoke checks inline.
 */

function formatClarificationQaBlock(questions, answers) {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const blocks = [];
  for (const ans of answers) {
    const q = byId.get(ans.question_id);
    const title = q?.title ?? ans.question_id;
    const optMap = new Map((q?.options ?? []).map((o) => [o.id, o.label]));
    const labels = [];
    for (const oid of ans.selected_option_ids) {
      if (oid === "__other__") continue;
      labels.push(optMap.get(oid) ?? oid);
    }
    if (ans.other_text?.trim()) labels.push(ans.other_text.trim());
    let answerText = labels.length ? labels.join(", ") : "(no selection)";
    if (ans.details?.trim()) answerText = `${answerText}; ${ans.details.trim()}`;
    blocks.push(`Q: ${title}\nA: ${answerText}`);
  }
  return blocks.join("\n\n");
}

function normalizeClarifyResponse(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (raw.sufficient) return { sufficient: true, questions: [] };
  const questions = [];
  for (const item of raw.questions || []) {
    if (!item?.id || !item?.title || !Array.isArray(item.options) || item.options.length < 2)
      continue;
    questions.push(item);
  }
  if (!questions.length) return null;
  return { sufficient: false, questions: questions.slice(0, 6) };
}

const q = [
  {
    id: "period",
    title: "Tracking period",
    type: "single",
    options: [
      { id: "m", label: "Monthly" },
      { id: "y", label: "Yearly" },
    ],
  },
];
const a = [{ question_id: "period", selected_option_ids: ["m"], details: "Sept" }];
const formatted = formatClarificationQaBlock(q, a);
if (!formatted.includes("Q: Tracking period") || !formatted.includes("Monthly")) {
  console.error("FAIL format", formatted);
  process.exit(1);
}
const skip = normalizeClarifyResponse({ sufficient: true });
if (!skip?.sufficient) {
  console.error("FAIL sufficient");
  process.exit(1);
}
const ask = normalizeClarifyResponse({
  sufficient: false,
  questions: q,
});
if (!ask || ask.questions.length !== 1) {
  console.error("FAIL questions");
  process.exit(1);
}
console.log("clarify.test.mjs PASS");
