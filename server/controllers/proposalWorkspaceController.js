import { proposalLengthRows } from "../helper/proposalLength.js";
import mongoose from "mongoose";
import createHttpError from "http-errors";
import Survey from "../models/survey.js";
import SurveyPurpose from "../models/surveyPurpose.js";
import SurveyRow from "../models/surveyRows.js";
import { generateSurveyPurpose, generateWaterWayProposalPurpose } from "./surveyController.js";
import { applyProposalWorkspace } from "../helper/proposalWorkspace.js";
import { roundProposalLevels } from "../helper/proposalRounding.js";

const calculate = async (req) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw createHttpError(400, "Invalid survey ID");
  const form = req.body.form, design = req.body.design || { mode: "legacy" };
  if (!form || !["legacy", "sloped", "dimensions", "manual"].includes(design.mode)) throw createHttpError(400, "Choose a proposal creation method.");
  const survey = await Survey.findOne({ _id: req.params.id, createdBy: req.user.userId, deleted: false, isSurveyFinish: false })
    .populate({ path: "purposes", match: { deleted: false }, populate: { path: "rows", match: { deleted: false } } });
  if (!survey) throw createHttpError(404, "Active survey not found");
  const base = survey.purposes.find((purpose) => purpose.type === form.purpose);
  if (!base) throw createHttpError(400, "Choose a base level from this survey.");
  if (!SurveyPurpose.schema.path("type").enumValues.includes(form.proposal)) throw createHttpError(400, "Choose a valid proposal level.");
  if (survey.purposes.some((purpose) => purpose.type === form.proposal)) throw createHttpError(409, "This proposal level already exists.");
  // Keep nested rows plain as well: spreading a Mongoose row in the solver
  // drops schema getters such as reducedLevels.
  const plainBase = base.toObject();
  const scopedBase = { ...plainBase, rows: proposalLengthRows(plainBase.rows, form, survey.separator) };
  const settings = { ...design, chainageRange: form.length === "Custom" ? form.chainageRange : undefined };
  const waterWorkspace = survey.type === "Water Way" && design.cs?.slopeMode != null;
  if (waterWorkspace && design.mode !== "manual") {
    const dimensions = [design.dimensions?.length, design.dimensions?.width, design.dimensions?.height].map(Number);
    if (design.mode === "dimensions" && dimensions.some(value => !Number.isFinite(value) || value <= 0)) throw createHttpError(400, "Enter positive length, width and height.");
    const quantity = design.mode === "dimensions" ? dimensions.reduce((a, b) => a * b, 1) : Number(form.quantity);
    if ((form.quantity === "" && design.mode !== "dimensions") || !Number.isFinite(quantity) || quantity <= 0) throw createHttpError(400, "Enter a positive target quantity.");
    settings.targetQuantity = quantity;
    settings.waterWorkspace = true;
  }
  let seed;
  if (design.mode === "manual" || waterWorkspace) {
    seed = { type: form.proposal, phase: "Proposal", relation: String(base._id), pls: base.pls, quantity: 0,
      geometryVersion: survey.type === "Water Way" ? 4 : undefined,
      ...(waterWorkspace ? { quantity: settings.targetQuantity ?? 0, proposalMethod: "Slope End-to-End Type", length: form.length || "All" } : {}),
      rows: scopedBase.rows.filter((row) => row.type === "Chainage").map((row) => ({
        type: "Chainage", chainage: row.chainage, roadWidth: row.roadWidth, spacing: row.spacing,
        heightOfInstrument: row.heightOfInstrument, reducedLevels: [...row.reducedLevels],
        intermediateOffsets: row.intermediateOffsets.map((point) => ({ offset: point.offset, is: "", mode: point.mode || "R", remark: point.remark || "" })),
      })) };
  } else {
    const payload = { ...form, interpolation: form.interpolation || [] };
    if (design.mode === "dimensions") {
      const values = [design.dimensions?.length, design.dimensions?.width, design.dimensions?.height].map(Number);
      if (values.some((value) => !Number.isFinite(value) || value <= 0)) throw createHttpError(400, "Enter positive length, width and height.");
      payload.quantity = values.reduce((total, value) => total * value, 1);
      if (!Number.isFinite(payload.quantity)) throw createHttpError(400, "The dimensions produce an invalid target quantity.");
      const stations = base.rows.filter((row) => row.type === "Chainage");
      payload.interpolation = [{ from: stations[0]?.chainage, to: stations.at(-1)?.chainage, width: values[1] }];
      if (survey.type === "Water Way") payload.bottomWidth = values[1];
      payload.length = String(values[0]);
    }
    let failure;
    const collector = { status() { return this; }, json(data) { seed = data.purpose; } };
    await (survey.type === "Water Way" ? generateWaterWayProposalPurpose : generateSurveyPurpose)(
      { ...req, body: payload, proposalPreview: true }, collector, (error) => { failure = error; });
    if (failure) throw failure;
    if (!seed) throw createHttpError(500, "Proposal preview could not be generated.");
  }
  try {
    const plainSeed = JSON.parse(JSON.stringify(seed));
    const changed = waterWorkspace || design.mode === "manual" || design.ls?.quantityType || design.ls?.enabled || design.cs?.fixedBottomEnabled || design.cs?.slopeEnabled || design.cs?.superelevationEnabled || design.cs?.camberEnabled;
    const purpose = changed || design.breaks?.length
      ? applyProposalWorkspace(survey.toObject(), scopedBase, plainSeed, settings)
      : roundProposalLevels({ ...plainSeed, designSettings: settings });
    return { survey, base, purpose };
  } catch (error) { throw createHttpError(400, error.message); }
};

