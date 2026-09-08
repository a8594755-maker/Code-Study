import { useCallback, useEffect, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { PostgreSQL, sql as sqlLanguage } from "@codemirror/lang-sql";
import EditorTutor from "./EditorTutor.jsx";
import { python } from "@codemirror/lang-python";
import { activityTeaching } from "./activity-teaching.js";
import { executePandas, pythonHelp } from "./pandas-runtime.js";
import { getIntegratedMission } from "../server/integrated-catalog.js";
import { onboardingStart } from "../server/sql-onboarding.js";
import { buildMissionNotebook, missionFixtures } from "../server/workflow-notebooks.js";
import { downloadText, fetchWithTimeout, resultCsv } from "./download.js";
import { WorkspaceToolbar, useDrawerFocus } from "./ui-components.jsx";
import { useAccountDraft, DraftStatus } from './AccountDraft.jsx';

const toolLabel = { sql: "SQL", python: "pandas", powerbi: "Power BI" };
const kindLabel = { guided: "陪跑練習", debug: "修錯練習", independent: "獨立驗收", practical: "外部實作" };
const recordingHelp = "SQL、執行時間與成功／錯誤會自動保存在「學習紀錄」。其他觀察或待確認事項可以直接告訴旁邊家教，對話也會保存並可匯出。";
async function request(apiFetch, url, body, method = "POST") {
  const response = await fetchWithTimeout(apiFetch, url, body === undefined ? {} : { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || "操作尚未完成"), { data });
  return data;
}
function Table({ data }) {
  if (!data) return null;
  const columns = data.columns || Object.keys(data.rows?.[0] || {});
  return <div className="studio-table" tabIndex={0} aria-label="查詢結果表格"><table><thead><tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr></thead><tbody>{(data.rows || []).map((r, i) => <tr key={i}>{columns.map((c) => <td key={c}>{r[c] === null ? <span className="studio-null">NULL</span> : typeof r[c] === "object" ? JSON.stringify(r[c]) : String(r[c] ?? "")}</td>)}</tr>)}</tbody></table>{!data.rows?.length && <p>本次沒有資料列。先檢查範圍，不代表資料不存在。</p>}</div>;
}
function Feedback({ assessment }) {
  if (!assessment) return null;
  return <div role="status" className={`studio-feedback ${assessment.state === "matched" ? "matched" : "revise"}`}><strong>{assessment.state === "matched" ? "結果核對符合" : assessment.state === "numbers_matched_pending_review" ? "數字一致 · 報表待審查" : "下一步要確認"}</strong><p>{assessment.message}</p>{assessment.sourceOrigin === "fixture" && <p>這是教材樣本，尚未取得本題真實 SQL 資料；不計入結果符合進度。</p>}{assessment.evidence?.startsWith("browser_reported") && <small>核對瀏覽器回報結果，未在伺服器執行 Python。</small>}</div>;
}
function asDataset(log) {
  return log ? { rows: log.result_preview || [], columns: Object.keys(log.result_preview?.[0] || {}), origin: "supabase", logId: log.id,
    digest: log.validation.resultDigest, sql: log.sql_text, rowCount: log.row_count,
    truncated: Boolean(log.validation.truncated) || log.row_count > log.result_preview?.length,
    scope: log.validation.scope, observedAt: log.created_at } : null;
}

function Activity({ activity, unit, apiFetch, onChanged, onBusy, draft: initialDraft, setDraft: setParentDraft, initialLog, tables, rail, onToggleRail, onStart, nextActivity, onNext }) {
  const logScope = initialLog?.validation?.missionId === activity.id ? `:log:${initialLog.id}` : '';
  const accountDraft = useAccountDraft(`studio:${activity.id}${logScope}`, { code: initialDraft ?? activity.starter ?? '', bi: {} });
  const draft = accountDraft.body.code;
  const setDraft = (code) => { accountDraft.set((current) => ({ ...current, code })); setParentDraft(code); };
  const [historicalDraft, setHistoricalDraft] = useState(null);
  useEffect(() => { if (historicalDraft) accountDraft.initialize(historicalDraft); }, [historicalDraft, accountDraft.status]);
  const [pane, setPaneState] = useState(activity.onboarding && initialDraft === undefined && !logScope ? "learn" : "work"), [chatFocused, setChatFocused] = useState(false), [loaded, setLoaded] = useState(false), [error, setError] = useState("");
  function setPane(value) { setPaneState(value); setChatFocused(false); }
  const [busy, setBusy] = useState(false), [status, setStatus] = useState(""), [answer, setAnswer] = useState(false), [demo, setDemo] = useState(false);
  const [source, setSource] = useState(null), [result, setResult] = useState(null), [lastLogId, setLastLogId] = useState(null);
  const [executedDraft, setExecutedDraft] = useState(null), [assessment, setAssessment] = useState(null), [pending, setPending] = useState(null);
  const bi = { environment: '', totalRows: '', spRows: '', artifactName: '', explanation: '', ...accountDraft.body.bi };
  const setBi = (value) => accountDraft.set((current) => ({ ...current, bi: typeof value === 'function' ? value({ environment: '', totalRows: '', spRows: '', artifactName: '', explanation: '', ...current.bi }) : value }));
  const stop = useRef(null), alive = useRef(true), lock = useRef(false);
  const [selection, setSelection] = useState(null);
  const mission = getIntegratedMission(activity.id);
  const isSql = activity.tool === "sql", isPython = activity.tool === "python", isBi = activity.tool === "powerbi";
  const datasets = source ? { main: source } : missionFixtures(mission);
  const code = draft ?? activity.starter ?? "";
  const intro = activity.onboarding;
  const begin = () => { if (lock.current) return false; lock.current = true; setBusy(true); onBusy(true); setError(""); return true; };
  const finish = () => { lock.current = false; if (alive.current) { setBusy(false); onBusy(false); } };
  const load = async () => {
    setError("");
    try {
      const data = await request(apiFetch, `/api/integrated/${activity.id}/state`);
      if (!alive.current) return;
      const sourceLog = data.logs.find((l) => l.validation.mode === "workflow_sql" && l.status === "succeeded");
      const mode = isSql ? "workflow_sql" : isPython ? "workflow_pandas" : "workflow_powerbi";
      const latest = data.logs.find((l) => l.validation.mode === mode);
      setSource(asDataset(sourceLog));
      if (latest) {
        const previousSourceId = isBi ? latest.validation.sourceLogId : latest.validation.sources?.find((s) => s.name === "main")?.logId;
        const sameSource = isSql || (previousSourceId || null) === (sourceLog?.id || null);
        setLastLogId(sameSource ? latest.id : null); setAssessment(sameSource ? latest.validation.assessment || null : null);
        if (!isBi) {
          setResult(sameSource ? { rows: latest.result_preview || [], rowCount: latest.row_count, columns: latest.validation.columns,
            status: latest.status, error: latest.error_message, stdout: latest.validation.stdout, truncated: latest.validation.resultTruncated || latest.validation.truncated } : null);
          setExecutedDraft(latest.sql_text);
          if (initialDraft === undefined) setHistoricalDraft({ code: latest.sql_text, bi: {} });
        } else if (sameSource) setHistoricalDraft({ code: '', bi: { environment: latest.validation.environment || "", totalRows: String(latest.validation.totalRows ?? ""), spRows: String(latest.validation.spRows ?? ""), artifactName: latest.validation.artifactName || "", explanation: latest.validation.explanation || "" } });
        if (!sameSource) setStatus("資料來源已更新；舊結果保留在 Query Log，請用目前快照重新執行／對帳。");
      }
      if (initialLog?.validation?.missionId === activity.id && initialLog.validation.language === activity.tool) { setHistoricalDraft({ code: initialLog.sql_text, bi: {} }); setPane("work"); }
      setLoaded(true);
    } catch (e) { if (alive.current) setError(`紀錄讀取未完成：${e.message}`); }
  };
  useEffect(() => { alive.current = true; load(); return () => { alive.current = false; stop.current?.(); onBusy(false); }; }, []);
  useEffect(() => {
    if (initialLog?.validation?.missionId === activity.id && initialLog.validation.language === activity.tool && !isBi) {
      setHistoricalDraft({ code: initialLog.sql_text, bi: {} }); setPane("work");
    }
  }, [initialLog?.id]);
  async function reveal(kind) {
    try { await request(apiFetch, `/api/integrated/${activity.id}/support`, { kind }); if (kind === "reference") setAnswer(true); else setDemo(true); onChanged(); }
    catch (e) { setError(`提示紀錄尚未同步：${e.message}`); }
  }
  function useAnswer() {
    if (code.trim() && code !== activity.reference && !window.confirm("要以示範取代目前草稿嗎？已執行版本仍保留在 Query Log。")) return;
    setDraft(activity.reference); setPane("work");
  }
  async function runSql() {
    if (!begin()) return;
    const sql = isSql ? code : activity.sourceSql;
    setStatus(isSql ? "正在執行並核對本題結果…" : "正在取得本題真實 SQL 快照…");
    try {
      const data = await request(apiFetch, `/api/workflow/${activity.id}/sql`, { sql, datasetName: "main", studyMode: activity.mode });
      if (!alive.current) return;
      if (isSql) { setLastLogId(data.logId); setExecutedDraft(sql); setResult({ ...data, rowCount: data.row_count, status: "succeeded" }); setAssessment(data.assessment); setPane("results"); }
      if (!data.logSaved) throw new Error(data.warning || "執行完成但紀錄未同步。");
      if (!isSql) {
        setLastLogId(null); setResult(null); setAssessment(null); setExecutedDraft(null);
        if (isBi) setBi((previous) => ({ ...previous, totalRows: "", spRows: "", explanation: "" }));
      }
      setSource({ rows: data.rows, columns: Object.keys(data.rows[0] || {}), origin: "supabase", logId: data.logId, digest: data.resultDigest,
        sql, observedAt: new Date().toISOString(), rowCount: data.row_count, truncated: data.truncated, scope: mission.queries[0].scope });
      setStatus(isSql ? "SQL 與核對結果已記錄到帳號。" : "已載入真實資料。接下來的 pandas／Power BI 使用這份快照。");
    } catch (e) {
      if (alive.current) {
        setError(e.message); setStatus("");
        if (isSql && e.data?.logId) { setLastLogId(e.data.logId); setExecutedDraft(sql); setResult({ status: "failed", rows: [], error: e.message }); setAssessment(null); setPane("results"); }
      }
    } finally { finish(); if (alive.current) onChanged(); }
  }
  async function savePython(logId, output, executed) {
    const payload = { ...output, rows: (output.rows || []).slice(0, 20) };
    try {
      const data = await request(apiFetch, `/api/workflow/pandas/${logId}`, payload, "PATCH");
      if (alive.current) { setPending(null); setAssessment(data.assessment); setLastLogId(logId); setExecutedDraft(executed); setResult(output); setPane("results"); setStatus("程式、輸出／錯誤與對帳結果已記錄（瀏覽器回報）。"); onChanged(); }
    } catch (e) {
      if (alive.current) { setPending({ logId, payload, executed }); setLastLogId(logId); setExecutedDraft(executed); setResult(output); setPane("results"); setError(`執行結束，但紀錄同步尚未確認：${e.message}`); }
    }
  }
  async function runPython() {
    if (!begin()) return;
    const executed = code;
    setAssessment(null); setStatus("先建立執行紀錄，再啟動瀏覽器 Python…");
    try {
      const start = await request(apiFetch, `/api/workflow/${activity.id}/pandas/start`, { code: executed, studyMode: activity.mode,
        sources: [{ name: "main", origin: source ? "supabase" : "fixture", logId: source?.logId, digest: source?.digest }] });
      if (!alive.current) { await savePython(start.logId, { status: "failed", rows: [], error: "離開活動，未啟動 Python。" }, executed); finish(); return; }
      stop.current = executePandas({ code: executed, datasets, onStatus: (s) => alive.current && setStatus(s), onResult: async (output) => {
        stop.current = null;
        await savePython(start.logId, output, executed); finish();
      } });
    } catch (e) { if (alive.current) { setError(e.message); setStatus(""); } finish(); }
  }
  async function submitBi() {
    if (!begin()) return;
    try {
      const data = await request(apiFetch, `/api/integrated/${activity.id}/powerbi`, { ...bi, totalRows: Number(bi.totalRows), spRows: Number(bi.spRows), sourceLogId: source?.logId });
      setLastLogId(data.logId); setAssessment(data.assessment); setPane("results"); setStatus("已保存外部實作紀錄；沒有上傳或審查報表檔案。"); onChanged();
    } catch (e) { setError(e.message); } finally { finish(); }
  }
  function csv(updated = false) {
    const rows = updated ? [...source.rows, { seller_id: "TRAINING-REFRESH", seller_city: "training only", seller_state: "SP" }] : source.rows;
    downloadText(resultCsv(rows), updated ? "ch1_sellers_updated_training.csv" : "ch1_sellers.csv", "text/csv;charset=utf-8");
  }
  function notebook() {
    downloadText(JSON.stringify(buildMissionNotebook(mission, { mode: "current", datasets, code }), null, 2), `${activity.id}_my-work.ipynb`, "application/json");
  }
  const sourceSection = !isSql && <section className="studio-source">
    <div className="studio-source-heading"><div><strong>{source ? "Supabase 資料快照" : isBi ? "先取得本題資料" : "目前為虛構教材樣本"}</strong><small>{source ? `${source.rowCount} 列 · ${new Date(source.observedAt).toLocaleString()}` : "尚未執行本題的真實 SQL。"}</small></div><button disabled={busy || !loaded} onClick={runSql}>{source ? "重新取得資料" : "準備本題資料"}</button></div>
    <details><summary>{source ? `${source.rowCount} 列真實快照，非全公司` : "教材樣本／真實取數方式"} · 查看來源</summary><p>真實 SQL 使用固定排序的 20 列抽查／品質調查樣本，不能推論全公司比例。{!source && isPython ? "目前也可以先用虛構小樣本練習，來源會記錄。" : ""}</p><pre>{activity.sourceSql}</pre><Table data={source || (!isBi ? datasets.main : null)} /></details>
    {source?.truncated && <p className="studio-error">快照不完整，不能作交付。請重新準備本題資料。</p>}
    {isBi && source && <div className="studio-actions"><button onClick={() => csv(false)}>原始快照 CSV ↓</button>{activity.biKind === "refresh" && <button onClick={() => csv(true)}>更新測試 CSV（含虛構列）↓</button>}</div>}
  </section>;
  return <div className={`studio-activity ${pane === "tutor" ? "studio-show-tutor" : ""}`}>
    <WorkspaceToolbar title={activity.title} context={`CH1 · ${unit.id.replace("u", "單元 ")}`} pane={pane} onPane={setPane} onMenu={onToggleRail} menuOpen={rail} menuId="studio-course-navigation" menuLabel="課程" workLabel={isBi ? "實際操作" : "寫程式"} failed={result?.status === "failed"} />
    <EditorTutor apiFetch={apiFetch} focused={chatFocused} onFocusChange={setChatFocused} scope={{ surface: "workflow", id: activity.id, language: activity.tool, studyMode: activity.mode, ...(isSql ? { datasetName: "main" } : {}) }}
      draft={isBi ? `${activity.reference}\n\n我的操作與問題：${bi.explanation}\n目前填入：總列數 ${bi.totalRows || "未填"}、SP ${bi.spRows || "未填"}；環境 ${bi.environment || "未確認"}` : code}
      selection={selection} onBusy={onBusy} logId={lastLogId} sourceLogIds={!isSql && source?.logId ? [source.logId] : []}
      onApplyCode={isBi ? undefined : (value) => { setDraft(value); setPane("work"); setStatus("家教修正版已套用到草稿，尚未執行。請先閱讀修改，再按執行核對。"); }}>
      <div className={`studio-reading ${pane === "work" && !isBi ? "studio-writing" : ""}`}>
        {!loaded && <p role="status">正在恢復這個活動的帳號紀錄…</p>}
        {error && <div className="studio-error" role="alert">{error}{!loaded && <button onClick={load}>重試讀取</button>}</div>}
        {pane !== "results" && !(pane === "learn" && intro) && <section className="studio-task"><span>{toolLabel[activity.tool]} · {kindLabel[activity.kind]}</span><p>{activity.task}</p></section>}
        {pane === "learn" ? <>
          {intro ? <section className="studio-foundations">
            <h2>{intro.title}</h2><p>{intro.purpose}</p><p>{intro.before}</p>
            {activity.id !== onboardingStart && <button onClick={onStart} disabled={busy}>連第一步都不確定？從不知道表名開始 →</button>}
            <h3>先理解寫法，再換成真實名稱</h3><p>通用骨架 · 不能直接執行。中文是要放什麼的說明，不是資料庫裡的名稱。</p><pre aria-label="通用骨架，不能執行">{intro.template}</pre>
            <h3>哪些固定？哪些要自己查？</h3><dl className="studio-name-origins">{intro.names.map(([kind, words, meaning]) => <div key={kind}><dt>{kind}<code>{words}</code></dt><dd>{meaning}</dd></div>)}</dl>
          </section> : <>
          <h2>這件事對公司有什麼用？</h2><p>{unit.situation}</p><p>{unit.purpose}</p>
          <h2>這一題需要的觀念</h2><ol className="studio-prose-list">{activityTeaching(activity).map((line) => <li key={line}>{line}</li>)}</ol>
          </>}
          <section className="studio-example"><h2>用一個完整例子理解</h2>{demo ? <><pre>{activity.reference}</pre><ul>{activity.explanation.map((n) => <li key={n}>{n}</li>)}</ul></> : <><p>這是本題對應的完整示範，不會拿其他題目的查詢代替。查看會記錄為教學協助，不扣結果正確性。</p><button onClick={() => reveal("unit_example")}>展開本題示範與解說</button></>}</section>
          {demo && <button disabled={!loaded || busy} onClick={useAnswer}>用示範取代草稿（先確認）</button>}
          {intro ? <><h3>執行後看什麼、記什麼？</h3><p>{intro.observe}</p><p>{intro.record}</p><p>{recordingHelp}</p><h3>我怎麼知道下一步？</h3><p>{intro.next}</p></> : <>
          <h2>這個單元的工具交接</h2><p>{unit.handoff}</p><p>這是整個單元的後續路線，不表示本題結果可以直接轉交；pandas／Power BI 活動會各自列出取數 SQL、欄位與驗證要求。</p>
          </>}
          {intro && <><h3>現在輪到你</h3><p>{activity.task}</p></>}
          <button className="studio-primary" onClick={() => setPane("work")}>理解後開始練習 →</button>
        </> : <>
          {pane !== "results" && <>
          {sourceSection}
          {isBi ? <>
            <h2>在 Power BI 實際操作</h2><p className="studio-boundary">這裡提供步驟、資料與家教；不會模擬 Power BI，也看不到你的外部報表。環境還沒準備好，可先做其他 SQL／pandas 活動。</p>
            <ol className="studio-prose-list">{activity.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            <h3>DAX（報表指標公式）</h3><pre>{activity.reference}</pre>
            <h2>保存你實際做的證據</h2>
            <div className="studio-bi-form"><label>實作環境<select value={bi.environment} onChange={(e) => setBi({ ...bi, environment: e.target.value })}><option value="">尚未準備好／稍後做</option><option value="desktop_windows">Power BI Desktop · Windows</option></select></label>
              <label>儲存的報表檔名（不會上傳檔案）<input value={bi.artifactName} maxLength={150} placeholder="ch1_sellers.pbix" onChange={(e) => setBi({ ...bi, artifactName: e.target.value })} /></label>
              <label>清除篩選後的 List Rows<input type="number" min="0" step="1" value={bi.totalRows} onChange={(e) => setBi({ ...bi, totalRows: e.target.value })} /></label>
              <label>只選 SP 後的 List Rows<input type="number" min="0" step="1" value={bi.spRows} onChange={(e) => setBi({ ...bi, spRows: e.target.value })} /></label>
              <label>你的對帳／更新說明（不設最低字數）<textarea value={bi.explanation} maxLength={2000} placeholder="我做了哪個操作？哪個數字對上了？哪裡還不確定？" onChange={(e) => setBi({ ...bi, explanation: e.target.value })} /></label>
            </div>
            <button className="studio-primary" disabled={busy || !loaded || !source || source.truncated || !bi.environment || !bi.artifactName.trim() || !bi.explanation.trim() || bi.totalRows === "" || bi.spRows === ""} onClick={submitBi}>保存外部實作 · 待審查</button>
          </> : <>
            {activity.kind === "debug" && <p>下方是刻意設計的錯誤草稿。可以先執行觀察，再逐步修正。</p>}
            <CodeMirror value={code} height="100%" minHeight="200px" theme="light" className="studio-code-editor"
              extensions={isSql ? [sqlLanguage({ dialect: PostgreSQL, defaultSchema: "olist", schema: { olist: Object.fromEntries(tables.map((t) => [t.name, t.columns.map((c) => c.name)])), information_schema: { tables: ["table_name", "table_schema", "table_type"], columns: ["table_name", "column_name", "data_type", "table_schema"] } } })] : [python()]}
              editable={!busy && loaded} aria-label={isSql ? "整合課程 SQL" : "整合課程 pandas"} onChange={setDraft}
              onUpdate={(update) => { if (update.selectionSet) { const s = update.state.selection.main; setSelection({ from: s.from, to: s.to }); } }}
              onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); if (loaded && code.trim()) (isSql ? runSql : runPython)(); } }} />
            <div className="studio-run"><small>{isSql ? "Supabase 唯讀" : "瀏覽器 Python · 每次全新環境"} · ⌘ / Ctrl + Enter</small><button className="studio-primary" disabled={busy || !loaded || !code.trim()} onClick={isSql ? runSql : runPython}>{busy ? "執行中…" : "執行並核對 →"}</button>{busy && stop.current && <button onClick={() => stop.current?.()}>停止執行</button>}</div>
          </>}
          </>}
          {status && <p role="status" className="studio-status">{status}</p>}
          {pane === 'work' && <DraftStatus draft={accountDraft} />}
          {pending && <button disabled={busy} onClick={() => savePython(pending.logId, pending.payload, pending.executed)}>重試同步本次結果</button>}
          {executedDraft !== null && code !== executedDraft && !isBi && pane === "results" && <p className="studio-boundary">草稿已改動，這裡仍是上次執行結果；重新執行後才會更新。</p>}
          {pane === "results" && <><div className="studio-result-heading"><h2>執行結果</h2><button onClick={() => setPane("work")}>← 回到程式</button></div><Feedback assessment={assessment} />
          {!result && !assessment && <p className="studio-result-empty">執行程式後，結果、錯誤與核對紀錄會在這裡。不需要先答對。</p>}
          {result && !isBi && <section className="studio-result">{result.status === "failed" ? <><h3>先處理這個問題</h3><p>{isPython ? pythonHelp(result.error) : "保留這次錯誤，不計零分。旁邊家教可讀取紀錄，幫你定位、修正和驗證。"}</p><pre className="studio-error">{result.error}</pre></> : <><p>{result.rowCount ?? result.rows?.length} 列{result.truncated ? " · 已截斷，不能當完整資料" : ""}</p><Table data={result} /></>}{result.stdout && <details><summary>print 輸出</summary><pre>{result.stdout}</pre></details>}</section>}</>}
          {pane !== "results" && !isBi && <details className="studio-answer"><summary>需要提示？查看完整解法與驗證</summary>{answer ? <><pre>{activity.reference}</pre><ol>{activity.explanation.map((line) => <li key={line}>{line}</li>)}</ol><button disabled={busy || !loaded} onClick={useAnswer}>用示範取代草稿（先確認）</button></> : <><p>包含完整多行程式、原因與驗證。查看不扣正確性，但會保留協助紀錄。</p><button onClick={() => reveal("reference")}>查看本題完整答案</button></>}</details>}
          {isPython && pane === "results" && <button disabled={!loaded || busy} onClick={notebook}>下載目前資料＋我的 Notebook ↓</button>}
          {pane === "results" && intro && <section className="studio-next-step"><h3>先讀懂這次結果</h3><p>{intro.observe}</p><p>{intro.record}</p>{assessment?.state === "matched" && nextActivity ? <><p>{intro.next}</p><button className="studio-primary" disabled={busy} onClick={onNext}>接著學：{nextActivity.title} →</button><small>切換只開啟下一份教材，不會替你執行或標記精熟。</small></> : <p>若結果還不符合，先回程式或問家教；課程選單仍可查看其他教材，不會自動判定你已通過。</p>}</section>}
        </>}
      </div>
    </EditorTutor>
  </div>;
}

