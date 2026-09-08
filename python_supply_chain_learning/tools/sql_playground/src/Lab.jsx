import { useEffect, useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import EditorTutor, { TutorText } from "./EditorTutor.jsx";
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

const safeTutorPrompts = [
  "這個結果能幫主管做什麼決定？",
  "我還應該做哪一個驗證？",
  "面試時要怎麼解釋這段 SQL？",
];

async function tutorFetch(apiFetch, url, options = {}, timeoutMs = 16_000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await apiFetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("AI 回應超過等待時間，系統已停止等待；請按一次重試，不會影響你的 SQL Log。");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

function normalizeTutorResponse(response) {
  const prompts = Array.isArray(response?.followUpPrompts)
    ? response.followUpPrompts
      .map((item) => String(item || "").trim())
      .filter((item) => item.length >= 4 && item.length <= 140)
      .filter((item) => !/[{}\[\]]|followUpPrompts|valid JSON/i.test(item))
      .slice(0, 3)
    : [];
  return {
    ...response,
    followUpPrompts: prompts.length >= 2 ? prompts : safeTutorPrompts,
  };
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
  const [tutorMessages, setTutorMessages] = useState([]);
  const [tutorResponse, setTutorResponse] = useState(null);
  const [tutorQuestion, setTutorQuestion] = useState("");
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorError, setTutorError] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [diagnosticResponse, setDiagnosticResponse] = useState(null);
  const [diagnosticMessages, setDiagnosticMessages] = useState([]);
  const [diagnosticQuestion, setDiagnosticQuestion] = useState("");
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [diagnosticError, setDiagnosticError] = useState(null);
  const [solution, setSolution] = useState(null);
  const [solutionError, setSolutionError] = useState(null);
  const [loadingSolution, setLoadingSolution] = useState(false);
  const [schemaSearch, setSchemaSearch] = useState("");
  const [expandedTables, setExpandedTables] = useState(new Set());
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [evidenceChecks, setEvidenceChecks] = useState(new Set());
  const [evidenceNote, setEvidenceNote] = useState("");
  const [evidenceError, setEvidenceError] = useState(null);
  const [savingEvidence, setSavingEvidence] = useState(false);

  useEffect(() => {
    setRevealedHints(Math.min(question?.highestHintLevel || 0, question?.hints.length || 0));
    setResult(null);
    setQueryError(null);
    setSolution(null);
    setSolutionError(null);
    setReflection(question?.reflection || "");
    setReflectionError(null);
    setTutorMessages([]);
    setTutorResponse(null);
    setTutorQuestion("");
    setTutorError(null);
    setDiagnosis(null);
    setDiagnosticResponse(null);
    setDiagnosticMessages([]);
    setDiagnosticQuestion("");
    setDiagnosticLoading(false);
    setDiagnosticError(null);
  }, [question?.id]);

  useEffect(() => {
    setEvidenceChecks(new Set(question?.careerEvidence?.checks || []));
    setEvidenceNote(question?.careerEvidence?.note || "");
    setEvidenceError(null);
  }, [question?.id, question?.careerEvidence?.completed_at]);

  useEffect(() => {
    if (!question?.id) return undefined;
    let cancelled = false;

    async function loadTutor() {
      try {
        const historyResponse = await tutorFetch(apiFetch,
          `/api/tutor/history?questionId=${encodeURIComponent(question.id)}`,
        );
        const historyData = await historyResponse.json();
        if (!historyResponse.ok) throw historyData;
        if (cancelled) return;
        applyTutorData(historyData);
        applyDiagnosticData(historyData);

        const canDraft = question.status === "query_passed" || question.status === "completed";
        if (canDraft && (historyData.messages || []).length === 0) {
          setTutorLoading(true);
          const draftResponse = await tutorFetch(apiFetch, "/api/tutor", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questionId: question.id, mode: "draft" }),
          });
          const draftData = await draftResponse.json();
          if (!draftResponse.ok) throw draftData;
          if (!cancelled) applyTutorData(draftData);
        }
      } catch (error) {
        if (!cancelled) {
          setTutorError(error.error || error.message || "AI 分析師家教暫時無法載入。");
        }
      } finally {
        if (!cancelled) setTutorLoading(false);
      }
    }

    loadTutor();
    return () => { cancelled = true; };
  }, [apiFetch, question?.id, question?.status]);

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
    setDiagnosis(null);
    setDiagnosticResponse(null);
    setDiagnosticMessages([]);
    setDiagnosticError(null);
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
      if (!data.passed) {
        setDiagnosis(data.diagnostic || null);
        void requestAttemptDiagnosis(data.logId);
      }
    } catch (error) {
      setQueryError({
        message: error.error || error.message || "查詢失敗。",
        code: error.code || "QUERY_ERROR",
        hint: error.hint || null,
        validation: error.validation || null,
        logId: error.logId || null,
      });
      setDiagnosis(error.diagnostic || null);
      if (error.logId) void requestAttemptDiagnosis(error.logId);
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
        body: JSON.stringify({
          questionId: question.id,
          reflection,
          reflectionSource: reflectionSource(),
        }),
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

  async function saveCareerEvidence() {
    if (savingEvidence) return;
    setSavingEvidence(true);
    setEvidenceError(null);
    try {
      const response = await apiFetch("/api/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          checks: [...evidenceChecks],
          note: evidenceNote,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw data;
      await onDataChanged();
    } catch (error) {
      setEvidenceError(error.error || error.message || "Tool Lab 證據儲存失敗。");
    } finally {
      setSavingEvidence(false);
    }
  }

  function toggleEvidenceCheck(checkId) {
    setEvidenceChecks((current) => {
      const next = new Set(current);
      if (next.has(checkId)) next.delete(checkId);
      else next.add(checkId);
      return next;
    });
  }

  function downloadResultCsv() {
    if (!result) return;
    const csvColumns = rows[0]
      ? Object.keys(rows[0])
      : question.careerLab?.expectedColumns || [];
    const quote = (value) => {
      if (value === null || value === undefined) return "";
      const text = typeof value === "object" ? JSON.stringify(value) : String(value);
      return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
    };
    const csv = [
      csvColumns.map(quote).join(","),
      ...rows.map((row) => csvColumns.map((column) => quote(row[column])).join(",")),
    ].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${question.id}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function applyTutorData(data) {
    const messages = data.messages || [];
    setTutorMessages(messages.filter((item) => item.metadata?.kind !== "diagnosis"));
    const latestStructured = [...messages]
      .reverse()
      .find((item) => (
        item.role === "assistant"
        && item.metadata?.response
        && item.metadata?.kind !== "diagnosis"
      ))
      ?.metadata?.response || data.response || null;
    if (!latestStructured) return;
    const normalized = normalizeTutorResponse(latestStructured);
    setTutorResponse((previous) => {
      setReflection((current) => {
        if (!current.trim() || current.trim() === previous?.suggestedReflection?.trim()) {
          return normalized.suggestedReflection || current;
        }
        return current;
      });
      return normalized;
    });
  }

  function applyDiagnosticData(data) {
    const messages = data.messages || [];
    const latestAssistant = [...messages]
      .reverse()
      .find((item) => item.role === "assistant" && item.metadata?.kind === "diagnosis");
    const activeLogId = data.assistantMessage?.metadata?.logId
      || latestAssistant?.metadata?.logId
      || null;
    const activeMessages = messages.filter((item) => (
      item.metadata?.kind === "diagnosis"
      && (!activeLogId || item.metadata?.logId === activeLogId)
    ));
    setDiagnosticMessages(activeMessages);

    const structured = data.response || latestAssistant?.metadata?.response || null;
    const deterministic = data.diagnostic || latestAssistant?.metadata?.diagnostic || null;
    if (structured) setDiagnosticResponse(normalizeTutorResponse(structured));
    if (deterministic) setDiagnosis(deterministic);
  }

  function reflectionSource() {
    if (!tutorResponse) return reflection.trim() ? "user" : "local_fallback";
    if (reflection.trim() !== tutorResponse.suggestedReflection?.trim()) return "user_edited";
    const latestAssistant = [...tutorMessages]
      .reverse()
      .find((item) => item.role === "assistant" && item.metadata?.response);
    return latestAssistant?.metadata?.provider === "local-fallback"
      ? "local_fallback"
      : "ai_draft";
  }

  async function askTutor(message = tutorQuestion) {
    const followUp = message.trim();
    if (!followUp || tutorLoading) return;
    setTutorLoading(true);
    setTutorError(null);
    try {
      const response = await tutorFetch(apiFetch, "/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          mode: "follow_up",
          message: followUp,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw data;
      applyTutorData(data);
      setTutorQuestion("");
    } catch (error) {
      setTutorError(error.error || error.message || "AI 家教暫時無法回答。");
    } finally {
      setTutorLoading(false);
    }
  }

  async function requestTutorDraft() {
    if (tutorLoading) return;
    setTutorLoading(true);
    setTutorError(null);
    try {
      const response = await tutorFetch(apiFetch, "/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, mode: "draft" }),
      });
      const data = await response.json();
      if (!response.ok) throw data;
      applyTutorData(data);
    } catch (error) {
      setTutorError(error.error || error.message || "AI 分析師草稿暫時無法產生。");
    } finally {
      setTutorLoading(false);
    }
  }

  async function requestAttemptDiagnosis(logId) {
    if (!logId) return;
    setDiagnosticLoading(true);
    setDiagnosticError(null);
    try {
      const response = await tutorFetch(apiFetch, "/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          mode: "diagnose",
          logId,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw data;
      applyDiagnosticData(data);
    } catch (error) {
      setDiagnosticError(error.error || error.message || "錯誤診斷家教暫時無法回答。");
    } finally {
      setDiagnosticLoading(false);
    }
  }

  async function askDiagnosticTutor(message = diagnosticQuestion) {
    const followUp = message.trim();
    const logId = activeAttemptLogId;
    if (!followUp || !logId || diagnosticLoading) return;
    setDiagnosticLoading(true);
    setDiagnosticError(null);
    try {
      const response = await tutorFetch(apiFetch, "/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          mode: "diagnose_follow_up",
          message: followUp,
          logId,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw data;
      applyDiagnosticData(data);
      setDiagnosticQuestion("");
    } catch (error) {
      setDiagnosticError(error.error || error.message || "錯誤診斷家教暫時無法回答。");
    } finally {
      setDiagnosticLoading(false);
    }
  }

  function useCorrectedSql() {
    if (!diagnosis?.correctedSql) return;
    setSql(diagnosis.correctedSql.replace(/;\s*$/, ""));
    document.getElementById("sql-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
  const columns = rows[0]
    ? Object.keys(rows[0])
    : question.careerLab?.expectedColumns || [];
  const validation = result?.validation || queryError?.validation;
  const activeAttemptLogId = diagnosticMessages[0]?.metadata?.logId
    || queryError?.logId
    || result?.logId
    || null;
  const currentAttemptFailed = Boolean(
    queryError
    || (result && !result.passed)
    || (!result && question.status === "in_progress" && diagnosis),
  );
  const hasRealAttempt = Boolean(question.attempts || result || queryError);
  const hasPassedSql = Boolean(
    result?.passed || question.status === "query_passed" || question.status === "completed",
  );
  const careerEvidenceComplete = Boolean(question.careerEvidence?.completed);
  const requiresCareerEvidence = Boolean(question.careerLab?.requiredEvidence);
  const answerStageReady = revealedHints >= question.hints.length;

  return (
    <main className={`lab-page ${railCollapsed ? "rail-collapsed" : ""}`}>
      <aside className={`course-rail ${railCollapsed ? "collapsed" : ""}`}>
        <button
          className="rail-toggle"
          onClick={() => setRailCollapsed((current) => !current)}
          aria-expanded={!railCollapsed}
          aria-label={railCollapsed ? "展開課程列表" : "收合課程列表"}
        >
          <span aria-hidden="true">{railCollapsed ? "›" : "‹"}</span>
          <strong>{railCollapsed ? "展開" : "收合課程"}</strong>
        </button>

        {railCollapsed ? (
          <button className="rail-collapsed-summary" onClick={() => setRailCollapsed(false)}>
            <span>{question.chapterId.toUpperCase()}</span>
            <strong>{question.unit}</strong>
            <small>目前題目</small>
          </button>
        ) : (
          <div className="rail-content">
            <div className="rail-heading">
              <span className="micro-label">學習進度</span>
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
                <div><span className="micro-label">資料庫字典</span><h2>olist schema</h2></div>
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
          </div>
        )}
      </aside>

      <section className="lesson-workspace">
        <section className="lesson-brief">
          <div className="lesson-title-row">
            <div>
              <span className="micro-label">{question.chapterId.toUpperCase()} · {question.workContext.workday} · {question.stage} · {question.estimatedMinutes} 分鐘</span>
              <h1>{question.title}</h1>
            </div>
            <div className={`lesson-status ${question.status} ${question.mastery}`}>
              {masteryLabel(question)}
            </div>
          </div>

          <ol className="lesson-route" aria-label="本題學習流程">
            <li className="done"><span>1</span><strong>理解任務</strong></li>
            <li className={hasRealAttempt ? "done" : "active"}><span>2</span><strong>寫 SQL</strong></li>
            <li className={hasPassedSql ? "done" : hasRealAttempt ? "active" : ""}><span>3</span><strong>檢查結果</strong></li>
            {question.careerLab && <li className={careerEvidenceComplete ? "done" : hasPassedSql ? "active" : ""}><span>4</span><strong>Tool Lab</strong></li>}
            <li className={hasPassedSql && (!requiresCareerEvidence || careerEvidenceComplete) ? "active" : ""}><span>{question.careerLab ? 5 : 4}</span><strong>說明洞察</strong></li>
          </ol>

          <details className="time-plan">
            <summary><strong>本題規劃 {question.estimatedMinutes} 分鐘</strong><span>展開時間安排</span></summary>
            <div>{question.practicePlan.map((item) => <span key={item.label}>{item.label}<strong>{item.minutes}m</strong></span>)}</div>
          </details>

          <section className="lesson-mission">
            <span className="mission-kicker">現在只做這一件事 · {question.workContext.team}</span>
            <h2>{question.task}</h2>
            <p><strong>工作目的：</strong>{question.workContext.businessPurpose}</p>
            <div className="mission-success">
              <span>完成時應該看到</span>
              <strong>{question.expected}</strong>
            </div>
          </section>

          <section className="work-handoff" aria-label="工具選擇與交付方式">
            <div>
              <span>為什麼現在用 SQL</span>
              <p>{question.workContext.whySql}</p>
            </div>
            <div>
              <span>Query 完成後怎麼交付</span>
              <strong>{question.workContext.delivery.label}</strong>
              <p>{question.workContext.delivery.destination}</p>
              <small>{question.workContext.delivery.reason}</small>
            </div>
          </section>

          {question.lesson ? (
            <section className="learning-module">
              <div className="learning-module-head">
                <div><span className="micro-label">一分鐘重點</span><h2>{question.lesson.concept}</h2></div>
              </div>

              <p className="concept-lead">{question.lesson.plainLanguage}</p>
              <div className="analogy-line">
                <span>換成你熟悉的說法</span>
                <p>{question.lesson.analogy}</p>
              </div>

              <div className="thinking-path">
                <span>照這個順序想</span>
                <ol>{question.lesson.thoughtProcess.map((step) => <li key={step}>{step}</li>)}</ol>
              </div>

              <a className="lesson-primary-action" href="#sql-editor">
                <span>下一步</span>
                <strong>我懂任務了，開始寫 SQL →</strong>
              </a>

              <div className="lesson-detail-stack">
                <details className="lesson-detail tool-boundary-detail">
                  <summary><strong>SQL、Pandas、Power BI 要怎麼分工？</strong><small>了解這題為什麼不用所有工具</small></summary>
                  <div className="tool-boundary-list">
                    {question.workContext.toolBoundary.map((item) => (
                      <div key={item.tool}>
                        <strong>{item.tool}</strong>
                        <span>{item.timing}</span>
                        <p>{item.reason}</p>
                      </div>
                    ))}
                  </div>
                </details>

                <details className="lesson-detail">
                  <summary><strong>需要查名詞？打開關鍵字小抄</strong><small>{question.lesson.terms.length} 個關鍵字</small></summary>
                  <dl className="term-list">
                    {question.lesson.terms.map((item) => (
                      <div key={item.term}>
                        <dt><code>{item.term}</code></dt>
                        <dd><strong>{item.meaning}</strong><span>{item.here}</span></dd>
                      </div>
                    ))}
                  </dl>
                </details>

                <details className="worked-example lesson-detail">
                  <summary><strong>{question.lesson.workedExample.title}</strong><small>先自己想，卡住再看</small></summary>
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

                <details className="lesson-detail mistake-detail">
                  <summary><strong>執行失敗時，再看常見錯誤</strong><small>{question.lesson.commonMistakes.length} 個提醒</small></summary>
                  <ul>{question.lesson.commonMistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul>
                </details>
              </div>
            </section>
          ) : (
            <details className="example-panel">
              <summary>查看相近 Example（範例思路）</summary>
              <p>{question.example}</p>
            </details>
          )}

          <details className="analyst-checklist">
            <summary><div><span>交付前一定要做</span><strong>這一題要怎麼驗證才可信？</strong></div><small>{question.workContext.validationPlan.length} 個檢查</small></summary>
            <ol>{question.workContext.validationPlan.map((step) => <li key={step}>{step}</li>)}</ol>
          </details>

          <details className="help-ladder" id="help-ladder" open={revealedHints > 0 || Boolean(solution)}>
            <summary className="help-ladder-head">
              <div><span className="micro-label">卡住時再打開</span><h3>需要提示或完整解答？</h3></div>
              <div className="hint-levels" aria-label="提示進度">
                {Array.from(
                  { length: question.lesson ? 5 : question.hints.length },
                  (_, index) => index + 1,
                ).map((level) => (
                  <span key={level} className={level <= revealedHints || (level === 5 && solution) ? "active" : ""}>{level}</span>
                ))}
              </div>
            </summary>

            <div className="help-ladder-body">

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
            </div>
          </details>
        </section>

        <section className="sql-studio" id="sql-editor">
          <div className="studio-intro">
            <span className="micro-label">STEP 2 · 換你動手</span>
            <h2>先寫出你目前理解的版本</h2>
            <p>不需要一次完美。執行後，系統會直接告訴你結果形狀與哪裡需要修正。</p>
          </div>
          <EditorTutor apiFetch={apiFetch} scope={{ surface: "learn", id: question.id, language: "sql" }} draft={sql} logId={result?.logId || queryError?.logId} onApplyCode={setSql}>
          <div className="studio-toolbar">
            <div><span className="status-dot" />Supabase PostgreSQL · Read only</div>
            <div className="studio-shortcuts"><a href="#help-ladder">卡住了？看提示</a><span><kbd>⌘</kbd><kbd>Enter</kbd> 執行</span></div>
          </div>
          <CodeMirror
            value={sql}
            height="320px"
            placeholder="在這裡輸入 SQL…"
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
              {querying ? "正在執行與判題…" : "▶ 執行並檢查答案"}
            </button>
          </div>
          </EditorTutor>
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
                <h3>{validation.passed ? "查詢通過，AI 正在整理分析師觀點" : "可以執行，但還要修正"}</h3>
                <div className="validation-checks">
                  {validation.checks.map((check) => (
                    <div key={check.id}><span>{check.passed ? "✓" : "×"}</span><p><strong>{check.label}</strong>{check.detail}</p></div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentAttemptFailed && (
            <section className="diagnostic-coach-card">
              <div className="diagnostic-coach-head">
                <div>
                  <span className="micro-label">AI ERROR COACH · 這次就教到你會改</span>
                  <h3>這次輸出未通過，不代表你的能力是 0 分</h3>
                  <p>系統先用固定規則找出差異，AI 再解釋錯在哪裡、為什麼錯，以及下一次要怎麼改。</p>
                </div>
                <span>不必先拿到 100 分才能問</span>
              </div>

              {diagnosis && (
                <div className="diagnosis-facts">
                  <div><span>分數真正的意思</span><p>{diagnosis.scoreMeaning}</p></div>
                  <div><span>目前問題</span><p>{diagnosis.issue}</p></div>
                  <div><span>為什麼沒通過</span><p>{diagnosis.why}</p></div>
                </div>
              )}

              {diagnosticLoading && !diagnosticResponse && (
                <div className="coach-loading"><span />AI 正在讀你的 SQL、錯誤訊息與判題結果…</div>
              )}

              {diagnosticResponse && (
                <div className="diagnostic-ai-answer">
                  <span>AI 家教怎麼看</span>
                  <TutorText text={diagnosticResponse.answer} />
                </div>
              )}

              {diagnosis?.correctedSql && (
                <div className="corrected-query">
                  <div>
                    <span className="micro-label">完整修正版 SQL</span>
                    <strong>不要只看一條橫線：這裡保留完整換行與縮排</strong>
                  </div>
                  <pre><code>{diagnosis.correctedSql}</code></pre>
                  <div className="correction-actions">
                    <button className="secondary-action" onClick={useCorrectedSql}>把修正版帶入編輯器</button>
                    <small>帶入後請再按 Run，比較每一項檢查如何改變。</small>
                  </div>
                </div>
              )}

              {diagnosticMessages.length > 1 && (
                <div className="tutor-message-list diagnostic-thread">
                  {diagnosticMessages.map((item) => (
                    <div key={item.id} className={`tutor-message ${item.role}`}>
                      <span>{item.role === "assistant" ? "AI 家教" : "你"}</span>
                      <TutorText text={item.content} />
                    </div>
                  ))}
                  {diagnosticLoading && <div className="tutor-message assistant pending"><span>AI 家教</span><p>正在分析你的追問…</p></div>}
                </div>
              )}

              <a className="secondary-action" href="#sql-editor">還是不懂？到編輯器旁請家教逐步解釋 ↑</a>

              {diagnosticError && (
                <div className="reflection-error">
                  {diagnosticError} 下方完整修正版與固定規則診斷仍然可以使用。
                  {activeAttemptLogId && (
                    <button className="inline-retry" onClick={() => requestAttemptDiagnosis(activeAttemptLogId)} disabled={diagnosticLoading}>
                      重新連線 AI 家教
                    </button>
                  )}
                </div>
              )}
            </section>
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

          {hasPassedSql && question.careerLab && (
            <section className={`career-lab-card ${careerEvidenceComplete ? "completed" : ""}`}>
              <div className="career-lab-head">
                <div>
                  <span className="micro-label">TOOL LAB · {question.careerLab.tool}</span>
                  <h3>{question.careerLab.title}</h3>
                  <p>{question.careerLab.purpose}</p>
                </div>
                <span>{careerEvidenceComplete ? "證據已儲存" : question.careerLab.requiredEvidence ? "本題必交" : "延伸練習"}</span>
              </div>
              {question.careerLab.platformNote && <div className="platform-note">{question.careerLab.platformNote}</div>}
              <div className="career-lab-body">
                <div>
                  <strong>實作步驟</strong>
                  <ol>{question.careerLab.steps.map((step) => <li key={step}>{step}</li>)}</ol>
                  <button className="secondary-action" onClick={downloadResultCsv} disabled={!result}>
                    {result ? "下載本次結果 CSV" : "重新執行 SQL 後可下載 CSV"}
                  </button>
                  <small>預期交付：{question.careerLab.artifact}</small>
                </div>
                {question.careerLab.requiredEvidence && (
                  <div className="evidence-form">
                    <strong>交付證據紀錄</strong>
                    <p>{question.careerLab.evidencePrompt}</p>
                    {question.careerLab.evidenceChecks.map((check) => (
                      <label key={check.id}>
                        <input type="checkbox" checked={evidenceChecks.has(check.id)} onChange={() => toggleEvidenceCheck(check.id)} />
                        <span>{check.label}</span>
                      </label>
                    ))}
                    <textarea value={evidenceNote} onChange={(event) => setEvidenceNote(event.target.value)} placeholder="至少 40 個字：檔名、列數／公式／視覺、驗證結果與限制。" />
                    {evidenceError && <div className="reflection-error">{evidenceError}</div>}
                    <button className="primary-action" onClick={saveCareerEvidence} disabled={savingEvidence || careerEvidenceComplete}>
                      {careerEvidenceComplete ? "✓ Tool Lab 證據已記錄" : savingEvidence ? "儲存中…" : "儲存 Tool Lab 證據"}
                    </button>
                    <small>系統會保存你的勾選與說明，但不會假裝已讀取或驗證外部檔案內容。</small>
                  </div>
                )}
              </div>
            </section>
          )}

          {hasPassedSql && (
            <section className="analyst-coach-card">
              <div className="analyst-coach-head">
                <div>
                  <span className="micro-label">AI ANALYST COACH</span>
                  <h3>AI 先替你示範分析師怎麼看這份結果</h3>
                  <p>不用從空白開始。先讀懂公司用途、驗證與限制，再追問到你真的理解。</p>
                </div>
                <span className="coach-status">SQL 判分與 AI 解說分開</span>
              </div>

              {tutorLoading && !tutorResponse && (
                <div className="coach-loading"><span />正在根據你的 SQL 與真實結果整理分析師觀點…</div>
              )}

              {!tutorLoading && !tutorResponse && (
                <button className="secondary-action" onClick={requestTutorDraft}>
                  讓 AI 替我產生分析師草稿
                </button>
              )}

              {tutorResponse && (
                <>
                  <dl className="analyst-lens-list">
                    <div className="analyst-use"><dt>對分析師有什麼用</dt><dd>{tutorResponse.analystUse}</dd></div>
                    <div className="company-use"><dt>對公司有什麼用</dt><dd>{tutorResponse.companyUse}</dd></div>
                    <div className="validation-use"><dt>你做了哪個驗證</dt><dd>{tutorResponse.validation}</dd></div>
                    <div className="limitation-use"><dt>不能過度推論什麼</dt><dd>{tutorResponse.limitation}</dd></div>
                  </dl>

                  <details className="tutor-conversation" open={tutorMessages.length > 1}>
                    <summary>先前的分析師說明 · {tutorMessages.length} 則（保留紀錄）</summary>
                    <div className="tutor-message-list">
                      {tutorMessages.map((item) => (
                        <div key={item.id} className={`tutor-message ${item.role}`}>
                          <span>{item.role === "assistant" ? "AI 家教" : "你"}</span>
                          <TutorText text={item.content} />
                        </div>
                      ))}
                      {tutorLoading && <div className="tutor-message assistant pending"><span>AI 家教</span><p>正在思考你的追問…</p></div>}
                    </div>
                  </details>

                  <a className="secondary-action" href="#sql-editor">繼續追問：開啟編輯器旁的家教 ↑</a>
                </>
              )}

              {tutorError && <div className="reflection-error">{tutorError}</div>}

              <div className="analyst-note-editor">
                <div>
                  <span className="micro-label">ANALYST NOTE · AI 已替你整理</span>
                  <strong>可直接儲存，也可以改成更像自己的說法</strong>
                </div>
                <textarea
                  value={reflection}
                  onChange={(event) => setReflection(event.target.value)}
                  placeholder="AI 草稿會自動出現在這裡；即使 AI 暫時無法使用，系統也會提供可儲存的分析師說明。"
                />
                <small>這份文字是教學示範，不會取代 SQL 驗證；重點是你能透過追問說清楚證據、用途與限制。</small>
              </div>
              {reflectionError && <div className="reflection-error">{reflectionError}</div>}
              <button className="primary-action" onClick={saveReflection} disabled={savingReflection || tutorLoading || (requiresCareerEvidence && !careerEvidenceComplete)}>
                {savingReflection ? "儲存中…" : requiresCareerEvidence && !careerEvidenceComplete ? "先完成上方 Tool Lab 證據" : question.status === "completed" ? "更新分析師說明" : "使用這份分析完成本題 →"}
              </button>
            </section>
          )}

          {!result && !queryError && <div className="empty-result">寫下 SQL 並執行；系統會顯示資料結果、判題與完整 Log。</div>}
        </section>
      </section>
    </main>
  );
}
