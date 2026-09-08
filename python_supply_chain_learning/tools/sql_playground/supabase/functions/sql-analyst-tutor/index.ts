const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

const allowedModels = new Set([
  "gpt-5.6-luna",
  "gpt-5.4-mini",
  "gpt-5.4",
]);

function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), { status, headers: jsonHeaders });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return json(405, { error: { message: "Method not allowed.", code: "method_not_allowed" } });
  }

  const expectedProxySecrets = [
    Deno.env.get("TUTOR_PROXY_SECRET") || "",
    Deno.env.get("TUTOR_PROXY_SECRET_LOCAL") || "",
  ].filter(Boolean);
  const suppliedProxySecret = request.headers.get("x-tutor-proxy-secret") || "";
  if (!expectedProxySecrets.length || !expectedProxySecrets.includes(suppliedProxySecret)) {
    return json(401, { error: { message: "Tutor proxy authentication failed.", code: "proxy_auth_failed" } });
  }

  const openaiApiKey = Deno.env.get("OPENAI_API_KEY") || "";
  if (!openaiApiKey) {
    return json(503, { error: { message: "OPENAI_API_KEY is not configured.", code: "provider_not_configured" } });
  }

  let incoming: Record<string, unknown>;
  try {
    incoming = await request.json();
  } catch {
    return json(400, { error: { message: "Invalid JSON body.", code: "invalid_json" } });
  }

  const requestedModel = String(incoming.model || "gpt-5.6-luna");
  const model = allowedModels.has(requestedModel) ? requestedModel : "gpt-5.6-luna";
  const instructions = String(incoming.instructions || "").slice(0, 20_000);
  const input = String(incoming.input || "").slice(0, 60_000);
  if (!instructions || !input) {
    return json(400, { error: { message: "Tutor instructions and input are required.", code: "invalid_tutor_request" } });
  }

  const providerBody = {
    model,
    instructions,
    input,
    reasoning: { effort: "low" },
    max_output_tokens: Math.min(Math.max(Number(incoming.max_output_tokens) || 1_200, 200), 1_500),
    store: false,
    safety_identifier: String(incoming.safety_identifier || "supply-sql-user").slice(0, 100),
    prompt_cache_key: "supply-sql-analyst-tutor-v2",
    text: incoming.text,
  };

  try {
    const providerResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(providerBody),
      signal: AbortSignal.timeout(12_000),
    });
    const providerPayload = await providerResponse.text();
    return new Response(providerPayload, {
      status: providerResponse.status,
      headers: jsonHeaders,
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    return json(504, {
      error: {
        message: timedOut ? "OpenAI request timed out." : "OpenAI request failed.",
        code: timedOut ? "provider_timeout" : "provider_request_failed",
      },
    });
  }
});
