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
  if (log.status === "failed") return { className: "failed", label: "SQL 錯誤" };
  if (log.score === 100) return { className: "passed", label: "答對" };
  if (log.score !== null && log.score !== undefined) {
    return { className: "needs-work", label: "需修正" };
  }
  return { className: "succeeded", label: "執行成功" };
}

export default function History({ logs, loading, onExport }) {
  return (
    <main className="history-page">
      <section className="history-head">
        <div>
          <span className="micro-label">ACCOUNT AUDIT TRAIL</span>
          <h1>你的完整 Query Log</h1>
          <p>成功、錯誤、分數、提示程度與每一版 SQL 都綁定在你的帳號。</p>
        </div>
        <div className="export-actions">
          <button onClick={() => onExport("today", "zip")}>今天 ZIP</button>
          <button onClick={() => onExport("all", "csv")}>全部 CSV</button>
          <button className="primary-action" onClick={() => onExport("all", "zip")}>下載完整證據包</button>
        </div>
      </section>

      <section className="history-table-wrap">
        {loading ? <div className="surface-loading">正在讀取紀錄…</div> : logs.length ? (
          <table className="history-table">
            <thead>
              <tr>
                <th>時間</th>
                <th>題目</th>
                <th>Attempt</th>
                <th>狀態</th>
                <th>分數</th>
                <th>執行</th>
                <th>SQL／錯誤</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const state = resultState(log);
                return <tr key={log.id}>
                  <td>{formatTimestamp(log.created_at)}</td>
                  <td><strong>{log.question_title || log.lesson_title || "未分類查詢"}</strong><small>{log.question_id}</small></td>
                  <td>#{log.attempt_number || 1}<small>Hint {log.hint_level || 0}</small></td>
                  <td><span className={`status-badge ${state.className}`}>{state.label}</span></td>
                  <td>{log.score ?? "—"}</td>
                  <td>{log.row_count ?? "—"} rows<small>{log.duration_ms ?? "—"} ms</small></td>
                  <td>
                    <details>
                      <summary>{log.error_code || "查看 SQL"}</summary>
                      {log.error_message && <p className="history-error">{log.error_message}</p>}
                      <pre>{log.sql_text}</pre>
                    </details>
                  </td>
                </tr>;
              })}
            </tbody>
          </table>
        ) : <div className="surface-loading">執行第一個 SQL 後，完整過程會出現在這裡。</div>}
      </section>
    </main>
  );
}
