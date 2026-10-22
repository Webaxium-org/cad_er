import test from "node:test";
import assert from "node:assert/strict";
import { buildSlopeEdits, previewLongitudinalPurposes } from "./longitudinalLevels.js";
import { calculateVolumeReport } from "./volumeReport.js";

const sections = [0, 10, 20, 46, 60].map((distance, index) => {
  const source = { _id: `proposed-${index}`, type: "Chainage", chainage: `0/${String(distance).padStart(3, "0")}`, offsets: [-2, 0, 2], reducedLevels: [100, 100, 100] };
  return { id: `initial-${index}`, chainage: source.chainage, levels: [101, 100], sources: [{ row: { ...source, _id: `initial-${index}`, reducedLevels: [101, 101, 101] } }, { row: source }] };
});
const options = { rows: sections, levelIndex: 1, from: "0/000", to: "0/046", denominator: "10" };

test("falling 1 in 10 drops 4.600 m over 46 m and leaves other chainages untouched", () => {
  const result = buildSlopeEdits(options);
  assert.equal(result.startRl, 100);
  assert.equal(result.endRl, 95.4);
  assert.deepEqual(result.edits, { "initial-0-1": "100.000", "initial-1-1": "99.000", "initial-2-1": "98.000", "initial-3-1": "95.400" });
  assert.equal(sections[3].levels[1], 100);
});

test("rising slopes use the latest draft start RL, including interpolation", () => {
  const result = buildSlopeEdits({ ...options, from: "0/005", direction: "rising", edits: { "initial-0-1": "99", "initial-1-1": "101" } });
  assert.equal(result.startRl, 100);
  assert.equal(result.edits["initial-1-1"], "100.500");
  assert.equal(result.edits["initial-3-1"], "104.100");
  assert.equal(result.edits["initial-0-1"], undefined);
});

test("chainage ranges account for kilometre boundaries and custom separators", () => {
  const rows = sections.slice(0, 2).map((row, index) => ({ ...row, chainage: index ? "1+010" : "0+990" }));
  const result = buildSlopeEdits({ ...options, rows, from: "0+990", to: "1+010", separator: "+" });
  assert.equal(result.endRl, 98);
});

test("invalid ratios, reversed ranges, missing RLs and survey breaks cannot generate edits", () => {
  for (const denominator of ["", "0", "-10", "invalid", "Infinity", "1e-320"]) {
    assert.throws(() => buildSlopeEdits({ ...options, denominator }));
  }
  assert.throws(() => buildSlopeEdits({ ...options, from: "0/046", to: "0/000" }), /end after/);
  assert.throws(() => buildSlopeEdits({ ...options, to: "0/100" }), /within/);
  assert.throws(() => buildSlopeEdits({ ...options, breakChainages: [20] }), /break/);
  assert.throws(() => buildSlopeEdits({ ...options, edits: { "initial-1-1": "" } }), /invalid RLs/);
  assert.throws(() => buildSlopeEdits({ ...options, rows: sections.map((row, index) => index === 1 ? { ...row, sources: [row.sources[0], {}] } : row) }), /missing or invalid/);
});

test("slope previews feed the same shifted profiles and live volume calculation as manual RL edits", () => {
  const purposes = [0, 1].map((index) => ({ rows: sections.map((row) => row.sources[index].row) }));
  const result = buildSlopeEdits(options);
  const preview = previewLongitudinalPurposes(purposes, sections, result.edits);
  assert.deepEqual(preview[1].rows[3].reducedLevels, ["95.400", "95.400", "95.400"]);
  const survey = { type: "Road", separator: "/" };
  assert.ok(calculateVolumeReport(survey, ...preview).totalCuttingVolume > calculateVolumeReport(survey, ...purposes).totalCuttingVolume);
  assert.deepEqual(purposes[1].rows[3].reducedLevels, [100, 100, 100]);
});
