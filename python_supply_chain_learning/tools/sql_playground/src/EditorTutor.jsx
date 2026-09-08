import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { canApplyEdit, lineChanges, safeTutorMarkdown } from "./tutor-code.js";
import { draftRevision, readEvents } from "./tutor-protocol.js";
import "./editor-tutor.css";
import { useAccountDraft, DraftStatus } from './AccountDraft.jsx';

function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false), [error, setError] = useState("");
  return <div className="et-code"><div className="et-code-head"><span>{language || "code"} · 程式示範</span>
    <button onClick={async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setError(""); } catch { setError("複製未成功，請選取程式手動複製。"); } }}>{copied ? "已複製到剪貼簿" : "複製"}</button></div>
    <pre><code>{code}</code></pre>{error && <small role="alert">{error}</small>}</div>;
}
export function TutorText({ text }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={{
    pre({ children }) {
      const child = children;
      if (!child?.props) return <pre>{children}</pre>;
      return <CodeBlock language={child.props.className?.replace("language-", "")} code={String(child.props.children || "").replace(/\n$/, "")} />;
    },
    a({ children, href }) { return <a href={href} target="_blank" rel="noreferrer noopener">{children}</a>; },
    img({ alt }) { return <span>［圖片不自動載入：{alt || "未提供說明"}］</span>; },
  }}>{safeTutorMarkdown(text)}</ReactMarkdown>;
}

function EditProposal({ edit, draft, onApply }) {
  const [expanded, setExpanded] = useState(false);
  const ready = canApplyEdit(edit, draft), changes = ready ? lineChanges(draft, edit.code) : null;
  return <section className="et-proposal" aria-label="草稿修正提案">
    <strong>建議修改你的草稿</strong><TutorText text={edit.reason} />
    <ul>{edit.changes.map((line, i) => <li key={i}><TutorText text={line} /></li>)}</ul>
    <details><summary>查看完整修正版</summary><CodeBlock code={edit.code} language={edit.language} /></details>
    {draft === edit.code ? <p>編輯器已是這個版本；是否成功請看執行結果。</p>
      : !ready ? <p className="et-warning">草稿已變更，這份提案已過期。請用現在的草稿重新提問，不會覆蓋你後來寫的內容。</p>
      : !changes ? <p>差異比較未完成，已停用套用。請縮小修改範圍後再問。</p>
      : !changes.length ? <p>編輯器已是這個版本。</p> : <>
        <button aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "收起差異" : "比較修改前後"}</button>
        {expanded && <div className="et-patch">{changes.map((change, i) => <div className="et-change" key={i}>
          <small>原第 {change.beforeLine} 行 → 新第 {change.afterLine} 行</small>
          {change.removed.map((line, j) => <code className="removed" key={"r"+j}>− {line || "（空白行）"}</code>)}
          {change.added.map((line, j) => <code className="added" key={"a"+j}>＋ {line || "（空白行）"}</code>)}
        </div>)}<button className="et-send" onClick={() => { if (canApplyEdit(edit, draft)) onApply(edit); }}>確認套用 · 不執行</button></div>}
      </>}
  </section>;
}

