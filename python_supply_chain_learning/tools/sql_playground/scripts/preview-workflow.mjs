// Explicit local UI fixture. Uses real browser pandas but mock account/SQL data.
// Not imported by the deployment; never calls Supabase or writes account data.
import http from "node:http";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";
const bundle = await build({ stdin: { resolveDir: process.cwd(), sourcefile: "workflow-fixture.jsx", loader: "jsx", contents: `
import React from 'react'; import {createRoot} from 'react-dom/client';
import Workflow from './src/Workflow.jsx'; import {workflowCatalog} from './server/workflow-catalog.js'; import {missionFixtures} from './server/workflow-notebooks.js'; import './src/styles.css';
const summary={submitted:0,total:15,sqlRuns:0,pandasRuns:0,note:'本機測試，不是真實帳號證據',missions:Object.fromEntries(workflowCatalog.missions.map(m=>[m.id,{submitted:false}]))};
async function apiFetch(url,options={}) {
 if(url==='/api/workflow') return Response.json({...workflowCatalog,summary});
 if(url.endsWith('/pandas/start')) return Response.json({logId:'fixture-only'});
 if(options.method==='PATCH') return Response.json({saved:true});
 if(url.endsWith('/sql')) { const body=JSON.parse(options.body),id=url.split('/')[3],mission=workflowCatalog.missions.find(m=>m.id===id); const data=missionFixtures(mission)[body.datasetName]; return Response.json({...data,row_count:data.rows.length,logId:'fixture-only',logSaved:true,resultDigest:'fixture-only',truncated:false}); }
 return Response.json({message:'本機 UI 測試，不是真實交付'});
}
createRoot(document.getElementById('root')).render(<><div style={{padding:8,textAlign:'center',background:'#6f5525',color:'white'}}>LOCAL UI TEST · 帳號與 SQL 使用測試資料；Python 真實執行</div><Workflow apiFetch={apiFetch} onDataChanged={()=>{}} onLegacyDemo={()=>{}} /></>);
` }, bundle: true, write: false, outdir: "fixture-output", format: "esm", jsx: "automatic", define: { "process.env.NODE_ENV": '"production"' } });
const js = bundle.outputFiles.find((f) => f.path.endsWith(".js")).text, css = bundle.outputFiles.find((f) => f.path.endsWith(".css")).text;
const worker = await readFile("public/pandas-worker.mjs", "utf8");
http.createServer((req, res) => {
  if (req.url === "/pandas-worker.mjs") { res.setHeader("Content-Type", "text/javascript"); res.setHeader("Content-Security-Policy", "default-src 'none'; script-src https://cdn.jsdelivr.net 'unsafe-eval' 'wasm-unsafe-eval'; connect-src https://cdn.jsdelivr.net; worker-src 'none'"); res.end(worker); return; }
  res.setHeader("Content-Type", req.url === "/ui.js" ? "text/javascript" : req.url === "/ui.css" ? "text/css" : "text/html");
  res.end(req.url === "/ui.js" ? js : req.url === "/ui.css" ? css : '<!doctype html><html lang="zh-Hant"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Workflow UI test</title><link rel="stylesheet" href="/ui.css"><div id="root"></div><script type="module" src="/ui.js"></script></html>');
}).listen(4175, "127.0.0.1", () => console.log("Workflow UI fixture http://127.0.0.1:4175"));
