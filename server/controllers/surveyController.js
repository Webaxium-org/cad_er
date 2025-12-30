import Survey from "../models/survey.js";
import SurveyPurpose from "../models/surveyPurpose.js";
import SurveyRow from "../models/surveyRows.js";
import History from "../models/history.js";
import { isValidObjectId, calculateReducedLevel } from "../helper/index.js";
import createHttpError from "http-errors";
import mongoose from "mongoose";

const checkSurveyExists = async (req, res, next) => {
  try {
    const survey = await Survey.findOne({ isSurveyFinish: false });

    res.status(200).json({
      success: true,
      message: `${survey ? "Active survey found" : "No active survey found"}`,
      survey,
    });
  } catch (err) {
    next(err);
  }
};

const getAllSurvey = async (req, res, next) => {
  try {
    const { status, project, purpose, type } = req.query;

    const filter = { deleted: false };

    // 🔹 Flexible filters
    if (status === "active") filter.isSurveyFinish = false;
    else if (status === "finished") filter.isSurveyFinish = true;

    if (project) filter.project = project;
    if (type) filter.type = type;

    const surveys = await Survey.find(filter)
      .sort({ createdAt: -1 })
      .populate("purposes")
      // .populate('createdBy', 'name email')
      .lean();

    res.status(200).json({
      success: true,
      count: surveys.length,
      message:
        surveys.length > 0
          ? `${surveys.length} survey${surveys.length > 1 ? "s" : ""} found`
          : "No surveys found",
      surveys,
    });
  } catch (err) {
    next(err);
  }
};

const createSurvey = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      user: { userId },
      body: {
        project,
        purpose,
        instrumentNo,
        reducedLevel,
        backSight,
        chainageMultiple,
        separator,
        agreementNo,
        contractor,
        department,
        division,
        subDivision,
        section,
        consultant,
        client,
      },
    } = req;

    // 🔹 Input validation
    if (
      !project ||
      !purpose ||
      !instrumentNo ||
      !reducedLevel ||
      !backSight ||
      !chainageMultiple ||
      !separator ||
      !agreementNo ||
      !contractor
    ) {
      throw createHttpError(
        400,
        "All fields (Project, Purpose, Instrument No, Reduced Level, Back Sight, Chainage Multiple, Agreement No, Contractor, department) are required"
      );
    }

    const isPublicProject =
      department !== undefined &&
      department !== null &&
      department !== "" &&
      division !== undefined &&
      division !== null &&
      division !== "" &&
      subDivision !== undefined &&
      subDivision !== null &&
      subDivision !== "" &&
      section !== undefined &&
      section !== null &&
      section !== "";

    const isPrivateProject =
      consultant !== undefined &&
      consultant !== null &&
      consultant !== "" &&
      client !== undefined &&
      client !== null &&
      client !== "";

    if (!isPublicProject && !isPrivateProject) {
      throw createHttpError(
        400,
        "Please provide either Administrative units or External parties"
      );
    }

    // 🔹 Create Survey
    const survey = await Survey.create(
      [
        {
          project,
          createdBy: userId,
          instrumentNo,
          chainageMultiple,
          separator,
          reducedLevel: Number(reducedLevel).toFixed(3),
          agreementNo,
          contractor,
          ...(isPublicProject
            ? { department, division, subDivision, section }
            : {}),
          ...(isPrivateProject ? { consultant, client } : {}),
        },
      ],
      { session }
    );

    const surveyDoc = survey[0];

    // 🔹 Create Purpose
    const purposeDoc = await SurveyPurpose.create(
      [
        {
          surveyId: surveyDoc._id,
          createdBy: userId,
          type: purpose,
          isSurveyFinish: false,
        },
      ],
      { session }
    );

    const purposeObj = purposeDoc[0];

    // 🔹 Create First Row (TBM)
    const row = await SurveyRow.create(
      [
        {
          surveyId: surveyDoc._id,
          purposeId: purposeObj._id,
          createdBy: userId,
          type: "Instrument setup",
          backSight: Number(backSight).toFixed(3),
          remarks: ["TBM"],
          reducedLevels: [Number(reducedLevel).toFixed(3)],
          heightOfInstrument: Number(
            Number(reducedLevel) + Number(backSight)
          ).toFixed(3),
        },
      ],
      { session }
    );

    // 🔹 Optionally create a History log
    await History.create(
      [
        {
          entityType: "Survey",
          entityId: surveyDoc._id,
          action: "Create",
          notes: `Survey created with purpose ${purpose}`,
          performedBy: userId,
        },
      ],
      { session }
    );

    // ✅ Commit transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Survey created successfully",
      survey: {
        ...surveyDoc.toObject(),
        purposeId: purposeObj._id,
        purposes: [
          {
            ...purposeObj.toObject(),
            rows: [row[0]],
          },
        ],
      },
    });
  } catch (err) {
    // ❌ Rollback if anything fails
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

const getSurvey = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid survey ID",
      });
    }

    // Find active (non-deleted) survey
    const survey = await Survey.findOne({ _id: id, deleted: false })
      .populate({
        path: "purposes",
        match: { deleted: false },
        populate: {
          path: "rows",
          match: { deleted: false },
          options: { sort: { createdAt: 1 } },
        },
      })
      .lean();

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: "Survey not found or has been deleted",
      });
    }

    res.status(200).json({
      success: true,
      message: "Survey retrieved successfully",
      survey,
    });
  } catch (err) {
    next(err);
  }
};

