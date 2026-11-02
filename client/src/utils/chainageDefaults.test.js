import test from "node:test";
import assert from "node:assert/strict";
import { applyChainageDefaults } from "./chainageDefaults.js";

const defaults = { roadWidth: "10", spacing: "5" };
const draft = { type: "Chainage", chainage: "0/050", roadWidth: "", spacing: "" };

test("Next uses placeholder geometry without filling the original draft", () => {
  assert.deepEqual(applyChainageDefaults(draft, defaults), { ...draft, ...defaults });
  assert.equal(draft.roadWidth, "");
  assert.equal(draft.spacing, "");
});

test("each typed value overrides its own placeholder independently", () => {
  assert.deepEqual(applyChainageDefaults({ ...draft, roadWidth: "12" }, defaults), {
    ...draft, roadWidth: "12", spacing: "5",
  });
  assert.deepEqual(applyChainageDefaults({ ...draft, spacing: "2.5" }, defaults), {
    ...draft, roadWidth: "10", spacing: "2.5",
  });
  assert.deepEqual(applyChainageDefaults({ ...draft, roadWidth: "8", spacing: "2" }, defaults), {
    ...draft, roadWidth: "8", spacing: "2",
  });
});

test("clearing an override restores the placeholder; missing defaults remain required", () => {
  assert.equal(applyChainageDefaults({ ...draft, roadWidth: " " }, defaults).roadWidth, "10");
  assert.deepEqual(applyChainageDefaults(draft, {}), draft);
  assert.equal(applyChainageDefaults(draft, { roadWidth: "10" }).spacing, "");
});

test("zero and invalid explicit entries reach validation instead of silently using defaults", () => {
  for (const value of [0, "0", "-1", "invalid"]) {
    const result = applyChainageDefaults({ ...draft, roadWidth: value, spacing: value }, defaults);
    assert.equal(result.roadWidth, value);
    assert.equal(result.spacing, value);
  }
});

test("CP, TBM, and water level readings never receive chainage defaults", () => {
  for (const type of ["CP", "TBM", "Water Level"]) {
    const reading = { ...draft, type };
    assert.deepEqual(applyChainageDefaults(reading, defaults), reading);
  }
});
