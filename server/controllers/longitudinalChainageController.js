import { createHash } from "node:crypto";
import mongoose from "mongoose";
import createHttpError from "http-errors";
import Survey from "../models/survey.js";
import SurveyPurpose from "../models/surveyPurpose.js";
import SurveyRow from "../models/surveyRows.js";
import History from "../models/history.js";
import { buildChainagePlan, applyChainageLevels } from "../helper/longitudinalChainage.js";

const loadPlan = async (req, session = null) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw createHttpError(400, "Invalid survey ID");
  const survey = await Survey.findOne({ _id: req.params.id, createdBy: req.user.userId, deleted: false }).session(session).lean();
  if (!survey) throw createHttpError(404, "Survey not found");
  const purposes = await SurveyPurpose.find({ surveyId: survey._id, deleted: false })
    .sort({ _id: 1 }).session(session).lean();
  const rows = await SurveyRow.find({ purposeId: { $in: purposes.map((purpose) => purpose._id) } })
    .sort({ readingOrder: 1, createdAt: 1, _id: 1 }).session(session).lean();
  purposes.forEach((purpose) => { purpose.rows = rows.filter((row) => String(row.purposeId) === String(purpose._id)); });
  let plan;
  try {
    plan = buildChainagePlan({ survey, purposes, chainage: req.body.chainage, referencePurposeId: req.body.referencePurposeId });
  } catch (error) { throw createHttpError(400, error.message); }
  // Detect changes made by another tab between preview and save.
  const previewToken = createHash("sha256").update(JSON.stringify({ plan, rows })).digest("hex");
  return { survey, purposes, plan, previewToken };
};

export const previewLongitudinalChainage = async (req, res, next) => {
  try {
    const { plan, previewToken } = await loadPlan(req);
    res.json({ success: true, chainage: plan.chainage, previewToken,
      levels: plan.entries.map(({ purposeId, name, from, to, rl }) => ({ purposeId, name, from, to, rl })) });
  } catch (error) { next(error); }
};

export const createLongitudinalChainage = async (req, res, next) => {
  let session;
  try {
    session = await mongoose.startSession();
    let chainage;
    await session.withTransaction(async () => {
      const { survey, purposes, plan, previewToken } = await loadPlan(req, session);
      if (req.body.previewToken !== previewToken) throw createHttpError(409, "The survey changed. Preview this chainage again before saving.");
      let documents;
      try { documents = applyChainageLevels(plan, req.body.levels); }
      catch (error) { throw createHttpError(400, error.message); }
      // Serialize insertions into the same survey; transaction retries revalidate all stations.
      await Survey.updateOne({ _id: survey._id, createdBy: req.user.userId, deleted: false }, { $inc: { __v: 1 } }, { session });
      const operations = [];
      purposes.forEach((purpose, index) => {
        purpose.rows.forEach((row, rowIndex) => {
          operations.push({ updateOne: { filter: { _id: row._id, purposeId: purpose._id }, update: { $set: { readingOrder: rowIndex * 2 } } } });
        });
        documents[index].readingOrder = plan.entries[index].insertionIndex * 2 - 1;
        documents[index].createdBy = req.user.userId;
      });
      await SurveyRow.bulkWrite(operations, { session });
      await SurveyRow.create(documents, { session, ordered: true });
      await History.create([{ entityType: "Survey", entityId: survey._id, action: "Add LS chainage",
        notes: `Inserted interpolated chainage ${plan.chainage} into ${documents.length} levels.`, performedBy: req.user.userId }], { session });
      chainage = plan.chainage;
    });
    res.status(201).json({ success: true, chainage });
  } catch (error) {
    next(error.code === 11000 ? createHttpError(409, "Chainage already exists. Preview again.") : error);
  } finally { if (session) await session.endSession(); }
};
