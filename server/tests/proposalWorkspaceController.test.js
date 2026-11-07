import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Survey from "../models/survey.js";
import Purpose from "../models/surveyPurpose.js";
import Row from "../models/surveyRows.js";
import { generateSurveyPurpose, generateWaterWayProposalPurpose } from "../controllers/surveyController.js";
import { previewProposalWorkspace, saveProposalWorkspace } from "../controllers/proposalWorkspaceController.js";
import { initialProposalDesign, proposalGraphSeries, proposalWorkspaceRequest } from "../../client/src/utils/proposalWorkspace.js";
import { calculateVolumeReport } from "../../client/src/utils/volumeReport.js";

const id = "000000000000000000000001", owner = "000000000000000000000002", baseId = "000000000000000000000003";
const response = () => ({ status(code) { this.code = code; return this; }, json(value) { this.data = value; } });
const query = (value) => ({ populate() { return this; }, session() { return this; }, sort() { return this; }, lean() { return Promise.resolve(value); }, then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); } });
const setup = (t, type = "Road") => {
  const base = { _id: baseId, type: "Initial Level", pls: "0", rows: ["0/000", "0/010", "0/020"].map((chainage, index) => ({
    _id: `00000000000000000000001${index}`, purposeId: baseId, type: "Chainage", chainage, roadWidth: "8", spacing: "4", heightOfInstrument: "15",
    reducedLevels: ["10", "10", "10"], intermediateOffsets: [-4, 0, 4].map((offset) => ({ offset: String(offset), is: "5", mode: "R" })),
  })) };
  base.toObject = () => ({ ...base, toObject: undefined });
  const survey = { _id: id, type, separator: "/", purposes: [base] };
  survey.toObject = () => ({ ...survey, toObject: undefined });
  t.mock.method(Survey, "findOne", (filter) => { assert.equal(filter.createdBy, owner); return query(survey); });
  t.mock.method(Survey, "findOneAndUpdate", () => query(survey));
  t.mock.method(Purpose, "exists", () => query(null));
  t.mock.method(Row, "find", () => query(base.rows));
  const sessions = [];
  t.mock.method(mongoose, "startSession", async () => {
    const session = { startTransaction() {}, async abortTransaction() { this.aborted = true; }, async commitTransaction() { this.committed = true; }, async endSession() { this.ended = true; }, async withTransaction(callback) { await callback(); this.committed = true; } };
    sessions.push(session); return session;
  });
  const purposeWrite = t.mock.method(Purpose, "create", async (documents) => documents.map((document) => new Purpose(document)));
  const rowWrite = t.mock.method(Row, "bulkWrite", async () => ({}));
  const rowsCreate = t.mock.method(Row, "create", async (documents) => documents);
  const form = { purpose: "Initial Level", proposal: "Proposed Level", quantity: "40", length: "All", csCamper: "0", interpolation: [], proposalMethod: "Bottom Width Fixed", bottomWidth: "4", slope: "1:1" };
  const req = { params: { id }, user: { userId: owner }, body: { form, design: { mode: "legacy" } } };
  return { req, base, survey, sessions, purposeWrite, rowWrite, rowsCreate };
};
const invoke = async (handler, req) => { const res = response(); await handler(req, res, (error) => { throw error; }); return res; };
const geometry = (rows) => rows.map(({ chainage, reducedLevels, intermediateOffsets, roadWidth }) => ({ chainage, reducedLevels, intermediateOffsets, roadWidth }));

test("water workspace previews and saves using switch inputs without legacy CS fields", async t => {
  const mocks = setup(t, "Water Way");
  const form = { ...mocks.req.body.form, bottomWidth: "", slope: "", proposalMethod: "" };
  for (const fixed of [false, true]) {
    const design = structuredClone(initialProposalDesign);
    design.template = "water";
    design.ls.quantityType = "cutting";
    Object.assign(design.cs, { slopeEnabled: !fixed, fixedBottomEnabled: fixed, vertical: "1", bottomWidth: "4" });
    mocks.req.body = proposalWorkspaceRequest(form, design, [], true);
    const preview = (await invoke(previewProposalWorkspace, mocks.req)).data.purpose;
    assert.equal(preview.rows.length, 3);
    await invoke(saveProposalWorkspace, mocks.req);
    assert.ok(mocks.sessions.at(-1).committed);
  }
});

