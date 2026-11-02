import test from "node:test";
import assert from "node:assert/strict";
import { getSectionLevelBands, withSectionBandLabelMargin } from "./sectionLevelBands.js";

test("full band labels get a wider margin without changing fonts, names or axis ranges", () => {
  const options = { layout: { margin: { l: 50, r: 30 }, font: { size: 12 }, xaxis: { range: [0, 140] } } };
  const section = { type: "ls", series: [{ name: "Initial Level" }, { name: "Proposed Level" }, { name: "Final Quarry Muck" }] };
  const result = withSectionBandLabelMargin(options, section);
  assert.ok(result.layout.margin.l >= "Final Quarry Muck".length * 12 * 0.65 + 16);
  assert.equal(result.layout.font, options.layout.font);
  assert.equal(result.layout.xaxis, options.layout.xaxis);
  assert.equal(options.layout.margin.l, 50);
  assert.equal(result.layout.margin.r, 30);
  assert.equal(section.series[1].name, "Proposed Level");
});

test("LS bands show every level followed by distinct ordered chainages", () => {
  const bands = getSectionLevelBands({ type: "ls", series: [
    { name: "Initial Level", color: "green", data: [{ x: 20, y: 10.5 }, { x: 0, y: 11 }] },
    { name: "Proposed Level", color: "blue", data: [{ x: 0, y: 10 }, { x: 20, y: 9 }] },
  ] });
  assert.deepEqual(bands.map((band) => band.name), ["Proposed Level", "Initial Level", "Chainage"]);
  assert.equal(bands[0].color, "blue");
  assert.deepEqual(bands[0].values.get(20), ["9.000"]);
  assert.deepEqual([...bands[2].values], [[0, ["0.000"]], [20, ["20.000"]]]);
});

test("CS bands use the union of offsets and preserve multiple levels at a vertical segment", () => {
  const bands = getSectionLevelBands({ type: "cs", series: [
    { name: "Initial Level", data: [{ x: -2, y: 10 }, { x: 0, y: 11 }, { x: 0, y: 12 }, { x: 0, y: 12 }] },
    { name: "Final Level", data: [{ x: 2, y: 12 }] },
  ] });
  assert.deepEqual(bands[1].values.get(0), ["11.000", "12.000"]);
  assert.equal(bands[2].name, "Offset");
  assert.deepEqual([...bands[2].values.keys()], [-2, 0, 2]);
});

test("break markers and missing RLs never become zero values in printed bands", () => {
  const bands = getSectionLevelBands({ type: "ls", series: [{ name: "Initial Level", data: [
    { x: 0, y: null }, { x: 10, y: "" }, { x: 20 }, { x: 30, y: 0 }, { x: null, y: 3 }, { x: "invalid", y: 4 },
  ] }] });
  assert.deepEqual([...bands[0].values], [[30, ["0.000"]]]);
  assert.deepEqual([...bands[1].values.keys()], [0, 10, 20, 30]);
});
