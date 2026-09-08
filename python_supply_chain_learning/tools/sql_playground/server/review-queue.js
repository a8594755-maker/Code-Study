// Suggestions from actual attempts, not an AI diagnosis or an independent pass.
const groups = [
  { concept: 'catalog', title: '名稱從目錄取得', sources: ['studio-u1-discover', 'studio-u1-schema', 'studio-u1-s1', 'studio-u1-columns'], prompt: '分清目錄欄名、業務表名與分組；這次換成客戶欄位。' },
  { concept: 'sample', title: '小樣本不是全表', sources: ['studio-u1-sample'], prompt: '換來源與樣本數，再確認輸出是明細，不是總數。' },
  { concept: 'count', title: '計數與資料粒度', sources: ['studio-u1-count', 'studio-u1-s2', 'studio-u1-s3'], prompt: '換成付款表，練習總列數；付款列數不等於訂單數。' },
];
export function reviewQueue(logs = [], now = Date.now()) {
  return groups.flatMap((group) => {
    const targetId = `studio-u1-review-${group.concept}`;
    const attempts = logs.filter((l) => l.validation?.mode === 'workflow_sql' && [...group.sources, targetId].includes(l.validation?.missionId));
    const errors = attempts.filter((l) => l.status === 'failed' || l.validation.assessment?.state === 'needs_revision').sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    if (!errors.length) return [];
    const last = errors[0];
    const reviewed = attempts.some((l) => l.validation.missionId === targetId && l.status === 'succeeded' && l.validation.assessment?.state === 'matched' && l.created_at > last.created_at);
    if (reviewed) return [];
    const due = Date.parse(last.created_at) + 24 * 3600 * 1000;
    return [{ concept: group.concept, title: group.title, prompt: group.prompt, targetId, sourceLogId: last.id, originalActivityId: last.validation.missionId,
      dueAt: Number.isFinite(due) ? new Date(due).toISOString() : null, due: Number.isFinite(due) && now >= due,
      label: '根據未成功／待修正紀錄安排，並非已確認的誤解診斷' }];
  });
}
