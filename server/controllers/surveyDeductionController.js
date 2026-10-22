import mongoose from "mongoose";
import createHttpError from "http-errors";
import Survey from "../models/survey.js";
import SurveyPurpose from "../models/surveyPurpose.js";
import SurveyRow from "../models/surveyRows.js";

const surveyFilter = (req) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw createHttpError(400, "Invalid survey ID");
  return { _id: req.params.id, createdBy: req.user.userId, deleted: false };
};

export const getSurveyDeductions = async (req, res, next) => {
  try {
    const survey = await Survey.findOne(surveyFilter(req)).select("deductions");
    if (!survey) throw createHttpError(404, "Survey not found");
    res.json({ success: true, deductions: survey.deductions || [] });
  } catch (error) { next(error); }
};

export const createSurveyDeduction = async (req, res, next) => {
  try {
    const filter = surveyFilter(req);
    if (!await Survey.exists(filter)) throw createHttpError(404, "Survey not found");
    const { purposeId, rows } = req.body;
    if (!mongoose.isValidObjectId(purposeId) || !Array.isArray(rows) || !rows.length || rows.length > 100) {
      throw createHttpError(400, "Choose a valid purpose and between 1 and 100 deduction ranges");
    }
    if (!await SurveyPurpose.exists({ _id: purposeId, surveyId: req.params.id, deleted: false })) {
      throw createHttpError(400, "This purpose does not belong to the selected survey");
    }
    const readings = await SurveyRow.find({ purposeId, deleted: false, type: { $in: ["Chainage", "Water Level"] } })
      .sort({ _id: 1 }).select("chainage").lean();
    const chainages = [...new Set(readings.map((row) => row.chainage).filter(Boolean))];
    let previousEnd = -1;
    const cleanRows = rows.map((row) => {
      if (!row || typeof row.from !== "string" || typeof row.to !== "string" || (row.remark !== undefined && typeof row.remark !== "string")) {
        throw createHttpError(400, "Invalid deduction range");
      }
      const from = chainages.indexOf(row.from);
      const to = chainages.indexOf(row.to);
      if (from < 0 || to <= from || from < previousEnd) throw createHttpError(400, "Deduction ranges must use this survey's chainages, in order, without overlap");
      if ((row.remark || "").length > 500) throw createHttpError(400, "Deduction remarks cannot exceed 500 characters");
      previousEnd = to;
      return { from: row.from, to: row.to, remark: (row.remark || "").trim() };
    });
    const deduction = { _id: new mongoose.Types.ObjectId(), purposeId, rows: cleanRows, createdAt: new Date() };
    const result = await Survey.updateOne(filter, { $push: { deductions: { $each: [deduction], $position: 0 } } }, { runValidators: true });
    if (!result.matchedCount) throw createHttpError(404, "Survey not found");
    res.status(201).json({ success: true, deduction });
  } catch (error) { next(error); }
};

export const deleteSurveyDeduction = async (req, res, next) => {
  try {
    const filter = surveyFilter(req);
    if (!mongoose.isValidObjectId(req.params.deductionId)) throw createHttpError(400, "Invalid deduction ID");
    const result = await Survey.updateOne({ ...filter, "deductions._id": req.params.deductionId },
      { $pull: { deductions: { _id: req.params.deductionId } } });
    if (!result.matchedCount) throw createHttpError(404, "Deduction not found in this survey");
    res.json({ success: true });
  } catch (error) { next(error); }
};
