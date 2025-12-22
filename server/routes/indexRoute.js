import express from "express";

const router = express.Router();

import { isAuthenticated, requireAuth } from "../middleware/auth.js";

import {
  loginUser,
  googleLogin,
  registerUser,
  logoutUser,
  getDashboard,
} from "../controllers/indexController.js";

router.post("/login", loginUser);

router.post("/google", googleLogin);

router.post("/register", registerUser);

router.get("/logout", logoutUser);

router.use(requireAuth, isAuthenticated);

router.get("/", getDashboard);

export default router;