test("water switch preview follows varying surveyed levels without requiring a common bed RL", async t => {
  const mocks = setup(t, "Water Way");
  mocks.base.rows.forEach((row, i) => { row.reducedLevels = Array(3).fill(String(10 - i * 6)); });
  const design = structuredClone(initialProposalDesign);
  design.template = "water";
  design.ls.quantityType = "cutting";
  Object.assign(design.cs, { slopeEnabled: true, vertical: "1" });
  mocks.req.body = proposalWorkspaceRequest(mocks.req.body.form, design, [], true);
  const preview = (await invoke(previewProposalWorkspace, mocks.req)).data.purpose;
  const normalized = p => ({ ...p, rows: p.rows.map(row => ({ ...row, offsets: row.intermediateOffsets.map(p => p.offset) })) });
  const series = proposalGraphSeries(normalized(mocks.base), normalized(preview), "ls");
  assert.equal(series.length, 2);
  assert.equal(series[1].points.filter(Boolean).length, 3);
  assert.ok(series[1].points[0].y > series[1].points[2].y + 11.9);
  const report = calculateVolumeReport(mocks.survey, normalized(mocks.base), normalized(preview));
  assert.ok(Math.abs(report.totalCuttingVolume - 40) < 0.2);
  assert.equal(report.totalFillingVolume, 0);
});

test("water preview identifies the chainage and bank reading that cannot fit", async t => {
  const mocks = setup(t, "Water Way");
  mocks.base.rows[1].reducedLevels = ["9.000", "8.800", "-1489.490"];
  mocks.base.rows[1].intermediateOffsets = [-1, 0, 1].map(offset => ({ offset: String(offset), mode: "R" }));
  const design = structuredClone(initialProposalDesign);
  design.template = "water";
  design.ls.quantityType = "cutting";
  Object.assign(design.cs, { slopeEnabled: true, vertical: "1" });
  mocks.req.body = proposalWorkspaceRequest(mocks.req.body.form, design, [], true);
  await assert.rejects(invoke(previewProposalWorkspace, mocks.req), /Chainage 0\/010:.*right bank RL -1489\.490 m/);
  assert.equal(mocks.purposeWrite.mock.calls.length, 0);
});

test("water grade optimisation finds a feasible elevation before constructing bank slopes", async t => {
  const mocks = setup(t, "Water Way");
  mocks.base.rows.forEach((row, i) => { row.reducedLevels = Array(3).fill(String(10 - i * 0.5)); });
  const design = structuredClone(initialProposalDesign);
  design.template = "water";
  Object.assign(design.cs, { slopeEnabled: true, vertical: "1" });
  Object.assign(design.ls, { enabled: true, strategy: "minimum", quantityType: "cutting", grade: "0" });
  const normalized = p => ({ ...p, rows: p.rows.map(row => ({ ...row, offsets: row.intermediateOffsets.map(p => p.offset) })) });
  for (const strategy of ["minimum", "quantity"]) for (const grade of ["0", "1", "-1"]) {
    Object.assign(design.ls, { strategy, grade });
    mocks.req.body = proposalWorkspaceRequest({ ...mocks.req.body.form, quantity: "120" }, design, [], true);
    const preview = (await invoke(previewProposalWorkspace, mocks.req)).data.purpose;
    const series = proposalGraphSeries(normalized(mocks.base), normalized(preview), "ls");
    assert.equal(series[1].points.filter(Boolean).length, 3);
    const [start, end] = [series[1].points[0], series[1].points.at(-1)];
    assert.ok(Math.abs(end.y - start.y - Number(grade) / 100 * 20) < 0.002);
    const report = calculateVolumeReport(mocks.survey, normalized(mocks.base), normalized(preview));
    assert.equal(report.totalFillingVolume, 0);
    if (strategy === "quantity") assert.ok(Math.abs(report.totalCuttingVolume - 120) < 0.2);
    else assert.ok(report.totalCuttingVolume < 120);
  }
  design.ls.grade = "100";
  await assert.rejects(invoke(previewProposalWorkspace, mocks.req), /No profile elevation fits.*LS grade/);
});

test("switching design condition without grade optimisation updates preview quantities and saved levels", async t => {
  const mocks = setup(t);
  mocks.req.body.design = structuredClone(initialProposalDesign);
  const filling = (await invoke(previewProposalWorkspace, mocks.req)).data.purpose;
  mocks.req.body.design.ls.quantityType = "cutting";
  const cutting = (await invoke(previewProposalWorkspace, mocks.req)).data.purpose;
  const forReport = purpose => ({ ...purpose, rows: purpose.rows.map(row => ({ ...row, offsets: row.intermediateOffsets.map(point => point.offset) })) });
  const report = calculateVolumeReport(mocks.survey, forReport(mocks.base), forReport(cutting));
  assert.ok(Math.abs(report.totalCuttingVolume - 40) < 0.2);
  assert.equal(report.totalFillingVolume, 0);
  assert.notDeepEqual(geometry(cutting.rows), geometry(filling.rows));
  await invoke(saveProposalWorkspace, mocks.req);
  assert.deepEqual(geometry(mocks.rowsCreate.mock.calls[0].arguments[0]), geometry(cutting.rows));
  mocks.req.body.design.ls.quantityType = "filling";
  const restored = (await invoke(previewProposalWorkspace, mocks.req)).data.purpose;
  assert.deepEqual(geometry(restored.rows), geometry(filling.rows));
});

