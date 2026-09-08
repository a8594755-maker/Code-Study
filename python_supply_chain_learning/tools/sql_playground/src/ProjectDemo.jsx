import { useMemo, useState } from "react";
import { downloadText, fetchWithTimeout } from "./download.js";
import "./explore.css";

export default function ProjectDemo({ project, apiFetch, logs, onTry, error, onRetry }) {
  const [selectedId, setSelectedId] = useState(null);
  const [tag, setTag] = useState("");
  const [search, setSearch] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const tags = useMemo(() => [...new Set((project?.steps || []).flatMap((step) => step.tags))], [project]);
  if (!project) return <main className="pg-workspace"><p>{error || "正在開啟新人專案 Demo…"}</p>{error && <button className="pg-button" onClick={onRetry}>重試</button>}</main>;
  const filtered = project.steps.filter((step) => (!tag || step.tags.includes(tag)) && `${step.title} ${step.purpose} ${step.sql} ${step.tags.join(" ")}`.toLowerCase().includes(search.toLowerCase().trim()));
  const step = filtered.find((s) => s.id === selectedId) || filtered[0];
  const index = step ? project.steps.findIndex((s) => s.id === step.id) : -1;
  const log = step && logs.find((l) => l.validation?.mode === "project_demo" && l.validation?.demoStepId === step.id);
  const next = project.steps[index + 1];

  async function downloadReport() {
    setDownloading(true); setDownloadError("");
    try {
      const response = await fetchWithTimeout(apiFetch, "/api/project-demo/report");
      if (!response.ok) throw new Error("專案紀錄暫時無法下載，請稍後再試。");
      downloadText(await response.text(), `olist-delivery-demo_${new Date().toISOString().slice(0, 10)}.md`, "text/markdown;charset=utf-8");
    } catch (err) { setDownloadError(err.message); }
    finally { setDownloading(false); }
  }

  return <main className="demo-page">
    <header className="pg-heading"><div><span className="pg-kicker">WORKED PROJECT · 家教示範</span><h1>{project.title}</h1><p>{project.brief}</p></div><button className="pg-button" disabled={downloading} onClick={downloadReport}>{downloading ? "整理中…" : "下載專案＋我的執行紀錄"}</button></header>
    {downloadError && <p className="pg-error" role="alert">{downloadError}</p>}
    <details className="demo-brief"><summary>先讀專案範圍與使用方式</summary><p>{project.scope}</p><p>{project.boundary}</p><p>閱讀目的 → 看完整 SQL → 送到 Playground 執行 → 核對結果 → 儲存觀察。每一步都能重跑；沒有執行紀錄的部分不會填入假數字。</p></details>
    <section className="demo-filters" aria-label="搜尋示範 SQL"><label>按問題或 SQL 搜尋<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="例如 JOIN、日期、對帳" /></label><div className="pg-tags"><button aria-pressed={!tag} className={!tag ? "selected" : ""} onClick={() => setTag("")}>全部 {project.steps.length}</button>{tags.map((label) => <button key={label} aria-pressed={tag === label} className={tag === label ? "selected" : ""} onClick={() => setTag(tag === label ? "" : label)}>{label}</button>)}</div><span>{filtered.length} 個符合的查詢；標籤包含語法與分析用途。</span></section>
    <div className="demo-layout">
      <nav className="demo-steps" aria-label="示範專案步驟">{filtered.map((item) => <button key={item.id} className={step?.id === item.id ? "active" : ""} aria-current={step?.id === item.id ? "step" : undefined} onClick={() => { setSelectedId(item.id); setCopyStatus(""); }}><span>{String(project.steps.indexOf(item) + 1).padStart(2, "0")}</span><div><small>{item.stage}</small><strong>{item.title}</strong></div></button>)}</nav>
      {step ? <article className="demo-story" key={step.id}>
        <span className="pg-kicker">STEP {index + 1} / {project.steps.length} · {step.stage}</span><h2>{step.title}</h2>
        <h3>我想回答什麼？</h3><p>{step.purpose}</p>
        <h3>為什麼寫這段 SQL？</h3><p>{step.why}</p>
        <div className="demo-code-head"><strong>完整、可執行的 PostgreSQL 查詢</strong><button className="pg-text-button" onClick={async () => { try { await navigator.clipboard.writeText(step.sql); setCopyStatus("已複製"); } catch { setCopyStatus("複製失敗，請選取下方 SQL"); } }}>{copyStatus || "複製 SQL"}</button></div>
        <pre className="demo-code" tabIndex={0}><code>{step.sql}</code></pre><button className="pg-button pg-primary" onClick={() => onTry(step)}>送到 Playground，自己跑一次 →</button>
        <h3>拿到結果後，我怎麼讀？</h3><p>{step.read}</p>
        <div className="demo-verification"><h3>交付前一定做的驗證</h3><p>{step.verify}</p></div>
        <h3>我會做的下一個決定</h3><p>{step.decision}</p>
        <details className="demo-evidence"><summary>這個步驟的帳號紀錄</summary>{log ? <><p>{new Date(log.created_at).toLocaleString("zh-TW")} · {log.status === "succeeded" ? "執行成功" : log.status === "failed" ? "執行失敗" : "紀錄尚未完成"} · {log.row_count ?? "—"} 列</p><p>{log.validation?.observation || log.error_message || "這次是修改後的查詢，請依實際結果判讀。"}</p><p>我的筆記：{log.validation?.note || "未填寫"}</p></> : <p>最近 {logs.length} 筆紀錄中尚無本步驟的執行。先試跑，再依實際結果寫觀察；下載專案會查找更完整的歷史。</p>}</details>
        {next && <button className="pg-text-button demo-next" onClick={() => { setTag(""); setSearch(""); setSelectedId(next.id); setCopyStatus(""); }}>繼續看第 {index + 2} 步：{next.title} →</button>}
      </article> : <div className="pg-empty"><p>沒有符合的查詢。</p><button className="pg-button" onClick={() => { setTag(""); setSearch(""); }}>清除篩選</button></div>}
    </div>
    <section className="demo-handoff"><h2>最後怎麼交付？接下來才是工具的選擇</h2>{project.handoff.map((item) => <details key={item.title}><summary>{item.title}</summary><p>{item.text}</p></details>)}</section>
  </main>;
}
