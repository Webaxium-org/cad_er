import Survey from '../models/survey.js';
import SurveyPurpose from '../models/surveyPurpose.js';
import SurveyRow from '../models/surveyRowSchema.js';
import History from '../models/historySchema.js';
import { isValidObjectId, calculateReducedLevel } from '../helper/index.js';
import createHttpError from 'http-errors';
import mongoose from 'mongoose';

const checkSurveyExists = async (req, res, next) => {
  try {
    const survey = await Survey.findOne({ isSurveyFinish: false });
    console.log('haii');
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
        reducedLevels,
      },
    } = req;

    // 🔹 Validate purpose
    if (!id) throw createHttpError(400, 'Purpose ID is required');

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
      .session(session);

    if (!purpose) throw createHttpError(404, 'Purpose not found');
    if (purpose.isPurposeFinish)
      throw createHttpError(409, `${purpose.type} already completed`);

    const survey = purpose.surveyId;
    if (survey.isSurveyFinish)
      throw createHttpError(409, 'Survey is already finished');
    if (!survey || survey.deleted)
      throw createHttpError(404, 'Survey not found or has been deleted');

    const isProposal = purpose.phase === 'Proposal';
    const isSurveyPaused = purpose.status === 'Paused';
    let isLastReading = false;

    // 🔹 Validate type and required fields (same as before)
    const types = {
      Chainage: ['chainage', 'roadWidth', 'spacing', 'offsets'],
      CP: ['foreSight', 'backSight'],
      TBM: ['intermediateSight'],
    };

    types['Chainage'].push(isProposal ? 'reducedLevels' : 'intermediateSight');

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

    const initialSurvey = survey.purposes?.find(
      (p) => p.type === 'Initial Level'
    );

    if (isProposal) {
      const filteredInitialSurvey =
        initialSurvey?.rows?.filter((entry) => entry.type === 'Chainage') || [];

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
    } else {
      const totalReadings = initialSurvey?.rows?.length;
      const currentIndex = purpose.rows?.length;

      if (totalReadings === currentIndex + 1) {
        isLastReading = true;
      }
    }

    const newReading = {
      purposeId: purpose._id,
      type,
      chainage: type === 'Chainage' ? chainage : undefined,
      spacing: type === 'Chainage' ? spacing : undefined,
      roadWidth: roadWidth ? Number(roadWidth).toFixed(3) : undefined,

      backSight: backSight ? Number(backSight).toFixed(3) : undefined,
      foreSight: foreSight ? Number(foreSight).toFixed(3) : undefined,

      reducedLevels: isProposal
        ? (reducedLevels || []).map((n) => Number(n).toFixed(3))
        : [],

      intermediateSight:
        type === 'Chainage'
          ? (intermediateSight || []).map((n) => Number(n).toFixed(3))
          : intermediateSight || [],

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

      if (lastRow.type !== 'CP') {
        throw createHttpError(
          400,
          'Invalid state: last row must be CP when resuming a paused survey.'
        );
      }

      newRow = await SurveyRow.findByIdAndUpdate(
        lastRow._id,
        {
          backSight: backSight ? Number(backSight).toFixed(3) : undefined,
          foreSight: foreSight ? Number(foreSight).toFixed(3) : undefined,
          reducedLevels: newReading.reducedLevels,
          heightOfInstrument: newReading.heightOfInstrument,
        },
        { new: true, session }
      );

      if (!newRow) {
        throw createHttpError(
          500,
          'Failed to update CP row while resuming survey.'
        );
      }

      purpose.status = 'Active';
      await purpose.save({ session });
    } else {
      // Create new row
      const rows = await SurveyRow.create([newReading], { session });
      newRow = rows[0];
    }

    if (isLastReading) {
      purpose.status = 'Finished';
      purpose.isPurposeFinish = true;
      purpose.purposeFinishDate = new Date();

      await purpose.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    const plainPurpose = purpose.toObject();

    res.status(201).json({
      success: true,
      message: 'Survey row added successfully',
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
      body: {
        purpose,
        proposal,
        proposedLevel,
        averageHeight,
        lSection,
        lsSlop,
        cSection,
        csSlop,
        csCamper,
      },
    } = req;

    // 🔹 Basic validation
    if (!purpose || !surveyId) {
      throw createHttpError(400, 'Purpose and surveyId are required');
    }

    // 🔹 Proposal field validation (if proposal mode)
    if (proposal) {
      const requiredFields = [proposedLevel, averageHeight, lSection, lsSlop];

      // Check if any of the always-required fields are missing
      const missingRequired = requiredFields.some(
        (field) => field === undefined || field === null || field === ''
      );

      if (missingRequired) {
        throw createHttpError(400, 'Missing required fields for proposal');
      }

      // Conditional validation for cross-section inputs
      const hasCsPair =
        cSection !== undefined &&
        cSection !== null &&
        cSection !== '' &&
        csSlop !== undefined &&
        csSlop !== null &&
        csSlop !== '';

      const hasCsCamper =
        csCamper !== undefined && csCamper !== null && csCamper !== '';

      if (!hasCsPair && !hasCsCamper) {
        throw createHttpError(
          400,
          'Please provide either (Cross section slop) or Cross section camper'
        );
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
        path: 'purposes',
        match: { deleted: false },
        populate: [
          { path: 'rows', match: { deleted: false } },
          { path: 'relation', match: { deleted: false } },
        ],
      })
      .session(session);

    if (!survey) {
      throw createHttpError(404, 'Active survey not found');
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
          phase: proposal ? 'Proposal' : 'Actual',
          ...(proposal && {
            proposedLevel,
            averageHeight,
            lSection,
            lsSlop,
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
      const initialLevel = survey?.purposes?.find(
        (p) => p.type === 'Initial Level'
      );

      if (!initialLevel) throw createHttpError(404, 'Initial level not found');

      const tbmReading = initialLevel.rows[0];

      if (!tbmReading)
        throw createHttpError(404, 'Initial level reading not found');

      // 🔹 Create First Reading (TBM)
      await SurveyRow.create(
        [
          {
            surveyId: survey._id,
            purposeId: purposeDoc._id,
            type: 'Instrument setup',
            backSight: tbmReading.backSight,
            reducedLevels: tbmReading.reducedLevels,
            heightOfInstrument: tbmReading.heightOfInstrument,
            remarks: ['TBM'],
          },
        ],
        { session }
      );
    }

    // 🔹 Commit transaction
    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Survey purpose created successfully',
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
    const {
      params: { id },
      query: { finalForesight },
    } = req;

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

    if (purpose.type === 'Initial Level') {
      if (!finalForesight)
        throw createHttpError(400, 'Final fore sight is required');

      purpose.finalForesight = finalForesight;
    }

    // 🔹 Step 4: Mark purpose as finished
    purpose.status = 'Finished';
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

const pauseSurveyPurpose = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      params: { id },
      query: { foreSight },
    } = req;

    if (!foreSight?.trim()) {
      throw createHttpError(
        400,
        'foresight value is required to pause the survey.'
      );
    }

    // 1) Validate survey
    const survey = await SurveyPurpose.findById(id).session(session);
    if (!survey || survey.deleted) {
      throw createHttpError(404, 'Survey not found.');
    }

    if (survey.isPurposeFinish) {
      throw createHttpError(
        400,
        'This survey has already been finished. Cannot pause.'
      );
    }

    if (survey.status === 'Paused') {
      throw createHttpError(400, 'This survey is already paused.');
    }

    if (survey.type !== 'Initial Level') {
      throw createHttpError(
        400,
        'This operation is allowed only for Initial Level surveys.'
      );
    }

    // 2) Update survey status
    survey.status = 'Paused';
    await survey.save({ session });

    // 3) Create CP row
    await SurveyRow.create(
      [
        {
          purposeId: survey._id,
          type: 'CP',
          foreSight,
          remarks: ['CP'],
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Survey purpose has been paused successfully.',
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
      body: {
        purpose,
        proposal,
        quantity,
        averageHeight,
        length,
        lSection,
        lsSlop,
        cSection,
        csSlop,
        csCamper,
      },
    } = req;

    // 🔹 Basic validation
    if (!purpose || !id) {
      throw createHttpError(400, 'Purpose and surveyId are required.');
    }

    // Required fields used for proposal generation
    const requiredFields = [quantity, averageHeight, lSection, lsSlop, length];
    const missingRequired = requiredFields.some(
      (x) => x === undefined || x === null || x === ''
    );

    if (missingRequired) {
      throw createHttpError(
        400,
        'Missing required fields for proposal generation.'
      );
    }

    // Conditional validation for cross-section inputs
    const hasCsPair = cSection && csSlop && cSection !== '' && csSlop !== '';

    const hasCsCamper =
      csCamper !== undefined && csCamper !== null && csCamper !== '';

    if (!hasCsPair && !hasCsCamper) {
      throw createHttpError(
        400,
        'Please enter either both cross-section slope fields or a cross-section camber.'
      );
    }

    // 🔹 Fetch active survey
    const survey = await Survey.findOne({
      _id: id,
      isSurveyFinish: false,
      deleted: false,
    })
      .populate({
        path: 'purposes',
        match: { deleted: false },
        populate: [
          { path: 'rows', match: { deleted: false } },
          { path: 'relation', match: { deleted: false } },
        ],
      })
      .session(session);

    if (!survey) {
      throw createHttpError(404, 'Active survey not found.');
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
      (r) => r.type === 'Chainage'
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
          phase: 'Proposal',
          quantity,
          averageHeight,
          lSection,
          lsSlop,
          cSection,
          csSlop,
          csCamper,
          relation,
          status: 'Finished',
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
      const limit = Number(lastReading?.chainage?.split('/')?.[1]) || 0;

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
            purposeId: purposeDoc._id,
            type: 'Chainage',
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
};
