import { diffLines } from "diff";
import { parser as pythonParser } from "@lezer/python";
import { validateReadOnlySql } from "../server/query-policy.js";
import { draftRevision } from "./tutor-protocol.js";

export function applicableTutorCode(language, declared, code) {
  const value = String(code || "").trim();
  if (!value || value.length > 50000) return null;
  try {
    if (language === "sql") validateReadOnlySql(value);
    else if (language === "python" && (!declared || ["python", "py", "pandas"].includes(declared))) {
      let invalid = false;
      pythonParser.parse(value).iterate({ enter: (node) => { if (node.type.isError) invalid = true; } });
      if (invalid || /^\s*\.\.\.\s*$/m.test(value)) return null;
    } else return null;
    return { language, code: value };
  } catch { return null; }
}
export function lineChanges(beforeText, afterText) {
  const before = String(beforeText || "").replaceAll("\r\n", "\n");
  const after = String(afterText || "").replaceAll("\r\n", "\n");
  if (before === after) return [];
  const chunks = diffLines(before, after, { maxEditLength: 10000, timeout: 200 });
  if (!chunks) return null; // No fake diff: disable apply if comparison fails.
  let oldLine = 1, newLine = 1, group = null;
  const changes = [];
  for (const chunk of chunks) {
    const lines = chunk.value.replace(/\n$/, "").split("\n");
    if (!chunk.added && !chunk.removed) { if (group) changes.push(group); group = null; oldLine += chunk.count; newLine += chunk.count; continue; }
    group ||= { beforeLine: oldLine, afterLine: newLine, removed: [], added: [] };
    group[chunk.removed ? "removed" : "added"].push(...lines);
    if (chunk.removed) oldLine += chunk.count; else newLine += chunk.count;
  }
  if (group) changes.push(group);
  return changes;
}
export function canApplyEdit(edit, draft) {
  return Boolean(edit && edit.baseRevision === draftRevision(draft) && applicableTutorCode(edit.language, edit.language, edit.code));
}

// Label malformed / unqualified / forbidden SQL examples before displaying them,
// including old history and completed code fences during streaming. Never edit code.
export function safeTutorMarkdown(text) {
  return String(text || '').replace(/```(?:sql|postgresql)\s*\n([\s\S]*?)```/gi, (block, code) =>
    applicableTutorCode('sql', 'sql', code) ? block : `> 示意／錯誤片段，不能直接在本站執行。\n\n\`\`\`text\n${code}\`\`\``);
}
