import test from 'node:test';
import assert from 'node:assert/strict';
import { createDraftStore } from '../src/draft-store.js';
import { validateDraft } from './drafts.js';
import { reviewQueue } from './review-queue.js';
import { getIntegratedActivity } from './integrated-catalog.js';
import { packTutorContext, resolveTutorScope } from './editor-tutor.js';
import { safeTutorMarkdown } from '../src/tutor-code.js';
const tick = () => new Promise((r) => setTimeout(r, 10));
test('fake table placeholders and wrong fragments are labeled non-executable without hiding original code', () => {
  const actual = '```sql\nSELECT COUNT(*) AS n\nFROM olist.orders_raw;\n```';
  assert.equal(safeTutorMarkdown(actual), actual);
  for (const sql of ['SELECT COUNT(*) FROM 這個小例子;', 'FROM customers_raw', 'DELETE FROM olist.orders_raw;']) {
    const formatted = safeTutorMarkdown('```sql\n' + sql + '\n```');
    assert.match(formatted, /不能直接在本站執行/); assert.match(formatted, /```text/); assert.ok(formatted.includes(sql));
  }
});
function service() {
  let row = null, fail = false; const calls = [];
  return { calls, setFail(v) { fail = v; }, setRow(v) { row = v; }, row: () => row,
    async request(url, options = {}) {
      calls.push({ url, ...options });
      if (fail) throw new Error('offline');
      if (options.method !== 'PUT') return Response.json({ draft: row });
      const { body, revision } = JSON.parse(options.body);
      if (JSON.stringify(row?.body) === JSON.stringify(body)) return Response.json({ saved: true, draft: row });
      if ((row?.revision || 0) !== revision) return Response.json({ conflict: true, draft: row }, { status: 409 });
      row = { body, revision: revision + 1, updated_at: new Date().toISOString() };
      return Response.json({ saved: true, draft: row });
    } };
}
test('draft validation rejects wrong scopes, oversized input and secrets without rewriting learner code', () => {
  validateDraft('studio:studio-u1-p', { revision: 0, body: { code: 'result = df.copy()' } });
  for (const args of [['public:all'], ['studio:x', { revision: -1, body: {} }], ['chat:x', { revision: 0, body: { question: 'sk-proj-' + 'x'.repeat(25) } }], ['studio:x', { revision: 0, body: { code: '字'.repeat(30000) } }]]) assert.throws(() => validateDraft(...args));
});
test('account drafts survive page subscriptions; history never overwrites a saved cloud draft', async () => {
  const backend = service(); backend.setRow({ body: { code: 'cloud' }, revision: 3, updated_at: new Date().toISOString() });
  const s = createDraftStore(backend.request, 100000), e = s.get('studio:x', { code: '' });
  const off = s.subscribe(e, () => {}); await tick();
  s.initialize(e, { code: 'old executed SQL' }); assert.equal(e.state.body.code, 'cloud');
  s.set(e, { code: 'my unsent changes' }); off(); await s.flush();
  assert.equal(backend.row().body.code, 'my unsent changes'); assert.equal(s.unsaved().length, 0);
  assert.equal(s.get('studio:x'), e); s.close();
});
test('two tabs conflict rather than overwrite; explicit local resolution retries with cloud revision', async () => {
  const b = service(), a = createDraftStore(b.request, 100000), c = createDraftStore(b.request, 100000);
  const ea = a.get('playground:free', { sql: '' }), ec = c.get('playground:free', { sql: '' });
  a.subscribe(ea, () => {}); c.subscribe(ec, () => {}); await tick();
  a.set(ea, { sql: 'first' }); await a.flush(); c.set(ec, { sql: 'second' });
  assert.equal(await c.flush(), false); assert.equal(ec.state.status, 'conflict'); assert.equal(b.row().body.sql, 'first');
  c.resolve(ec, false); assert.equal(await c.flush(), true); assert.equal(b.row().body.sql, 'second'); a.close(); c.close();
});
test('offline drafts remain dirty, retry works, loading failure does not cause automatic network loops', async () => {
  const b = service(); b.setFail(true); const s = createDraftStore(b.request, 100000), e = s.get('chat:x', { question: '' });
  s.subscribe(e, () => {}); await tick(); s.subscribe(e, () => {}); await tick(); assert.equal(b.calls.length, 1);
  s.set(e, { question: 'still here' }); assert.equal(await s.flush(), false);
  b.setFail(false); await s.retry(e); await s.flush(); assert.equal(b.row().body.question, 'still here'); s.close();
});
test('typing before a late cloud load keeps both versions for comparison; no execution requests', async () => {
  let resolve; const s = createDraftStore(() => new Promise((r) => { resolve = r; }), 100000), e = s.get('studio:x', { code: '' });
  s.subscribe(e, () => {}); s.set(e, { code: 'typed while loading' });
  resolve(Response.json({ draft: { body: { code: 'remote' }, revision: 2 } })); await tick();
  assert.equal(e.state.status, 'conflict'); assert.equal(e.state.body.code, 'typed while loading');
  s.resolve(e, true); assert.equal(e.state.body.code, 'remote'); s.close();
});
test('switching accounts closes the old queue and cannot send an old draft with a new identity', async () => {
  const b = service(), s = createDraftStore(b.request, 1), e = s.get('studio:x', {});
  s.subscribe(e, () => {}); await tick(); s.set(e, { code: 'private' }); s.close(); await tick();
  assert.equal(b.calls.some((r) => r.method === 'PUT'), false);
});
test('unit one teaches count before debugging and keeps valid COUNT with LIMIT distinct from a task mismatch', () => {
  const a = getIntegratedActivity('studio-u1-count'); assert.ok(a.onboarding.template && a.onboarding.names && a.onboarding.record);
  assert.match(getIntegratedActivity('studio-u1-s2').onboarding.record, /本身合法/);
  for (const id of ['studio-u1-count', 'studio-u1-s2', 'studio-u1-s3', 'studio-u1-p']) {
    const a = getIntegratedActivity(id), scope = resolveTutorScope({ surface: 'workflow', id, language: a.tool, datasetName: 'main', studyMode: a.mode });
    assert.deepEqual(packTutorContext({ scope, message: '解釋名稱從哪來' }).context.learningSupport, a.onboarding);
  }
});
test('review is due after 24h and is cleared only by a later correct transfer, not support or retrying the old task', () => {
  const original = { id: 'error', created_at: '2026-09-01T10:00:00Z', status: 'failed', validation: { mode: 'workflow_sql', missionId: 'studio-u1-s2' } };
  assert.equal(reviewQueue([original], Date.parse('2026-09-01T12:00:00Z'))[0].due, false);
  assert.equal(reviewQueue([original], Date.parse('2026-09-03T12:00:00Z'))[0].due, true);
  const success = { created_at: '2026-09-02T10:00:00Z', status: 'succeeded', validation: { mode: 'workflow_sql', missionId: 'studio-u1-review-count', assessment: { state: 'matched' } } };
  assert.deepEqual(reviewQueue([success, original]), []);
  assert.equal(reviewQueue([{ ...success, validation: { ...success.validation, mode: 'workflow_support' } }, original]).length, 1);
  assert.equal(reviewQueue([{ ...success, created_at: '2026-08-30T10:00:00Z' }, original]).length, 1);
});
