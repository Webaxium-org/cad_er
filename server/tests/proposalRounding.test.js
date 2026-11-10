import test from "node:test";
import assert from "node:assert/strict";
import { roundProposalLevel, roundProposalLevels } from "../helper/proposalRounding.js";
import { applyProposalWorkspace, proposalDesignQuantity } from "../helper/proposalWorkspace.js";
import { calculateVolumeReport } from "../../client/src/utils/volumeReport.js";

test("proposal RLs round to nearest 5 mm with stable ties and three decimal places", () => {
  for (const [input, expected] of [
    [9.114, "9.115"], ["9.112", "9.110"], [9.115, "9.115"], [9.1125, "9.115"],
    [9.1175, "9.120"], [9.999, "10.000"], [0.002, "0.000"], [0.003, "0.005"],
    [-9.114, "-9.115"], [-9.112, "-9.110"], [-9.1125, "-9.115"], [-0.002, "0.000"],
  ]) {
    assert.equal(roundProposalLevel(input), expected);
    assert.equal(roundProposalLevel(expected), expected, "Rounding must be idempotent");
  }
  for (const input of ["", null, undefined, "invalid", NaN, Infinity]) assert.throws(() => roundProposalLevel(input), /invalid RL/);
});

test("rounding changes only proposed chainage RLs, preserving source and observed readings", () => {
  const purpose = { rows: [
    { type: "Chainage", reducedLevels: ["9.114", "9.112"], interpolatedReducedLevels: ["9.114", "9.112"], intermediateOffsets: [{ offset: "-1.114" }, { offset: "1.112" }] },
    { type: "TBM", reducedLevels: ["9.112"] },
  ] };
  const copy = structuredClone(purpose);
  const rounded = roundProposalLevels(purpose);
  assert.deepEqual(rounded.rows[0].reducedLevels, ["9.115", "9.110"]);
  assert.deepEqual(rounded.rows[0].interpolatedReducedLevels, purpose.rows[0].interpolatedReducedLevels);
  assert.deepEqual(rounded.rows[0].intermediateOffsets, purpose.rows[0].intermediateOffsets);
  assert.deepEqual(rounded.rows[1], purpose.rows[1]);
  assert.deepEqual(purpose, copy);
});

test("manual proposal preview RLs and quantity calculations use the same rounded levels", () => {
  const survey = { type: "Road", separator: "/" };
  const base = { pls: 0, rows: ["0/000", "0/010"].map(chainage => ({
    type: "Chainage", chainage, reducedLevels: ["9.000", "9.000", "9.000"],
    intermediateOffsets: [-2, 0, 2].map(offset => ({ offset })),
  })) };
  const copy = structuredClone(base);
  const proposal = applyProposalWorkspace(survey, base, base, {
    mode: "manual", manualLevels: { "0/000": "9.114", "0/010": "9.112" },
  });
  assert.deepEqual(proposal.rows.map(row => row.reducedLevels), [Array(3).fill("9.115"), Array(3).fill("9.110")]);
  const normalize = purpose => ({ ...purpose, rows: purpose.rows.map(row => ({ ...row, offsets: row.intermediateOffsets.map(point => point.offset) })) });
  const calculated = proposalDesignQuantity(survey, base, proposal);
  const report = calculateVolumeReport(survey, normalize(base), normalize(proposal));
  assert.equal(report.totalFillingVolume, 4.5);
  assert.equal(calculated.filling, report.totalFillingVolume);
  assert.deepEqual(base, copy);
});

test("quantity solver chooses the nearest achievable 5 mm profile without artificial grade steps", () => {
  const survey = { type: "Road", separator: "/" };
  const base = { pls: 0, rows: ["0/000", "0/010", "0/020"].map(chainage => ({
    type: "Chainage", chainage, reducedLevels: [10, 10, 10],
    intermediateOffsets: [-2, 0, 2].map(offset => ({ offset })),
  })) };
  for (const [quantity, expected] of [[0.19, "10.000"], [0.21, "10.005"]]) {
    const proposal = applyProposalWorkspace(survey, base, { ...base, quantity }, {
      ls: { enabled: true, strategy: "quantity", quantityType: "filling", grade: "0" },
    });
    assert.deepEqual(proposal.rows.map(row => row.reducedLevels[1]), Array(3).fill(expected));
  }
  const graded = applyProposalWorkspace(survey, base, { ...base, quantity: 20 }, {
    ls: { enabled: true, strategy: "quantity", quantityType: "filling", grade: "5" },
  });
  assert.ok(Math.abs(Number(graded.rows[2].reducedLevels[1]) - Number(graded.rows[0].reducedLevels[1]) - 1) < 1e-10);
});

test("minimum-earthwork solver selects the nearest 5 mm level for non-grid ground", () => {
  const survey = { type: "Road", separator: "/" };
  const base = { pls: 0, rows: ["0/000", "0/010"].map(chainage => ({
    type: "Chainage", chainage, reducedLevels: ["9.112", "9.112", "9.112"],
    intermediateOffsets: [-2, 0, 2].map(offset => ({ offset })),
  })) };
  const result = applyProposalWorkspace(survey, base, base, { ls: { enabled: true, strategy: "minimum", grade: "0" } });
  assert.deepEqual(result.rows.map(row => row.reducedLevels), [Array(3).fill("9.110"), Array(3).fill("9.110")]);
});
