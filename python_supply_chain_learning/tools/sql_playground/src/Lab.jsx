import { useEffect, useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { PostgreSQL, sql as sqlLanguage } from "@codemirror/lang-sql";

function valueText(value) {
  if (value === null) return <span className="null-value">NULL</span>;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function masteryLabel(question) {
  if (question.mastery === "independent") return "獨立掌握";
  if (question.mastery === "guided") return "引導完成";
  if (question.status === "query_passed") return "待分析說明";
  if (question.mastery === "practicing") return "練習中";
  return `${question.attempts || 0} attempts`;
}

export default function Lab({
  chapters,
  questionId,
  onQuestionChange,
  tables,
  apiFetch,
  sql,
  setSql,
  onDataChanged,
}) {
  const allQuestions = useMemo(
    () => chapters.flatMap((chapter) => chapter.questions),
    [chapters],
  );
  const question = allQuestions.find((item) => item.id === questionId) || allQuestions[0];
  const [revealedHints, setRevealedHints] = useState(0);
  const [querying, setQuerying] = useState(false);
  const [result, setResult] = useState(null);
  const [queryError, setQueryError] = useState(null);
  const [reflection, setReflection] = useState("");
  const [reflectionError, setReflectionError] = useState(null);
  const [savingReflection, setSavingReflection] = useState(false);
  const [solution, setSolution] = useState(null);
  const [solutionError, setSolutionError] = useState(null);
  const [loadingSolution, setLoadingSolution] = useState(false);
  const [schemaSearch, setSchemaSearch] = useState("");
  const [expandedTables, setExpandedTables] = useState(new Set());

  useEffect(() => {
    setRevealedHints(Math.min(question?.highestHintLevel || 0, question?.hints.length || 0));
    setResult(null);
    setQueryError(null);
    setSolution(null);
    setSolutionError(null);
    setReflection(question?.reflection || "");
    setReflectionError(null);
  }, [question?.id, question?.reflection]);

  const filteredTables = useMemo(() => {
    const keyword = schemaSearch.trim().toLowerCase();
    if (!keyword) return tables;
    return tables.filter((table) =>
      table.name.toLowerCase().includes(keyword)
      || table.columns.some((column) => column.name.toLowerCase().includes(keyword)),
    );
  }, [schemaSearch, tables]);

  if (!question) return <div className="surface-loading">課程載入中…</div>;

  async function revealNextHint() {
    const next = Math.min(revealedHints + 1, question.hints.length);
    setRevealedHints(next);
    await apiFetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "hint_revealed",
        questionId: question.id,
        payload: { hintLevel: next },
      }),
    }).catch(() => {});
  }

  async function runQuery() {
    if (querying) return;
    setQuerying(true);
    setQueryError(null);
    setResult(null);
    try {
      const response = await apiFetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          sql,
          hintLevel: solution ? 5 : revealedHints,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw data;
      setResult(data);
    } catch (error) {
      setQueryError({
        message: error.error || error.message || "查詢失敗。",
        code: error.code || "QUERY_ERROR",
        hint: error.hint || null,
        validation: error.validation || null,
      });
    } finally {
      setQuerying(false);
      onDataChanged();
    }
  }

  async function revealSolution() {
    if (loadingSolution) return;
    setLoadingSolution(true);
    setSolutionError(null);
    try {
      const response = await apiFetch("/api/solution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id }),
      });
      const data = await response.json();
      if (!response.ok) throw data;
      setSolution(data);
      await onDataChanged();
    } catch (error) {
      setSolutionError(error.error || error.message || "完整解答載入失敗。");
    } finally {
      setLoadingSolution(false);
    }
  }

  async function saveReflection() {
    setSavingReflection(true);
    setReflectionError(null);
    try {
      const response = await apiFetch("/api/reflection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, reflection }),
      });
      const data = await response.json();
      if (!response.ok) throw data;
      await onDataChanged();
      if (data.nextQuestionId) onQuestionChange(data.nextQuestionId);
    } catch (error) {
      setReflectionError(error.error || error.message || "分析說明儲存失敗。");
    } finally {
      setSavingReflection(false);
    }
  }

  function toggleTable(name) {
    setExpandedTables((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  const rows = result?.rows || [];
  const columns = rows[0] ? Object.keys(rows[0]) : [];
  const validation = result?.validation || queryError?.validation;
  const hasRealAttempt = Boolean(question.attempts || result || queryError);
  const answerStageReady = revealedHints >= question.hints.length;

  return (
    <main className="lab-page">
      <aside className="course-rail">
        <div className="rail-heading">
          <span className="micro-label">CURRICULUM</span>
          <h2>五章課程</h2>
        </div>
        <div className="chapter-accordion">
          {chapters.map((chapter) => (
            <details key={chapter.id} open={chapter.questions.some((item) => item.id === question.id)}>
              <summary>
                <span>0{chapter.order}</span>
                <div><strong>{chapter.subtitle}</strong><small>{chapter.completed}/{chapter.total} 完成</small></div>
                <em>{chapter.percent}%</em>
              </summary>
              <div className="rail-question-list">
                {chapter.questions.map((item) => (
                  <button
                    key={item.id}
                    disabled={item.locked}
                    className={`${item.id === question.id ? "active" : ""} ${item.status}`}
                    onClick={() => onQuestionChange(item.id)}
                  >
                    <span>{item.locked ? "·" : item.mastery === "independent" ? "I" : item.mastery === "guided" ? "G" : item.status === "completed" ? "✓" : item.unit}</span>
                    <div><strong>{item.title}</strong><small>{item.stage}{item.mastery === "independent" ? " · 獨立" : item.mastery === "guided" ? " · 引導" : ""}</small></div>
                  </button>
                ))}
              </div>
            </details>
          ))}
        </div>

        <div className="schema-rail">
          <div className="rail-heading inline">
            <div><span className="micro-label">DATABASE</span><h2>olist schema</h2></div>
            <span>{tables.length} tables</span>
          </div>
          <input
            value={schemaSearch}
            onChange={(event) => setSchemaSearch(event.target.value)}
            placeholder="搜尋表格或欄位"
            aria-label="搜尋資料庫欄位"
          />
          <div className="schema-table-list">
            {filteredTables.map((table) => (
              <div key={table.name}>
                <button onClick={() => toggleTable(table.name)}>
                  <span>{expandedTables.has(table.name) ? "−" : "+"}</span>
                  <strong>{table.name}</strong>
                  <small>{table.columns.length}</small>
                </button>
                {expandedTables.has(table.name) && (
                  <ul>{table.columns.map((column) => <li key={column.name}><code>{column.name}</code><span>{column.type}</span></li>)}</ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </aside>

      <section className="lesson-workspace">
        <section className="lesson-brief">
          <div className="lesson-title-row">
            <div>
              <span className="micro-label">{question.chapterId.toUpperCase()} · UNIT {question.unit} · {question.stage}</span>
              <h1>{question.title}</h1>
            </div>
            <div className={`lesson-status ${question.status} ${question.mastery}`}>
              {masteryLabel(question)}
            </div>
          </div>

          <div className="brief-grid">
            <article className="brief-card business"><span>BUSINESS REQUEST</span><p>{question.context}</p></article>
            <article className="brief-card task"><span>YOUR TASK</span><p>{question.task}</p></article>
          </div>

          {question.lesson ? (
            <section className="learning-module">
              <div className="learning-module-head">
                <div><span className="micro-label">LEARN FIRST · 先學再做</span><h2>{question.lesson.concept}</h2></div>
                <div className="learning-module-actions">
                  <span className="chapter-one-badge">CHAPTER 1 教學模式</span>
                  <a href="#sql-editor">理解後跳到編輯器 ↓</a>
                </div>
              </div>

              <div className="concept-intro-grid">
                <article><span>白話意思</span><p>{question.lesson.plainLanguage}</p></article>
                <article><span>你熟悉的工作類比</span><p>{question.lesson.analogy}</p></article>
              </div>

              <div className="term-grid">
                {question.lesson.terms.map((item) => (
                  <article key={item.term}>
                    <code>{item.term}</code>
                    <p>{item.meaning}</p>
                    <small>{item.here}</small>
                  </article>
                ))}
              </div>

              <div className="thinking-path">
                <span>人的解題順序</span>
                <ol>{question.lesson.thoughtProcess.map((step) => <li key={step}>{step}</li>)}</ol>
              </div>

              <details className="worked-example" open>
                <summary>{question.lesson.workedExample.title}</summary>
                <div className="worked-example-body">
                  <p>{question.lesson.workedExample.context}</p>
                  <pre><code>{question.lesson.workedExample.sql}</code></pre>
                  <div className="line-explanations">
                    {question.lesson.workedExample.lineByLine.map((line) => (
                      <div key={line.code}><code>{line.code}</code><p>{line.explanation}</p></div>
                    ))}
                  </div>
                  <div className="result-shape"><strong>執行後看什麼：</strong>{question.lesson.workedExample.resultShape}</div>
                </div>
              </details>

              <div className="mistake-box">
                <span>新手常見錯誤</span>
                <ul>{question.lesson.commonMistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul>
              </div>
            </section>
          ) : (
            <details className="example-panel">
              <summary>查看相近 Example（範例思路）</summary>
              <p>{question.example}</p>
            </details>
          )}

          <div className="analyst-checklist">
            <span>ANALYST WORKFLOW</span>
            <ol>{question.analystSteps.map((step) => <li key={step}>{step}</li>)}</ol>
          </div>

          <div className="expected-row"><strong>完成檢查：</strong>{question.expected}</div>

          <section className="help-ladder" id="help-ladder">
            <div className="help-ladder-head">
              <div><span className="micro-label">HELP LADDER</span><h3>卡住沒關係，提示會一步一步增加</h3></div>
              <div className="hint-levels" aria-label="提示進度">
                {Array.from(
                  { length: question.lesson ? 5 : question.hints.length },
                  (_, index) => index + 1,
                ).map((level) => (
                  <span key={level} className={level <= revealedHints || (level === 5 && solution) ? "active" : ""}>{level}</span>
                ))}
              </div>
            </div>

            <div className="hint-stack">
            {question.hints.slice(0, revealedHints).map((hint, index) => (
              <div key={hint}><span>第 {index + 1} 階</span><p>{hint}</p></div>
            ))}
            {revealedHints < question.hints.length && (
              <button onClick={revealNextHint}>需要提示？顯示第 {revealedHints + 1} 階</button>
            )}
            </div>

            {question.lesson && answerStageReady && !solution && (
              <div className="solution-gate">
                <div>
                  <span>第 5 階 · 完整解答</span>
                  <p>{hasRealAttempt ? "你已經真實嘗試過，可以查看完整答案與逐行解釋。" : "先在下面的編輯器寫下目前想法並按一次 Run，完整答案才會開放。"}</p>
                </div>
                <button onClick={revealSolution} disabled={!hasRealAttempt || loadingSolution}>
                  {loadingSolution ? "正在載入解答…" : "顯示完整解答與原因"}
                </button>
              </div>
            )}
            {solutionError && <div className="solution-error">{solutionError}</div>}

            {solution && (
              <article className="solution-panel">
                <div className="solution-panel-head">
                  <div><span className="micro-label">STAGE 5 · FULL SOLUTION</span><h3>完整答案不是終點，請逐行讀懂</h3></div>
                  <span>本題會記錄為「引導完成」</span>
                </div>
                <pre><code>{solution.sql}</code></pre>
                <div className="solution-breakdown">
                  {solution.lineByLine.map((line) => (
                    <div key={line.code}><code>{line.code}</code><p>{line.explanation}</p></div>
                  ))}
                </div>
                <div className="solution-notes-grid">
                  <section><span>為什麼正確</span><ul>{solution.whyItWorks.map((item) => <li key={item}>{item}</li>)}</ul></section>
                  <section><span>怎麼驗證</span><ul>{solution.verify.map((item) => <li key={item}>{item}</li>)}</ul></section>
                </div>
                <div className="transfer-note"><strong>下一步：</strong>{solution.transfer}</div>
              </article>
            )}
          </section>
        </section>

        <section className="sql-studio" id="sql-editor">
          <div className="studio-toolbar">
            <div><span className="status-dot" />Supabase PostgreSQL · Read only</div>
            <div className="studio-shortcuts"><a href="#help-ladder">回到提示 ↑</a><span><kbd>⌘</kbd><kbd>Enter</kbd> 執行</span></div>
          </div>
          <CodeMirror
            value={sql}
            height="320px"
            extensions={[sqlLanguage({ dialect: PostgreSQL })]}
            onChange={setSql}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                runQuery();
              }
            }}
            theme="dark"
            basicSetup={{ foldGutter: false, highlightActiveLineGutter: true }}
          />
          <div className="run-row">
            <span>Attempt #{(question.attempts || 0) + 1} · Hint level {solution ? 5 : revealedHints}</span>
            <button className="run-button" onClick={runQuery} disabled={querying}>
              {querying ? "正在執行與判題…" : "▶ Run & Validate"}
            </button>
          </div>
        </section>

        <section className="result-studio">
          <div className="result-head">
            <div><span className="micro-label">RESULT & VALIDATION</span><h2>執行結果</h2></div>
            {result && <span>{result.row_count} rows · {result.durationMs} ms</span>}
          </div>

          {queryError && (
            <div className="query-error"><strong>{queryError.code}</strong><p>{queryError.message}</p>{queryError.hint && <small>{queryError.hint}</small>}</div>
          )}

          {validation && (
            <div className={`validation-panel ${validation.passed ? "passed" : "needs-work"}`}>
              <div className="validation-score"><strong>{validation.score}</strong><span>/ 100</span></div>
              <div>
                <h3>{validation.passed ? "查詢通過，下一步寫分析說明" : "可以執行，但還要修正"}</h3>
                <div className="validation-checks">
                  {validation.checks.map((check) => (
                    <div key={check.id}><span>{check.passed ? "✓" : "×"}</span><p><strong>{check.label}</strong>{check.detail}</p></div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {result && (
            rows.length ? (
              <div className="result-table-wrap">
                <table><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
                  <tbody>{rows.map((row, index) => <tr key={index}>{columns.map((column) => <td key={column}>{valueText(row[column])}</td>)}</tr>)}</tbody>
                </table>
              </div>
            ) : <div className="empty-result">查詢成功，但結果是 0 列。請判斷這是正確的資料品質結果，還是條件過窄。</div>
          )}

          {(result?.passed || question.status === "query_passed" || question.status === "completed") && (
            <div className="reflection-card">
              <span className="micro-label">ANALYST NOTE</span>
              <h3>把 SQL 結果變成分析師證據</h3>
              <p>{question.reflectionPrompt}</p>
              <textarea
                value={reflection}
                onChange={(event) => setReflection(event.target.value)}
                placeholder="例如：結果顯示……。我用列數／NULL／總額……確認……。目前限制是……。"
              />
              {reflectionError && <div className="reflection-error">{reflectionError}</div>}
              <button className="primary-action" onClick={saveReflection} disabled={savingReflection}>
                {savingReflection ? "儲存中…" : question.status === "completed" ? "更新分析說明" : "儲存並完成這題 →"}
              </button>
            </div>
          )}

          {!result && !queryError && <div className="empty-result">寫下 SQL 並執行；系統會顯示資料結果、判題與完整 Log。</div>}
        </section>
      </section>
    </main>
  );
}
