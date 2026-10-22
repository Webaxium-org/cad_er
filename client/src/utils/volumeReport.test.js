import test from "node:test";
import assert from "node:assert/strict";
import { calculateVolumeReport } from "./volumeReport.js";
import { previewLongitudinalPurposes } from "./longitudinalLevels.js";

const section = (id, chainage, level) => ({
  _id: id, type: "Chainage", chainage, offsets: [-2, 0, 2], reducedLevels: [level, level, level],
});
const fixture = () => {
  const initial = { _id: "initial", rows: [section("i1", "0/000", 10), section("i2", "0/010", 10)] };
  const proposed = { _id: "proposed", rows: [section("p1", "0/000", 9), section("p2", "0/010", 9)] };
  const levelRows = initial.rows.map((row, index) => ({
    id: row._id, levels: [10, 9], sources: [{ row }, { row: proposed.rows[index] }],
  }));
  return { initial, proposed, levelRows, survey: { type: "Road", separator: "/" } };
};

test("live RL edits decrease and increase the same cross-section quantity used by the volume report", () => {
  const { initial, proposed, levelRows, survey } = fixture();
  assert.equal(calculateVolumeReport(survey, initial, proposed).totalCuttingVolume, 40);
  const changed = previewLongitudinalPurposes([initial, proposed], levelRows, { "i1-1": "9.5", "i2-1": "9.5" });
  assert.equal(calculateVolumeReport(survey, ...changed).totalCuttingVolume, 20);
  const increased = previewLongitudinalPurposes([initial, proposed], levelRows, { "i1-0": "11" });
  assert.equal(calculateVolumeReport(survey, ...increased).totalCuttingVolume, 60);
  assert.deepEqual(proposed.rows[0].reducedLevels, [9, 9, 9]);
});

test("raising the proposed RL above ground switches cutting to filling", () => {
  const { initial, proposed, levelRows, survey } = fixture();
  const changed = previewLongitudinalPurposes([initial, proposed], levelRows, { "i1-1": "11", "i2-1": "11" });
  const quantity = calculateVolumeReport(survey, ...changed);
  assert.equal(quantity.totalCuttingVolume, 0);
  assert.equal(quantity.totalFillingVolume, 40);
});

test("breaks and deductions retain the volume report's exclusion rules", () => {
  const { initial, proposed, survey } = fixture();
  assert.equal(calculateVolumeReport(survey, initial, proposed, [{ from: "0/000", to: "0/010" }]).totalCuttingVolume, 0);
  initial.rows.splice(1, 0, { type: "Break", remarks: ["Gap"] });
  assert.equal(calculateVolumeReport(survey, initial, proposed).totalCuttingVolume, 0);
});

test("fixed bottom width and channel profiles use the report geometry", () => {
  const { initial, proposed, survey } = fixture();
  assert.equal(calculateVolumeReport({ ...survey, type: "Water Way" }, initial, proposed).totalCuttingVolume, 40);
  proposed.proposalMethod = "Bottom Width Fixed";
  proposed.bottomWidth = 3;
  assert.equal(calculateVolumeReport(survey, initial, proposed).totalCuttingVolume, 30);
});

test("incomplete channels are flagged and invalid drafts never become zero RLs", () => {
  const { initial, proposed, levelRows, survey } = fixture();
  const changed = previewLongitudinalPurposes([initial, proposed], levelRows, { "i1-1": "", "i2-1": "invalid" });
  assert.deepEqual(changed[1].rows[0].reducedLevels, [9, 9, 9]);
  proposed.rows.pop();
  assert.deepEqual(calculateVolumeReport({ ...survey, type: "Water Way" }, initial, proposed).missingSections, ["0/010"]);
});
