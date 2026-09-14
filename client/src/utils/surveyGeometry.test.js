import test from "node:test";
import assert from "node:assert/strict";
import { profilePoints, profileLevel, compareProfiles, chainageValue } from "./surveyGeometry.js";
import { sectionPages } from "./sectionDrawing.js";
import { createSectionPdf } from "./sectionPdf.js";

const section = { type: "cs", chainage: "0/300", series: [
  { name: "Initial Level", color: "green", data: [-4, -3, 0, 3, 4].map((x, i) => ({ x, y: [8.830, 7.865, 7.340, 7.915, 8.855][i] })) },
  { name: "Proposed Level", color: "blue", data: [-3, -2.29, 0, 2.24, 3].map((x, i) => ({ x, y: [7.865, 7.155, 7.155, 7.155, 7.915][i] })) },
] };

test("reference interpolation never fabricates RL outside measured coverage", () => {
  const points = profilePoints([2, -1], [6, 7]);
  assert.ok(Math.abs(profileLevel(points, 0) - 6.6666666667) < 1e-9);
  assert.equal(profileLevel(points, -2), null);
  assert.equal(chainageValue("1/020"), 1020);
});

test("area uses matching physical offsets and splits cutting/filling at crossing", () => {
  const rows = compareProfiles({ offsets: [0, 2], reducedLevels: [2, 0] }, { offsets: [0, .5, 2], reducedLevels: [1, 1, 1] });
  assert.deepEqual(rows.map((r) => Number(r.offset)), [0, .5, 1, 2]);
  assert.equal(rows.reduce((sum, r) => sum + r.cuttingAreaSqMtr, 0), .5);
  assert.equal(rows.reduce((sum, r) => sum + r.fillingAreaSqMtr, 0), .5);
});

test("reference drawing uses true horizontal/vertical distances and blanks outside proposal", () => {
  const page = sectionPages(section, { horizontal: 150, vertical: 150 })[0];
  const blue = page.commands.filter((c) => c.kind === "line" && c.color === "blue");
  assert.ok(Math.abs((blue[0].x2 - blue[0].x1) - .71 * 1000 / 150) < 1e-8);
  assert.ok(Math.abs((blue[0].y2 - blue[0].y1) - .71 * 1000 / 150) < 1e-8);
  assert.equal(page.commands.filter((c) => c.kind === "text" && c.color === "blue").length, 5);
  assert.ok(page.commands.some((c) => c.value === "Offset"));
});

test("longitudinal drawing paginates without stretching horizontal scale", () => {
  const ls = { type: "ls", series: [{ name: "Proposed Level", color: "blue", data: [{ x: 0, y: 5.455 }, { x: 2335, y: 13.238333 }] }] };
  const pages = sectionPages(ls);
  assert.ok(pages.length > 1);
  const line = pages[0].commands.find((c) => c.kind === "line" && c.color === "blue");
  assert.ok(Math.abs((line.x2 - line.x1) - 234) < 1e-8);
  assert.throws(() => sectionPages(section, { vertical: -1 }), /positive/);
});

test("vector PDF exports both single and multiple sections", () => {
  const pdf = createSectionPdf([section, section], { horizontal: 150, vertical: 150 });
  assert.equal(pdf.getNumberOfPages(), 2);
  assert.ok(pdf.output("arraybuffer").byteLength > 1000);
});
