import express from 'express';

const router = express.Router();

import { isAuthenticated, requireAuth } from '../middleware/auth.js';

import {
  getDashboard,
  googleLogin,
  loginUser,
} from '../controllers/indexController.js';

router.post('/login', loginUser);

router.post('/google', googleLogin);

router.use(requireAuth, isAuthenticated);

router.get('/', getDashboard);

export default router;
