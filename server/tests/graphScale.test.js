import test from "node:test";
import assert from "node:assert/strict";
import { printedGraphScale, graphScaleLabel } from "../../client/src/utils/graphScale.js";

test("metres to paper millimetres gives independent horizontal and vertical scales", () => {
  assert.deepEqual(printedGraphScale({ xRange: [0, 30], yRange: [5, 25] }, 150, 100), { horizontal: 200, vertical: 200 });
  assert.deepEqual(printedGraphScale({ xRange: [-15, 15], yRange: [10, 12] }, 150, 100), { horizontal: 200, vertical: 20 });
});
test("shrinking a graph changes the stated scale, while reversing axes does not", () => {
  const area = { xRange: [30, 0], yRange: [25, 5] };
  assert.deepEqual(printedGraphScale(area, 75, 50), { horizontal: 400, vertical: 400 });
});
test("rotated combined-report dimensions retain data X and Y rather than paper orientation", () => {
  const plotWidthPx = 600, plotHeightPx = 200;
  const wholeWidthPx = 800, wholeHeightPx = 500;
  const rotatedWidthMm = 100, rotatedHeightMm = 160;
  const result = printedGraphScale({ xRange: [0, 30], yRange: [0, 4] },
    rotatedHeightMm * plotWidthPx / wholeWidthPx, rotatedWidthMm * plotHeightPx / wholeHeightPx);
  assert.deepEqual(result, { horizontal: 250, vertical: 100 });
});
test("invalid or nonlinear axes never claim a metric drawing scale", () => {
  for (const area of [null, {}, { xRange: [0, 0], yRange: [0, 1] },
    { xRange: [null, 2], yRange: [0, 1] }, { xRange: [0, 2], yRange: [0, 1], xType: "log" }]) {
    assert.equal(printedGraphScale(area, 100, 100), null);
  }
  assert.equal(printedGraphScale({ xRange: [0, 2], yRange: [0, 1] }, 0, 100), null);
  assert.equal(graphScaleLabel(null), "Drawing scale unavailable");
  assert.equal(graphScaleLabel({ horizontal: 250, vertical: 100 }), "X scale 1:250    Y scale 1:100");
});