const updateSurvey = () => {};
const deleteSurvey = () => {};

const createSurveyRow = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      params: { id },
      user: { userId },
      body: {
        type,
        backSight,
        intermediateSight,
        foreSight,
        chainage,
        roadWidth,
        spacing,
        offsets,
        reducedLevels,
        remark,
      },
    } = req;

    // 🔹 Validate purpose
    if (!id) throw createHttpError(400, "Purpose ID is required");

    const purpose = await SurveyPurpose.findOne({ _id: id, deleted: false })
      .populate({
        path: "surveyId",
        match: { deleted: false },
        populate: {
          path: "purposes",
          match: { deleted: false },
          populate: {
            path: "rows",
            match: { deleted: false },
          },
        },
      })
      .populate({
        path: "rows",
        match: { deleted: false },
      })
      .session(session);

    if (!purpose) throw createHttpError(404, "Purpose not found");
    if (purpose.isPurposeFinish)
      throw createHttpError(409, `${purpose.type} already completed`);

    const survey = purpose.surveyId;
    if (survey.isSurveyFinish)
      throw createHttpError(409, "Survey is already finished");
    if (!survey || survey.deleted)
      throw createHttpError(404, "Survey not found or has been deleted");

    if (type === "Chainage") {
      const isChainageExist = await SurveyRow.findOne({
        purposeId: id,
        chainage: chainage?.trim(),
        deleted: false,
      });

      if (isChainageExist) throw createHttpError(409, "Chainage already exist");
    }

    const isProposal = purpose.phase === "Proposal";
    const isSurveyPaused = purpose.status === "Paused";
    let isLastReading = false;

    // 🔹 Validate type and required fields (same as before)
    const types = {
      Chainage: ["chainage", "roadWidth", "spacing", "offsets"],
      CP: ["foreSight", "backSight"],
      TBM: ["intermediateSight"],
    };

    types["Chainage"].push(isProposal ? "reducedLevels" : "intermediateSight");

    if (!type || !Object.keys(types).includes(type))
      throw createHttpError(400, `Invalid or missing row type: ${type}`);

    const missing = types[type].filter(
      (f) => !req.body[f] || (Array.isArray(req.body[f]) && !req.body[f].length)
    );
    if (missing.length)
      throw createHttpError(
        400,
        `Missing required fields: ${missing.join(", ")}`
      );

    // 🔹 Remarks logic
    const remarks = [];
    if (type === "Chainage") {
      remarks.push(...remark);
    } else {
      if (type === "CP") {
        const allCp = purpose.rows?.filter((r) => r.type === "CP");
        remarks.push(`${type} - ${allCp.length + 1} - ${remark}`);
      } else {
        remarks.push(`${type} - ${remark}`);
      }
    }

    const initialSurvey = survey.purposes?.find(
      (p) => p.type === "Initial Level"
    );

    if (isProposal) {
      const filteredInitialSurvey =
        initialSurvey?.rows?.filter((entry) => entry.type === "Chainage") || [];

      const totalReadings = filteredInitialSurvey.length;
      const currentIndex = filteredInitialSurvey.findIndex(
        (entry) => entry.chainage === chainage
      );

      if (currentIndex === -1) {
        throw new Error(`Chainage "${chainage}" not found in initial survey`);
      }

      if (currentIndex === totalReadings - 1) {
        isLastReading = true;
      }
    }

    const newReading = {
      type,
      purposeId: purpose._id,
      createdBy: userId,
      chainage: type === "Chainage" ? chainage : undefined,
      spacing: type === "Chainage" ? spacing : undefined,
      roadWidth: roadWidth ? Number(roadWidth).toFixed(3) : undefined,

      backSight: backSight ? Number(backSight).toFixed(3) : undefined,
      foreSight: foreSight ? Number(foreSight).toFixed(3) : undefined,

      reducedLevels: isProposal
        ? (reducedLevels || []).map((n) => Number(n).toFixed(3))
        : [],

      intermediateSight:
        type === "Chainage"
          ? (intermediateSight || []).map((n) => Number(n).toFixed(3))
          : intermediateSight
          ? [intermediateSight]
          : undefined,

      offsets: (offsets || []).map((n) => Number(n).toFixed(3)),

      remarks,
    };

    if (!isProposal) {
      const { hi, rl } = calculateReducedLevel(survey, newReading, purpose._id);

      newReading.reducedLevels = rl;
      newReading.heightOfInstrument = hi;
    }

    let newRow = null;

    if (isSurveyPaused) {
      const lastRow = purpose.rows[purpose.rows?.length - 1];

      if (lastRow.type !== "CP") {
        throw createHttpError(
          400,
          "Invalid state: last row must be CP when resuming a paused survey."
        );
      }

      newRow = await SurveyRow.findByIdAndUpdate(
        lastRow._id,
        {
          backSight: backSight ? Number(backSight).toFixed(3) : undefined,
          foreSight: foreSight ? Number(foreSight).toFixed(3) : undefined,
          reducedLevels: newReading.reducedLevels,
          heightOfInstrument: newReading.heightOfInstrument,
          remarks,
        },
        { new: true, session }
      );

      if (!newRow) {
        throw createHttpError(
          500,
          "Failed to update CP row while resuming survey."
        );
      }

      purpose.status = "Active";
      await purpose.save({ session });
    } else {
      // Create new row
      const rows = await SurveyRow.create([newReading], { session });
      newRow = rows[0];
    }

    if (isLastReading) {
      purpose.status = "Finished";
      purpose.isPurposeFinish = true;
      purpose.purposeFinishDate = new Date();

      await purpose.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    const plainPurpose = purpose.toObject();

    res.status(201).json({
      success: true,
      message: "Survey row added successfully",
      row: newRow,
      purpose: {
        ...plainPurpose,
        rows: [...plainPurpose.rows, newRow],
      },
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

const getSurveyPurpose = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 🔹 Validate ID format
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid purpose ID",
      });
    }

    // 🔹 Find the specific survey purpose with related data
    const purpose = await SurveyPurpose.findOne({ _id: id, deleted: false })
      .populate({
        path: "surveyId",
        match: { deleted: false },
        populate: {
          path: "purposes",
          match: { deleted: false },
          populate: {
            path: "rows",
            match: { deleted: false },
            options: { sort: { createdAt: 1 } },
          },
        },
      })
      .populate({
        path: "rows",
        match: { deleted: false },
        options: { sort: { createdAt: 1 } },
      })
      .lean();

    if (!purpose) {
      return res.status(404).json({
        success: false,
        message: "Survey purpose not found or has been deleted",
      });
    }

    res.status(200).json({
      success: true,
      message: "Survey purpose retrieved successfully",
      purpose,
    });
  } catch (err) {
    next(err);
  }
};

