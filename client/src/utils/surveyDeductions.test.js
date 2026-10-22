import test from "node:test";
import assert from "node:assert/strict";
import { reportDeductions } from "./surveyDeductions.js";

test("reports resolve deductions exclusively from the fetched survey", () => {
  const rows = [{ from: "0/000", to: "0/020" }];
  const surveyA = { _id: "a", deductions: [{ _id: "deduction-a", rows }] };
  const surveyB = { _id: "b", deductions: [{ _id: "deduction-b", rows: [{ from: "0/000", to: "0/040" }] }] };
  assert.deepEqual(reportDeductions(surveyA, "deduction-a"), rows);
  assert.deepEqual(reportDeductions(surveyB, "deduction-a"), []);
  assert.deepEqual(reportDeductions(surveyA, null), []);
  assert.deepEqual(reportDeductions(null, "deduction-a"), []);
});
