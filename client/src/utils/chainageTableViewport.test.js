import test from "node:test";
import assert from "node:assert/strict";
import { chainageTableViewport } from "./chainageTableViewport.js";

test("table scroll pans the graph by actual chainages, excluding the pinned label column", () => {
  const stations = [0, 10, 20, 30, 40, 50];
  assert.deepEqual(chainageTableViewport(stations, 0, 296), [-5, 15]);
  assert.deepEqual(chainageTableViewport(stations, 208, 296), [15, 35]);
  assert.deepEqual(chainageTableViewport(stations, 9999, 296), [35, 55]);
});

test("uneven station spacing, kilometre boundaries and fractional scrolling remain aligned", () => {
  assert.deepEqual(chainageTableViewport([990, 1000, 1050, 1200], 104, 296), [995, 1125]);
  assert.deepEqual(chainageTableViewport([0, 10, 20, 30], 52, 296), [0, 20]);
});

test("resizing expands the visible range; invalid or single-station data cannot create a zero-width graph", () => {
  assert.deepEqual(chainageTableViewport([0, 10, 20, 30], 0, 504), [-5, 35]);
  assert.equal(chainageTableViewport([10], 0, 300), null);
  assert.equal(chainageTableViewport([0, NaN], 0, 300), null);
  assert.equal(chainageTableViewport([0, 10], 0, 80), null);
});