test("quantity compliance recalculates slopes from database-backed base rows", async t => {
  const mocks = setup(t);
  mocks.base.rows = mocks.base.rows.map(row => new Row(row));
  mocks.base.toObject = () => ({ ...mocks.base, rows: mocks.base.rows.map(row => row.toObject()), toObject: undefined });
  mocks.req.body.design = structuredClone(initialProposalDesign);
  mocks.req.body.design.ls.strategy = "quantity";
  const original = (await invoke(previewProposalWorkspace, mocks.req)).data.purpose;
  assert.equal(original.rows.length, 3);
  mocks.req.body.design.ls.enabled = true;
  for (const grade of ["2", "5", "-2"]) {
    mocks.req.body.design.ls.grade = grade;
    const preview = (await invoke(previewProposalWorkspace, mocks.req)).data.purpose;
    const startRl = Number(preview.rows[0].reducedLevels[1]);
    const endRl = Number(preview.rows.at(-1).reducedLevels[1]);
    assert.ok(Number.isFinite(startRl));
    assert.ok(Math.abs(endRl - startRl - Number(grade) / 100 * 20) < 0.002);
  }
});

for (const type of ["Road", "Water Way"]) test(`${type}: enabling grade optimisation with default settings keeps both graph series`, async t => {
  const mocks = setup(t, type);
  mocks.req.body.design = structuredClone(initialProposalDesign);
  mocks.req.body.design.ls.quantityType = type === "Water Way" ? "cutting" : "filling";
  const original = (await invoke(previewProposalWorkspace, mocks.req)).data.purpose;
  mocks.req.body.design.ls.enabled = true;
  for (const grade of ["0", "2", "-2"]) {
    mocks.req.body.design.ls.grade = grade;
    const preview = (await invoke(previewProposalWorkspace, mocks.req)).data.purpose;
    // Match the row normalization performed by surveyServices before graphing.
    const forGraph = purpose => ({ ...purpose, rows: purpose.rows.map(row => ({ ...row, offsets: row.intermediateOffsets.map(point => point.offset) })) });
    const series = proposalGraphSeries(forGraph(mocks.base), forGraph(preview), "ls");
    assert.equal(series.length, 2);
    assert.equal(series[0].points.filter(Boolean).length, 3);
    assert.equal(series[1].points.filter(Boolean).length, 3);
    const [start, end] = [series[1].points[0], series[1].points.at(-1)];
    assert.ok(Math.abs((end.y - start.y) - Number(grade) / 100 * (end.x - start.x)) < 0.002);
  }
  mocks.req.body.design.ls.enabled = false;
  const restored = (await invoke(previewProposalWorkspace, mocks.req)).data.purpose;
  assert.deepEqual(geometry(restored.rows), geometry(original.rows));
});

for (const type of ["Road", "Water Way"]) test(`${type}: workspace preview and save preserve the existing generator's exact geometry`, async (t) => {
  const mocks = setup(t, type);
  const preview = await invoke(previewProposalWorkspace, mocks.req);
  assert.equal(mocks.purposeWrite.mock.callCount(), 0);
  assert.equal(mocks.rowWrite.mock.callCount(), 0);
  assert.equal(mocks.rowsCreate.mock.callCount(), 0);
  assert.ok(mocks.sessions.every((session) => session.aborted && session.ended));
  await invoke(type === "Road" ? generateSurveyPurpose : generateWaterWayProposalPurpose, { ...mocks.req, body: mocks.req.body.form });
  const legacyRows = mocks.rowWrite.mock.calls[0].arguments[0].map((op) => op.insertOne.document);
  assert.deepEqual(geometry(preview.data.purpose.rows), geometry(JSON.parse(JSON.stringify(legacyRows))));
  const saved = await invoke(saveProposalWorkspace, mocks.req);
  assert.equal(saved.code, 201);
  const savedRows = mocks.rowsCreate.mock.calls[0].arguments[0];
  assert.deepEqual(geometry(savedRows), geometry(preview.data.purpose.rows));
  assert.deepEqual(savedRows.map((row) => row.readingOrder), [0, 1, 2]);
  assert.ok(mocks.sessions.at(-1).committed && mocks.sessions.at(-1).ended);
});

