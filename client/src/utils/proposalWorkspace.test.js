import test from "node:test";
import assert from "node:assert/strict";
import { stoppingSightDistance, proposalGraphSeries, graphTicks } from "./proposalWorkspace.js";

test("SSD combines reaction and grade-adjusted braking distance in SI units", () => {
  const inputs = { speed: 72, reaction: 2.5, deceleration: 3.4, grade: 0 };
  const flat = stoppingSightDistance(inputs);
  assert.ok(Math.abs(flat - (50 + 400 / 6.8)) < 1e-9);
  assert.ok(stoppingSightDistance({ ...inputs, grade: 5 }) < flat);
  assert.ok(stoppingSightDistance({ ...inputs, grade: -5 }) > flat);
  for (const speed of ["", "bad", -10, 0]) assert.equal(stoppingSightDistance({ ...inputs, speed }), null);
  assert.equal(stoppingSightDistance({ ...inputs, grade: -100 }), null);
});

test("LS graph interpolates center RL, breaks the excluded range and CS shows selected offsets", () => {
  const base = { pls: 0, rows: ["0/000", "0/010", "0/020"].map((chainage) => ({ type: "Chainage", chainage, offsets: [-2, 2], reducedLevels: [9, 11] })) };
  const proposal = { ...base, designSettings: { breaks: [{ from: "0/000", to: "0/010" }] } };
  const series = proposalGraphSeries(base, proposal, "ls");
  assert.deepEqual(series[0].points, [{ x: 0, y: 10 }, { x: 10, y: 10 }, { x: 20, y: 10 }]);
  assert.equal(series[1].points[1], null);
  assert.deepEqual(proposalGraphSeries(base, null, "cs", "0/010")[0].points, [{ x: -2, y: 9 }, { x: 2, y: 11 }]);
  assert.ok(graphTicks(9.1, 9.2).every((tick) => tick >= 9.1 && tick <= 9.2));
});
