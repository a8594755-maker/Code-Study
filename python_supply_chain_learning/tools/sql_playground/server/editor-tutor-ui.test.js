// DOM interaction regression tests; not a substitute for real-browser layout QA.
import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { build } from "esbuild";
import Module from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { draftRevision } from "../src/tutor-protocol.js";

test("React tutor: collapse, review/apply/undo, stale guard, Markdown, free chat, retry pairing and thread selection", async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: "https://qa.example.invalid", pretendToBeVisual: true });
  global.window = dom.window; global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement; global.IS_REACT_ACT_ENVIRONMENT = true;
  global.requestAnimationFrame = (fn) => setTimeout(fn, 0);
  const React = await import("react"), { createRoot } = await import("react-dom/client");
  const cwd = fileURLToPath(new URL("..", import.meta.url));
  const bundled = await build({ entryPoints: [path.join(cwd, "src/EditorTutor.jsx")], bundle: true, write: false, platform: "node", format: "cjs",
    jsx: "automatic", external: ["react", "react/jsx-runtime"], loader: { ".css": "empty" } });
  const mod = new Module(path.join(cwd, "qa-component.cjs"));
  mod.filename = path.join(cwd, "qa-component.cjs"); mod.paths = Module._nodeModulePaths(cwd);
  mod._compile(bundled.outputFiles[0].text, mod.filename);
  const EditorTutor = mod.exports.default, fence = String.fromCharCode(96).repeat(3);
  const original = "SELECT * FROM customers_raw;", corrected = "SELECT * FROM olist.customers_raw;";
  const initial = [
    { id: "u1", role: "user", content: "幫我改", draft: original, requestId: "request-1", createdAt: new Date().toISOString() },
    { id: "a1", role: "assistant", content: "**這是修法**\n\n1. 加上 schema\n2. 再驗證\n\n" + fence + "sql\n" + corrected + "\n" + fence, createdAt: new Date().toISOString(),
      edit: { code: corrected, language: "sql", reason: "需要完整表名 `olist.customers_raw`", changes: ["加上 `olist.`"], baseRevision: draftRevision(original) } },
    { id: "u2", role: "user", content: "較早失敗的問題", draft: "SELECT 2;", requestId: "request-2", createdAt: new Date().toISOString() },
    { id: "a2", role: "assistant", content: "服務失敗", failed: true, requestId: "request-2", replyTo: "u2", createdAt: new Date().toISOString() },
    { id: "u3", role: "user", content: "另一個較新的問題", draft: "SELECT 3;", requestId: "request-3", createdAt: new Date().toISOString() },
  ];
  const requests = [], gets = [];
  const apiFetch = async (url, options = {}) => {
    if (!options.body) {
      gets.push(url);
      return Response.json(url.includes("/threads") ? { threads: [{ id: "main", title: "第一個對話" }, { id: "second", title: "第二個對話" }] }
        : { threadId: new URL(url, "https://qa.test").searchParams.get("threadId") || "main", messages: initial, memory: "摘要" });
    }
    const body = JSON.parse(options.body); requests.push(body);
    return new Response('data: ' + JSON.stringify({ type: "done", memory: "新摘要", message: {
      id: "reply-" + requests.length, role: "assistant", content: "這是回答", createdAt: new Date().toISOString() } }) + '\n\n', { headers: { "Content-Type": "text/event-stream" } });
  };
  function Harness() {
    const [draft, setDraft] = React.useState(original);
    return React.createElement("div", null,
      React.createElement("output", { id: "draft" }, draft),
      React.createElement("button", { onClick: () => setDraft(original + "\n-- 我的新修改") }, "手動變更"),
      React.createElement(EditorTutor, { apiFetch, scope: { surface: "playground", id: "free", language: "sql" },
        draft, selection: { from: 0, to: 6 }, onApplyCode: setDraft }, React.createElement("div", null, "SQL 編輯器")));
  }
  const root = createRoot(document.querySelector("#root")), act = React.act;
  const tick = () => new Promise((r) => setTimeout(r, 15));
  async function click(text) {
    const button = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === text);
    assert.ok(button, "button: " + text); assert.equal(button.disabled, false, text);
    await act(async () => { button.click(); await tick(); });
  }
  try {
    await act(async () => { root.render(React.createElement(Harness)); await tick(); });
    assert.ok(document.querySelector(".et-message strong"));
    assert.equal(document.querySelectorAll(".et-message ol li").length, 2);
    assert.equal(document.querySelector(".et-code pre code").textContent, corrected);
    assert.equal(document.querySelectorAll(".et-code .et-send").length, 0);
    assert.equal(document.querySelector('.et-settings').hidden, true, "history and context must not occupy chat height by default");
    const editorNode = document.querySelector('.et-editor');
    await click("專心對話");
    assert.ok(document.querySelector('.et-focused'));
    assert.equal(document.querySelector('.et-editor'), editorNode, "focus mode preserves editor/draft rather than unmounting it");
    assert.equal(requests.length, 0, "layout changes do not call the AI");
    await click("回到並排");
    assert.equal(document.querySelector('.et-focused'), null);
    await click("對話紀錄");
    assert.equal(document.querySelector('.et-settings').hidden, false);
    await act(async () => { document.querySelector('.et-threadbar select').dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
    assert.equal(document.querySelector('.et-settings').hidden, true);
    assert.ok(document.querySelector('.et-proposal p code'));
    assert.equal(document.querySelector('.et-proposal details pre code').textContent, corrected);
    await act(async () => { document.querySelector('[aria-label="收合 AI 家教"]').click(); });
    assert.ok(document.querySelector(".et-collapsed"));
    await act(async () => { document.querySelector('.et-closed button').click(); });
    assert.equal(document.querySelector(".et-collapsed"), null);
    await click("比較修改前後");
    assert.ok(document.querySelector(".removed").textContent.includes("customers_raw"));
    await click("確認套用 · 不執行");
    assert.equal(document.querySelector("#draft").textContent, corrected);
    assert.match(document.querySelector('.et-proposal').textContent, /編輯器已是這個版本/);
    assert.doesNotMatch(document.querySelector('.et-proposal').textContent, /已過期/);
    assert.equal(requests.length, 0);
    assert.ok(document.querySelector('.et-messages .et-notice'), "apply notice scrolls with the dialogue, not another fixed bar");
    await click("復原這次套用");
    assert.equal(document.querySelector("#draft").textContent, original);
    await click("手動變更");
    assert.match(document.querySelector(".et-proposal").textContent, /已過期/);
    assert.equal([...document.querySelectorAll("button")].some((b) => b.textContent === "確認套用 · 不執行"), false);
    await click("重試這則問題（原草稿）");
    assert.equal(requests[0].message, "較早失敗的問題");
    assert.equal(requests[0].draft, "SELECT 2;");
    const input = document.querySelector('[aria-label="SQL 家教提問"]');
    await act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set.call(input, "可以自由問一個概念嗎？");
      input.dispatchEvent(new window.Event("input", { bubbles: true })); await tick();
    });
    await act(async () => { input.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", shiftKey: true, bubbles: true })); await tick(); });
    assert.equal(requests.length, 1, "Shift+Enter must not submit");
    await act(async () => { input.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", isComposing: true, bubbles: true })); await tick(); });
    assert.equal(requests.length, 1, "IME confirmation must not submit");
    await act(async () => { input.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true })); await tick(); });
    assert.equal(requests[1].mode, "chat");
    assert.equal(requests[1].message, "可以自由問一個概念嗎？");
    assert.match(requests[1].draft, /我的新修改/);
    assert.deepEqual(requests[1].selection, { from: 0, to: 6 });
    await click("對話紀錄");
    const select = document.querySelector('[aria-label="選擇這個活動的對話"]');
    await act(async () => { select.value = "second"; select.dispatchEvent(new window.Event("change", { bubbles: true })); await tick(); });
    assert.ok(gets.some((s) => s.includes("threadId=second")));
    assert.equal(document.querySelector('.et-settings').hidden, true);
    await click("對話紀錄");
    await click("新對話");
    assert.equal(document.querySelectorAll(".et-message").length, 0);
    assert.match(document.querySelector(".et-empty").textContent, /不用先選模式/);
  } finally {
    await act(async () => root.unmount()); dom.window.close();
    delete global.window; delete global.document; delete global.HTMLElement; delete global.IS_REACT_ACT_ENVIRONMENT; delete global.requestAnimationFrame;
  }
});
