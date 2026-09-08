import { useCallback, useEffect, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { PostgreSQL, sql as sqlLanguage } from "@codemirror/lang-sql";
import { missionFixtures, buildMissionNotebook } from "../server/workflow-notebooks.js";
import { executePandas, pythonHelp } from "./pandas-runtime.js";
import { pythonPrimer } from "../server/workflow-catalog.js";
import { downloadText, fetchWithTimeout, resultCsv } from "./download.js";
import "./explore.css";
import "./workflow.css";
import EditorTutor from "./EditorTutor.jsx";

async function jsonRequest(apiFetch, url, body, method = "POST") {
  const res = await fetchWithTimeout(apiFetch, url, body === undefined ? {} : { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.error || "操作未完成"), { data });
  return data;
}
function ResultTable({ result, label }) {
  if (!result) return null;
  const rows = result.rows || [], columns = result.columns || Object.keys(rows[0] || {});
  return <section className="wf-result" aria-label={label}>
    <div className="pg-result-heading"><h3>{label}</h3><span>{result.rowCount ?? result.row_count ?? rows.length} 列 · {columns.length} 欄</span>
      <button className="pg-button" disabled={!rows.length} onClick={() => downloadText(resultCsv(rows), `${label}.csv`, "text/csv;charset=utf-8")}>下載顯示資料 CSV</button></div>
    {result.truncated && <p className="pg-warning">結果已截斷；下載也是目前顯示範圍，不能當作完整資料。</p>}
    <div className="pg-table-wrap"><table><thead><tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr></thead><tbody>{rows.slice(0, 100).map((row, i) => <tr key={i}>{columns.map((c) => <td key={c}>{row[c] == null ? "NULL" : typeof row[c] === "object" ? JSON.stringify(row[c]) : String(row[c])}</td>)}</tr>)}</tbody></table></div>
    {!rows.length && <p>沒有資料列。請先確認條件與資料範圍。</p>}
    {rows.length > 100 && <small>表格顯示前 100 列，CSV 含本次取得的 {rows.length} 列。</small>}
  </section>;
}

function Workbench({ mission, studyMode, apiFetch, onChanged, draft, setDraft, onBusy, initialLog, sqlDrafts, setSqlDrafts }) {
  const [datasets, setDatasets] = useState(() => missionFixtures(mission));
  const [queryName, setQueryName] = useState(mission.queries[0].name);
  const sqls = { ...Object.fromEntries(mission.queries.map((q) => [q.name, q.sql])), ...sqlDrafts };
  const setSqls = (update) => setSqlDrafts(update(sqls));
  const [pythonResult, setPythonResult] = useState(null);
  const [sqlAttempts, setSqlAttempts] = useState({});
  const [lastPythonId, setLastPythonId] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [validated, setValidated] = useState(false);
  const [note, setNote] = useState("");
  const [saveState, setSaveState] = useState("");
  const [showReference, setShowReference] = useState(false);
  const stopRef = useRef(null), alive = useRef(true), running = useRef(false), pendingSave = useRef(null);
  const activeQuery = mission.queries.find((q) => q.name === queryName);
  const sql = sqls[queryName];
  const current = datasets[queryName];
  const allReal = mission.queries.every((q) => datasets[q.name]?.origin === "supabase" && !datasets[q.name]?.truncated);
  const changeBusy = (value) => { running.current = value; setBusy(value); onBusy(value); };
  useEffect(() => { alive.current = true; return () => { alive.current = false; stopRef.current?.(); onBusy(false); }; }, []);
  useEffect(() => {
    if (initialLog?.validation?.mode === "workflow_sql") setSqls((value) => ({ ...value, [initialLog.validation.datasetName]: initialLog.sql_text }));
  }, [initialLog]);
  const invalidate = () => { setPythonResult(null); setValidated(false); setSaveState(""); };

  async function runSql() {
    if (running.current) return;
    changeBusy(true); setError(""); setStatus("正在查詢 Supabase 並記錄 SQL…"); invalidate();
    try {
      const data = await jsonRequest(apiFetch, `/api/workflow/${mission.id}/sql`, { sql, datasetName: queryName, studyMode });
      if (alive.current) setSqlAttempts((v) => ({ ...v, [queryName]: data.logId }));
      if (!data.logSaved) throw new Error(data.warning || "SQL 成功但證據同步失敗；請查看 Query Log。");
      if (alive.current) {
        setDatasets((values) => ({ ...values, [queryName]: { rows: data.rows, columns: Object.keys(data.rows[0] || {}), origin: "supabase", logId: data.logId, digest: data.resultDigest, sql, observedAt: new Date().toISOString(), truncated: data.truncated, scope: sql.trim() === activeQuery.sql.trim() ? activeQuery.scope : "自行修改查詢；範圍需重新驗證。", rowCount: data.row_count } }));
        setStatus(`${queryName} 已換成這次真實 SQL 結果。其他資料集尚未自動替換。`);
      }
    } catch (e) { if (alive.current) { if (e.data?.logId) setSqlAttempts((v) => ({ ...v, [queryName]: e.data.logId })); setError(`${e.message} 原有資料未替換；請看來源標示。`); setStatus(""); } }
    finally { if (alive.current) { changeBusy(false); onChanged(); } }
  }
  async function savePython(logId, result) {
    if (alive.current) setLastPythonId(logId);
    const rows = [];
    for (const row of (result.rows || []).slice(0, 20)) {
      if (JSON.stringify([...rows, row]).length > 23000) break;
      rows.push(row);
    }
    const payload = { ...result, rows };
    pendingSave.current = { logId, result, payload };
    try {
      await jsonRequest(apiFetch, `/api/workflow/pandas/${logId}`, payload, "PATCH");
      pendingSave.current = null;
      if (alive.current) { setPythonResult({ ...result, logId, saved: true }); setSaveState("程式、輸出／錯誤已記錄到帳號（瀏覽器回報）。"); onChanged(); }
    } catch (e) { if (alive.current) { setPythonResult({ ...result, logId, saved: false }); setSaveState(`紀錄同步尚未確認：${e.message} 請保留輸出，再重試同步或檢查 Query Log。`); } }
  }
  async function runPython() {
    if (running.current || !draft.trim()) return;
    changeBusy(true); setError(""); setStatus("先建立帳號執行紀錄…"); invalidate();
    try {
      const start = await jsonRequest(apiFetch, `/api/workflow/${mission.id}/pandas/start`, { code: draft, studyMode,
        sources: Object.entries(datasets).map(([name, value]) => ({ name, origin: value.origin, logId: value.logId, digest: value.digest })) });
      if (!alive.current) { await savePython(start.logId, { status: "failed", error: "離開頁面，沒有啟動 Python。", rows: [] }); return; }
      stopRef.current = executePandas({ code: draft, datasets, onStatus: (message) => alive.current && setStatus(message),
        onResult: async (result) => {
          stopRef.current = null;
          if (alive.current) { setPythonResult(result); setStatus(result.status === "succeeded" ? "執行完成。下一步核對範圍、數字與商業意思。" : "先修正這次問題，再執行；不計零分。"); }
          await savePython(start.logId, result);
          if (alive.current) changeBusy(false);
        } });
    } catch (e) { if (alive.current) { setError(e.message); setStatus(""); changeBusy(false); } }
  }
  function notebook() {
    downloadText(JSON.stringify(buildMissionNotebook(mission, { mode: "current", datasets, code: draft || "# 尚未作答" }), null, 2), `${mission.id}_current-data.ipynb`, "application/json");
  }
  async function deliver() {
    changeBusy(true); setError("");
    try {
      const data = await jsonRequest(apiFetch, `/api/workflow/${mission.id}/delivery`, { pandasLogId: pythonResult.logId, studyMode, validated, note });
      setSaveState(data.message); onChanged();
    } catch (e) { setError(e.message); }
    finally { changeBusy(false); }
  }
  function putReference() {
    if (draft.trim() && draft !== mission.python && !window.confirm("要用示範取代這份草稿嗎？已執行的版本會保留在 Query Log。")) return;
    setDraft(mission.python); invalidate();
  }
  return <div className="wf-bench">
    <section className="wf-step">
      <span className="pg-kicker">01 · 先取得對的資料</span><h2>SQL 負責取數與縮小範圍</h2>
      <p>每份資料集分別執行，再交給 pandas。改了條件，要重新確認範圍與串接鍵。</p>
      <label>選擇查詢 <select value={queryName} disabled={busy} onChange={(e) => setQueryName(e.target.value)}>{mission.queries.map((q) => <option key={q.name} value={q.name}>{q.name} · {q.label}</option>)}</select></label>
      <p className="wf-scope">示範範圍：{activeQuery.scope}</p>
      <EditorTutor apiFetch={apiFetch} scope={{ surface: "workflow", id: mission.id, language: "sql", studyMode, datasetName: queryName }} draft={sql} logId={sqlAttempts[queryName] || current.logId} onApplyCode={(value) => setSqls((items) => ({ ...items, [queryName]: value }))}>
      <div className="pg-editor"><CodeMirror value={sql} height="240px" theme="dark" extensions={[sqlLanguage({ dialect: PostgreSQL })]} editable={!busy} aria-label="任務 SQL" onChange={(value) => setSqls((items) => ({ ...items, [queryName]: value }))} />
        <div className="pg-run-row"><span>Supabase 唯讀 · 每次執行都記錄</span><button className="pg-button pg-primary" disabled={busy || !sql.trim()} onClick={runSql}>執行這份 SQL →</button></div></div>
      <p className="wf-scope">下方來源：{current.origin === "fixture" ? "尚未執行這份 SQL，先顯示教材虛構小樣本。" : `最後一次成功的 Supabase 查詢（${current.observedAt}）。`}{current.sql && current.sql !== sql ? " 編輯器已修改但尚未重跑，下方與 pandas 仍使用上次結果。" : ""}</p>
      <ResultTable result={current} label={`${queryName} 資料預覽`} />
      </EditorTutor>
    </section>
    <section className="wf-step">
      <span className="pg-kicker">02 · 檢查、整理、分析</span><h2>把查詢結果交給 pandas</h2>
      <p>{mission.pythonIntro}</p>
      <details><summary>第一次寫 Python？先認識四個基本操作</summary>{pythonPrimer.map((item) => <div key={item.code}><pre className="wf-code">{item.code}</pre><p>{item.meaning}</p><p className="wf-help">常見錯誤：{item.mistake}</p></div>)}</details>
      <div className="wf-sources" aria-label="資料來源">{Object.entries(datasets).map(([name, data]) => <p key={name}><strong>{name} · {data.origin === "fixture" ? "教材虛構樣本" : "Supabase 真實查詢"}</strong><span>{data.rows.length} 列 · {data.scope}{data.truncated ? " · 已截斷" : ""}</span></p>)}</div>
      {!allReal && <p className="pg-warning">目前含教材樣本或截斷資料。可以練習，不可當完整公司分析；先執行上方所有 SQL 才能交付。</p>}
      <details open={showReference} onToggle={(e) => setShowReference(e.currentTarget.open)}><summary>看完整 pandas 示範與解說</summary>
        <pre className="wf-code">{mission.python}</pre><ol>{mission.why.map((text) => <li key={text}>{text}</li>)}</ol><button className="pg-button" disabled={busy} onClick={putReference}>把示範放進編輯器</button></details>
      <EditorTutor apiFetch={apiFetch} scope={{ surface: "workflow", id: mission.id, language: "python", studyMode }} draft={draft} logId={lastPythonId} sourceLogIds={Object.values(datasets).map((v) => v.logId).filter(Boolean)} onApplyCode={(value) => { setDraft(value); invalidate(); }}>
      <label className="wf-code-label" htmlFor={`python-${mission.id}`}>你的 Python／pandas</label>
      <textarea id={`python-${mission.id}`} className="wf-python" spellCheck={false} value={draft} disabled={busy} placeholder={'可以先試：result = df.head(10)\n或展開完整示範，逐段理解後執行。'} onChange={(e) => { setDraft(e.target.value); invalidate(); }} onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); runPython(); } }} />
      <div className="pg-run-row"><small>瀏覽器背景執行 · 首次需下載 Python · 程式會記錄到帳號，但不在網站伺服器執行</small><button className="pg-button pg-primary" disabled={busy || !draft.trim()} onClick={runPython}>執行 pandas →</button>{busy && stopRef.current && <button className="pg-button" onClick={() => stopRef.current?.()}>停止執行</button>}</div>
      <p role="status">{status}</p>{error && <p className="pg-error" role="alert">{error}</p>}
      {pythonResult?.status === "failed" && <div className="pg-error" role="alert"><h3>這次要修正什麼？</h3><p>{pythonHelp(pythonResult.error)}</p><button className="pg-button" onClick={() => setShowReference(true)}>展開完整示範</button><details><summary>查看原始錯誤與行號</summary><pre className="wf-code">{pythonResult.error}</pre></details></div>}
      {pythonResult?.stdout && <details open><summary>print／執行輸出</summary><pre className="wf-code">{pythonResult.stdout}</pre></details>}
      {pythonResult?.status === "succeeded" && <ResultTable result={pythonResult} label="pandas 成果" />}
      </EditorTutor>
      {saveState && <p role="status">{saveState}</p>}
      {pendingSave.current && <button className="pg-button" disabled={busy} onClick={() => savePython(pendingSave.current.logId, pendingSave.current.result)}>重試同步這次結果</button>}
      <button className="pg-button" disabled={busy} onClick={notebook}>下載目前資料＋程式 Notebook</button>
      <small className="wf-help">Notebook 可帶到 VS Code／Jupyter，內含本次資料副本與程式；下載不等於執行或完成證據。不含密碼或 API key。</small>
    </section>
    <section className="wf-step">
      <span className="pg-kicker">03 · 對帳並交付</span><h2>同事拿到後，能放心用嗎？</h2><p>{mission.deliverable}</p>
      <ul>{mission.checks.map((item) => <li key={item}>{item}</li>)}</ul><p className="wf-handoff">{mission.handoff}</p>
      <label><input type="checkbox" checked={validated} onChange={(e) => setValidated(e.target.checked)} /> 我已檢查資料範圍與上述驗證；這是我的自我確認，仍需審查。</label>
      <label className="wf-code-label">交付說明（可選，未寫就標示待補充）<textarea value={note} maxLength={4000} onChange={(e) => setNote(e.target.value)} placeholder="這份結果回答什麼問題？我核對了什麼？哪些結論還不能下？" /></label>
      <button className="pg-button" disabled={!pythonResult || busy} onClick={() => setNote(`任務：${mission.title}\n本次 pandas ${pythonResult.status === "succeeded" ? `輸出 ${pythonResult.rowCount} 列` : "執行失敗，尚未完成分析"}。\n資料來源：${Object.entries(datasets).map(([name, value]) => `${name}（${value.origin}，${value.rows.length} 列，${value.scope}）`).join("；")}\n交付用途：${mission.deliverable}\n尚需核對：${mission.checks.join("；")}\n結論與限制：待依實際結果確認。此摘要由系統整理執行資訊，沒有自動替我宣告驗證通過。`)}>幫我整理交付摘要（可再編輯）</button>
      <button className="pg-button pg-primary" disabled={busy || !allReal || !validated || pythonResult?.status !== "succeeded" || !pythonResult?.saved} onClick={deliver}>儲存交付證據 · 待審查 →</button>
      <p className="wf-help">需先用真實 SQL 資料成功執行此模式的 pandas 並同步紀錄。示範交付不等於獨立完成，原本課程成績不會被更動。</p>
    </section>
  </div>;
}

