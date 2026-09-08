// Interaction regression only. Viewport geometry is verified in a real browser.
import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { build } from "esbuild";
import Module from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { integratedCatalog } from "./integrated-catalog.js";
import { integratedSummary } from "./integrated-api.js";

test("studio: drawer, independent result tab, draft retention and exiting focused chat", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "https://qa.example.invalid", pretendToBeVisual: true });
  global.window = dom.window; global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement; global.IS_REACT_ACT_ENVIRONMENT = true;
  global.requestAnimationFrame = (fn) => setTimeout(fn, 0);
  const React = await import("react"), { createRoot } = await import("react-dom/client");
  const cwd = fileURLToPath(new URL("..", import.meta.url));
  const bundle = await build({ entryPoints: [path.join(cwd, "src/IntegratedCourse.jsx")], bundle: true, write: false, platform: "node", format: "cjs", jsx: "automatic",
    external: ["react", "react/jsx-runtime"], loader: { ".css": "empty" }, plugins: [{ name: "editor-test-double", setup(builder) {
      builder.onResolve({ filter: /^@uiw\/react-codemirror$/ }, () => ({ path: "editor", namespace: "test-editor" }));
      builder.onLoad({ filter: /.*/, namespace: "test-editor" }, () => ({ contents: `import React from 'react'; export default function Editor(p) { return React.createElement('textarea', {'aria-label':p['aria-label'], value:p.value, onChange:e=>p.onChange(e.target.value)}); }`, resolveDir: cwd }));
    } }] });
  const mod = new Module(path.join(cwd, "studio-qa.cjs")); mod.filename = path.join(cwd, "studio-qa.cjs"); mod.paths = Module._nodeModulePaths(cwd); mod._compile(bundle.outputFiles[0].text, mod.filename);
  const requests = [];
  const apiFetch = async (url, options = {}) => {
    if (url === "/api/integrated") return Response.json({ ...integratedCatalog, summary: integratedSummary([]) });
    if (url.endsWith("/state")) return Response.json({ logs: [] });
    if (url.includes("/editor-tutor/")) return Response.json(url.includes("/threads") ? { threads: [] } : { threadId: "main", messages: [] });
    requests.push({ url, body: JSON.parse(options.body) });
    return Response.json({ logId: "qa-query", logSaved: true, rows: [{ table_name: "sellers_raw" }], row_count: 1, assessment: { state: "matched", message: "符合" } });
  };
  const root = createRoot(document.querySelector("#root")), act = React.act;
  const tick = () => new Promise((r) => setTimeout(r, 20));
  async function click(text) {
    const b = [...document.querySelectorAll("button")].find((el) => el.textContent === text);
    assert.ok(b, text); await act(async () => { b.click(); await tick(); });
  }
  try {
    await act(async () => { root.render(React.createElement(mod.exports.default, { apiFetch, onDataChanged() {}, tables: [] })); await tick(); });
    assert.equal(document.querySelector('.studio-rail').hidden, true);
    assert.ok(document.querySelector('.studio-activity-header .studio-tabs'), "title and tabs share one toolbar");
    assert.equal(document.querySelector('[role="tab"][aria-selected="true"]').textContent, "本題講解", "newcomer starts with explanation, not a blank exam");
    assert.ok(document.querySelector('[aria-label="通用骨架，不能執行"]'));
    assert.match(document.querySelector('.studio-name-origins').textContent, /固定語法[\s\S]*系統提供[\s\S]*公司自己/);
    await click("☰ 課程");
    assert.equal(document.querySelector('.studio-rail').hidden, false);
    assert.ok(document.querySelector('.studio-content').hasAttribute("inert"));
    await act(async () => { document.querySelector('.studio-rail-toggle').dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
    assert.equal(document.querySelector('.studio-rail').hidden, true);
    await click("寫程式");
    const draft = "SELECT table_name FROM information_schema.tables;";
    await act(async () => {
      const input = document.querySelector('[aria-label="整合課程 SQL"]');
      Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set.call(input, draft);
      input.dispatchEvent(new window.Event("input", { bubbles: true })); await tick();
    });
    await click("專心對話");
    assert.ok(document.querySelector('.et-focused'));
    await click("寫程式");
    assert.equal(document.querySelector('.et-focused'), null, "even clicking the already-selected work tab exits focused chat");
    assert.equal(document.querySelector('[aria-label="整合課程 SQL"]').value, draft);
    await click("執行並核對 →");
    assert.equal(document.querySelector('[role="tab"][aria-selected="true"]').textContent, "執行結果");
    assert.match(document.querySelector('.studio-result').textContent, /sellers_raw/);
    assert.equal(document.querySelector('[aria-label="整合課程 SQL"]'), null);
    await click("← 回到程式");
    assert.equal(document.querySelector('[aria-label="整合課程 SQL"]').value, draft);
    await click("本題講解"); await click("寫程式");
    assert.equal(document.querySelector('[aria-label="整合課程 SQL"]').value, draft);
    assert.equal(requests.length, 1, "navigation and layout must not rerun SQL or call AI");
    assert.equal(requests[0].url, "/api/workflow/studio-u1-discover/sql");
    await click("執行結果");
    await click("接著學：從目錄選出一個分組 →");
    assert.equal(document.querySelector('.studio-activity-title h1').textContent, "從目錄選出一個分組");
    await click("連第一步都不確定？從不知道表名開始 →");
    assert.equal(document.querySelector('[aria-label="整合課程 SQL"]').value, draft, "returning to prerequisites must preserve original draft");
    await click("本題講解");
    await click("展開本題示範與解說");
    assert.equal(requests.at(-1).body.kind, "unit_example", "worked examples mark assistance without requiring an attempt");
    await click("寫程式");
    assert.equal(document.querySelector('[aria-label="整合課程 SQL"]').value, draft, "revealing an example does not overwrite work");
  } finally {
    await act(async () => root.unmount()); dom.window.close();
    delete global.window; delete global.document; delete global.HTMLElement; delete global.IS_REACT_ACT_ENVIRONMENT; delete global.requestAnimationFrame;
  }
});
