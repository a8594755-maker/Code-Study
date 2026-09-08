// Revision identifier only; never used for authentication.
export function draftRevision(text = "") {
  let a = 2166136261, b = 5381;
  const value = String(text);
  for (let i = 0; i < value.length; i++) { const c = value.charCodeAt(i); a = Math.imul(a ^ c, 16777619); b = Math.imul(b, 33) ^ c; }
  return `${String(text).length}-${(a >>> 0).toString(16)}-${(b >>> 0).toString(16)}`;
}
export async function readEvents(body, onEvent) {
  const reader = body.getReader(), decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      buffer = buffer.replaceAll("\r\n", "\n");
      let boundary;
      while ((boundary = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 2);
        const data = frame.split("\n").filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trimStart()).join("\n");
        if (data && data !== "[DONE]") await onEvent(JSON.parse(data));
      }
      if (buffer.length > 200000) throw new Error("回覆片段過大，請重新載入對話。");
      if (done) break;
    }
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
// Partial JSON is display-only. Edits require a complete validated response.
export function partialAnswer(text) {
  const start = /"answer"\s*:\s*"/.exec(text);
  if (!start) return "";
  let output = "", i = start.index + start[0].length;
  while (i < text.length) {
    const c = text[i++];
    if (c === '"') break;
    if (c !== "\\") { output += c; continue; }
    if (i >= text.length) break;
    const escaped = text[i++];
    if (escaped === "u") { const hex = text.slice(i, i + 4); if (!/^[a-f\d]{4}$/i.test(hex)) break; output += String.fromCharCode(parseInt(hex, 16)); i += 4; }
    else output += ({ n: "\n", r: "\r", t: "\t", b: "\b", f: "\f" })[escaped] ?? escaped;
  }
  return output;
}