export default function Workflow({ apiFetch, onDataChanged, onLegacyDemo, initialLog }) {
  const [catalog, setCatalog] = useState(null), [error, setError] = useState("");
  const [missionId, setMissionId] = useState(initialLog?.validation?.missionId || "day1-map");
  const [studyMode, setStudyMode] = useState(initialLog?.validation?.studyMode || "reference");
  const [rail, setRail] = useState(true), [tab, setTab] = useState("brief"), [busy, setBusy] = useState(false);
  const [mode, setMode] = useState(""), [search, setSearch] = useState(""), [drafts, setDrafts] = useState({});
  const [sqlDrafts, setSqlDrafts] = useState({});
  const [downloading, setDownloading] = useState(false);
  const load = useCallback(async () => { try { const data = await jsonRequest(apiFetch, "/api/workflow"); setCatalog(data); setError(""); } catch (e) { setError(e.message); } }, [apiFetch]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!initialLog) return;
    const id = initialLog.validation?.missionId, study = initialLog.validation?.studyMode || "reference";
    if (id) { setMissionId(id); setStudyMode(study); setTab("work"); }
    if (initialLog.validation?.language === "python") setDrafts((values) => ({ ...values, [`${id}:${study}`]: initialLog.sql_text }));
  }, [initialLog]);
  const mission = catalog?.missions.find((m) => m.id === missionId) || catalog?.missions[0];
  const draftKey = `${mission?.id}:${studyMode}`;
  async function download() {
    setDownloading(true); setError("");
    try {
      const res = await fetchWithTimeout(apiFetch, "/api/workflow/package");
      if (!res.ok) throw new Error((await res.json()).error || "下載失敗");
      const url = URL.createObjectURL(await res.blob());
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = "analyst-sql-pandas_legacy-reference.zip"; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { setError(e.message); } finally { setDownloading(false); }
  }
  if (!catalog) return <main className="surface-loading"><p>{error || "正在載入工作任務包…"}</p>{error && <button onClick={load}>重試</button>}</main>;
  return <main className={`wf-page ${rail ? "" : "wf-collapsed"}`}>
    <aside className="wf-rail"><button className="pg-button" aria-expanded={rail} onClick={() => setRail(!rail)}>{rail ? "收合任務 ‹" : "任務 ›"}</button>{rail && <>
      <h2>原有工作情境</h2><p>保留參考與舊紀錄，不是完整 100 小時課程。</p>
      <label>工作模式<select value={mode} disabled={busy} onChange={(e) => setMode(e.target.value)}><option value="">全部任務</option>{catalog.modes.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select></label>
      <input aria-label="搜尋語法與任務" placeholder="找 JOIN、merge、對帳…" value={search} onChange={(e) => setSearch(e.target.value)} />
      {catalog.stages.map((stage) => {
        const missions = catalog.missions.filter((m) => m.chapterId === stage.id && (!mode || m.mode === mode) && `${m.title} ${m.tags.join(" ")}`.toLowerCase().includes(search.toLowerCase()));
        return missions.length ? <section key={stage.id}><h3>{stage.title}</h3>{missions.map((m) => <button key={m.id} disabled={busy} className={m.id === mission.id ? "wf-selected" : ""} aria-current={m.id === mission.id ? "step" : undefined} onClick={() => { setMissionId(m.id); setTab("brief"); }}><strong>{m.title}</strong><small>{catalog.modes.find((mode) => mode.id === m.mode).label}{catalog.summary.missions[m.id].submitted ? " · 已交付待審查" : ""}</small></button>)}</section> : null;
      })}
      <button className="pg-button" disabled={busy} onClick={onLegacyDemo}>原版 12 步驟 Demo</button>
    </>}</aside>
    <div className="wf-main">
      <header className="wf-heading"><div><span className="pg-kicker">SQL ＋ PANDAS · 原有情境參考</span><h1>{mission.title}</h1><p>{catalog.stages.find((s) => s.id === mission.chapterId).title}</p></div><button className="pg-button" disabled={downloading} onClick={download}>{downloading ? "整理下載中…" : "下載原有情境參考檔 ↓"}</button></header>
      {error && <p role="alert" className="pg-error">{error}</p>}
      <details className="wf-roadmap"><summary>整體路線與進度 · {catalog.summary.submitted} / 15 任務已交付待審查</summary>
        <p>這是原有 15 個情境與參考 Notebook。新版三工具課程請進入「分析師工作室」；這些檔案不代表已提供 100 小時教學。</p>
        <table><thead><tr><th>階段</th><th>能交付什麼</th></tr></thead><tbody>{catalog.stages.map((s) => <tr key={s.id}><td>{s.title}</td><td>{s.outcome}</td></tr>)}</tbody></table>
        <p>{catalog.summary.note} {catalog.summaryWindow}。</p><p>帳號累積 SQL {catalog.summary.sqlRuns} 次、pandas {catalog.summary.pandasRuns} 次；詳細成功與錯誤在 Query Log。</p>
      </details>
      <div className="wf-tabs" role="tablist" aria-label="任務學習頁"><button role="tab" aria-selected={tab === "brief"} onClick={() => setTab("brief")}>任務與學習方向</button><button role="tab" aria-selected={tab === "work"} onClick={() => setTab("work")}>動手做與交付</button></div>
      <div hidden={tab !== "brief"}>
        <section className="wf-brief"><span className="pg-kicker">你現在遇到什麼事</span><p className="wf-lead">{mission.brief}</p><h2>先問清楚，再寫程式</h2><ol>{mission.questions.map((q) => <li key={q}>{q}</li>)}</ol><h2>為什麼用這些查詢？</h2><ol>{mission.why.map((q) => <li key={q}>{q}</li>)}</ol>
          <div className="pg-tags">{mission.tags.map((tag) => <button key={tag} onClick={() => { setSearch(tag); setRail(true); }}>{tag}</button>)}</div>
          <h2>這次的交付物</h2><p>{mission.deliverable}</p><p className="wf-handoff">{mission.handoff}</p>
          <details><summary>練習活動參考</summary>{[...mission.studyPlan.core, ...mission.studyPlan.extension].map((part, i) => <p key={i}>{part.label}</p>)}</details>
          <button className="pg-button pg-primary" onClick={() => setTab("work")}>開始取數與分析 →</button>
        </section>
      </div>
      <div hidden={tab !== "work"}>
        <div className="wf-study"><label>練習方式<select value={studyMode} disabled={busy} onChange={(e) => setStudyMode(e.target.value)}><option value="reference">核心 · 跟著完整示範</option><option value="practice">延伸 · 換條件陪跑</option><option value="independent">延伸 · 獨立挑戰</option></select></label><p>{studyMode === "reference" ? "先看完整做法、逐段執行，再核對結果；不會自動填入你的 pandas 草稿。" : studyMode === "practice" ? mission.practice : mission.independent}</p></div>
        <Workbench key={draftKey} mission={mission} studyMode={studyMode} apiFetch={apiFetch} onChanged={() => { load(); onDataChanged(); }} draft={drafts[draftKey] || ""} setDraft={(value) => setDrafts((items) => ({ ...items, [draftKey]: value }))} sqlDrafts={sqlDrafts[draftKey]} setSqlDrafts={(value) => setSqlDrafts((items) => ({ ...items, [draftKey]: value }))} onBusy={setBusy} initialLog={initialLog?.validation?.missionId === mission.id ? initialLog : null} />
      </div>
    </div>
  </main>;
}
