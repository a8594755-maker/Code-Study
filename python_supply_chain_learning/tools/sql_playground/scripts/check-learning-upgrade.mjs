// Explicit, bounded live QA. Uses only disposable accounts, never a learner account.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import dotenv from 'dotenv';
import { getIntegratedActivity } from '../server/integrated-catalog.js';
import { readEvents } from '../src/tutor-protocol.js';
dotenv.config({ quiet: true });
const origin = process.argv[2];
if (!/^https?:\/\/(127\.0\.0\.1:\d+|[a-z0-9-]+--supply-sql-lab-a8594755\.netlify\.app)$/.test(origin || '')) throw new Error('Only local or this site Preview allowed');
const accounts = [];
try {
  for (let i = 0; i < 2; i++) {
    const user = JSON.parse(execFileSync('node', ['scripts/workflow-qa-account.mjs', 'create'], { encoding: 'utf8' })); accounts.push(user);
    const res = await fetch(`${process.env.SUPABASE_URL}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: process.env.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, password: user.password }) });
    assert.equal(res.status, 200); user.token = (await res.json()).access_token;
  }
  async function api(path, body, { expected = 200, method = body ? 'POST' : 'GET', user = 0 } = {}) {
    const res = await fetch(origin + path, { method, headers: { Authorization: 'Bearer ' + accounts[user].token, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(65000) });
    assert.equal(res.status, expected, `${path}: ${res.status}`);
    if (res.headers.get('content-type')?.includes('text/event-stream')) {
      let done, deltas = 0; await readEvents(res.body, (event) => { if (event.type === 'error') throw new Error(event.error); if (event.type === 'answer') deltas++; if (event.type === 'done') done = event; });
      assert.ok(done?.message && deltas); assert.equal(done.message.failed, false); return done.message;
    }
    return res.json();
  }
  const key = '/api/drafts/playground:free', payload = { revision: 0, body: { sql: 'SELECT * FROM olist.sellers_raw LIMIT 3;', note: '尚未執行' } };
  assert.equal((await api(key)).draft, null);
  const saved = await api(key, payload, { method: 'PUT' }); assert.equal(saved.draft.revision, 1);
  assert.equal((await api(key, payload, { method: 'PUT' })).draft.revision, 1, 'uncertain retries are idempotent');
  const conflict = await api(key, { ...payload, body: { sql: 'different' } }, { method: 'PUT', expected: 409 }); assert.equal(conflict.conflict, true);
  assert.equal((await api(key, undefined, { user: 1 })).draft, null);
  await api(key, { revision: 0, body: { sql: 'other account' } }, { method: 'PUT', user: 1 });
  assert.equal((await api(key)).draft.body.sql, payload.body.sql);
  const direct = await fetch(`${process.env.SUPABASE_URL}/rest/v1/sql_playground_drafts?select=workspace_key&user_id=eq.${accounts[0].id}`, { headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + accounts[1].token } });
  assert.equal(direct.status, 200); assert.deepEqual(await direct.json(), [], 'RLS isolates direct REST, not just Express');
  console.log('PASS real account draft save / retry / conflict / cross-account RLS');
  const ids = ['studio-u1-count', 'studio-u1-review-catalog', 'studio-u1-review-sample', 'studio-u1-review-count'];
  for (const id of ids) {
    const a = getIntegratedActivity(id);
    const result = await api(`/api/workflow/${id}/sql`, { sql: a.reference, datasetName: 'main', studyMode: a.mode });
    assert.equal(result.assessment.state, 'matched'); assert.equal(result.logSaved, true); assert.equal(result.truncated, false);
    console.log(`PASS real SQL ${id}: ${result.row_count} rows`);
  }
  const id = 'studio-u1-s2';
  const failed = await api(`/api/workflow/${id}/sql`, { sql: 'SELECT * FROM orders_raw LIMIT 5;', datasetName: 'main', studyMode: 'practice' }, { expected: 400 });
  assert.ok(failed.logId);
  const catalog = await api('/api/integrated'); assert.ok(catalog.summary.reviewQueue.some((q) => q.concept === 'count'));
  const exported = await api('/api/export?scope=all&format=json');
  assert.equal(exported.drafts.length, 1); assert.equal(exported.drafts[0].evidence, 'unexecuted_draft_not_completion');
  assert.equal(exported.attempts.some((a) => a.sql_text === 'other account'), false);
  console.log('PASS error-to-transfer review and unexecuted draft export');
  if (process.argv.includes('--ai')) {
    const scope = { surface: 'workflow', id, language: 'sql', datasetName: 'main', studyMode: 'practice' }, threadId = randomUUID();
    const turn = (message, draft = '', logId = null) => api('/api/editor-tutor/stream', { scope, threadId, requestId: randomUUID(), mode: 'chat', message, draft, logId });
    const diagnosis = await turn('這是我的錯誤，請幫我修正目前 SQL。先指出真正錯在哪，為什麼，提供最小修正版並說明如何驗證；不要直接換成本題計數答案。', 'SELECT * FROM orders_raw LIMIT 5;', failed.logId);
    assert.ok(diagnosis.edit, diagnosis.editWarning || diagnosis.content); assert.match(diagnosis.edit.code, /olist\.orders_raw/);
    const fixed = await api(`/api/workflow/${id}/sql`, { sql: diagnosis.edit.code, datasetName: 'main', studyMode: 'practice' });
    assert.equal(fixed.row_count, 5); assert.equal(fixed.assessment.state, 'needs_revision');
    console.log('REAL TEACHING — error, minimal fix, task boundary:\n' + diagnosis.content);
    const limits = await turn('我理解完整表名了。那 SELECT COUNT(*) AS order_rows FROM olist.orders_raw LIMIT 5; 會只數五筆嗎？請先直接回答，舉三列的小例子，再教我一個驗證方法。');
    assert.match(limits.content, /LIMIT/); assert.match(limits.content, /COUNT/);
    console.log('REAL TEACHING — COUNT and LIMIT:\n' + limits.content);
    const nulls = await turn('再換一個微型表：order_id 三列是 A、A、NULL。COUNT(*)、COUNT(order_id)、COUNT(DISTINCT order_id) 各是多少？總列數減不同訂單數的差額能全部叫重複嗎？');
    assert.match(nulls.content, /NULL/); assert.match(nulls.content, /DISTINCT/);
    console.log('REAL TEACHING — NULL vs duplicate:\n' + nulls.content);
    console.log('REVIEW REQUIRED: read all answers for directness, correctness, one actionable verification, no invented evidence. Regex checks alone are not teaching quality certification.');
  }
} finally {
  for (const qa of accounts) execFileSync('node', ['scripts/workflow-qa-account.mjs', 'delete', qa.id], { stdio: ['ignore', 'pipe', 'pipe'] });
  console.log('CLEANUP exact temporary accounts and records.');
}
