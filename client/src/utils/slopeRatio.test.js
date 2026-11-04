import test from "node:test";
import assert from "node:assert/strict";
import { gradeToSlopeRatio, slopeRatioToGrade } from "./slopeRatio.js";

test("H:V converts horizontal run and signed vertical rise to grade", () => {
  assert.equal(slopeRatioToGrade("200:1"), 0.5);
  assert.equal(slopeRatioToGrade(" 200 : -1 "), -0.5);
  assert.equal(slopeRatioToGrade("1:0"), 0);
  assert.equal(slopeRatioToGrade("2.5:0.5"), 20);
});

test("invalid ratios cannot produce a slope", () => {
  for (const value of ["", "0", "2", "0:1", "-2:1", "1:", "1:Infinity", "a:b"]) {
    assert.ok(Number.isNaN(slopeRatioToGrade(value)), value);
  }
});

test("existing saved grades retain their value when edited as ratios", () => {
  for (const grade of [0, 0.5, -2, 3.123456789]) {
    assert.ok(Math.abs(slopeRatioToGrade(gradeToSlopeRatio(grade)) - grade) < 1e-12);
  }
});