const createSurveyPurpose = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      params: { surveyId },
      user: { userId },
      body: {
        purpose,
        proposal,
        proposedLevel,
        reducedLevel,
        backSight,
        // lSection,
        // lsSlop,
        cSection,
        csSlop,
        csCamper,
      },
    } = req;

    // 🔹 Basic validation
    if (!purpose || !surveyId) {
      throw createHttpError(400, "Purpose and surveyId are required");
    }

    // 🔹 Proposal field validation (if proposal mode)
    if (proposal) {
      const requiredFields = [proposedLevel];
      // const requiredFields = [proposedLevel, lSection, lsSlop];

      // Check if any of the always-required fields are missing
      const missingRequired = requiredFields.some(
        (field) => field === undefined || field === null || field === ""
      );

      if (missingRequired) {
        throw createHttpError(400, "Missing required fields for proposal");
      }

      // Conditional validation for cross-section inputs
      const hasCsPair =
        cSection !== undefined &&
        cSection !== null &&
        cSection !== "" &&
        csSlop !== undefined &&
        csSlop !== null &&
        csSlop !== "";

      const hasCsCamper =
        csCamper !== undefined && csCamper !== null && csCamper !== "";

      if (!hasCsPair && !hasCsCamper) {
        throw createHttpError(
          400,
          "Please provide either (Cross section slop) or Cross section camper"
        );
      }
    } else {
      const requiredFields = [reducedLevel, backSight];

      const missingRequired = requiredFields.some(
        (field) => field === undefined || field === null || field === ""
      );

      if (missingRequired) {
        throw createHttpError(400, "Missing required fields for proposal");
      }
    }

    const type = proposal ? proposal : purpose;

    // 🔹 Fetch active survey
    const survey = await Survey.findOne({
      _id: surveyId,
      isSurveyFinish: false,
      deleted: false,
    })
      .populate({
        path: "purposes",
        match: { deleted: false },
        populate: [
          { path: "rows", match: { deleted: false } },
          { path: "relation", match: { deleted: false } },
        ],
      })
      .session(session);

    if (!survey) {
      throw createHttpError(404, "Active survey not found");
    }

    let relation = null;

    // 🔹 Check if purpose already exists
    const isPurposeExist = survey.purposes?.find((p) => p.type === type);
    if (isPurposeExist) {
      throw createHttpError(409, `Purpose "${type}" already exists`);
    }

    // 🔹 Check for duplicate proposal relation
    if (proposal) {
      const existingProposal = survey.purposes?.find(
        (p) => p.relation?.type === purpose && p.type === proposal
      );

      if (existingProposal) {
        throw createHttpError(
          409,
          `A proposal between "${purpose}" and "${proposal}" already exists`
        );
      }

      const isPurposeExist = survey.purposes?.find((p) => p.type === purpose);
      if (!isPurposeExist) {
        throw createHttpError(409, `There is no survey found width ${purpose}`);
      }

      relation = isPurposeExist._id;
    }

    // 🔹 Create purpose document
    const [purposeDoc] = await SurveyPurpose.create(
      [
        {
          surveyId,
          type,
          createdBy: userId,
          phase: proposal ? "Proposal" : "Actual",
          ...(proposal && {
            proposedLevel,
            // lSection,
            // lsSlop,
            cSection,
            csSlop,
            csCamper,
            relation,
          }),
        },
      ],
      { session }
    );

    if (!proposal) {
      // 🔹 Create First Reading (TBM)
      await SurveyRow.create(
        [
          {
            surveyId: survey._id,
            purposeId: purposeDoc._id,
            createdBy: userId,
            type: "Instrument setup",
            backSight: Number(backSight).toFixed(3),
            remarks: ["TBM"],
            reducedLevels: [Number(reducedLevel).toFixed(3)],
            heightOfInstrument: Number(
              Number(reducedLevel) + Number(backSight)
            ).toFixed(3),
          },
        ],
        { session }
      );
    }

    // 🔹 Commit transaction
    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "Survey purpose created successfully",
      survey: {
        ...survey.toObject(),
        purposeId: purposeDoc._id,
        purposes: [...survey.purposes.map((p) => p.toObject()), purposeDoc],
      },
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

