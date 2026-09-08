import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createDraftStore } from './draft-store.js';
import { downloadText } from './download.js';
const DraftContext = createContext(null);
export function AccountDraftProvider({ apiFetch, children, storeRef }) {
  const api = useRef(apiFetch); api.current = apiFetch;
  const [store] = useState(() => createDraftStore((...args) => api.current(...args)));
  if (storeRef) storeRef.current = store;
  useEffect(() => {
    const warn = (event) => { if (store.unsaved().length) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => { window.removeEventListener('beforeunload', warn); };
  }, [store]);
  // Delayed disposal survives React's development effect replay.
  const dispose = useRef(null);
  useEffect(() => { clearTimeout(dispose.current); return () => { dispose.current = setTimeout(() => store.close(), 0); }; }, [store]);
  return <DraftContext.Provider value={store}>{children}</DraftContext.Provider>;
}
export function useAccountDraft(key, initial) {
  const account = useContext(DraftContext);
  const [fallback] = useState(() => createDraftStore(async () => ({ ok: true, json: async () => ({ draft: null }) })));
  const store = account || fallback;
  const entry = store.get(key, initial);
  const state = useSyncExternalStore((fn) => store.subscribe(entry, fn), () => entry.state);
  return { ...state, set: (body) => store.set(entry, body), initialize: (body) => store.initialize(entry, body), retry: () => store.retry(entry), resolve: (remote) => store.resolve(entry, remote), key, enabled: Boolean(account) };
}
export function DraftStatus({ draft, compact = false }) {
  if (!draft.enabled) return null;
  const text = { loading: '正在讀取帳號草稿…', ready: draft.exists ? `草稿已存到帳號 · ${new Date(draft.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '尚無帳號草稿 · 開始編輯後自動保存', pending: '草稿尚未同步…', saving: '正在儲存草稿…', error: '草稿尚未同步', conflict: '另一個分頁／裝置已有不同草稿' }[draft.status];
  return <div className={`draft-status ${compact ? 'compact' : ''}`}>
    <span role="status">{text}</span>
    {['error', 'conflict'].includes(draft.status) && <>
      {draft.error && <p role="alert">{draft.error}</p>}
      <button onClick={() => downloadText(JSON.stringify({ workspace: draft.key, savedAt: new Date().toISOString(), unexecuted: true, body: draft.body }, null, 2), 'learning-draft-backup.json', 'application/json')}>下載本機草稿</button>
      {draft.status === 'error' ? <button onClick={draft.retry}>重試同步</button> : <details><summary>比較並選擇版本（不執行程式）</summary><p>這一頁的草稿</p><pre>{JSON.stringify(draft.body, null, 2)}</pre><p>帳號上的草稿</p><pre>{JSON.stringify(draft.remote?.body || {}, null, 2)}</pre><button onClick={() => draft.resolve(true)}>載入帳號版本</button><button onClick={() => draft.resolve(false)}>保留這一頁，更新帳號草稿</button></details>}
    </>}
    {!compact && <small>僅保存草稿，不代表執行或完成；不會送給 AI。勿輸入密碼或金鑰。</small>}
  </div>;
}
