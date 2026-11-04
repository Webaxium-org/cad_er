import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Survey from "../models/survey.js";
import Purpose from "../models/surveyPurpose.js";
import Row from "../models/surveyRows.js";
import { prepareSlopeRow, saveLongitudinalSlope } from "../controllers/longitudinalSlopeController.js";

const surveyId = "000000000000000000000001", purposeId = "000000000000000000000002";
const rows = () => [0, 1].map((index) => ({ _id: `00000000000000000000001${index}`, purposeId, chainage: `0/${index ? "010" : "000"}`,
  reducedLevels: ["10", "11", "10"], intermediateOffsets: [-2, 0, 2].map((offset) => ({ offset: String(offset), is: "5", mode: "R" })) }));
const change = (row, delta) => ({ rowId: row._id, chainage: row.chainage, expectedLevels: row.reducedLevels,
  offsets: row.intermediateOffsets.map((point) => point.offset), reducedLevels: row.reducedLevels.map((level) => Number(level) + delta) });
const query = (value) => ({ session() { return this; }, lean() { return Promise.resolve(value); }, then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); } });
const setup = (t) => {
  const records = rows();
  const session = { committed: false, aborted: false, ended: false,
    async withTransaction(fn) { try { await fn(); this.committed = true; } catch (error) { this.aborted = true; throw error; } },
    async endSession() { this.ended = true; } };
  t.mock.method(mongoose, "startSession", async () => session);
  t.mock.method(Survey, "findOneAndUpdate", (filter, update, options) => { assert.equal(filter.createdBy, "owner"); assert.equal(filter.isSurveyFinish, false); assert.equal(options.session, session); return query({ _id: surveyId }); });
  t.mock.method(Purpose, "findOne", (filter) => { assert.equal(filter.surveyId, surveyId); return query({ _id: purposeId }); });
  t.mock.method(Row, "find", (filter) => { assert.equal(filter.purposeId, purposeId); assert.equal(filter.type, "Chainage"); return query(records); });
  const write = t.mock.method(Row, "bulkWrite", async (ops, options) => { assert.equal(options.session, session); return { matchedCount: ops.length }; });
  return { records, session, write, req: { params: { id: surveyId }, user: { userId: "owner" }, body: { purposeId, changes: records.map((row, index) => change(row, -index)) } } };
};
const invoke = async (req) => {
  let body;
  await saveLongitudinalSlope(req, { json(value) { body = value; } }, (error) => { throw error; });
  return body;
};

test("saving a slope shifts every offset equally and adjusts sights without inventing blank readings", () => {
  const row = rows()[0];
  const result = prepareSlopeRow(row, change(row, -1));
  assert.deepEqual(result.reducedLevels, ["9.000", "10.000", "9.000"]);
  assert.ok(result.intermediateOffsets.every((point) => point.is === "6.000"));
  row.intermediateOffsets[0].is = "";
  assert.equal(prepareSlopeRow(row, change(row, 1)).intermediateOffsets[0].is, "");
  assert.deepEqual(row.reducedLevels, ["10", "11", "10"]);
});

test("all affected chainages are committed in one transaction and returned for the live report", async (t) => {
  const { req, session, write } = setup(t);
  const result = await invoke(req);
  assert.equal(result.updated, 2);
  assert.equal(write.mock.callCount(), 1);
  assert.deepEqual(result.rows[1].reducedLevels, ["9.000", "10.000", "9.000"]);
  assert.equal(session.committed, true); assert.equal(session.ended, true);
});

test("stale data aborts the entire range before writing any row", async (t) => {
  const { req, session, write } = setup(t);
  req.body.changes[1].expectedLevels = ["9", "10", "9"];
  await assert.rejects(invoke(req), /readings changed/);
  assert.equal(write.mock.callCount(), 0);
  assert.equal(session.aborted, true);
});

test("wrong survey level, invalid levels and changed offsets cannot save a slope", async (t) => {
  const { req, write } = setup(t);
  t.mock.method(Purpose, "findOne", () => query(null));
  await assert.rejects(invoke(req), /level not found/);
  assert.equal(write.mock.callCount(), 0);
  const row = rows()[0];
  assert.throws(() => prepareSlopeRow(row, { ...change(row, 0), reducedLevels: [10, Infinity, 10] }), /Invalid/);
  assert.throws(() => prepareSlopeRow(row, { ...change(row, 0), offsets: [-3, 0, 2] }), /readings changed/);
  assert.throws(() => prepareSlopeRow(row, { ...change(row, 0), reducedLevels: [9, 11, 10] }), /cross-section shape/);
});

test("a missing row during bulk persistence rolls back rather than reporting partial success", async (t) => {
  const { req, session } = setup(t);
  t.mock.method(Row, "bulkWrite", async () => ({ matchedCount: 1 }));
  await assert.rejects(invoke(req), /changed while saving/);
  assert.equal(session.aborted, true); assert.equal(session.committed, false);
});