export const previewProposalWorkspace = async (req, res, next) => {
  try { const { purpose } = await calculate(req); res.json({ success: true, purpose }); }
  catch (error) { next(error); }
};

export const saveProposalWorkspace = async (req, res, next) => {
  let session;
  try {
    const { survey, base, purpose } = await calculate(req);
    session = await mongoose.startSession();
    let saved;
    await session.withTransaction(async () => {
      // Serialize proposal creation and reject stale base readings before writing.
      const current = await Survey.findOneAndUpdate({ _id: survey._id, createdBy: req.user.userId, deleted: false, isSurveyFinish: false }, { $inc: { __v: 1 } }, { session });
      if (!current) throw createHttpError(409, "Survey is no longer active.");
      if (await SurveyPurpose.exists({ surveyId: survey._id, type: purpose.type, deleted: false }).session(session)) throw createHttpError(409, "This proposal already exists.");
      const currentRows = await SurveyRow.find({ purposeId: base._id, deleted: false }).sort({ readingOrder: 1, createdAt: 1, _id: 1 }).session(session).lean();
      const signature = (rows) => JSON.stringify(rows.map((row) => ({ id: String(row._id), rl: row.reducedLevels, offsets: row.intermediateOffsets.map((point) => point.offset), updated: row.updatedAt })));
      if (signature(currentRows) !== signature(base.rows)) throw createHttpError(409, "Base readings changed. Review the refreshed preview before saving.");
      const { _id, id: virtualId, rows, createdAt, updatedAt, __v, ...fields } = purpose;
      [saved] = await SurveyPurpose.create([{ ...fields, surveyId: survey._id, relation: base._id, createdBy: req.user.userId,
        phase: "Proposal", status: "Finished", isPurposeFinish: true, purposeFinishDate: new Date() }], { session });
      await SurveyRow.create(rows.map((row, index) => {
        const { _id: rowId, id: virtualRowId, createdAt: rowCreated, updatedAt: rowUpdated, __v: rowVersion, ...values } = row;
        return { ...values, purposeId: saved._id, createdBy: req.user.userId, readingOrder: index };
      }), { session, ordered: true });
    });
    res.status(201).json({ success: true, purpose: saved });
  } catch (error) { next(error); }
  finally { if (session) await session.endSession(); }
};
