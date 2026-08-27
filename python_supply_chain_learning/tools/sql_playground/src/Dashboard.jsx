function Metric({ label, value, note }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

export default function Dashboard({ data, chapters, onResume, onOpenQuestion, onExport }) {
  if (!data) {
    return <div className="surface-loading">正在整理你的學習證據…</div>;
  }

  const maxActivity = Math.max(...data.activity.map((day) => day.attempts), 1);

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <span className="micro-label">ENTRY-LEVEL READINESS</span>
          <h1>不是看完課程，<br />是累積可以證明的能力。</h1>
          <p>
            每個綠色進度都來自一次正確查詢、一次資料驗證，以及你自己寫下的商業解釋。
          </p>
          <div className="hero-actions">
            <button className="primary-action" onClick={onResume}>繼續目前題目 →</button>
            <button className="secondary-action" onClick={() => onExport("today", "zip")}>下載今天 Log</button>
          </div>
        </div>
        <div
          className="readiness-ring"
          style={{ "--score": `${data.readiness.score * 3.6}deg` }}
          aria-label={`Entry-Level Readiness ${data.readiness.score}%`}
        >
          <div>
            <strong>{data.readiness.score}%</strong>
            <span>{data.readiness.status}</span>
          </div>
        </div>
      </section>

      <section className="metric-grid" aria-label="學習指標">
        <Metric label="執行次數" value={data.metrics.totalAttempts} note="所有 SQL attempts" />
        <Metric label="成功執行" value={data.metrics.successfulAttempts} note="包含尚未完全答對" />
        <Metric label="首答正確率" value={`${data.metrics.firstAttemptAccuracy}%`} note="不使用重跑修正" />
        <Metric label="近 14 天活躍" value={`${data.metrics.activeDays} 天`} note="有真正執行 SQL" />
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <span className="micro-label">FIVE-CHAPTER PATH</span>
            <h2>五章能力地圖</h2>
          </div>
          <span>{data.readiness.completedQuestions} / {data.readiness.totalQuestions} 題完成</span>
        </div>
        <div className="chapter-grid">
          {data.chapterProgress.map((chapter) => {
            const source = chapters.find((item) => item.id === chapter.id);
            const firstAvailable = source?.questions.find((item) => !item.locked && item.status !== "completed")
              || source?.questions.find((item) => !item.locked);
            return (
              <button
                key={chapter.id}
                className={`chapter-card ${chapter.locked ? "locked" : ""}`}
                disabled={chapter.locked || !firstAvailable}
                onClick={() => firstAvailable && onOpenQuestion(firstAvailable.id)}
              >
                <div className="chapter-card-top">
                  <span>0{chapter.order}</span>
                  <span>{chapter.locked ? "LOCKED" : `${chapter.percent}%`}</span>
                </div>
                <h3>{chapter.title}</h3>
                <p>{chapter.subtitle}</p>
                <div className="progress-track"><span style={{ width: `${chapter.percent}%` }} /></div>
                <small>{chapter.completed} / {chapter.total} 個能力證據</small>
              </button>
            );
          })}
        </div>
      </section>

      <section className="dashboard-two-column">
        <article className="dashboard-panel">
          <div className="section-heading compact">
            <div>
              <span className="micro-label">MASTERY</span>
              <h2>技能精熟度</h2>
            </div>
          </div>
          <div className="skill-list">
            {data.skills.length ? data.skills.map((skill) => (
              <div className="skill-row" key={skill.skill}>
                <div><span>{skill.skill}</span><strong>{skill.percent}%</strong></div>
                <div className="progress-track"><span style={{ width: `${skill.percent}%` }} /></div>
              </div>
            )) : <p className="empty-copy">完成第一題後，技能證據會出現在這裡。</p>}
          </div>
        </article>

        <article className="dashboard-panel">
          <div className="section-heading compact">
            <div>
              <span className="micro-label">ACTIVITY</span>
              <h2>最近 14 天執行量</h2>
            </div>
          </div>
          <div className="activity-chart" aria-label="最近十四天 SQL 執行量">
            {data.activity.map((day) => (
              <div className="activity-day" key={day.date} title={`${day.date}: ${day.attempts} 次`}>
                <span style={{ height: `${Math.max((day.attempts / maxActivity) * 100, day.attempts ? 8 : 2)}%` }} />
                <small>{day.date.slice(5)}</small>
              </div>
            ))}
          </div>
          <div className="error-patterns">
            <h3>目前最常見錯誤</h3>
            {data.errorPatterns.length ? data.errorPatterns.map((item) => (
              <div key={item.code}><code>{item.code}</code><span>{item.count} 次</span></div>
            )) : <p className="empty-copy">目前還沒有錯誤紀錄。</p>}
          </div>
        </article>
      </section>

      <section className="portfolio-strip">
        <div>
          <span className="micro-label">PORTFOLIO & JOB SIMULATION</span>
          <h2>Chapter 5 會把你的過程變成求職證據</h2>
          <p>完成需求拆解、KPI、驗證、主管摘要與最終 Case，下載檔會包含 SQL、錯誤修正與反思。</p>
        </div>
        <div className="portfolio-score">
          <strong>{data.readiness.completedSimulations}/6</strong>
          <span>工作模擬完成</span>
        </div>
      </section>
    </main>
  );
}
