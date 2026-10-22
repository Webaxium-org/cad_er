import test from "node:test";
import assert from "node:assert/strict";
import Survey from "../models/survey.js";
import Purpose from "../models/surveyPurpose.js";
import Row from "../models/surveyRows.js";
import { getSurveyDeductions, createSurveyDeduction, deleteSurveyDeduction } from "../controllers/surveyDeductionController.js";

const surveyId = "000000000000000000000001";
const otherSurvey = "000000000000000000000002";
const purposeId = "000000000000000000000003";
const deductionId = "000000000000000000000004";
const request = (id = surveyId) => ({ params: { id, deductionId }, user: { userId: "owner" }, body: { purposeId, rows: [{ from: "0/000", to: "0/020", remark: "Bridge" }] } });
const response = () => { const res = { data: null, status: () => res, json: (data) => { res.data = data; } }; return res; };

test("deduction history is fetched only from the requested survey and its owner", async t => {
  const ownHistory = [{ _id: deductionId }];
  t.mock.method(Survey, "findOne", filter => {
    assert.equal(filter.createdBy, "owner");
    assert.equal(filter.deleted, false);
    return { select: async () => filter._id === surveyId ? { deductions: ownHistory } : null };
  });
  const res = response();
  await getSurveyDeductions(request(), res, error => { throw error; });
  assert.deepEqual(res.data.deductions, ownHistory);
  let failure;
  await getSurveyDeductions(request(otherSurvey), response(), error => { failure = error; });
  assert.equal(failure.status, 404);
});

test("saving rejects purposes from another survey before writing anything", async t => {
  t.mock.method(Survey, "exists", async filter => { assert.equal(filter._id, surveyId); assert.equal(filter.createdBy, "owner"); return true; });
  t.mock.method(Purpose, "exists", async filter => { assert.equal(filter.surveyId, surveyId); return null; });
  const write = t.mock.method(Survey, "updateOne", () => { throw Error("Unexpected write"); });
  let failure;
  await createSurveyDeduction(request(), response(), error => { failure = error; });
  assert.equal(failure.status, 400);
  assert.equal(write.mock.callCount(), 0);
});

test("valid ranges are saved to the current survey; foreign, reversed and overlapping ranges are rejected", async t => {
  t.mock.method(Survey, "exists", async () => true);
  t.mock.method(Purpose, "exists", async () => true);
  t.mock.method(Row, "find", filter => {
    assert.equal(filter.purposeId, purposeId);
    return { sort: () => ({ select: () => ({ lean: async () => ["0/000", "0/010", "0/020"].map(chainage => ({ chainage })) }) }) };
  });
  const write = t.mock.method(Survey, "updateOne", async (filter, update) => {
    assert.equal(filter._id, surveyId);
    assert.equal(filter.createdBy, "owner");
    assert.equal(update.$push.deductions.$each[0].purposeId, purposeId);
    return { matchedCount: 1 };
  });
  const res = response();
  await createSurveyDeduction(request(), res, error => { throw error; });
  assert.equal(res.data.deduction.rows[0].remark, "Bridge");
  for (const rows of [
    [{ from: "0/999", to: "0/020" }],
    [{ from: "0/020", to: "0/000" }],
    [{ from: "0/000", to: "0/020" }, { from: "0/010", to: "0/020" }],
  ]) {
    const req = request(); req.body.rows = rows;
    let failure;
    await createSurveyDeduction(req, response(), error => { failure = error; });
    assert.equal(failure.status, 400);
  }
  assert.equal(write.mock.callCount(), 1);
});

test("deleting a deduction requires both its survey ID and the current owner", async t => {
  t.mock.method(Survey, "updateOne", async (filter, update) => {
    assert.equal(filter._id, otherSurvey);
    assert.equal(filter.createdBy, "owner");
    assert.equal(filter["deductions._id"], deductionId);
    assert.equal(update.$pull.deductions._id, deductionId);
    return { matchedCount: 0 };
  });
  let failure;
  await deleteSurveyDeduction(request(otherSurvey), response(), error => { failure = error; });
  assert.equal(failure.status, 404);
});
