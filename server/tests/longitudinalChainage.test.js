import test from "node:test";
import assert from "node:assert/strict";
import { buildChainagePlan, applyChainageLevels, parseChainage } from "../helper/longitudinalChainage.js";
import { calculateVolumeReport } from "../../client/src/utils/volumeReport.js";
import { calculateTableData } from "../../client/src/pages/survey/components/calculateTableData.js";

export const fixture = () => {
  const section = (id, chainage, levels, hi = "15.000") => ({
    _id: id, type: "Chainage", chainage, purposeId: "initial", roadWidth: "4", spacing: "2",
    heightOfInstrument: hi, reducedLevels: levels,
    intermediateOffsets: ["-2", "0", "2"].map((offset, index) => ({ offset, is: (Number(hi) - Number(levels[index])).toFixed(3), mode: "R" })),
  });
  const rows = [
    { _id: "setup", purposeId: "initial", type: "Instrument setup", backSight: "5", reducedLevels: ["10"] },
    section("left", "0/000", ["8", "10", "8"]),
    section("right", "0/100", ["10", "12", "10"]),
  ];
  return { survey: { separator: "/" }, chainage: "0/050", referencePurposeId: "initial", purposes: [
    { _id: "initial", type: "Initial Level", phase: "Actual", pls: "0", rows },
    { _id: "proposal", type: "Proposed Level", phase: "Proposal", rows: [
      { ...section("pleft", "0/000", ["9", "11", "9"]), purposeId: "proposal" },
      { ...section("pright", "0/100", ["11", "13", "11"]), purposeId: "proposal" },
    ] },
  ] };
};

test("interpolates full sections in every level and applies RL shifts with consistent HI/IS", () => {
  const plan = buildChainagePlan(fixture());
  assert.equal(plan.chainage, "0/050");
  assert.deepEqual(plan.entries.map((entry) => entry.rl), [11, 12]);
  assert.deepEqual(plan.entries[0].levels, [9, 11, 9]);
  const rows = applyChainageLevels(plan, [{ purposeId: "initial", rl: "11.5" }, { purposeId: "proposal", rl: "12" }]);
  assert.deepEqual(rows[0].reducedLevels, ["9.500", "11.500", "9.500"]);
  assert.deepEqual(rows[1].reducedLevels, ["10.000", "12.000", "10.000"]);
  rows.forEach((row) => row.intermediateOffsets.forEach((point, index) => {
    assert.equal((Number(row.heightOfInstrument) - Number(point.is)).toFixed(3), row.reducedLevels[index]);
    assert.equal(point.mode, "R");
  }));
});

test("canonical chainages support decimals, kilometre transitions and custom separators", () => {
  assert.equal(parseChainage("1/005.125"), 1005.125);
  const data = fixture();
  data.chainage = "50.125";
  assert.equal(buildChainagePlan(data).chainage, "0/050.125");
  data.survey.separator = "+";
  data.chainage = "0+025";
  data.purposes.forEach((purpose) => purpose.rows.forEach((row) => { if (row.chainage) row.chainage = row.chainage.replace("/", "+"); }));
  assert.equal(buildChainagePlan(data).chainage, "0+025");
  for (const value of ["", "-1", "1/1000", "1.5/000", "0/1e2", "NaN", "0/0/1", "0/1.0001"]) assert.throws(() => parseChainage(value));
});

test("rejects numerically duplicate stations, extrapolation and breaks without mutating readings", () => {
  for (const chainage of ["0/000", "100", "0/120"]) assert.throws(() => buildChainagePlan({ ...fixture(), chainage }));
  const data = fixture();
  data.purposes[0].rows.splice(2, 0, { type: "Break" });
  const original = structuredClone(data);
  assert.throws(() => buildChainagePlan(data), /break/);
  assert.deepEqual(data, original);
});

test("uses the instrument setup immediately before insertion, including CP changes", () => {
  const data = fixture();
  data.purposes[0].rows.splice(2, 0, { type: "CP", heightOfInstrument: "20" });
  const plan = buildChainagePlan(data);
  assert.equal(plan.entries[0].hi, 20);
  assert.equal(plan.entries[0].insertionIndex, 3);
  const rows = applyChainageLevels(plan, plan.entries.map(({ purposeId, rl }) => ({ purposeId, rl })));
  assert.equal(rows[0].intermediateOffsets[1].is, "9.000");
});

test("rejects incomplete, incompatible or missing cross-sections and invalid RL submissions", () => {
  let data = fixture();
  data.purposes[1].rows[1].intermediateOffsets[0].offset = "-3";
  assert.throws(() => buildChainagePlan(data), /matching offsets/);
  data = fixture(); data.purposes[0].rows[1].reducedLevels[0] = "";
  assert.throws(() => buildChainagePlan(data), /Complete cross-section/);
  data = fixture(); data.purposes[1].rows.pop();
  assert.throws(() => buildChainagePlan(data), /between existing/);
  const plan = buildChainagePlan(fixture());
  for (const levels of [[], [{ purposeId: "initial", rl: "" }, { purposeId: "proposal", rl: 12 }],
    [{ purposeId: "initial", rl: 11 }, { purposeId: "initial", rl: 12 }],
    [{ purposeId: "initial", rl: 11 }, { purposeId: "foreign", rl: 12 }]]) {
    assert.throws(() => applyChainageLevels(plan, levels));
  }
});

test("insertion preserves linear-section quantities and field-book RLs in station order", () => {
  const data = fixture();
  const normalize = (row) => ({ ...row, offsets: row.intermediateOffsets?.map((entry) => entry.offset) || [], remarks: [] });
  data.purposes.forEach((purpose) => { purpose.rows = purpose.rows.map(normalize); });
  const before = calculateVolumeReport(data.survey, ...data.purposes);
  const plan = buildChainagePlan(data);
  const inserted = applyChainageLevels(plan, plan.entries.map(({ purposeId, rl }) => ({ purposeId, rl })));
  data.purposes.forEach((purpose, index) => {
    purpose.rows.splice(plan.entries[index].insertionIndex, 0, normalize(inserted[index]));
  });
  const after = calculateVolumeReport(data.survey, ...data.purposes);
  assert.equal(before.totalFillingVolume, 400);
  assert.equal(after.totalFillingVolume, before.totalFillingVolume);
  assert.equal(after.totalCuttingVolume, before.totalCuttingVolume);
  const fieldBook = calculateTableData({ ...data.survey, reducedLevel: "10", purposes: [data.purposes[0]] });
  const newStation = fieldBook.filter((row) => row.CH === "0/050");
  assert.equal(newStation.length, 1);
  assert.equal(newStation[0].RL, inserted[0].reducedLevels[0]);
  assert.deepEqual(fieldBook.filter((row) => row.CH).map((row) => row.CH), ["0/000", "0/050", "0/100"]);
});
