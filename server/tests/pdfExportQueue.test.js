import test from "node:test";
import assert from "node:assert/strict";
import { pdfExportCollection } from "../services/pdfExportQueue.js";

test("localhost jobs cannot enter the deployed PDF queue in a shared database", () => {
  for (const host of ["localhost", "127.0.0.1", "[::1]"]) {
    assert.equal(pdfExportCollection({ CLIENT_URL: `http://${host}:5173` }), "pdfexports_local");
  }
  assert.equal(pdfExportCollection({ CLIENT_URL: "https://getcader.com" }), "pdfexports");
  assert.equal(pdfExportCollection({ CLIENT_URL: "https://getcader.com", PDF_RENDER_ORIGIN: "http://localhost:5173" }), "pdfexports_local");
});

test("explicit queues isolate staging and reject invalid collection names", () => {
  assert.equal(pdfExportCollection({ PDF_EXPORT_QUEUE: "staging" }), "pdfexports_staging");
  assert.throws(() => pdfExportCollection({ PDF_EXPORT_QUEUE: "invalid.name" }), /Invalid PDF_EXPORT_QUEUE/);
});