const getAllSurveyPurpose = async (req, res, next) => {
  try {
    const purposes = await SurveyPurpose.find({ deleted: false })
      .populate({
        path: "surveyId",
        match: { deleted: false },
      })
      .populate({
        path: "rows",
        match: { deleted: false },
        options: { sort: { createdAt: 1 } },
      })
      .populate({
        path: "history",
      })
      .sort({ createdAt: -1 })
      .lean();

    if (!purposes || purposes.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No survey purposes found",
      });
    }

    res.status(200).json({
      success: true,
      count: purposes.length,
      message: `${purposes.length} survey purpose${
        purposes.length > 1 ? "s" : ""
      } found`,
      purposes,
    });
  } catch (err) {
    next(err);
  }
};

const endSurveyPurpose = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      params: { id },
      query: { finalForesight, pls },
    } = req;

    // 🔹 Step 1: Find the purpose
    const purpose = await SurveyPurpose.findById(id).session(session);
    if (!purpose || purpose.deleted)
      throw createHttpError(404, "Survey purpose not found");

    // 🔹 Step 2: Check if already finished
    if (purpose.isPurposeFinish)
      throw createHttpError(400, "Purpose is already finished");

    // 🔹 Step 3: Ensure its parent survey exists and is active
    const survey = await Survey.findById(purpose.surveyId).session(session);
    if (!survey || survey.deleted)
      throw createHttpError(404, "Parent survey not found");
    if (survey.isSurveyFinish)
      throw createHttpError(
        400,
        "Cannot finish purpose — survey already finished"
      );

    if (purpose.phase === "Actual") {
      if (!finalForesight || !pls)
        throw createHttpError(400, "Missing required field");

      purpose.finalForesight = finalForesight;
      purpose.pls = pls;
    }

    // 🔹 Step 4: Mark purpose as finished
    purpose.status = "Finished";
    purpose.isPurposeFinish = true;
    purpose.purposeFinishDate = new Date();

    await purpose.save({ session });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Purpose ended successfully",
      purpose,
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

