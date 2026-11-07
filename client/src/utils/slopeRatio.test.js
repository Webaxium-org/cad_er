import test from "node:test";
import assert from "node:assert/strict";
import { gradeToSlopeRatio, slopeRatioToGrade, reverseSlopeRatio } from "./slopeRatio.js";

test("V:H converts signed vertical rise and horizontal run to grade", () => {
  assert.equal(slopeRatioToGrade("1:200"), 0.5);
  assert.equal(slopeRatioToGrade(" -1 : 200 "), -0.5);
  assert.equal(slopeRatioToGrade("0:1"), 0);
  assert.equal(slopeRatioToGrade("0.5:2.5"), 20);
  assert.equal(slopeRatioToGrade("-1:2000"), -0.05);
});

test("invalid ratios cannot produce a slope", () => {
  for (const value of ["", "0", "2", "1:0", "1:-2", "1:", ":1", "1:Infinity", "a:b"]) {
    assert.ok(Number.isNaN(slopeRatioToGrade(value)), value);
  }
});

test("saved CS ratios display in V:H and round-trip without changing slopes", () => {
  assert.equal(reverseSlopeRatio("2:1"), "1:2");
  assert.equal(reverseSlopeRatio("1000:-1"), "-1:1000");
  assert.equal(reverseSlopeRatio("1:0"), "0:1");
  for (const ratio of ["2:1", "1.5:1", "3/1", "2∶1", " 2 : 1 ", "", "1", "1:", ":2", "bad"]) {
    assert.equal(reverseSlopeRatio(reverseSlopeRatio(ratio)), ratio);
  }
});

test("existing saved grades retain their value when edited as ratios", () => {
  for (const grade of [0, 0.5, -2, 3.123456789]) {
    assert.ok(Math.abs(slopeRatioToGrade(gradeToSlopeRatio(grade)) - grade) < 1e-12);
  }
});
