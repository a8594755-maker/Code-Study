import { rateLimit } from 'express-rate-limit';
export function validateDraft(key, payload) {
  if (!/^(studio|playground|chat):[A-Za-z0-9_:.-]+$/.test(key) || key.length > 200) throw new Error('草稿工作區不合法。');
  if (payload === undefined) return;
  if (!Number.isInteger(payload.revision) || payload.revision < 0 || !payload.body || Array.isArray(payload.body) || typeof payload.body !== 'object') throw new Error('草稿格式不合法。');
  const text = JSON.stringify(payload.body);
  if (Buffer.byteLength(text) > 78000) throw new Error('草稿超過 78 KB，尚未保存；請先下載本機備份。');
  if (/sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}|sb_secret_[A-Za-z0-9_-]{15,}|eyJ[\w-]+\.[\w-]+\.[\w-]+|Bearer\s+[\w.-]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|postgres(?:ql)?:\/\/[^\s]+:[^\s]+@/i.test(text)) throw new Error('偵測到疑似金鑰或連線密碼，未保存。請移除秘密並輪替已暴露的憑證。');
}

export function registerDraftRoutes(app, { supabase, requireUser }) {
  const limiter = rateLimit({ windowMs: 60000, limit: 120, keyGenerator: (req) => req.user.id, message: { error: '草稿儲存過於頻繁，請稍後重試；內容仍留在本頁。' } });
  app.get('/api/drafts/:key', requireUser, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try { validateDraft(req.params.key); } catch (e) { return res.status(400).json({ error: e.message }); }
    try {
      const rows = await supabase.select('sql_playground_drafts', new URLSearchParams({ select: 'workspace_key,body,revision,updated_at', user_id: `eq.${req.user.id}`, workspace_key: `eq.${req.params.key}`, limit: '1' }).toString(), req.accessToken);
      res.json({ draft: rows[0] || null });
    } catch { res.status(503).json({ error: '帳號草稿讀取失敗。先不要關閉頁面，可以重試或下載本機草稿。' }); }
  });
  app.put('/api/drafts/:key', requireUser, limiter, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try { validateDraft(req.params.key, req.body); } catch (e) { return res.status(400).json({ error: e.message }); }
    try {
      const data = await supabase.rpc('sql_playground_save_draft', { p_key: req.params.key, p_body: req.body.body, p_revision: req.body.revision }, req.accessToken);
      res.status(data.conflict ? 409 : 200).json(data);
    } catch { res.status(503).json({ error: '帳號草稿儲存未確認。內容仍在本頁，請重試或下載備份。' }); }
  });
}