const endSurvey = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    const survey = await Survey.findById(id).session(session);
    if (!survey || survey.deleted)
      throw createHttpError(404, "Survey not found");
    if (survey.isSurveyFinish)
      throw createHttpError(400, "Survey already finished");

    const pendingPurpose = await SurveyPurpose.findOne({
      surveyId: survey._id,
      isPurposeFinish: false,
      deleted: false,
    }).session(session);

    if (pendingPurpose) {
      throw createHttpError(
        400,
        `Cannot end survey — purpose "${pendingPurpose.type}" is still pending`
      );
    }

    survey.isSurveyFinish = true;
    survey.surveyFinishDate = new Date();
    await survey.save({ session });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Survey ended successfully",
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

const updateSurveyRow = async (req, res, next) => {
  try {
    const {
      params: { id, rowId },
      body: {
        type,
        chainage,
        intermediateSight,
        reducedLevels,
        offsets,
        foreSight,
        backSight,
        remark,
      },
    } = req;

    const isPurposeExist = await SurveyPurpose.findById(id).populate(
      "surveyId"
    );
    if (
      !isPurposeExist ||
      isPurposeExist?.deleted ||
      isPurposeExist?.surveyId?.deleted
    )
      throw createHttpError(404, "Purpose not found");

    const isRowExist = await SurveyRow.findById(rowId);
    if (!isRowExist || isRowExist?.deleted)
      throw createHttpError(404, "Reading not found");

    if (type === "Instrument setup") {
      isRowExist.backSight = Number(backSight).toFixed(3);
      isRowExist.heightOfInstrument = Number(
        Number(isRowExist.reducedLevels[0]) + Number(backSight)
      ).toFixed(3);

      isRowExist.remarks[0] = remark;
    }

    if (type === "TBM") {
      const prevIS = Number(isRowExist.intermediateSight?.[0] ?? 0);
      const prevRL = Number(isRowExist.reducedLevels?.[0] ?? 0);
      const newIS = Number(intermediateSight);

      const diff = prevIS - newIS;
      const newRL = prevRL + diff;

      isRowExist.reducedLevels[0] = newRL.toFixed(3);
      isRowExist.intermediateSight[0] = newIS.toFixed(3);
      isRowExist.remarks[0] = remark;
    }

    if (type === "CP") {
      const prevRL = Number(isRowExist.reducedLevels?.[0] ?? 0);
      const prevFS = Number(isRowExist.foreSight ?? 0);

      const prevRowHI = prevRL + prevFS;

      const newFS = Number(foreSight);
      const newBS = Number(backSight);

      const newRL = prevRowHI - newFS;
      const newHI = newRL + newBS;

      isRowExist.reducedLevels[0] = newRL.toFixed(3);
      isRowExist.heightOfInstrument = newHI.toFixed(3);
      isRowExist.backSight = newBS.toFixed(3);
      isRowExist.foreSight = newFS.toFixed(3);
      isRowExist.remarks[0] = remark;
    }

    if (type === "Chainage") {
      const prevRL = Number(isRowExist.reducedLevels?.[0] ?? 0);
      const prevIS = Number(isRowExist.intermediateSight?.[0] ?? 0);

      const prevRowHI = prevRL + prevIS;

      const isProposal = isPurposeExist.phase === "Proposal";

      isRowExist.chainage = chainage;

      isRowExist.reducedLevels = isProposal
        ? (reducedLevels || []).map((n) => Number(n).toFixed(3))
        : (intermediateSight || [])?.map((n) =>
            (Number(prevRowHI) - Number(n || 0)).toFixed(3)
          );

      isRowExist.intermediateSight = (intermediateSight || []).map((n) =>
        Number(n).toFixed(3)
      );

      isRowExist.offsets = (offsets || []).map((n) => Number(n).toFixed(3));

      isRowExist.remarks = remark;
    }

    await isRowExist.save();

    return res.status(200).json({
      success: true,
      row: isRowExist,
      message: "Row updated successfully",
    });
  } catch (err) {
    next(err);
  }
};
const deleteSurveyRow = async (req, res, next) => {
  try {
    const {
      params: { id, rowId },
    } = req;

    const isPurposeExist = await SurveyPurpose.findById(id).populate(
      "surveyId"
    );
    if (
      !isPurposeExist ||
      isPurposeExist?.deleted ||
      isPurposeExist?.surveyId?.deleted
    )
      throw createHttpError(404, "Purpose not found");

    const isRowExist = await SurveyRow.findById(rowId);
    if (!isRowExist || isRowExist?.deleted)
      throw createHttpError(404, "Reading not found");

    if (isRowExist.type === "Instrument setup")
      throw createHttpError(400, "You cannot delete the initial TBM");

    isRowExist.deleted = true;
    await isRowExist.save();

    return res.status(200).json({
      success: true,
      message: "Reading deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

const pauseSurveyPurpose = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      params: { id },
      user: { userId },
      query: { foreSight, remark },
    } = req;

    if (!foreSight?.trim() || !remark?.trim()) {
      throw createHttpError(400, "Missing required fields");
    }

    // 1) Validate survey
    const survey = await SurveyPurpose.findById(id).session(session);
    if (!survey || survey.deleted) {
      throw createHttpError(404, "Survey not found.");
    }

    if (survey.isPurposeFinish) {
      throw createHttpError(
        400,
        "This survey has already been finished. Cannot pause."
      );
    }

    if (survey.status === "Paused") {
      throw createHttpError(400, "This survey is already paused.");
    }

    if (survey.type !== "Initial Level") {
      throw createHttpError(
        400,
        "This operation is allowed only for Initial Level surveys."
      );
    }

    // 2) Update survey status
    survey.status = "Paused";
    await survey.save({ session });

    // 3) Create CP row
    await SurveyRow.create(
      [
        {
          type: "CP",
          foreSight,
          remarks: [remark],
          createdBy: userId,
          purposeId: survey._id,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Survey purpose has been paused successfully.",
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

const generateSurveyPurpose = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      params: { id },
      user: { userId },
      body: {
        purpose,
        proposal,
        quantity,
        length,
        // lSection,
        // lsSlop,
        cSection,
        csSlop,
        csCamper,
      },
    } = req;

    // 🔹 Basic validation
    if (!purpose || !id) {
      throw createHttpError(400, "Purpose and surveyId are required.");
    }

    // Required fields used for proposal generation
    // const requiredFields = [quantity, lSection, lsSlop, length];
    const requiredFields = [quantity, length];
    const missingRequired = requiredFields.some(
      (x) => x === undefined || x === null || x === ""
    );

    if (missingRequired) {
      throw createHttpError(
        400,
        "Missing required fields for proposal generation."
      );
    }

    // Conditional validation for cross-section inputs
    const hasCsPair = cSection && csSlop && cSection !== "" && csSlop !== "";

    const hasCsCamper =
      csCamper !== undefined && csCamper !== null && csCamper !== "";

    if (!hasCsPair && !hasCsCamper) {
      throw createHttpError(
        400,
        "Please enter either both cross-section slope fields or a cross-section camber."
      );
    }

    // 🔹 Fetch active survey
    const survey = await Survey.findOne({
      _id: id,
      isSurveyFinish: false,
      deleted: false,
    })
      .populate({
        path: "purposes",
        match: { deleted: false },
        populate: [
          { path: "rows", match: { deleted: false } },
          { path: "relation", match: { deleted: false } },
        ],
      })
      .session(session);

    if (!survey) {
      throw createHttpError(404, "Active survey not found.");
    }

    // 🔹 Does this proposal already exist?
    const isProposalExist = survey.purposes?.find((p) => p.type === proposal);

    if (isProposalExist) {
      throw createHttpError(
        409,
        `A survey with the name "${proposal}" already exists.`
      );
    }

    // 🔹 Check if relationship already exists
    const existingProposal = survey.purposes?.find(
      (p) => p.relation?.type === purpose && p.type === proposal
    );

    if (existingProposal) {
      throw createHttpError(
        409,
        `A proposal between "${purpose}" and "${proposal}" already exists.`
      );
    }

    // 🔹 Check if the base purpose exists
    const basePurpose = survey.purposes?.find((p) => p.type === purpose);

    if (!basePurpose) {
      throw createHttpError(404, `Survey purpose "${purpose}" not found.`);
    }

    const relation = basePurpose._id;

    // 🔹 Filter chainage rows from base purpose
    const readingsToCreate = basePurpose.rows?.filter(
      (r) => r.type === "Chainage"
    );

    if (!readingsToCreate?.length) {
      throw createHttpError(
        409,
        `No chainage readings found to generate "${proposal}".`
      );
    }

    // 🔹 Create new proposal purpose
    const [purposeDoc] = await SurveyPurpose.create(
      [
        {
          surveyId: id,
          type: proposal,
          phase: "Proposal",
          createdBy: userId,
          quantity,
          // lSection,
          // lsSlop,
          cSection,
          csSlop,
          csCamper,
          relation,
          status: "Finished",
          isPurposeFinish: true,
          purposeFinishDate: new Date(),
        },
      ],
      { session }
    );

    // -----------------------------
    // 🔹 Bulk Insert Rows (FASTEST)
    // -----------------------------

    const roadWidth = Number(readingsToCreate[0]?.roadWidth) || 0;

    const bulkOps = readingsToCreate.map((reading) => {
      // ✅ FIX 1: Correct reduce (your version mutated curr incorrectly)
      const totalReadingReducedLevel = reading.reducedLevels.reduce(
        (acc, curr) => acc + Number(curr),
        0
      );

      // Assuming always 2 readings?
      const avgReadingReducedLevel =
        totalReadingReducedLevel / reading.reducedLevels.length;

      // Last reading always same → calculate once outside map (optimization)
      const lastReading = readingsToCreate.at(-1);

      // chainage format "X/Y" → get Y safely
      const limit =
        Number(lastReading?.chainage?.split(survey.separator || "/")?.[1]) || 0;

      // quantity MUST be non-zero
      const safeQuantity = Number(quantity) || 1;

      const value = (limit * roadWidth) / safeQuantity;

      // Build updated RL array
      const reducedLevels = reading.reducedLevels.map(() =>
        Number(avgReadingReducedLevel + value).toFixed(3)
      );

      return {
        insertOne: {
          document: {
            surveyId: id,
            createdBy: userId,
            purposeId: purposeDoc._id,
            type: "Chainage",
            chainage: reading.chainage,
            spacing: reading.spacing,
            roadWidth: reading.roadWidth,
            reducedLevels,
            heightOfInstrument: reading.heightOfInstrument,
            offsets: reading.offsets,
            remarks: reading.remarks,
          },
        },
      };
    });

    if (bulkOps.length > 0) {
      await SurveyRow.bulkWrite(bulkOps, { session });
    }

    // 🔹 Commit transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: `Survey proposal "${proposal}" generated successfully.`,
      purpose: purposeDoc,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

const editSurveyPurpose = async (req, res, next) => {
  try {
    const {
      params: { purposeId },
      body: { updatedRows },
    } = req;

    // 1. get full list of rows in correct order
    const rows = await SurveyRow.find({ purposeId }).sort({ createdAt: 1 });

    // 2. find which row changed
    const changedIndex = updatedRows[0].index;
    const changes = updatedRows[0].data;

    // 3. apply user edits to the changed row only
    Object.assign(rows[changedIndex], changes);

    const startRl = rows.find((r) => r.type === "Instrument setup")
      .reducedLevels[0];

    if (!startRl) throw Error("Something went wrong!");

    let hi = 0;
    let rl = Number(startRl);

    // 5. Recalculate all rows beginning from changedIndex
    for (let i = changedIndex; i < rows.length; i++) {
      const row = rows[i];

      switch (row.type) {
        case "Instrument setup":
          rl = Number(startRl);
          hi = rl + Number(row.backSight);
          row.reducedLevels = [rl.toFixed(3)];
          row.heightOfInstrument = hi.toFixed(3);
          break;

        case "Chainage":
        case "TBM":
          row.reducedLevels = row.intermediateSight.map((is) =>
            (hi - Number(is)).toFixed(3)
          );
          break;

        case "CP":
          rl = hi - Number(row.foreSight);
          hi = rl + Number(row.backSight);
          row.reducedLevels = [rl.toFixed(3)];
          row.heightOfInstrument = hi.toFixed(3);
          break;
      }
    }

    // 6. Write only rows from changedIndex
    const ops = rows.slice(changedIndex).map((r) => ({
      updateOne: {
        filter: { _id: r._id },
        update: {
          $set: {
            reducedLevels: r.reducedLevels,
            heightOfInstrument: r.heightOfInstrument,
            backSight: r.backSight,
            foreSight: r.foreSight,
            intermediateSight: r.intermediateSight,
            offsets: r.offsets,
            remarks: r.remarks,
          },
        },
      },
    }));

    await SurveyRow.bulkWrite(ops);

    return res.json({
      success: true,
      updated: ops.length,
      message: "Rows recalculated and updated",
    });
  } catch (err) {
    next(err);
  }
};

const updateReducedLevels = async (req, res, next) => {
  try {
    const {
      params: { id },
      body: { payload },
    } = req;

    // 1️⃣ Validate parent survey
    const survey = await Survey.findOne({ _id: id, deleted: false });
    if (!survey) {
      throw createHttpError(404, "Parent survey not found");
    }

    // 2️⃣ Basic payload validation
    if (
      !payload ||
      !payload.chainage ||
      !Array.isArray(payload.series) ||
      payload.series.length === 0
    ) {
      throw createHttpError(400, "Missing required fields");
    }

    // 3️⃣ Collect row & purpose IDs
    const rowIds = payload.series.map((s) => s._id);
    const purposeIds = payload.series.map((s) => s.purpose);

    // 4️⃣ Validate purposes & rows existence
    const [purposesCount, rows] = await Promise.all([
      SurveyPurpose.countDocuments({
        _id: { $in: purposeIds },
        deleted: false,
      }),
      SurveyRow.find({
        _id: { $in: rowIds },
        deleted: false,
      }).select("_id reducedLevels intermediateSight"),
    ]);

    if (purposesCount !== new Set(purposeIds).size) {
      throw createHttpError(404, "One or more purposes not found");
    }

    if (rows.length !== rowIds.length) {
      throw createHttpError(404, "One or more survey readings not found");
    }

    // Create lookup map
    const rowMap = new Map(rows.map((r) => [String(r._id), r]));

    // 5️⃣ Prepare bulk updates with delta logic
    const bulkOps = [];

    for (const s of payload.series) {
      if (!Array.isArray(s.data)) {
        throw createHttpError(400, "Invalid reduced level data");
      }

      const existingRow = rowMap.get(String(s._id));
      if (!existingRow) {
        throw createHttpError(404, "Survey row not found");
      }

      const oldRL = existingRow.reducedLevels || [];
      const oldIS = existingRow.intermediateSight || [];

      if (oldRL.length !== s.data.length || oldIS.length !== s.data.length) {
        throw createHttpError(
          400,
          "Reduced levels and intermediate sight length mismatch"
        );
      }

      const newReducedLevels = [];
      const newIntermediateSight = [];

      for (let i = 0; i < s.data.length; i++) {
        const newValue = s.data[i]?.y;

        if (newValue === "" || newValue === null || newValue === undefined) {
          throw createHttpError(400, "Reduced level cannot be empty");
        }

        const newRLNum = Number(newValue);
        const oldRLNum = Number(oldRL[i]);
        const oldISNum = Number(oldIS[i]);

        if (
          Number.isNaN(newRLNum) ||
          Number.isNaN(oldRLNum) ||
          Number.isNaN(oldISNum)
        ) {
          throw createHttpError(400, "Reduced level must be a valid number");
        }

        const delta = newRLNum - oldRLNum;

        newReducedLevels.push(newRLNum.toFixed(3));
        newIntermediateSight.push((oldISNum + delta).toFixed(3));
      }

      bulkOps.push({
        updateOne: {
          filter: { _id: s._id, deleted: false },
          update: {
            $set: {
              reducedLevels: newReducedLevels,
              intermediateSight: newIntermediateSight,
            },
          },
        },
      });
    }

    // 6️⃣ Execute bulk update
    await SurveyRow.bulkWrite(bulkOps, { ordered: true });

    res.status(200).json({
      success: true,
      message: "Reduced levels and intermediate sights updated successfully",
    });
  } catch (err) {
    next(err);
  }
};

export {
  checkSurveyExists,
  getAllSurvey,
  createSurvey,
  getSurveyPurpose,
  createSurveyPurpose,
  getAllSurveyPurpose,
  endSurveyPurpose,
  endSurvey,
  getSurvey,
  updateSurvey,
  deleteSurvey,
  createSurveyRow,
  updateSurveyRow,
  deleteSurveyRow,
  pauseSurveyPurpose,
  generateSurveyPurpose,
  editSurveyPurpose,
  updateReducedLevels,
};
