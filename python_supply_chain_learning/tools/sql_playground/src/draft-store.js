// One account-owned in-memory queue, independent of mounted pages. No browser storage.
export function createDraftStore(request, delay = 900) {
  const entries = new Map(); let closed = false;
  function emit(e, patch) { e.state = { ...e.state, ...patch }; e.listeners.forEach((fn) => fn()); }
  async function json(key, options) {
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 12000);
    try {
      const r = await request(`/api/drafts/${encodeURIComponent(key)}`, { ...options, signal: controller.signal });
      const data = await r.json();
      if (!r.ok && r.status !== 409) throw new Error(data.error || '草稿同步失敗');
      return data;
    } finally { clearTimeout(timer); }
  }
  async function load(e) {
    if (closed || e.loading) return;
    e.loading = true; emit(e, { status: 'loading', error: '' });
    try {
      const data = await json(e.key);
      if (closed) return;
      e.revision = data.draft?.revision || 0; e.loaded = true;
      if (e.dirty && data.draft && JSON.stringify(data.draft.body) !== JSON.stringify(e.state.body)) emit(e, { status: 'conflict', remote: data.draft });
      else {
        if (!e.dirty) emit(e, { body: data.draft?.body || e.state.body });
        emit(e, { status: e.dirty ? 'pending' : 'ready', exists: Boolean(data.draft), updatedAt: data.draft?.updated_at });
        if (e.dirty) schedule(e);
      }
    } catch (err) { if (!closed) emit(e, { status: 'error', error: err.message }); }
    finally { e.loading = false; }
  }
  function schedule(e) { clearTimeout(e.timer); if (!closed) e.timer = setTimeout(() => save(e), delay); }
  async function save(e) {
    clearTimeout(e.timer);
    if (closed || !e.dirty || e.state.status === 'conflict') return;
    if (!e.loaded) { await load(e); return; }
    if (e.inflight) { await e.inflight; return; }
    const body = e.state.body;
    emit(e, { status: 'saving', error: '' });
    e.inflight = (async () => {
      try {
        const data = await json(e.key, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body, revision: e.revision }) });
        if (closed) return;
        if (data.conflict) { emit(e, { status: 'conflict', remote: data.draft }); return; }
        if (!data.saved || !data.draft) throw new Error('伺服器未確認草稿已保存');
        e.revision = data.draft.revision;
        e.dirty = JSON.stringify(body) !== JSON.stringify(e.state.body);
        emit(e, { status: e.dirty ? 'pending' : 'ready', exists: true, updatedAt: data.draft.updated_at });
        if (e.dirty) schedule(e);
      } catch (err) { if (!closed) emit(e, { status: 'error', error: err.message }); }
      finally { e.inflight = null; }
    })();
    await e.inflight;
  }
  const api = {
    get(key, initial = {}) {
      if (!entries.has(key)) entries.set(key, { key, state: { body: initial, status: 'loading', exists: false }, revision: 0, dirty: false, loaded: false, listeners: new Set() });
      return entries.get(key);
    },
    subscribe(e, fn) { e.listeners.add(fn); if (!e.started) { e.started = true; load(e); } return () => e.listeners.delete(fn); },
    set(e, value) {
      if (closed) return;
      const body = typeof value === 'function' ? value(e.state.body) : value;
      if (JSON.stringify(body) === JSON.stringify(e.state.body)) return;
      e.dirty = true; emit(e, { body, status: e.state.status === 'conflict' ? 'conflict' : e.loaded ? 'pending' : e.state.status });
      if (e.loaded && e.state.status !== 'conflict') schedule(e);
    },
    initialize(e, body) { if (e.loaded && !e.state.exists && !e.dirty) api.set(e, body); },
    retry(e) { return e.loaded ? save(e) : load(e); },
    resolve(e, useRemote) {
      if (e.state.status !== 'conflict') return;
      const remote = e.state.remote; e.revision = remote?.revision || 0;
      e.dirty = !useRemote;
      emit(e, { body: useRemote ? remote?.body || {} : e.state.body, remote: null, status: useRemote ? 'ready' : 'pending', exists: Boolean(remote), updatedAt: remote?.updated_at });
      if (!useRemote) schedule(e);
    },
    unsaved() { return [...entries.values()].filter((e) => e.dirty || e.state.status === 'conflict'); },
    async flush() {
      for (const e of entries.values()) {
        if (e.inflight) await e.inflight;
        if (e.dirty) await save(e);
      }
      return api.unsaved().length === 0;
    },
    close() { closed = true; entries.forEach((e) => clearTimeout(e.timer)); },
  };
  return api;
}
