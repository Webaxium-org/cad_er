import isValidObjectId from '../helper/index.js';
import Survey from '../models/survey.js';
import SurveyPurpose from '../models/surveyPurpose.js';
import SurveyRow from '../models/surveyRowSchema.js';
import History from '../models/historySchema.js';
import createHttpError from 'http-errors';
import mongoose from 'mongoose';

const checkSurveyExists = async (req, res, next) => {
  try {
    const survey = await Survey.findOne({ isSurveyFinish: false });

    res.status(200).json({
      success: true,
      message: `${survey ? 'Active survey found' : 'No active survey found'}`,
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
    if (status === 'active') filter.isSurveyFinish = false;
    else if (status === 'finished') filter.isSurveyFinish = true;

    if (project) filter.project = project;
    if (type) filter.type = type;

    const surveys = await Survey.find(filter)
      .sort({ createdAt: -1 })
      .populate('purposes')
      // .populate('createdBy', 'name email')
      .lean();

    res.status(200).json({
      success: true,
      count: surveys.length,
      message:
        surveys.length > 0
          ? `${surveys.length} survey${surveys.length > 1 ? 's' : ''} found`
          : 'No surveys found',
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
      project,
      purpose,
      instrumentNo,
      reducedLevel,
      backSight,
      chainageMultiple,
    } = req.body;

    // 🔹 Input validation
    if (
      !project ||
      !purpose ||
      !instrumentNo ||
      !reducedLevel ||
      !backSight ||
      !chainageMultiple
    ) {
      throw createHttpError(
        400,
        'All fields (project, purpose, instrumentNo, reducedLevel, backSight, chainageMultiple) are required'
      );
    }

    // 🔹 Check for active survey
    const existingSurvey = await Survey.findOne(
      { isSurveyFinish: false, deleted: false },
      null,
      { session }
    );

    if (existingSurvey) {
      throw createHttpError(409, 'A survey is already in progress');
    }

    // 🔹 Create Survey
    const survey = await Survey.create(
      [
        {
          project,
          instrumentNo,
          chainageMultiple,
          reducedLevel: Number(reducedLevel).toFixed(3),
          createdBy: req.user?._id,
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
          type: 'Instrument setup',
          backSight: Number(backSight).toFixed(3),
          remarks: ['TBM'],
        },
      ],
      { session }
    );

    // 🔹 Optionally create a History log
    await History.create(
      [
        {
          entityType: 'Survey',
          entityId: surveyDoc._id,
          action: 'Create',
          notes: `Survey created with purpose ${purpose}`,
          performedBy: req.user?._id,
        },
      ],
      { session }
    );

    // ✅ Commit transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'Survey created successfully',
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
        message: 'Invalid survey ID',
      });
    }

    // Find active (non-deleted) survey
    const survey = await Survey.findOne({ _id: id, deleted: false })
      .populate({
        path: 'purposes',
        match: { deleted: false },
        populate: { path: 'rows', match: { deleted: false } },
      })
      .lean();

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found or has been deleted',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Survey retrieved successfully',
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
      body: {
        type,
        backSight,
        intermediateSight,
        foreSight,
        chainage,
        roadWidth,
        spacing,
        offsets,
      },
    } = req;

    // 🔹 Validate purpose
    if (!id) throw createHttpError(400, 'Purpose ID is required');
    const purpose = await SurveyPurpose.findOne({
      _id: id,
      deleted: false,
    })
      .populate('surveyId')
      .session(session);

    if (!purpose) throw createHttpError(404, 'Purpose not found');
    if (purpose.isPurposeFinish)
      throw createHttpError(409, `${purpose.type} already completed`);

    const survey = purpose.surveyId;
    if (survey.isSurveyFinish)
      throw createHttpError(409, 'Survey is already finished');
    if (!survey || survey.deleted)
      throw createHttpError(404, 'Survey not found or has been deleted');

    // 🔹 Validate type and required fields (same as before)
    const types = {
      Chainage: [
        'chainage',
        'roadWidth',
        'spacing',
        'intermediateSight',
        'offsets',
      ],
      CP: ['foreSight', 'backSight'],
      TBM: ['intermediateSight'],
    };

    if (!type || !Object.keys(types).includes(type))
      throw createHttpError(400, `Invalid or missing row type: ${type}`);

    const missing = types[type].filter(
      (f) => !req.body[f] || (Array.isArray(req.body[f]) && !req.body[f].length)
    );
    if (missing.length)
      throw createHttpError(
        400,
        `Missing required fields: ${missing.join(', ')}`
      );

    // 🔹 Remarks logic
    const remarks = [];
    if (type === 'Chainage') {
      (offsets || []).forEach((offset) => {
        const n = Number(offset);
        if (n < 0) remarks.push('LHS');
        else if (n === 0) remarks.push('PLS');
        else remarks.push('RHS');
      });
    } else {
      remarks.push(type);
    }

    // 🔹 Create new SurveyRow
    const [newRow] = await SurveyRow.create(
      [
        {
          purposeId: purpose._id,
          type,
          chainage,
          spacing,
          roadWidth: roadWidth ? Number(roadWidth).toFixed(3) : undefined,
          backSight: backSight ? Number(backSight).toFixed(3) : undefined,
          foreSight: foreSight ? Number(foreSight).toFixed(3) : undefined,
          intermediateSight:
            type === 'Chainage'
              ? (intermediateSight || []).map((n) => Number(n).toFixed(3))
              : intermediateSight || [],
          offsets: (offsets || []).map((n) => Number(n).toFixed(3)),
          remarks,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'Survey row added successfully',
      row: newRow,
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
        message: 'Invalid purpose ID',
      });
    }

    // 🔹 Find the specific survey purpose with related data
    const purpose = await SurveyPurpose.findOne({ _id: id, deleted: false })
      .populate({
        path: 'surveyId',
        match: { deleted: false },
        populate: {
          path: 'purposes',
          match: { deleted: false },
          populate: {
            path: 'rows',
            match: { deleted: false },
          },
        },
      })
      .populate({
        path: 'rows',
        match: { deleted: false },
      })
      .lean();

    if (!purpose) {
      return res.status(404).json({
        success: false,
        message: 'Survey purpose not found or has been deleted',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Survey purpose retrieved successfully',
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
      body: { purpose, slope, estimateQuality },
    } = req;

    // 🔹 Validate required fields
    if (!purpose || !surveyId) {
      throw createHttpError(400, 'Purpose and surveyId are required');
    }

    if (purpose === 'Proposed Level' && (!slope || !estimateQuality)) {
      throw createHttpError(
        400,
        'Slope and Estimate Quality are required for Proposed Level'
      );
    }

    // 🔹 Find active survey
    const survey = await Survey.findOne({
      _id: surveyId,
      isSurveyFinish: false,
      deleted: false,
    })
      .populate({
        path: 'purposes',
        match: { deleted: false },
        populate: { path: 'rows', match: { deleted: false } },
      })
      .lean()
      .session(session);

    if (!survey) {
      throw createHttpError(404, 'Active survey not found');
    }

    const isPurposeExist = survey?.purposes?.find((p) => p.type === purpose);
    if (isPurposeExist) throw createHttpError(409, 'The purpose already exist');

    // 🔹 Create purpose document
    const [purposeDoc] = await SurveyPurpose.create(
      [
        {
          surveyId: survey._id,
          type: purpose,
          ...(purpose === 'Proposed Level' && { slope, estimateQuality }),
        },
      ],
      { session }
    );

    // 🔹 Commit transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'Survey purpose created successfully',
      survey: {
        ...survey,
        purposeId: purposeDoc._id,
        purposes: [...survey.purposes, purposeDoc],
      },
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

const getAllSurveyPurpose = async (req, res, next) => {
  try {
    const purposes = await SurveyPurpose.find({ deleted: false })
      .populate({
        path: 'surveyId',
        match: { deleted: false },
      })
      .populate({
        path: 'rows',
        match: { deleted: false },
      })
      .populate({
        path: 'history',
      })
      .sort({ createdAt: -1 })
      .lean();

    if (!purposes || purposes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No survey purposes found',
      });
    }

    res.status(200).json({
      success: true,
      count: purposes.length,
      message: `${purposes.length} survey purpose${
        purposes.length > 1 ? 's' : ''
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
    const { id } = req.params;

    // 🔹 Step 1: Find the purpose
    const purpose = await SurveyPurpose.findById(id).session(session);
    if (!purpose || purpose.deleted)
      throw createHttpError(404, 'Survey purpose not found');

    // 🔹 Step 2: Check if already finished
    if (purpose.isPurposeFinish)
      throw createHttpError(400, 'Purpose is already finished');

    // 🔹 Step 3: Ensure its parent survey exists and is active
    const survey = await Survey.findById(purpose.surveyId).session(session);
    if (!survey || survey.deleted)
      throw createHttpError(404, 'Parent survey not found');
    if (survey.isSurveyFinish)
      throw createHttpError(
        400,
        'Cannot finish purpose — survey already finished'
      );

    // 🔹 Step 4: Mark purpose as finished
    purpose.isPurposeFinish = true;
    purpose.purposeFinishDate = new Date();
    await purpose.save({ session });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Purpose ended successfully',
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
      throw createHttpError(404, 'Survey not found');
    if (survey.isSurveyFinish)
      throw createHttpError(400, 'Survey already finished');

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
      message: 'Survey ended successfully',
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
  } catch (err) {
    next(err);
  }
};
const deleteSurveyRow = async (req, res, next) => {
  try {
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
};
