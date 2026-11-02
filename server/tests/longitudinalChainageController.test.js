import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Survey from "../models/survey.js";
import Purpose from "../models/surveyPurpose.js";
import Row from "../models/surveyRows.js";
import History from "../models/history.js";
import { previewLongitudinalChainage, createLongitudinalChainage } from "../controllers/longitudinalChainageController.js";

const surveyId = "000000000000000000000001";
const initialId = "000000000000000000000002";
const proposalId = "000000000000000000000003";
const query = (value) => ({ sort() { return this; }, session() { return this; }, async lean() { return value; } });
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; } });
const request = () => ({ params: { id: surveyId }, user: { userId: "owner" }, body: { chainage: "0/050", referencePurposeId: initialId } });

const setup = (t) => {
  const purposes = [{ _id: initialId, type: "Initial Level", phase: "Actual", pls: "0" }, { _id: proposalId, type: "Proposed Level", phase: "Proposal" }];
  const rows = [{ _id: "setup", purposeId: initialId, type: "Instrument setup", backSight: "5", reducedLevels: ["10"] }];
  purposes.forEach((purpose) => ["0/000", "0/100"].forEach((chainage, index) => rows.push({
    _id: `${purpose._id}-${index}`, purposeId: purpose._id, type: "Chainage", chainage,
    reducedLevels: index ? ["10", "12", "10"] : ["8", "10", "8"], roadWidth: "4", spacing: "2", heightOfInstrument: "15",
    intermediateOffsets: ["-2", "0", "2"].map((offset) => ({ offset, is: "5", mode: "R" })),
  })));
  const session = { committed: false, aborted: false, ended: false,
    async withTransaction(callback) { try { await callback(); this.committed = true; } catch (error) { this.aborted = true; throw error; } },
    async endSession() { this.ended = true; },
  };
  t.mock.method(mongoose, "startSession", async () => session);
  t.mock.method(Survey, "findOne", (filter) => {
    assert.equal(filter.createdBy, "owner"); assert.equal(filter.deleted, false);
    return query({ _id: surveyId, separator: "/" });
  });
  t.mock.method(Purpose, "find", (filter) => { assert.equal(filter.surveyId, surveyId); return query(purposes); });
  t.mock.method(Row, "find", (filter) => {
    assert.deepEqual(filter.purposeId.$in, [initialId, proposalId]);
    return query(rows);
  });
  const surveyWrite = t.mock.method(Survey, "updateOne", async (filter, update, options) => {
    assert.equal(filter.createdBy, "owner"); assert.equal(options.session, session); return { matchedCount: 1 };
  });
  const orderWrite = t.mock.method(Row, "bulkWrite", async (operations, options) => { assert.equal(options.session, session); });
  const rowWrite = t.mock.method(Row, "create", async (documents, options) => { assert.equal(options.session, session); return documents; });
  const historyWrite = t.mock.method(History, "create", async (documents, options) => { assert.equal(options.session, session); return documents; });
  return { session, rows, surveyWrite, orderWrite, rowWrite, historyWrite };
};

const previewRequest = async (req) => {
  const res = response();
  await previewLongitudinalChainage(req, res, (error) => { throw error; });
  req.body.previewToken = res.data.previewToken;
  req.body.levels = res.data.levels.map(({ purposeId, rl }) => ({ purposeId, rl }));
  return res;
};

test("preview checks survey ownership and does not write", async (t) => {
  const mocks = setup(t);
  const res = await previewRequest(request());
  assert.equal(res.data.levels.length, 2);
  assert.equal(res.data.chainage, "0/050");
  assert.equal(mocks.rowWrite.mock.callCount(), 0);
  assert.equal(mocks.surveyWrite.mock.callCount(), 0);
  t.mock.method(Survey, "findOne", () => query(null));
  let failure;
  await previewLongitudinalChainage(request(), response(), (error) => { failure = error; });
  assert.equal(failure.status, 404);
});

test("save inserts every level in reading order using a single transaction", async (t) => {
  const mocks = setup(t), req = request();
  await previewRequest(req);
  const res = response();
  await createLongitudinalChainage(req, res, (error) => { throw error; });
  assert.equal(res.statusCode, 201);
  assert.equal(mocks.session.committed, true);
  assert.equal(mocks.session.ended, true);
  const documents = mocks.rowWrite.mock.calls[0].arguments[0];
  assert.deepEqual(documents.map((row) => row.readingOrder), [3, 1]);
  assert.ok(documents.every((row) => row.createdBy === "owner" && row.chainage === "0/050"));
  assert.equal(mocks.orderWrite.mock.calls[0].arguments[0].length, 5);
  assert.equal(mocks.historyWrite.mock.callCount(), 1);
});

test("stale previews and invalid RLs are rejected before any writes", async (t) => {
  const mocks = setup(t), req = request();
  await previewRequest(req);
  mocks.rows[1].reducedLevels[0] = "7";
  let failure;
  await createLongitudinalChainage(req, response(), (error) => { failure = error; });
  assert.equal(failure.status, 409);
  assert.equal(mocks.rowWrite.mock.callCount(), 0);
  assert.equal(mocks.surveyWrite.mock.callCount(), 0);
  await previewRequest(req);
  req.body.levels[0].rl = "";
  await createLongitudinalChainage(req, response(), (error) => { failure = error; });
  assert.equal(failure.status, 400);
  assert.equal(mocks.rowWrite.mock.callCount(), 0);
  assert.equal(mocks.session.aborted, true);
});

test("a row write failure aborts the transaction and never returns success", async (t) => {
  const mocks = setup(t), req = request();
  await previewRequest(req);
  t.mock.method(Row, "create", async () => { throw Object.assign(Error("duplicate"), { code: 11000 }); });
  const res = response();
  let failure;
  await createLongitudinalChainage(req, res, (error) => { failure = error; });
  assert.equal(failure.status, 409);
  assert.equal(mocks.session.aborted, true);
  assert.equal(mocks.session.committed, false);
  assert.equal(mocks.session.ended, true);
  assert.equal(mocks.historyWrite.mock.callCount(), 0);
  assert.equal(res.data, undefined);
});
