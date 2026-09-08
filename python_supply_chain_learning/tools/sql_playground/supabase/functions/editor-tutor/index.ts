// Separate endpoint: Preview testing must not change the existing production tutor.
const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
const json = (status: number, message: string) => new Response(JSON.stringify({ error: { message } }), { status, headers });
Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, "Method not allowed");
  const secrets = [Deno.env.get("EDITOR_TUTOR_PROXY_SECRET")].filter(Boolean);
  if (!secrets.includes(req.headers.get("x-tutor-proxy-secret") || "")) return json(401, "Unauthorized");
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) return json(503, "Provider not configured");
  let body;
  try { const raw = await req.text(); if (raw.length > 60000) return json(413, "Input too large"); body = JSON.parse(raw); }
  catch { return json(400, "Invalid request"); }
  if (typeof body.input !== "string" || new TextEncoder().encode(body.input).length > 24500 || typeof body.instructions !== "string" || body.instructions.length > 12000) return json(400, "Invalid context");
  const allowed = ["gpt-5.6-luna", "gpt-5.4-mini", "gpt-5.4"];
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(42000), body: JSON.stringify({ model: allowed.includes(body.model) ? body.model : allowed[0], instructions: body.instructions,
        input: body.input, max_output_tokens: 3000, reasoning: { effort: "low" }, store: false, text: body.text,
        safety_identifier: String(body.safety_identifier || "learner").slice(0, 100), prompt_cache_key: "editor-tutor-v1" }),
    });
    const payload = await response.text();
    return new Response(payload, { status: response.status, headers });
  } catch { return json(504, "AI request timed out or failed"); }
});
