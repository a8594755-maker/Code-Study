import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import AuthScreen from "./AuthScreen.jsx";
import Dashboard from "./Dashboard.jsx";
import History from "./History.jsx";
import { useSupabaseAuth } from "./useSupabaseAuth.js";
import { fetchWithTimeout } from "./download.js";
import { AccountDraftProvider } from "./AccountDraft.jsx";
import { releaseLabel, previewHome } from "./release.js";

const Lab = lazy(() => import("./Lab.jsx"));
const Playground = lazy(() => import("./Playground.jsx"));
const ProjectDemo = lazy(() => import("./ProjectDemo.jsx"));
const Workflow = lazy(() => import("./Workflow.jsx"));
const IntegratedCourse = lazy(() => import("./IntegratedCourse.jsx"));

const starterSql = "";

export default function App() {
  const auth = useSupabaseAuth();
  const draftStore = useRef(null);
  const [signingOut, setSigningOut] = useState(false);
  async function signOutSafely() {
    setSigningOut(true);
    try {
      if (draftStore.current && !await draftStore.current.flush()) {
        setAppError('還有草稿未同步，因此尚未登出。請回到草稿處重試、處理版本衝突，或先下載備份。');
        return;
      }
      await auth.signOut();
    } finally { setSigningOut(false); }
  }
  const [view, setView] = useState("integrated");
  const [chapters, setChapters] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [integratedCatalog, setIntegratedCatalog] = useState(null);
  const [activityRequest, setActivityRequest] = useState(null);
  const [playgroundOpened, setPlaygroundOpened] = useState(false);
  const [tables, setTables] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadedAccountId, setLoadedAccountId] = useState(null);
  const currentAccount = useRef(null);
  currentAccount.current = auth.session?.user?.id || null;
  const [appError, setAppError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [project, setProject] = useState(null);
  const [projectError, setProjectError] = useState(null);
  const [playgroundDrafts, setPlaygroundDrafts] = useState({});
  const [workspaceId, setWorkspaceId] = useState("free");
  const [playgroundStep, setPlaygroundStep] = useState(null);
  const [playgroundLog, setPlaygroundLog] = useState(null);
  const [workflowOpened, setWorkflowOpened] = useState(false);
  const [workflowLog, setWorkflowLog] = useState(null);
  const openWorkflow = () => { setWorkflowOpened(true); setView("workflow"); };
  const [integratedOpened, setIntegratedOpened] = useState(true);
  const [integratedLog, setIntegratedLog] = useState(null);
  const openIntegrated = () => { setIntegratedOpened(true); setView("integrated"); };
  const openActivity = (id) => { setActivityRequest({ id, nonce: Date.now() }); openIntegrated(); };

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
    const accountId = auth.session.user.id;
    setAppError(null);
    try {
      const [courseResponse, schemaResponse, dashboardResponse, logsResponse, integratedResponse] = await Promise.all([
        apiFetch("/api/course"),
        apiFetch("/api/schema"),
        apiFetch("/api/dashboard"),
        apiFetch("/api/logs?limit=100"),
        apiFetch("/api/integrated"),
      ]);
      const [courseData, schemaData, dashboardData, logsData, integratedData] = await Promise.all([
        courseResponse.json(),
        schemaResponse.json(),
        dashboardResponse.json(),
        logsResponse.json(),
        integratedResponse.json(),
      ]);
      const failure = [
        [courseResponse, courseData],
        [schemaResponse, schemaData],
        [dashboardResponse, dashboardData],
        [logsResponse, logsData],
        [integratedResponse, integratedData],
      ].find(([response]) => !response.ok);
      if (failure) throw new Error(failure[1].error || "學習資料載入失敗。");

      if (currentAccount.current !== accountId) return;
      setLoadedAccountId(accountId);
      setChapters(courseData.chapters || []);
      setTables(schemaData.tables || []);
      setDashboard(dashboardData);
      setIntegratedCatalog(integratedData);
      setLogs(logsData.logs || []);
      setSelectedQuestionId((current) => current || dashboardData.nextQuestion?.id || "ch01-q01");
    } catch (error) {
      if (currentAccount.current === accountId) setAppError(error.message || "網站資料載入失敗。");
    } finally {
      if (currentAccount.current === accountId) setLoading(false);
    }
  }, [apiFetch, auth.session]);

  const loadProject = useCallback(async () => {
    setProjectError(null);
    try {
      const response = await fetchWithTimeout(apiFetch, "/api/project-demo");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Demo 載入失敗。");
      setProject(data);
      return data;
    } catch (error) { setProjectError(error.message); return null; }
  }, [apiFetch]);

  useEffect(() => { if (view === "demo" && !project) loadProject(); }, [view, project, loadProject]);
  useEffect(() => {
    setLoadedAccountId(null); setDashboard(null); setChapters([]); setTables([]); setLogs([]);
    setIntegratedCatalog(null); setActivityRequest(null); setPlaygroundOpened(false);
    setLoading(Boolean(auth.session?.user?.id));
    setDrafts({}); setPlaygroundDrafts({}); setWorkspaceId("free"); setPlaygroundStep(null);
    setPlaygroundLog(null);
    setWorkflowOpened(false); setWorkflowLog(null);
    setIntegratedOpened(true); setIntegratedLog(null); setView("integrated");
  }, [auth.session?.user?.id]);
  useEffect(() => { if (view === "playground") setPlaygroundOpened(true); }, [view]);

  function tryDemo(step) {
    setPlaygroundDrafts((current) => ({ ...current, [step.id]: current[step.id] || { sql: step.sql, note: "" } }));
    setWorkspaceId(step.id); setPlaygroundStep(step); setPlaygroundLog(null); setView("playground");
  }

  async function reopenLog(log) {
    if (log.validation?.missionId?.startsWith("studio-")) { setIntegratedLog(log); openIntegrated(); return; }
    if (log.validation?.mode?.startsWith("workflow_")) { setWorkflowLog(log); openWorkflow(); return; }
    const demoId = log.validation?.demoStepId;
    const loaded = demoId ? project || await loadProject() : null;
    if (demoId && !loaded) return;
    const id = `log:${log.id}`;
    setPlaygroundDrafts((current) => ({ ...current, [id]: { sql: log.sql_text, note: log.validation?.note || "" } }));
    setWorkspaceId(id); setPlaygroundStep(loaded?.steps.find((step) => step.id === demoId) || null); setPlaygroundLog(log); setView("playground");
  }

  useEffect(() => {
    if (auth.session) {
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
        Object.hasOwn(current, questionId)
          ? current
          : {
              ...current,
              [questionId]: "",
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
    <AccountDraftProvider key={auth.session.user.id} apiFetch={apiFetch} storeRef={draftStore}><div className="product-shell app-shell" data-view={view}>
      <header className="product-topbar">
        <button className="product-brand" onClick={() => setView("dashboard")}>
          <span>SQL</span>
          <div><strong>Supply SQL Lab</strong><small>Analyst evidence system</small></div>
        </button>
        <nav aria-label="主要導覽">
          <button aria-current={view === "dashboard" ? "page" : undefined} className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}>學習總覽</button>
          <button aria-current={["integrated", "workflow", "demo", "lab"].includes(view) ? "page" : undefined} className={["integrated", "workflow", "demo", "lab"].includes(view) ? "active" : ""} onClick={openIntegrated}>分析師工作室</button>
          <button aria-current={view === "playground" ? "page" : undefined} className={view === "playground" ? "active" : ""} onClick={() => setView("playground")}>自由查詢</button>
          <button aria-current={view === "history" ? "page" : undefined} className={view === "history" ? "active" : ""} onClick={() => setView("history")}>學習紀錄</button>
        </nav>
        <div className="account-area">
          {exporting && <span className="exporting-label">正在整理下載…</span>}
          <div className="account-pill"><span>{auth.session.user.email?.slice(0, 1).toUpperCase()}</span><div><strong>{auth.session.user.email}</strong><small>{dashboard?.readiness?.status || "Learning"}</small></div></div>
          <a className="release-link" href={previewHome} title={`目前版本 ${releaseLabel}；開啟固定預覽入口`}>{releaseLabel}</a>
          <button className="logout-button" disabled={signingOut} onClick={signOutSafely}>{signingOut ? '保存中…' : '登出'}</button>
        </div>
      </header>

      {appError && (
        <div className="app-error-banner" role="alert">
          <span>{appError}</span>
          <button onClick={refreshData}>重新載入</button>
        </div>
      )}

      {loading || loadedAccountId !== auth.session.user.id ? <div className="surface-loading full-page">{appError ? "資料尚未載入，可用上方按鈕重試。" : "正在載入你的學習工作區…"}</div> : (
        <>
          {view === "dashboard" && (
            <Dashboard
              data={dashboard}
              catalog={integratedCatalog}
              onResume={resume}
              onOpenActivity={openActivity}
              onWorkflow={openIntegrated}
              onHistory={() => setView("history")}
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
            <History logs={logs} loading={loading} exporting={exporting} onExport={downloadExport} onOpenLog={reopenLog} />
          )}
          {playgroundOpened && <div className="page-slot" hidden={view !== "playground"}><Suspense fallback={<div className="surface-loading">正在開啟自由查詢…</div>}>
            <Playground key={`${auth.session.user.id}:${workspaceId}`} workspaceId={workspaceId} tables={tables} apiFetch={apiFetch}
              draft={playgroundDrafts[workspaceId] || { sql: "", note: "" }}
              setDraft={(draft) => setPlaygroundDrafts((current) => ({ ...current, [workspaceId]: draft }))}
              demoStep={playgroundStep} initialLog={playgroundLog} onDataChanged={refreshData} onOpenDemo={() => setView("demo")} />
          </Suspense></div>}
          {view === "demo" && <Suspense fallback={<div className="surface-loading">正在開啟專案 Demo…</div>}>
            <ProjectDemo project={project} error={projectError} onRetry={loadProject} apiFetch={apiFetch} logs={logs} onTry={tryDemo} />
          </Suspense>}
          {workflowOpened && <div hidden={view !== "workflow"}><Suspense fallback={<div className="surface-loading">正在開啟工作任務包…</div>}>
            <Workflow key={auth.session.user.id} apiFetch={apiFetch} onDataChanged={refreshData} onLegacyDemo={() => setView("demo")} initialLog={workflowLog} />
          </Suspense></div>}
          {integratedOpened && <div className="integrated-slot" hidden={view !== "integrated"}><Suspense fallback={<div className="surface-loading">正在開啟分析師工作室…</div>}>
            <IntegratedCourse key={auth.session.user.id} apiFetch={apiFetch} onDataChanged={refreshData} onLegacy={openWorkflow} onLegacySql={resume} initialLog={integratedLog} activityRequest={activityRequest} tables={tables} />
          </Suspense></div>}
        </>
      )}
    </div></AccountDraftProvider>
  );
}
