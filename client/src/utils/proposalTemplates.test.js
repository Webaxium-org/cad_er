import test from "node:test";
import assert from "node:assert/strict";
import { proposalTemplates, applyExampleTemplate, exampleTemplateSeries } from "./proposalTemplates.js";
import { initialProposalDesign } from "./proposalWorkspace.js";
test("every example applies its own dimensions without mutating current settings", () => {
 for (const preset of proposalTemplates) {
 const original = structuredClone(initialProposalDesign);
 const result = applyExampleTemplate(original, preset);
 assert.equal(result.cs.bottomWidth, String(preset.width));
 assert.equal(result.cs.fixedBottomEnabled, true);
 assert.equal(result.cs.slopeEnabled, false);
 assert.deepEqual(original, initialProposalDesign);
 const points=exampleTemplateSeries(result)[0].points;
 assert.equal(points[3].x-points[1].x,preset.width);
 assert.equal(points[0].y,preset.system === "water" ? 101 : 99);
 }
});
test("editing width and ratios updates the example graph and invalid edits do not draw misleading geometry", () => {
 const design=applyExampleTemplate(initialProposalDesign,proposalTemplates[0]);
 design.cs.bottomWidth="9"; design.cs.fixedLhs="3:1";
 const points=exampleTemplateSeries(design)[0].points;
 assert.equal(points[1].x,-4.5); assert.equal(points[0].x,-7.5);
 design.cs.fixedLhs="bad";assert.deepEqual(exampleTemplateSeries(design),[]);
});
