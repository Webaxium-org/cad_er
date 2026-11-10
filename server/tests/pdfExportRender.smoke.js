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
if (process.env.PDF_SMOKE_CS_COUNT) snapshot.allCs = Array.from({ length: Number(process.env.PDF_SMOKE_CS_COUNT) }, (_, index) => ({ ...snapshot.allCs[index % snapshot.allCs.length] }));
const started = Date.now();
await renderPdfSnapshot(snapshot, { config: pdfRendererConfig(),
  onChunk: async (chunk) => chunks.push(Buffer.from(chunk, "base64")),
  onProgress: async (value) => { progress.push(value); console.log(value.message); },
});
const pdf = Buffer.concat(chunks);
assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
assert.ok(pdf.length > 10000);
assert.ok(progress.some((value) => value.percent === 100));
assert.ok(progress.some((value) => value.message === "Loading PDF renderer..."));
assert.ok(progress.some((value) => value.message.startsWith("Preparing report charts (")));
const output = process.env.PDF_SMOKE_OUTPUT || join(tmpdir(), "cader-background-export-smoke.pdf");
await writeFile(output, pdf);
console.log(JSON.stringify({ elapsedMs: Date.now() - started, bytes: pdf.length, updates: progress.length, output, status: "passed" }));

// Startup failures must be reported immediately, not after the stall watchdog.
const { createServer } = await import("node:http");
const unavailable = createServer((_request, response) => {
  response.writeHead(503);
  response.end("Unavailable");
});
await new Promise(resolve => unavailable.listen(0, "127.0.0.1", resolve));
try {
  await assert.rejects(renderPdfSnapshot(snapshot, {
    config: { ...pdfRendererConfig(), url: `http://127.0.0.1:${unavailable.address().port}/pdf-export-render` },
    onProgress: async () => {}, onChunk: async () => {},
  }), /HTTP 503/);
} finally {
  await new Promise(resolve => unavailable.close(resolve));
}
console.log("Renderer HTTP failure regression passed");
