import test from "node:test";
import assert from "node:assert/strict";
import { calculateAreaReport } from "./areaReport.js";
import { calculateVolumeReport } from "./volumeReport.js";
import { calculatePlottingQuantityReport } from "./plottingQuantityReport.js";

const section = (chainage, levels, offsets = [-2, 0, 2]) => ({
  type: "Chainage", chainage, offsets, reducedLevels: levels, roadWidth: "99",
});
const fixture = () => ({
  survey: { type: "Road Survey", separator: "/" },
  initial: { type: "Initial Level", rows: [section("0/000", [10, 10, 10]), section("0/010", [10, 10, 10])] },
  proposed: { type: "Proposed Level", rows: [section("0/000", [9, 9, 9]), section("0/010", [9, 9, 9])] },
});
const assertReportsMatch = ({ survey, initial, proposed }, deductions = []) => {
  const combined = calculatePlottingQuantityReport(survey, initial, proposed, deductions);
  const { areaReport, ...volume } = combined;
  assert.deepEqual(volume, calculateVolumeReport(survey, initial, proposed, deductions));
  assert.deepEqual(areaReport, calculateAreaReport(survey, initial, proposed));
  return combined;
};

test("plotting uses the fixed-bottom-width volume rule rather than its offset-integrated area", () => {
  const data = fixture();
  data.proposed.proposalMethod = "Bottom Width Fixed";
  data.proposed.bottomWidth = 3;
  const result = assertReportsMatch(data);
  assert.equal(result.totalCuttingVolume, 30);
  assert.equal(result.rows[0].cuttingAreaSqMtr, "3.000");
  assert.equal(result.rows[0].width, "3.000");
  assert.equal(result.areaReport[0].totalCuttingAreaSqMtr, 4);
  assert.equal(result.areaReport[0].data[1].cuttingAreaSqMtr, "2.000");
});

test("waterway volume keeps kilometres and uses the standalone precision before rounding", () => {
  const data = fixture();
  data.survey.type = "Water Way";
  data.initial.rows = [section("0/990", [10, 10], [0, 2.7]), section("1/010", [10, 10], [0, 2.7])];
  data.proposed.rows = [section("0/990", [9.6666, 9.6666], [0, 2.7]), section("1/010", [9.6666, 9.6666], [0, 2.7])];
  const result = assertReportsMatch(data);
  assert.equal(result.rows[1].difference, "20.000");
  assert.equal(result.rows[1].section, "1010.000");
  assert.equal(result.totalCuttingVolume, 18.004);
  assert.ok(Math.abs(result.areaReport[0].totalCuttingAreaSqMtr - 0.90018) < 1e-10);
});

test("road area rows preserve the standalone cut/fill transition and displayed precision", () => {
  const data = fixture();
  data.initial.rows[0].reducedLevels = [10, 10, 10];
  data.proposed.rows[0].reducedLevels = [9, 11, 9];
  const result = assertReportsMatch(data);
  const area = result.areaReport[0];
  assert.equal(area.totalCuttingAreaSqMtr, 1);
  assert.equal(area.totalFillingAreaSqMtr, 1);
  assert.deepEqual(area.data.map((point) => point.cuttingAreaSqMtr), ["0.000", "0.000", "1.000"]);
  assert.deepEqual(area.data.map((point) => point.fillingAreaSqMtr), ["0.000", "1.000", "0.000"]);
  assert.equal(result.rows[0].width, "4.000"); // Ignore the stale roadWidth metadata (99).
});

test("breaks, deductions and water readings follow the standalone report rules", () => {
  let data = fixture();
  const deduction = [{ from: "0/000", to: "0/010", remark: "Bridge" }];
  assert.equal(assertReportsMatch(data, deduction).totalCuttingVolume, 0);
  data.initial.rows.splice(1, 0, { type: "Break", from: "0/000", remarks: ["Gap"] });
  const result = assertReportsMatch(data);
  assert.equal(result.totalCuttingVolume, 0);
  assert.equal(result.areaReport[1].type, "Break");
  assert.equal(result.areaReport[1].message, "Gap");
  assert.equal(result.rows[1].isBreak, true);
  data = fixture();
  data.initial.rows.splice(1, 0, { type: "Water Level", reducedLevels: [100] });
  assert.equal(assertReportsMatch(data).areaReport.length, 2);
});

test("missing secondary sections remain in Area Report and are flagged by waterway volume", () => {
  const data = fixture();
  data.survey.type = "Water Way";
  data.proposed.rows.pop();
  const result = assertReportsMatch(data);
  assert.deepEqual(result.missingSections, ["0/010"]);
  assert.equal(result.areaReport.length, 2);
  assert.equal(result.areaReport[1].section, 10);
  assert.deepEqual(result.areaReport[1].data, []);
});
