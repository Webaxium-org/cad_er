// Opt-in integration check: start the client on localhost:5194, then run this file.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderPdfSnapshot, pdfRendererConfig } from "../services/pdfExportRenderer.js";
import { pdfExportSnapshot } from "./fixtures/pdfExportSnapshot.js";
process.env.PDF_RENDER_ORIGIN ||= "http://127.0.0.1:5194";
const chunks = [], progress = [];
await renderPdfSnapshot(pdfExportSnapshot(), { config: pdfRendererConfig(),
  onChunk: async (chunk) => chunks.push(Buffer.from(chunk, "base64")),
  onProgress: async (value) => progress.push(value),
});
const pdf = Buffer.concat(chunks);
assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
assert.ok(pdf.length > 10000);
assert.ok(progress.some((value) => value.percent === 100));
const output = process.env.PDF_SMOKE_OUTPUT || join(tmpdir(), "cader-background-export-smoke.pdf");
await writeFile(output, pdf);
console.log(JSON.stringify({ bytes: pdf.length, updates: progress.length, output, status: "passed" }));
