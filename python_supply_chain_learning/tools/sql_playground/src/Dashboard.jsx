import { PageHeading } from "./ui-components.jsx";
import { courseAudit } from "../server/course-audit.js";
import { releaseLabel, previewHome, releaseHomeLabel, releaseNotice } from './release.js';

export default function Dashboard({ data, catalog, onResume, onOpenActivity, onWorkflow, onHistory }) {
  if (!data || !catalog) return <div className="surface-loading">正在整理你的學習紀錄…</div>;
  const summary = catalog.summary;
  const audit = courseAudit(catalog);
  const next = catalog.activities.find((a) => a.tool !== "powerbi" && !summary.activities[a.id]?.matched) || catalog.activities[0];
  const helped = Object.values(summary.activities).filter((a) => a.helped).length;
  return <main className="app-page overview-page">
    <PageHeading title="學習總覽" description="先找下一個小步驟，再回到工作室練習。" />
    <p className="app-meta">目前版本：{releaseLabel} · <a href={previewHome}>{releaseHomeLabel} ↗</a> · {releaseNotice}</p>
    <section className="overview-resume" aria-label="下一步學習">
      <div><span className="app-meta">CH1 · 建議練習</span><h2>{next.title}</h2><p>結果符合後，還要能解釋與完成新條件；不以執行次數代替掌握。</p></div>
      <div className="app-page-actions"><button className="primary-action" onClick={() => onOpenActivity(next.id)}>開啟這個活動 →</button><button className="secondary-action" onClick={onWorkflow}>回到目前工作區</button></div>
    </section>
    <dl className="overview-metrics" aria-label="整合課程紀錄">
      <div><dt>SQL／pandas 結果符合</dt><dd>{summary.matched} <small>/ {summary.totalExecutable}</small></dd><p>不是獨立能力認證</p></div>
      <div><dt>使用過教學協助</dt><dd>{helped}</dd><p>有看示範或家教回覆的活動</p></div>
      <div><dt>Power BI 已提交</dt><dd>{summary.pendingBi} <small>/ {audit.counts.powerbi}</small></dd><p>外部檔案與操作仍待審查</p></div>
    </dl>
    <p className="app-meta">{catalog.summaryWindow} <button className="text-action" onClick={onHistory}>查看學習紀錄 →</button></p>
    <section className="overview-section" aria-label="從錯誤再練一次"><h2>從錯誤再練一次</h2>
      <p>先從第一單元試行：同一觀念換資料再做，不重播原答案、不扣分；下次回來可再練。</p>
      {summary.reviewQueue?.length ? <ul className="overview-units">{summary.reviewQueue.map((item) => <li key={item.concept}><div><strong>{item.title}</strong><p>{item.prompt}</p><small>{item.due ? '已到建議複習時間' : `可先練習 · 建議 ${item.dueAt ? new Date(item.dueAt).toLocaleString() : '下次'} 再試`}</small><small>{item.label}</small></div><button className="secondary-action" onClick={() => onOpenActivity(item.targetId)}>開啟變形題</button></li>)}</ul> : <p>目前沒有第一單元待複習項目；沒有錯誤紀錄不代表已掌握。</p>}
      <small>變形題結果符合後移出待練清單；提示紀錄仍保留，不會自動判定獨立能力。</small>
    </section>
    <section className="overview-section" aria-labelledby="course-route-title">
      <h2 id="course-route-title">同一條學習路線</h2><p>三種工具依工作任務交錯學習。只有 CH1 有新版活動，後續章節尚未備齊。</p>
      <ol className="overview-chapters">{catalog.chapters.map((chapter, index) => <li key={chapter.id}>
        <div className="overview-chapter-heading"><span className="app-meta">CH{index + 1}</span><h3>{chapter.title}</h3><span className={`status-badge ${chapter.status === "pilot" ? "succeeded" : "needs-work"}`}>{chapter.status === "pilot" ? "可試學 · 未完整驗收" : "教材待擴充"}</span></div>
        <p>{chapter.outcome}</p>
        <details><summary>{chapter.status === "pilot" ? "查看六單元與活動" : "查看預定能力與交付"}</summary>
          <p><strong>工具分工：</strong>{chapter.tools}</p><p><strong>完成證據：</strong>{chapter.evidence}</p>
          {chapter.status === "pilot" && <ul className="overview-units">{catalog.units.map((unit) => {
            const activities = catalog.activities.filter((a) => a.unitId === unit.id);
            const first = activities.find((a) => a.tool !== "powerbi" && !summary.activities[a.id]?.matched) || activities[0];
            return <li key={unit.id}><div><strong>{unit.title}</strong><small>{activities.length} 個活動 · {activities.filter((a) => summary.activities[a.id]?.matched).length} 個結果符合</small></div><button className="secondary-action" onClick={() => onOpenActivity(first.id)}>開啟單元</button></li>;
          })}</ul>}
        </details>
      </li>)}</ol>
    </section>
    <section className="overview-section" aria-labelledby="course-audit-title">
      <h2 id="course-audit-title">課程離你的目標還差什麼？</h2>
      <p className="app-notice">{audit.verdict}</p>
      <p>目前是 {audit.counts.sql} 個 SQL、{audit.counts.python} 個 pandas、{audit.counts.powerbi} 個 Power BI 活動；活動數不是已驗證的學習時數。</p>
      <dl className="overview-audit">{audit.criteria.map((item) => <div key={item.id}><dt>{item.title}<span className="status-badge needs-work">{item.state}</span></dt><dd><p>{item.present}</p><p><strong>仍需補上：</strong>{item.gap}</p></dd></div>)}</dl>
      <details><summary>100 小時與完成標準如何判定？</summary><p>{catalog.completion}</p><p>每個核心能力都需要示範、不同條件的練習、除錯與無提示驗收；再放進完整專案重做。需以實際試學修訂份量，不能用題數乘設定分鐘，也不能保證就業。</p><p>能力範圍對照官方教材，不等於本課已涵蓋整份教材或認證：</p><ul>{catalog.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a></li>)}</ul></details>
    </section>
    <details className="overview-section legacy-reference"><summary>原有 SQL 補強紀錄（與新版分開）</summary><p>保留既有 {data.readiness.completedQuestions} / {data.readiness.totalQuestions} 題的紀錄，不加入新版進度，也不代表就業準備度。</p><button className="secondary-action" onClick={onResume}>開啟原有 SQL 補強</button></details>
  </main>;
}
