import { useEffect, useMemo, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { PostgreSQL, sql as sqlLanguage } from "@codemirror/lang-sql";
import { downloadText, fetchWithTimeout, resultCsv } from "./download.js";
import { WorkspaceToolbar, useDrawerFocus } from "./ui-components.jsx";
import EditorTutor from "./EditorTutor.jsx";
import { useAccountDraft, DraftStatus } from './AccountDraft.jsx';

function cell(value) {
  if (value === null) return <span className="pg-null">NULL</span>;
  return typeof value === "object" ? JSON.stringify(value) : String(value ?? "");
}

export default function Playground({ tables, apiFetch, draft: initialDraft, setDraft: setParentDraft, workspaceId = 'free', demoStep, initialLog, onDataChanged, onOpenDemo }) {
  const savedDraft = useAccountDraft(`playground:${workspaceId}`, initialDraft || { sql: '', note: '' });
  const draft = { sql: '', note: '', ...savedDraft.body };
  const setDraft = (value) => { savedDraft.set(value); setParentDraft?.(value); };
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(initialLog?.status === "succeeded" ? { logId: initialLog.id, logSaved: true, restored: true, rows: initialLog.result_preview || [], row_count: initialLog.row_count, durationMs: initialLog.duration_ms, tags: initialLog.validation?.tags || [], truncated: initialLog.validation?.truncated || initialLog.row_count > (initialLog.result_preview?.length || 0) } : null);
  const [error, setError] = useState(initialLog?.status === "failed" ? { logId: initialLog.id, logSaved: true, error: initialLog.error_message, code: initialLog.error_code } : null);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [rail, setRail] = useState(false);
  const drawer = useRef(null);
  useDrawerFocus(rail, drawer, () => setRail(false));
  const [pane, setPaneState] = useState("work"), [focused, setFocused] = useState(false);
  const [selection, setSelection] = useState(null), [executedDraft, setExecutedDraft] = useState(initialLog?.sql_text ?? null);
  const setPane = (value) => { setPaneState(value); setFocused(false); };
  const logId = result?.logId || error?.logId;
  const noteDraft = useAccountDraft(`playground:note:${logId || workspaceId}`, { note: initialLog?.validation?.note || '' });
  const note = noteDraft.body.note || '';
  const setNote = (note) => noteDraft.set({ note });
  const [saving, setSaving] = useState(false);
  const [noteStatus, setNoteStatus] = useState("");
  const inflight = useRef(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; inflight.current?.abort(); }; }, []);
  const schema = useMemo(() => Object.fromEntries(tables.map((table) => [`olist.${table.name}`, table.columns.map((c) => c.name)])), [tables]);
  const extensions = useMemo(() => [sqlLanguage({ dialect: PostgreSQL, schema })], [schema]);
  const filteredTables = tables.filter((table) => `${table.name} ${table.columns.map((c) => c.name).join(" ")}`.toLowerCase().includes(search.toLowerCase()));
  const rows = result?.rows || [];
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];

  async function run() {
    if (inflight.current || !draft.sql.trim()) return;
    const controller = new AbortController();
    inflight.current = controller;
    const timer = setTimeout(() => controller.abort(), 25_000);
    setExecutedDraft(draft.sql); setBusy(true); setError(null); setResult(null); setPage(0); setNoteStatus("");
    try {
      const response = await apiFetch("/api/playground/query", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ sql: draft.sql, demoStepId: demoStep?.id, note: draft.note || "" }),
      });
      const data = await response.json();
      if (!mounted.current) return;
      if (!response.ok) setError(data);
      else setResult(data);
    } catch (err) {
      if (mounted.current) setError({ error: err.name === "AbortError" ? "等待超時。查詢可能已送達，請先在 Query Log 確認；不要連續重送。" : "連線中斷。請檢查 Query Log 確認是否已執行。" });
    } finally {
      clearTimeout(timer); inflight.current = null;
      if (mounted.current) { setBusy(false); setPane("results"); onDataChanged(); }
    }
  }

  async function saveNote() {
    setSaving(true); setNoteStatus("");
    try {
      const response = await fetchWithTimeout(apiFetch, `/api/playground/logs/${encodeURIComponent(logId)}/note`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "筆記儲存失敗。");
      setNoteStatus("筆記已儲存到這次帳號紀錄。"); onDataChanged();
    } catch (err) { setNoteStatus(err.message); }
    finally { setSaving(false); }
  }

  function replaceSql(sql) {
    if (draft.sql.trim() && draft.sql !== sql && !window.confirm("要以這個查詢取代目前草稿嗎？已執行的版本仍保留在 Query Log。")) return;
    setDraft({ ...draft, sql }); setRail(false); setPane("work");
  }

  return <main className="studio pg-studio">
    {rail && <button className="studio-rail-dismiss" aria-label="關閉資料表選單" onClick={() => setRail(false)} />}
    <aside ref={drawer} hidden={!rail} id="playground-schema" className="studio-rail" role="dialog" aria-modal="true" aria-label="資料表與欄位">
      <button className="studio-rail-toggle" onClick={() => setRail(false)}>‹ 收合資料表</button>
      <h2>資料表與欄位</h2><p className="studio-progress">展開欄位，再把預覽 SQL 放進草稿。不會自動執行。</p>
      <input aria-label="搜尋資料表與欄位" placeholder="搜尋表名或欄位" value={search} onChange={(event) => setSearch(event.target.value)} />
      {filteredTables.map((table) => <details key={table.name} className="studio-schema"><summary>olist.{table.name}</summary>
        {table.columns.map((column) => <p key={column.name}><code>{column.name}</code><small>{column.type}</small></p>)}
        <button disabled={busy} onClick={() => replaceSql(`SELECT *\nFROM olist.${table.name}\nLIMIT 20;`)}>放入前 20 列的預覽 SQL</button>
      </details>)}
      {!filteredTables.length && <p>沒有符合的資料表。</p>}
      <details className="studio-schema"><summary>information_schema.tables</summary><p>table_schema · table_name · table_type</p></details>
    </aside>
    <section className="studio-content" inert={rail}>
      <div className={`studio-activity ${pane === "tutor" ? "studio-show-tutor" : ""}`}>
        <WorkspaceToolbar title={demoStep?.title || "自由查詢"} context="SQL · 不評分" pane={pane} onPane={setPane} onMenu={() => setRail(!rail)} menuOpen={rail} menuId="playground-schema" menuLabel="資料表" learnLabel="使用說明" failed={Boolean(error)} />
        <EditorTutor apiFetch={apiFetch} focused={focused} onFocusChange={setFocused} scope={{ surface: "playground", id: demoStep?.id || "free", language: "sql" }} draft={draft.sql} selection={selection} logId={logId} onApplyCode={(sql) => { setDraft({ ...draft, sql }); setPane("work"); }}>
          <div className={`studio-reading ${pane === "work" ? "studio-writing" : ""}`}>
            {pane === "learn" ? <>
              <h2>自己探索，也有家教在旁邊</h2><p>這裡沒有指定答案、不評分，也不改章節進度。每次 SQL、結果與錯誤都保存在學習紀錄。</p>
              <ol className="studio-prose-list"><li>先從「資料表」看名稱與欄位；預覽 SQL 只放進草稿，不會自動執行。</li><li>一次寫一個唯讀 SELECT 或 WITH 查詢，使用完整表名，例如 olist.sellers_raw。</li><li>按「執行 SQL」後看結果；最多回傳 500 列，抽查不是全表結論。</li><li>不懂時直接問家教；它會讀取送出時的草稿、選取範圍與這次執行紀錄。</li></ol>
              {demoStep && <><h3>這個範例的目的</h3><p>{demoStep.purpose}</p></>}
              <div className="studio-actions"><button className="studio-primary" onClick={() => setPane("work")}>開始寫 SQL →</button><button onClick={onOpenDemo}>參考原有專案示範</button></div>
            </> : pane === "work" ? <>
              <section className="studio-task"><span>SQL · 自由探索</span><p>{demoStep?.purpose || "先用少量資料觀察，再決定要問什麼問題。不必先答對才能問家教。"}</p></section>
              <CodeMirror value={draft.sql} height="100%" minHeight="200px" theme="light" className="studio-code-editor" extensions={extensions}
                editable={!busy} placeholder="在這裡寫 SQL；表名不確定可開啟「資料表」。" aria-label="SQL 查詢"
                basicSetup={{ foldGutter: false, highlightActiveLineGutter: true }}
                onChange={(sql) => setDraft({ ...draft, sql })}
                onUpdate={(update) => { if (update.selectionSet) { const s = update.state.selection.main; setSelection({ from: s.from, to: s.to }); } }}
                onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") { event.preventDefault(); run(); } }} />
              <div className="studio-run"><small>Supabase 唯讀 · ⌘ / Ctrl + Enter</small><button className="studio-primary" disabled={busy || !draft.sql.trim()} onClick={run}>{busy ? "執行中…" : "執行 SQL →"}</button></div>
              <DraftStatus draft={savedDraft} />
            </> : pane === "results" ? <>
              <div className="studio-result-heading"><h2>執行結果</h2><button onClick={() => setPane("work")}>← 回到程式</button></div>
              {executedDraft !== null && draft.sql !== executedDraft && <p className="studio-boundary">草稿已改動，這裡仍是上次執行結果；重新執行才會更新。</p>}
              {busy && <p role="status">正在執行查詢並記錄結果…</p>}
              {error && <div className="studio-error" role="alert"><strong>{error.code || "連線問題"}</strong><p>{error.error || "查詢失敗"}</p>{error.hint && <p>{error.hint}</p>}{error.logSaved === false && <p>紀錄同步未完成，請稍後檢查學習紀錄。</p>}</div>}
              {result?.warning && <p className="studio-boundary" role="alert">{result.warning}</p>}
              {result?.restored ? <p className="studio-boundary">這是原紀錄保留的 {rows.length} 列預覽，不是重新執行；下載也只包含這些列。要更新結果，請回到程式執行。</p> : result?.truncated && <p className="studio-boundary">目前與 CSV 只有前 500 列，不是全部資料。請縮小範圍或用 GROUP BY 彙總。</p>}
              {result && <><p>{result.row_count} 列 · {columns.length} 欄 · {result.durationMs} ms</p>
                <div className="studio-actions"><button disabled={!rows.length} onClick={() => downloadText(resultCsv(rows), `playground-result_${new Date().toISOString().replaceAll(":", "-")}.csv`, "text/csv;charset=utf-8")}>下載顯示結果 CSV</button></div>
                <div className="app-tags">{(result.tags || []).map((tag) => <span key={tag}>{tag}</span>)}</div>
                {rows.length ? <><div className="studio-table" tabIndex={0} role="region" aria-label="SQL 結果表格"><table><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.slice(page * 50, (page + 1) * 50).map((row, i) => <tr key={i}>{columns.map((column) => <td key={column}>{cell(row[column])}</td>)}</tr>)}</tbody></table></div>
                {rows.length > 50 && <div className="studio-actions"><button disabled={!page} onClick={() => setPage(page - 1)}>上一頁</button><span>第 {page + 1} / {Math.ceil(rows.length / 50)} 頁</span><button disabled={(page + 1) * 50 >= rows.length} onClick={() => setPage(page + 1)}>下一頁</button></div>}</> : <p>查詢成功，結果為 0 列。先確認篩選條件；零列不一定是錯誤。</p>}
              </>}
              {!result && !error && !busy && <p className="studio-result-empty">執行 SQL 後，結果與錯誤會在這裡。不知道怎麼開始？先看「使用說明」或問家教。</p>}
              {result?.observation && <section><h3>依本次結果產生的觀察</h3><p>{result.observation}</p></section>}
              {logId && <section className="pg-notes"><h3>留下這次發現（選填）</h3><p>草稿自動保存；按下方按鈕才附到這筆執行紀錄。</p><textarea aria-label="本次查詢觀察筆記" maxLength={4000} value={note} onChange={(event) => setNote(event.target.value)} /><DraftStatus draft={noteDraft} compact /><div className="studio-actions"><button onClick={saveNote} disabled={saving}>{saving ? "儲存中…" : "儲存本次筆記"}</button><span role="status">{noteStatus || (result?.logSaved || error?.logSaved ? "這次執行已記錄到帳號。" : "")}</span></div></section>}
            </> : null}
          </div>
        </EditorTutor>
      </div>
    </section>
  </main>;
}
