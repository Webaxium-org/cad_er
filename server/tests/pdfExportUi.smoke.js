// Opt-in browser test against a client dev server on localhost:5194.
import assert from "node:assert/strict";
import { writeFile, unlink, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import puppeteer from "puppeteer-core";
import { pdfRendererConfig } from "../services/pdfExportRenderer.js";
import { pdfExportSnapshot } from "./fixtures/pdfExportSnapshot.js";
const html = new URL("../../client/.tmp-pdf-export-ui.html", import.meta.url);
const jsx = new URL("../../client/.tmp-pdf-export-ui.jsx", import.meta.url);
const snapshot = pdfExportSnapshot();
snapshot.allCs = Array.from({ length: 8 }, () => snapshot.allCs[0]);
const harness = `
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,Routes,Route,Link} from 'react-router-dom';
import PdfExportProvider from './src/components/PdfExportProvider';
import {usePdfExports} from './src/utils/pdfExportContext';
import Chart from './src/pages/survey/components/CrossSectionChartV2';
import LsChart from './src/pages/survey/components/CrossSectionChart';
import {axiosInstance} from './src/utils/config';
const snapshot=${JSON.stringify(snapshot)};
window.apiRequests=0;
axiosInstance.defaults.adapter=async()=>{window.apiRequests++;throw Error('Server PDF API must not be called');};
window.holdEncoding=true;
const original=HTMLCanvasElement.prototype.toBlob;
HTMLCanvasElement.prototype.toBlob=function(callback,...args){return original.call(this,blob=>{
 if(window.failNextEncoding){window.failNextEncoding=false;callback(null);}
 else if(window.holdEncoding) window.releaseEncoding=()=>{window.holdEncoding=false;callback(blob);};
 else setTimeout(()=>callback(blob),150);
},...args);};
function Start(){const {startExport}=usePdfExports();const [error,setError]=useState('');return <>
 <button onClick={()=>{startExport('survey',snapshot).catch(e=>setError(e.message));startExport('survey',snapshot).catch(e=>setError(e.message));}}>Start PDF</button>
 <Link to='/other'>Another page</Link><p role='alert'>{error}</p>
 <div style={{width:760}}>
 {snapshot.lsPages.map((p,i)=><div key={'ls'+i} className='pdf-chart-item'><LsChart selectedCs={p.section} chartOptions={snapshot.chartOptions} showLevelBands/></div>)}
 {snapshot.allCs.map((cs,i)=><div key={i} className='pdf-chart-item'><Chart selectedCs={cs} chartOptions={cs.specificOptions} showLevelBands/></div>)}
 </div></>;}
createRoot(document.getElementById('root')).render(<BrowserRouter><PdfExportProvider><Routes>
 <Route path='/other' element={<><h1>Other page</h1><Link to='/.tmp-pdf-export-ui.html'>Back</Link></>}/>
 <Route path='*' element={<Start/>}/>
</Routes></PdfExportProvider></BrowserRouter>);
`;
process.env.PDF_RENDER_ORIGIN ||= "http://127.0.0.1:5194";
let browser, downloadDir;
try {
  await writeFile(html, '<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module" src="/.tmp-pdf-export-ui.jsx"></script></body></html>');
  await writeFile(jsx, harness);
  downloadDir = await mkdtemp(join(tmpdir(), "cader-browser-pdf-"));
  browser = await puppeteer.launch({ executablePath: pdfRendererConfig().executablePath, headless: true });
  const page = await browser.newPage(), errors = [], downloads = [];
  page.on("pageerror", error => errors.push(error.message));
  const session = await browser.target().createCDPSession();
  await session.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: downloadDir, eventsEnabled: true });
  session.on("Browser.downloadProgress", value => { if (value.state === "completed") downloads.push(value); });
  await page.goto("http://127.0.0.1:5194/.tmp-pdf-export-ui.html");
  await page.waitForFunction(() => document.querySelectorAll('.js-plotly-plot').length === 9 && [...document.querySelectorAll('.js-plotly-plot')].every(chart => chart._fullLayout?._size?.w > 0));
  await page.click("button");
  await page.waitForFunction(() => typeof window.releaseEncoding === 'function');
  assert.equal(await page.evaluate(() => document.body.innerText.includes("Please do not close or refresh this window")), true);
  assert.equal(await page.evaluate(() => document.body.innerText.includes("Minimize")), false);
  const unloadPrevented = () => page.evaluate(() => {const event=new Event('beforeunload',{cancelable:true});window.dispatchEvent(event);return event.defaultPrevented;});
  assert.equal(await unloadPrevented(), true);
  await page.keyboard.press("Escape");
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.querySelector('[aria-label="PDF download progress"]').contains(document.activeElement)), true);
  await page.click("a");
  assert.equal(await page.evaluate(() => location.pathname), "/.tmp-pdf-export-ui.html");
  await page.evaluate(() => history.back());
  await page.waitForFunction(() => history.state?.pdfExportLock === true);
  assert.equal(await page.evaluate(() => location.pathname), "/.tmp-pdf-export-ui.html");
  await page.evaluate(() => window.releaseEncoding());
  await page.waitForFunction(() => document.body.innerText.includes("Estimated Time Left: ~"));
  await page.waitForFunction(() => !document.body.innerText.includes("PREMIERING PROJECT"));
  for (let i=0; i<50 && !downloads.length; i++) await new Promise(resolve=>setTimeout(resolve,100));
  assert.equal(downloads.length,1,"Repeated clicks must produce one download");
  const pdf=await readFile(join(downloadDir,"plotting-and-quantity-report.pdf"));
  assert.equal(pdf.subarray(0,5).toString(),"%PDF-");
  assert.equal((pdf.toString("latin1").match(/\/Type\s*\/Page\b/g)||[]).length,10);
  assert.equal(await unloadPrevented(),false);
  assert.equal(await page.evaluate(() => window.apiRequests),0);
  await page.click("a");
  await page.waitForSelector("h1");
  await page.click("a");
  await page.waitForSelector("button");
  await page.evaluate(() => {window.failNextEncoding=true;window.holdEncoding=false;});
  await page.click("button");
  await page.waitForFunction(() => document.querySelector('[role="alert"]').textContent.includes("Could not encode"));
  assert.equal(await unloadPrevented(),false);
  assert.equal(await page.$('[aria-label="PDF download progress"]'),null);
  assert.deepEqual(errors,[]);
  console.log("PASS: browser-generated 10-page PDF, no PDF API requests, no Minimize, visible warning and ETA, blocked mouse/keyboard/Back navigation, one download on repeated clicks, navigation restored after success and encoding failure.");
} finally {
  await browser?.close();
  await Promise.all([unlink(html).catch(()=>{}),unlink(jsx).catch(()=>{})]);
  if (downloadDir?.startsWith(join(tmpdir(),"cader-browser-pdf-"))) await rm(downloadDir,{recursive:true,force:true});
}
