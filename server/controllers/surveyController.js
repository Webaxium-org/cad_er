import Survey from "../models/survey.js";
import SurveyPurpose from "../models/surveyPurpose.js";
import SurveyRow from "../models/surveyRows.js";
import History from "../models/history.js";
import Branch from "../models/branch.js";
import { isValidObjectId, calculateReducedLevel } from "../helper/index.js";
import createHttpError from "http-errors";
import mongoose from "mongoose";

const checkSurveyExists = async (req, res, next) => {
  try {
    const survey = await Survey.findOne({
      isSurveyFinish: false,
      createdBy: req?.user?.userId,
    });

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
    const {
      user: { userId },
      query: { status, project, purpose, type, rootBranch, page, limit },
    } = req;

    const filter = {
      createdBy: userId,
      deleted: false,
      "branchDetails.isBranch": false,
    };

    // 🔹 Flexible filters
    if (status) {
      if (status === "active") {
        filter.isSurveyFinish = false;
      } else if (status === "finished") {
        filter.isSurveyFinish = true;
      } else if (["Scheduled", "Active", "Completed"].includes(status)) {
        filter.status = status;
      }
    }

    if (project) {
      filter.project = { $regex: project, $options: "i" };
    }
    if (type) filter.type = type;
    if (rootBranch) {
      filter["branchDetails.isBranch"] = true;
      filter["branchDetails.rootBranch"] = rootBranch;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skipNum = (pageNum - 1) * limitNum;

    let queryBuilder = Survey.find(filter)
      .sort({ createdAt: -1 })
      .populate({
        path: "purposes",
        match: { deleted: false },
        populate: {
          path: "rows",
          match: { deleted: false },
          options: { sort: { createdAt: 1 } },
        },
      });

    if (page) {
      queryBuilder = queryBuilder.skip(skipNum).limit(limitNum);
    }

    const [surveys, total] = await Promise.all([
      queryBuilder.lean(),
      Survey.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: surveys.length,
      total,
      page: pageNum,
      limit: limitNum,
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
        type,
        instrumentNo,
        reducedLevel,
        backSight,
        remark,
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
        scheduledDate,
        engineerSurveyor,
        assistant1,
        assistant2,
        assistant3,
        assistant4,
        assistant5,
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
      !agreementNo
    ) {
      throw createHttpError(
        400,
        "All fields (Project, Purpose, Instrument No, Reduced Level, Back Sight, Chainage Multiple, Agreement No, department) are required",
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
        "Please provide either Administrative units or External parties",
      );
    }

    // 🔹 Create Survey
    const survey = await Survey.create(
      [
        {
          project,
          createdBy: userId,
          type: type || "Road Survey",
          instrumentNo,
          chainageMultiple,
          separator,
          reducedLevel: Number(reducedLevel).toFixed(3),
          agreementNo,
          status: scheduledDate ? "Scheduled" : "Active",
          scheduledDate: scheduledDate || null,
          contractor,
          ...(isPublicProject
            ? { department, division, subDivision, section }
            : {}),
          ...(isPrivateProject ? { consultant, client } : {}),
          engineerSurveyor,
          assistant1,
          assistant2,
          assistant3,
          assistant4,
          assistant5,
        },
      ],
      { session },
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
      { session },
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
          remark: remark || "TBM - 1",
          reducedLevels: [Number(reducedLevel).toFixed(3)],
          heightOfInstrument: Number(
            Number(reducedLevel) + Number(backSight),
          ).toFixed(3),
        },
      ],
      { session },
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
      { session },
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

// ─── Queue Survey ─────────────────────────────────────────────────────────────
// Creates a "Scheduled" survey with only Step-1 data. No purpose/rows are
// created. The user can return later to complete the technical details.
const queueSurvey = async (req, res, next) => {
  try {
    const {
      user: { userId },
      body: {
        project,
        purpose,
        type,
        department,
        division,
        subDivision,
        section,
        consultant,
        client,
        engineerSurveyor,
        assistant1,
        assistant2,
        assistant3,
        assistant4,
        assistant5,
        // Schedule modal fields
        proposalScheduleDate,
        proposalDeadline,
        location,
        finalScheduleDate,
        finalDeadline,
      },
    } = req;

    if (!project || !purpose) {
      throw createHttpError(400, "Project name and purpose are required");
    }
    if (!proposalScheduleDate || !proposalDeadline || !location) {
      throw createHttpError(
        400,
        "Proposal Schedule Date, Proposal Deadline and Location are required",
      );
    }

    const isPublicProject = !!(
      department &&
      division &&
      subDivision &&
      section
    );
    const isPrivateProject = !!(consultant && client);

    if (!isPublicProject && !isPrivateProject) {
      throw createHttpError(
        400,
        "Please provide either Administrative units or External parties",
      );
    }

    const survey = await Survey.create({
      project,
      createdBy: userId,
      status: "Scheduled",
      type: type || "Road Survey",
      ...(isPublicProject
        ? { department, division, subDivision, section }
        : {}),
      ...(isPrivateProject ? { consultant, client } : {}),
      engineerSurveyor,
      assistant1,
      assistant2,
      assistant3,
      assistant4,
      assistant5,
      proposalScheduleDate,
      proposalDeadline,
      location,
      finalScheduleDate: finalScheduleDate || null,
      finalDeadline: finalDeadline || null,
    });

    res.status(201).json({
      success: true,
      message: "Survey queued successfully",
      survey,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Complete Survey ──────────────────────────────────────────────────────────
// Accepts Step-2 technical fields for an existing Scheduled survey, updates it
// to Active, then creates the first SurveyPurpose and TBM row.
const completeSurvey = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      user: { userId },
      params: { id },
      body: {
        purpose,
        agreementNo,
        contractor,
        instrumentNo,
        reducedLevel,
        backSight,
        remark,
        chainageMultiple,
        separator,
      },
    } = req;

    if (
      !purpose ||
      !agreementNo ||
      !contractor ||
      !instrumentNo ||
      !reducedLevel ||
      !backSight ||
      !chainageMultiple ||
      !separator
    ) {
      throw createHttpError(400, "All technical fields are required");
    }

    const survey = await Survey.findOne({
      _id: id,
      createdBy: userId,
      status: "Scheduled",
      deleted: false,
    }).session(session);

    if (!survey) {
      throw createHttpError(
        404,
        "Scheduled survey not found or already activated",
      );
    }

    // Update survey with technical fields and activate it
    survey.agreementNo = agreementNo;
    survey.contractor = contractor;
    survey.instrumentNo = instrumentNo;
    survey.chainageMultiple = Number(chainageMultiple);
    survey.separator = separator;
    survey.reducedLevel = Number(reducedLevel).toFixed(3);
    survey.status = "Active";
    await survey.save({ session });

    // Create first purpose
    const purposeDoc = await SurveyPurpose.create(
      [
        {
          surveyId: survey._id,
          createdBy: userId,
          type: purpose,
          isSurveyFinish: false,
        },
      ],
      { session },
    );

    const purposeObj = purposeDoc[0];

    // Create first TBM row
    const row = await SurveyRow.create(
      [
        {
          surveyId: survey._id,
          purposeId: purposeObj._id,
          createdBy: userId,
          type: "Instrument setup",
          backSight: Number(backSight).toFixed(3),
          remark: remark || "TBM - 1",
          reducedLevels: [Number(reducedLevel).toFixed(3)],
          heightOfInstrument: Number(
            Number(reducedLevel) + Number(backSight),
          ).toFixed(3),
        },
      ],
      { session },
    );

    await History.create(
      [
        {
          entityType: "Survey",
          entityId: survey._id,
          action: "Update",
          notes: `Scheduled survey completed and activated with purpose ${purpose}`,
          performedBy: userId,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Survey activated successfully",
      survey: {
        ...survey.toObject(),
        purposeId: purposeObj._id,
        status: "Active",
      },
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

const getSurvey = async (req, res, next) => {
  try {
    const {
      user: { userId },
      params: { id },
    } = req;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid survey ID",
      });
    }

    // Find active (non-deleted) survey
    const survey = await Survey.findOne({
      _id: id,
      deleted: false,
      createdBy: userId,
    }).populate({
      path: "purposes",
      match: { deleted: false },
      populate: {
        path: "rows",
        match: { deleted: false },
        options: { sort: { _id: 1, createdAt: 1 } },
      },
    });

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
const deleteSurvey = async (req, res, next) => {
  try {
    const {
      user: { userId },
      params: { id },
    } = req;

    if (!isValidObjectId(id)) {
      throw createHttpError(400, "Invalid survey ID");
    }

    const survey = await Survey.findOne({
      _id: id,
      deleted: false,
      createdBy: userId,
    });

    if (!survey) {
      throw createHttpError(404, "Survey not found or has been deleted");
    }

    survey.status = "Deleted";
    survey.deleted = true;
    survey.deletedAt = new Date();
    survey.deletedBy = userId;
    await survey.save();

    res.status(200).json({
      success: true,
      message: "Survey deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

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
        basis,
        intermediateOffsets,
        remark,
        observation,
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
      Chainage: ["chainage", "roadWidth", "spacing", "intermediateOffsets"],
      "Water Level": ["intermediateSight"],
      CP: ["foreSight", "backSight"],
      TBM: ["intermediateSight"],
    };

    if (!type || !Object.keys(types).includes(type))
      throw createHttpError(400, `Invalid or missing row type: ${type}`);

    const missing = types[type].filter(
      (f) =>
        !req.body[f] || (Array.isArray(req.body[f]) && !req.body[f].length),
    );
    if (missing.length)
      throw createHttpError(
        400,
        `Missing required fields: ${missing.join(", ")}`,
      );

    const initialSurvey = survey.purposes?.find(
      (p) => p.type === "Initial Level",
    );

    if (isProposal && type === "Chainage") {
      const filteredInitialSurvey =
        initialSurvey?.rows?.filter((entry) => entry.type === "Chainage") || [];

      const totalReadings = filteredInitialSurvey.length;
      const currentIndex = filteredInitialSurvey.findIndex(
        (entry) => entry.chainage === chainage,
      );

      if (currentIndex === -1) {
        throw new Error(`Chainage "${chainage}" not found in initial survey`);
      }

      if (currentIndex === totalReadings - 1) {
        isLastReading = true;
      }
    }

    // Sort intermediateOffsets by numeric offset value
    const sortedOffsets = (intermediateOffsets || []).sort(
      (a, b) => Number(a.offset) - Number(b.offset),
    );
    const waterLevelSavedAt = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });

    const newReading = {
      type,
      purposeId: purpose._id,
      createdBy: userId,
      chainage: type === "Chainage" ? chainage : undefined,
      spacing: type === "Chainage" ? spacing : undefined,
      roadWidth:
        type === "Chainage" && roadWidth
          ? Number(roadWidth).toFixed(3)
          : undefined,
      basis: type === "Chainage" ? basis : undefined,

      backSight: backSight ? Number(backSight).toFixed(3) : undefined,
      foreSight: foreSight ? Number(foreSight).toFixed(3) : undefined,

      // For Chainage rows: store as intermediateOffsets array of objects
      ...(type === "Chainage"
        ? {
            intermediateOffsets: sortedOffsets.map((entry) => ({
              is: isProposal ? "" : Number(entry.is || 0).toFixed(3),
              offset: Number(entry.offset || 0).toFixed(3),
              remark: entry.remark || "",
              mode: entry.mode || "S",
            })),
            reducedLevels: isProposal
              ? (reducedLevels || []).map((n) => Number(n).toFixed(3))
              : [],
          }
        : {}),

      // TBM and Water Level use scalar IS arrays
      intermediateSight:
        (type === "TBM" || type === "Water Level") && intermediateSight
          ? [Number(intermediateSight).toFixed(3)]
          : undefined,

      // Non-Chainage rows use scalar remark. Water Level stores the entry time.
      ...(type !== "Chainage"
        ? {
            remark:
              type === "Water Level"
                ? remark?.trim()
                  ? `${remark.trim()} - ${waterLevelSavedAt}`
                  : waterLevelSavedAt
                : remark,
          }
        : {}),

      observation: observation || "",
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
          "Invalid state: last row must be CP when resuming a paused survey.",
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
        { new: true, session },
      );

      if (!newRow) {
        throw createHttpError(
          500,
          "Failed to update CP row while resuming survey.",
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
        populate: [
          {
            path: "purposes",
            match: { deleted: false },
            populate: {
              path: "rows",
              match: { deleted: false },
              options: { sort: { createdAt: 1 } },
            },
          },
          {
            path: "branchDetails.currentBranch",
            match: { deleted: false },
            populate: {
              path: "purposes",
              match: { deleted: false },
            },
          },
          {
            path: "parentBranch",
            match: { deleted: false },
          },
          {
            path: "rootBranch",
            match: { deleted: false },
            populate: [
              {
                path: "surveyId",
                match: { deleted: false },
              },
              {
                path: "purposes",
                match: { deleted: false },
                populate: {
                  path: "rows",
                  match: { deleted: false },
                  options: { sort: { createdAt: 1 } },
                },
              },
            ],
          },
        ],
      })
      .populate({
        path: "rows",
        match: { deleted: false },
        options: { sort: { createdAt: 1 } },
      });

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

const getFieldBook = async (req, res, next) => {
  try {
    const {
      params: { id },
      user: { userId },
    } = req;

    // 🔹 Validate ID format
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid purpose ID",
      });
    }

    const purpose = await SurveyPurpose.findOne({ _id: id, deleted: false });

    if (!purpose) {
      return res.status(404).json({
        success: false,
        message: "Survey purpose not found or has been deleted",
      });
    }

    const survey = await Survey.findOne({
      _id: purpose.surveyId,
      createdBy: userId,
      deleted: false,
    })
      .populate({
        path: "purposes",
        match: { deleted: false, type: purpose.type },
        populate: {
          path: "rows",
          match: { deleted: false },
          options: { sort: { createdAt: 1 } },
        },
      })
      .lean();

    const branches = await Branch.find({
      deleted: false,
      rootBranch: purpose.surveyId,
    })
      .populate({
        path: "purposes",
        match: { deleted: false, type: purpose.type },
        populate: {
          path: "rows",
          match: { deleted: false },
          options: { sort: { createdAt: 1 } },
        },
      })
      .lean();

    res.status(200).json({
      success: true,
      message: "Survey purpose retrieved successfully",
      survey: {
        ...survey,
        branches,
      },
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
        (field) => field === undefined || field === null || field === "",
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
          "Please provide either (Cross section slop) or Cross section camper",
        );
      }
    } else {
      const requiredFields = [reducedLevel, backSight];

      const missingRequired = requiredFields.some(
        (field) => field === undefined || field === null || field === "",
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
        (p) => p.relation?.type === purpose && p.type === proposal,
      );

      if (existingProposal) {
        throw createHttpError(
          409,
          `A proposal between "${purpose}" and "${proposal}" already exists`,
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
      { session },
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
            remark: "TBM - 1",
            reducedLevels: [Number(reducedLevel).toFixed(3)],
            heightOfInstrument: Number(
              Number(reducedLevel) + Number(backSight),
            ).toFixed(3),
          },
        ],
        { session },
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
        "Cannot finish purpose — survey already finished",
      );

    let parentBranch = null;

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

    if (survey.branchDetails?.isBranch) {
      parentBranch = await Survey.findOne({
        _id: survey.branchDetails.parentBranch,
      })
        .populate("purposes")
        .session(session);

      if (!parentBranch || parentBranch.deleted)
        throw createHttpError(404, "Parent branch not found");

      if (
        String(survey.branchDetails.rootBranch) ===
        String(survey.branchDetails.parentBranch)
      ) {
        parentBranch.branchDetails.isBranchEnd = true;
        parentBranch.branchDetails.isBranchStart = false;
        parentBranch.branchDetails.branchStartedFrom = null;
        parentBranch.branchDetails.currentBranch = null;
      } else {
        await Survey.updateOne(
          {
            _id: survey.branchDetails.rootBranch,
          },
          {
            $set: {
              "branchDetails.currentBranch": survey.branchDetails.parentBranch,
            },
          },
          { session },
        );
      }

      const update = {
        $push: { finishedLevels: purpose.type },
      };

      if (purpose.type === "Initial Level") {
        update.$set = {
          isBranchEnd: true,
          endDate: new Date(),
        };
      }

      await Branch.updateOne({ surveyId: survey._id }, update, { session });

      await parentBranch.save({ session });
    }

    if (purpose.type === "Final Level") {
      survey.isSurveyFinish = true;
      survey.status = "Completed";
      survey.surveyFinishDate = new Date();

      await survey.save({ session });
    }

    await purpose.save({ session });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Purpose ended successfully",
      purpose,
      parentBranch,
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
        `Cannot end survey — purpose "${pendingPurpose.type}" is still pending`,
      );
    }

    survey.isSurveyFinish = true;
    survey.status = "Completed";
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
        basis,
        intermediateSight,
        intermediateOffsets,
        foreSight,
        backSight,
        remark,
      },
    } = req;

    const isPurposeExist =
      await SurveyPurpose.findById(id).populate("surveyId");
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
        Number(isRowExist.reducedLevels[0]) + Number(backSight),
      ).toFixed(3);
      isRowExist.remark = remark;
    }

    if (type === "TBM" || type === "Water Level") {
      const prevIS = Number(isRowExist.intermediateSight?.[0] ?? 0);
      const prevRL = Number(isRowExist.reducedLevels?.[0] ?? 0);
      const newIS = Number(intermediateSight);

      const diff = prevIS - newIS;
      const newRL = prevRL + diff;
      const waterLevelSavedAt = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      });

      isRowExist.reducedLevels = [newRL.toFixed(3)];
      isRowExist.intermediateSight = [newIS.toFixed(3)];
      isRowExist.remark =
        type === "Water Level"
          ? remark?.trim()
            ? `${remark.trim()} - ${waterLevelSavedAt}`
            : waterLevelSavedAt
          : remark;
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
      isRowExist.remark = remark;
    }

    if (type === "Chainage") {
      const isProposal = isPurposeExist.phase === "Proposal";
      const existingHI = Number(isRowExist.heightOfInstrument || 0);

      const sortedOffsets = (intermediateOffsets || []).sort(
        (a, b) => Number(a.offset) - Number(b.offset),
      );

      // Find the last Water Level row before this row
      const currentRowIndex = isPurposeExist.rows.findIndex(
        (r) => String(r._id) === String(isRowExist._id),
      );
      const rowsBeforeCurrent = isPurposeExist.rows.slice(0, currentRowIndex);
      const lastWaterLevelRow = [...rowsBeforeCurrent]
        .filter((r) => r.type === "Water Level")
        .pop();
      const lastWaterLevelRL = lastWaterLevelRow
        ? Number(
            lastWaterLevelRow.reducedLevels[
              lastWaterLevelRow.reducedLevels.length - 1
            ] || 0,
          )
        : null;

      isRowExist.chainage = chainage;
      isRowExist.basis = type === "Chainage" ? basis : undefined;

      // Update top-level reducedLevels array
      isRowExist.reducedLevels = isProposal
        ? (req.body.reducedLevels || []).map((n) => Number(n).toFixed(3))
        : sortedOffsets.map((entry) => {
            if (
              type === "Chainage" &&
              entry.mode === "S" &&
              lastWaterLevelRL !== null
            ) {
              return (lastWaterLevelRL - Number(entry.is || 0)).toFixed(3);
            } else {
              return (existingHI - Number(entry.is || 0)).toFixed(3);
            }
          });

      isRowExist.intermediateOffsets = sortedOffsets.map((entry) => ({
        is: isProposal ? "" : Number(entry.is || 0).toFixed(3),
        offset: Number(entry.offset || 0).toFixed(3),
        remark: entry.remark || "",
        mode: entry.mode || "S",
      }));
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

    const isPurposeExist =
      await SurveyPurpose.findById(id).populate("surveyId");
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
        "This survey has already been finished. Cannot pause.",
      );
    }

    if (survey.status === "Paused") {
      throw createHttpError(400, "This survey is already paused.");
    }

    if (survey.type !== "Initial Level") {
      throw createHttpError(
        400,
        "This operation is allowed only for Initial Level surveys.",
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
      { session },
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
        formula,
        interpolation,
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
      (x) => x === undefined || x === null || x === "",
    );

    if (missingRequired) {
      throw createHttpError(
        400,
        "Missing required fields for proposal generation.",
      );
    }

    // Conditional validation for cross-section inputs
    const hasCsPair = cSection && csSlop && cSection !== "" && csSlop !== "";

    const hasCsCamper =
      csCamper !== undefined && csCamper !== null && csCamper !== "";

    if (!hasCsPair && !hasCsCamper) {
      throw createHttpError(
        400,
        "Please enter either both cross-section slope fields or a cross-section camber.",
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
        `A survey with the name "${proposal}" already exists.`,
      );
    }

    // 🔹 Check if relationship already exists
    const existingProposal = survey.purposes?.find(
      (p) => p.relation?.type === purpose && p.type === proposal,
    );

    if (existingProposal) {
      throw createHttpError(
        409,
        `A proposal between "${purpose}" and "${proposal}" already exists.`,
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
      (r) => r.type === "Chainage",
    );

    if (!readingsToCreate?.length) {
      throw createHttpError(
        409,
        `No chainage readings found to generate "${proposal}".`,
      );
    }

    const parseChainage = (str) => {
      const [km, m] = str.split(survey.separator).map(Number);
      return km * 1000 + m;
    };

    const ranges = interpolation.map((range) => ({
      start: parseChainage(range.from),
      end: parseChainage(range.to),
      width: range.width,
    }));

    const interpolationChainage = readingsToCreate.reduce((acc, item) => {
      const currentVal = parseChainage(item.chainage);

      const matchedRange = ranges.find(
        (r) => currentVal >= r.start && currentVal <= r.end,
      );

      if (matchedRange) {
        acc.push({
          chainage: item.chainage,
          width: matchedRange.width,
        });
      }

      return acc;
    }, []);

    const totalWidth = readingsToCreate.reduce((acc, curr) => {
      return acc + (Number(curr.roadWidth) || 0);
    }, 0);

    const proposalTotalWidth = readingsToCreate.reduce((acc, curr) => {
      if (interpolation?.length) {
        const matchedItem = interpolationChainage.find(
          (item) => item.chainage === curr.chainage,
        );
        if (matchedItem) {
          return acc + (Number(matchedItem.width) || 0);
        }
      }

      return acc + (Number(curr.roadWidth) || 0);
    }, 0);

    const width = Number((totalWidth / readingsToCreate.length).toFixed(3));
    const avgProposalTotalWidth = Number(
      proposalTotalWidth / readingsToCreate.length,
    );

    // 🔹 Create new proposal purpose
    const [purposeDoc] = await SurveyPurpose.create(
      [
        {
          surveyId: id,
          type: proposal,
          phase: "Proposal",
          createdBy: userId,
          quantity,
          length,
          width,
          // lSection,
          // lsSlop,
          cSection,
          csSlop,
          csCamper,
          relation,
          status: "Finished",
          isPurposeFinish: true,
          purposeFinishDate: new Date(),
          pls: basePurpose?.pls,
        },
      ],
      { session },
    );

    // -----------------------------
    // 🔹 Bulk Insert Rows (FASTEST)
    // -----------------------------

    const roadWidth = Number(width);
    const safeQuantity = Number(quantity);
    const lastReading = readingsToCreate.at(-1);
    const doHaveCamper = csCamper > 0 ? Number(csCamper) : null;

    // ─── Binary-Search Solver helpers ────────────────────────────────────────
    //
    // We need to find the single Proposed Road Level (PRL) whose total fill
    // volume — computed with the Average End Area method — equals the target
    // BOQ quantity.
    //
    // Cross-section area at each chainage (trapezoidal fill body):
    //   h    = subgradeLevel − OGL  (fill depth; 0 for cut sections)
    //   Area = (formationWidth + sideSlope × h) × h
    //
    // Volume between consecutive chainages:
    //   V = distance × (Area_i + Area_{i+1}) / 2   (Average End Area)
    //
    // cSection → formation width  ("B")
    // csSlop   → side slope ratio ("S", e.g. 2 for a 2:1 slope)
    // totalCrustThickness is omitted here because the OGL values stored in
    // the survey are already the top-of-subgrade readings in this workflow;
    // the PRL itself is what we solve for and it equals the subgrade level.

    const formationWidth = cSection ? Number(cSection) : roadWidth;
    const sideSlope = csSlop ? Number(csSlop) : 0;

    /**
     * Build a flat list of { chainage_m, avgOGL } for all Chainage rows
     * using the separator stored on the survey document.
     */
    const oglPoints = readingsToCreate.map((r) => {
      const [km, m] = r.chainage.split(survey.separator).map(Number);
      const chainageMeters = km * 1000 + m;

      const levels = (r.intermediateOffsets || []).map((e) => Number(e.rl));
      const avgOGL = levels.length
        ? levels.reduce((a, b) => a + b, 0) / levels.length
        : 0;

      return { chainage: chainageMeters, ogl: avgOGL, reading: r };
    });

    // Calculate centerline initial RLs to find the average and maximum initial RLs
    const plsVal = Number(basePurpose?.pls || 0);
    const centerlineInitialRLs = readingsToCreate
      .map((r) => {
        const idx = (r.intermediateOffsets || []).findIndex(
          (e) => Number(e.offset) === plsVal,
        );
        const safeIdx =
          idx === -1 || idx === undefined
            ? Math.round((r.intermediateOffsets || []).length / 2)
            : idx;
        const val = r.reducedLevels[safeIdx];
        return val !== null && val !== undefined && val !== ""
          ? Number(val)
          : null;
      })
      .filter((v) => v !== null);

    const averageInitialRL = centerlineInitialRLs.length
      ? centerlineInitialRLs.reduce((a, b) => a + b, 0) /
        centerlineInitialRLs.length
      : 0;

    const maxInitialRL = centerlineInitialRLs.length
      ? Math.max(...centerlineInitialRLs)
      : 0;

    // Enforce design level is strictly higher than average (or higher than the max initial RL of the section)
    const proposedRLBuffer = 0.05; // 5 cm buffer
    const minProposedRL = Math.max(
      averageInitialRL + proposedRLBuffer,
      maxInitialRL + proposedRLBuffer,
    );

    /**
     * Computes total fill volume (m³) for a given height difference h
     * using the Average End Area method with a trapezoidal cross-section.
     */
    const calculateVolumeForH = (h) => {
      const areas = oglPoints.map(() => {
        if (h <= 0) return 0;
        // Trapezoidal fill cross-section: (B + S·h) × h
        return (formationWidth + sideSlope * h) * h;
      });

      let totalVolume = 0;
      for (let i = 0; i < areas.length - 1; i++) {
        const dist = oglPoints[i + 1].chainage - oglPoints[i].chainage;
        totalVolume += dist * ((areas[i] + areas[i + 1]) / 2);
      }
      return totalVolume;
    };

    /**
     * Binary-search solver: returns the thickness H that yields exactly targetVolume.
     */
    const solveForH = (targetVolume) => {
      let lo = 0.005; // 5mm minimum thickness
      let hi = 100;
      const tolerance = 0.01; // accurate to within 0.01 m³
      const maxIterations = 100;

      let bestH = (lo + hi) / 2;

      for (let i = 0; i < maxIterations; i++) {
        bestH = (lo + hi) / 2;
        const vol = calculateVolumeForH(bestH);

        if (Math.abs(vol - targetVolume) <= tolerance) break;

        if (vol < targetVolume) {
          lo = bestH; // need more fill → increase thickness
        } else {
          hi = bestH; // too much fill → decrease thickness
        }
      }

      return bestH;
    };

    // Only use the formula-based solver when side-slope geometry is provided.
    const useSolver = !!(cSection && csSlop);
    const solvedH = useSolver ? solveForH(safeQuantity) : null;

    // ─── Cross-Section Solver (new method) ───────────────────────────────────
    //
    // More accurate alternative that uses the actual per-offset OGL readings
    // at every chainage instead of an averaged OGL with a fixed trapezoidal
    // formula.  The fill area at each cross-section is computed by integrating
    // fill depths across the measured offsets with the Trapezoidal Rule,
    // which naturally handles cambered roads at every offset (not just edges).
    //
    // Activated when:
    //   • formula === "cross-section"  (explicit request from client)
    //   • OR camber is specified without a side-slope (camber-only profiles)

    /**
     * Returns the proposed subgrade level at each offset for a given
     * centerline PRL, applying camber drop proportionally from the center.
     */
    const getProposedLevelsAtOffsets = (
      centerPRL,
      numericOffsets,
      camberPercent,
    ) =>
      numericOffsets.map((offset) => {
        if (camberPercent > 0) {
          return centerPRL - (camberPercent / 100) * Math.abs(offset);
        }
        return centerPRL;
      });

    /**
     * Computes the fill area at a single cross-section using the Trapezoidal
     * Rule across the measured offsets.
     * Only positive depths (fill) are counted; cut zones return 0.
     */
    const calcXSFillArea = (oglProfile, proposedLevels, numericOffsets) => {
      const oglMap = {};
      oglProfile.forEach((p) => {
        oglMap[p.offset] = p.ogl;
      });

      const depths = numericOffsets.map((offset, i) => {
        const ogl = oglMap[offset];
        if (ogl === undefined) return 0;
        const depth = proposedLevels[i] - ogl;
        return depth > 0 ? depth : 0;
      });

      let area = 0;
      for (let i = 0; i < numericOffsets.length - 1; i++) {
        area +=
          ((depths[i] + depths[i + 1]) / 2) *
          (numericOffsets[i + 1] - numericOffsets[i]);
      }
      return area;
    };

    // Build per-offset OGL data from the actual survey readings
    const xsChainageData = readingsToCreate.map((r) => {
      const [km, m] = r.chainage.split(survey.separator).map(Number);
      const chainageMeters = km * 1000 + m;
      const numericOffsets = (r.intermediateOffsets || []).map((e) =>
        Number(e.offset),
      );
      const oglProfile = (r.intermediateOffsets || []).map((e, idx) => ({
        offset: Number(e.offset),
        ogl: Number(r.reducedLevels?.[idx] ?? 0),
      }));
      return { chainage: chainageMeters, oglProfile, numericOffsets };
    });

    /**
     * Total fill volume for a given constant centerline thickness h using the cross-section
     * method (Trapezoidal Rule per cross-section + Average End Area between chainages).
     */
    const calculateVolumeXS = (h) => {
      const camberPct = doHaveCamper || 0;
      const areas = xsChainageData.map(({ oglProfile, numericOffsets }) => {
        // Find centerline OGL (at offset plsVal, default to middle index if not found)
        const oglMap = {};
        oglProfile.forEach((p) => {
          oglMap[p.offset] = p.ogl;
        });
        const centerlineOGL =
          oglMap[plsVal] !== undefined
            ? oglMap[plsVal]
            : oglProfile[Math.round(oglProfile.length / 2)]?.ogl || 0;

        // Centerline proposed level is centerlineOGL + h
        const centerPRL = centerlineOGL + h;

        const proposedLevels = getProposedLevelsAtOffsets(
          centerPRL,
          numericOffsets,
          camberPct,
        );
        return calcXSFillArea(oglProfile, proposedLevels, numericOffsets);
      });

      let totalVolume = 0;
      for (let i = 0; i < xsChainageData.length - 1; i++) {
        const dist =
          xsChainageData[i + 1].chainage - xsChainageData[i].chainage;
        totalVolume += dist * ((areas[i] + areas[i + 1]) / 2);
      }
      return totalVolume;
    };

    /**
     * Binary-search solver using the cross-section volume function to find thickness h.
     */
    const solveForH_XS = (targetVolume) => {
      let lo = 0.005; // 5mm minimum thickness
      let hi = 100;
      const tolerance = 0.01;
      const maxIter = 200;
      let bestH = (lo + hi) / 2;

      for (let i = 0; i < maxIter; i++) {
        bestH = (lo + hi) / 2;
        const vol = calculateVolumeXS(bestH);
        if (Math.abs(vol - targetVolume) <= tolerance) break;
        if (vol < targetVolume) lo = bestH;
        else hi = bestH;
      }
      return bestH;
    };

    // Use the cross-section solver whenever offset data is available.
    // This solver uses the exact same per-offset Trapezoidal Rule that the
    // frontend VolumeReport uses to display volumes — guaranteeing that the
    // stored proposed levels will reproduce the target quantity on the report.
    //
    // The formula-based solver (B+Sh)h uses averaged OGL with a geometric
    // formula that diverges from the frontend calculation, causing a systematic
    // shortfall (e.g. 97.96 instead of 100). It is kept only as a fallback
    // for rows that have no offset readings.
    const hasOffsetData =
      xsChainageData.length > 1 &&
      xsChainageData[0]?.numericOffsets?.length > 1;

    const useCrossSectionSolver = hasOffsetData || formula === "cross-section";
    const crossSectionH = useCrossSectionSolver
      ? solveForH_XS(safeQuantity)
      : null;

    const bulkOps = readingsToCreate.map((reading) => {
      const reducedLevels = [];
      const offsets = [];
      const interpolatedReducedLevels = [];

      let isInterpolate = null;

      if (interpolation?.length) {
        isInterpolate = interpolationChainage.find(
          (item) => item.chainage === reading.chainage,
        );
      }

      if (isInterpolate) {
        const initialLevelMap = {};
        (reading.intermediateOffsets || []).forEach((e, idx) => {
          initialLevelMap[e.offset] = reading.reducedLevels?.[idx];
        });

        const cropAndInterpolate = (targetWidth, sourceMap) => {
          const result = {};
          const width = Number(targetWidth);

          // 1. Get all original offsets as sorted numbers
          const originalOffsets = Object.keys(sourceMap)
            .map(Number)
            .sort((a, b) => a - b);

          const lowerBound = -width;
          const upperBound = width;

          // Helper to safely get value from map even if key format varies
          const getLevel = (num) => {
            return (
              sourceMap[num.toFixed(3)] ||
              sourceMap[num.toFixed(2)] ||
              sourceMap[num.toFixed(1)] ||
              sourceMap[num.toString()]
            );
          };

          // 2. Add the NEW lower boundary
          result[lowerBound.toFixed(3)] = calculateInterpolation(
            lowerBound,
            originalOffsets,
            getLevel,
          );

          // 3. Keep all original points strictly INSIDE the range
          originalOffsets.forEach((offset) => {
            if (offset > lowerBound && offset < upperBound) {
              result[offset.toFixed(3)] = getLevel(offset);
            }
          });

          // 4. Add the NEW upper boundary
          result[upperBound.toFixed(3)] = calculateInterpolation(
            upperBound,
            originalOffsets,
            getLevel,
          );

          return result;
        };

        const calculateInterpolation = (x, offsets, getLevelFn) => {
          let x1, x2;
          for (let i = 0; i < offsets.length - 1; i++) {
            if (x >= offsets[i] && x <= offsets[i + 1]) {
              x1 = offsets[i];
              x2 = offsets[i + 1];
              break;
            }
          }

          if (x === x1) return getLevelFn(x1);
          if (x === x2) return getLevelFn(x2);
          if (x1 === undefined || x2 === undefined) return "0.000";

          const y1 = parseFloat(getLevelFn(x1));
          const y2 = parseFloat(getLevelFn(x2));
          const y = y1 + (x - x1) * ((y2 - y1) / (x2 - x1));
          return y.toFixed(3);
        };

        const finalMap = cropAndInterpolate(
          Number(isInterpolate.width / 2),
          initialLevelMap,
        );

        for (const [offset, level] of Object.entries(finalMap)) {
          interpolatedReducedLevels.push(Number(level));
          offsets.push(offset);
        }

        const totalReadingReducedLevel = interpolatedReducedLevels.reduce(
          (acc, curr) => acc + Number(curr),
          0,
        );
        const avgReadingReducedLevel =
          totalReadingReducedLevel / interpolatedReducedLevels.length;

        // Find centerline OGL for the current reading
        const centerlineOGLKey = Object.keys(finalMap).find(
          (k) => Number(k) === plsVal,
        );
        const centerlineOGL =
          centerlineOGLKey !== undefined
            ? Number(finalMap[centerlineOGLKey])
            : avgReadingReducedLevel;

        // ── Proposed level per offset ──────────────────────────────────────
        // Priority:
        //   1. Cross-section solver → per-offset PRL with camber at every point
        //   2. Formula-based solver → flat PRL + edge camber adjustment
        //   3. Legacy simple-height formula
        if (useCrossSectionSolver) {
          // Use the solved thickness and apply camber at every offset, not just edges
          const numericOffsets = offsets.map(Number);
          const centerPRL = centerlineOGL + crossSectionH;
          const proposedLevels = getProposedLevelsAtOffsets(
            centerPRL,
            numericOffsets,
            doHaveCamper || 0,
          );
          proposedLevels.forEach((level) => {
            const rounded = Math.ceil(level / 0.005) * 0.005;
            reducedLevels.push(rounded.toFixed(3));
          });
        } else {
          const baseLevel = useSolver
            ? centerlineOGL + solvedH
            : avgReadingReducedLevel +
              safeQuantity /
                (Number(
                  lastReading?.chainage?.split(survey.separator || "/")?.[1],
                ) || 1) /
                avgProposalTotalWidth;

          interpolatedReducedLevels.forEach((_, idx) => {
            let value = useSolver
              ? baseLevel
              : avgReadingReducedLevel +
                safeQuantity /
                  ((Number(
                    lastReading?.chainage?.split(survey.separator || "/")?.[1],
                  ) || 1) *
                    avgProposalTotalWidth);

            if (
              doHaveCamper &&
              (idx === 0 || idx === interpolatedReducedLevels.length - 1)
            ) {
              value -= (avgProposalTotalWidth / 2) * (doHaveCamper / 100);
            }

            const rounded = Math.round(value / 0.005) * 0.005;
            reducedLevels.push(rounded.toFixed(3));
          });
        }
      } else {
        const totalReadingReducedLevel = (reading.reducedLevels || []).reduce(
          (acc, rl) => acc + Number(rl),
          0,
        );
        const avgReadingReducedLevel = (reading.reducedLevels || []).length
          ? totalReadingReducedLevel / reading.reducedLevels.length
          : 0;

        // Find centerline OGL for the current reading
        const centerlineIdx = (reading.intermediateOffsets || []).findIndex(
          (e) => Number(e.offset) === plsVal,
        );
        const centerlineOGL =
          centerlineIdx !== -1
            ? Number(reading.reducedLevels?.[centerlineIdx] ?? avgReadingReducedLevel)
            : avgReadingReducedLevel;

        // ── Proposed level per offset ──────────────────────────────────────
        // Priority:
        //   1. Cross-section solver → per-offset PRL with camber at every point
        //   2. Formula-based solver → flat PRL + edge camber adjustment
        //   3. Legacy simple rectangle formula
        const limit =
          Number(lastReading?.chainage?.split(survey.separator || "/")?.[1]) ||
          1;

        if (useCrossSectionSolver) {
          // Apply camber at every offset using the same function used in volume
          // computation, so proposed levels are consistent with the solver.
          const numericOffsets = (reading.intermediateOffsets || []).map((e) =>
            Number(e.offset),
          );
          const centerPRL = centerlineOGL + crossSectionH;
          const proposedLevels = getProposedLevelsAtOffsets(
            centerPRL,
            numericOffsets,
            doHaveCamper || 0,
          );
          proposedLevels.forEach((level) => {
            const rounded = Math.ceil(level / 0.005) * 0.005;
            reducedLevels.push(rounded.toFixed(3));
          });
        } else {
          (reading.intermediateOffsets || []).forEach((_, idx) => {
            let value = useSolver
              ? centerlineOGL + solvedH
              : avgReadingReducedLevel + safeQuantity / (limit * roadWidth);

            if (
              doHaveCamper &&
              (idx === 0 ||
                idx === (reading.intermediateOffsets || []).length - 1)
            ) {
              value -= (avgProposalTotalWidth / 2) * (doHaveCamper / 100);
            }

            const rounded = Math.round(value / 0.005) * 0.005;
            reducedLevels.push(rounded.toFixed(3));
          });
        }

        offsets.push(
          ...(reading.intermediateOffsets || []).map((e) => e.offset),
        );
      }

      // Build the new intermediateOffsets for the proposal row
      const proposalIntermediateOffsets = offsets.map((offset, i) => ({
        is: "",
        offset: String(offset),
        remark:
          reading.intermediateOffsets?.[i]?.remark ||
          (isInterpolate?.interpolationMap?.[offset] ?? ""),
        mode: reading.intermediateOffsets?.[i]?.mode || "S",
      }));

      return {
        insertOne: {
          document: {
            surveyId: id,
            createdBy: userId,
            purposeId: purposeDoc._id,
            type: reading.type,
            chainage: reading.chainage,
            spacing: reading.spacing,
            roadWidth: isInterpolate
              ? Number(isInterpolate.width)
              : reading.roadWidth,
            reducedLevels,
            intermediateOffsets: proposalIntermediateOffsets,
            heightOfInstrument: reading.heightOfInstrument,
            interpolatedReducedLevels,
            remark: reading.remark,
          },
        },
      };
    });

    if (bulkOps.length > 0) {
      await SurveyRow.bulkWrite(bulkOps, { session });
    } else {
      throw createHttpError(409, `Something went wrong!`);
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

const generateWaterWayProposalPurpose = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      params: { id },
      user: { userId },
      body: {
        purpose,
        proposal,
        proposalMethod,
        proposedLevel,
        quantity,
        bottomWidth,
        startRL,
        endRL,
        slope,
        buffer,
        bufferDirection,
        length,
      },
    } = req;

    if (!purpose || !proposal || !id) {
      throw createHttpError(400, "Purpose, proposal and surveyId are required.");
    }

    const waterWayMethods = [
      "Bottom Width Fixed",
      "Slope End-to-End Type",
      "With Respect to Buffer",
    ];

    if (!waterWayMethods.includes(proposalMethod)) {
      throw createHttpError(400, "Invalid Water Way proposal method.");
    }

    if (
      proposalMethod === "Bottom Width Fixed" &&
      (bottomWidth === undefined || bottomWidth === null || bottomWidth === "")
    ) {
      throw createHttpError(400, "Bottom width is required.");
    }

    if (
      proposalMethod === "Bottom Width Fixed" &&
      (quantity === undefined || quantity === null || quantity === "")
    ) {
      throw createHttpError(400, "Quantity is required.");
    }

    if (
      proposalMethod === "Bottom Width Fixed" &&
      Number(quantity) <= 0
    ) {
      throw createHttpError(400, "Quantity must be greater than zero.");
    }

    if (
      proposalMethod === "Bottom Width Fixed" &&
      (slope === undefined || slope === null || slope === "")
    ) {
      throw createHttpError(400, "Side slope ratio is required.");
    }

    if (
      proposalMethod === "Slope End-to-End Type" &&
      (startRL === undefined || startRL === null || startRL === "")
    ) {
      throw createHttpError(400, "Start RL is required for Slope End-to-End Type.");
    }

    if (
      proposalMethod === "Slope End-to-End Type" &&
      (endRL === undefined || endRL === null || endRL === "")
    ) {
      throw createHttpError(400, "End RL is required for Slope End-to-End Type.");
    }

    const parseSlopeRatio = (value) => {
      const match = String(value || "")
        .trim()
        .match(/^(-?\d+(?:\.\d+)?)\s*(?::|\/|∶)\s*(\d+(?:\.\d+)?)$/);

      if (!match) return null;

      const horizontal = Number(match[1]);
      const vertical = Number(match[2]);

      if (
        !Number.isFinite(horizontal) ||
        !Number.isFinite(vertical) ||
        horizontal <= 0 ||
        vertical <= 0
      ) {
        return null;
      }

      return vertical / horizontal;
    };

    const numericSlopeRatio =
      proposalMethod === "Bottom Width Fixed"
        ? parseSlopeRatio(slope)
        : null;

    if (
      proposalMethod === "Bottom Width Fixed" &&
      numericSlopeRatio === null
    ) {
      throw createHttpError(
        400,
        "Slope must be in H:V ratio format, e.g. 0.75:1.",
      );
    }

    if (
      proposalMethod === "With Respect to Buffer" &&
      (buffer === undefined || buffer === null || buffer === "")
    ) {
      throw createHttpError(400, "Buffer is required.");
    }

    const survey = await Survey.findOne({
      _id: id,
      type: "Water Way",
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
      throw createHttpError(404, "Active Water Way survey not found.");
    }

    const isProposalExist = survey.purposes?.find((p) => p.type === proposal);

    if (isProposalExist) {
      throw createHttpError(
        409,
        `A survey with the name "${proposal}" already exists.`,
      );
    }

    const existingProposal = survey.purposes?.find(
      (p) => p.relation?.type === purpose && p.type === proposal,
    );

    if (existingProposal) {
      throw createHttpError(
        409,
        `A proposal between "${purpose}" and "${proposal}" already exists.`,
      );
    }

    const basePurpose = survey.purposes?.find((p) => p.type === purpose);

    if (!basePurpose) {
      throw createHttpError(404, `Survey purpose "${purpose}" not found.`);
    }

    const readingsToCreate = basePurpose.rows?.filter(
      (r) => r.type === "Chainage",
    );

    if (!readingsToCreate?.length) {
      throw createHttpError(
        409,
        `No chainage readings found to generate "${proposal}".`,
      );
    }

    const parseChainage = (str) => {
      const [km, m] = String(str || "0/0").split(survey.separator || "/").map(Number);
      return (Number(km) || 0) * 1000 + (Number(m) || 0);
    };

    const numericBuffer = Number(buffer || 0);
    const numericBottomWidth = Number(bottomWidth || 0);
    const numericQuantity = Number(quantity || 0);
    const bufferSign = bufferDirection === "above" ? 1 : -1;
    // Convert the parsed V/H gradient back to horizontal run per unit vertical
    // rise for the fixed-bottom side-batter geometry.
    const bottomWidthSideSlope =
      proposalMethod === "Bottom Width Fixed" ? 1 / numericSlopeRatio : null;

    const getCenterLevel = (reading) => {
      const levels = (reading.reducedLevels || []).map(Number).filter(Number.isFinite);
      if (!levels.length) return 0;

      const plsVal = Number(basePurpose?.pls || 0);
      const centerIndex = (reading.intermediateOffsets || []).findIndex(
        (e) => Number(e.offset) === plsVal,
      );

      return centerIndex >= 0 && Number.isFinite(levels[centerIndex])
        ? levels[centerIndex]
        : levels[Math.floor(levels.length / 2)] || levels[0];
    };

    const interpolateLevel = (x, points) => {
      if (!points.length) return "0.000";
      if (x <= points[0].offset) return points[0].rl.toFixed(3);
      if (x >= points.at(-1).offset) return points.at(-1).rl.toFixed(3);

      for (let i = 0; i < points.length - 1; i++) {
        const left = points[i];
        const right = points[i + 1];

        if (x >= left.offset && x <= right.offset) {
          const ratio = (x - left.offset) / (right.offset - left.offset || 1);
          return (left.rl + (right.rl - left.rl) * ratio).toFixed(3);
        }
      }

      return points[0].rl.toFixed(3);
    };

    const getGroundPoints = (reading) =>
      (reading.intermediateOffsets || [])
        .map((entry, index) => ({
          offset: Number(entry.offset),
          rl: Number(reading.reducedLevels?.[index]),
          source: entry,
        }))
        .filter((point) => Number.isFinite(point.offset) && Number.isFinite(point.rl))
        .sort((a, b) => a.offset - b.offset);

    const buildBottomWidthGeometry = (reading, bedLevel) => {
      const configuredCenter = Number(basePurpose?.pls);
      const points = getGroundPoints(reading);
      const centerOffset = Number.isFinite(configuredCenter)
        ? configuredCenter
        : points.length
          ? (points[0].offset + points.at(-1).offset) / 2
          : 0;
      const halfWidth = numericBottomWidth / 2;
      // The entered fixed width is the distance between the two outer tie
      // points. The side slopes descend inward from those limits, so the flat
      // bed is narrower than the entered width.
      const leftTieOffset = centerOffset - halfWidth;
      const rightTieOffset = centerOffset + halfWidth;
      const leftTieLevel = Number(interpolateLevel(leftTieOffset, points));
      const rightTieLevel = Number(interpolateLevel(rightTieOffset, points));
      const leftRun = Math.min(
        Math.max(leftTieLevel - bedLevel, 0) * bottomWidthSideSlope,
        halfWidth,
      );
      const rightRun = Math.min(
        Math.max(rightTieLevel - bedLevel, 0) * bottomWidthSideSlope,
        halfWidth,
      );
      const leftBed = leftTieOffset + leftRun;
      const rightBed = rightTieOffset - rightRun;
      const leftTie = { offset: leftTieOffset, rl: leftTieLevel };
      const rightTie = { offset: rightTieOffset, rl: rightTieLevel };

      const geometry = [
        { offset: leftTie.offset, rl: leftTie.rl },
        { offset: leftBed, rl: bedLevel },
        { offset: rightBed, rl: bedLevel },
        { offset: rightTie.offset, rl: rightTie.rl },
      ].sort((a, b) => a.offset - b.offset);

      // Quantity for a fixed-bottom water way is based on its centerline
      // excavation depth multiplied by the supplied bottom width. Averaging
      // the higher outer ground readings would incorrectly raise the solved
      // bed RL (for example 8.667 instead of the required 8.625).
      const centerGroundLevel = Number(
        interpolateLevel(centerOffset, points),
      );
      const area =
        numericBottomWidth * Math.max(centerGroundLevel - bedLevel, 0);

      return { geometry, area };
    };

    const buildBottomWidthOffsets = (reading, bedLevel) => {
      const points = (reading.intermediateOffsets || [])
        .map((entry, index) => ({
          offset: Number(entry.offset),
          rl: Number(reading.reducedLevels?.[index]),
          source: entry,
        }))
        .filter((point) => Number.isFinite(point.offset) && Number.isFinite(point.rl))
        .sort((a, b) => a.offset - b.offset);

      if (!numericBottomWidth || points.length < 2) {
        return {
          offsets: reading.intermediateOffsets || [],
          initialLevels: reading.reducedLevels || [],
          proposedLevels: (reading.reducedLevels || []).map(() =>
            Number(bedLevel || 0).toFixed(3),
          ),
        };
      }

      const { geometry } = buildBottomWidthGeometry(reading, bedLevel);

      return {
        offsets: geometry.map((point) => ({
          is: "",
          offset: point.offset.toFixed(3),
          remark: "",
          mode: "S",
        })),
        initialLevels: geometry.map((point) =>
          Number(interpolateLevel(point.offset, points)).toFixed(3),
        ),
        proposedLevels: geometry.map((point) => point.rl.toFixed(3)),
      };
    };

    const bottomWidthSections =
      proposalMethod === "Bottom Width Fixed"
        ? readingsToCreate.map((reading) => ({
            chainage: parseChainage(reading.chainage),
            reading,
          })).sort((a, b) => a.chainage - b.chainage)
        : [];

    if (
      proposalMethod === "Bottom Width Fixed" &&
      (bottomWidthSections.length < 2 ||
        bottomWidthSections.at(-1).chainage === bottomWidthSections[0].chainage)
    ) {
      throw createHttpError(
        409,
        "At least two distinct chainages are required to calculate proposal quantity.",
      );
    }

    const calculateBottomWidthVolume = (proposedRL) => {
      const areas = bottomWidthSections.map(({ reading }) =>
        buildBottomWidthGeometry(reading, proposedRL).area,
      );

      let totalVolume = 0;
      for (let i = 0; i < bottomWidthSections.length - 1; i++) {
        const distance =
          bottomWidthSections[i + 1].chainage - bottomWidthSections[i].chainage;
        totalVolume += distance * ((areas[i] + areas[i + 1]) / 2);
      }

      return totalVolume;
    };

    const solveBottomWidthProposedRL = () => {
      const allLevels = bottomWidthSections.flatMap(({ reading }) =>
        getGroundPoints(reading).map((point) => point.rl),
      );

      if (!allLevels.length) return Number(proposedLevel || 0);

      let hi = Math.max(...allLevels);
      let lo = Math.min(...allLevels) - 1;

      while (calculateBottomWidthVolume(lo) < numericQuantity) {
        lo -= Math.max(1, hi - lo);
      }

      let bestRL = (lo + hi) / 2;
      const tolerance = 0.01;
      const maxIterations = 120;

      for (let i = 0; i < maxIterations; i++) {
        bestRL = (lo + hi) / 2;
        const volume = calculateBottomWidthVolume(bestRL);

        if (Math.abs(volume - numericQuantity) <= tolerance) break;

        if (volume < numericQuantity) {
          hi = bestRL;
        } else {
          lo = bestRL;
        }
      }

      return bestRL;
    };

    const bottomWidthProposedRL =
      proposalMethod === "Bottom Width Fixed"
        ? solveBottomWidthProposedRL()
        : null;

    const numericStartRL = Number(startRL || 0);
    const numericEndRL = Number(endRL || 0);

    const slopeEndToEndBedLevels = proposalMethod === "Slope End-to-End Type"
      ? (() => {
          const sorted = [...readingsToCreate]
            .map((r) => ({ reading: r, chainage: parseChainage(r.chainage) }))
            .sort((a, b) => a.chainage - b.chainage);

          const firstCh = sorted[0]?.chainage ?? 0;
          const lastCh = sorted.at(-1)?.chainage ?? 0;
          const totalLength = lastCh - firstCh || 1;

          const map = new Map();
          for (const { reading, chainage } of sorted) {
            const bedLevel =
              numericStartRL +
              ((chainage - firstCh) / totalLength) * (numericEndRL - numericStartRL);
            map.set(reading._id.toString(), bedLevel);
          }
          return map;
        })()
      : null;

    const [purposeDoc] = await SurveyPurpose.create(
      [
        {
          surveyId: id,
          type: proposal,
          phase: "Proposal",
          createdBy: userId,
          relation: basePurpose._id,
          status: "Finished",
          isPurposeFinish: true,
          purposeFinishDate: new Date(),
          pls: basePurpose?.pls,
          length: length || "All",
          quantity,
          proposalMethod,
          proposedLevel,
          bottomWidth,
          startRL,
          endRL,
          slope,
          buffer,
          bufferDirection: bufferDirection || "below",
          width:
            proposalMethod === "Bottom Width Fixed"
              ? Number(bottomWidth)
              : undefined,
        },
      ],
      { session },
    );

    const bulkOps = readingsToCreate.map((reading) => {
      const bottomWidthData =
        proposalMethod === "Bottom Width Fixed"
          ? buildBottomWidthOffsets(reading, bottomWidthProposedRL)
          : null;
      const intermediateOffsets =
        bottomWidthData?.offsets ||
        (reading.intermediateOffsets || []).map((entry) => ({
          is: "",
          offset: String(entry.offset),
          remark: entry.remark || "",
          mode: entry.mode || "S",
        }));
      const initialLevels = bottomWidthData?.initialLevels || reading.reducedLevels || [];
      const centerLevel = getCenterLevel(reading);

      let fixedRL = Number(proposedLevel);

      if (proposalMethod === "Bottom Width Fixed") {
        fixedRL = bottomWidthProposedRL || centerLevel;
      }

      const reducedLevels =
        proposalMethod === "Slope End-to-End Type"
          ? (() => {
              const bedLevel = slopeEndToEndBedLevels?.get(reading._id.toString()) ?? 0;
              return intermediateOffsets.map(() => bedLevel.toFixed(3));
            })()
          : proposalMethod === "With Respect to Buffer"
          ? (() => {
              const proposedBedLevel = centerLevel + bufferSign * numericBuffer;
              return intermediateOffsets.map(() => proposedBedLevel.toFixed(3));
            })()
          : bottomWidthData?.proposedLevels ||
            intermediateOffsets.map(() => Number(fixedRL || 0).toFixed(3));

      return {
        insertOne: {
          document: {
            surveyId: id,
            createdBy: userId,
            purposeId: purposeDoc._id,
            type: "Chainage",
            chainage: reading.chainage,
            spacing: reading.spacing,
            roadWidth:
              proposalMethod === "Bottom Width Fixed"
                ? String(bottomWidth)
                : reading.roadWidth,
            reducedLevels,
            intermediateOffsets,
            heightOfInstrument: reading.heightOfInstrument,
            interpolatedReducedLevels:
              proposalMethod === "Bottom Width Fixed" ? initialLevels : [],
            remark: reading.remark,
          },
        },
      };
    });

    await SurveyRow.bulkWrite(bulkOps, { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: `Water Way proposal "${proposal}" generated successfully.`,
      purpose: purposeDoc,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

const editSurveyPurpose = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      params: { id, purposeId },
      body: { updatedRows },
    } = req;

    const survey = await Survey.findById(id)
      .populate("purposes")
      .session(session);
    if (!survey) throw Error("Survey not found");

    // 1. get full list of rows in correct order
    const rows = await SurveyRow.find({ purposeId })
      .sort({ createdAt: 1 })
      .session(session);

    const persistedRowFields = [
      "chainage",
      "reducedLevels",
      "heightOfInstrument",
      "backSight",
      "foreSight",
      "intermediateSight",
      "intermediateOffsets",
      "remark",
    ];
    const getPersistedRowState = (row) =>
      persistedRowFields.reduce((state, field) => {
        state[field] = row[field];
        return state;
      }, {});
    const originalRowStates = rows.map((row) =>
      JSON.stringify(getPersistedRowState(row)),
    );

    // validate payload
    if (!Array.isArray(updatedRows) || !updatedRows.length)
      throw new Error("No updated rows provided");

    // collect changed indices and validate
    const changedIndices = updatedRows.map((u) => Number(u.index));
    const invalidIndex = changedIndices.find(
      (idx) => idx < 0 || idx >= rows.length,
    );
    if (invalidIndex !== undefined)
      throw new Error("One or more updated row indices are invalid");

    // apply all user edits in-memory to their respective rows
    updatedRows.forEach((u) => {
      const idx = Number(u.index);
      const changes = u.data || {};
      Object.assign(rows[idx], changes);
    });

    // determine recalculation starting point (earliest changed index)
    const changedIndex = Math.min(...changedIndices);

    // 4. get starting RL from (possibly updated) rows
    const startRl = rows.find((r) => r.type === "Instrument setup")
      ?.reducedLevels?.[0];

    if (!startRl) throw Error("Something went wrong!");

    // 5. sync survey reducedLevel if mismatched
    if (Number(survey.reducedLevel) !== Number(startRl)) {
      if (survey.purposes.length > 1)
        throw new Error(
          "Cannot update the survey reduced level because this survey has multiple purposes. " +
            "Reduced level can only be updated when the survey has a single purpose.",
        );

      survey.reducedLevel = Number(startRl);
      await survey.save({ session });
    }

    let hi = 0;
    let rl = Number(startRl);
    let lastWaterLevelRL = null;

    for (let i = 0; i < changedIndex; i++) {
      const row = rows[i];

      switch (row.type) {
        case "Instrument setup":
          rl = Number(row.reducedLevels?.[0] ?? startRl);
          hi = rl + Number(row.backSight || 0);
          break;

        case "Water Level": {
          const waterLevelRl = (row.intermediateSight || []).map((is) =>
            (hi - Number(is || 0)).toFixed(3),
          );
          if (waterLevelRl.length) {
            rl = Number(waterLevelRl.at(-1));
            lastWaterLevelRL = rl;
          }
          break;
        }

        case "TBM": {
          const tbmRl = (row.intermediateSight || []).map((is) =>
            (hi - Number(is || 0)).toFixed(3),
          );
          if (tbmRl.length) rl = Number(tbmRl.at(-1));
          break;
        }

        case "Chainage": {
          const chainageRl = (row.intermediateOffsets || []).map((entry) =>
            entry.mode === "S" && lastWaterLevelRL !== null
              ? (lastWaterLevelRL - Number(entry.is || 0)).toFixed(3)
              : (hi - Number(entry.is || 0)).toFixed(3),
          );
          if (chainageRl.length) rl = Number(chainageRl.at(-1));
          break;
        }

        case "CP":
          rl = hi - Number(row.foreSight || 0);
          hi = rl + Number(row.backSight || 0);
          break;
      }
    }

    // 6. Recalculate all rows beginning from changedIndex
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
          // Recalculate top-level reducedLevels array
          row.reducedLevels = (row.intermediateOffsets || []).map((entry) => {
            if (entry.mode === "S" && lastWaterLevelRL !== null) {
              return (lastWaterLevelRL - Number(entry.is || 0)).toFixed(3);
            }

            return (hi - Number(entry.is || 0)).toFixed(3);
          });
          break;

        case "TBM":
        case "Water Level":
          row.reducedLevels = (row.intermediateSight || []).map((is) =>
            (hi - Number(is)).toFixed(3),
          );
          if (row.type === "Water Level" && row.reducedLevels.length) {
            lastWaterLevelRL = Number(row.reducedLevels.at(-1));
          }
          break;

        case "CP":
          rl = hi - Number(row.foreSight);
          hi = rl + Number(row.backSight);
          row.reducedLevels = [rl.toFixed(3)];
          row.heightOfInstrument = hi.toFixed(3);
          break;
      }
    }

    // 7. Recalculation still covers the dependency range, but only rows whose
    // persisted state actually changed are written back to MongoDB.
    const ops = rows.slice(changedIndex).flatMap((row, offset) => {
      const rowIndex = changedIndex + offset;
      const persistedState = getPersistedRowState(row);

      if (JSON.stringify(persistedState) === originalRowStates[rowIndex]) {
        return [];
      }

      return [
        {
          updateOne: {
            filter: { _id: row._id },
            update: {
              $set: persistedState,
            },
          },
        },
      ];
    });

    if (ops.length) {
      await SurveyRow.bulkWrite(ops, { session });
    }

    await session.commitTransaction();
    session.endSession();

    return res.json({
      success: true,
      updated: ops.length,
      message: "Rows recalculated and updated",
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
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
      }).select("_id reducedLevels intermediateSight intermediateOffsets"),
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

      const isChainage = (existingRow.intermediateOffsets || []).length > 0;

      const oldRL = existingRow.reducedLevels || [];
      const oldIS = isChainage
        ? (existingRow.intermediateOffsets || []).map((e) => e.is)
        : existingRow.intermediateSight || [];

      const hasIS = oldIS.length > 0;

      if (oldRL.length !== s.data.length) {
        throw createHttpError(400, "Reduced levels length mismatch");
      }

      if (hasIS && oldIS.length !== s.data.length) {
        throw createHttpError(400, "Intermediate sight length mismatch");
      }

      const newReducedLevels = [];
      const newIntermediateSight = [];
      let hasReducedLevelChanges = false;

      for (let i = 0; i < s.data.length; i++) {
        const newValue = s.data[i]?.y;

        if (newValue === "" || newValue === null || newValue === undefined) {
          throw createHttpError(400, "Reduced level cannot be empty");
        }

        const newRLNum = Number(newValue);
        const oldRLNum = Number(oldRL[i]);

        if (Number.isNaN(newRLNum) || Number.isNaN(oldRLNum)) {
          throw createHttpError(400, "Reduced level must be a valid number");
        }

        const delta = newRLNum - oldRLNum;
        if (delta !== 0) hasReducedLevelChanges = true;
        newReducedLevels.push(newRLNum.toFixed(3));

        if (hasIS) {
          const oldISNum = Number(oldIS[i]);
          if (Number.isNaN(oldISNum)) {
            throw createHttpError(
              400,
              "Intermediate sight must be a valid number",
            );
          }
          // RL = HI - IS, so an RL increase requires an equal IS decrease.
          newIntermediateSight.push((oldISNum - delta).toFixed(3));
        }
      }

      if (!hasReducedLevelChanges) continue;

      if (isChainage) {
        // Update is inside each intermediateOffsets entry, but save reducedLevels top-level
        const updatedOffsets = (existingRow.intermediateOffsets || []).map(
          (entry, i) => ({
            ...(entry.toObject ? entry.toObject() : entry),
            ...(hasIS ? { is: newIntermediateSight[i] ?? entry.is } : {}),
          }),
        );
        bulkOps.push({
          updateOne: {
            filter: { _id: s._id, deleted: false },
            update: {
              $set: {
                reducedLevels: newReducedLevels,
                intermediateOffsets: updatedOffsets,
              },
            },
          },
        });
      } else {
        bulkOps.push({
          updateOne: {
            filter: { _id: s._id, deleted: false },
            update: {
              $set: {
                reducedLevels: newReducedLevels,
                ...(hasIS && { intermediateSight: newIntermediateSight }),
              },
            },
          },
        });
      }
    }

    // 6️⃣ Execute bulk update
    if (bulkOps.length) {
      await SurveyRow.bulkWrite(bulkOps, { ordered: true });
    }

    res.status(200).json({
      success: true,
      updated: bulkOps.length,
      message: "Reduced levels and intermediate sights updated successfully",
    });
  } catch (err) {
    next(err);
  }
};

