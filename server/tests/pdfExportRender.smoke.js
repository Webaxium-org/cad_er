// Opt-in integration check: start the client on localhost:5194, then run this file.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderPdfSnapshot, pdfRendererConfig } from "../services/pdfExportRenderer.js";
import { pdfExportSnapshot } from "./fixtures/pdfExportSnapshot.js";
process.env.PDF_RENDER_ORIGIN ||= "http://127.0.0.1:5194";
const chunks = [], progress = [];
const snapshot = pdfExportSnapshot();
if (process.env.PDF_SMOKE_CS_COUNT) snapshot.allCs = Array.from({ length: Number(process.env.PDF_SMOKE_CS_COUNT) }, (_, index) => ({ ...snapshot.allCs[index % snapshot.allCs.length], chainage: `Section ${index + 1}` }));
if (process.env.PDF_SMOKE_CHART_WIDTH) snapshot.chartWidth = Number(process.env.PDF_SMOKE_CHART_WIDTH);
let rendererPage, peakCharts = 0, peakHeapBytes = 0;
const started = Date.now();
await renderPdfSnapshot(snapshot, { config: pdfRendererConfig(),
  configurePage: async page => {
    rendererPage = page;
    if (process.env.PDF_SMOKE_CPU_RATE) await page.emulateCPUThrottling(Number(process.env.PDF_SMOKE_CPU_RATE));
    await page.evaluateOnNewDocument(() => {
      window.__PDF_TEST_PEAK_CHARTS__ = 0;
      new MutationObserver(() => {
        window.__PDF_TEST_PEAK_CHARTS__ = Math.max(window.__PDF_TEST_PEAK_CHARTS__, document.querySelectorAll(".js-plotly-plot").length);
      }).observe(document, { childList: true, subtree: true });
    });
  },
  onChunk: async (chunk) => {
    chunks.push(Buffer.from(chunk, "base64"));
    peakCharts = await rendererPage.evaluate(() => window.__PDF_TEST_PEAK_CHARTS__);
    peakHeapBytes = (await rendererPage.metrics()).JSHeapUsedSize;
  },
  onProgress: async (value) => {
    progress.push(value); console.log(value.message);
  },
});
const pdf = Buffer.concat(chunks);
assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
assert.ok(pdf.length > 10000);
assert.ok(progress.some((value) => value.percent === 100));
assert.ok(progress.some((value) => value.message === "Loading PDF renderer..."));
assert.equal(peakCharts, 1, "Only one live Plotly chart may be mounted during export");
const pageCount = (pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) || []).length;
assert.equal(pageCount, 1 + snapshot.lsPages.length + snapshot.allCs.length, "Every chart must appear in the PDF");
const output = process.env.PDF_SMOKE_OUTPUT || join(tmpdir(), "cader-background-export-smoke.pdf");
await writeFile(output, pdf);
console.log(JSON.stringify({ elapsedMs: Date.now() - started, bytes: pdf.length, pageCount, peakCharts, heapBytesAtSave: peakHeapBytes, updates: progress.length, output, status: "passed" }));

// Startup failures must be reported immediately, not after the stall watchdog.
const { createServer } = await import("node:http");
const unavailable = createServer((request, response) => {
  if (request.url === "/slow") {
    response.writeHead(200, { "content-type": "text/html" });
    response.end('<script>window.__PDF_EXPORT_READY__=true;setTimeout(()=>window.__PDF_EXPORT_DONE__=true,3500)</script>');
    return;
  }
  response.writeHead(503);
  response.end("Unavailable");
});
await new Promise(resolve => unavailable.listen(0, "127.0.0.1", resolve));
try {
  await assert.rejects(renderPdfSnapshot(snapshot, {
    config: { ...pdfRendererConfig(), url: `http://127.0.0.1:${unavailable.address().port}/pdf-export-render` },
    onProgress: async () => {}, onChunk: async () => {},
  }), /HTTP 503/);
  // The overall render duration may exceed the timeout of any one CDP call.
  await renderPdfSnapshot({}, {
    config: { ...pdfRendererConfig(), protocolTimeout: 1000, url: `http://127.0.0.1:${unavailable.address().port}/slow` },
    onProgress: async () => {}, onChunk: async () => {},
  });
} finally {
  await new Promise(resolve => unavailable.close(resolve));
}
console.log("Renderer HTTP failure and long-running export regressions passed");
