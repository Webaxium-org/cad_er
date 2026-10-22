import test from "node:test";
import assert from "node:assert/strict";
import { autoSplitLongitudinalRanges, splitLongitudinalRanges, splitLongitudinalSections } from "./longitudinalPagination.js";

const section = chainages => ({ type: "ls", chainages, series: [{ name: "Initial Level", data: chainages.map(x => ({ x, y: 10 })) }] });

test("dense tail chainages split automatically even when the total label count is small", () => {
  const values = [0, 20, 40, 46, 60, 80, 100, 120, 140, 160, 180, 200, 220, 227, 232, 240, 260, 262, 273];
  const ranges = autoSplitLongitudinalRanges(section(values));
  assert.equal(ranges.length, 2);
  assert.equal(ranges[0].start, 0);
  assert.equal(ranges.at(-1).end, 273);
  assert.equal(ranges[0].end, ranges[1].start);
  for (const range of ranges) {
    const visible = values.filter(x => x >= range.start && x <= range.end);
    for (let index = 1; index < visible.length; index++) {
      assert.ok((visible[index] - visible[index - 1]) / (range.end - range.start) * 600 >= 16);
    }
  }
});

test("short profiles remain on one page and long profiles retain every interval", () => {
  assert.equal(autoSplitLongitudinalRanges(section([0, 20, 40])).length, 1);
  const values = Array.from({ length: 100 }, (_, index) => index * 20);
  const pages = splitLongitudinalSections(section(values));
  assert.ok(pages.length > 1);
  assert.deepEqual([...new Set(pages.flatMap(page => page.section.chainages))], values);
  pages.forEach((page, index) => {
    assert.ok(page.section.chainages.length <= 35);
    if (index) assert.equal(page.start, pages[index - 1].end);
  });
});

test("page sections retain null break markers and include offsets from every level", () => {
  const input = section([0, 20, 40]);
  input.series[0].data.splice(1, 0, { x: 20, y: null });
  input.series.push({ name: "Proposed Level", data: [{ x: 39, y: 11 }, { x: 40, y: 12 }] });
  const pages = splitLongitudinalSections(input);
  assert.ok(pages.length > 1);
  assert.ok(pages.some(page => page.section.series[0].data.some(point => point.y === null)));
  assert.ok(pages.some(page => page.section.series[1].data.some(point => point.x === 39)));
  assert.ok(pages.every(page => page.section.allRl.every(Number.isFinite)));
  assert.equal(input.series[0].data.length, 4);
});

test("empty, single-point, duplicate and invalid positions are handled without empty chunks", () => {
  assert.deepEqual(autoSplitLongitudinalRanges(section([])), []);
  assert.deepEqual(autoSplitLongitudinalRanges(section([10])), [{ start: 10, end: 10, range: [10, 11] }]);
  const input = section([0, 0, 20]);
  input.series[0].data.push({ x: null, y: 2 }, { x: "bad", y: 2 });
  assert.deepEqual(autoSplitLongitudinalRanges(input), [{ start: 0, end: 20, range: [0, 20] }]);
  assert.throws(() => autoSplitLongitudinalRanges(input, { maxLabels: 1 }));
});

test("standalone exports default to automatic ranges and still support an explicit range limit", () => {
  const input = section([0, 20, 40, 60, 80]);
  assert.deepEqual(splitLongitudinalRanges(input), autoSplitLongitudinalRanges(input));
  assert.equal(splitLongitudinalRanges(input, 40).length, 2);
});
