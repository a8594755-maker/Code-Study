import serverless from "serverless-http";

import { app } from "../../server/index.js";

// ZIP must remain binary through Lambda/Netlify; the default UTF-8 conversion
// corrupts archives even when the download begins with the correct PK bytes.
export const handler = serverless(app, { binary: ["application/zip", "application/octet-stream"] });