test("manual previews never write and save rejects duplicate proposals", async (t) => {
  const mocks = setup(t);
  mocks.req.body.design = { mode: "manual", manualLevels: { "0/000": "11", "0/010": "12", "0/020": "13" } };
  const preview = await invoke(previewProposalWorkspace, mocks.req);
  assert.deepEqual(preview.data.purpose.rows.map((row) => row.reducedLevels[1]), ["11.000", "12.000", "13.000"]);
  assert.equal(mocks.purposeWrite.mock.callCount(), 0);
  t.mock.method(Purpose, "exists", () => query({ _id: "duplicate" }));
  await assert.rejects(invoke(saveProposalWorkspace, mocks.req), /already exists/);
  assert.equal(mocks.rowsCreate.mock.callCount(), 0);
  assert.ok(mocks.sessions.at(-1).ended);
});

test("dimensions derive the target quantity and manual blanks are rejected", async (t) => {
  const mocks = setup(t);
  mocks.req.body.design = { mode: "dimensions", dimensions: { length: "20", width: "4", height: "0.5" } };
  const preview = await invoke(previewProposalWorkspace, mocks.req);
  assert.equal(preview.data.purpose.quantity, 40);
  assert.ok(preview.data.purpose.rows.every((row) => Number(row.roadWidth) === 4));
  mocks.req.body.design = { mode: "manual", manualLevels: { "0/000": "" } };
  await assert.rejects(invoke(previewProposalWorkspace, mocks.req), /valid RL/);
});

test("ownership and changed base readings are checked before proposal writes", async (t) => {
  const mocks = setup(t);
  t.mock.method(Row, "find", () => query(mocks.base.rows.map((row) => ({ ...row, reducedLevels: ["12", "12", "12"] }))));
  await assert.rejects(invoke(saveProposalWorkspace, mocks.req), /Base readings changed/);
  assert.equal(mocks.purposeWrite.mock.callCount(), 0);
  assert.equal(mocks.rowsCreate.mock.callCount(), 0);
  t.mock.method(Survey, "findOne", () => query(null));
  await assert.rejects(invoke(previewProposalWorkspace, mocks.req), /Active survey not found/);
});

for (const type of ["Road", "Water Way"]) test(type + ": custom length scopes preview and saved rows", async (t) => {
  const mocks = setup(t, type);
  mocks.req.body.form.length = "Custom";
  mocks.req.body.form.chainageRange = { from: "0/010", to: "0/020" };
  const preview = await invoke(previewProposalWorkspace, mocks.req);
  assert.deepEqual(preview.data.purpose.rows.map(row => row.chainage), ["0/010", "0/020"]);
  assert.deepEqual(preview.data.purpose.designSettings.chainageRange, mocks.req.body.form.chainageRange);
  await invoke(saveProposalWorkspace, mocks.req);
  assert.deepEqual(geometry(mocks.rowsCreate.mock.calls[0].arguments[0]), geometry(preview.data.purpose.rows));
});
test("custom length rejects missing, reversed and identical endpoints before writes", async (t) => {
  const mocks = setup(t);
  mocks.req.body.form.length = "Custom";
  for (const chainageRange of [undefined, { from: "0/000", to: "0/999" }, { from: "0/020", to: "0/000" }, { from: "0/010", to: "0/010" }]) {
    mocks.req.body.form.chainageRange = chainageRange;
    await assert.rejects(invoke(saveProposalWorkspace, mocks.req), /chainage/);
  }
  assert.equal(mocks.purposeWrite.mock.callCount(), 0);
});

test("custom slope anchors at its from-chainage, preserves outside rows and saves preview geometry", async t => {
  const mocks = setup(t);
  const original = (await invoke(previewProposalWorkspace, mocks.req)).data.purpose;
  mocks.req.body.design.ls = { enabled: true, strategy: "custom", custom: { from: "0/010", to: "0/020", denominator: "100", direction: "falling" } };
  const preview = (await invoke(previewProposalWorkspace, mocks.req)).data.purpose;
  assert.deepEqual(preview.rows[0].reducedLevels, original.rows[0].reducedLevels);
  assert.deepEqual(preview.rows[1].reducedLevels, original.rows[1].reducedLevels);
  for (let i = 0; i < 3; i++) assert.ok(Math.abs(Number(preview.rows[2].reducedLevels[i]) - Number(original.rows[1].reducedLevels[i]) + 0.1) < 0.001);
  await invoke(saveProposalWorkspace, mocks.req);
  assert.deepEqual(geometry(mocks.rowsCreate.mock.calls[0].arguments[0]), geometry(preview.rows));
  mocks.req.body.design.ls.custom.denominator = "0";
  await assert.rejects(invoke(previewProposalWorkspace, mocks.req), /Invalid custom slope/);
});
