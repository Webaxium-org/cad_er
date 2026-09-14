import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Survey from "../models/survey.js";
import SurveyPurpose from "../models/surveyPurpose.js";
import SurveyRow from "../models/surveyRows.js";
import { generateWaterWayProposalPurpose } from "../controllers/surveyController.js";

async function generate(t, body) {
  const calls = { purposes: [], rows: [], committed: false, aborted: false };
  const session = { startTransaction() {}, endSession() {}, async commitTransaction() { calls.committed = true; }, async abortTransaction() { calls.aborted = true; } };
  t.mock.method(mongoose, "startSession", async () => session);
  const rows = [0, 100].map((ch, i) => ({ _id: `row${i}`, type: "Chainage", chainage: `0/${ch}`, roadWidth: "4", reducedLevels: ["8", "7", "8"], intermediateOffsets: [-2, 0, 2].map((offset) => ({ offset })) }));
  t.mock.method(Survey, "findOne", () => ({ populate: () => ({ session: async () => ({ separator: "/", purposes: [{ _id: "initial", type: "Initial Level", pls: "0", rows }] }) }) }));
  t.mock.method(SurveyPurpose, "create", async (docs) => { calls.purposes.push(...docs); return [{ ...docs[0], _id: "proposal" }]; });
  t.mock.method(SurveyRow, "bulkWrite", async (ops) => { calls.rows = ops.map((op) => op.insertOne.document); });
  const req = { params: { id: "survey" }, user: { userId: "user" }, body: { purpose: "Initial Level", proposal: "Proposed Level", ...body } };
  const res = { status(code) { calls.status = code; return this; }, json(value) { calls.response = value; } };
  await generateWaterWayProposalPurpose(req, res, (error) => { calls.error = error; });
  return calls;
}

test("accepted fixed-width generation retains its solved RL and offsets", async (t) => {
  const calls = await generate(t, { proposalMethod: "Bottom Width Fixed", bottomWidth: 4, quantity: 100, slope: "0.75:1" });
  assert.equal(calls.error, undefined);
  assert.equal(calls.status, 201);
  assert.deepEqual(calls.rows[0].reducedLevels, ["8.000", "6.750", "6.750", "8.000"]);
  assert.deepEqual(calls.rows[0].intermediateOffsets.map((p) => p.offset), ["-2.000", "-1.063", "1.063", "2.000"]);
  assert.equal(calls.purposes[0].geometryVersion, undefined);
});

test("buffer endpoint persists geometry, initial interpolation and explicit design settings", async (t) => {
  const calls = await generate(t, { proposalMethod: "With Respect to Buffer", buffer: .25, bufferDirection: "below", bufferReference: "centerline", bankLimitsMode: "surveyWidth", slope: "0.75:1" });
  assert.equal(calls.error, undefined);
  assert.equal(calls.committed, true);
  assert.deepEqual(calls.rows[0].reducedLevels, ["8.000", "6.750", "6.750", "6.750", "8.000"]);
  assert.equal(calls.rows[0].interpolatedReducedLevels.length, 5);
  assert.equal(calls.purposes[0].geometryVersion, 2);
  assert.equal(calls.purposes[0].bufferReference, "centerline");
});

test("end-to-end endpoint generates banks and bed, not flat values at every offset", async (t) => {
  const calls = await generate(t, { proposalMethod: "Slope End-to-End Type", startRL: 6.75, endRL: 7, bankLimitsMode: "custom", leftBankOffset: -2, rightBankOffset: 2, slope: "0.75:1" });
  assert.equal(calls.error, undefined);
  assert.equal(calls.rows[0].reducedLevels[2], "6.750");
  assert.equal(calls.rows[1].reducedLevels[2], "7.000");
  assert.equal(calls.rows[1].reducedLevels[0], "8.000");
});

test("invalid channel geometry aborts before inserting a purpose or rows", async (t) => {
  const calls = await generate(t, { proposalMethod: "With Respect to Buffer", buffer: 20, bufferDirection: "below", bufferReference: "centerline", bankLimitsMode: "surveyWidth", slope: "1:1" });
  assert.equal(calls.error.status, 400);
  assert.match(calls.error.message, /Chainage 0\/0: Side slopes/);
  assert.equal(calls.aborted, true);
  assert.equal(calls.committed, false);
  assert.equal(calls.purposes.length, 0);
  assert.equal(calls.rows.length, 0);
});