function Panel({ apiFetch, scope, draft, selection, logId, sourceLogIds = [], onFullExample, onApplyCode, open, setOpen, onBusy, focused, setFocused }) {
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [threadId, setThreadId] = useState("main"), [threads, setThreads] = useState([]), [cursor, setCursor] = useState(null), [memory, setMemory] = useState("");
  const questionDraft = useAccountDraft(`chat:${scope.surface}:${scope.id}:${scope.language}:${scope.studyMode || 'practice'}:${scope.datasetName || 'main'}:${threadId}`, { question: '' });
  const question = questionDraft.body.question || '';
  const setQuestion = (question) => questionDraft.set({ question });
  const [sentRevision, setSentRevision] = useState(null), [undo, setUndo] = useState(null), [notice, setNotice] = useState("");
  const [settings, setSettings] = useState(false);
  const [streamText, setStreamText] = useState(""), [streamStatus, setStreamStatus] = useState(""), [uncertain, setUncertain] = useState(null);
  const controller = useRef(null), alive = useRef(true), viewport = useRef(null), bottom = useRef(true), composing = useRef(false);
  const query = new URLSearchParams(scope).toString();
  const latest = [...messages].reverse().find((m) => m.role === "assistant" && !m.failed);
  const language = scope.language === "python" ? "pandas" : scope.language === "powerbi" ? "Power BI" : "SQL";

  async function listThreads(signal) {
    const res = await apiFetch("/api/editor-tutor/threads?" + query, { signal });
    const data = await res.json();
    if (res.ok && alive.current) setThreads(data.threads);
  }
  async function load({ older = false, id, signal } = {}) {
    const filter = new URLSearchParams();
    if (id || older) filter.set("threadId", id || threadId);
    if (older && cursor) { filter.set("before", cursor.before); filter.set("beforeId", cursor.beforeId); }
    const res = await apiFetch("/api/editor-tutor/history?" + query + "&" + filter, { signal });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "無法載入對話");
    if (!alive.current) return;
    const previousHeight = viewport.current?.scrollHeight || 0, previousTop = viewport.current?.scrollTop || 0;
    setThreadId(data.threadId); setCursor(data.before ? { before: data.before, beforeId: data.beforeId } : null);
    if (!older) { setMemory(data.memory || ""); bottom.current = true; setUncertain(null); }
    setMessages((items) => older ? [...data.messages, ...items] : data.messages);
    requestAnimationFrame(() => { if (viewport.current) viewport.current.scrollTop = older ? previousTop + viewport.current.scrollHeight - previousHeight : viewport.current.scrollHeight; });
  }
  useEffect(() => {
    alive.current = true;
    const c = new AbortController(), timer = setTimeout(() => c.abort(), 12000);
    Promise.all([load({ signal: c.signal }), listThreads(c.signal)]).catch((e) => { if (alive.current) setError(e.name === "AbortError" ? "讀取超時，請重新載入對話。" : e.message); })
      .finally(() => { clearTimeout(timer); if (alive.current) setLoading(false); });
    return () => { alive.current = false; c.abort(); controller.current?.abort(); onBusy?.(false); };
  }, []);
  useEffect(() => {
    if (bottom.current && viewport.current) viewport.current.scrollTop = viewport.current.scrollHeight;
  }, [messages, streamText, streamStatus, open, notice, error]);
  function apply(edit) {
    if (!canApplyEdit(edit, draft)) return;
    setUndo({ before: draft, after: edit.code }); onApplyCode(edit.code);
    setNotice("修正版已套用到編輯器；套用動作不會執行查詢。結果請以實際執行紀錄為準。");
  }
  async function ask(text = question, options = {}) {
    if (controller.current || loading || !text.trim()) return;
    const retry = options.retry;
    const payload = options.payload || {
      requestId: crypto.randomUUID(), threadId, scope,
      draft: retry ? retry.draft : draft, selection: retry ? retry.selection : selection,
      logId: retry ? retry.logId : logId || null, sourceLogIds: retry ? retry.sourceLogIds : sourceLogIds,
      mode: options.mode || "chat", message: text,
    };
    const c = new AbortController(); controller.current = c;
    const timer = setTimeout(() => c.abort(), 65000);
    setBusy(true); onBusy?.(true); setError(""); setStreamText(""); setStreamStatus("正在讀取草稿…"); setUncertain(null);
    setSentRevision(draftRevision(payload.draft)); bottom.current = true;
    if (!options.payload) {
      setMessages((items) => [...items, { id: payload.requestId, requestId: payload.requestId, role: "user", content: text,
        draft: payload.draft, selection: payload.selection, logId: payload.logId, sourceLogIds: payload.sourceLogIds, createdAt: new Date().toISOString() }]);
      setQuestion("");
    }
    let completed = false;
    try {
      if (options.mode === "example") await onFullExample?.();
      const res = await apiFetch("/api/editor-tutor/stream", { method: "POST", headers: { "Content-Type": "application/json" }, signal: c.signal, body: JSON.stringify(payload) });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "家教連線未完成"); }
      if (!res.headers.get("content-type")?.includes("text/event-stream")) throw new Error("這個版本沒有串流服務，請重新整理預覽網站。");
      await readEvents(res.body, (event) => {
        if (!alive.current) return;
        if (event.type === "answer") { setStreamText(event.text); setStreamStatus(""); }
        if (event.type === "status") setStreamStatus(event.text);
        if (event.type === "error") throw new Error(event.error || "回覆未完成");
        if (event.type === "done") {
          completed = true;
          setMessages((items) => [...items.filter((m) => m.id !== event.message.id), event.message]);
          if (event.memory) setMemory(event.memory);
          setStreamText(""); setStreamStatus("");
        }
      });
      if (!completed) throw new Error("串流中斷，回覆可能仍在保存。");
      if (alive.current) listThreads().catch(() => {});
    } catch (e) {
      if (alive.current) {
        setError(e.name === "AbortError" ? "已停止等待；伺服器可能仍在保存。重新載入可確認，不會自動再次扣用量。" : e.message);
        setUncertain(payload);
      }
    } finally {
      clearTimeout(timer); controller.current = null;
      if (alive.current) { setBusy(false); onBusy?.(false); setStreamText(""); setStreamStatus(""); }
    }
  }
  async function reload(id = threadId) {
    setLoading(true); setError("");
    if (id !== threadId) { setSentRevision(null); }
    try { await load({ id }); await listThreads(); } catch (e) { setError(e.message); } finally { if (alive.current) setLoading(false); }
  }
  if (!open) return <aside className="editor-tutor et-closed" aria-label="家教已收合"><button aria-expanded="false" onClick={() => setOpen(true)} title="開啟 AI 家教">AI<span>開啟家教</span></button></aside>;
  return <aside className="editor-tutor" aria-label={language + " 編輯器家教"}>
    <header><h3>AI 家教</h3><div className="et-header-actions"><button aria-expanded={settings} onClick={() => setSettings(!settings)}>對話紀錄</button><button className="et-focus-button" aria-pressed={focused} onClick={() => setFocused(!focused)}>{focused ? "回到並排" : "專心對話"}</button><button className="et-collapse-button" aria-expanded="true" onClick={() => { setFocused(false); setOpen(false); }} aria-label="收合 AI 家教">›</button></div></header>
    <div className="et-settings" hidden={!settings} onKeyDown={(e) => { if (e.key === "Escape") setSettings(false); }}>
    <div className="et-threadbar">
      <select aria-label="選擇這個活動的對話" disabled={busy || loading} value={threadId} onChange={(e) => { reload(e.target.value); setSettings(false); }}>
        {!threads.some((t) => t.id === threadId) && <option value={threadId}>目前對話</option>}
        {threads.map((t) => <option value={t.id} key={t.id}>{t.title}</option>)}
      </select>
      <button disabled={busy || loading} onClick={() => { setThreadId(crypto.randomUUID()); setMessages([]); setMemory(""); setCursor(null); setError(""); setUncertain(null); setSentRevision(null); setSettings(false); }}>新對話</button>
    </div>
    <details className="et-context"><summary>{selection?.to > selection?.from ? "已選取程式段落" : "目前草稿"}{logId ? " ＋ 最後執行紀錄" : " · 尚無執行紀錄"}<span>送出時同步</span></summary>
      <p>送出時讀取這個活動的草稿、選取段落、欄位與指定執行錯誤。家教可在本次快照補查，不會自動執行、評分或背景監看。</p>
      <p>問題、程式及少量結果送到 OpenAI，並存入你的帳號，可從學習紀錄匯出；金鑰不會作為教學內容。{scope.language === "powerbi" ? "看不到外部 Power BI 報表。" : "pandas 樣本與真實查詢會分開標記。"}</p>
      {latest?.context && <small>本次 {Math.ceil(latest.context.inputBytes / 1024)} / 24 KB · {latest.context.recentMessages} 則近期訊息{latest.context.trimmed ? " · 已縮減，欄位可補查" : ""}{latest.context.draftTruncated ? " · 草稿節錄，不能整稿套用" : ""}</small>}
      {memory && <details><summary>學習摘要（可能有遺漏）</summary><p>{memory}</p></details>}
    </details>
    <div className="et-settings-actions"><button disabled={busy || loading} onClick={() => reload()}>重新載入</button><button onClick={() => setSettings(false)}>關閉設定</button></div>
    </div>
    <div ref={viewport} className="et-messages" role="log" aria-label={language + " 家教對話"} onScroll={() => { const v = viewport.current; bottom.current = v.scrollHeight - v.scrollTop - v.clientHeight < 60; }}>
      {cursor && <button disabled={busy || loading} onClick={() => load({ older: true }).catch((e) => setError(e.message))}>載入更早的對話</button>}
      {loading && <p>正在讀取對話…</p>}
      {!loading && !messages.length && <div className="et-empty"><h3>想從哪裡開始？</h3><p>直接問就好。不用先選模式，也不用先答對。</p>
        <button onClick={() => ask("我第一次接觸這個任務，請先用白話解釋我現在要做什麼。")}>帶我理解這個任務</button>
        <button onClick={() => ask("請解釋我選取的段落；如果沒有選取，就解釋目前草稿。")}>解釋我正在寫的程式</button>
      </div>}
      {messages.map((m) => <article key={m.id} className={"et-message " + m.role + (m.failed ? " failed" : "")}>
        <small>{m.role === "user" ? "你" : m.failed ? "連線狀態" : "AI 家教"} · {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
        <TutorText text={m.content} />
        {m.role === "assistant" && !m.failed && m.edit && onApplyCode && <EditProposal edit={m.edit} draft={draft} onApply={apply} />}
        {m.editWarning && <p className="et-warning">{m.editWarning}</p>}
        {m.toolTrace?.length > 0 && <details className="et-tooltrace"><summary>本次補查 {m.toolTrace.length} 次</summary>{m.toolTrace.map((t, i) => <p key={i}>{t.kind === "schema" ? "欄位：" + t.table : t.kind === "draft" ? "草稿片段" : "最後執行紀錄"} · 僅本次快照，未執行程式</p>)}</details>}
        {m.failed && <button disabled={busy || loading} onClick={() => {
          const user = messages.find((u) => u.id === m.replyTo || (u.role === "user" && u.requestId === m.requestId));
          if (user) ask(user.content, { retry: user }); else setError("無法確認這則失敗訊息原本的問題，請重新輸入，避免重試錯題。");
        }}>重試這則問題（原草稿）</button>}
      </article>)}
      {streamText && <article className="et-message assistant et-stream"><small>AI 家教 · 回覆中</small><TutorText text={streamText} /></article>}
      {busy && streamStatus && <p className="et-stream-status" role="status">{streamStatus}</p>}
      {!busy && latest?.followUps?.length > 0 && <details className="et-followups"><summary>延伸問問</summary>{latest.followUps.map((q) => <button key={q} onClick={() => setQuestion(q)}>{q}</button>)}</details>}
    {notice && <div className="et-notice" role="status">{notice}{undo && <button disabled={busy || draft !== undo.after} onClick={() => {
      if (draft !== undo.after) return; onApplyCode(undo.before); setUndo(null); setNotice("已復原套用前的草稿。");
    }}>復原這次套用</button>}{undo && draft !== undo.after && <small>你已繼續修改，停用復原以保護新內容。</small>}</div>}
    {error && <div className="et-error" role="alert">{error}<button disabled={busy || loading} onClick={() => reload()}>重新載入確認</button>
      {uncertain && <button disabled={busy || loading} onClick={() => ask(uncertain.message, { payload: uncertain })}>確認同一請求（不重複送出）</button>}</div>}
    </div>
    <div className="et-compose">
      <DraftStatus draft={questionDraft} compact />
      <textarea aria-label={language + " 家教提問"} disabled={loading} title="Enter 送出 · Shift + Enter 換行" value={question} maxLength={2000} placeholder="自由提問，或選一段程式問「為什麼？」" onChange={(e) => setQuestion(e.target.value)}
        onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && !composing.current && e.keyCode !== 229) { e.preventDefault(); ask(); } }} />
      <div className="et-compose-actions"><button className="et-context-trigger" onClick={() => setSettings(!settings)}>{selection?.to > selection?.from ? "選取段落" : "目前草稿"}{logId ? " + 執行紀錄" : ""}<span> · 送出時同步</span></button>
        {busy ? <button onClick={() => controller.current?.abort()}>停止等待</button> : <button className="et-send" disabled={loading || !question.trim()} onClick={() => ask()}>送出 ↑</button>}</div>
    </div>
  </aside>;
}