export default function IntegratedCourse({ apiFetch, onDataChanged, onLegacy, onLegacySql, initialLog, activityRequest, tables = [] }) {
  const [catalog, setCatalog] = useState(null), [error, setError] = useState(""), [view, setView] = useState("activity");
  const [id, setId] = useState(initialLog?.validation?.missionId || onboardingStart), [rail, setRail] = useState(false), [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState({}), [search, setSearch] = useState(""), [railTab, setRailTab] = useState("course");
  const railElement = useRef(null);
  useDrawerFocus(rail, railElement, () => setRail(false));
  useEffect(() => { if (activityRequest?.id) { setId(activityRequest.id); setView("activity"); setRail(false); } }, [activityRequest]);
  const load = useCallback(async () => { try { setCatalog(await request(apiFetch, "/api/integrated")); setError(""); } catch (e) { setError(e.message); } }, [apiFetch]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (initialLog?.validation?.missionId?.startsWith("studio-")) { setId(initialLog.validation.missionId); setView("activity"); } }, [initialLog]);
  const changed = () => { load(); onDataChanged(); };
  if (!catalog) return <div className="studio-loading" role="status"><p>{error || "正在開啟分析師工作室…"}</p>{error && <button onClick={load}>重試</button>}</div>;
  const activity = catalog.activities.find((a) => a.id === id) || catalog.activities[0];
  const unit = catalog.units.find((u) => u.id === activity.unitId);
  const nextActivity = catalog.activities[catalog.activities.findIndex((a) => a.id === activity.id) + 1];
  const choose = (a) => { setId(a.id); setView("activity"); setRail(false); };
  return <main className={`studio ${rail ? "" : "studio-rail-collapsed"}`}>
    {rail && <button className="studio-rail-dismiss" aria-label="關閉課程選單" onClick={() => setRail(false)} />}
    <aside ref={railElement} id="studio-course-navigation" hidden={!rail} className="studio-rail" role="dialog" aria-modal="true" aria-label="整合課程導覽"><button className="studio-rail-toggle" aria-expanded={rail} onClick={() => setRail(false)}>‹ 收合課程</button>{rail && <>
      <div className="studio-rail-tabs"><button aria-pressed={railTab === "course"} onClick={() => setRailTab("course")}>課程</button><button aria-pressed={railTab === "schema"} onClick={() => setRailTab("schema")}>資料表</button></div>
      {railTab === "schema" ? <><h2>資料表與欄位</h2><p className="studio-progress">表名需包含 olist.，點開查看欄位。</p>{tables.map((t) => <details key={t.name} className="studio-schema"><summary>olist.{t.name}</summary>{t.columns.map((c) => <p key={c.name}><code>{c.name}</code><small>{c.type}</small></p>)}</details>)}<details className="studio-schema"><summary>information_schema.tables</summary><p>table_name · table_schema · table_type</p></details></> : <>
      <p className="studio-eyebrow">SQL · pandas · Power BI</p><h2>從第一天開始</h2>
      <button className={`studio-route-button ${view === "roadmap" ? "selected" : ""}`} disabled={busy} onClick={() => { setView("roadmap"); setRail(false); }}>整合路線與完成標準 ↗</button>
      <p className="studio-progress">CH1 結果符合 <strong>{catalog.summary.matched} / {catalog.summary.totalExecutable}</strong><br />Power BI 待審查 {catalog.summary.pendingBi} / 3</p>
      <input aria-label="搜尋整合活動" placeholder="找 NULL、CASE、pandas…" value={search} onChange={(e) => setSearch(e.target.value)} />
      {catalog.units.map((u, index) => {
        const activities = catalog.activities.filter((a) => a.unitId === u.id && `${a.title} ${a.tags.join(" ")}`.toLowerCase().includes(search.toLowerCase()));
        return activities.length ? <details className="studio-unit" key={u.id} open={u.id === unit.id || Boolean(search)}><summary><span>{String(index + 1).padStart(2, "0")}</span>{u.title}</summary>{activities.map((a) => <button disabled={busy} key={a.id} aria-current={a.id === activity.id && view === "activity" ? "step" : undefined} onClick={() => choose(a)}><span className="studio-activity-number">{toolLabel[a.tool]}</span><strong>{a.title}</strong><small>{kindLabel[a.kind]} · {catalog.summary.activities[a.id].label}</small></button>)}</details> : null;
      })}
      {search && !catalog.activities.some((a) => `${a.title} ${a.tags.join(" ")}`.toLowerCase().includes(search.toLowerCase())) && <p>沒有相符活動。試試 SQL、NULL 或 Power BI。</p>}
      {error && <p role="alert" className="studio-error">進度尚未更新：{error}<button onClick={load}>重試同步</button></p>}
      <button className="studio-legacy" disabled={busy} onClick={onLegacy}>原有工作情境與舊紀錄 →</button><button className="studio-legacy" disabled={busy} onClick={onLegacySql}>原有 SQL 補強題 →</button></>}
    </>}</aside>
    <section className="studio-content" aria-label="目前學習活動" inert={rail}>
      {view === "roadmap" ? <div className="studio-roadmap"><button onClick={() => setView("activity")}>← 回到目前活動</button><p className="studio-eyebrow">依能力驗收，不用時數代替掌握</p><h1>同一份工作，學會三種工具</h1><p className="studio-lead">{catalog.description}</p>
        <div className="studio-release-note"><strong>目前可試學：CH1，六個單元</strong><p>{catalog.activities.filter((a) => a.tool === "sql").length} 題 SQL（含 4 題零基礎探索）、6 題 pandas、3 段 Power BI 外部實作。CH2–CH5 是能力路線，尚未完成新版逐題教材；舊情境可參考，不計入新版完成量。</p></div>
        <ol className="studio-chapter-list">{catalog.chapters.map((c, i) => <li key={c.id}><span>CH{String(i + 1).padStart(2, "0")} · {c.status === "pilot" ? "可試學驗收" : "教材待擴充"}</span><h2>{c.title}</h2><p>{c.outcome}</p><p><strong>工具分工：</strong>{c.tools}</p><p><strong>完成證據：</strong>{c.evidence}</p>{c.status === "pilot" && <button className="studio-primary" onClick={() => setView("activity")}>進入 CH1 →</button>}</li>)}</ol>
        <h2>什麼才算學會？</h2><p>完整示範 → 換條件練習 → 修正錯誤 → 無提示新題 → 專案中再次使用。結果符合和能獨立解釋分開；資料更新後必須能重新執行。</p><p>{catalog.completion}</p>
        <h2>100 小時如何驗證？</h2><p>這是整合課程的設計預算，不是已上線的教材時數。先試學 CH1，記錄閱讀、動手、修錯與獨立任務的實際負荷，再修訂份量。下載、開著頁面或執行 QA 都不是你的學習時數。</p>
        <h2>Power BI 使用真實環境</h2><p>本版教學以 Windows Desktop 為準；Mac 使用者可先做 SQL／pandas，保留 Power BI 待安排環境。網站不假裝已操作或看過外部報表。數字對帳符合後，檔案與操作仍待審查。</p>
        <h2>教材依據</h2><ul>{catalog.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.label} ↗</a></li>)}</ul><small>{catalog.summaryWindow}</small>
      </div> : <Activity key={activity.id} activity={activity} unit={unit} apiFetch={apiFetch} onChanged={changed} onBusy={setBusy} draft={drafts[activity.id]} setDraft={(value) => setDrafts((d) => ({ ...d, [activity.id]: value }))} initialLog={initialLog} tables={tables} rail={rail} onToggleRail={() => setRail(!rail)} nextActivity={nextActivity} onNext={() => nextActivity && choose(nextActivity)} onStart={() => choose(catalog.activities.find((a) => a.id === onboardingStart))} />}
    </section>
  </main>;
}
