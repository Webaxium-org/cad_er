import test from "node:test";
import assert from "node:assert/strict";
import { prepareWaterWaySections, channelSection, excavationArea, chainageMetres, sideSlope } from "../helper/waterWayGeometry.js";
import { compareProfiles } from "../../client/src/utils/surveyGeometry.js";
const readings = [0, 30, 180].map((ch, i) => ({ _id: String(i), chainage: `0/${ch}`, reducedLevels: [8.86, 8.66, 8.87], intermediateOffsets: [-2, 0, 2].map(offset => ({ offset })) }));
const config = { proposalMethod: "With Respect to Berm", bermWidth: 0, quantity: 30, slope: "1:1" };
const prepare = (changes = {}, rows = readings) => prepareWaterWaySections({ readings: rows, config: { ...config, ...changes }, centerOffset: 0 });

test("end-to-end is exactly zero berm, without RL or bank inputs", () => {
  assert.deepEqual(prepare({ proposalMethod: "Slope End-to-End Type", bermWidth: 2, startRL: 1, endRL: 2 }), prepare());
  assert.deepEqual(prepare({}, [...readings].reverse()), prepare());
});
test("nearest 0.005 bed rebuilds toes and keeps quantity close", () => {
  const points = [{ x: -2, y: 8.86 }, { x: 0, y: 8.66 }, { x: 2, y: 8.87 }];
  const exact = channelSection({ points, bed: 8.614, left: -2, right: 2, ratio: 1, center: 0 });
  const quantity = excavationArea(points, exact.geometry) * 180;
  const result = prepare({ quantity });
  const section = result.get("0");
  assert.equal(section.bedLevel, 8.615);
  assert.ok(Math.abs(section.geometry[1].x - (-1.755)) < 1e-9);
  const actual = excavationArea(points, section.geometry) * 180;
  assert.ok(Math.abs(actual - quantity) < 0.72);
  for (const s of result.values()) assert.equal(s.bedLevel, 8.615);
});
test("zero berm area includes interpolated ground and final side triangle", () => {
  const section = prepare().get("0");
  const ground = { offsets: [-2, 0, 2], reducedLevels: readings[0].reducedLevels };
  const rows = compareProfiles(ground, { offsets: section.offsets.map(p => p.offset), reducedLevels: section.proposedLevels });
  assert.ok(rows.every(row => Number(row.initialEntryRL) > 8));
  assert.equal(rows.at(-1).cuttingMtr, "0.000");
  assert.ok(rows.at(-1).cuttingAreaSqMtr > 0);
  const expected = excavationArea(ground.offsets.map((x,i) => ({ x, y: ground.reducedLevels[i] })), section.geometry);
  assert.ok(Math.abs(rows.reduce((sum, row) => sum + row.cuttingAreaSqMtr, 0) - expected) < 1e-8);
});
test("positive berm insets each end by half the total width", () => {
  const section = prepare({ bermWidth: 1 }).get("0");
  assert.equal(section.geometry[0].x, -1.5);
  assert.equal(section.geometry.at(-1).x, 1.5);
});
test("rejects invalid inputs and infeasible quantities", () => {
  for (const change of [{ quantity: 0 }, { quantity: -1 }, { quantity: 1e8 }, { bermWidth: -1 }, { slope: "1:0" }, { quantity: "" }]) assert.throws(() => prepare(change));
  assert.throws(() => prepare({}, readings.slice(0, 1)), /two distinct/);
  assert.throws(() => prepare({}, [readings[0], readings[0]]), /Duplicate/);
  assert.equal(chainageMetres("1+020", "+"), 1020);
  assert.equal(sideSlope("0.75:1"), .75);
});

test("CH300 bank geometry retains asymmetric toes and interpolated ground", () => {
  const section = channelSection({ points: [-4, -3, 0, 3, 4].map((x, i) => ({ x, y: [8.83, 7.865, 7.34, 7.915, 8.855][i] })), bed: 7.155, left: -3, right: 3, ratio: 1, center: 0 });
  assert.deepEqual(section.offsets.map(p => Number(p.offset)), [-3, -2.29, 0, 2.24, 3]);
  assert.deepEqual(section.proposedLevels, ["7.865", "7.155", "7.155", "7.155", "7.915"]);
  assert.equal(section.initialLevels[2], "7.340");
});
test("rounding stays within feasible bank levels", () => {
  const rows = readings.map(row => ({ ...row, reducedLevels: [8.863, 8.66, 8.873] }));
  const points = rows[0].intermediateOffsets.map((p, i) => ({ x: p.offset, y: rows[0].reducedLevels[i] }));
  const design = channelSection({ points, bed: 8.863, left: -2, right: 2, ratio: 1, center: 0 });
  const result = prepare({ quantity: excavationArea(points, design.geometry) * 180 }, rows);
  assert.ok(result.get("0").bedLevel <= 8.863);
  assert.equal(result.get("0").bedLevel * 200, Math.round(result.get("0").bedLevel * 200));
});