export default function EditorTutor({ children, onBusy, focused: controlledFocus, onFocusChange, ...props }) {
  const [open, setOpen] = useState(true), [width, setWidth] = useState(540), [localFocus, setLocalFocus] = useState(false);
  const focused = controlledFocus ?? localFocus;
  const setFocused = onFocusChange || setLocalFocus;
  const drag = useRef(null);
  return <div className={"editor-tutor-layout" + (open ? "" : " et-collapsed") + (focused ? " et-focused" : "")} style={{ "--tutor-width": width + "px" }}>
    <div className="et-editor">{children}</div>
    {open && <div role="separator" aria-label="調整家教寬度" aria-orientation="vertical" aria-valuemin={360} aria-valuemax={800} aria-valuenow={width} tabIndex={0} className="et-resizer"
      onKeyDown={(e) => { if (["ArrowLeft", "ArrowRight"].includes(e.key)) { e.preventDefault(); setWidth((w) => Math.max(360, Math.min(800, w + (e.key === "ArrowLeft" ? 20 : -20)))); } }}
      onPointerDown={(e) => { drag.current = { x: e.clientX, width }; e.currentTarget.setPointerCapture(e.pointerId); }}
      onPointerMove={(e) => { if (drag.current) setWidth(Math.max(360, Math.min(800, drag.current.width + drag.current.x - e.clientX))); }}
      onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} />}
    <Panel key={JSON.stringify(props.scope)} {...props} open={open} setOpen={setOpen} onBusy={onBusy} focused={focused} setFocused={setFocused} />
  </div>;
}
