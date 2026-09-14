import test from "node:test";
import assert from "node:assert/strict";
import { prepareWaterWaySections, chainageMetres, sideSlope } from "../helper/waterWayGeometry.js";

const reading = (id, chainage, levels = [8.830, 7.865, 7.340, 7.915, 8.855]) => ({
  _id: id, chainage, roadWidth: "6", reducedLevels: levels,
  intermediateOffsets: [-4, -3, 0, 3, 4].map((offset) => ({ offset })),
});
const config = { proposalMethod: "With Respect to Buffer", slope: "1:1", bufferReference: "centerline", bufferDirection: "below", buffer: .185, bankLimitsMode: "custom", leftBankOffset: -3, rightBankOffset: 3 };
const prepare = (options = {}) => prepareWaterWaySections({ readings: [reading("a", "0/300")], config, centerOffset: 0, ...options });

test("CH300 reference: exact asymmetric toes, bank ties, bed and interpolated initial RLs", () => {
  const section = prepare().get("a");
  assert.deepEqual(section.offsets.map((p) => Number(p.offset)), [-3, -2.29, 0, 2.24, 3]);
  assert.deepEqual(section.proposedLevels, ["7.865", "7.155", "7.155", "7.155", "7.915"]);
  assert.equal(section.initialLevels[2], "7.340");
  assert.equal(section.initialLevels.length, section.offsets.length);
});

test("grade follows actual chainage distance and reversed row order across kilometre boundaries", () => {
  const result = prepare({ readings: [reading("c", "1/080"), reading("a", "0/900"), reading("b", "0/930")],
    config: { ...config, proposalMethod: "Slope End-to-End Type", startRL: 7, endRL: 7.6 } });
  assert.equal(result.get("a").proposedLevels[2], "7.000");
  assert.equal(result.get("b").proposedLevels[2], "7.100");
  assert.equal(result.get("c").proposedLevels[2], "7.600");
});

test("buffer interpolates centreline instead of selecting a middle array value", () => {
  const r = { _id: "a", chainage: "0/0", intermediateOffsets: [-4, -1, 2, 4].map((offset) => ({ offset })), reducedLevels: [8, 7, 6, 8] };
  const result = prepare({ readings: [r], config: { ...config, leftBankOffset: -4, rightBankOffset: 4, buffer: .1 } });
  assert.equal(result.get("a").proposedLevels[2], "6.567");
});

test("reference choice is explicit and lowest is restricted to chosen banks", () => {
  const r = reading("a", "0/0", [1, 7.865, 7.34, 7.915, 1]);
  assert.equal(prepare({ readings: [r], config: { ...config, bufferReference: "lowest" } }).get("a").proposedLevels[2], "7.155");
  assert.equal(prepare({ config: { ...config, bufferReference: "referenceRL", bufferReferenceRL: 7.5, buffer: .2 } }).get("a").proposedLevels[2], "7.300");
  assert.throws(() => prepare({ config: { ...config, bufferReference: "" } }), /Choose the level/);
});

test("recorded widths can vary by chainage when explicitly selected", () => {
  const rows = [reading("a", "0/0"), { ...reading("b", "0/30"), roadWidth: "7" }];
  const result = prepare({ readings: rows, config: { ...config, bankLimitsMode: "surveyWidth" } });
  assert.equal(result.get("a").width, 6);
  assert.equal(result.get("b").width, 7);
});

test("rejects missing values, extrapolation, overlap, invalid grade and unsupported embankments", () => {
  for (const change of [{ slope: "1:0" }, { buffer: -1 }, { buffer: Infinity }, { bufferDirection: "" },
    { bankLimitsMode: "" }, { leftBankOffset: -5 }, { buffer: 20 }, { bufferDirection: "above", buffer: 2 }]) {
    assert.throws(() => prepare({ config: { ...config, ...change } }));
  }
  assert.throws(() => prepare({ config: { ...config, proposalMethod: "Slope End-to-End Type", startRL: 7, endRL: 7 } }), /two distinct/);
  const r = reading("a", "0/0"); r.reducedLevels[1] = "";
  assert.throws(() => prepare({ readings: [r] }), /Chainage 0\/0: Ground RL/);
  assert.equal(chainageMetres("1+020", "+"), 1020);
  assert.equal(sideSlope("0.75:1"), .75);
});
