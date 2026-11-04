import test from "node:test";
import assert from "node:assert/strict";
import { applyProposalWorkspace, proposalDesignQuantity, validateProposalBreaks } from "../helper/proposalWorkspace.js";
import { calculateVolumeReport } from "../../client/src/utils/volumeReport.js";

const survey = { type: "Road", separator: "/" };
const fixture = (levels = [10, 10, 10]) => ({ pls: 0, quantity: 80, rows: ["0/000", "0/010", "0/020"].map((chainage) => ({
  type: "Chainage", chainage, offsets: [-2, 0, 2], reducedLevels: [...levels],
  intermediateOffsets: [-2, 0, 2].map((offset) => ({ offset })),
})) });
const normalize = (purpose) => ({ ...purpose, rows: purpose.rows.map((row) => ({ ...row, offsets: row.intermediateOffsets.map((point) => point.offset) })) });

test("custom segments join continuously, preserve cross-section shape and leave outside rows unchanged", () => {
  const base = fixture(), seed = fixture([10, 11, 12]);
  seed.rows.push({ ...structuredClone(seed.rows[0]), chainage: "0/030" });
  base.rows.push({ ...structuredClone(base.rows[0]), chainage: "0/030" });
  const copy = structuredClone(seed);
  const result = applyProposalWorkspace(survey, base, seed, { ls: { enabled: true, strategy: "custom", custom: { segments: [
    { from: "0/000", to: "0/010", grade: 2.5 },
    { from: "0/010", to: "0/020", grade: -1.8 },
  ] } } });
  assert.deepEqual(result.rows.map(row => row.reducedLevels[1]), ["11.000", "11.250", "11.070", "11.000"]);
  assert.deepEqual(result.rows[2].reducedLevels, ["10.070", "11.070", "12.070"]);
  assert.deepEqual(seed, copy);
});

test("custom segments validate ranges, slopes, overlaps and breaks while supporting legacy slopes", () => {
  const base = fixture(), seed = fixture([11, 11, 11]);
  const apply = (segments, extra = {}) => applyProposalWorkspace(survey, base, seed, { ...extra, ls: { enabled: true, strategy: "custom", custom: { segments } } });
  const segment = { from: "0/000", to: "0/020", grade: 1 };
  assert.throws(() => apply([]), /between 1 and 100/);
  assert.throws(() => apply([{ ...segment, grade: "" }]), /valid custom slope/);
  assert.throws(() => apply([{ ...segment, grade: "abc" }]), /valid custom slope/);
  assert.throws(() => apply([{ ...segment, to: "0/015" }]), /within the proposal/);
  assert.throws(() => apply([{ ...segment, from: "0/020", to: "0/000" }]), /increasing order/);
  assert.throws(() => apply([segment, { ...segment, from: "0/010" }]), /without overlap/);
  assert.throws(() => apply([segment], { breaks: [{ from: "0/010", to: "0/020" }] }), /cannot cross/);
  const legacy = applyProposalWorkspace(survey, base, seed, { ls: { enabled: true, strategy: "custom", custom: { from: "0/010", to: "0/020", denominator: "100", direction: "falling" } } });
  assert.deepEqual(legacy.rows.map(row => row.reducedLevels[1]), ["11.000", "11.000", "10.900"]);
});

test("optional solver matches volume report for road, channel and fixed bed geometry", () => {
  for (const type of ["Road", "Water Way"]) for (const method of [undefined, "Bottom Width Fixed"]) {
    const base = fixture([11, 10, 9]);
    const proposal = { ...fixture([10, 10, 10]), proposalMethod: method, bottomWidth: 3 };
    const context = { ...survey, type };
    const calculated = proposalDesignQuantity(context, base, proposal);
    const report = calculateVolumeReport(context, base, proposal);
    assert.equal(calculated.cutting, report.totalCuttingVolume);
    assert.equal(calculated.filling, report.totalFillingVolume);
  }
});

test("manual RLs, anchored LS grade and CS crossfall preserve the source", () => {
  const base = fixture(), seed = fixture([11, 11, 11]);
  const copy = structuredClone(seed);
  const manual = applyProposalWorkspace(survey, base, seed, { mode: "manual", manualLevels: { "0/000": 12, "0/010": 13, "0/020": 14 } });
  assert.deepEqual(manual.rows.map((row) => row.reducedLevels[1]), ["12.000", "13.000", "14.000"]);
  const result = applyProposalWorkspace(survey, base, seed, { ls: { enabled: true, grade: 2, strategy: "anchor", anchorRl: 10 }, cs: { superelevationEnabled: true, superelevation: 5 } });
  assert.deepEqual(result.rows[1].reducedLevels, ["10.100", "10.200", "10.300"]);
  assert.deepEqual(seed, copy);
});

test("quantity grade targets the report volume and minimum strategy reduces earthworks", () => {
  const base = fixture(), seed = fixture([11, 11, 11]);
  const result = applyProposalWorkspace(survey, base, seed, { ls: { enabled: true, grade: 1, strategy: "quantity", quantityType: "filling" } });
  assert.ok(Math.abs(calculateVolumeReport(survey, base, normalize(result)).totalFillingVolume - 80) < 0.1);
  const minimum = applyProposalWorkspace(survey, base, seed, { ls: { enabled: true, grade: 0, strategy: "minimum" } });
  assert.equal(proposalDesignQuantity(survey, base, minimum).filling, 0);
  assert.equal(proposalDesignQuantity(survey, base, minimum).cutting, 0);
});

test("breaks exclude complete chainage ranges without changing legacy quantities", () => {
  const base = fixture(), seed = fixture([11, 11, 11]);
  assert.equal(calculateVolumeReport(survey, base, seed).totalFillingVolume, 80);
  const result = applyProposalWorkspace(survey, base, seed, { breaks: [{ from: "0/000", to: "0/010" }] });
  assert.equal(calculateVolumeReport(survey, base, normalize(result)).totalFillingVolume, 40);
  assert.equal(proposalDesignQuantity(survey, base, result, result.designSettings.breaks).filling, 40);
  assert.throws(() => validateProposalBreaks(base, [{ from: "0/000", to: "0/020" }, { from: "0/010", to: "0/020" }]), /overlap/);
  assert.throws(() => validateProposalBreaks(base, [{ from: "0/000", to: "0/015" }]), /existing/);
  assert.throws(() => applyProposalWorkspace(survey, base, seed, { breaks: [{ from: "0/000", to: "0/020" }], ls: { enabled: true, grade: 0, strategy: "quantity" } }), /cannot be reached/);
});

test("water template keeps a flat bed and 1:0 produces a flat cross-section", () => {
  const result = applyProposalWorkspace(survey, fixture(), fixture(), { template: "water", cs: { slopeEnabled: true, horizontal: 1, vertical: 1, bedWidth: 2 } });
  assert.deepEqual(result.rows[0].reducedLevels, ["11.000", "10.000", "11.000"]);
  const flat = applyProposalWorkspace(survey, fixture(), fixture([9, 10, 9]), { cs: { slopeEnabled: true, horizontal: 1, vertical: 0 } });
  assert.deepEqual(flat.rows[0].reducedLevels, ["10.000", "10.000", "10.000"]);
});
