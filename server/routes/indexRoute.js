import express from "express";
import multer from "multer";

const router = express.Router();

import { isAuthenticated, requireAuth } from "../middleware/auth.js";
import { heavyLimiter, loginLimiter } from "../middleware/rateLimiter.js";

import {
  loginUser,
  googleLogin,
  registerUser,
  logoutUser,
  getDashboard,
  registerAccountType,
  contactForm,
  scheduleDemoForm,
} from "../controllers/indexController.js";
import { careerApplication } from "../controllers/careerController.js";

const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    };
    const extension = file.originalname.slice(file.originalname.lastIndexOf(".")).toLowerCase();
    if (!allowed[file.mimetype]?.includes(extension)) {
      return cb(Object.assign(new Error("Only PDF or DOCX CV files are allowed"), { status: 400 }));
    }
    cb(null, true);
  },
});

router.post("/login", loginLimiter, loginUser);

router.post("/google", loginLimiter, googleLogin);

router.post("/register", loginLimiter, registerUser);

router.post("/register-account-type", requireAuth, registerAccountType);

router.get("/logout", logoutUser);

router.post("/contact", contactForm);

router.post("/schedule-demo", scheduleDemoForm);
router.post("/careers/apply", heavyLimiter, resumeUpload.single("cv"), careerApplication);

router.use(requireAuth, isAuthenticated);

router.get("/", getDashboard);

export default router;
