export function downloadText(text, filename, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function fetchWithTimeout(apiFetch, url, options = {}, timeoutMs = 25_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await apiFetch(url, { ...options, signal: controller.signal }); }
  catch (error) { if (error.name === "AbortError") throw new Error("等待超時，請稍後重試。"); throw error; }
  finally { clearTimeout(timer); }
}

export function resultCsv(rows) {
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const cell = (value) => {
    let text = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
    // Prevent spreadsheet formula injection without changing numeric values.
    if (typeof value === "string" && /^[\s]*[=+\-@\t\r]/.test(value)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return "\uFEFF" + [columns.map(cell).join(","), ...rows.map((row) => columns.map((key) => cell(row[key])).join(","))].join("\r\n");
}
