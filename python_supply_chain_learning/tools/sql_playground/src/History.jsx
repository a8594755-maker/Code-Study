import { useState } from "react";
import { PageHeading } from "./ui-components.jsx";

function formatTimestamp(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function resultState(log) {
  if (log.validation?.mode === "workflow_powerbi") return { className: "needs-work", label: "外部成果待審查" };
  if (log.validation?.mode === "workflow_support") return { className: "succeeded", label: "查看教學協助" };
  if (log.status === "running") return { className: "needs-work", label: "未完成／待同步" };
  if (log.validation?.mode === "workflow_delivery") return { className: "succeeded", label: "已交付待審查" };
  if (log.status === "failed") return { className: "failed", label: log.validation?.language === "python" ? "Python 錯誤" : "SQL 錯誤" };
  if (log.validation?.assessment) return { className: log.validation.assessment.state === "matched" ? "passed" : "needs-work", label: log.validation.assessment.state === "matched" ? "結果符合 · 待解釋" : "需核對／修正" };
  if (log.score === 100) return { className: "passed", label: "答對" };
  if (log.score !== null && log.score !== undefined) {
    return { className: "needs-work", label: "需修正" };
  }
  return { className: "succeeded", label: "執行成功" };
}

export default function History({ logs, loading, exporting, onExport, onOpenLog }) {
  const [filter, setFilter] = useState("");
  const [tag, setTag] = useState("");
  const tags = [...new Set(logs.flatMap((log) => log.validation?.tags || []))];
  const visibleLogs = logs.filter((log) => (!filter || (log.validation?.mode || "lesson") === filter) && (!tag || log.validation?.tags?.includes(tag)));
  return (
    <main className="app-page records-page">
      <PageHeading title="學習紀錄" description="回看每次嘗試、錯誤與修正，再帶回原工作區繼續。">
        <button className="primary-action" disabled={exporting} onClick={() => onExport("all", "zip")}>{exporting ? "正在整理下載…" : "下載全部紀錄 ZIP"}</button>
      </PageHeading>
      <details className="record-export"><summary>其他下載與紀錄範圍</summary><p>SQL、pandas、結果／錯誤、教學協助與 AI 對話都綁定帳號。pandas 為瀏覽器回報；Power BI 是自報外部成果，待審查。ZIP 的 learning_report.json 另含帳號草稿（未執行、不是完成證據）；CSV 僅包含執行紀錄。今天 ZIP 以你的當地日期篩選；下方顯示近期活動，下載各類紀錄最多 10,000 筆。</p><div className="app-page-actions"><button className="secondary-action" disabled={exporting} onClick={() => onExport("today", "zip")}>下載今天 ZIP</button><button className="secondary-action" disabled={exporting} onClick={() => onExport("all", "csv")}>下載全部 CSV</button></div></details>

      <div className="record-filters"><label>活動類型<select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="">全部活動</option><option value="lesson">原有 SQL 補強</option><option value="playground">自由查詢</option><option value="project_demo">原有專案示範</option><option value="workflow_sql">工作室 SQL</option><option value="workflow_pandas">工作室 pandas</option><option value="workflow_powerbi">Power BI 外部實作</option><option value="workflow_support">查看教學協助</option><option value="workflow_delivery">原有任務交付</option></select></label><label>語法標籤<select value={tag} onChange={(event) => setTag(event.target.value)}><option value="">全部語法</option>{tags.map((item) => <option key={item}>{item}</option>)}</select></label>{(filter || tag) && <button className="secondary-action" onClick={() => { setFilter(""); setTag(""); }}>清除篩選</button>}<span className="app-meta">最近 {logs.length} 筆中顯示 {visibleLogs.length} 筆</span></div>

      <section className="record-table-wrap" tabIndex={0} aria-label="近期學習紀錄表格">
        {loading ? <div className="surface-loading">正在讀取紀錄…</div> : visibleLogs.length ? (
          <table className="record-table">
            <thead>
              <tr>
                <th>時間</th>
                <th>題目</th>
                <th>來源</th>
                <th>狀態</th>
                <th>執行</th>
                <th>程式與詳情</th>
              </tr>
            </thead>
            <tbody>
              {visibleLogs.map((log) => {
                const state = resultState(log);
                return <tr key={log.id}>
                  <td data-label="時間">{formatTimestamp(log.created_at)}</td>
                  <td data-label="題目"><strong>{log.question_title || log.lesson_title || "未分類查詢"}</strong><small>{log.question_id}</small></td>
                  <td data-label="來源">{log.validation?.missionId?.startsWith("studio-") ? "分析師工作室" : log.validation?.mode?.startsWith("workflow_") ? "原有工作情境" : log.validation?.mode === "project_demo" ? "專案示範" : log.validation?.mode === "playground" ? "自由查詢" : "原有 SQL 補強"}</td>
                  <td data-label="狀態"><span className={`status-badge ${state.className}`}>{state.label}</span></td>
                  <td data-label="執行">{log.row_count ?? "—"} 列<small>{log.duration_ms ?? "—"} ms</small></td>
                  <td data-label="程式與詳情">
                    <details>
                      <summary>{log.error_code || "查看程式／交付"}</summary>
                      {log.error_message && <p className="history-error">{log.error_message}</p>}
                      <pre>{log.sql_text}</pre>
                      {log.score != null && <p>原有題庫分數：{log.score}（保留歷史，不作新版能力判定）</p>}
                      {log.validation?.tags?.length > 0 && <p>{log.validation.tags.join(" · ")}</p>}
                      {log.validation?.observation && <p>{log.validation.observation}</p>}
                      {log.validation?.note && <p>觀察筆記：{log.validation.note}</p>}
                      {log.validation?.stdout && <pre>{log.validation.stdout}</pre>}
                      {log.validation?.assessment && <p>核對：{log.validation.assessment.message}</p>}
                      {log.validation?.sources && <p>資料來源：{log.validation.sources.map((s) => `${s.name} (${s.origin})`).join("、")} · {log.validation.studyMode}</p>}
                      {onOpenLog && log.validation?.mode !== "workflow_support" && <button className="secondary-action" onClick={() => onOpenLog(log)}>{log.validation?.missionId?.startsWith("studio-") ? "回到分析師工作室" : log.validation?.mode?.startsWith("workflow_") ? "回到原有工作情境" : "帶入自由查詢"}</button>}
                    </details>
                  </td>
                </tr>;
              })}
            </tbody>
          </table>
        ) : <div className="surface-loading">{logs.length ? "沒有符合篩選的紀錄。" : "執行第一個 SQL 後，完整過程會出現在這裡。"}</div>}
      </section>
    </main>
  );
}