const createBranch = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      user: { userId },
      params: { surveyId },
      body: { name, foreSight, purposeId },
    } = req;

    if (!surveyId || !name?.trim()) {
      throw createHttpError(400, "Missing required fields");
    }

    if (foreSight && Number.isNaN(foreSight)) {
      throw createHttpError(400, "Foresight must be a valid number");
    }

    const parentSurvey = await Survey.findOne({
      _id: surveyId,
      deleted: false,
      status: "Active",
    });
    if (!parentSurvey) {
      throw createHttpError(404, "Parent survey not found");
    }

    const lastChainageReading = await SurveyRow.findOne({
      purposeId,
      type: { $in: ["Chainage", "Water Level"] },
      deleted: false,
    }).sort({ createdAt: -1, _id: -1 });

    const lastReading = await SurveyRow.findOne({
      purposeId,
      deleted: false,
    }).sort({ createdAt: -1, _id: -1 });

    const lastCpReading = await SurveyRow.findOne({
      purposeId,
      type: "CP",
      deleted: false,
    }).sort({ createdAt: -1, _id: -1 });

    let reducedLevel = 0;

    if (lastCpReading) {
      reducedLevel = lastCpReading?.reducedLevels[0];
    } else {
      reducedLevel = parentSurvey.reducedLevel;
    }

    const rootBranch = parentSurvey.branchDetails?.rootBranch;
    const chainage =
      lastChainageReading?.chainage || `0${parentSurvey.separator || "/"}000`;

    // 🔹 Create Survey
    const survey = await Survey.create(
      [
        {
          project: name,
          createdBy: userId,
          instrumentNo: parentSurvey.instrumentNo,
          chainageMultiple: parentSurvey.chainageMultiple,
          separator: parentSurvey.separator,
          reducedLevel: Number(reducedLevel).toFixed(3),
          agreementNo: parentSurvey.agreementNo,
          contractor: parentSurvey.contractor,
          department: parentSurvey.department,
          division: parentSurvey.division,
          subDivision: parentSurvey.subDivision,
          section: parentSurvey.section,
          consultant: parentSurvey.consultant,
          client: parentSurvey.client,
          branchDetails: {
            isBranch: true,
            rootBranch: rootBranch || parentSurvey._id,
            parentBranch: parentSurvey._id,
          },
        },
      ],
      { session },
    );

    const surveyDoc = survey[0];

    if (rootBranch) {
      await Survey.updateOne(
        { _id: rootBranch },
        { $set: { "branchDetails.currentBranch": surveyDoc._id } },
        { session },
      );
    } else {
      parentSurvey.branchDetails.currentBranch = surveyDoc._id;
    }

    parentSurvey.branchDetails.hasBranching = true;
    parentSurvey.branchDetails.branchStartedFrom = chainage;
    parentSurvey.branchDetails.isBranchStart = true;
    await parentSurvey.save({ session });

    const newBranch = await Branch.create(
      [
        {
          name,
          surveyId: surveyDoc._id,
          createdBy: userId,
          branchStartedFrom: chainage,
          rootBranch: rootBranch || parentSurvey._id,
          parentBranch: parentSurvey._id,
          isBranchStart: true,
        },
      ],
      { session },
    );

    const newBranchDoc = newBranch[0];

    lastReading.upcomingBranches.push(newBranchDoc._id);
    await lastReading.save({ session });

    await Branch.updateOne(
      {
        _id: parentSurvey._id,
      },
      {
        $set: {
          hasBranching: true,
        },
      },
      { session },
    );

    // 🔹 Create Purpose
    const purposeDoc = await SurveyPurpose.create(
      [
        {
          surveyId: surveyDoc._id,
          createdBy: userId,
          type: "Initial Level",
          isSurveyFinish: false,
          status: foreSight ? "Paused" : "Active",
        },
      ],
      { session },
    );

    const purposeObj = purposeDoc[0];

    // 🔹 Create First Row (TBM)
    // await SurveyRow.create(
    //   [
    //     {
    //       surveyId: surveyDoc._id,
    //       purposeId: purposeObj._id,
    //       createdBy: userId,
    //       type: "Instrument setup",
    //       backSight: Number(backSight).toFixed(3),
    //       remarks: ["TBM"],
    //       reducedLevels: [Number(reducedLevel).toFixed(3)],
    //       heightOfInstrument: Number(
    //         Number(reducedLevel) + Number(backSight),
    //       ).toFixed(3),
    //     },
    //   ],
    //   { session },
    // );

    if (foreSight) {
      // 🔹 Create First Row (CP)
      await SurveyRow.create(
        [
          {
            type: "CP",
            foreSight,
            remark: "",
            createdBy: userId,
            purposeId: purposeObj._id,
          },
        ],
        { session },
      );
    }

    // 🔹 Optionally create a History log
    await History.create(
      [
        {
          entityType: "Branch",
          entityId: surveyDoc._id,
          action: "Create",
          notes: "Branch created with purpose Initial Level",
          performedBy: userId,
        },
      ],
      { session },
    );

    // ✅ Commit transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Branch created successfully",
      purposeId: purposeObj._id,
    });
  } catch (err) {
    // ❌ Rollback if anything fails
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

const enterBranch = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      user: { userId },
      params: { surveyId },
      body: {
        branchId,
        purposeId,
        phase,
        proposedLevel,
        reducedLevel,
        backSight,
        crossSectionType,
        crossSectionCamper,
        crossSectionSlop,
      },
    } = req;

    const isProposal = phase === "Proposal";

    if (!branchId) {
      throw Error("Branch id is required");
    }

    if (!purposeId) {
      throw Error("Purpose id is required");
    }

    if (isProposal) {
      if (proposedLevel === "" || proposedLevel === undefined) {
        throw Error("Proposed level is required");
      } else if (isNaN(Number(proposedLevel))) {
        throw Error("Proposed level must be a number");
      }

      if (!["Camper", "Slop"].includes(crossSectionType)) {
        throw Error("Invalid cross section type");
      }

      if (crossSectionType === "Camper" && !crossSectionCamper) {
        throw Error("Camper value is required");
      }

      if (crossSectionType === "Slop" && !crossSectionSlop) {
        throw Error("Slop value is required");
      }
    } else {
      /* ---------------- non-proposal phase ---------------- */
      if (reducedLevel === "" || reducedLevel === undefined) {
        throw Error("Reduced level is required");
      } else if (isNaN(Number(reducedLevel))) {
        throw Error("Reduced level must be a number");
      }

      if (backSight === "" || backSight === undefined) {
        throw Error("Back sight is required");
      } else if (isNaN(Number(backSight))) {
        throw Error("Back sight must be a number");
      }
    }

    const parentSurvey = await Survey.findOne({
      _id: surveyId,
      deleted: false,
      status: "Active",
    });
    if (!parentSurvey) throw Error("Parent survey not found");

    const survey = await Survey.findOne({
      _id: branchId,
      deleted: false,
      status: "Active",
    });
    if (!survey) throw Error("Survey not found");

    const purpose = await SurveyPurpose.findOne({
      _id: purposeId,
      deleted: false,
      status: "Active",
    });
    if (!purpose) throw Error("Purpose not found");

    const rootBranch = parentSurvey.branchDetails?.rootBranch;

    const [purposeDoc] = await SurveyPurpose.create(
      [
        {
          surveyId: branchId,
          type: purpose.type,
          createdBy: userId,
          phase: isProposal ? "Proposal" : "Actual",
          ...(isProposal && {
            proposedLevel,
            csCamper: crossSectionCamper,
            csSlop: crossSectionSlop,
          }),
        },
      ],
      { session },
    );

    if (!isProposal) {
      // 🔹 Create First Reading (TBM)
      await SurveyRow.create(
        [
          {
            surveyId: branchId,
            purposeId: purposeDoc._id,
            createdBy: userId,
            type: "Instrument setup",
            backSight: Number(backSight).toFixed(3),
            remark: "TBM - 1",
            reducedLevels: [Number(reducedLevel).toFixed(3)],
            heightOfInstrument: Number(
              Number(reducedLevel) + Number(backSight),
            ).toFixed(3),
          },
        ],
        { session },
      );
    }

    if (rootBranch) {
      await Survey.updateOne(
        { _id: rootBranch },
        { $set: { "branchDetails.currentBranch": survey._id } },
        { session },
      );
    } else {
      parentSurvey.branchDetails.currentBranch = survey._id;
    }

    parentSurvey.branchDetails.hasBranching = true;
    parentSurvey.branchDetails.isBranchStart = true;

    await parentSurvey.save({ session });

    // ✅ Commit transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Branch created successfully",
      purposeId: purposeDoc._id,
    });
  } catch (err) {
    // ❌ Rollback if anything fails
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

const createBreak = async (req, res, next) => {
  try {
    const {
      params: { id },
      user: { userId },
      body: { from, to, remark },
    } = req;

    // 🔹 Validate purpose
    if (!id) throw createHttpError(400, "Purpose ID is required");

    const purpose = await SurveyPurpose.findOne({
      _id: id,
      deleted: false,
    }).populate({
      path: "surveyId",
      match: { deleted: false },
    });

    if (!from || !to || !remark)
      throw createHttpError(409, "Missing required fields");

    if (!purpose) throw createHttpError(404, "Purpose not found");
    if (purpose.isPurposeFinish)
      throw createHttpError(409, `${purpose.type} already completed`);

    const survey = purpose.surveyId;
    if (survey.isSurveyFinish)
      throw createHttpError(409, "Survey is already finished");
    if (!survey || survey.deleted)
      throw createHttpError(404, "Survey not found or has been deleted");

    const isChainageExist = await SurveyRow.findOne({
      purposeId: id,
      $or: [{ chainage: from?.trim() }, { chainage: to?.trim() }],
      deleted: false,
    });

    if (isChainageExist) throw createHttpError(409, "Chainage already exist");

    const newRow = await SurveyRow.create({
      type: "Break",
      purposeId: purpose._id,
      createdBy: userId,
      remarks: [remark],
      from,
      to,
    });

    res.status(201).json({
      success: true,
      message: "Break added successfully",
      row: newRow,
    });
  } catch (err) {
    next(err);
  }
};

const deleteSurveyPurpose = async (req, res, next) => {
  try {
    const {
      params: { purposeId },
    } = req;

    const purpose = await SurveyPurpose.findOne({
      _id: purposeId,
      deleted: false,
    });

    if (!purpose) throw createHttpError(404, "Purpose not found");
    if (purpose.type === "Initial Level")
      throw createHttpError(409, `You cannot delete the Initial Level`);

    purpose.deleted = true;
    await purpose.save();

    res.status(200).json({
      success: true,
      message: "Survey purpose deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

export {
  checkSurveyExists,
  getAllSurvey,
  createSurvey,
  queueSurvey,
  completeSurvey,
  getSurveyPurpose,
  getFieldBook,
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
  generateWaterWayProposalPurpose,
  editSurveyPurpose,
  updateReducedLevels,
  createBranch,
  enterBranch,
  createBreak,
  deleteSurveyPurpose,
};
