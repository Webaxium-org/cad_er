import test from "node:test";
import assert from "node:assert/strict";
import { splitLongitudinalRanges } from "./longitudinalPagination.js";

const section = (chainages) => ({ series: [{ data: chainages.map((x) => ({ x, y: 10 })) }] });

test("long profiles have contiguous ranges with no missing tail or extra final page", () => {
  assert.deepEqual(splitLongitudinalRanges(section([0, 100, 460]), 300)
    .map(({ range }) => range), [[0, 300], [300, 600]]);
  assert.equal(splitLongitudinalRanges(section([0, 100, 460]), 300).at(-1).end, 460);
  assert.deepEqual(splitLongitudinalRanges(section([100, 700]), 300)
    .map(({ range }) => range), [[100, 400], [400, 700]]);
});

test("dense profiles fit all labels and retain shared boundaries", () => {
  const input = section(Array.from({ length: 101 }, (_, x) => x));
  const pages = splitLongitudinalRanges(input, 300);
  assert.equal(pages.length, 3);
  pages.forEach(({ start, end }, index) => {
    assert.ok(input.series[0].data.filter(({ x }) => x >= start && x <= end).length <= 35);
    if (index) assert.equal(start, pages[index - 1].end);
  });
  assert.equal(pages.at(-1).end, 100);
});

test("all series contribute chainages, with duplicate break markers counted once", () => {
  const input = { series: [{ data: [{x:0,y:1},{x:300,y:null},{x:300,y:2}] }, {data:[{x:600,y:3}]}] };
  const before = JSON.stringify(input);
  assert.equal(splitLongitudinalRanges(input, 300).length, 2);
  assert.equal(JSON.stringify(input), before);
});

test("single chainage gets a nonzero range; invalid lengths and excessive exports are rejected", () => {
  assert.deepEqual(splitLongitudinalRanges(section([25]), 300), [{start:25,end:25,range:[25,325]}]);
  for (const length of [0, -1, "", NaN, Infinity]) {
    assert.throws(() => splitLongitudinalRanges(section([0, 1]), length), /greater than zero/);
  }
  assert.throws(() => splitLongitudinalRanges(section([]), 300), /No chainages/);
  assert.throws(() => splitLongitudinalRanges(section([0,100000]), 1), /200 pages/);
});
