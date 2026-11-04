import test from "node:test";
import assert from "node:assert/strict";
import { initialPreviewState, proposalPreviewReducer } from "./proposalPreviewState.js";

test("grade edits retain the last calculated graph and start RL during loading and errors", () => {
  const purpose = { rows: [{ chainage: "0/000", reducedLevels: [10.125] }] };
  let state = proposalPreviewReducer(initialPreviewState, { type: "start", context: "layers-a" });
  state = proposalPreviewReducer(state, { type: "success", context: "layers-a", purpose });
  state = proposalPreviewReducer(state, { type: "start", context: "layers-a" });
  assert.equal(state.purpose, purpose);
  assert.equal(state.busy, true);
  state = proposalPreviewReducer(state, { type: "failure", context: "layers-a", error: "Enter a valid LS grade." });
  assert.equal(state.purpose.rows[0].reducedLevels[0], 10.125);
  assert.equal(state.error, "Enter a valid LS grade.");
  assert.equal(state.busy, false);
  const replacement = { rows: [{ chainage: "0/000", reducedLevels: [10.5] }] };
  state = proposalPreviewReducer(state, { type: "start", context: "layers-a" });
  assert.equal(state.error, "");
  state = proposalPreviewReducer(state, { type: "success", context: "layers-a", purpose: replacement });
  assert.equal(state.purpose, replacement);
});

test("changing layers clears the old graph and ignores late results from other layers", () => {
  let state = { context: "layers-a", purpose: { rows: [] }, busy: false, error: "" };
  state = proposalPreviewReducer(state, { type: "start", context: "layers-b" });
  assert.equal(state.purpose, null);
  assert.equal(proposalPreviewReducer(state, { type: "success", context: "layers-a", purpose: {} }), state);
  assert.equal(proposalPreviewReducer(state, { type: "failure", context: "layers-a", error: "Old error" }), state);
  state = proposalPreviewReducer(state, { type: "failure", context: "layers-b", error: "Choose a proposal level." });
  assert.equal(state.purpose, null);
  assert.equal(state.error, "Choose a proposal level.");
});
