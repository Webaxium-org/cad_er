// Opt-in browser test against a client dev server on localhost:5194. API calls are mocked.
import assert from "node:assert/strict";
import { writeFile, unlink } from "node:fs/promises";
import puppeteer from "puppeteer-core";
import { pdfRendererConfig } from "../services/pdfExportRenderer.js";
const html = new URL("../../client/.tmp-pdf-export-ui.html", import.meta.url);
const jsx = new URL("../../client/.tmp-pdf-export-ui.jsx", import.meta.url);
const harness = `
import React from 'react';
import {createRoot} from 'react-dom/client';
import {configureStore} from '@reduxjs/toolkit';
import {Provider} from 'react-redux';
import {MemoryRouter, Routes, Route, Link} from 'react-router-dom';
import PdfExportProvider from './src/components/PdfExportProvider';
import {usePdfExports} from './src/utils/pdfExportContext';
import {axiosInstance} from './src/utils/config';
const load=()=>JSON.parse(localStorage.getItem('pdf-test-jobs')||'[]');
const storeJobs=jobs=>localStorage.setItem('pdf-test-jobs',JSON.stringify(jobs));
window.completeExport=()=>{storeJobs(load().map(job=>({...job,status:'completed',progress:100,message:'PDF ready to download'})));document.dispatchEvent(new Event('visibilitychange'));};
axiosInstance.defaults.adapter=async config=>{
 let jobs=load(),data;
 if(config.method==='post') {const job={id:String(Date.now()),title:'Mock survey PDF',status:'queued',message:'Queued for PDF generation...',progress:0,expiresAt:new Date(Date.now()+86400000).toISOString()};jobs.push(job);storeJobs(jobs);data={job};}
 else if(config.method==='patch'){const action=JSON.parse(config.data).action;jobs=action==='dismissed'?jobs.filter(job=>!config.url.includes(job.id)):jobs.map(job=>config.url.includes(job.id)?{...job,downloadedAt:new Date().toISOString()}:job);storeJobs(jobs);data={success:true};}
 else if(config.url.endsWith('/download')){localStorage.setItem('pdf-test-downloads',String(Number(localStorage.getItem('pdf-test-downloads')||0)+1));data=new Blob(['%PDF-1.7 test'],{type:'application/pdf'});}
 else data={jobs};
 return {data,status:200,statusText:'OK',headers:{},config};
};
function Start(){const {startExport}=usePdfExports();return <><button onClick={()=>startExport('survey',{})}>Start PDF</button><Link to='/other'>Another page</Link></>;}
createRoot(document.getElementById('root')).render(<Provider store={configureStore({reducer:()=>({user:{user:{_id:'test-owner',type:'Professional'}}})})}><MemoryRouter><PdfExportProvider><Routes><Route path='/' element={<Start/>}/><Route path='/other' element={<><h1>Another page</h1><Link to='/'>Back</Link></>}/></Routes></PdfExportProvider></MemoryRouter></Provider>);
`;
process.env.PDF_RENDER_ORIGIN ||= "http://127.0.0.1:5194";
let browser, testPage;
try {
  await writeFile(html, '<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module" src="/.tmp-pdf-export-ui.jsx"></script></body></html>');
  await writeFile(jsx, harness);
  browser = await puppeteer.launch({ executablePath: pdfRendererConfig().executablePath, headless: true });
  const page = await browser.newPage(), errors = [];
  testPage = page;
  page.on("pageerror", error => errors.push(error.message));
  const url = "http://127.0.0.1:5194/.tmp-pdf-export-ui.html";
  await page.goto(url);
  await page.waitForSelector("button");
  const click = async (text) => {
    await page.waitForFunction(value => [...document.querySelectorAll("button,a")].some(node => node.textContent.trim() === value), {}, text);
    await page.evaluate(value => [...document.querySelectorAll("button,a")].find(node => node.textContent.trim() === value).click(), text);
  };
  await click("Start PDF");
  await page.waitForFunction(() => document.body.innerText.includes("PREMIERING PROJECT"));
  await click("Minimize");
  await page.waitForFunction(() => document.body.innerText.includes("Continues if you close the app"));
  await click("Another page");
  assert.equal(await page.evaluate(() => !!document.querySelector("h1") && document.body.innerText.includes("Mock survey PDF")), true);
  await click("Expand");
  await page.waitForFunction(() => document.body.innerText.includes("PREMIERING PROJECT"));
  await click("Minimize");
  await page.evaluate(() => window.completeExport());
  await page.waitForFunction(() => Number(localStorage.getItem("pdf-test-downloads")) === 1);
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("pdf-test-jobs"))[0].downloadedAt);
  await page.reload();
  await page.waitForFunction(() => document.body.textContent.includes("Download PDF"));
  assert.equal(await page.evaluate(() => Number(localStorage.getItem("pdf-test-downloads"))), 1);
  await click("Dismiss");
  await click("Start PDF");
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("pdf-test-jobs")).length === 1);
  await page.evaluate(() => {const jobs=JSON.parse(localStorage.getItem('pdf-test-jobs'));jobs[0].status='completed';jobs[0].progress=100;jobs[0].message='PDF ready to download';localStorage.setItem('pdf-test-jobs',JSON.stringify(jobs));});
  await page.close();
  const reopened = await browser.newPage();
  reopened.on("pageerror", error => errors.push(error.message));
  await reopened.setViewport({ width: 390, height: 844, isMobile: true });
  await reopened.goto(url);
  await reopened.waitForFunction(() => Number(localStorage.getItem("pdf-test-downloads")) === 2);
  assert.equal(await reopened.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  assert.deepEqual(errors, []);
  console.log("PASS: original modal, minimize/expand, navigation, automatic download, reload deduplication, reopening, mobile width; no browser errors.");
} catch (error) {
  if (testPage && !testPage.isClosed()) console.error(await testPage.evaluate(() => ({ url: location.href, body: document.body.innerText.slice(0, 1500), jobs: localStorage.getItem("pdf-test-jobs") })));
  throw error;
} finally {
  await browser?.close();
  await Promise.all([unlink(html).catch(() => {}), unlink(jsx).catch(() => {})]);
}
