import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as userController from "../controllers/userController.js";
import {
  isAuthenticated,
  isAuthorized,
  requireAuth,
} from "../middleware/auth.js";

import { getMyGstProfile, saveMyGstProfile } from "../controllers/profileGstController.js";

const router = Router();

router.use(requireAuth, isAuthenticated);
router.get("/me/gst", getMyGstProfile);
router.put("/me/gst", rateLimit({ windowMs: 60000, limit: 5, keyGenerator: req => String(req.user.userId), message: { message: "Too many GST requests. Please wait a minute" } }), saveMyGstProfile);

router.patch(
  "/quiz",
  isAuthorized({
    types: ["Student"],
  }),
  userController.submitQuiz
);

router.use(isAuthorized({ roles: ["Super Admin"] }));

router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.post("/", userController.createUser);
router.put("/:id", userController.updateUser);
router.patch("/:id/status", userController.toggleUserStatus);
router.delete("/:id", userController.deleteUser);

export default router;
