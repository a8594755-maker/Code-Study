import { editorRuntime } from "../../server/editor-runtime.js";
import { registerEditorTutorRoutes } from "../../server/editor-tutor.js";

// Native Netlify Response streams; serverless-http buffers Express responses.
// Reuse the identical owner-scoped, rate-limited, idempotent turn service.
export function createChatHandler(runtime = editorRuntime()) {
  const { turn } = registerEditorTutorRoutes({ get() {}, post() {} }, runtime);
  return async (request) => {
    const headers = { "Cache-Control": "no-store", "Content-Type": "application/json" };
    if (request.method !== "POST") return new Response(JSON.stringify({ error: "只接受 POST" }), { status: 405, headers });
    if (!runtime.supabase) return new Response(JSON.stringify({ error: "登入服務尚未連線。" }), { status: 503, headers });
    const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) return new Response(JSON.stringify({ error: "請先登入。" }), { status: 401, headers });
    let user;
    try { user = await runtime.supabase.getUser(token); }
    catch { return new Response(JSON.stringify({ error: "登入已過期，請重新登入。" }), { status: 401, headers }); }
    let body;
    try {
      const raw = await request.text();
      if (new TextEncoder().encode(raw).length > 96000) throw new Error();
      body = JSON.parse(raw);
    } catch { return new Response(JSON.stringify({ error: "提問內容太長或格式不正確。" }), { status: 413, headers }); }
    const encoder = new TextEncoder();
    let closed = false;
    const stream = new ReadableStream({
      async start(controller) {
        const emit = (event) => { if (!closed) controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`)); };
        const response = {
          setHeader() {},
          status(code) { this.code = code; return this; },
          json(data) { emit({ type: this.code ? "error" : "done", ...data }); },
        };
        try {
          emit({ type: "status", text: "正在讀取這次草稿與執行紀錄…" });
          await turn({ body, user, accessToken: token, tutorEmit: emit }, response);
        } finally { if (!closed) { closed = true; controller.close(); } }
      },
      cancel() { closed = true; }, // Finish saving server-side; no automatic retry/charge.
    });
    return new Response(stream, { headers: { ...headers, "Content-Type": "text/event-stream; charset=utf-8", "X-Content-Type-Options": "nosniff" } });
  };
}
export default createChatHandler();
