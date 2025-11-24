import express from 'express';

const router = express.Router();

import {
  checkSurveyExists,
  getAllSurvey,
  createSurvey,
  getSurvey,
  updateSurvey,
  deleteSurvey,
  createSurveyRow,
  updateSurveyRow,
  deleteSurveyRow,
  endSurvey,
  getSurveyPurpose,
  endSurveyPurpose,
  getAllSurveyPurpose,
  createSurveyPurpose,
  pauseSurveyPurpose,
  generateSurveyPurpose,
} from '../controllers/surveyController.js';
import { isAuthenticated, requireAuth } from '../middleware/auth.js';

router.use(requireAuth, isAuthenticated);

// 🔹 Static routes
router.get('/exists', checkSurveyExists);
router.get('/purposes', getAllSurveyPurpose);

// 🔹 Survey routes
router.get('/', getAllSurvey);
router.post('/', createSurvey);
router.patch('/:id/end', endSurvey);
router.get('/:id', getSurvey);
router.patch('/:id', updateSurvey);
router.delete('/:id', deleteSurvey);

// 🔹 Purpose routes (nested under a survey)
router.get('/:id/purposes', getSurveyPurpose);
router.post('/:surveyId/purposes', createSurveyPurpose);
router.patch('/:id/purposes/end', endSurveyPurpose);
router.patch('/:id/purposes/pause', pauseSurveyPurpose);
router.post('/:id/purposes/generate', generateSurveyPurpose);

// 🔹 Row routes (nested under a survey)
router.post('/:id/rows', createSurveyRow);
router.patch('/:id/rows/:rowId', updateSurveyRow);
router.delete('/:id/rows/:rowId', deleteSurveyRow);

export default router;
