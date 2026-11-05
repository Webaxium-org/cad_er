import test from "node:test";
import assert from "node:assert/strict";
import { graphSpanAtScale, printedGraphScale } from "./graphScale.js";

test("selected LS print scales match the actual scales on the exported A4 plot", () => {
  const widthMm = 163 * 900 / 1000;
  const heightMm = 163 * 220 / 1000;
  for (const [horizontal, vertical] of [[2400, 300], [1000, 100], [500, 50]]) {
    const xSpan = graphSpanAtScale(widthMm, horizontal);
    const ySpan = graphSpanAtScale(heightMm, vertical);
    const actual = printedGraphScale({ xRange: [100, 100 + xSpan], yRange: [10, 10 + ySpan] }, widthMm, heightMm);
    assert.ok(Math.abs(actual.horizontal - horizontal) < 1e-8);
    assert.ok(Math.abs(actual.vertical - vertical) < 1e-8);
  }
});

test("invalid print scales cannot produce an export", () => {
  for (const scale of [0, -1, "", NaN, Infinity]) assert.throws(() => graphSpanAtScale(150, scale), /positive/);
});
