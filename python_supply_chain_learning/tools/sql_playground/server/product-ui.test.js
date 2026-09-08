import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { build } from "esbuild";
import Module from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { readFileSync } from "node:fs";
import { integratedCatalog } from "./integrated-catalog.js";
import { integratedSummary } from "./integrated-api.js";
import { buildDashboard } from "./dashboard.js";
import { courseAudit } from "./course-audit.js";

test("coverage audit counts real activities and explicitly rejects a complete 100h claim", () => {
  const audit = courseAudit(integratedCatalog);
  assert.deepEqual(audit.counts, { sql: 26, python: 6, powerbi: 3 });
  assert.match(audit.verdict, /尚未符合完整 100/);
  assert.equal(audit.criteria.length, 5);
  assert.ok(audit.criteria.every((c) => c.present && c.gap));
  const entry = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
  assert.match(entry, /import "\.\/integrated.css"/);
  assert.match(entry, /import "\.\/app-ui.css"/);
  assert.doesNotMatch(readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8"), /view === "integrated" \? "integrated-shell"/);
  assert.doesNotMatch(readFileSync(new URL("../src/styles.css", import.meta.url), "utf8"), /product-shell:not\(\.integrated-shell\)/, "legacy important rules must not darken new editors");
  assert.match(readFileSync(new URL("../src/Playground.jsx", import.meta.url), "utf8"), /theme="light"/);
});

test("four-page navigation shares a shell; Playground preserves draft/result/chat, errors remain ungraded, overview uses integrated progress", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "https://qa.example.invalid", pretendToBeVisual: true });
  global.window = dom.window; global.document = dom.window.document; global.HTMLElement = dom.window.HTMLElement;
  global.IS_REACT_ACT_ENVIRONMENT = true; global.requestAnimationFrame = (fn) => setTimeout(fn, 0);
  const previousFetch = global.fetch;
  const React = await import("react"), { createRoot } = await import("react-dom/client");
  const cwd = fileURLToPath(new URL("..", import.meta.url));
  const bundle = await build({ entryPoints: [path.join(cwd, "src/App.jsx")], bundle: true, write: false, platform: "node", format: "cjs", jsx: "automatic", external: ["react", "react/jsx-runtime"], loader: { ".css": "empty" }, plugins: [{ name: "test-boundaries", setup(b) {
    b.onResolve({ filter: /^@uiw\/react-codemirror$/ }, () => ({ path: "editor", namespace: "test-ui" }));
    b.onResolve({ filter: /useSupabaseAuth\.js$/ }, () => ({ path: "auth", namespace: "test-ui" }));
    b.onLoad({ filter: /.*/, namespace: "test-ui" }, ({ path: name }) => ({ resolveDir: cwd, contents: name === "auth" ? `const auth = { loading:false,session:{access_token:'test-only',user:{id:'qa',email:'qa@example.invalid'}},signOut(){} }; export function useSupabaseAuth(){return auth;}` : `import React from 'react'; export default function Editor(p){return React.createElement('textarea',{'aria-label':p['aria-label'],value:p.value,onChange:e=>p.onChange(e.target.value)});}` }));
  } }] });
  const mod = new Module(path.join(cwd, "product-qa.cjs")); mod.filename = path.join(cwd, "product-qa.cjs"); mod.paths = Module._nodeModulePaths(cwd); mod._compile(bundle.outputFiles[0].text, mod.filename);
  const requests = [], logs = [];
  global.fetch = async (url, options = {}) => {
    requests.push({ url, method: options.method });
    if (url === "/api/integrated") return Response.json({ ...integratedCatalog, summary: integratedSummary(logs), summaryWindow: "測試資料" });
    if (url === "/api/course") return Response.json({ chapters: [] });
    if (url.startsWith('/api/drafts/')) return Response.json(options.method === 'PUT' ? { saved: true, draft: { body: JSON.parse(options.body).body, revision: 1, updated_at: new Date().toISOString() } } : { draft: null });
    if (url === "/api/schema") return Response.json({ tables: [{ name: "sellers_raw", columns: [{ name: "seller_id", type: "text" }] }] });
    if (url === "/api/dashboard") return Response.json(buildDashboard([], logs));
    if (url.startsWith("/api/logs")) return Response.json({ logs });
    if (url.endsWith("/state")) return Response.json({ logs: [] });
    if (url.includes("/editor-tutor/")) return Response.json(url.includes("/threads") ? { threads: [] } : { threadId: "main", messages: [] });
    if (url === "/api/playground/query") {
      const sql = JSON.parse(options.body).sql;
      const fail = sql.includes("mistake");
      logs.unshift({ id: `qa-${logs.length}`, sql_text: sql, status: fail ? "failed" : "succeeded", created_at: new Date().toISOString(), score: null, row_count: fail ? null : 1, question_title: "自由查詢", error_code: fail ? "READ_ONLY_POLICY" : null, error_message: fail ? "請使用完整表名" : null, validation: { mode: "playground", tags: ["SELECT"] } });
      return Response.json(fail ? { logId: logs[0].id, logSaved: true, error: "請使用完整表名", code: "READ_ONLY_POLICY" } : { logId: logs[0].id, logSaved: true, rows: [{ seller_id: "QA-S01" }], row_count: 1, durationMs: 12, tags: ["SELECT"] }, { status: fail ? 400 : 200 });
    }
    throw new Error(`Unexpected request ${url}`);
  };
  const root = createRoot(document.querySelector("#root")), act = React.act;
  const tick = () => new Promise((r) => setTimeout(r, 25));
  const visible = (el) => !el.closest('[hidden]');
  async function click(text) { const el = [...document.querySelectorAll("button")].find((b) => visible(b) && b.textContent === text); assert.ok(el, text); await act(async () => { el.click(); await tick(); }); }
  async function fill(label, text) { const el = [...document.querySelectorAll("textarea")].find((b) => visible(b) && b.getAttribute("aria-label") === label); assert.ok(el, label); await act(async () => { Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set.call(el, text); el.dispatchEvent(new window.Event("input", { bubbles: true })); await tick(); }); }
  try {
    await act(async () => { root.render(React.createElement(mod.exports.default)); await tick(); });
    for (const name of ["學習總覽", "自由查詢", "學習紀錄", "分析師工作室"]) {
      await click(name);
      assert.equal(document.querySelectorAll('.product-topbar').length, 1);
      assert.equal(document.querySelector('nav [aria-current="page"]').textContent, name);
      assert.equal(document.querySelector('.product-shell').className, "product-shell app-shell");
    }
    await click("學習總覽");
    assert.match(document.querySelector('.overview-page').textContent, /尚未符合完整 100/);
    assert.equal(document.querySelector('.readiness-ring'), null);
    await click("開啟這個活動 →");
    assert.equal([...document.querySelectorAll('.studio-activity-title h1')].find(visible).textContent, "不知道表名，先查目錄");
    await click("自由查詢"); await fill("SQL 查詢", "SELECT seller_id FROM olist.sellers_raw LIMIT 1;");
    await fill("SQL 家教提問", "保留這個尚未送出的問題");
    await click("執行 SQL →");
    assert.match(document.querySelector('.pg-studio').textContent, /QA-S01/);
    await click("學習紀錄");
    assert.match(document.querySelector('.record-table').textContent, /執行成功/);
    assert.equal([...document.querySelectorAll('th')].some((th) => th.textContent === "分數"), false);
    await click("自由查詢");
    assert.match(document.querySelector('.pg-studio').textContent, /QA-S01/);
    assert.equal(document.querySelector('.pg-studio textarea[aria-label="SQL 家教提問"]').value, "保留這個尚未送出的問題");
    await click("← 回到程式");
    assert.match(document.querySelector('[aria-label="SQL 查詢"]').value, /olist.sellers_raw/);
    await click("專心對話"); await click("寫程式");
    assert.equal(document.querySelector('.pg-studio .et-focused'), null);
    await fill("SQL 查詢", "SELECT * FROM mistake;"); await click("執行 SQL →");
    assert.match(document.querySelector('.pg-studio [role="alert"]').textContent, /完整表名/);
    await click("學習紀錄");
    assert.match(document.querySelector('.record-table').textContent, /SQL 錯誤/);
    await click("帶入自由查詢");
    await click("執行結果 · 待修正");
    assert.match(document.querySelector('.pg-studio [role="alert"]').textContent, /完整表名/, "reopening a failed log restores the error, not just SQL");
    await click("學習總覽"); await click("自由查詢");
    assert.match(document.querySelector('.pg-studio [role="alert"]').textContent, /完整表名/, "navigation does not silently switch back to another workspace");
    assert.equal(logs.every((l) => l.score === null), true);
    assert.equal(requests.filter((r) => r.url === "/api/playground/query").length, 2);
    assert.equal(requests.some((r) => r.url.endsWith('/stream')), false, "navigation never invokes AI");
  } finally {
    await act(async () => root.unmount()); dom.window.close(); global.fetch = previousFetch;
    delete global.window; delete global.document; delete global.HTMLElement; delete global.IS_REACT_ACT_ENVIRONMENT; delete global.requestAnimationFrame;
  }
});
