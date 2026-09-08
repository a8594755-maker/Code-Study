export class SupabaseHttpError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = "SupabaseHttpError";
    this.status = status;
    this.payload = payload;
    this.code = payload?.code || "SUPABASE_HTTP_ERROR";
  }
}

export function createSupabaseRest({ url, anonKey }) {
  const baseUrl = url.replace(/\/$/, "");

  async function request(path, { token, method = "GET", body, headers = {} } = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      signal: AbortSignal.timeout(12000),
      method,
      headers: {
        apikey: anonKey,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    const text = await response.text();
    let payload = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }

    if (!response.ok) {
      const message =
        payload?.message || payload?.msg || payload?.error_description || payload?.error ||
        `Supabase request failed (${response.status}).`;
      throw new SupabaseHttpError(message, response.status, payload);
    }

    return payload;
  }

  return {
    getUser(token) {
      return request("/auth/v1/user", { token });
    },
    rpc(name, args, token) {
      return request(`/rest/v1/rpc/${encodeURIComponent(name)}`, {
        token,
        method: "POST",
        body: args,
      });
    },
    select(table, query, token, headers) {
      return request(`/rest/v1/${table}?${query}`, { token, headers });
    },
    insert(table, rows, token) {
      return request(`/rest/v1/${table}`, {
        token,
        method: "POST",
        body: rows,
        headers: { Prefer: "return=representation" },
      });
    },
    upsert(table, rows, token, conflictColumns) {
      const query = conflictColumns
        ? `?on_conflict=${encodeURIComponent(conflictColumns)}`
        : "";
      return request(`/rest/v1/${table}${query}`, {
        token,
        method: "POST",
        body: rows,
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      });
    },
    update(table, filters, values, token) {
      return request(`/rest/v1/${table}?${filters}`, {
        token,
        method: "PATCH",
        body: values,
        headers: { Prefer: "return=representation" },
      });
    },
  };
}
