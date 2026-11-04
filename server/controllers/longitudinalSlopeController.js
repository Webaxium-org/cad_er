import mongoose from "mongoose";
import createHttpError from "http-errors";
import Survey from "../models/survey.js";
import Purpose from "../models/surveyPurpose.js";
import Row from "../models/surveyRows.js";

const validNumbers = (values) => Array.isArray(values) && values.length > 0 && values.every((value) =>
  value != null && String(value).trim() !== "" && Number.isFinite(Number(value)));

export const prepareSlopeRow = (row, change) => {
  if (!validNumbers(row.reducedLevels) || !validNumbers(change.expectedLevels) || !validNumbers(change.reducedLevels)
    || !validNumbers(change.offsets) || change.reducedLevels.length !== row.reducedLevels.length
    || change.expectedLevels.length !== row.reducedLevels.length || change.offsets.length !== row.intermediateOffsets.length
    || row.reducedLevels.length !== row.intermediateOffsets.length) throw createHttpError(400, "Invalid slope levels or offsets.");
  if (row.chainage !== change.chainage || row.reducedLevels.some((value, index) => Number(value) !== Number(change.expectedLevels[index]))
    || row.intermediateOffsets.some((point, index) => Number(point.offset) !== Number(change.offsets[index]))) {
    throw createHttpError(409, "The survey readings changed. Refresh the report and apply the slope again.");
  }
  const delta = Number(change.reducedLevels[0]) - Number(row.reducedLevels[0]);
  if (change.reducedLevels.some((value, index) => Math.abs(Number(value) - Number(row.reducedLevels[index]) - delta) > 0.00101)) {
    throw createHttpError(400, "A longitudinal slope must preserve the cross-section shape.");
  }
  return { ...row, reducedLevels: change.reducedLevels.map((value) => Number(value).toFixed(3)),
    intermediateOffsets: row.intermediateOffsets.map((point, index) => {
      const changeInRl = Number(change.reducedLevels[index]) - Number(row.reducedLevels[index]);
      if (point.is == null || String(point.is).trim() === "") return { ...point };
      if (!Number.isFinite(Number(point.is))) throw createHttpError(400, "Invalid intermediate sight reading.");
      return { ...point, is: (Number(point.is) - changeInRl).toFixed(3) };
    }),
  };
};

export const saveLongitudinalSlope = async (req, res, next) => {
  let session;
  try {
    const { changes, purposeId } = req.body || {};
    if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(purposeId)
      || !Array.isArray(changes) || !changes.length || changes.length > 5000
      || changes.some((change) => !change || !mongoose.isValidObjectId(change.rowId))
      || new Set(changes.map((change) => String(change.rowId))).size !== changes.length) {
      throw createHttpError(400, "Invalid slope update.");
    }
    session = await mongoose.startSession();
    let savedRows;
    await session.withTransaction(async () => {
      const survey = await Survey.findOneAndUpdate({ _id: req.params.id, createdBy: req.user.userId, deleted: false, isSurveyFinish: false },
        { $inc: { __v: 1 } }, { session });
      if (!survey) throw createHttpError(404, "Active survey not found.");
      const purpose = await Purpose.findOne({ _id: purposeId, surveyId: survey._id, deleted: false }).session(session);
      if (!purpose) throw createHttpError(404, "Survey level not found.");
      const rows = await Row.find({ _id: { $in: changes.map((change) => change.rowId) }, purposeId, type: "Chainage", deleted: false }).session(session).lean();
      if (rows.length !== changes.length) throw createHttpError(409, "Some chainages are no longer available. Refresh the report.");
      const byId = new Map(rows.map((row) => [String(row._id), row]));
      savedRows = changes.map((change) => prepareSlopeRow(byId.get(String(change.rowId)), change));
      const result = await Row.bulkWrite(savedRows.map((row) => ({ updateOne: {
        filter: { _id: row._id, purposeId, deleted: false },
        update: { $set: { reducedLevels: row.reducedLevels, intermediateOffsets: row.intermediateOffsets } },
      } })), { session });
      if (result.matchedCount !== changes.length) throw createHttpError(409, "The chainages changed while saving. Refresh and try again.");
    });
    res.json({ success: true, rows: savedRows, updated: savedRows.length });
  } catch (error) { next(error); }
  finally { if (session) await session.endSession(); }
};
