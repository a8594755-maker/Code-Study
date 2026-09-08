import test from "node:test";
import assert from "node:assert/strict";
import { inflateRawSync } from "node:zlib";

test("actual Netlify handler returns base64 ZIP and every package entry inflates", async () => {
  process.env.NETLIFY = "true";
  process.env.SUPABASE_URL = "https://workflow-netlify-test.invalid";
  process.env.SUPABASE_ANON_KEY = `test.${Buffer.from(JSON.stringify({ role: "anon" })).toString("base64url")}.test`;
  const savedFetch = global.fetch;
  global.fetch = async () => Response.json({ id: "qa-netlify-user" });
  try {
    const { handler } = await import("../netlify/functions/api.js");
    const reply = await handler({ httpMethod: "GET", path: "/api/workflow/package", headers: { authorization: "Bearer qa" }, requestContext: { identity: { sourceIp: "127.0.0.1" } } }, {});
    assert.equal(reply.statusCode, 200); assert.equal(reply.isBase64Encoded, true);
    const zip = Buffer.from(reply.body, "base64");
    const end = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
    assert.ok(end > 0); const count = zip.readUInt16LE(end + 10); assert.equal(count, 97);
    let position = zip.readUInt32LE(end + 16);
    for (let i = 0; i < count; i++) {
      assert.equal(zip.readUInt32LE(position), 0x02014b50);
      const size = zip.readUInt32LE(position + 20), plainSize = zip.readUInt32LE(position + 24), method = zip.readUInt16LE(position + 10);
      const nameSize = zip.readUInt16LE(position + 28), extra = zip.readUInt16LE(position + 30), comment = zip.readUInt16LE(position + 32);
      const offset = zip.readUInt32LE(position + 42), name = zip.subarray(position + 46, position + 46 + nameSize).toString();
      const dataStart = offset + 30 + zip.readUInt16LE(offset + 26) + zip.readUInt16LE(offset + 28);
      const compressed = zip.subarray(dataStart, dataStart + size), plain = method === 8 ? inflateRawSync(compressed) : compressed;
      assert.equal(plain.length, plainSize, name);
      if (name.endsWith(".ipynb")) assert.equal(JSON.parse(plain.toString()).nbformat, 4);
      position += 46 + nameSize + extra + comment;
    }
  } finally { global.fetch = savedFetch; }
});
