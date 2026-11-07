import test from "node:test";
import assert from "node:assert/strict";
import { queuePdfExport } from "./queuePdfExport.js";

const payload = { surveyId: "survey", snapshot: {}, requestKey: "original-request-key" };
const pause = async () => {};

test("a lost gateway acknowledgement recovers the same completed job without resubmitting", async () => {
  let posts = 0, gets = 0, recovering = false;
  const job = { id: "original", requestKey: payload.requestKey, status: "completed" };
  const api = {
    async post() { posts++; throw { response: { status: 504 } }; },
    async get(path, options) {
      assert.equal(options.params.requestKey, payload.requestKey);
      return { data: { jobs: ++gets === 1 ? [] : [job] } };
    },
  };
  assert.equal(await queuePdfExport(api, payload, { pause, onRecovery: () => { recovering = true; } }), job);
  assert.equal(posts, 1);
  assert.equal(gets, 2);
  assert.ok(recovering);
});

test("unconfirmed submissions fail clearly and never recover an unrelated job", async () => {
  let gets = 0;
  const api = {
    async post() { throw { code: "ECONNABORTED" }; },
    async get() { gets++; return { data: { jobs: [{ id: "other", requestKey: "different-request-key" }] } }; },
  };
  await assert.rejects(queuePdfExport(api, payload, { pause }), /could not confirm that it was queued/);
  assert.equal(gets, 3);
});

test("permission and renderer configuration failures retain the original error", async () => {
  for (const status of [400, 401, 402, 403, 413, 503]) {
    const error = { response: { status, data: { message: "Server configuration or access error" } } };
    const api = { async post() { throw error; }, async get() { assert.fail("No recovery lookup expected"); } };
    await assert.rejects(queuePdfExport(api, payload, { pause }), caught => caught === error);
  }
});

test("successful acceptance returns immediately without a status lookup", async () => {
  const job = { id: "queued", requestKey: payload.requestKey, status: "queued" };
  const api = { async post() { return { data: { job } }; }, async get() { assert.fail("No recovery lookup expected"); } };
  assert.equal(await queuePdfExport(api, payload), job);
});
