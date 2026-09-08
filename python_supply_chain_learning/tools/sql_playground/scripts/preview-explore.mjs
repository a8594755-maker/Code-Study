// Local visual regression fixture ONLY. Never imported by the production app.
// No credentials, no Supabase requests and no account writes.
import http from "node:http";
import { build } from "esbuild";

const bundle = await build({
  stdin: { resolveDir: process.cwd(), sourcefile: "explore-fixture.jsx", loader: "jsx", contents: `
    import React, {useState} from "react";
    import {createRoot} from "react-dom/client";
    import Playground from "./src/Playground.jsx";
    import ProjectDemo from "./src/ProjectDemo.jsx";
    import {projectDemo} from "./server/project-demo.js";
    import "./src/styles.css";
    function Fixture() {
      const [view, setView] = useState("demo");
      const [draft, setDraft] = useState({sql:"", note:""});
      const [step, setStep] = useState(null);
      const [logs, setLogs] = useState([]);
      async function apiFetch(url, options={}) {
        if (url.endsWith("/report")) return new Response("UI fixture only; not live evidence");
        if (options.method === "PATCH") return Response.json({saved:true});
        const body=JSON.parse(options.body);
        const bad=body.sql === "SELECT FROM";
        const data={logId:"local-ui-fixture",logSaved:true,rows:[{qa_only:true,message:"本機 UI 測試資料；不是真實查詢"}],row_count:1,durationMs:0,truncated:false,tags:["SELECT"],error:"語法測試錯誤",code:"UI_TEST_ONLY"};
        setLogs([{id:data.logId,created_at:new Date().toISOString(),status:bad?"failed":"succeeded",validation:{mode:"project_demo",demoStepId:body.demoStepId},row_count:1}]);
        return Response.json(data,{status:bad?400:200});
      }
      return <><div style={{padding:8,textAlign:"center",background:"#655a25",color:"white"}}>LOCAL UI TEST · 使用測試資料，不連線、不寫入帳號</div>
        <header className="product-topbar"><div className="product-brand"><span>SQL</span><strong>Supply SQL Lab</strong></div><nav aria-label="測試導覽"><button>Dashboard</button><button>Learn</button><button onClick={()=>setView("playground")}>Playground</button><button onClick={()=>setView("demo")}>Project Demo</button><button>Query Log</button></nav><span>UI Test</span></header>
        {view === "demo" ? <ProjectDemo project={projectDemo} apiFetch={apiFetch} logs={logs} onTry={s=>{setStep(s);setDraft({sql:s.sql,note:""});setView("playground")}} /> : <Playground tables={[{name:"orders_raw",columns:[{name:"order_id",type:"text"},{name:"order_status",type:"text"}]}]} apiFetch={apiFetch} draft={draft} setDraft={setDraft} demoStep={step} onDataChanged={()=>{}} onOpenDemo={()=>setView("demo")} />}
      </>;
    }
    createRoot(document.getElementById("root")).render(<Fixture/>);
  ` },
  bundle: true, write: false, outdir: "fixture-output", format: "esm", jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
});
const js = bundle.outputFiles.find((file) => file.path.endsWith(".js")).text;
const css = bundle.outputFiles.find((file) => file.path.endsWith(".css")).text;
const server = http.createServer((request, response) => {
  const type = request.url === "/ui.js" ? "text/javascript" : request.url === "/ui.css" ? "text/css" : "text/html";
  response.setHeader("Content-Type", `${type};charset=utf-8`);
  response.end(request.url === "/ui.js" ? js : request.url === "/ui.css" ? css : '<!doctype html><html lang="zh-Hant"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Local exploration UI test</title><link rel="stylesheet" href="/ui.css"><div id="root"></div><script type="module" src="/ui.js"></script></html>');
});
server.listen(4174, "127.0.0.1", () => console.log("UI-only fixture ready at http://127.0.0.1:4174/"));
process.on("SIGINT", () => server.close());
