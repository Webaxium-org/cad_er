import { Router } from "express";
import * as userController from "../controllers/userController.js";
import {
  isAuthenticated,
  isAuthorized,
  requireAuth,
} from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, isAuthenticated);

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
