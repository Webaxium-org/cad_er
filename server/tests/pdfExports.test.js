import test from "node:test";
import assert from "node:assert/strict";
import { Writable } from "node:stream";
import mongoose from "mongoose";
import PdfExport from "../models/pdfExport.js";
import Survey from "../models/survey.js";
import { createPdfExport, listPdfExports, downloadPdfExport, acknowledgePdfExport } from "../controllers/pdfExportController.js";
import { validatePdfSnapshot, publicPdfJob } from "../services/pdfExportValidation.js";
import { pdfClaimFilter, runPdfJob, cleanupPdfExports } from "../services/pdfExportWorker.js";
import { pdfExportSnapshot } from "./fixtures/pdfExportSnapshot.js";

const owner = "000000000000000000000001", surveyId = "000000000000000000000002", id = "000000000000000000000003";
const req = () => ({ user: { userId: owner }, params: { id }, body: { surveyId, requestKey: "request-0000000001", snapshot: pdfExportSnapshot() } });
const query = (value) => ({ select() { return this; }, sort() { return this; }, limit() { return this; }, lean() { return Promise.resolve(value); }, then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); } });
const response = () => ({ status(code) { this.code = code; return this; }, set() { return this; }, json(value) { this.data = value; } });
const invoke = async (handler, request) => { const res = response(); await handler(request, res, (error) => { throw error; }); return res; };
const configure = (t) => {
  const prior = { path: process.env.PDF_CHROME_PATH, origin: process.env.PDF_RENDER_ORIGIN };
  process.env.PDF_CHROME_PATH = process.execPath; process.env.PDF_RENDER_ORIGIN = "http://localhost:5194";
  t.after(() => {
    if (prior.path == null) delete process.env.PDF_CHROME_PATH; else process.env.PDF_CHROME_PATH = prior.path;
    if (prior.origin == null) delete process.env.PDF_RENDER_ORIGIN; else process.env.PDF_RENDER_ORIGIN = prior.origin;
  });
};

test("export creation validates ownership and durably queues the exact report snapshot", async (t) => {
  configure(t);
  t.mock.method(Survey, "findOne", (filter) => { assert.equal(filter.createdBy, owner); assert.equal(filter._id, surveyId); return query({ _id: surveyId, project: "Test project" }); });
  t.mock.method(PdfExport, "findOne", () => query(null));
  const create = t.mock.method(PdfExport, "create", async (data) => ({ _id: id, ...data, status: "queued", progress: 0 }));
  const request = req(), result = await invoke(createPdfExport, request);
  assert.equal(result.code, 202);
  assert.equal(result.data.job.status, "queued");
  assert.deepEqual(create.mock.calls[0].arguments[0].snapshot, request.body.snapshot);
  assert.equal(create.mock.calls[0].arguments[0].owner, owner);
  assert.ok(!("snapshot" in result.data.job));
  t.mock.method(Survey, "findOne", () => query(null));
  await assert.rejects(invoke(createPdfExport, req()), /Survey not found/);
  assert.equal(create.mock.callCount(), 1);
});

test("idempotent retries return the existing job and owner-scoped lists never disclose snapshot data", async (t) => {
  const job = { _id: id, owner, surveyId, status: "queued", snapshot: { secret: true }, fileId: "private" };
  t.mock.method(Survey, "findOne", () => query({ _id: surveyId }));
  t.mock.method(PdfExport, "findOne", (filter) => { assert.equal(filter.owner, owner); return query(job); });
  const create = t.mock.method(PdfExport, "create", () => { throw Error("must not create"); });
  assert.equal((await invoke(createPdfExport, req())).data.job.id, id);
  assert.equal(create.mock.callCount(), 0);
  t.mock.method(PdfExport, "find", (filter) => { assert.equal(filter.owner, owner); assert.ok(filter.expiresAt.$gt); return query([job]); });
  const listed = (await invoke(listPdfExports, req())).data.jobs;
  assert.equal(listed.length, 1);
  assert.ok(!("snapshot" in listed[0]) && !("fileId" in listed[0]));
});

test("submission recovery looks up only the original request key for the signed-in owner", async t => {
  const request = req();
  request.query = { requestKey: request.body.requestKey };
  t.mock.method(PdfExport, "find", filter => {
    assert.equal(filter.owner, owner);
    assert.equal(filter.requestKey, request.body.requestKey);
    return query([{ _id: id, surveyId, requestKey: filter.requestKey, status: "completed", snapshot: { private: true } }]);
  });
  const result = await invoke(listPdfExports, request);
  assert.equal(result.data.jobs[0].requestKey, request.body.requestKey);
  assert.ok(!("snapshot" in result.data.jobs[0]));
  request.query.requestKey = { $ne: "" };
  await assert.rejects(invoke(listPdfExports, request), /Invalid export request key/);
});

test("downloads and acknowledgement enforce owner, expiry and ready status", async (t) => {
  t.mock.method(PdfExport, "findOne", (filter) => { assert.equal(filter.owner, owner); assert.ok(filter.expiresAt.$gt); return query(null); });
  await assert.rejects(invoke(downloadPdfExport, req()), /not found or expired/);
  t.mock.method(PdfExport, "findOne", () => query({ _id: id, status: "running", active: true }));
  await assert.rejects(invoke(downloadPdfExport, req()), /not ready/);
  await assert.rejects(invoke(acknowledgePdfExport, { ...req(), body: { action: "dismissed" } }), /still running/);
  t.mock.method(PdfExport, "findOne", () => query({ _id: id, status: "completed", active: false }));
  const write = t.mock.method(PdfExport, "updateOne", async () => ({ matchedCount: 1 }));
  await invoke(acknowledgePdfExport, { ...req(), body: { action: "downloaded" } });
  assert.ok(write.mock.calls[0].arguments[1].$set.downloadedAt instanceof Date);
});

