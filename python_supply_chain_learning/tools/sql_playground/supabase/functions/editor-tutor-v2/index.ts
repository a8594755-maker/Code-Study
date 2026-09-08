// Preview-only protocol v2. Keep editor-tutor v1 available to the production UI.
Deno.serve(async (req) => {
  const secret = Deno.env.get("EDITOR_TUTOR_PROXY_SECRET"), key = Deno.env.get("OPENAI_API_KEY");
  const json = (error: string, status: number) => Response.json({ error }, { status });
  if (req.method !== "POST") return json("Method not allowed", 405);
  if (!secret || req.headers.get("x-tutor-proxy-secret") !== secret) return json("Unauthorized", 401);
  if (!key) return json("Provider unavailable", 503);
  try {
    const raw = await req.text();
    if (raw.length > 90000) return json("Request too large", 413);
    const b = JSON.parse(raw);
    if (!b.input || JSON.stringify(b.input).length > 56000 || typeof b.instructions !== "string" || b.instructions.length > 12000
      || !["gpt-5.6-luna", "gpt-5.4-mini", "gpt-5.4"].includes(b.model)) return json("Invalid request", 400);
    if (b.tools?.some((t: { name: string; type: string }) => t.type !== "function" || t.name !== "inspect_context")) return json("Unsupported tool", 400);
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(45000),
      body: JSON.stringify({ model: b.model, input: b.input, instructions: b.instructions, text: b.text,
        tools: b.tools, tool_choice: b.tool_choice, parallel_tool_calls: false, reasoning: { effort: "low" },
        stream: b.stream === true, store: false, max_output_tokens: 3000,
        safety_identifier: b.safety_identifier, prompt_cache_key: "editor-tutor-v2" }),
    });
    if (!response.ok) return json("Provider request failed", response.status === 429 ? 429 : 503);
    return new Response(response.body, { headers: { "Content-Type": b.stream ? "text/event-stream" : "application/json", "Cache-Control": "no-store" } });
  } catch (e) { return json("Provider request incomplete", e instanceof Error && e.name === "TimeoutError" ? 504 : 503); }
});
