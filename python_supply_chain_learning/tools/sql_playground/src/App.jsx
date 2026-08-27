import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import AuthScreen from "./AuthScreen.jsx";
import Dashboard from "./Dashboard.jsx";
import History from "./History.jsx";
import { useSupabaseAuth } from "./useSupabaseAuth.js";

const Lab = lazy(() => import("./Lab.jsx"));

const starterSql = "-- 先把商業需求拆成欄位、資料表、條件與驗證\nSELECT\n  \nFROM olist.;\n";

export default function App() {
  const auth = useSupabaseAuth();
  const [view, setView] = useState("dashboard");
  const [chapters, setChapters] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [tables, setTables] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [appError, setAppError] = useState(null);
  const [exporting, setExporting] = useState(false);

  const apiFetch = useCallback(
    (url, options = {}) =>
      fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${auth.session?.access_token || ""}`,
        },
      }),
    [auth.session?.access_token],
  );

  const refreshData = useCallback(async () => {
    if (!auth.session) return;
    setAppError(null);
    try {
      const [courseResponse, schemaResponse, dashboardResponse, logsResponse] = await Promise.all([
        apiFetch("/api/course"),
        apiFetch("/api/schema"),
        apiFetch("/api/dashboard"),
        apiFetch("/api/logs?limit=100"),
      ]);
      const [courseData, schemaData, dashboardData, logsData] = await Promise.all([
        courseResponse.json(),
        schemaResponse.json(),
        dashboardResponse.json(),
        logsResponse.json(),
      ]);
      const failure = [
        [courseResponse, courseData],
        [schemaResponse, schemaData],
        [dashboardResponse, dashboardData],
        [logsResponse, logsData],
      ].find(([response]) => !response.ok);
      if (failure) throw new Error(failure[1].error || "學習資料載入失敗。");

      setChapters(courseData.chapters || []);
      setTables(schemaData.tables || []);
      setDashboard(dashboardData);
      setLogs(logsData.logs || []);
      setSelectedQuestionId((current) => current || dashboardData.nextQuestion?.id || "ch01-q01");
    } catch (error) {
      setAppError(error.message || "網站資料載入失敗。");
    } finally {
      setLoading(false);
    }
  }, [apiFetch, auth.session]);

  useEffect(() => {
    if (auth.session) {
      setLoading(true);
      refreshData();
    } else {
      setChapters([]);
      setDashboard(null);
      setTables([]);
      setLogs([]);
      setLoading(false);
    }
  }, [auth.session, refreshData]);

  const allQuestions = useMemo(
    () => chapters.flatMap((chapter) => chapter.questions || []),
    [chapters],
  );
  const selectedQuestion = allQuestions.find((item) => item.id === selectedQuestionId);
  const currentSql = drafts[selectedQuestionId] ?? starterSql;

  const setCurrentSql = useCallback(
    (value) => {
      if (!selectedQuestionId) return;
      setDrafts((current) => ({ ...current, [selectedQuestionId]: value }));
    },
    [selectedQuestionId],
  );

  const openQuestion = useCallback(
    async (questionId) => {
      const question = allQuestions.find((item) => item.id === questionId);
      if (!question) return;
      setSelectedQuestionId(questionId);
      setDrafts((current) =>
        current[questionId]
          ? current
          : {
              ...current,
              [questionId]: `-- ${question.title}\n-- 先寫下你的分析步驟，再完成 SQL\n\n`,
            },
      );
      setView("lab");
      await apiFetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "lesson_opened",
          questionId,
          payload: { source: "course" },
        }),
      }).catch(() => {});
    },
    [allQuestions, apiFetch],
  );

  const resume = useCallback(() => {
    const nextId = dashboard?.nextQuestion?.id || selectedQuestionId || "ch01-q01";
    openQuestion(nextId);
  }, [dashboard?.nextQuestion?.id, openQuestion, selectedQuestionId]);

  const downloadExport = useCallback(
    async (scope, format) => {
      setExporting(true);
      setAppError(null);
      try {
        const params = new URLSearchParams({ scope, format });
        if (scope === "today") {
          const now = new Date();
          const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          params.set("from", start.toISOString());
          params.set("to", end.toISOString());
        }
        const response = await apiFetch(`/api/export?${params.toString()}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "下載失敗。");
        }
        const blob = await response.blob();
        const disposition = response.headers.get("content-disposition") || "";
        const filename = disposition.match(/filename="([^"]+)"/)?.[1]
          || `supply-sql-log.${format}`;
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
      } catch (error) {
        setAppError(error.message || "下載失敗。");
      } finally {
        setExporting(false);
      }
    },
    [apiFetch],
  );

  if (auth.loading || !auth.session) {
    return (
      <AuthScreen
        loading={auth.loading}
        ready={auth.ready}
        actionLoading={auth.actionLoading}
        message={auth.message}
        onSignIn={auth.signIn}
        onSignUp={auth.signUp}
      />
    );
  }

  return (
    <div className="product-shell">
      <header className="product-topbar">
        <button className="product-brand" onClick={() => setView("dashboard")}>
          <span>SQL</span>
          <div><strong>Supply SQL Lab</strong><small>Analyst evidence system</small></div>
        </button>
        <nav aria-label="主要導覽">
          <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}>Dashboard</button>
          <button className={view === "lab" ? "active" : ""} onClick={resume}>Learn</button>
          <button className={view === "history" ? "active" : ""} onClick={() => setView("history")}>Query Log</button>
        </nav>
        <div className="account-area">
          {exporting && <span className="exporting-label">正在整理下載…</span>}
          <div className="account-pill"><span>{auth.session.user.email?.slice(0, 1).toUpperCase()}</span><div><strong>{auth.session.user.email}</strong><small>{dashboard?.readiness?.status || "Learning"}</small></div></div>
          <button className="logout-button" onClick={auth.signOut}>登出</button>
        </div>
      </header>

      {appError && (
        <div className="app-error-banner" role="alert">
          <span>{appError}</span>
          <button onClick={refreshData}>重新載入</button>
        </div>
      )}

      {loading ? <div className="surface-loading full-page">正在建立你的學習 Dashboard…</div> : (
        <>
          {view === "dashboard" && (
            <Dashboard
              data={dashboard}
              chapters={chapters}
              onResume={resume}
              onOpenQuestion={openQuestion}
              onExport={downloadExport}
            />
          )}
          {view === "lab" && selectedQuestion && (
            <Suspense fallback={<div className="surface-loading full-page">正在開啟 SQL Studio…</div>}>
              <Lab
                chapters={chapters}
                questionId={selectedQuestionId}
                onQuestionChange={openQuestion}
                tables={tables}
                apiFetch={apiFetch}
                sql={currentSql}
                setSql={setCurrentSql}
                onDataChanged={refreshData}
              />
            </Suspense>
          )}
          {view === "history" && (
            <History logs={logs} loading={loading} onExport={downloadExport} />
          )}
        </>
      )}
    </div>
  );
}