test("invalid report snapshots are rejected and job indexes prevent concurrent per-user exports", () => {
  const request = req();
  assert.equal(validatePdfSnapshot(request.body), request.body.snapshot);
  assert.throws(() => validatePdfSnapshot({ ...request.body, snapshot: { ...request.body.snapshot, chartWidth: 0 } }), /not ready/);
  assert.throws(() => validatePdfSnapshot({ ...request.body, requestKey: "bad" }), /Invalid/);
  assert.throws(() => validatePdfSnapshot({ ...request.body, snapshot: { ...request.body.snapshot, allCs: [] } }), /not ready/);
  assert.ok(PdfExport.schema.indexes().some(([keys, options]) => keys.owner && keys.active && options.unique && options.partialFilterExpression.active));
  const safe = publicPdfJob({ _id: id, surveyId, snapshot: "private", leaseToken: "secret" });
  assert.ok(!("leaseToken" in safe));
});

const mockStorage = (t) => {
  const chunks = [], deleted = [], updates = [];
  const originalDb = mongoose.connection.db;
  mongoose.connection.db = { collection: (name) => ({ async deleteMany(filter) { deleted.push({ name, filter }); }, async deleteOne(filter) { deleted.push({ name, filter }); } }) };
  t.after(() => { mongoose.connection.db = originalDb; });
  const upload = new Writable({ write(chunk, encoding, done) { chunks.push(Buffer.from(chunk)); done(); } });
  upload.abort = async () => { upload.destroy(); };
  t.mock.method(mongoose.mongo, "GridFSBucket", () => function () { return { openUploadStreamWithId() { return upload; } }; }, { getter: true });
  t.mock.method(PdfExport, "updateOne", async (filter, change) => { updates.push({ filter, change }); return { matchedCount: 1 }; });
  return { chunks, deleted, updates };
};
const job = () => ({ _id: id, owner, leaseToken: "exclusive-lease", attempts: 1, snapshot: pdfExportSnapshot() });

test("worker stores PDF chunks and marks completion only after the output stream finishes", async (t) => {
  const state = mockStorage(t);
  await runPdfJob(job(), async (snapshot, { onProgress, onChunk }) => {
    assert.equal(snapshot.surveyInfo.project, "Background PDF regression");
    await onProgress({ percent: 100, message: "Saving" });
    await onChunk(Buffer.from("%PDF-1.7\nexample").toString("base64"));
  });
  assert.match(Buffer.concat(state.chunks).toString(), /^%PDF/);
  assert.ok(state.updates.every((entry) => entry.filter.leaseToken === "exclusive-lease"));
  const final = state.updates.at(-1).change;
  assert.equal(final.$set.status, "completed");
  assert.equal(final.$set.active, false);
  assert.equal(final.$unset.snapshot, 1);
});

test("failed renders delete partial files, release the active job and retain no snapshot", async (t) => {
  const state = mockStorage(t);
  await runPdfJob(job(), async () => { throw Error("test renderer failure"); });
  assert.equal(state.updates.at(-1).change.$set.status, "failed");
  assert.equal(state.updates.at(-1).change.$unset.snapshot, 1);
  assert.ok(state.deleted.some((entry) => entry.name === "pdfExports.chunks"));
});

test("a lost completion acknowledgement never deletes an already committed PDF", async (t) => {
  const state = mockStorage(t);
  t.mock.method(PdfExport, "updateOne", async (filter, change) => {
    if (change.$set?.status === "completed") throw Error("simulated lost acknowledgement");
    return { matchedCount: change.$set?.status === "failed" ? 0 : 1 };
  });
  t.mock.method(PdfExport, "exists", async () => ({ _id: id }));
  await runPdfJob(job(), async (snapshot, { onChunk }) => {
    await onChunk(Buffer.from("%PDF-1.7\ncommitted").toString("base64"));
  });
  assert.equal(state.deleted.length, 0);
});

test("expired leases are reclaimable, retries are bounded, and retention deletes files before job records", async (t) => {
  const state = mockStorage(t), now = new Date();
  const filter = pdfClaimFilter(now);
  assert.deepEqual(filter.$or, [{ status: "queued" }, { status: "running", leaseUntil: { $lt: now } }]);
  assert.equal(filter.active, true);
  let rendered = false;
  await runPdfJob({ ...job(), attempts: 4 }, async () => { rendered = true; });
  assert.equal(rendered, false);
  assert.equal(state.updates.at(-1).change.$set.status, "failed");
  t.mock.method(PdfExport, "find", () => query([{ _id: id, fileId: id }]));
  const removed = t.mock.method(PdfExport, "deleteOne", async () => {
    assert.ok(state.deleted.some((entry) => entry.name === "pdfExports.files"));
  });
  await cleanupPdfExports();
  assert.equal(removed.mock.callCount(), 1);
});
